"""
GUARDIAN PIN / ELTERN-CODE SECURITY TEST SUITE (rule §7)
Verifies the parent-dashboard PIN gate end to end via the real UI:
 1. PIN protection is OFF by default (§7) -> dashboard opens directly
 2. Enabling protection generates a per-user 6-digit code, never the legacy
    hardcoded master PIN '482910' (regression guard against the removed backdoor)
 3. A lock screen is enforced while protection is active
 4. The legacy master PIN '482910' is rejected
 5. Only the user's own configured code unlocks the dashboard
 6. Unlock is not sticky: reopening re-locks the dashboard
 7. Disabling protection removes the gate again
 8. Negative: unauthenticated users cannot reach the parent portal at all
 9. Negative (API): the PIN is never exposed by the auth API and there is no
    server-side guardian PIN endpoint (the gate is client-side only)

Standalone Playwright script (NOT pytest).
Run:  python tests/test_guardian_pin_security.py
Server must be running first:  python server.py  (http://127.0.0.1:8000)
"""
import json
import re
import sys
import urllib.error
import urllib.request

from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"
LEGACY_MASTER_PIN = "482910"  # must NEVER be a working universal code


def log(msg):
    print(msg, flush=True)


def api_request(method, path, data=None, cookie_header=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if cookie_header:
        headers["Cookie"] = cookie_header
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw else {}), resp.headers.get("Set-Cookie", "")
    except urllib.error.HTTPError as e:
        try:
            raw = e.read().decode("utf-8")
            parsed = json.loads(raw) if raw else {}
        except Exception:
            parsed = {"raw": ""}
        return e.code, parsed, ""


def dismiss_consent(page):
    btn = page.query_selector("#btn-consent-accept-all")
    if btn and btn.is_visible():
        btn.click()
        page.wait_for_selector("#tdddg-consent-banner", state="hidden", timeout=3000)


def login(page, email="jasper@quickjob.local", password="Password123!"):
    page.goto(BASE_URL, wait_until="domcontentloaded")
    page.wait_for_selector("#form-auth-login", timeout=10000)
    page.fill("#login-email", email)
    page.fill("#login-password", password)
    page.click("#btn-auth-submit-login")
    page.wait_for_function(
        "() => window.store && window.store.getState().isAuthenticated === true",
        timeout=12000,
    )
    page.wait_for_selector("#nav-profile", timeout=8000)
    dismiss_consent(page)


def open_dashboard(page):
    page.wait_for_selector("#btn-open-parent-dashboard", timeout=5000)
    page.click("#btn-open-parent-dashboard")
    page.wait_for_selector("#parent-modal-overlay", timeout=5000)


def close_dashboard(page):
    page.click("#btn-close-parent-modal")
    page.wait_for_selector("#parent-modal-overlay", state="hidden", timeout=5000)


