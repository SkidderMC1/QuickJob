"""
QuickJob Penetration Testing & Vulnerability Verification Suite
Automates adversarial exploits across the complete attack surface:
1. Sensitive File & Database Exposure (Static Mount Misconfiguration)
2. Path Traversal & Directory Climbing
3. Unauthenticated Dev Token Harvesting & Account Takeover (ATO) Chain
4. Authorized Dev Access Verification (with X-Dev-Key)
5. Permissive Cross-Origin Resource Sharing (CORS) Origin Reflection
6. Missing Defensive HTTP Security Headers
7. Long-Input Password Denial-of-Service (PBKDF2 CPU Exhaustion)
8. Boundary & Parameter Fuzzing (Age Gate, Role Spoofing, Name Length)
9. SQL Injection Resistance Across Auth Inputs
10. Session Token Tampering & Horizontal Privilege Escalation
11. Account Enumeration Resistance (Generic Auth Error Messaging)
12. Brute-Force Abuse & Rate Limiting Enforcement
"""
import os
import sys
import json
import time
import urllib.request
import urllib.parse
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"
DEV_KEY = "quickjob-dev-test-secret"


def log(msg):
    print(msg, flush=True)


def raw_http_request(method, path, headers=None, body_bytes=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"User-Agent": "QuickJob-Security-Audit/1.0"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            resp_headers = dict(resp.headers)
            content = resp.read()
            return status, resp_headers, content
    except urllib.error.HTTPError as e:
        resp_headers = dict(e.headers)
        content = e.read()
        return e.code, resp_headers, content
    except Exception as e:
        return 0, {}, str(e).encode('utf-8')


def test_exploit_sensitive_file_exposure():
    log("\n[ATTACK 1] Testing Sensitive File & Database Exposure via Static Mount...")
    targets = [
        "/data/quickjob.db",
        "/.git/config",
        "/server.py",
        "/backend/database.py",
        "/tests/test_auth.py",
        "/data/outbox/"
    ]
    exposed = []
    for path in targets:
        status, headers, content = raw_http_request("GET", path)
        if status == 200:
            exposed.append((path, len(content)))
            log(f"  [CRITICAL EXPLOIT] GET {path} returned HTTP 200 ({len(content)} bytes)!")
        else:
            log(f"  [DEFENDED] GET {path} returned HTTP {status}")

    return len(exposed) == 0, exposed


def test_exploit_path_traversal():
    log("\n[ATTACK 2] Testing Path Traversal & Directory Climbing...")
    traversal_paths = [
        "/css/../data/quickjob.db",
        "/js/../../data/quickjob.db",
        "/icons/..%2f..%2fdata%2fquickjob.db",
        "/..%2f..%2fserver.py",
        "/css/..%2fserver.py"
    ]
    exploited = []
    for p in traversal_paths:
        status, headers, content = raw_http_request("GET", p)
        if status == 200 and (b"SQLite" in content or b"QuickJob" in content):
            exploited.append(p)
            log(f"  [EXPLOIT] Path traversal succeeded on {p}!")
        else:
            log(f"  [DEFENDED] Traversal {p} rejected with HTTP {status}")
    return len(exploited) == 0, exploited


def test_exploit_unauthenticated_dev_endpoints():
    log("\n[ATTACK 3] Testing Unauthenticated Dev Endpoint Token Harvesting...")
    status, headers, content = raw_http_request("GET", "/api/dev/latest-email")
    if status == 200:
        log("  [HIGH EXPLOIT] Unauthenticated GET /api/dev/latest-email returned HTTP 200!")
        return False, "Exposed unauthenticated dev outbox tokens"
    elif status == 403 or status == 404:
        log(f"  [DEFENDED] Unauthenticated GET /api/dev/latest-email blocked with HTTP {status}")
        return True, "Protected"
    else:
        log(f"  Unexpected status: {status}")
        return False, f"Unexpected HTTP {status}"


def test_authorized_dev_endpoint():
    log("\n[TEST 4] Testing Authorized Dev Endpoint with X-Dev-Key...")
    status, headers, content = raw_http_request(
        "GET",
        "/api/dev/latest-email",
        headers={"X-Dev-Key": DEV_KEY}
    )
    if status == 200:
        log(f"  [PASS] Authorized test access granted with HTTP 200: {content[:60]}")
        return True, "Working as intended for automated test runner"
    else:
        log(f"  [FAIL] Authorized access returned HTTP {status}: {content}")
        return False, f"HTTP {status}"


def test_exploit_cors_reflection():
    log("\n[ATTACK 5] Testing CORS Wildcard Origin Reflection with Credentials...")
    evil_origin = "http://evil-attacker.com"
    status, headers, content = raw_http_request(
        "GET",
        "/api/legal/documents",
        headers={"Origin": evil_origin}
    )
    cors_origin = headers.get("Access-Control-Allow-Origin") or headers.get("access-control-allow-origin")
    cors_creds = headers.get("Access-Control-Allow-Credentials") or headers.get("access-control-allow-credentials")

    if cors_origin == evil_origin and cors_creds == "true":
        log(f"  [HIGH EXPLOIT] CORS reflects attacker origin '{cors_origin}' with credentials: {cors_creds}!")
        return False, "CORS origin reflection allows cross-origin account hijacking"
    else:
        log(f"  [DEFENDED] Untrusted origin '{evil_origin}' rejected: Access-Control-Allow-Origin = {cors_origin}")
        return True, "Protected"


def test_exploit_security_headers():
    log("\n[ATTACK 6] Auditing Defensive HTTP Security Headers...")
    status, headers, content = raw_http_request("GET", "/")
    missing = []
    required = [
        "x-content-type-options",
        "x-frame-options",
        "referrer-policy",
        "content-security-policy"
    ]
    norm_headers = {k.lower(): v for k, v in headers.items()}
    for h in required:
        if h not in norm_headers:
            missing.append(h)
            log(f"  [VULNERABLE] Missing security header: {h}")
        else:
            log(f"  [DEFENDED] Present: {h} = {norm_headers[h][:40]}...")

    return len(missing) == 0, missing


def test_exploit_password_dos():
    log("\n[ATTACK 7] Testing Password Length Limit / Algorithmic Complexity DoS...")
    giant_password = "A1!" + "x" * 100000
    payload = json.dumps({
        "email": f"dos_test_{int(time.time())}@quickjob.local",
        "password": giant_password,
        "password_confirmation": giant_password,
        "name": "DoS Tester",
        "age": 20,
        "agb_accepted": True
    }).encode('utf-8')

    status, headers, content = raw_http_request(
        "POST",
        "/api/auth/register",
        headers={"Content-Type": "application/json"},
        body_bytes=payload
    )

    if status == 400 and b"maximal 128" in content:
        log("  [DEFENDED] Registration rejected oversized password with HTTP 400 before PBKDF2 hashing.")
        return True, "Protected"
    elif status == 201 or status == 409 or status == 429:
        log(f"  [VULNERABLE] Server attempted processing 100KB password! Status: {status}")
        return False, "Processed oversized password"
    else:
        log(f"  Status: {status}, Response: {content[:100]}")
        return False, f"Unexpected response: {status}"


def test_exploit_parameter_fuzzing():
    log("\n[ATTACK 8] Testing Boundary & Parameter Validation Fuzzing...")
    fuzz_cases = [
        ("Child under 13 registration", {"email": "child@quickjob.local", "password": "Password123!", "password_confirmation": "Password123!", "name": "Child", "age": 12, "agb_accepted": True}, 403),
        ("Age > 120 registration", {"email": "old@quickjob.local", "password": "Password123!", "password_confirmation": "Password123!", "name": "Ancient", "age": 125, "agb_accepted": True}, 400),
        ("Invalid role injection", {"email": "admin@quickjob.local", "password": "Password123!", "password_confirmation": "Password123!", "name": "Hacker", "age": 25, "agb_accepted": True, "role": "superadmin"}, 400),
        ("Missing AGB acceptance", {"email": "noagb@quickjob.local", "password": "Password123!", "password_confirmation": "Password123!", "name": "No AGB", "age": 25, "agb_accepted": False}, 400),
        ("Giant name string (>100 chars)", {"email": "longname@quickjob.local", "password": "Password123!", "password_confirmation": "Password123!", "name": "A" * 300, "age": 25, "agb_accepted": True}, 400)
    ]

    all_defended = True
    for name, data, expected_status in fuzz_cases:
        status, headers, content = raw_http_request(
            "POST",
            "/api/auth/register",
            headers={"Content-Type": "application/json"},
            body_bytes=json.dumps(data).encode('utf-8')
        )
        if status == expected_status:
            log(f"  [DEFENDED] {name}: correctly rejected with HTTP {status}")
        else:
            log(f"  [FAIL] {name}: returned HTTP {status} (expected {expected_status}): {content[:80]}")
            all_defended = False

    return all_defended, "Parameter boundary checks enforced"


def test_exploit_sql_injection():
    log("\n[ATTACK 9] Testing SQL Injection Payloads Across Auth Endpoints...")
    sqli_payloads = [
        "' OR '1'='1",
        "admin'--",
        "'; DROP TABLE users;--",
        "' UNION SELECT id, email, password_hash FROM users--"
    ]
    all_defended = True
    for p in sqli_payloads:
        # Test Login
        status, headers, content = raw_http_request(
            "POST",
            "/api/auth/login",
            headers={"Content-Type": "application/json"},
            body_bytes=json.dumps({"email": p, "password": "Password123!"}).encode('utf-8')
        )
        if status in (400, 401, 429):
            log(f"  [DEFENDED] SQLi login test '{p[:25]}' safely rejected with HTTP {status}")
        else:
            log(f"  [EXPLOIT] SQLi payload triggered unexpected status {status}: {content}")
            all_defended = False

    return all_defended, "SQL queries safely parameterized"


def test_exploit_session_tampering():
    log("\n[ATTACK 10] Testing Session Token Tampering & Privilege Escalation...")
    tampered_tokens = [
        "forged_session_token_12345",
        "sess_0000000000000000",
        "../../etc/passwd",
        "' OR '1'='1"
    ]
    all_defended = True
    for t in tampered_tokens:
        status, headers, content = raw_http_request(
            "GET",
            "/api/auth/me",
            headers={"Cookie": f"qj_session={t}"}
        )
        if status == 401:
            log(f"  [DEFENDED] Tampered cookie '{t[:20]}' rejected with HTTP 401 Unauthorized")
        else:
            log(f"  [EXPLOIT] Tampered cookie accepted with HTTP {status}!")
            all_defended = False

    return all_defended, "Session tokens cryptographically validated"


def test_exploit_account_enumeration():
    log("\n[ATTACK 11] Testing Account Enumeration Resistance...")
    # 1. Non-existent user login
    status1, _, content1 = raw_http_request(
        "POST",
        "/api/auth/login",
        headers={"Content-Type": "application/json"},
        body_bytes=json.dumps({"email": "nonexistent_9999@quickjob.local", "password": "WrongPassword123!"}).encode('utf-8')
    )

    # 2. Existing user with wrong password
    status2, _, content2 = raw_http_request(
        "POST",
        "/api/auth/login",
        headers={"Content-Type": "application/json"},
        body_bytes=json.dumps({"email": "jasper@quickjob.local", "password": "WrongPassword123!"}).encode('utf-8')
    )

    if status1 == status2 and json.loads(content1).get("detail") == json.loads(content2).get("detail"):
        log(f"  [DEFENDED] Login returns uniform error message preventing user enumeration: {json.loads(content1).get('detail')}")
        return True, "Uniform error message prevents enumeration"
    else:
        log(f"  [VULNERABLE] Inconsistent error messages leak account existence!")
        return False, "Timing/Message discrepancy"


def test_exploit_rate_limiting():
    log("\n[ATTACK 12] Testing Rate Limiting & Brute-Force Abuse Resistance...")
    # Reset first via authorized endpoint
    raw_http_request("POST", "/api/dev/reset-rate-limits", headers={"X-Dev-Key": DEV_KEY})

    triggered = False
    for i in range(25):
        status, headers, content = raw_http_request(
            "POST",
            "/api/auth/login",
            headers={"Content-Type": "application/json"},
            body_bytes=json.dumps({"email": "bruteforce_target@quickjob.local", "password": f"Try{i}!"}).encode('utf-8')
        )
        if status == 429:
            log(f"  [DEFENDED] Rate limiter engaged on request #{i+1} with HTTP 429 Too Many Requests!")
            triggered = True
            break

    # Clean up rate limits after test
    raw_http_request("POST", "/api/dev/reset-rate-limits", headers={"X-Dev-Key": DEV_KEY})
    return triggered, "Rate limiter prevents brute-force credential stuffing"


def run_full_security_penetration_test():
    log("=====================================================================")
    log("QUICKJOB AUTONOMOUS PENETRATION TEST & EXPLOIT EXECUTION")
    log("=====================================================================")

    results = {}
    r1, d1 = test_exploit_sensitive_file_exposure()
    results["1. Sensitive File Exposure"] = (r1, d1)

    r2, d2 = test_exploit_path_traversal()
    results["2. Path Traversal Protection"] = (r2, d2)

    r3, d3 = test_exploit_unauthenticated_dev_endpoints()
    results["3. Unauth Dev Endpoints"] = (r3, d3)

    r4, d4 = test_authorized_dev_endpoint()
    results["4. Authorized Dev Access"] = (r4, d4)

    r5, d5 = test_exploit_cors_reflection()
    results["5. CORS Origin Whitelist"] = (r5, d5)

    r6, d6 = test_exploit_security_headers()
    results["6. Defensive HTTP Headers"] = (r6, d6)

    r7, d7 = test_exploit_password_dos()
    results["7. Password Algorithmic DoS Limit"] = (r7, d7)

    r8, d8 = test_exploit_parameter_fuzzing()
    results["8. Parameter Boundary Fuzzing"] = (r8, d8)

    r9, d9 = test_exploit_sql_injection()
    results["9. SQL Injection Resistance"] = (r9, d9)

    r10, d10 = test_exploit_session_tampering()
    results["10. Session Token Tampering"] = (r10, d10)

    r11, d11 = test_exploit_account_enumeration()
    results["11. Account Enumeration Shield"] = (r11, d11)

    r12, d12 = test_exploit_rate_limiting()
    results["12. Rate Limiting Abuse Defense"] = (r12, d12)

    log("\n=====================================================================")
    log("COMPLETE PENETRATION TEST RESULTS SUMMARY:")
    log("=====================================================================")
    all_passed = True
    for k, v in results.items():
        state = "SECURE / DEFENDED" if v[0] else "EXPLOIT CONFIRMED"
        if not v[0]:
            all_passed = False
        log(f"  {k:38}: {state}")

    log(f"\nFinal Pentest Status: {'ALL 12 ATTACK VECTORS DEFENDED' if all_passed else 'SECURITY ISSUES REMAIN'}")
    return results


if __name__ == "__main__":
    run_full_security_penetration_test()
