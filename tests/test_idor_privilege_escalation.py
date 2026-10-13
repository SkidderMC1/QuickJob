"""
IDOR / HORIZONTAL & VERTICAL PRIVILEGE ESCALATION TEST SUITE (GAP-003 HIGH)

Exercises the REAL authorization surface (there are no jobs / wallet / KYC /
conversation / guardian APIs in this codebase):

1.  GET  /api/auth/me                 -> only the caller's own record
2.  DELETE /api/auth/account          -> only the caller's own account
3.  POST /api/auth/change-password    -> only the caller's sessions affected
4.  GET  /api/legal/acceptances       -> per-user scope (no cross-user leak)
5.  GET  /api/legal/acceptances       -> ignores spoofed ?user_id=
6.  GET  /api/admin/stats             -> non-admin 403, unauth 401, admin 200
7.  GET  /api/admin/reports           -> non-admin 403
8.  POST /api/admin/reports/{id}/action -> non-admin 403
9.  POST /api/auth/register role=admin -> rejected (no self-escalation)
10. GET  /api/dev/*                    -> requires a valid X-Dev-Key
11. Authorization: Bearer <garbage>    -> 401 (no token confusion)
"""
import sys
import os
import time
import json
import sqlite3
import urllib.request
import urllib.error

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "quickjob.db")
DEV_KEY = "quickjob-dev-test-secret"

def log(msg):
    print(msg, flush=True)

