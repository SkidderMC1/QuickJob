"""
End-to-End Test Suite for QuickJob Goal Requirements:
1. Header avatar shows only initial letter or profile picture (no security/map icons in top right, no name text).
2. Profile picture setup during registration and in settings.
3. Admin Panel visible on admin login with KPI stats, reported users list, profile drawer, report reasons, and moderation actions.
4. Youth 14-17 badge only in Settings/Profile, not on Home.
5. Search bar debounces 3s, triggers on Enter and blur without losing focus after every character.
6. Map screen is dedicated standalone map without jobs feed copy.
"""
import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8000"


def dismiss_consent(page):
    try:
        consent_btn = page.locator("#btn-consent-accept-all")
        if consent_btn.is_visible(timeout=1000):
            consent_btn.click()
    except Exception:
        pass


def test_header_avatar_and_no_top_right_icons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 414, "height": 896})
        page.goto(BASE_URL, wait_until="domcontentloaded")
        dismiss_consent(page)

        # Login as Jasper
        page.wait_for_selector("#form-auth-login", state="visible")
        page.click("button[data-email='jasper@quickjob.local']")
        page.click("#btn-auth-submit-login")
        page.wait_for_selector("#screen-home", state="visible")
        dismiss_consent(page)

        # 1. Check header avatar: only circular avatar with letter or picture
        profile_btn = page.locator("#btn-header-profile")
        assert profile_btn.is_visible(), "Profile avatar button must be visible in header"

        # Check there is NO visible security icon or map icon in top right
        visible_header_btns = page.locator(".app-header button:visible").all()
        assert len(visible_header_btns) == 1, f"Expected only 1 visible button in header (avatar), found {len(visible_header_btns)}"
        assert visible_header_btns[0].get_attribute("id") == "btn-header-profile"

        # Avatar shows initial letter 'J'
        avatar_letter = page.locator("#header-user-avatar-letter")
        if avatar_letter.is_visible():
            assert avatar_letter.inner_text().strip() == "J"

        # Check no user name text is shown next to avatar
        assert page.locator(".header-user-name").count() == 0, "No username text should be displayed next to avatar"

        # 2. Check Youth badge is NOT on Home screen
        assert page.locator("#screen-home .home-greeting-section .badge").count() == 0, "Youth badge must NOT be on Home screen"

        # 3. Check Youth badge IS in Settings / Profile
        page.click("#nav-profile")
        page.wait_for_selector("#screen-profile", state="visible")
        badge = page.locator("#profile-age-category-badge")
        assert badge.is_visible()
        assert "14" in badge.inner_text() or "Youth" in badge.inner_text() or "Jugend" in badge.inner_text()

        # Check profile avatar also shows letter 'J' and camera upload trigger
        prof_letter = page.locator("#profile-avatar-letter")
        assert prof_letter.is_visible()
        assert prof_letter.inner_text().strip() == "J"
        assert page.locator("#profile-avatar-change-btn").is_visible()
        assert page.locator("#profile-avatar-file-input").count() == 1

        browser.close()


def test_search_debounce_and_no_premature_refresh():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 414, "height": 896})
        page.goto(BASE_URL, wait_until="domcontentloaded")
        dismiss_consent(page)

        # Login
        page.wait_for_selector("#form-auth-login", state="visible")
        page.click("button[data-email='jasper@quickjob.local']")
        page.click("#btn-auth-submit-login")
        page.wait_for_selector("#screen-home", state="visible")
        dismiss_consent(page)

        # Type multiple characters into search bar
        search_input = page.locator("#home-search-input")
        search_input.click()
        search_input.type("Garten", delay=50)

        # Value must remain 'Garten' without input destruction or focus loss
        assert search_input.input_value() == "Garten"
        assert search_input.evaluate("el => document.activeElement === el"), "Search input should retain focus while typing"

        # Press Enter: triggers search and navigation to jobs feed
        search_input.press("Enter")
        page.wait_for_selector("#screen-jobs", state="visible")
        jobs_search = page.locator("#jobs-search-input")
        assert jobs_search.input_value() == "Garten"

        browser.close()


