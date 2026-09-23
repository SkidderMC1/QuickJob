"""
QuickJob Rate Limiting Engine
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
    'general': {'max_requests': 200, 'window_seconds': 60}
}


class InMemoryRateLimiter:
    def __init__(self):
        self._history = defaultdict(list)
        self._lock = Lock()

    def _cleanup(self, key: str, window_seconds: int, current_time: float):
        self._history[key] = [t for t in self._history[key] if current_time - t < window_seconds]
        if not self._history[key]:
            del self._history[key]

    def check(self, action: str, identifier: str) -> tuple[bool, int]:
        """
        Check if request is within limits.
        Returns (is_allowed, retry_after_seconds).
        """
        rule = RATE_LIMIT_RULES.get(action, RATE_LIMIT_RULES['general'])
        max_requests = rule['max_requests']
        window = rule['window_seconds']
        key = f"{action}:{identifier}"
        now = time.time()

        with self._lock:
            self._cleanup(key, window, now)
            timestamps = self._history.get(key, [])
            if len(timestamps) >= max_requests:
                oldest = timestamps[0]
                retry_after = int(window - (now - oldest)) + 1
                return False, max(1, retry_after)
            return True, 0

    def record(self, action: str, identifier: str):
        """Record an attempt."""
        rule = RATE_LIMIT_RULES.get(action, RATE_LIMIT_RULES['general'])
        window = rule['window_seconds']
        key = f"{action}:{identifier}"
        now = time.time()

        with self._lock:
            self._cleanup(key, window, now)
            self._history[key].append(now)

    def reset(self, action: str, identifier: str):
        """Clear rate limit history for identifier (e.g. after successful login)."""
        key = f"{action}:{identifier}"
        with self._lock:
            if key in self._history:
                del self._history[key]

    def clear_all(self):
        """Clear all rate limiting history across all endpoints."""
        with self._lock:
            self._history.clear()


rate_limiter = InMemoryRateLimiter()
