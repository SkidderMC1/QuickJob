"""
Capture comprehensive high-resolution screenshots of all EasyJob UI screens
and navigation flows for UI evaluation report.
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8000"
ARTIFACT_DIR = os.environ.get("ARTIFACT_DIR", r"C:\Users\Einrichtung\.gemini\antigravity\brain\d3c76e63-f3ac-4cd0-a65d-af8202b7d2ee")

def dismiss_consent(page):
    try:
        btn = page.locator("#btn-consent-accept-all")
        if btn.is_visible(timeout=1000):
            btn.click()
    except Exception:
        pass

def run():
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport standard 390x844 (iPhone 14 / modern flagship) with 2x retina scale
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            permissions=["geolocation"],
            geolocation={"latitude": 51.2562, "longitude": 7.1508}
        )
        page = context.new_page()

        # 1. Login Screen (Unauthenticated Gate)
        page.goto(f"{BASE_URL}/?mode=app", wait_until="networkidle")
        dismiss_consent(page)
        page.wait_for_selector("#form-auth-login", state="visible")
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "01_ui_login_screen.png"))
        print("Captured 01_ui_login_screen.png")

        # 2. Registration Screen with Avatar Picker
        page.click("#btn-to-register")
        page.wait_for_selector("#form-auth-register", state="visible")
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "02_ui_register_screen.png"))
        print("Captured 02_ui_register_screen.png")

        # 3. Authenticate as Jasper (Youth Worker persona) -> Home Screen
        page.click("#btn-to-login")
        page.wait_for_selector("#form-auth-login", state="visible")
        page.click("button[data-email='jasper@quickjob.local']")
        page.click("#btn-auth-submit-login")
        page.wait_for_selector("#screen-home", state="visible")
        dismiss_consent(page)
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "03_ui_home_screen.png"))
        print("Captured 03_ui_home_screen.png")

        # 4. Jobs Feed Screen (List View with Category Pills & Segmented Tabs)
        page.click("#nav-jobs")
        page.wait_for_selector("#screen-jobs", state="visible")
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "04_ui_jobs_feed.png"))
        print("Captured 04_ui_jobs_feed.png")

        # 5. Dedicated Standalone Map Screen
        page.click("#nav-map")
        page.wait_for_selector("#screen-map", state="visible")
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "05_ui_map_screen.png"))
        print("Captured 05_ui_map_screen.png")

        # 5b. Map Pin Clicked (with bottom drawer preview)
        pin = page.locator("#screen-map .map-job-pin").first
        if pin.is_visible():
            pin.click(force=True)
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(ARTIFACT_DIR, "05b_ui_map_with_drawer.png"))
            print("Captured 05b_ui_map_with_drawer.png")

        # 6. Job Detail Modal
        page.click("#nav-jobs")
        page.wait_for_selector("#screen-jobs", state="visible")
        page.locator(".job-card").first.click()
        page.wait_for_selector("#job-detail-sheet", state="visible")
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "06_ui_job_detail_modal.png"))
        print("Captured 06_ui_job_detail_modal.png")

        # Close detail modal
        page.click("#btn-close-detail")
        page.wait_for_timeout(300)

        # 7. Create Job Screen
        page.click("#nav-create")
        page.wait_for_selector("#screen-create", state="visible")
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "07_ui_create_job.png"))
        print("Captured 07_ui_create_job.png")

        # 8. Messages / Chat Screen
        page.click("#nav-messages")
        page.wait_for_selector("#screen-messages", state="visible")
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "08_ui_messages_screen.png"))
        print("Captured 08_ui_messages_screen.png")

        # 9. Profile & Settings Screen (Youth Badge, Wallet Card, Avatar Setup)
        page.click("#nav-profile")
        page.wait_for_selector("#screen-profile", state="visible")
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "09_ui_profile_screen.png"))
        print("Captured 09_ui_profile_screen.png")

        # 10. Switch to Admin Persona -> Admin Dashboard Screen
        page.evaluate("() => store.logoutUser()")
        page.wait_for_selector("#form-auth-login", state="visible")
        dismiss_consent(page)
        page.click("button[data-email='admin@quickjob.local']")
        page.click("#btn-auth-submit-login")
        page.wait_for_selector("#screen-admin", state="visible")
        dismiss_consent(page)
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "10_ui_admin_dashboard.png"))
        print("Captured 10_ui_admin_dashboard.png")

        # 11. Admin Report Detail Modal
        report_card = page.locator(".admin-report-card").first
        if report_card.is_visible():
            report_card.click()
            page.wait_for_selector("#admin-report-modal", state="visible")
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(ARTIFACT_DIR, "11_ui_admin_report_detail.png"))
            print("Captured 11_ui_admin_report_detail.png")

        browser.close()
        print("All UI screenshots successfully captured!")

if __name__ == "__main__":
    run()