def run_guardian_pin_tests():
    log("=====================================================================")
    log("STARTING GUARDIAN PIN / ELTERN-CODE SECURITY TEST SUITE")
    log("=====================================================================")

    passed = 0
    total = 0

    def record(name, ok, detail=""):
        nonlocal passed, total
        total += 1
        if ok:
            passed += 1
            log(f"  \u2713 PASS: {name}")
        else:
            log(f"  \u2717 FAIL: {name}" + (f" \u2014 {detail}" if detail else ""))

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ---- Test 8: unauthenticated negative (own context, no session) ----
        log("\n[Test 8] Unauthenticated access to the parent portal is impossible...")
        anon = browser.new_context(viewport={"width": 420, "height": 880})
        anon_page = anon.new_page()
        anon_page.goto(BASE_URL, wait_until="domcontentloaded")
        anon_page.wait_for_selector("#form-auth-login", timeout=10000)
        record(
            "Parent portal & PIN entry are absent for anonymous users",
            anon_page.query_selector("#btn-open-parent-dashboard") is None
            and anon_page.query_selector("#parent-code-input") is None,
        )
        anon.close()

        # ---- Authenticated UI PIN gate ----
        context = browser.new_context(viewport={"width": 420, "height": 880})
        page = context.new_page()
        login(page)
        page.click("#nav-profile")
        page.wait_for_selector("#screen-profile", timeout=5000)

        log("\n[Test 1] PIN protection is OFF by default...")
        toggle = page.query_selector("#toggle-parent-code")
        record("Toggle exists and is unchecked by default", toggle is not None and not toggle.is_checked())
        open_dashboard(page)
        record(
            "Dashboard opens directly while PIN is disabled",
            page.is_visible("#parent-dashboard-content") and not page.is_visible("#parent-code-input"),
        )
        close_dashboard(page)

        log("\n[Test 2] Enabling protection generates a per-user 6-digit code...")
        page.click("#toggle-parent-code")
        page.wait_for_function(
            "() => { const el = document.getElementById('display-parent-code');"
            " return el && /^[0-9]{6}$/.test((el.textContent || '').trim()); }",
            timeout=5000,
        )
        code = page.inner_text("#display-parent-code").strip()
        record("Generated code is 6 digits", bool(re.match(r"^\d{6}$", code)), code)
        record(
            f"Generated code is NOT the legacy master PIN '{LEGACY_MASTER_PIN}'",
            code != LEGACY_MASTER_PIN,
            code,
        )

        log("\n[Test 3] Lock screen enforced while protection is active...")
        open_dashboard(page)
        record(
            "PIN input shown and dashboard locked",
            page.is_visible("#parent-code-input") and not page.is_visible("#parent-dashboard-content"),
        )

        log("\n[Test 4] Legacy hardcoded master PIN is rejected (backdoor regression)...")
        page.fill("#parent-code-input", LEGACY_MASTER_PIN)
        page.click("#btn-verify-parent-code")
        page.wait_for_selector("#parent-code-error", state="visible", timeout=3000)
        record(
            "Master PIN '482910' does NOT unlock the dashboard",
            page.is_visible("#parent-code-error") and not page.is_visible("#parent-dashboard-content"),
        )

        log("\n[Test 5] Only the user's own code unlocks the dashboard...")
        page.fill("#parent-code-input", code)
        page.click("#btn-verify-parent-code")
        page.wait_for_selector("#parent-dashboard-content", timeout=5000)
        parent_text = page.inner_text("#parent-dashboard-content")
        record("Correct per-user code unlocks dashboard", page.is_visible("#parent-dashboard-content"))
        record(
            "Dashboard shows statutory work-time tracker",
            "Arbeitszeit" in parent_text or "KindArbSchV" in parent_text,
            parent_text[:80],
        )
        close_dashboard(page)

        log("\n[Test 6] Unlock is not sticky (re-locks on reopen)...")
        open_dashboard(page)
        record(
            "Dashboard re-locked on reopen",
            page.is_visible("#parent-code-input") and not page.is_visible("#parent-dashboard-content"),
        )
        close_dashboard(page)

        log("\n[Test 7] Disabling protection removes the gate...")
        page.click("#toggle-parent-code")
        page.wait_for_function(
            "() => { const el = document.getElementById('toggle-parent-code'); return el && !el.checked; }",
            timeout=3000,
        )
        open_dashboard(page)
        record(
            "Dashboard opens without PIN after disabling protection",
            page.is_visible("#parent-dashboard-content") and not page.is_visible("#parent-code-input"),
        )
        close_dashboard(page)

        context.close()
        browser.close()

    # ---- Test 9: API negative — the PIN must never leave/enter the server ----
    log("\n[Test 9] API never exposes the PIN (client-side-only gate)...")
    code, _, cookie = api_request(
        "POST", "/api/auth/login",
        {"email": "jasper@quickjob.local", "password": "Password123!", "remember_me": True},
    )
    record("API login succeeds for session-backed assertion", code == 200, f"HTTP {code}")
    session_cookie = cookie.split(";")[0] if cookie else None
    if session_cookie:
        code, me, _ = api_request("GET", "/api/auth/me", cookie_header=session_cookie)
        me_raw = json.dumps(me)
        record(
            "/api/auth/me never returns parentCode / pin / parentPortal",
            code == 200 and "parentCode" not in me_raw and "parentPortal" not in me_raw and '"pin"' not in me_raw,
            me_raw[:160],
        )
    # There is no server-side guardian PIN endpoint: the gate cannot be bypassed server-side.
    code, _, _ = api_request("GET", "/api/guardian/consent", cookie_header=session_cookie)
    record(
        "No server-side guardian PIN endpoint exists (404) — gate is client-side",
        code == 404,
        f"HTTP {code}",
    )

    log(f"\n=====================================================================")
    log(f"GUARDIAN PIN SECURITY RESULTS: {passed}/{total} TESTS PASSED")
    log(f"=====================================================================")
    return passed == total


if __name__ == "__main__":
    success = run_guardian_pin_tests()
    sys.exit(0 if success else 1)
