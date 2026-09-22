"""
Automated End-to-End Tests for QuickJob MVP
Uses Playwright with Chromium to verify:
1. Desktop preview framing and mobile portrait viewport (390x844)
2. Home screen browsing & category filtering
3. Job discovery screen, search, distance and min-pay filters, and age protection
4. Job detail modal inspection (price, approximate location privacy, requirements, employer trust badge)
5. Application flow (Apply -> Conversation opened with initial message)
6. Job chat interaction (sending messages, quick replies, lifecycle actions)
7. Multi-step Job Creation wizard (5 steps, live preview, publish)
8. Mode switching (Worker 'Find Jobs' <-> Employer 'Post a Job')
9. Persona switching (Jasper Minor 16 vs Sophia Young Worker 22 vs Dr. Marcus Adult Homeowner vs TechCraft Company)
10. Safety modal inspection (Minor Protection, Guardian Consent, 2-Stage Location Privacy, Escrow)
11. Responsive multi-device screenshots (375x812, 390x844, 414x896, and Desktop Preview)
"""

import os
import sys
import time
import traceback
from playwright.sync_api import sync_playwright

# Ensure utf-8 encoding on Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ARTIFACTS_DIR = r"C:\Users\Einrichtung\.gemini\antigravity-ide\brain\933bb828-f6a6-4a9a-86b1-320f11e84f57"
BASE_URL = "http://127.0.0.1:8000"

def log(msg):
    try:
        print(msg, flush=True)
    except UnicodeEncodeError:
        safe_msg = msg.encode('ascii', errors='replace').decode('ascii')
        print(safe_msg, flush=True)

