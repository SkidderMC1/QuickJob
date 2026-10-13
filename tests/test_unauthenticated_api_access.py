"""
UNAUTHENTICATED API ACCESS TEST SUITE (GAP-001 CRITICAL)
Verifies that ALL protected API endpoints return 401 Unauthorized when accessed without valid session.
Tests the actual API endpoints that exist in the backend.
"""
import sys
import json
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def log(msg):
    print(msg, flush=True)

def api_request(method, path, data=None, cookie_header=None, dev_key=True):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if dev_key and path.startswith("/api/dev/"):
        headers["X-Dev-Key"] = "quickjob-dev-test-secret"
    if cookie_header:
        headers["Cookie"] = cookie_header
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            resp_data = json.loads(resp_body) if resp_body else {}
            set_cookie = resp.headers.get("Set-Cookie", "")
            return resp.status, resp_data, set_cookie
    except urllib.error.HTTPError as e:
        try:
            resp_body = e.read().decode("utf-8")
            resp_data = json.loads(resp_body) if resp_body else {}
        except Exception:
            resp_data = {"raw": str(e)}
        return e.code, resp_data, ""

def reset_rate_limits():
    api_request("POST", "/api/dev/reset-rate-limits")

def run_unauthenticated_api_tests():
    log("=====================================================================")
    log("STARTING UNAUTHENTICATED API ACCESS TEST SUITE (GAP-001)")
    log("=====================================================================")
    passed = 0
    total = 0

    reset_rate_limits()

    # Protected endpoints that MUST return 401 when unauthenticated
    protected_endpoints = [
        ("GET", "/api/auth/me", "Current user profile"),
        ("GET", "/api/auth/session", "Session check"),
        ("POST", "/api/auth/change-password", "Change password"),
        ("DELETE", "/api/auth/account", "Delete account"),
        ("GET", "/api/legal/acceptances", "Legal acceptances history"),
        ("GET", "/api/admin/stats", "Admin KPI stats (should be 401/403)"),
        ("GET", "/api/admin/reports", "Admin reports list (should be 401/403)"),
        ("POST", "/api/admin/reports/rep_101/action", "Admin moderation action (should be 401/403)"),
    ]

    # Public endpoints that should work WITHOUT authentication
    public_endpoints = [
        ("GET", "/api/legal/documents", "Legal documents list"),
        ("POST", "/api/auth/register", "Registration"),
        ("POST", "/api/auth/login", "Login"),
        ("POST", "/api/auth/forgot-password", "Forgot password"),
        ("POST", "/api/auth/reset-password", "Reset password"),
        ("POST", "/api/auth/verify-email", "Verify email"),
        ("POST", "/api/auth/resend-verification", "Resend verification"),
        ("GET", "/api/dev/latest-email", "Dev outbox (with dev key)"),
    ]

    log("\n--- TESTING PROTECTED ENDPOINTS (Must return 401) ---")
    for method, path, description in protected_endpoints:
        total += 1
        test_data = {} if method in ("POST", "DELETE") else None
        if path.startswith("/api/admin/reports/") and method == "POST":
            test_data = {"action": "DISMISS"}
        code, data, _ = api_request(method, path, data=test_data)
        if code == 401:
            log(f"  ✓ PASS: {method} {path} ({description}) -> 401 Unauthorized")
            passed += 1
        elif path.startswith("/api/admin/") and code in (401, 403):
            log(f"  ✓ PASS: {method} {path} ({description}) -> HTTP {code} (admin protected)")
            passed += 1
        elif path.startswith("/api/admin/") and code == 200:
            log(f"  ✗ FAIL: {method} {path} ({description}) -> HTTP {code} (admin endpoint accessible without auth!)")
        else:
            log(f"  ✗ FAIL: {method} {path} ({description}) -> HTTP {code} (expected 401), response: {data}")

    log("\n--- TESTING PUBLIC ENDPOINTS (Must NOT return 401) ---")
    for method, path, description in public_endpoints:
        total += 1
        test_data = {}
        if method == "POST":
            if "register" in path:
                test_data = {"email": "test@test.com", "password": "Password123!", "password_confirmation": "Password123!", "name": "Test", "age": 20, "agb_accepted": True, "agb_version": "1.1.0"}
            elif "login" in path:
                test_data = {"email": "test@test.com", "password": "Password123!"}
            elif "forgot-password" in path:
                test_data = {"email": "test@test.com"}
            elif "reset-password" in path:
                test_data = {"token": "fake", "new_password": "Password123!", "new_password_confirmation": "Password123!"}
            elif "verify-email" in path:
                test_data = {"token": "fake"}
            elif "resend-verification" in path:
                test_data = {"email": "test@test.com"}
        code, data, _ = api_request(method, path, data=test_data if method == "POST" else None)
        if code != 401:
            log(f"  ✓ PASS: {method} {path} ({description}) -> HTTP {code} (accessible)")
            passed += 1
        else:
            log(f"  ✗ FAIL: {method} {path} ({description}) -> 401 Unauthorized (should be public)")

    # Test with invalid/expired session cookie
    log("\n--- TESTING INVALID/EXPIRED SESSION COOKIE ---")
    total += 1
    code, data, _ = api_request("GET", "/api/auth/me", cookie_header="qj_session=invalid_expired_token_12345")
    if code == 401:
        log(f"  ✓ PASS: Invalid session cookie rejected with 401")
        passed += 1
    else:
        log(f"  ✗ FAIL: Invalid session cookie -> HTTP {code} (expected 401)")

    total += 1
    code, data, _ = api_request("GET", "/api/auth/me", cookie_header="qj_session=malformed'\"<script>")
    if code == 401:
        log(f"  ✓ PASS: Malformed session cookie rejected with 401")
        passed += 1
    else:
        log(f"  ✗ FAIL: Malformed session cookie -> HTTP {code} (expected 401)")

    # Logout is deliberately idempotent (RFC-style): an unauthenticated call must
    # not error, must NOT mint a session, and must leave protected endpoints at 401.
    log("\n--- TESTING LOGOUT IDEMPOTENCY (no session granted) ---")
    total += 1
    code, data, set_cookie = api_request("POST", "/api/auth/logout", data={})
    me_code, _, _ = api_request("GET", "/api/auth/me")
    # A clearing cookie (empty value + Max-Age=0) is fine; a *valid* session is not.
    cookie_cleared = (
        not set_cookie
        or 'qj_session=""' in set_cookie
        or "max-age=0" in set_cookie.lower()
    )
    if code in (200, 204) and cookie_cleared and me_code == 401:
        log("  ✓ PASS: Unauthenticated logout is idempotent, grants no session, no access")
        passed += 1
    else:
        log(f"  ✗ FAIL: Logout insecure (code={code}, set_cookie={set_cookie!r}, me={me_code})")

    # Test dev endpoint without dev key (must be explicitly suppressed)
    total += 1
    code, data, _ = api_request("GET", "/api/dev/latest-email", dev_key=False)
    if code == 403:
        log(f"  ✓ PASS: Dev endpoint blocked without X-Dev-Key (HTTP 403)")
        passed += 1
    else:
        log(f"  ✗ FAIL: Dev endpoint -> HTTP {code} (expected 403)")

    # Test dev endpoint with dev key
    total += 1
    code, data, _ = api_request("GET", "/api/dev/latest-email")
    if code == 200:
        log(f"  ✓ PASS: Dev endpoint accessible with X-Dev-Key")
        passed += 1
    else:
        log(f"  ✗ FAIL: Dev endpoint with key -> HTTP {code}")

    log(f"\n=====================================================================")
    log(f"UNAUTHENTICATED API ACCESS RESULTS: {passed}/{total} TESTS PASSED")
    log(f"=====================================================================")
    return passed == total

if __name__ == "__main__":
    success = run_unauthenticated_api_tests()
    sys.exit(0 if success else 1)