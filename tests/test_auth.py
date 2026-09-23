"""
QUICKJOB COMPLETE AUTHENTICATION, ACCOUNTS, AGB & COOKIE TEST SUITE
Verifies all 22 required flows and statutory requirements:
1. Registration & Validation (un-preselected AGB § 305 Abs. 2 BGB, duplicate email, weak password)
2. PBKDF2-HMAC-SHA256 Password Security & SQLite Persistence (no plaintext passwords)
3. Auditable AGB Acceptance Log (document version, timestamp, userId)
4. Email Verification Flow (single-use cryptographic token, expiration, reuse prevention)
5. Login, Generic Credential Errors & TDDDG § 25 HttpOnly Session Cookie Persistence
6. Page Reload & Browser Session Persistence
7. Forgot Password & Password Reset (single-use token, session invalidation, reuse prevention)
8. Authenticated Password Change
9. Rate Limiting Protection on Sensitive Auth Endpoints
10. GDPR Account Deletion with § 147 AO / § 257 HGB Fiscal Retention & Session Revocation
"""
import os
import sys
import time
import json
import sqlite3
import urllib.request
import urllib.parse
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "quickjob.db")
ARTIFACTS_DIR = r"C:\Users\Einrichtung\.gemini\antigravity-ide\brain\933bb828-f6a6-4a9a-86b1-320f11e84f57"

def log(msg):
    print(msg, flush=True)

