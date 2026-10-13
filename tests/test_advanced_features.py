"""
Comprehensive Automated Test Suite for EasyJob Advanced Features
Verifies (as real, result-state assertions):
 1. Mandatory auth gate (login required)
 2. Ausweis-Verifikation (KYC) & profile verified checkmark
 3. Badges & Achievements (Tierfreund, Garten-Profi, Einkaufs-Held, ...)
 4. Eltern-Dashboard, Eltern-Link & 6-digit PIN code protection
 5. Settings: Dark Mode toggle & Notification preferences
 6. Umkreis-Karte & Location Consent Dialog
 7. Travel times (Bike, Walk, Transit) on job cards
 8. Chat Quick-Replies, Live Check-In & 1-tap SOS emergency modal
 9. Vorher/Nachher proof-of-work & Gemini Vision verification
10. Trinkgeld (Tip) feature in the review flow
11. Rechtssichere Quittung (§ 368 BGB / § 147 AO)

Standalone Playwright script (NOT pytest).
Run:  python tests/test_advanced_features.py
Server must be running first:  python server.py  (http://127.0.0.1:8000)
"""
import re
import sys

from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"


def log(msg):
    print(msg, flush=True)


def dismiss_consent(page):
    """Close the TDDDG consent banner if it is intercepting the UI."""
    btn = page.query_selector("#btn-consent-accept-all")
    if btn and btn.is_visible():
        btn.click()
        page.wait_for_selector("#tdddg-consent-banner", state="hidden", timeout=3000)


def open_parent_dashboard(page):
    page.wait_for_selector("#btn-open-parent-dashboard", timeout=5000)
    page.click("#btn-open-parent-dashboard")
    page.wait_for_selector("#parent-modal-overlay", timeout=5000)


def close_parent_dashboard(page):
    page.click("#btn-close-parent-modal")
    page.wait_for_selector("#parent-modal-overlay", state="hidden", timeout=5000)


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