def test_dedicated_standalone_map_screen():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 414, "height": 896})
        page.goto(BASE_URL, wait_until="domcontentloaded")
        dismiss_consent(page)

        # Login
        page.wait_for_selector("#form-auth-login", state="visible")
        page.click("button[data-email='jasper@quickjob.local']")
        page.click("#btn-auth-submit-login")
        page.wait_for_selector("#screen-home", state="visible")
        dismiss_consent(page)

        # Click Karte in bottom nav
        page.click("#nav-map")
        page.wait_for_selector("#screen-map", state="visible")

        # Must be dedicated map screen, NOT a copy of jobs screen
        assert page.locator("#screen-map #map-interactive-canvas").is_visible()
        assert page.locator("#screen-map #user-location-pin").is_visible()
        assert page.locator("#screen-map .map-floating-top-bar").is_visible()
        assert page.locator("#screen-map .map-job-pin").count() > 0

        # Must NOT contain category filter pills or feed segmented control
        assert page.locator("#screen-map #jobs-segment-control").count() == 0, "Map screen must NOT contain job feed tabs"
        assert page.locator("#screen-map .quick-filter-pills").count() == 0, "Map screen must NOT contain job quick filter pills"

        # Clicking a job pin opens the bottom drawer preview
        first_pin = page.locator("#screen-map .map-job-pin").first
        first_pin.click(force=True)
        detail_btn = page.locator("#btn-map-open-job-detail")
        assert detail_btn.is_visible()

        browser.close()


def test_admin_panel_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 414, "height": 896})
        page.goto(BASE_URL, wait_until="domcontentloaded")
        dismiss_consent(page)

        # 1. Login with Admin credentials
        page.wait_for_selector("#form-auth-login", state="visible")
        admin_pill = page.locator("button[data-email='admin@quickjob.local']")
        assert admin_pill.is_visible(), "Admin 1-click test button must exist"
        admin_pill.click()
        page.click("#btn-auth-submit-login")

        # 2. Admin Panel screen must be visible
        page.wait_for_selector("#screen-admin", state="visible")
        dismiss_consent(page)

        # 3. Check KPI statistics
        assert page.locator("#stat-total-users").is_visible()
        assert page.locator("#stat-pending-reports").is_visible()
        assert page.locator("#stat-escrow-volume").is_visible()
        assert page.locator("#stat-kyc-rate").is_visible()

        # 4. Check reported users list
        reports_list = page.locator("#admin-reports-list")
        assert reports_list.is_visible()
        assert page.locator(".admin-report-card").count() >= 3

        # First reported user should be Kevin Breuer
        reports_text_lower = reports_list.inner_text().lower()
        assert "kevin breuer" in reports_text_lower
        assert "jugendschutz" in reports_text_lower or "verstoss" in reports_text_lower

        # 5. Click on reported user card to open profile & report modal
        page.locator(".admin-report-card").first.click()
        page.wait_for_selector("#admin-report-modal", state="visible")

        # Check full profile details in modal
        modal = page.locator("#admin-report-modal")
        modal_text_lower = modal.inner_text().lower()
        assert "kevin breuer" in modal_text_lower
        assert "@kevin_b" in modal_text_lower
        assert "bewertung" in modal_text_lower
        assert "erledigte jobs" in modal_text_lower
        assert "zuverlässigkeit" in modal_text_lower or "zuverl" in modal_text_lower

        # Check report reason & accusation details
        assert "jugendschutz" in modal_text_lower
        assert "chatverlauf" in modal_text_lower

        # Check moderation action buttons
        warn_btn = page.locator("#btn-admin-warn-user")
        ban_btn = page.locator("#btn-admin-ban-user")
        resolve_btn = page.locator("#btn-admin-resolve-report")
        dismiss_btn = page.locator("#btn-admin-dismiss-report")

        assert warn_btn.is_visible()
        assert ban_btn.is_visible()
        assert resolve_btn.is_visible()
        assert dismiss_btn.is_visible()

        # Test taking action: Warn user
        warn_btn.click()
        page.wait_for_selector("#admin-report-modal", state="hidden")

        # 6. Check User Directory tab
        page.click("#admin-tab-btn-users")
        page.wait_for_selector("#admin-section-users", state="visible")
        assert page.locator("#admin-users-list").is_visible()
        assert page.locator(".btn-admin-toggle-ban").count() > 0

        # Search user in directory
        page.fill("#admin-search-users-input", "Sophia")
        assert "Sophia Weber" in page.locator("#admin-users-list").inner_text()

        # 7. Check bottom nav has Admin tab active
        nav_admin = page.locator("#nav-admin")
        assert nav_admin.is_visible()
        assert "Admin" in nav_admin.inner_text()

        browser.close()


def test_registration_avatar_support():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 414, "height": 896})
        page.goto(BASE_URL, wait_until="domcontentloaded")
        dismiss_consent(page)

        # Switch to register mode
        page.click("#btn-to-register")
        page.wait_for_selector("#form-auth-register", state="visible")

        # Check avatar preview circle and file upload input
        assert page.locator("#reg-avatar-preview").is_visible()
        assert page.locator("#reg-avatar-input").count() == 1

        browser.close()

