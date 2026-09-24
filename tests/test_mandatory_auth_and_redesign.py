"""
Automated Verification Suite for:
1. Mandatory Authentication Gate (app blocked until login)
2. Removal of "switch job" button from header and profile
3. Redesigned "Konto & Sicherheit" section with large solid red logout button
4. Immediate return to login screen upon logout
"""
import os
import sys
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"
ARTIFACTS_DIR = r"C:\Users\Einrichtung\.gemini\antigravity-ide\brain\933bb828-f6a6-4a9a-86b1-320f11e84f57"


def log(msg):
    print(msg, flush=True)


def test_mandatory_auth_and_redesign():
    log("=====================================================================")
    log("STARTING MANDATORY AUTH GATE & KONTO SICHERHEIT REDESIGN TEST")
    log("=====================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 960})
        page = context.new_page()

        # ---------------------------------------------------------------------
        # 1. TEST INITIAL LOAD: UNCOMMITTED/UNAUTHENTICATED GATE
        # ---------------------------------------------------------------------
        log("\n[Test 1] Testing Mandatory Authentication Gate on initial load...")
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(500)

        # Clear any existing cookies/session to test fresh unauthenticated visitor
        context.clear_cookies()
        page.evaluate("() => { localStorage.clear(); store.resetAll(); }")
        page.wait_for_timeout(400)

        # Verify that Login Form is immediately and exclusively visible
        login_form = page.query_selector("#form-auth-login")
        assert login_form is not None, "Login form must be directly visible when unauthenticated!"

        # Verify bottom nav is NOT rendered when unauthenticated
        bottom_nav = page.query_selector("#bottom-nav")
        assert bottom_nav is None, "Bottom navigation must NOT be visible when unauthenticated!"

        # Verify 'switch job' button is removed from header
        mode_switch_btn = page.query_selector("#btn-mode-switch")
        assert mode_switch_btn is None, "Switch job button must NOT exist in header!"

        # Attempt unauthorized navigation to 'jobs' or 'profile' via store
        page.evaluate("() => store.setScreen('jobs')")
        page.wait_for_timeout(200)
        current_screen = page.evaluate("() => store.getState().currentScreen")
        assert current_screen == "auth", f"Unauthenticated navigation must redirect to 'auth', got '{current_screen}'"
        log("✓ PASS: Unauthenticated user is locked to login screen; bottom nav & switch job button absent.")

        # Capture login screen screenshot
        login_screenshot = os.path.join(ARTIFACTS_DIR, "mandatory_login_gate.png")
        page.screenshot(path=login_screenshot)
        log(f"✓ Screenshot saved: {login_screenshot}")

        # ---------------------------------------------------------------------
        # 2. TEST LOGIN & FEATURE UNLOCK
        # ---------------------------------------------------------------------
        log("\n[Test 2] Logging in as Jasper Klein...")
        page.fill("#login-email", "jasper@quickjob.local")
        page.fill("#login-password", "Password123!")
        page.click("#btn-auth-submit-login")
        page.wait_for_function("() => window.store && window.store.getState().isAuthenticated === true", timeout=8000)

        # Verify app features unlocked: Home screen and Bottom Navigation appear
        is_auth = page.evaluate("() => store.getState().isAuthenticated")
        assert is_auth is True, "User should now be authenticated"

        bottom_nav = page.query_selector("#bottom-nav")
        assert bottom_nav is not None, "Bottom navigation must appear after login!"

        home_greeting = page.query_selector(".home-greeting")
        assert home_greeting is not None, "Home screen greeting should appear after login"
        log("✓ PASS: Successful authentication unlocks home screen and navigation.")

        # Dismiss consent banner if displayed so pointer events aren't intercepted
        consent_btn = page.query_selector("#btn-consent-accept-all")
        if consent_btn:
            consent_btn.click()
            page.wait_for_timeout(300)

        # ---------------------------------------------------------------------
        # 3. TEST REDESIGNED KONTO & SICHERHEIT SECTION IN PROFILE
        # ---------------------------------------------------------------------
        log("\n[Test 3] Inspecting redesigned 'Konto & Sicherheit' card in profile...")
        page.wait_for_selector("#nav-profile", timeout=8000)
        page.click("#nav-profile")
        page.wait_for_timeout(400)

        profile_auth_card = page.query_selector("#profile-auth-card")
        assert profile_auth_card is not None, "Konto & Sicherheit card must exist in profile"

        card_text = profile_auth_card.inner_text()
        assert "Konto & Sicherheit" in card_text, "Title must be present"
        assert "jasper@quickjob.local" in card_text, "Logged in user email must be shown"
        assert "E-Mail verifiziert" in card_text, "Email verification badge must be shown"
        assert "Passwort ändern" in card_text, "Password change accordion must exist"

        # Check logout button style: solid red and large
        logout_btn = page.query_selector("#btn-profile-logout")
        assert logout_btn is not None, "Logout button must exist"
        btn_text = logout_btn.inner_text()
        assert "Abmelden" in btn_text, f"Logout button should say 'Abmelden', got '{btn_text}'"

        # Evaluate computed styles
        bg_style = page.evaluate("() => window.getComputedStyle(document.getElementById('btn-profile-logout')).backgroundColor")
        color_style = page.evaluate("() => window.getComputedStyle(document.getElementById('btn-profile-logout')).color")
        font_size = page.evaluate("() => window.getComputedStyle(document.getElementById('btn-profile-logout')).fontSize")
        font_weight = page.evaluate("() => window.getComputedStyle(document.getElementById('btn-profile-logout')).fontWeight")
        width = page.evaluate("() => document.getElementById('btn-profile-logout').offsetWidth")
        card_width = page.evaluate("() => document.getElementById('profile-auth-card').offsetWidth")

        log(f"  Logout button computed styles:")
        log(f"  - background-color: {bg_style}")
        log(f"  - color: {color_style}")
        log(f"  - font-size: {font_size}")
        log(f"  - font-weight: {font_weight}")
        log(f"  - width: {width}px (card width: {card_width}px)")

        # Red background check: rgb(220, 38, 38) is #dc2626 or rgb(239, 68, 68) is #ef4444
        assert "rgb(220, 38, 38)" in bg_style or "rgb(239, 68, 68)" in bg_style or "linear-gradient" in bg_style, f"Button must be red, got '{bg_style}'"
        assert "rgb(255, 255, 255)" in color_style, "Text color must be white on red background"
        assert width >= card_width * 0.85, f"Logout button should span full width of card, got {width}px"

        # Verify switch job button is NOT present in profile
        profile_toggle_mode = page.query_selector("#btn-profile-toggle-mode")
        assert profile_toggle_mode is None, "Switch job button must NOT exist in profile screen!"

        profile_screenshot = os.path.join(ARTIFACTS_DIR, "redesigned_konto_sicherheit.png")
        page.screenshot(path=profile_screenshot)
        log(f"✓ Screenshot saved: {profile_screenshot}")
        log("✓ PASS: 'Konto & Sicherheit' card redesigned; logout button is solid red, large, and full-width.")

        # ---------------------------------------------------------------------
        # 4. TEST LOGOUT -> DIRECT REDIRECTION TO LOGIN SCREEN
        # ---------------------------------------------------------------------
        log("\n[Test 4] Clicking 'Abmelden' button...")
        page.click("#btn-profile-logout")
        page.wait_for_timeout(600)

        # Verify state is unauthenticated and current screen is directly auth / login
        is_auth_post = page.evaluate("() => store.getState().isAuthenticated")
        assert is_auth_post is False, "User should be unauthenticated after logout"

        login_form_post = page.query_selector("#form-auth-login")
        assert login_form_post is not None, "Login form must appear immediately upon logout!"

        bottom_nav_post = page.query_selector("#bottom-nav")
        assert bottom_nav_post is None, "Bottom navigation must be hidden immediately upon logout!"

        logout_screenshot = os.path.join(ARTIFACTS_DIR, "post_logout_login_screen.png")
        page.screenshot(path=logout_screenshot)
        log(f"✓ Screenshot saved: {logout_screenshot}")
        log("✓ PASS: Logging out immediately displays the login screen.")

        log("\n=====================================================================")
        log("ALL MANDATORY AUTH & REDESIGN TESTS PASSED SUCCESSFULLY (100%)")
        log("=====================================================================")


if __name__ == "__main__":
    test_mandatory_auth_and_redesign()
