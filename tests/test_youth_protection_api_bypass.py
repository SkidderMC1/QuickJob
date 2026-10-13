"""
YOUTH PROTECTION GATE TEST SUITE (GAP-008 HIGH)

The backend exposes NO job/wallet endpoints, so youth protection is enforced in
two real places: the statutory registration age gate (server side) and the
LegalEligibilityEngine / filter lock (client side). This suite covers both.

Server-side registration age gate (JArbSchG § 5 Abs. 1):
  1.  age < 13            -> 403 + statutory citation, no user row created
  2.  age == 13 / 14      -> age_category CHILD_13_14
  3.  age 15-17           -> age_category YOUTH_14_17
  4.  age 18-25           -> age_category YOUNG_WORKER_18_25
  5.  age 26+             -> age_category ADULT
  6.  age > 120           -> 400
  7.  agb_accepted=False  -> 400
  8.  missing agb_accepted-> 422
  9.  exact boundary 12/13

Client-side youth protection (Playwright):
  10. A minor cannot disable the age-suitability filter (§ 22 JArbSchG lock)
  11. An adult CAN disable it
  12. A minor applying to a hazardous (disposal) job is hard-blocked
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

def register(suffix, age, agb_accepted=True, include_agb=True, password="SecurePassword123!"):
    email = f"{suffix}_{int(time.time()*1000)}@quickjob.local"
    payload = {"email": email, "password": password, "password_confirmation": password,
               "name": f"User {suffix}", "age": age}
    if include_agb:
        payload["agb_accepted"] = agb_accepted
        payload["agb_version"] = "1.1.0"
    code, data, _ = api_request("POST", "/api/auth/register", payload)
    return code, data, email

def category_of(email):
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT age_category FROM users WHERE email=?", (email,)).fetchone()
        return row[0] if row else None

def user_exists(email):
    with sqlite3.connect(DB_PATH) as conn:
        return conn.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone() is not None

def run_youth_protection_tests():
    log("=====================================================================")
    log("STARTING YOUTH PROTECTION GATE TEST SUITE (GAP-008)")
    log("=====================================================================")
    passed = 0
    total = 0

    reset_rate_limits()

    # ---------------------------------------------------------------------
    # TEST 1: Under-13 registration is hard-blocked with a statutory citation
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 1] Under-13 registration blocked (§ 5 Abs. 1 JArbSchG)...")
    code, data, email = register("under13", age=12)
    detail = str(data.get("detail", ""))
    if code == 403 and "JArbSchG" in detail and not user_exists(email):
        log(f"  ✓ PASS: age=12 -> 403, no user row created: {detail[:90]}")
        passed += 1
    else:
        log(f"  ✗ FAIL: code={code}, row_created={user_exists(email)}, detail={detail[:120]}")

    # ---------------------------------------------------------------------
    # TEST 2: Age 13/14 -> CHILD_13_14
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 2] Age 13/14 classified as CHILD_13_14...")
    code13, _, email13 = register("age13", age=13)
    code14, _, email14 = register("age14", age=14)
    if (code13 == 201 and code14 == 201
            and category_of(email13) == "CHILD_13_14" and category_of(email14) == "CHILD_13_14"):
        log("  ✓ PASS: age 13 and 14 -> CHILD_13_14")
        passed += 1
    else:
        log(f"  ✗ FAIL: 13={code13}/{category_of(email13)}, 14={code14}/{category_of(email14)}")

    # ---------------------------------------------------------------------
    # TEST 3: Age 15-17 -> YOUTH_14_17
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 3] Age 15-17 classified as YOUTH_14_17...")
    codes_cats = []
    emails = []
    for age in (15, 16, 17):
        c, _, e = register(f"age{age}", age=age)
        codes_cats.append((age, c, category_of(e)))
        emails.append(e)
    if all(c == 201 and cat == "YOUTH_14_17" for _, c, cat in codes_cats):
        log("  ✓ PASS: ages 15/16/17 -> YOUTH_14_17")
        passed += 1
    else:
        log(f"  ✗ FAIL: {codes_cats}")

    # ---------------------------------------------------------------------
    # TEST 4: Age 18-25 -> YOUNG_WORKER_18_25
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 4] Age 18-25 classified as YOUNG_WORKER_18_25...")
    c18, _, e18 = register("age18", age=18)
    c25, _, e25 = register("age25", age=25)
    if (c18 == 201 and c25 == 201
            and category_of(e18) == "YOUNG_WORKER_18_25" and category_of(e25) == "YOUNG_WORKER_18_25"):
        log("  ✓ PASS: ages 18 and 25 -> YOUNG_WORKER_18_25")
        passed += 1
    else:
        log(f"  ✗ FAIL: 18={c18}/{category_of(e18)}, 25={c25}/{category_of(e25)}")

    # ---------------------------------------------------------------------
    # TEST 5: Age 26+ -> ADULT
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 5] Age 26+ classified as ADULT...")
    c26, _, e26 = register("age26", age=26)
    if c26 == 201 and category_of(e26) == "ADULT":
        log("  ✓ PASS: age 26 -> ADULT")
        passed += 1
    else:
        log(f"  ✗ FAIL: 26={c26}/{category_of(e26)}")

    # ---------------------------------------------------------------------
    # TEST 6: Age > 120 rejected
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 6] Age > 120 rejected (400)...")
    code, data, email = register("age200", age=200)
    if code == 400 and not user_exists(email):
        log("  ✓ PASS: age=200 -> 400, no user row")
        passed += 1
    else:
        log(f"  ✗ FAIL: code={code}, row={user_exists(email)}, data={data}")

    # ---------------------------------------------------------------------
    # TEST 7: agb_accepted=False rejected
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 7] agb_accepted=False rejected (400)...")
    code, data, email = register("no_agb", age=20, agb_accepted=False)
    if code == 400 and "AGB" in str(data.get("detail", "")):
        log("  ✓ PASS: explicit AGB rejection -> 400 (§ 305 Abs. 2 BGB)")
        passed += 1
    else:
        log(f"  ✗ FAIL: code={code} data={data}")

    # ---------------------------------------------------------------------
    # TEST 8: missing agb_accepted rejected by schema
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 8] Missing agb_accepted rejected (422)...")
    code, data, email = register("missing_agb", age=20, include_agb=False)
    if code == 422:
        log("  ✓ PASS: missing agb_accepted -> 422")
        passed += 1
    else:
        log(f"  ✗ FAIL: expected 422, got {code}: {data}")

    # ---------------------------------------------------------------------
    # TEST 9: Exact boundary 12 (blocked) vs 13 (allowed)
    # ---------------------------------------------------------------------
    total += 1
    log("\n[Test 9] Exact boundary: 12 blocked, 13 allowed...")
    c12, _, e12 = register("boundary12", age=12)
    c13b, _, e13b = register("boundary13", age=13)
    if c12 == 403 and not user_exists(e12) and c13b == 201 and user_exists(e13b):
        log("  ✓ PASS: age 12 -> 403 (no row), age 13 -> 201 (row created)")
        passed += 1
    else:
        log(f"  ✗ FAIL: 12={c12}/row={user_exists(e12)}, 13={c13b}/row={user_exists(e13b)}")

    # =====================================================================
    # Client-side youth protection (Playwright)
    # =====================================================================
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 960})
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_function("() => !!window.store", timeout=10000)

        # Establish a real session (mandatory auth gate), then use the minor persona.
        page.evaluate("() => store.loginUser('sophia@quickjob.local', 'Password123!')")
        page.wait_for_function("() => store.getState().isAuthenticated === true", timeout=10000)

        # -----------------------------------------------------------------
        # TEST 10: A minor cannot disable the age-suitability filter
        # -----------------------------------------------------------------
        total += 1
        log("\n[Test 10] Minor cannot disable youth-protection filter (§ 22 JArbSchG)...")
        page.evaluate("() => store.switchPersona('jasper')")  # 16-year-old
        page.wait_for_function("() => store.getState().currentUser && store.getState().currentUser.age === 16", timeout=5000)
        page.evaluate("() => store.setFilter('onlySuitableForMyAge', true)")
        page.evaluate("() => store.setFilter('onlySuitableForMyAge', false)")
        filter_state = page.evaluate("() => store.getState().filters.onlySuitableForMyAge")
        toast = page.evaluate("() => store.getState().toast ? store.getState().toast.message : ''")
        if filter_state is True and "Jugendschutz" in toast:
            log(f"  ✓ PASS: filter stayed locked; toast: {toast}")
            passed += 1
        else:
            log(f"  ✗ FAIL: filter={filter_state}, toast={toast!r}")

        # -----------------------------------------------------------------
        # TEST 11: An adult CAN disable the filter
        # -----------------------------------------------------------------
        total += 1
        log("\n[Test 11] Adult can disable the youth-protection filter...")
        page.evaluate("() => store.switchPersona('sophia')")  # 22-year-old
        page.wait_for_function("() => store.getState().currentUser && store.getState().currentUser.age === 22", timeout=5000)
        page.evaluate("() => store.setFilter('onlySuitableForMyAge', false)")
        adult_filter = page.evaluate("() => store.getState().filters.onlySuitableForMyAge")
        if adult_filter is False:
            log("  ✓ PASS: adult filter disabled")
            passed += 1
        else:
            log(f"  ✗ FAIL: adult filter still {adult_filter}")

        # -----------------------------------------------------------------
        # TEST 12: A minor is hard-blocked from a hazardous disposal job
        # -----------------------------------------------------------------
        total += 1
        log("\n[Test 12] Minor hard-blocked from hazardous disposal job (§ 22 JArbSchG)...")
        page.evaluate("() => store.switchPersona('jasper')")
        page.wait_for_function("() => store.getState().currentUser && store.getState().currentUser.age === 16", timeout=5000)
        target = page.evaluate("""() => {
            const j = store.getState().jobs.find(j => j.category === 'disposal');
            return j ? j.id : null;
        }""")
        if not target:
            log("  ✗ FAIL: no disposal job fixture found in the feed")
        else:
            page.evaluate(f"() => store.applyToJob('{target}')")
            job_state = page.evaluate(f"() => store.getState().jobs.find(j => j.id === '{target}').state")
            toast = page.evaluate("() => store.getState().toast ? store.getState().toast.message : ''")
            if job_state != "WORKER_SELECTED" and "22 JArbSchG" in toast:
                log(f"  ✓ PASS: disposal job not accepted; toast cites § 22 JArbSchG")
                passed += 1
            else:
                log(f"  ✗ FAIL: state={job_state}, toast={toast!r}")

        browser.close()

    log(f"\n=====================================================================")
    log(f"YOUTH PROTECTION GATE RESULTS: {passed}/{total} TESTS PASSED")
    log(f"=====================================================================")
    return passed == total

if __name__ == "__main__":
    success = run_youth_protection_tests()
    sys.exit(0 if success else 1)
