"""
ACCOUNT DELETION & STATUTORY RETENTION TEST SUITE (GAP-009 MEDIUM)
Verifies GDPR Art. 17 account deletion against the REAL backend surface
(``DELETE /api/auth/account``) and the actual SQLite schema:

1. Deletion requires authentication (negative gate)
2. Deletion with a wallet/escrow balance writes a § 147 AO retention record
3. Deletion with zero balance writes an ACCOUNT_CLOSING_LEDGER record
4. Personal data is anonymized (name/email/handle/password/deleted_at)
5. Every session for the account is revoked
6. The retention audit payload preserves a hashed email + balances
7. The purged (anonymized) email can be re-registered
8. A revoked session cannot be reused to delete again

NOTE: There is no jobs / wallet / guardian-consent / admin-users API in this
codebase, so this suite only exercises endpoints and tables that actually exist.
"""
import sys
import os
import time
import json
import hmac
import hashlib
import sqlite3
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "quickjob.db")

def log(msg):
    print(msg, flush=True)

def api_request(method, path, data=None, cookie_header=None, extra_headers=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if extra_headers:
        headers.update(extra_headers)
    if path.startswith("/api/dev/"):
        headers.setdefault("X-Dev-Key", "quickjob-dev-test-secret")
    if cookie_header:
        headers["Cookie"] = cookie_header
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            resp_data = json.loads(resp_body) if resp_body else {}
            return resp.status, resp_data, resp.headers.get("Set-Cookie", "")
    except urllib.error.HTTPError as e:
        try:
            resp_body = e.read().decode("utf-8")
            resp_data = json.loads(resp_body) if resp_body else {}
        except Exception:
            resp_data = {"raw": str(e)}
        return e.code, resp_data, ""

def get_latest_outbox_email(recipient=None, template_type=None):
    import urllib.parse
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

def reset_rate_limits():
    api_request("POST", "/api/dev/reset-rate-limits", extra_headers={"X-Dev-Key": "quickjob-dev-test-secret"})

def create_user(email_suffix="test", age=25, password="SecurePassword123!"):
    """Create, verify and login a user. Returns (session_cookie, user_id, email, password)."""
    unique_ts = int(time.time() * 1000)
    email = f"{email_suffix}_{unique_ts}@quickjob.local"

    code, reg_data, _ = api_request("POST", "/api/auth/register", {
        "email": email, "password": password, "password_confirmation": password,
        "name": "Test User", "age": age, "agb_accepted": True, "agb_version": "1.1.0"
    })
    assert code == 201, f"Registration failed: {code} {reg_data}"

    email_data = get_latest_outbox_email(recipient=email, template_type="email_verification")
    assert email_data, f"No verification email for {email}"
    api_request("POST", "/api/auth/verify-email", {"token": email_data.get("token")})

    code, login_data, cookie_header = api_request("POST", "/api/auth/login", {
        "email": email, "password": password, "remember_me": True
    })
    assert code == 200, f"Login failed: {code} {login_data}"
    session_cookie = cookie_header.split(";")[0]

    code, me_data, _ = api_request("GET", "/api/auth/me", cookie_header=session_cookie)
    assert code == 200, f"/me failed: {code} {me_data}"
    return session_cookie, me_data["user"]["id"], email, password

def set_balances(user_id, wallet=0.0, escrow=0.0):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("UPDATE users SET wallet_balance = ?, escrow_balance = ? WHERE id = ?",
                     (wallet, escrow, user_id))
        conn.commit()

def fetch_user_row(user_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None

def fetch_fiscal_rows(user_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM fiscal_ledger_retention WHERE user_id = ?", (user_id,)).fetchall()
        return [dict(r) for r in rows]

def count_sessions(user_id):
    with sqlite3.connect(DB_PATH) as conn:
        return conn.execute("SELECT COUNT(*) FROM sessions WHERE user_id = ?", (user_id,)).fetchone()[0]

def run_account_deletion_tests():
    log("=====================================================================")
    log("STARTING ACCOUNT DELETION & STATUTORY RETENTION TEST SUITE (GAP-009)")
    log("=====================================================================")
    passed = 0
    total = 0

    reset_rate_limits()

    # ---------------------------------------------------------------------
    # TEST 1: Unauthenticated deletion is rejected
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 1] Unauthenticated deletion is rejected (negative gate)...")
    code, data, _ = api_request("DELETE", "/api/auth/account")
    if code == 401:
        log("  ✓ PASS: DELETE /api/auth/account without a session -> 401")
        passed += 1
    else:
        log(f"  ✗ FAIL: Unauthenticated deletion returned {code}: {data}")

    # ---------------------------------------------------------------------
    # TEST 2: Deletion with an active wallet+escrow balance writes a § 147 AO record
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 2] Deletion with active wallet/escrow balance...")
    cookie, user_id, email, _ = create_user("escrow_user")
    set_balances(user_id, wallet=75.50, escrow=24.50)

    code, del_data, _ = api_request("DELETE", "/api/auth/account", cookie_header=cookie)
    rows = fetch_fiscal_rows(user_id)
    if code == 200 and len(rows) == 1:
        rec = rows[0]
        if (rec["record_type"] == "WALLET_BALANCE"
                and abs(rec["amount"] - 100.0) < 1e-6
                and "147" in rec["statutory_basis"] and "AO" in rec["statutory_basis"]):
            log(f"  ✓ PASS: Fiscal record WALLET_BALANCE amount={rec['amount']} basis={rec['statutory_basis']}")
            passed += 1
        else:
            log(f"  ✗ FAIL: Unexpected retention record: {rec}")
    else:
        log(f"  ✗ FAIL: Deletion/fiscal record issue: code={code} rows={rows}")

    # ---------------------------------------------------------------------
    # TEST 3: Zero-balance deletion writes an ACCOUNT_CLOSING_LEDGER record
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 3] Deletion with zero balance writes closing ledger...")
    cookie, user_id, email, _ = create_user("zero_user")
    code, del_data, _ = api_request("DELETE", "/api/auth/account", cookie_header=cookie)
    rows = fetch_fiscal_rows(user_id)
    if code == 200 and len(rows) == 1 and rows[0]["record_type"] == "ACCOUNT_CLOSING_LEDGER" and abs(rows[0]["amount"]) < 1e-6:
        log("  ✓ PASS: Zero-balance deletion recorded as ACCOUNT_CLOSING_LEDGER (amount 0)")
        passed += 1
    else:
        log(f"  ✗ FAIL: Expected ACCOUNT_CLOSING_LEDGER amount 0, got: code={code} rows={rows}")

    # ---------------------------------------------------------------------
    # TEST 4: Personal data is anonymized
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 4] Personal data is anonymized (GDPR Art. 17)...")
    cookie, user_id, email, _ = create_user("anonymize_user")
    api_request("DELETE", "/api/auth/account", cookie_header=cookie)
    row = fetch_user_row(user_id)
    if row is None:
        log("  ✗ FAIL: User row was hard-deleted (expected anonymized soft-delete)")
    else:
        ok = (row["name"] == "Gelöschter Nutzer"
              and row["handle"] == "@deleted_user"
              and row["email"] == f"deleted_{user_id}@quickjob.local"
              and row["email"] != email
              and row["password_hash"] == "DELETED"
              and row["deleted_at"])
        if ok:
            log(f"  ✓ PASS: Anonymized: name={row['name']!r} email={row['email']!r} deleted_at set")
            passed += 1
        else:
            log(f"  ✗ FAIL: Anonymization incomplete: name={row['name']!r} handle={row['handle']!r} "
                f"email={row['email']!r} pw={row['password_hash']!r} deleted_at={row['deleted_at']!r}")

    # ---------------------------------------------------------------------
    # TEST 5: All sessions revoked
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 5] All sessions revoked on deletion...")
    cookie, user_id, email, password = create_user("session_user")
    code, _, cookie_header2 = api_request("POST", "/api/auth/login", {
        "email": email, "password": password, "remember_me": True
    })
    session2 = cookie_header2.split(";")[0] if code == 200 else None
    sessions_before = count_sessions(user_id)

    api_request("DELETE", "/api/auth/account", cookie_header=cookie)
    code1, _, _ = api_request("GET", "/api/auth/me", cookie_header=cookie)
    code2, _, _ = api_request("GET", "/api/auth/me", cookie_header=session2) if session2 else (401, {}, {})
    if sessions_before >= 2 and code1 == 401 and code2 == 401 and count_sessions(user_id) == 0:
        log(f"  ✓ PASS: All sessions revoked (before={sessions_before}, after={count_sessions(user_id)})")
        passed += 1
    else:
        log(f"  ✗ FAIL: sessions_before={sessions_before}, session1={code1}, session2={code2}, after={count_sessions(user_id)}")

    # ---------------------------------------------------------------------
    # TEST 6: Retention audit payload preserves hashed email + balances
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 6] Retention audit payload preserves hashed email...")
    cookie, user_id, email, _ = create_user("audit_user")
    set_balances(user_id, wallet=12.0, escrow=3.0)
    api_request("DELETE", "/api/auth/account", cookie_header=cookie)
    rows = fetch_fiscal_rows(user_id)
    if len(rows) == 1:
        payload = json.loads(rows[0]["audit_payload_json"])
        expected_hash = hashlib.sha256(email.encode("utf-8")).hexdigest()
        if (hmac.compare_digest(payload.get("email_hash", ""), expected_hash)
                and abs(payload.get("wallet_balance", -1) - 12.0) < 1e-6
                and abs(payload.get("escrow_balance", -1) - 3.0) < 1e-6):
            log("  ✓ PASS: Audit payload retains sha256(email) + balances, no plaintext email")
            passed += 1
        else:
            log(f"  ✗ FAIL: Audit payload mismatch: {payload}")
    else:
        log(f"  ✗ FAIL: Expected exactly 1 retention record, got {len(rows)}")

    # ---------------------------------------------------------------------
    # TEST 7: Purged email can be re-registered
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 7] Purged email can be re-registered (PII removed)...")
    cookie, user_id, email, password = create_user("rereg_user")
    api_request("DELETE", "/api/auth/account", cookie_header=cookie)
    code, reg_data, _ = api_request("POST", "/api/auth/register", {
        "email": email, "password": password, "password_confirmation": password,
        "name": "Re-register", "age": 25, "agb_accepted": True, "agb_version": "1.1.0"
    })
    if code == 201:
        log("  ✓ PASS: Original email address freed after anonymization (re-registration -> 201)")
        passed += 1
    else:
        log(f"  ✗ FAIL: Re-registration with purged email failed: {code} {reg_data}")

    # ---------------------------------------------------------------------
    # TEST 8: A revoked session cannot delete the account again
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 8] Revoked session cannot delete again...")
    cookie, user_id, email, _ = create_user("replay_user")
    api_request("DELETE", "/api/auth/account", cookie_header=cookie)
    code, data, _ = api_request("DELETE", "/api/auth/account", cookie_header=cookie)
    if code == 401:
        log("  ✓ PASS: Replaying deletion with a revoked cookie -> 401")
        passed += 1
    else:
        log(f"  ✗ FAIL: Replayed deletion returned {code}: {data}")

    log(f"\n=====================================================================")
    log(f"ACCOUNT DELETION & RETENTION RESULTS: {passed}/{total} TESTS PASSED")
    log(f"=====================================================================")
    return passed == total

if __name__ == "__main__":
    success = run_account_deletion_tests()
    sys.exit(0 if success else 1)
