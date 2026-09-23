import os
import sys
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ARTIFACTS_DIR = r"C:\Users\Einrichtung\.gemini\antigravity-ide\brain\933bb828-f6a6-4a9a-86b1-320f11e84f57"
BASE_URL = "http://127.0.0.1:8000"

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 960})
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(600)

        # 1. Login screen
        page.evaluate("() => store.setAuthMode('login')")
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACTS_DIR, "auth_login_screen.png"))
        print("[OK] auth_login_screen.png saved")

        # 2. Register screen
        page.evaluate("() => store.setAuthMode('register')")
        page.wait_for_timeout(600)
        page.fill("#reg-age", "16")
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(ARTIFACTS_DIR, "auth_register_screen.png"))
        print("[OK] auth_register_screen.png saved")

        # 3. Log in as Jasper & Capture Profile Screen with Account & Security Card
        page.evaluate("async () => await store.loginUser('jasper@quickjob.local', 'Password123!')")
        page.wait_for_timeout(1000)
        page.evaluate("() => store.setScreen('profile')")
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(ARTIFACTS_DIR, "auth_profile_screen.png"))
        print("[OK] auth_profile_screen.png saved")

        browser.close()

if __name__ == "__main__":
    capture()