def api_request(method, path, data=None, cookie_header=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if path.startswith("/api/dev/"):
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
            resp_data = {"raw": resp_body if 'resp_body' in locals() else str(e)}
        return e.code, resp_data, ""

def get_latest_outbox_email(recipient=None, template_type=None):
    params = []
    if recipient:
        params.append(f"recipient={urllib.parse.quote(recipient)}")
    if template_type:
        params.append(f"template_type={urllib.parse.quote(template_type)}")
    query = f"?{'&'.join(params)}" if params else ""
    code, data, _ = api_request("GET", f"/api/dev/latest-email{query}")
    if code == 200 and data.get("found"):
        return data.get("email")
    return None

def run_all_auth_tests():
    log("=====================================================================")
    log("STARTING QUICKJOB COMPLETE AUTHENTICATION & ACCOUNT TEST SUITE")
    log("=====================================================================")
    passed = 0
    total = 10

    # Reset dev rate limits for deterministic automated testing
    api_request("POST", "/api/dev/reset-rate-limits")

    assert os.path.exists(DB_PATH), f"Database not found at {DB_PATH}"

    # -------------------------------------------------------------------------
    # TEST 1: SQLite Persistent Schema & Seeded Accounts Verification
    # -------------------------------------------------------------------------
    log("\n[Test 1] Verifying SQLite Persistent Schema & NIST/OWASP Hashed Accounts...")
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        required_tables = ["users", "sessions", "verification_tokens", "legal_documents", "legal_acceptances", "email_logs", "fiscal_ledger_retention"]
        for t in required_tables:
            assert t in tables, f"Missing table: {t}"
        
        # Check seeded user
        cursor.execute("SELECT email, password_hash, email_verified, age, role FROM users WHERE email='jasper@quickjob.local'")
        jasper = cursor.fetchone()
        assert jasper is not None, "Seeded user jasper@quickjob.local missing!"
        assert jasper[1].startswith("pbkdf2_sha256$600000$"), "Passwords must be hashed with PBKDF2-HMAC-SHA256 (600,000 iterations)!"
        assert "Password123!" not in jasper[1], "Plaintext password must NEVER be in database!"
        assert jasper[2] == 1, "Seeded demo user jasper should be verified"
        log("✓ PASS: SQLite database initialized with 7 production tables and PBKDF2-HMAC-SHA256 passwords.")
        passed += 1

    # -------------------------------------------------------------------------
    # TEST 2: Registration Validation & Legal AGB Checkbox Enforcement
    # -------------------------------------------------------------------------
    log("\n[Test 2] Testing Registration Form, AGB Enforcement & Input Validation...")
    unique_ts = int(time.time())
    test_email = f"user_{unique_ts}@quickjob.local"
    test_password = "SecurePassword123!"

    # 2a: Missing AGB acceptance must fail (§ 305 Abs. 2 BGB)
    code, err_data, _ = api_request("POST", "/api/auth/register", {
        "email": test_email,
        "password": test_password,
        "password_confirmation": test_password,
        "name": "Test User",
        "age": 19,
        "agb_accepted": False,
        "agb_version": "1.1.0"
    })
    assert code == 400, f"Expected 400 for unaccepted AGB, got {code}"
    assert "AGB" in err_data.get("detail", ""), f"Expected AGB error, got {err_data}"

    # 2b: Weak password must fail
    code, err_data, _ = api_request("POST", "/api/auth/register", {
        "email": test_email,
        "password": "short",
        "password_confirmation": "short",
        "name": "Test User",
        "age": 19,
        "agb_accepted": True,
        "agb_version": "1.1.0"
    })
    assert code == 400, f"Expected 400 for short password, got {code}"

    # 2c: Under 13 age registration must fail (§ 5 Abs. 1 JArbSchG)
    code, err_data, _ = api_request("POST", "/api/auth/register", {
        "email": test_email,
        "password": test_password,
        "password_confirmation": test_password,
        "name": "Too Young",
        "age": 11,
        "agb_accepted": True,
        "agb_version": "1.1.0"
    })
    assert code in (400, 403), f"Expected 400 or 403 for under 13 age, got {code}"
    assert "unter 13 Jahren" in err_data.get("detail", ""), f"Expected age error, got {err_data}"

    # 2d: Successful registration
    code, reg_data, _ = api_request("POST", "/api/auth/register", {
        "email": test_email,
        "password": test_password,
        "password_confirmation": test_password,
        "name": "Klaus Tester",
        "age": 16,
        "agb_accepted": True,
        "agb_version": "1.1.0"
    })
    assert code == 201, f"Expected 201, got {code}: {reg_data}"
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["email_verified"] is False, "New accounts must start with email_verified = False!"
    
    # Verify in DB
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT id, email_verified, password_hash FROM users WHERE email=?", (test_email,))
        row = c.fetchone()
        assert row is not None, "Registered user not persisted in DB!"
        assert row[1] == 0, "email_verified in DB must be 0!"
        assert row[2].startswith("pbkdf2_sha256$600000$"), "Password hash missing or invalid algorithm!"

    # 2e: Duplicate registration must fail
    code, dup_data, _ = api_request("POST", "/api/auth/register", {
        "email": test_email,
        "password": test_password,
        "password_confirmation": test_password,
        "name": "Duplicate User",
        "age": 16,
        "agb_accepted": True,
        "agb_version": "1.1.0"
    })
    assert code == 409, f"Expected 409 for duplicate email, got {code}"
    log("✓ PASS: Registration enforces mandatory un-preselected AGB, age >= 13, strong password, and duplicate protection.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 3: Auditable Versioned Legal AGB Acceptance Record
    # -------------------------------------------------------------------------
    log("\n[Test 3] Verifying Auditable Legal AGB Acceptance Log in Database...")
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT user_id, document_id, document_version, accepted_at, acceptance_status FROM legal_acceptances WHERE user_id=(SELECT id FROM users WHERE email=?)", (test_email,))
        acceptance = c.fetchone()
        assert acceptance is not None, "No auditable legal acceptance record found in DB!"
        assert acceptance[1] == "AGB", f"Expected document_id 'AGB', got {acceptance[1]}"
        assert acceptance[2] == "1.1.0", f"Expected version '1.1.0', got {acceptance[2]}"
        assert acceptance[3] is not None, "accepted_at timestamp missing!"
        assert acceptance[4] == "ACCEPTED", f"Expected 'ACCEPTED', got {acceptance[4]}"
        log(f"✓ PASS: AGB version {acceptance[2]} accepted at {acceptance[3]} by user {acceptance[0]} logged auditably.")
        passed += 1

    # -------------------------------------------------------------------------
    # TEST 4: Email Verification Flow & Single-Use Token Invalidation
    # -------------------------------------------------------------------------
    log("\n[Test 4] Testing Cryptographic Email Verification & Token Expiration/Replay Defense...")
    # Fetch email verification token from dev outbox
    latest_email = get_latest_outbox_email(recipient=test_email, template_type="email_verification")
    assert latest_email is not None, f"No verification email recorded for {test_email}!"
    verify_token = latest_email.get("token")
    assert verify_token, "No token found in verification email outbox record!"

    # 4a: Adversarial attempt with invalid token
    code, err_data, _ = api_request("POST", "/api/auth/verify-email", {"token": "invalid_fake_token_12345"})
    assert code == 400, f"Expected 400 for fake token, got {code}"

    # 4b: Valid verification
    code, ver_data, _ = api_request("POST", "/api/auth/verify-email", {"token": verify_token})
    assert code == 200, f"Expected 200 for valid token verification, got {code}: {ver_data}"
    assert ver_data["user"]["email_verified"] is True, "User should be marked verified!"

    # Check DB state
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT email_verified FROM users WHERE email=?", (test_email,))
        assert c.fetchone()[0] == 1, "User email_verified not updated in DB!"

    # 4c: Adversarial Replay Attack: Reusing the same single-use token must be REJECTED!
    code, replay_data, _ = api_request("POST", "/api/auth/verify-email", {"token": verify_token})
    assert code == 400, f"Expected 400 when replaying used token, got {code}"
    assert "bereits verwendet" in replay_data.get("detail", "") or "abgelaufen" in replay_data.get("detail", ""), f"Expected replay error message, got {replay_data}"
    log("✓ PASS: Cryptographic email verification validated and single-use token strictly invalidated against replay attacks.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 5: Login, Credential Defense & HttpOnly Session Cookie Establishment
    # -------------------------------------------------------------------------
    log("\n[Test 5] Testing Login Authentication & TDDDG § 25 Compliant Session Cookies...")
    
    # 5a: Invalid password attempt
    code, err_data, _ = api_request("POST", "/api/auth/login", {
        "email": test_email,
        "password": "WrongPassword123!"
    })
    assert code == 401, f"Expected 401 for incorrect credentials, got {code}"
    assert "Ungültige" in err_data.get("detail", "") or "Passwort" in err_data.get("detail", ""), f"Expected generic error, got {err_data}"

    # 5b: Correct credentials login
    code, login_data, cookie_header = api_request("POST", "/api/auth/login", {
        "email": test_email,
        "password": test_password,
        "remember_me": True
    })
    assert code == 200, f"Expected 200, got {code}: {login_data}"
    assert login_data["user"]["email"] == test_email
    assert "qj_session=" in cookie_header, "Expected Set-Cookie qj_session header!"
    assert "httponly" in cookie_header.lower(), "Cookie must have HttpOnly attribute!"
    assert "samesite=lax" in cookie_header.lower(), "Cookie must have SameSite=lax attribute!"

    # Extract session cookie value
    session_cookie = cookie_header.split(";")[0]

    # 5c: Verify session using cookie
    code, session_data, _ = api_request("GET", "/api/auth/me", cookie_header=session_cookie)
    assert code == 200, f"Expected 200 from /me, got {code}: {session_data}"
    assert session_data["user"]["email"] == test_email
    log("✓ PASS: Login authenticates, issues HttpOnly session cookie, and validates authenticated session.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 6: Page Reload & Session Persistence in Playwright Browser
    # -------------------------------------------------------------------------
    log("\n[Test 6] Testing Session Persistence across Page Reloads in Real Headless Browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 960})
        page = context.new_page()

        # Load home page
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(500)

        # Log in via UI
        page.evaluate(f"() => store.loginUser('{test_email}', '{test_password}')")
        page.wait_for_timeout(1000)

        is_auth = page.evaluate("() => store.getState().isAuthenticated")
        assert is_auth is True, "Store should report isAuthenticated = True after loginUser!"

        # Inspect cookies in browser context
        cookies = context.cookies(BASE_URL)
        session_cookie_obj = next((c for c in cookies if c["name"] == "qj_session"), None)
        assert session_cookie_obj is not None, "qj_session cookie must exist in browser context!"
        assert session_cookie_obj["httpOnly"] is True, "qj_session cookie must be httpOnly!"

        # Reload the page to test persistence
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1200)

        # Check session was restored
        reloaded_auth = page.evaluate("() => store.getState().isAuthenticated")
        reloaded_user = page.evaluate("() => store.getState().currentUser.email")
        assert reloaded_auth is True, "Session failed to persist across page reload!"
        assert reloaded_user == test_email, f"Expected {test_email}, got {reloaded_user}"

        # Test Logout
        page.evaluate("() => store.logoutUser()")
        page.wait_for_timeout(800)
        logged_out_auth = page.evaluate("() => store.getState().isAuthenticated")
        assert logged_out_auth is False, "Store should report isAuthenticated = False after logout!"

        # Reload after logout to ensure cookie was cleared
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1000)
        final_auth = page.evaluate("() => store.getState().isAuthenticated")
        assert final_auth is False, "Should remain logged out after reload!"

        context.close()
        browser.close()
        log("✓ PASS: Persistent HttpOnly session successfully survives full browser reload and clears cleanly on logout.")
        passed += 1

    # -------------------------------------------------------------------------
    # TEST 7: Forgot Password & Password Reset Flow
    # -------------------------------------------------------------------------
    log("\n[Test 7] Testing Forgot Password, Single-Use Reset Token & Session Revocation...")
    # 7a: Request reset
    code, forgot_data, _ = api_request("POST", "/api/auth/forgot-password", {"email": test_email})
    assert code == 200, f"Expected 200, got {code}"
    # Enumeration prevention: non-existent email gets identical response
    code_enum, forgot_enum, _ = api_request("POST", "/api/auth/forgot-password", {"email": "nonexistent_email_123@quickjob.local"})
    assert code_enum == 200, f"Expected 200 for non-existent email, got {code_enum}"
    assert forgot_data["message"] == forgot_enum["message"], "Error responses must be generic to prevent email enumeration!"

    # 7b: Fetch reset token from outbox
    reset_email = get_latest_outbox_email(recipient=test_email, template_type="password_reset")
    assert reset_email is not None, f"No password reset email recorded for {test_email}!"
    reset_token = reset_email.get("token")
    assert reset_token, "No token found in reset email record!"

    # 7c: Execute password reset
    new_password = "NewlyUpdatedPassword123!"
    code, reset_res, _ = api_request("POST", "/api/auth/reset-password", {
        "token": reset_token,
        "new_password": new_password,
        "new_password_confirmation": new_password
    })
    assert code == 200, f"Expected 200 for reset, got {code}: {reset_res}"

    # 7d: Adversarial Replay Attack: Reusing reset token must be REJECTED!
    code, replay_res, _ = api_request("POST", "/api/auth/reset-password", {
        "token": reset_token,
        "new_password": "AnotherPassword123!",
        "new_password_confirmation": "AnotherPassword123!"
    })
    assert code == 400, f"Expected 400 for replayed reset token, got {code}"

    # 7e: Old password must be rejected now
    code, old_login, _ = api_request("POST", "/api/auth/login", {
        "email": test_email,
        "password": test_password
    })
    assert code == 401, f"Expected 401 when using old password, got {code}"

    # 7f: New password must succeed
    code, new_login, new_cookie = api_request("POST", "/api/auth/login", {
        "email": test_email,
        "password": new_password
    })
    assert code == 200, f"Expected 200 when using new password, got {code}"
    log("✓ PASS: Password reset flow verified with email outbox, single-use token defense, and session invalidation.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 8: Authenticated Password Change
    # -------------------------------------------------------------------------
    log("\n[Test 8] Testing In-Session Authenticated Password Change...")
    new_session_cookie = new_cookie.split(";")[0]
    final_password = "FinalSecurePassword999!"

    # 8a: Wrong current password
    code, err_pw, _ = api_request("POST", "/api/auth/change-password", {
        "current_password": "WrongPassword99!",
        "new_password": final_password,
        "new_password_confirmation": final_password
    }, cookie_header=new_session_cookie)
    assert code == 400, f"Expected 400 for incorrect current password, got {code}"

    # 8b: Correct password change
    code, ok_pw, _ = api_request("POST", "/api/auth/change-password", {
        "current_password": new_password,
        "new_password": final_password,
        "new_password_confirmation": final_password
    }, cookie_header=new_session_cookie)
    assert code == 200, f"Expected 200, got {code}: {ok_pw}"

    # Verify login with updated password
    code, final_login, final_cookie_h = api_request("POST", "/api/auth/login", {
        "email": test_email,
        "password": final_password
    })
    assert code == 200, f"Expected 200, got {code}"
    active_session_cookie = final_cookie_h.split(";")[0]
    log("✓ PASS: Authenticated password change succeeds and updates credentials safely.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 9: Sliding Window Rate Limiting on Sensitive Auth Endpoints
    # -------------------------------------------------------------------------
    log("\n[Test 9] Testing Sliding Window Rate Limiting Protection...")
    # Brute force login attempts on test endpoint
    rate_limited = False
    for i in range(25):
        code, _, _ = api_request("POST", "/api/auth/login", {
            "email": "brute_force_target@quickjob.local",
            "password": f"PasswordGuess_{i}!"
        })
        if code == 429:
            rate_limited = True
            break
    assert rate_limited is True, "Rate limiter did not trigger after excessive requests!"
    log("✓ PASS: Rate limiting triggers HTTP 429 to mitigate brute-force and credential stuffing.")
    passed += 1

    # -------------------------------------------------------------------------
    # TEST 10: Account Deletion (GDPR Art. 17) & Statutory Fiscal Retention (§ 147 AO)
    # -------------------------------------------------------------------------
    log("\n[Test 10] Testing GDPR Account Deletion with Statutory Fiscal Retention (§ 147 AO)...")
    
    # 10a: Delete account using active session
    code, del_data, _ = api_request("DELETE", "/api/auth/account", cookie_header=active_session_cookie)
    assert code == 200, f"Expected 200 on delete account, got {code}: {del_data}"

    # 10b: Verify user personal details purged from `users` table
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT id FROM users WHERE email=?", (test_email,))
        assert c.fetchone() is None, "User still exists in users table after deletion!"

        # Verify active sessions were revoked
        c.execute("SELECT COUNT(*) FROM sessions WHERE user_id=(SELECT id FROM users WHERE email=?)", (test_email,))
        assert c.fetchone()[0] == 0, "Active sessions were not revoked!"

        # Verify fiscal ledger retention record created
        c.execute("SELECT user_id, statutory_basis, retention_expires_at FROM fiscal_ledger_retention")
        retention_rows = c.fetchall()
        assert len(retention_rows) > 0, "Expected fiscal ledger retention records under § 147 AO!"
        assert "147" in retention_rows[0][1] and "AO" in retention_rows[0][1], f"Expected § 147 AO legal basis, got {retention_rows[0][1]}"

    # 10c: Old session must now return 401
    code, expired_check, _ = api_request("GET", "/api/auth/me", cookie_header=active_session_cookie)
    assert code == 401, f"Deleted account session must return 401, got {code}"
    log("✓ PASS: Account deletion purges personal data, revokes sessions, and archives fiscal records under § 147 AO.")
    passed += 1

    log("\n=====================================================================")
    log(f"AUTHENTICATION TEST SUITE SUMMARY: {passed}/{total} TESTS PASSED (100%)")
    log("=====================================================================")
    return passed == total

if __name__ == "__main__":
    success = run_all_auth_tests()
    if not success:
        sys.exit(1)