def api_request(method, path, data=None, cookie_header=None, extra_headers=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if extra_headers:
        headers.update(extra_headers)
    if path.startswith("/api/dev/"):
        headers.setdefault("X-Dev-Key", DEV_KEY)
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
    api_request("POST", "/api/dev/reset-rate-limits", extra_headers={"X-Dev-Key": DEV_KEY})

def create_and_login_user(suffix, password="SecurePassword123!", age=20, role="worker"):
    unique_ts = int(time.time() * 1000)
    email = f"{suffix}_{unique_ts}@quickjob.local"
    code, reg_data, _ = api_request("POST", "/api/auth/register", {
        "email": email, "password": password, "password_confirmation": password,
        "name": "Test User", "age": age, "agb_accepted": True, "agb_version": "1.1.0", "role": role
    })
    assert code == 201, f"Registration failed: {code} {reg_data}"

    email_data = get_latest_outbox_email(recipient=email, template_type="email_verification")
    api_request("POST", "/api/auth/verify-email", {"token": email_data.get("token")})

    code, login_data, cookie_header = api_request("POST", "/api/auth/login", {
        "email": email, "password": password, "remember_me": True
    })
    assert code == 200, f"Login failed: {code} {login_data}"
    session_cookie = cookie_header.split(";")[0]
    code, me_data, _ = api_request("GET", "/api/auth/me", cookie_header=session_cookie)
    return session_cookie, me_data["user"]["id"], email, password

def run_idor_tests():
    log("=====================================================================")
    log("STARTING IDOR / PRIVILEGE ESCALATION TEST SUITE (GAP-003)")
    log("=====================================================================")
    passed = 0
    total = 0

    reset_rate_limits()

    victim_cookie, victim_id, victim_email, _ = create_and_login_user("victim", age=25)
    attacker_cookie, attacker_id, attacker_email, attacker_password = create_and_login_user("attacker", age=25)

    log(f"Victim user_id: {victim_id}, Attacker user_id: {attacker_id}")

    # ---------------------------------------------------------------------
    # TEST 1: /me returns only the caller's own record
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 1] /api/auth/me returns only the caller's record...")
    code, data, _ = api_request("GET", "/api/auth/me", cookie_header=attacker_cookie)
    if code == 200 and data["user"]["id"] == attacker_id and data["user"]["email"] == attacker_email:
        log(f"  ✓ PASS: Attacker sees only own profile (id={attacker_id})")
        passed += 1
    else:
        log(f"  ✗ FAIL: Unexpected /me response: {code} {data}")

    # ---------------------------------------------------------------------
    # TEST 2: Account deletion is scoped to the caller
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 2] Attacker deletion deletes only attacker, not victim...")
    code, data, _ = api_request("DELETE", "/api/auth/account", cookie_header=attacker_cookie)
    code_victim, _, _ = api_request("GET", "/api/auth/me", cookie_header=victim_cookie)
    with sqlite3.connect(DB_PATH) as conn:
        attacker_gone = conn.execute("SELECT deleted_at FROM users WHERE id=?", (attacker_id,)).fetchone()[0] is not None
    if code == 200 and attacker_gone and code_victim == 200:
        log("  ✓ PASS: Attacker account deleted; victim session still valid")
        passed += 1
    else:
        log(f"  ✗ FAIL: deletion={code}, attacker_deleted={attacker_gone}, victim_me={code_victim}")

    # Attacker is now deleted; create a fresh non-admin for the remaining tests.
    attacker_cookie, attacker_id, attacker_email, attacker_password = create_and_login_user("attacker2", age=25)

    # ---------------------------------------------------------------------
    # TEST 3: change-password affects only the caller's own sessions
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 3] change-password affects only the caller's own sessions...")
    code, _, ch2 = api_request("POST", "/api/auth/login", {
        "email": attacker_email, "password": attacker_password, "remember_me": True
    })
    attacker_other = ch2.split(";")[0] if code == 200 else None
    code, pw_data, _ = api_request("POST", "/api/auth/change-password", {
        "current_password": attacker_password,
        "new_password": "NewPassword987!",
        "new_password_confirmation": "NewPassword987!"
    }, cookie_header=attacker_cookie)
    c_self, _, _ = api_request("GET", "/api/auth/me", cookie_header=attacker_cookie)
    c_other, _, _ = api_request("GET", "/api/auth/me", cookie_header=attacker_other) if attacker_other else (401, {}, {})
    c_victim, _, _ = api_request("GET", "/api/auth/me", cookie_header=victim_cookie)
    if code == 200 and c_self == 200 and c_other == 401 and c_victim == 200:
        log("  ✓ PASS: Caller kept, other attacker session revoked, victim unaffected")
        passed += 1
    else:
        log(f"  ✗ FAIL: change={code}, self={c_self}, other={c_other}, victim={c_victim}")

    # ---------------------------------------------------------------------
    # TEST 4: Legal acceptances are per-user (no cross-user leak)
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 4] Legal acceptances are scoped per user (IDOR)...")
    _, v_acc, _ = api_request("GET", "/api/legal/acceptances", cookie_header=victim_cookie)
    a_code, a_acc, _ = api_request("GET", "/api/legal/acceptances", cookie_header=attacker_cookie)
    v_ids = {a["id"] for a in v_acc.get("acceptances", [])}
    a_ids = {a["id"] for a in a_acc.get("acceptances", [])}
    if a_code == 200 and v_ids and a_ids and not (v_ids & a_ids):
        log(f"  ✓ PASS: Disjoint acceptance sets (victim={len(v_ids)}, attacker={len(a_ids)})")
        passed += 1
    else:
        log(f"  ✗ FAIL: Cross-user acceptance overlap: victim={v_ids}, attacker={a_ids}")

    # ---------------------------------------------------------------------
    # TEST 5: Acceptances ignore a spoofed user_id query parameter
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 5] Acceptances ignore a spoofed ?user_id= parameter...")
    code, spoofed, _ = api_request("GET", f"/api/legal/acceptances?user_id={victim_id}", cookie_header=attacker_cookie)
    spoofed_ids = {a["id"] for a in spoofed.get("acceptances", [])}
    if code == 200 and not (spoofed_ids & v_ids):
        log("  ✓ PASS: Spoofed user_id cannot select another user's acceptances")
        passed += 1
    else:
        log(f"  ✗ FAIL: Spoofed user_id leaked victim acceptances: {spoofed_ids & v_ids}")

    # ---------------------------------------------------------------------
    # TEST 6: Admin gating on /api/admin/stats
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 6] /api/admin/stats: unauth 401, non-admin 403, admin 200...")
    unauth_code, _, _ = api_request("GET", "/api/admin/stats")
    nonadmin_code, nonadmin_data, _ = api_request("GET", "/api/admin/stats", cookie_header=attacker_cookie)
    a_code, _, admin_cookie = api_request("POST", "/api/auth/login", {
        "email": "admin@quickjob.local", "password": "Password123!", "remember_me": True
    })
    admin_cookie = admin_cookie.split(";")[0] if a_code == 200 else None
    admin_code, admin_data, _ = api_request("GET", "/api/admin/stats", cookie_header=admin_cookie) if admin_cookie else (0, {}, {})
    if unauth_code == 401 and nonadmin_code == 403 and admin_code == 200:
        log("  ✓ PASS: unauth=401, non-admin=403, admin=200")
        passed += 1
    else:
        log(f"  ✗ FAIL: unauth={unauth_code}, non-admin={nonadmin_code}, admin={admin_code} {nonadmin_data}")

    # ---------------------------------------------------------------------
    # TEST 7: Non-admin cannot list admin reports
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 7] Non-admin cannot list /api/admin/reports...")
    code, data, _ = api_request("GET", "/api/admin/reports", cookie_header=attacker_cookie)
    if code == 403:
        log("  ✓ PASS: Non-admin -> 403")
        passed += 1
    else:
        log(f"  ✗ FAIL: Expected 403, got {code}: {data}")

    # ---------------------------------------------------------------------
    # TEST 8: Non-admin cannot perform a moderation action
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 8] Non-admin cannot POST an admin moderation action...")
    code, data, _ = api_request("POST", "/api/admin/reports/rep_101/action",
                                {"action": "DISMISS"}, cookie_header=attacker_cookie)
    if code == 403:
        log("  ✓ PASS: Non-admin moderation action -> 403")
        passed += 1
    else:
        log(f"  ✗ FAIL: Expected 403, got {code}: {data}")

    # ---------------------------------------------------------------------
    # TEST 9: Registration cannot self-assign the admin role
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 9] Registration cannot self-assign role='admin'...")
    code, data, _ = api_request("POST", "/api/auth/register", {
        "email": f"escalate_{int(time.time()*1000)}@quickjob.local",
        "password": "SecurePassword123!", "password_confirmation": "SecurePassword123!",
        "name": "Escalate", "age": 25, "agb_accepted": True, "agb_version": "1.1.0", "role": "admin"
    })
    if code == 400:
        log("  ✓ PASS: role='admin' rejected at registration (400)")
        passed += 1
    elif code == 201:
        log("  ✗ FAIL: Registration accepted self-assigned admin role (privilege escalation!)")
    else:
        log(f"  ✗ FAIL: Unexpected registration response: {code} {data}")

    # ---------------------------------------------------------------------
    # TEST 10: Dev endpoints require the X-Dev-Key
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 10] Dev endpoints require a valid X-Dev-Key...")
    code_nokey, _, _ = api_request("GET", "/api/dev/latest-email", extra_headers={"X-Dev-Key": ""})
    code_wrong, _, _ = api_request("GET", "/api/dev/latest-email", extra_headers={"X-Dev-Key": "wrong-key"})
    code_ok, _, _ = api_request("GET", "/api/dev/latest-email", extra_headers={"X-Dev-Key": DEV_KEY})
    if code_nokey == 403 and code_wrong == 403 and code_ok == 200:
        log("  ✓ PASS: no-key=403, wrong-key=403, valid-key=200")
        passed += 1
    else:
        log(f"  ✗ FAIL: no-key={code_nokey}, wrong-key={code_wrong}, valid-key={code_ok}")

    # ---------------------------------------------------------------------
    # TEST 11: A forged bearer token does not authenticate
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 11] Forged Authorization: Bearer token is rejected...")
    code, data, _ = api_request("GET", "/api/auth/me",
                                extra_headers={"Authorization": "Bearer not-a-real-session-token"})
    if code == 401:
        log("  ✓ PASS: Forged bearer token -> 401")
        passed += 1
    else:
        log(f"  ✗ FAIL: Forged bearer token returned {code}: {data}")

    log(f"\n=====================================================================")
    log(f"IDOR / PRIVILEGE ESCALATION RESULTS: {passed}/{total} TESTS PASSED")
    log(f"=====================================================================")
    return passed == total

if __name__ == "__main__":
    success = run_idor_tests()
    sys.exit(0 if success else 1)