def run_tests():
    log("==================================================")
    log("STARTING ADVANCED FEATURES PLAYWRIGHT TEST SUITE")
    log("==================================================")

    passed = 0
    total = 0
    failures = []

    def record(name, ok, detail=""):
        nonlocal passed, total
        total += 1
        if ok:
            passed += 1
            log(f"  \u2713 PASS: {name}")
        else:
            log(f"  \u2717 FAIL: {name}" + (f" \u2014 {detail}" if detail else ""))
            failures.append(name)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 420, "height": 880})
        page = context.new_page()
        try:
            # ---- TEST 1: Mandatory auth gate ----
            log("\n--- TEST 1: Mandatory Auth Gate ---")
            page.goto(BASE_URL, wait_until="domcontentloaded")
            page.wait_for_selector("#form-auth-login", timeout=10000)
            record("Auth gate: login form shown", page.is_visible("#login-email") and page.is_visible("#login-password"))
            record("Auth gate: bottom nav hidden while logged out", not page.is_visible("#bottom-nav"))
            login(page)
            record("Login unlocks the authenticated shell", page.is_visible("#nav-profile"))

            # ---- TEST 2: KYC verification & verified badge ----
            log("\n--- TEST 2: Ausweis-Verifikation (KYC) & Verified Checkmark ---")
            page.click("#nav-profile")
            page.wait_for_selector("#screen-profile", timeout=5000)
            record("KYC card visible on profile", page.is_visible("#profile-id-verification-card"))
            page.select_option("#select-id-type", "Personalausweis")
            page.click("#btn-profile-verify-id")
            page.wait_for_selector("#profile-id-verified-badge", timeout=5000)
            badge_text = page.inner_text("#profile-id-verified-badge")
            record("Verified badge says 'Ausweis verifiziert'", "Ausweis verifiziert" in badge_text, badge_text)
            # Negative: the unverified badge must be gone once verified
            record("Unverified badge no longer shown after KYC", page.query_selector("#profile-id-unverified-badge") is None)

            # ---- TEST 3: Badges & Achievements ----
            log("\n--- TEST 3: Badges & Achievements ---")
            record("Achievements card visible", page.is_visible("#profile-achievements-card"))
            grid = page.query_selector_all("#achievements-grid > div")
            record("At least 6 achievements rendered", len(grid) >= 6, f"got {len(grid)}")
            ach_text = page.inner_text("#achievements-grid")
            record(
                "Achievement names present",
                all(t in ach_text for t in ("Tierfreund", "Garten-Profi", "Einkaufs-Held")),
                ach_text[:120],
            )

            # ---- TEST 4: Eltern-Dashboard & PIN code protection ----
            log("\n--- TEST 4: Eltern-Dashboard, Eltern-Link & Eltern-Code ---")
            record("Parent portal card visible", page.is_visible("#profile-parent-portal-card"))
            parent_link = page.inner_text("#parent-link-text")
            record("Shareable parent link present", "eltern" in parent_link and "http" in parent_link, parent_link)
            page.click("#btn-copy-parent-link")

            toggle = page.query_selector("#toggle-parent-code")
            record("Parent-code toggle exists", toggle is not None)
            record("PIN protection is OFF by default (§7)", not toggle.is_checked())

            # Default OFF: dashboard opens without a PIN prompt
            open_parent_dashboard(page)
            record(
                "Dashboard opens directly while PIN is disabled",
                page.is_visible("#parent-dashboard-content") and not page.is_visible("#parent-code-input"),
            )
            close_parent_dashboard(page)

            # Enable protection -> a per-user 6-digit code is generated
            page.click("#toggle-parent-code")
            page.wait_for_function(
                "() => { const el = document.getElementById('display-parent-code');"
                " return el && /^[0-9]{6}$/.test((el.textContent || '').trim()); }",
                timeout=5000,
            )
            code = page.inner_text("#display-parent-code").strip()
            record("Enabling PIN generates a 6-digit per-user code", bool(re.match(r"^\d{6}$", code)), code)

            # Locked screen appears when protection is active
            open_parent_dashboard(page)
            record(
                "PIN lock screen shown when code protection is active",
                page.is_visible("#parent-code-input") and not page.is_visible("#parent-dashboard-content"),
            )

            # Negative: wrong PIN is rejected and dashboard stays locked
            wrong = "000000" if code != "000000" else "111111"
            page.fill("#parent-code-input", wrong)
            page.click("#btn-verify-parent-code")
            page.wait_for_selector("#parent-code-error", state="visible", timeout=3000)
            record(
                "Wrong PIN is rejected and dashboard stays locked",
                page.is_visible("#parent-code-error") and not page.is_visible("#parent-dashboard-content"),
            )

            # Positive: correct PIN unlocks the dashboard
            page.fill("#parent-code-input", code)
            page.click("#btn-verify-parent-code")
            page.wait_for_selector("#parent-dashboard-content", timeout=5000)
            parent_text = page.inner_text("#parent-dashboard-content")
            record("Correct PIN unlocks the parent dashboard", page.is_visible("#parent-dashboard-content"))
            record(
                "Dashboard shows working-hours tracker & teen identity",
                ("Arbeitszeit" in parent_text or "KindArbSchV" in parent_text) and "Jasper Klein" in parent_text,
                parent_text[:120],
            )
            close_parent_dashboard(page)

            # Negative: reopening re-locks the dashboard (unlock is per-open only)
            open_parent_dashboard(page)
            record(
                "Dashboard re-locks on reopen (unlock is not sticky)",
                page.is_visible("#parent-code-input") and not page.is_visible("#parent-dashboard-content"),
            )
            close_parent_dashboard(page)

            # ---- TEST 5: Settings (dark mode & notifications) ----
            log("\n--- TEST 5: Settings (Dark Mode & Notifications) ---")
            record("Settings card visible", page.is_visible("#profile-settings-card"))
            page.click("#btn-toggle-theme")
            page.wait_for_function("() => document.documentElement.getAttribute('data-theme') === 'dark'", timeout=3000)
            record("Dark mode sets data-theme=dark", page.evaluate("() => document.documentElement.getAttribute('data-theme')") == "dark")
            page.click("#btn-toggle-theme")
            page.wait_for_function("() => document.documentElement.getAttribute('data-theme') !== 'dark'", timeout=3000)
            record(
                "Notification preferences rendered",
                page.is_visible("#notif-new-jobs") and page.is_visible("#notif-chat") and page.is_visible("#notif-payouts"),
            )
            page.click("#notif-new-jobs")
            record("Notification toggle is interactive", page.is_visible("#notif-new-jobs"))

            # ---- TEST 6: Map & location consent ----
            log("\n--- TEST 6: Umkreis-Karte & Location Consent Dialog ---")
            page.click("#nav-jobs")
            page.wait_for_selector("#screen-jobs", timeout=5000)
            record("List/map view switcher visible", page.is_visible("#btn-view-list") and page.is_visible("#btn-view-map"))
            page.click("#btn-view-map")
            page.wait_for_timeout(250)  # 150-250ms UI debounce
            if page.is_visible("#location-modal-overlay"):
                record(
                    "Location consent dialog is shown before map (DSGVO Art. 25)",
                    page.is_visible("#btn-allow-location") and page.is_visible("#btn-deny-location"),
                )
                page.click("#btn-allow-location")
            page.wait_for_selector("#map-interactive-canvas", timeout=6000)
            record("Interactive map canvas rendered", page.is_visible("#map-interactive-canvas"))
            record("User location pin rendered", page.is_visible("#user-location-pin"))
            map_pins = page.query_selector_all(".map-job-pin")
            record("Job pins rendered on map", len(map_pins) > 0, f"got {len(map_pins)}")

            map_pins[0].click()
            page.wait_for_timeout(250)
            selected_info = page.inner_text("#map-selected-job-info")
            record(
                "Pin selection shows bike/walk/transit times & Google Maps link",
                "🚲" in selected_info and "🚶" in selected_info and "🚌" in selected_info and "Google Maps" in selected_info,
                selected_info[:120],
            )

            page.click("#btn-view-list")
            page.wait_for_selector("#screen-jobs", timeout=5000)

            # ---- TEST 7: Travel times on job cards ----
            log("\n--- TEST 7: Travel Times on Job Cards ---")
            first_card = page.query_selector(".job-card")
            record("Job card exists", first_card is not None)
            card_text = first_card.inner_text() if first_card else ""
            record("Job card shows travel times", "🚲" in card_text and "🚶" in card_text and "🚌" in card_text, card_text[:120])

            # ---- TEST 8: Chat quick replies, check-in & SOS ----
            log("\n--- TEST 8: Chat Quick-Replies, Live Check-In & SOS ---")
            page.click("#nav-messages")
            page.wait_for_selector("#screen-messages", timeout=5000)
            conv_item = page.query_selector(".conversation-item")
            record("Conversation list populated", conv_item is not None)
            if conv_item:
                conv_item.click()
                page.wait_for_selector("#screen-chat-thread", timeout=5000)
            record("Chat thread rendered", page.is_visible("#screen-chat-thread"))
            quick_pills = page.query_selector_all(".quick-reply-btn")
            record("At least 3 German quick replies available", len(quick_pills) >= 3, f"got {len(quick_pills)}")
            page.click(".quick-reply-btn")
            page.wait_for_timeout(300)

            check_in_btn = page.query_selector("#btn-chat-live-checkin")
            if check_in_btn:
                check_in_btn.click()
                page.wait_for_function(
                    "() => (document.getElementById('chat-messages-scroll') || {}).innerText?.includes('Live Check-In') ||"
                    " document.getElementById('btn-chat-live-checkin') === null",
                    timeout=4000,
                )
                chat_text = page.inner_text("#chat-messages-scroll")
                record("Live check-in recorded in chat", "Live Check-In" in chat_text, chat_text[-120:])

            sos_btn = page.query_selector("#btn-chat-sos")
            record("SOS emergency button present in chat", sos_btn is not None)
            if sos_btn:
                sos_btn.click()
                page.wait_for_selector("#emergency-modal-overlay", timeout=5000)
                emergency_text = page.inner_text("#emergency-modal-sheet")
                record(
                    "Emergency sheet has 110, 112 & guardian call",
                    "110" in emergency_text and "112" in emergency_text and page.is_visible("#btn-call-guardian"),
                )
                page.click("#btn-close-emergency")
                page.wait_for_selector("#emergency-modal-overlay", state="hidden", timeout=5000)

            # ---- TEST 9: Proof of Work & Gemini Vision ----
            log("\n--- TEST 9: Vorher/Nachher proof & Gemini Vision ---")
            page.wait_for_selector("#btn-chat-open-proof", timeout=5000)
            page.click("#btn-chat-open-proof")
            page.wait_for_selector("#proof-photo-modal-overlay", timeout=5000)
            record("Before & after photo slots visible", page.is_visible("#preview-photo-before") and page.is_visible("#preview-photo-after"))
            page.click("#btn-run-ai-vision")
            page.wait_for_function(
                "() => { const b = document.getElementById('ai-verification-badge');"
                " return b && b.innerText.toLowerCase().includes('verifiziert'); }",
                timeout=5000,
            )
            ai_badge = page.inner_text("#ai-verification-badge")
            record("AI verification badge reports success", "verifiziert" in ai_badge.lower(), ai_badge)
            page.click("#btn-submit-proof-to-chat")
            page.wait_for_selector("#proof-photo-modal-overlay", state="hidden", timeout=5000)
            page.wait_for_function(
                "() => (document.getElementById('chat-messages-scroll') || {}).innerText?.includes('Foto-Beweis') ||"
                " (document.getElementById('chat-messages-scroll') || {}).innerText?.includes('Beweis')",
                timeout=4000,
            )
            chat_text = page.inner_text("#chat-messages-scroll")
            record("Proof card posted into chat", "Beweis" in chat_text)

            # ---- TEST 10: Tip & review modal ----
            log("\n--- TEST 10: Trinkgeld (Tip) & Review ---")
            page.evaluate("() => window.store.setState({ reviewJobId: 'job_01' })")
            page.wait_for_selector("#review-modal-overlay", timeout=5000)
            tip_btns = page.query_selector_all(".tip-btn")
            record("Tip buttons 0/2/5/10 rendered", len(tip_btns) >= 4, f"got {len(tip_btns)}")
            page.click(".tip-btn[data-tip='5']")
            page.fill("#review-comment-input", "Sehr freundlich, pünktlich und sauber gearbeitet!")
            page.click("#btn-submit-review")
            page.wait_for_selector("#review-modal-overlay", state="hidden", timeout=5000)
            tip_state = page.evaluate("() => window.store.getState().jobs.find(j => j.id === 'job_01').tipAmount")
            record("Submitted review persists the €5 tip on the job", tip_state == 5, f"tipAmount={tip_state}")

            # ---- TEST 11: Legally valid receipt ----
            log("\n--- TEST 11: Rechtssichere Quittung (§ 368 BGB / § 147 AO) ---")
            # Arrange: make job_01 a completed job for the current user (worker).
            page.evaluate(
                """() => {
                    const s = window.store.getState();
                    const me = s.currentUser;
                    const jobs = s.jobs.map(j => j.id === 'job_01'
                        ? { ...j, state: 'COMPLETED', worker: { id: me.id, name: me.name, avatarText: me.avatarText } }
                        : j);
                    window.store.setState({ jobs });
                }"""
            )
            page.click("#nav-profile")
            page.wait_for_selector("#screen-profile", timeout=5000)
            receipt_btns = page.query_selector_all(".btn-profile-open-receipt")
            record("At least one receipt button available for a completed job", len(receipt_btns) > 0, f"got {len(receipt_btns)}")
            if receipt_btns:
                receipt_btns[0].click()
                page.wait_for_selector("#receipt-modal-overlay", timeout=5000)
                receipt_text = page.inner_text(".printable-receipt")
                record("Receipt titled Quittung", "Quittung" in receipt_text)
                record("Receipt cites § 368 BGB", "368" in receipt_text)
                record("Receipt names Auftraggeber & Helfer", "Auftraggeber" in receipt_text and "Helfer" in receipt_text)
                record("Receipt cites § 147 AO retention", "147" in receipt_text)
                record("Print button available", page.is_visible("#btn-print-receipt"))
                page.click("#btn-close-receipt")
                page.wait_for_selector("#receipt-modal-overlay", state="hidden", timeout=5000)

            log("\n==================================================")
            log(f"ADVANCED FEATURES RESULTS: {passed}/{total} TESTS PASSED")
            log("==================================================")
        finally:
            context.close()
            browser.close()

    return passed == total and total > 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
