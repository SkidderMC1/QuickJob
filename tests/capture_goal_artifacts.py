"""
Script to capture visual artifacts for all goal deliverables.
"""
import os
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8000"
ARTIFACT_DIR = r"C:\Users\Einrichtung\.gemini\antigravity-ide\brain\933bb828-f6a6-4a9a-86b1-320f11e84f57"

def dismiss_consent(page):
    try:
        btn = page.locator("#btn-consent-accept-all")
        if btn.is_visible(timeout=1000):
            btn.click()
    except Exception:
        pass

def capture_all():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 414, "height": 896}, device_scale_factor=2)
        page = context.new_page()

        # 1. Registration screen with avatar upload
        page.goto(BASE_URL, wait_until="domcontentloaded")
        dismiss_consent(page)
        page.click("#btn-to-register")
        page.wait_for_selector("#form-auth-register", state="visible")
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "goal_registration_avatar.png"))
        print("Captured goal_registration_avatar.png")

        # 2. Login as Jasper (Youth user) -> Home screen
        page.click("#btn-to-login")
        page.wait_for_selector("#form-auth-login", state="visible")
        page.click("button[data-email='jasper@quickjob.local']")
        page.click("#btn-auth-submit-login")
        page.wait_for_selector("#screen-home", state="visible")
        dismiss_consent(page)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "goal_home_clean_header.png"))
        print("Captured goal_home_clean_header.png")

        # 3. Settings / Profile Screen (Youth badge & avatar setup)
        page.click("#nav-profile")
        page.wait_for_selector("#screen-profile", state="visible")
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "goal_profile_youth_and_avatar.png"))
        print("Captured goal_profile_youth_and_avatar.png")

        # 4. Standalone Map Screen
        page.click("#nav-map")
        page.wait_for_selector("#screen-map", state="visible")
        # Click a pin to show drawer preview
        first_pin = page.locator("#screen-map .map-job-pin").first
        first_pin.click(force=True)
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "goal_standalone_map.png"))
        print("Captured goal_standalone_map.png")

        # 5. Logout and Login as Admin
        page.evaluate("() => store.logoutUser()")
        page.wait_for_selector("#form-auth-login", state="visible")
        dismiss_consent(page)

        page.click("button[data-email='admin@quickjob.local']")
        page.click("#btn-auth-submit-login")
        page.wait_for_selector("#screen-admin", state="visible")
        dismiss_consent(page)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "goal_admin_dashboard.png"))
        print("Captured goal_admin_dashboard.png")

        # 6. Admin Report Details Modal
        page.locator(".admin-report-card").first.click()
        page.wait_for_selector("#admin-report-modal", state="visible")
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "goal_admin_report_detail.png"))
        print("Captured goal_admin_report_detail.png")

        browser.close()

if __name__ == "__main__":
    capture_all()
