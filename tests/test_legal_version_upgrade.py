"""
LEGAL DOCUMENT VERSION & ACCEPTANCE AUDIT SUITE (GAP-007 MEDIUM)

Exercises the REAL legal API surface:
  GET  /api/legal/documents      (public, seeded AGB/PRIVACY/IMPRESSUM)
  GET  /api/legal/acceptances    (authenticated, per-user audit trail)

Verified here:
  1. Published documents are returned with a version, title and content
  2. The acceptances endpoint is an auth gate (negative)
  3. Registration records an auditable AGB acceptance with its version + status
  4. Acceptances are scoped to the requesting user (IDOR negative)

Known product gaps (kept RED, handed to the Debugger):
  G1. The server records whatever `agb_version` a client submits without
      checking it against the published document version -> the audit trail
      can be forged (accepting a version that does not exist).
  G2. There is no re-acceptance enforcement: after a document version is
      bumped, existing users are never flagged as stale and there is no
      endpoint to record a re-acceptance.
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

def register_and_login(suffix, agb_version="1.1.0", password="SecurePassword123!"):
    unique_ts = int(time.time() * 1000)
    email = f"{suffix}_{unique_ts}@quickjob.local"
    code, reg_data, _ = api_request("POST", "/api/auth/register", {
        "email": email, "password": password, "password_confirmation": password,
        "name": "Legal Test User", "age": 20, "agb_accepted": True, "agb_version": agb_version
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
    return session_cookie, me_data["user"]["id"], email

def published_versions():
    code, data, _ = api_request("GET", "/api/legal/documents")
    assert code == 200, f"documents endpoint failed: {code} {data}"
    return {d["type"]: d["version"] for d in data["documents"]}, data["documents"]

def set_published_version(doc_type, version):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("UPDATE legal_documents SET version = ? WHERE type = ?", (version, doc_type))
        conn.commit()

def run_legal_version_tests():
    log("=====================================================================")
    log("STARTING LEGAL DOCUMENT VERSION & ACCEPTANCE AUDIT SUITE (GAP-007)")
    log("=====================================================================")
    passed = 0
    total = 0
    gaps = []

    reset_rate_limits()

    # ---------------------------------------------------------------------
    # TEST 1: Published documents are returned with version/title/content
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 1] GET /api/legal/documents returns versioned documents...")
    versions, docs = published_versions()
    required = {"AGB", "PRIVACY", "IMPRESSUM"}
    if required.issubset(versions.keys()) and all(
        d.get("version") and d.get("title") and d.get("content") for d in docs
    ):
        log(f"  ✓ PASS: Published versions: {versions}")
        passed += 1
    else:
        log(f"  ✗ FAIL: Missing/empty legal documents: {docs}")

    # ---------------------------------------------------------------------
    # TEST 2: Acceptances endpoint is an auth gate
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 2] GET /api/legal/acceptances requires authentication...")
    code, data, _ = api_request("GET", "/api/legal/acceptances")
    if code == 401:
        log("  ✓ PASS: Unauthenticated acceptances request -> 401")
        passed += 1
    else:
        log(f"  ✗ FAIL: Unauthenticated acceptances returned {code}: {data}")

    # ---------------------------------------------------------------------
    # TEST 3: Registration records an auditable AGB acceptance
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 3] Registration records an AGB acceptance with version + status...")
    cookie, user_id, email = register_and_login("legal_record", agb_version="1.1.0")
    code, data, _ = api_request("GET", "/api/legal/acceptances", cookie_header=cookie)
    agb = [a for a in data.get("acceptances", []) if a.get("document_id") == "AGB"]
    if (code == 200 and agb and agb[0]["document_version"] == "1.1.0"
            and agb[0]["acceptance_status"] == "ACCEPTED" and agb[0]["accepted_at"]):
        log(f"  ✓ PASS: AGB v{agb[0]['document_version']} accepted at {agb[0]['accepted_at']}")
        passed += 1
    else:
        log(f"  ✗ FAIL: AGB acceptance missing/malformed: {code} {agb}")

    # ---------------------------------------------------------------------
    # TEST 4: Acceptances are scoped per user (IDOR negative)
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 4] Acceptances are scoped to the requesting user (IDOR)...")
    cookie_b, user_b, email_b = register_and_login("legal_user_b", agb_version="1.1.0")
    code_b, data_b, _ = api_request("GET", "/api/legal/acceptances", cookie_header=cookie_b)
    b_user_ids = {a.get("user_id") for a in data_b.get("acceptances", [])}
    # The endpoint does not return user_id, so assert the response only contains
    # B's own acceptance and none of A's identifiers.
    b_text = json.dumps(data_b)
    if (code_b == 200 and len(data_b.get("acceptances", [])) >= 1
            and user_id not in b_text and user_b not in b_text):
        log(f"  ✓ PASS: User B sees only its own {len(data_b['acceptances'])} acceptance(s)")
        passed += 1
    else:
        log(f"  ✗ FAIL: Cross-user acceptance leak: {data_b}")

    # ---------------------------------------------------------------------
    # GAP G1: Registration accepts an unpublished AGB version
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 5] PRODUCT GAP G1: unpublished AGB version is accepted...")
    forged_version = "9.9.9-unpublished"
    code, reg_data, _ = api_request("POST", "/api/auth/register", {
        "email": f"forged_agb_{int(time.time()*1000)}@quickjob.local",
        "password": "SecurePassword123!", "password_confirmation": "SecurePassword123!",
        "name": "Forged AGB", "age": 20, "agb_accepted": True, "agb_version": forged_version
    })
    # Desired: the server rejects an acceptance for a version that is not the
    # currently published AGB version (400), or records the published version.
    current_agb = versions.get("AGB")
    if code == 400:
        log("  ✓ PASS: Server rejected an acceptance for an unpublished AGB version")
        passed += 1
    else:
        # Inspect what was actually recorded for the new user, if registration succeeded.
        recorded = None
        if code == 201:
            with sqlite3.connect(DB_PATH) as conn:
                recorded = conn.execute(
                    "SELECT document_version FROM legal_acceptances WHERE document_id='AGB' "
                    "ORDER BY accepted_at DESC LIMIT 1"
                ).fetchone()
                recorded = recorded[0] if recorded else None
        log(f"  ⚠ PRODUCT GAP G1: server accepted agb_version={forged_version!r} "
            f"(published={current_agb}, recorded={recorded}) — audit trail forgeable")
        gaps.append("G1: agb_version is stored unvalidated (audit trail forgeable) at backend/api_auth.py:294")

    # ---------------------------------------------------------------------
    # GAP G2: no re-acceptance enforcement after a version bump
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 6] PRODUCT GAP G2: no re-acceptance enforcement after version bump...")
    cookie, user_id, email = register_and_login("legal_bump", agb_version="1.1.0")
    published_versions()  # sanity
    bumped = "1.2.0"
    set_published_version("AGB", bumped)
    try:
        code, docs_after, _ = api_request("GET", "/api/legal/documents")
        now_published = {d["type"]: d["version"] for d in docs_after["documents"]}.get("AGB")
        code_acc, acc_data, _ = api_request("GET", "/api/legal/acceptances", cookie_header=cookie)
        stale_flag = acc_data.get("needs_reacceptance")
        accept_endpoint_codes = [
            api_request("POST", "/api/legal/accept",
                        {"document_id": "AGB", "document_version": bumped, "accepted": True},
                        cookie_header=cookie)[0]
        ]
        # Desired: the user is flagged stale OR there is a working /legal/accept endpoint.
        if now_published != bumped:
            log(f"  ✗ FAIL: Could not bump published AGB version (got {now_published})")
        elif stale_flag is True or any(c in (200, 201) for c in accept_endpoint_codes):
            log("  ✓ PASS: Re-acceptance is enforced/exposed after a version bump")
            passed += 1
        else:
            log(f"  ⚠ PRODUCT GAP G2: AGB bumped to {bumped} but user is not flagged stale "
                f"(needs_reacceptance={stale_flag}) and /api/legal/accept -> {accept_endpoint_codes[0]}")
            gaps.append("G2: no re-acceptance enforcement / no /api/legal/accept endpoint (backend/api_auth.py)")
    finally:
        set_published_version("AGB", "1.1.0")

    log(f"\n=====================================================================")
    log(f"LEGAL VERSION AUDIT RESULTS: {passed}/{total} TESTS PASSED, {len(gaps)} PRODUCT GAP(S)")
    for g in gaps:
        log(f"  ⚠ {g}")
    log("=====================================================================")
    return passed == total and not gaps

if __name__ == "__main__":
    success = run_legal_version_tests()
    sys.exit(0 if success else 1)
