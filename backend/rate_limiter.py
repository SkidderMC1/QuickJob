"""
EasyJob Rate Limiting Engine
Protects sensitive authentication endpoints against brute-force attacks,
credential stuffing, and token generation flooding.
"""
import time
from collections import defaultdict
from threading import Lock

RATE_LIMIT_RULES = {
    'login': {'max_requests': 20, 'window_seconds': 60},
    'register': {'max_requests': 20, 'window_seconds': 60},
    'forgot_password': {'max_requests': 15, 'window_seconds': 60},
    'resend_verification': {'max_requests': 15, 'window_seconds': 60},
    'verify_email': {'max_requests': 20, 'window_seconds': 60},
    'reset_password': {'max_requests': 15, 'window_seconds': 60},
    'change_password': {'max_requests': 10, 'window_seconds': 60},
    'general': {'max_requests': 200, 'window_seconds': 60}
}

# Coarse per-IP ceiling applied across all sensitive actions. Blunts distributed
# credential stuffing that rotates the per-action identifier (e.g. target email).
PER_IP_RULE = {'max_requests': 120, 'window_seconds': 60}


class InMemoryRateLimiter:
    def __init__(self):
        self._history = defaultdict(list)
        self._lock = Lock()
        # Amortized global sweep to bound memory: lazily evicting only the keys we
        # touch would let one-shot keys (rotating identifiers/IPs) grow forever.
        self._sweep_counter = 0
        self._sweep_interval = 512

    def _cleanup(self, key: str, window_seconds: int, current_time: float):
        timestamps = self._history.get(key)
        if not timestamps:
            return
        self._history[key] = [t for t in timestamps if current_time - t < window_seconds]
        if not self._history[key]:
            del self._history[key]

    def _retry_after(self, key: str, window_seconds: int, current_time: float) -> int:
        oldest = self._history[key][0]
        return max(1, int(window_seconds - (current_time - oldest)) + 1)

    def _sweep(self, current_time: float):
        """Drop every key whose newest timestamp is older than the widest window.

        Must be called while holding ``self._lock``.
        """
        max_window = max(
            [rule['window_seconds'] for rule in RATE_LIMIT_RULES.values()] + [PER_IP_RULE['window_seconds']]
        )
        stale = [
            key for key, timestamps in self._history.items()
            if not timestamps or current_time - timestamps[-1] >= max_window
        ]
        for key in stale:
            del self._history[key]

    def _maybe_sweep(self, current_time: float):
        """Run the global sweep only every N operations to keep amortized cost O(1)."""
        self._sweep_counter += 1
        if self._sweep_counter < self._sweep_interval:
            return
        self._sweep_counter = 0
        self._sweep(current_time)

    def hit(self, action: str, identifier: str, ip: str = None) -> tuple[bool, int]:
        """
        Atomically check AND record an attempt under a single lock acquisition,
        so concurrent requests cannot slip past the limit between check and record.

        When `ip` is supplied a coarser per-IP bucket is enforced as well.
        Returns (is_allowed, retry_after_seconds).
        """
        rule = RATE_LIMIT_RULES.get(action, RATE_LIMIT_RULES['general'])
        key = f"{action}:{identifier}"
        ip_key = f"per_ip:{ip}" if ip else None
        now = time.time()

        with self._lock:
            self._cleanup(key, rule['window_seconds'], now)
            if ip_key:
                self._cleanup(ip_key, PER_IP_RULE['window_seconds'], now)
            self._maybe_sweep(now)

            if len(self._history.get(key, [])) >= rule['max_requests']:
                return False, self._retry_after(key, rule['window_seconds'], now)
            if ip_key and len(self._history.get(ip_key, [])) >= PER_IP_RULE['max_requests']:
                return False, self._retry_after(ip_key, PER_IP_RULE['window_seconds'], now)

            self._history[key].append(now)
            if ip_key:
                self._history[ip_key].append(now)
            return True, 0

    def reset(self, action: str, identifier: str, ip: str = None):
        """Clear rate limit history for identifier (e.g. after successful login).

        When `ip` is supplied the coarse per-IP bucket for that address is cleared
        too, so a successful login behind a shared NAT no longer locks everyone out.
        """
        key = f"{action}:{identifier}"
        ip_key = f"per_ip:{ip}" if ip else None
        with self._lock:
            if key in self._history:
                del self._history[key]
            if ip_key and ip_key in self._history:
                del self._history[ip_key]

    def clear_all(self):
        """Clear all rate limiting history across all endpoints."""
        with self._lock:
            self._history.clear()


rate_limiter = InMemoryRateLimiter()