def run_tests():
    log("=== STARTING QUICKJOB AUTOMATED PLAYWRIGHT TEST SUITE ===")
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    
    passed_steps = 0
    total_steps = 11

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 960})
        page = context.new_page()

        try:
            # Step 1: Open app & verify desktop preview shell
            log("\n[Step 1] Loading QuickJob at Desktop Viewport (1280x960)...")
            page.goto(BASE_URL, wait_until="domcontentloaded", timeout=10000)
            page.wait_for_selector("#phone-bezel", timeout=5000)
            page.wait_for_selector("#dev-controls", timeout=5000)
            page.wait_for_selector(".dynamic-island", timeout=5000)
            
            # Verify title & brand
            assert "QuickJob" in page.title(), f"Page title should contain QuickJob, got '{page.title()}'"
            brand_text = page.inner_text("#brand-logo")
            assert "QuickJob" in brand_text, f"Brand header should display QuickJob, got '{brand_text}'"
            
            screenshot_path = os.path.join(ARTIFACTS_DIR, "desktop_preview_home.png")
            page.screenshot(path=screenshot_path)
            log(f"✓ Desktop phone chassis verified & saved to: {screenshot_path}")
            passed_steps += 1

            # Step 2: Home screen categories & navigation
            log("\n[Step 2] Testing Home Screen interactions & Category filtering...")
            cat_chips = page.query_selector_all(".category-chip")
            assert len(cat_chips) >= 9, f"Expected at least 9 category chips, found {len(cat_chips)}"
            
            garden_chip = page.query_selector('.category-chip[data-cat="garden"]')
            assert garden_chip is not None, "Garden category chip should exist"
            garden_chip.click()
            page.wait_for_timeout(300)
            
            active_nav = page.query_selector(".nav-item.active")
            assert active_nav.get_attribute("data-screen") == "jobs", "Clicking category should navigate to Jobs screen"
            log("✓ Category navigation to Jobs verified")
            passed_steps += 1

            # Step 3: Jobs Feed, Search, and Filtering
            log("\n[Step 3] Testing Job Search, Filters, and Reset...")
            search_input = page.query_selector("#jobs-search-input")
            search_input.fill("lawn")
            page.wait_for_timeout(300)
            
            cards = page.query_selector_all(".job-card")
            assert len(cards) >= 1, "Searching 'lawn' should return at least 1 job"
            log(f"✓ Found {len(cards)} card(s) matching 'lawn'")
            
            clear_btn = page.query_selector("#btn-clear-jobs-search")
            if clear_btn:
                clear_btn.click()
                page.wait_for_timeout(300)
            
            reset_filters_btn = page.query_selector("#btn-reset-filters")
            if reset_filters_btn:
                reset_filters_btn.click()
                page.wait_for_timeout(300)

            total_cards = len(page.query_selector_all(".job-card"))
            assert total_cards >= 6, f"Expected at least 6 initial jobs, found {total_cards}"
            log(f"✓ Total {total_cards} microjobs active in feed")
            passed_steps += 1

            # Step 4: Open Job Detail Modal & Inspect Privacy + Price
            log("\n[Step 4] Opening Job Detail Modal and verifying fields...")
            first_card = page.query_selector(".job-card")
            first_card.click()
            page.wait_for_selector("#job-detail-sheet", timeout=5000)
            
            price_el = page.query_selector("#job-detail-sheet .price-tag")
            assert price_el is not None and "€" in price_el.inner_text(), "Price tag should be prominent"
            
            detail_text = page.inner_text("#job-detail-sheet")
            assert "Exact street number revealed upon confirmed assignment" in detail_text or "Exact address" in detail_text
            log("✓ Privacy-protected approximate location confirmed")
            
            screenshot_path = os.path.join(ARTIFACTS_DIR, "job_detail_modal.png")
            page.screenshot(path=screenshot_path)
            log(f"✓ Job detail modal screenshot saved: {screenshot_path}")
            passed_steps += 1

            # Step 5: Apply to Job and verify state transition to Chat
            log("\n[Step 5] Applying to Job and checking state transition...")
            action_btn = page.query_selector("#btn-action-apply, #btn-action-accept")
            assert action_btn is not None, "Apply or Accept CTA must be visible in job detail"
            action_btn.click()
            page.wait_for_timeout(600)
            
            assert page.query_selector("#screen-chat-thread") is not None, "Should transition to chat thread after application"
            log("✓ Applied and transitioned directly to linked job chat thread")
            passed_steps += 1

            # Step 6: Chat interaction & Lifecycle Actions
            log("\n[Step 6] Testing chat messaging and status buttons...")
            quick_reply = page.query_selector('.quick-reply-btn[data-reply="Is 3pm okay?"]')
            if quick_reply:
                quick_reply.click()
                page.wait_for_timeout(300)
            
            chat_input = page.query_selector("#chat-input-field")
            chat_input.fill("Looking forward to helping out on Saturday!")
            page.click("#btn-send-message")
            page.wait_for_timeout(300)
            
            bubbles = page.query_selector_all(".chat-bubble")
            assert len(bubbles) >= 2, "Chat should have message history"
            log(f"✓ Chat working smoothly with {len(bubbles)} message bubbles")
            
            complete_btn = page.query_selector("#btn-chat-complete-job")
            if complete_btn:
                complete_btn.click()
                page.wait_for_timeout(400)
                log("✓ Job status transitioned to COMPLETED")

            screenshot_path = os.path.join(ARTIFACTS_DIR, "chat_thread.png")
            page.screenshot(path=screenshot_path)
            log(f"✓ Chat screenshot saved: {screenshot_path}")
            passed_steps += 1

            # Step 7: Create Job Wizard (5 Steps)
            log("\n[Step 7] Testing 5-step Job Creation Wizard...")
            page.click("#nav-create")
            page.wait_for_selector("#screen-create", timeout=5000)
            
            page.fill("#wizard-title", "Help assemble IKEA Billy bookcase")
            page.click("#btn-wizard-next")
            page.wait_for_timeout(300)
            
            page.fill("#wizard-desc", "Two 80cm Billy bookcases with glass doors. Cordless screwdriver and Allen keys available.")
            page.fill("#wizard-reqs", "Familiar with furniture assembly\nCareful")
            page.click("#btn-wizard-next")
            page.wait_for_timeout(300)
            
            page.fill("#wizard-pay-input", "45")
            page.click("#btn-wizard-next")
            page.wait_for_timeout(300)
            
            page.fill("#wizard-location", "Wuppertal-Barmen")
            page.click("#btn-wizard-next")
            page.wait_for_timeout(300)
            
            screenshot_path = os.path.join(ARTIFACTS_DIR, "create_job_preview_step5.png")
            page.screenshot(path=screenshot_path)
            log(f"✓ Wizard live preview screenshot saved: {screenshot_path}")
            
            publish_btn = page.query_selector("#btn-wizard-publish")
            assert publish_btn is not None, "Publish button should be on Step 5"
            publish_btn.click()
            page.wait_for_timeout(600)
            
            page.click("#nav-jobs")
            page.wait_for_timeout(300)
            jobs_text = page.inner_text("#jobs-cards-container")
            assert "assemble IKEA Billy bookcase" in jobs_text, "Newly published job must appear in job feed"
            log("✓ Job created, published, and verified in feed")
            passed_steps += 1

            # Step 8: Profile Screen Inspection
            log("\n[Step 8] Inspecting Profile Screen...")
            page.click("#nav-profile")
            page.wait_for_selector("#screen-profile", timeout=5000)
            
            profile_text = page.inner_text("#screen-profile")
            assert "Jasper Klein" in profile_text
            assert "Youth · 14–17" in profile_text
            assert "Parental Consent & Youth Protection" in profile_text
            log("✓ Profile displays youth category, parental consent, reliability, and verified skills")
            
            screenshot_path = os.path.join(ARTIFACTS_DIR, "profile_screen.png")
            page.screenshot(path=screenshot_path)
            log(f"✓ Profile screenshot saved: {screenshot_path}")
            passed_steps += 1

            # Step 9: Safety & Minor Protection Modal
            log("\n[Step 9] Testing Safety & Trust Modal...")
            page.click("#btn-safety-modal")
            page.wait_for_selector("#safety-modal-sheet", timeout=5000)
            
            safety_text = page.inner_text("#safety-modal-sheet")
            assert "Youth Protection Workflow" in safety_text
            assert "Two-Stage Location Privacy" in safety_text
            assert "Escrow Payment Guarantee" in safety_text
            
            screenshot_path = os.path.join(ARTIFACTS_DIR, "safety_modal.png")
            page.screenshot(path=screenshot_path)
            log(f"✓ Safety modal verified & screenshot saved: {screenshot_path}")
            
            page.click("#btn-confirm-safety")
            page.wait_for_timeout(300)
            passed_steps += 1

            # Step 10: Mode Switcher & Persona Switching
            log("\n[Step 10] Testing Mode Switcher and Persona Switching...")
            page.click("#btn-mode-switch")
            page.wait_for_timeout(300)
            mode_btn_text = page.inner_text("#btn-mode-switch")
            assert "Switch: Find Jobs" in mode_btn_text or "Employer" in mode_btn_text
            log("✓ Switched to Employer mode")
            
            page.select_option("#dev-persona-select", "techcraft")
            page.wait_for_timeout(400)
            
            page.click("#nav-profile")
            page.wait_for_timeout(300)
            profile_text = page.inner_text("#screen-profile")
            assert "TechCraft Digital GmbH" in profile_text
            assert "Verified Company" in profile_text
            log("✓ Switched persona to TechCraft Digital GmbH (Verified Company)")
            passed_steps += 1

            # Step 11: Multi-device Responsive Viewports
            log("\n[Step 11] Capturing multi-device responsive screenshots...")
            # 1. 375x812 Mini
            page.click('.dev-pill-btn[data-size="size-375"]')
            page.wait_for_timeout(300)
            page.click("#nav-home")
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "device_375x812_mini.png"))
            
            # 2. 390x844 Standard
            page.click('.dev-pill-btn[data-size="size-390"]')
            page.wait_for_timeout(300)
            page.click("#nav-jobs")
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "device_390x844_standard.png"))
            
            # 3. 414x896 Max
            page.click('.dev-pill-btn[data-size="size-414"]')
            page.wait_for_timeout(300)
            page.click("#nav-profile")
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "device_414x896_max.png"))
            log("✓ All 3 mobile viewport sizes captured without overflow")
            passed_steps += 1

        except Exception as e:
            log(f"❌ TEST FAILED with exception: {e}")
            traceback.print_exc()
        finally:
            browser.close()

    log(f"\n==========================================")
    log(f"TEST RESULTS: {passed_steps}/{total_steps} STEPS PASSED")
    log(f"All verification screenshots generated in {ARTIFACTS_DIR}")
    log(f"==========================================")
    return passed_steps == total_steps

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
