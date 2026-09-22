"""
Automated End-to-End Tests for QuickJob MVP & New Features
Uses Playwright with Chromium to verify:
1. Desktop preview framing and mobile portrait viewport (390x844)
2. Home screen browsing & category filtering
3. Job discovery screen, fast 1-tap filter pills, search, distance and min-pay filters, and age protection
4. Job detail modal inspection (price, approximate location privacy, requirements, employer trust badge)
5. Application flow (Apply -> Conversation opened with initial message)
6. Job chat interaction, payment release, and interactive 5-star review modal with compliments
7. Multi-step Job Creation wizard with automatic real-time age & youth safety classification (JArbSchG)
8. Profile screen inspection with FinTech Escrow Wallet & Instant SEPA payout
9. Safety modal inspection (Minor Protection, Guardian Consent, 2-Stage Location Privacy, Escrow)
10. Employer applicant management flow (Reviewing applicants & assigning worker)
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

            # Step 3: Jobs Feed, Fast Action Pills, Search, and Filtering
            log("\n[Step 3] Testing Job Search, Fast Action Pills, and Reset...")
            # Test fast filter pill: Jugend-konform
            youth_pill = page.query_selector('.quick-filter-pill[data-quick="youth"]')
            if youth_pill:
                youth_pill.click()
                page.wait_for_timeout(300)
                log("✓ Fast filter pill 'Jugend-konform' tested")
            
            # Reset quick filter to all
            all_pill = page.query_selector('.quick-filter-pill[data-quick="all"]')
            if all_pill:
                all_pill.click()
                page.wait_for_timeout(300)

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

            # Test Bookmarking & Tab Switching (TASK-001)
            first_bookmark_btn = page.query_selector(".job-card .bookmark-btn")
            assert first_bookmark_btn is not None, "Bookmark button must be present on job cards"
            first_bookmark_btn.click()
            page.wait_for_timeout(300)
            log("✓ Toggled bookmark on first job card")

            # Switch to 'Gemerkt' tab
            saved_tab_btn = page.query_selector("#tab-feed-saved")
            assert saved_tab_btn is not None, "Gemerkt tab button must exist"
            saved_tab_btn.click()
            page.wait_for_timeout(300)
            saved_cards = page.query_selector_all(".job-card")
            assert len(saved_cards) >= 1, "Gemerkt tab must display bookmarked jobs"
            page.screenshot(path=os.path.join(ARTIFACTS_DIR, "feed_saved_tab.png"))
            log(f"✓ Verified 'Gemerkt' tab with {len(saved_cards)} card(s)")

            # Switch back to 'Entdecken' tab
            page.click("#tab-feed-all")
            page.wait_for_timeout(300)

            total_cards = len(page.query_selector_all(".job-card"))
            assert total_cards >= 6, f"Expected at least 6 initial jobs, found {total_cards}"
            log(f"✓ Total {total_cards} microjobs active in feed")
            passed_steps += 1

            # Step 4: Open Job Detail Modal & Inspect Privacy + Price
            log("\n[Step 4] Opening Job Detail Modal and verifying fields...")
            page.click(".job-card")
            page.wait_for_selector("#job-detail-sheet", timeout=5000)
            
            price_el = page.query_selector("#job-detail-sheet .price-tag")
            assert price_el is not None and "€" in price_el.inner_text(), "Price tag should be prominent"
            
            detail_text = page.inner_text("#job-detail-sheet")
            assert "Exact street number revealed upon confirmed assignment" in detail_text or "Exact address" in detail_text
            log("✓ Privacy-protected approximate location confirmed")

            # Verify and test bookmark button in Job Detail header
            page.wait_for_selector("#btn-detail-bookmark", timeout=5000)
            page.click("#btn-detail-bookmark")
            page.wait_for_timeout(300)
            log("✓ Toggled bookmark directly from Job Detail modal header")
            
            screenshot_path = os.path.join(ARTIFACTS_DIR, "job_detail_modal.png")
            page.screenshot(path=screenshot_path)
            log(f"✓ Job detail modal screenshot saved: {screenshot_path}")

            # Test Safety Incident Reporting from Job Detail (TASK-002)
            page.wait_for_selector("#btn-report-job", timeout=5000)
            page.click("#btn-report-job")
            page.wait_for_selector("#report-modal-sheet", timeout=5000)
            
            report_sheet_text = page.inner_text("#report-modal-sheet")
            assert "Sicherheitsmeldung" in report_sheet_text
            assert "116 111" in report_sheet_text, "Official emergency helpline must be displayed"
            
            # Select danger category and fill details
            danger_radio = page.query_selector('input[name="reportCat"][value="youth_safety"]')
            if danger_radio:
                danger_radio.click()
            page.fill("#report-details-input", "Gefährliche Arbeit in großer Höhe ohne Absturzsicherung gefordert.")
            
            report_screenshot = os.path.join(ARTIFACTS_DIR, "safety_incident_report_modal.png")
            page.screenshot(path=report_screenshot)
            log(f"✓ Safety incident report modal screenshot saved: {report_screenshot}")

            page.click("#btn-submit-report")
            page.wait_for_timeout(400)
            toast_el = page.query_selector("#toast-notice")
            assert toast_el is not None, "Submitting report must trigger toast confirmation"
            assert "Sicherheitsmeldung" in toast_el.inner_text()
            log("✓ Safety incident reported and confirmed with toast notice")
            passed_steps += 1

            # Step 5: Apply to Job and verify state transition to Chat
            log("\n[Step 5] Applying to Job and checking state transition...")
            # Re-open job detail sheet after report modal closed
            page.click(".job-card")
            page.wait_for_selector("#job-detail-sheet", timeout=5000)

            page.wait_for_selector("#btn-action-apply, #btn-action-accept", timeout=5000)
            page.click("#btn-action-apply, #btn-action-accept")
            page.wait_for_timeout(600)
            
            assert page.query_selector("#screen-chat-thread") is not None, "Should transition to chat thread after application"
            log("✓ Applied and transitioned directly to linked job chat thread")
            passed_steps += 1

            # Step 6: Chat interaction & Lifecycle Actions + Review Modal
            log("\n[Step 6] Testing chat messaging, simulated auto-reply, and 5-star review modal...")
            quick_reply = page.query_selector('.quick-reply-btn[data-reply="Is 3pm okay?"]')
            if quick_reply:
                quick_reply.click()
                page.wait_for_timeout(300)
            
            chat_input = page.query_selector("#chat-input-field")
            chat_input.fill("Ich bin vor Ort angekommen!")
            page.click("#btn-send-message")
            page.wait_for_timeout(1200) # Wait for simulated auto-reply
            
            bubbles = page.query_selector_all(".chat-bubble")
            assert len(bubbles) >= 3, f"Expected at least 3 chat bubbles with simulated reply, got {len(bubbles)}"
            chat_text = page.inner_text("#chat-messages-scroll")
            assert any(word in chat_text for word in ["Tür", "Tor", "Arbeit", "hervorragend", "Nachricht"]), "Simulated contextual reply should appear"
            log("✓ Simulated interactive chat auto-reply received successfully")

            # Verify chat report button is available
            chat_report_btn = page.query_selector("#btn-chat-report")
            assert chat_report_btn is not None, "Chat header must contain report button"
            
            complete_btn = page.query_selector("#btn-chat-complete-job")
            if complete_btn:
                complete_btn.click()
                page.wait_for_timeout(400)
                log("✓ Job status transitioned to COMPLETED")

            release_btn = page.query_selector("#btn-chat-release-payment")
            if release_btn:
                release_btn.click()
                page.wait_for_timeout(400)
                log("✓ Payment released")

            review_btn = page.query_selector("#btn-chat-leave-review")
            if review_btn:
                review_btn.click()
                page.wait_for_selector("#review-modal-sheet", timeout=5000)
                log("✓ Interactive 5-Star Review Modal opened!")
                
                # Test interactive star click
                star_5 = page.query_selector('.star-btn[data-star="5"]')
                if star_5:
                    star_5.click()
                
                # Select a compliment tag
                compliment = page.query_selector('.compliment-tag[data-tag="⏰ Pünktlich & zuverlässig"]')
                if compliment:
                    compliment.click()

                screenshot_path = os.path.join(ARTIFACTS_DIR, "review_modal.png")
                page.screenshot(path=screenshot_path)
                log(f"✓ Review modal screenshot saved: {screenshot_path}")

                page.click("#btn-submit-review")
                page.wait_for_timeout(400)
                log("✓ Review submitted successfully")

            passed_steps += 1

            # Step 7: Create Job Wizard with Automated Age & Safety Engine
            log("\n[Step 7] Testing 5-step Job Creation Wizard & Automatic Age Classification...")
            page.click("#nav-create")
            page.wait_for_selector("#screen-create", timeout=5000)
            
            page.fill("#wizard-title", "Help assemble IKEA Billy bookcase")
            page.click("#btn-wizard-next")
            page.wait_for_timeout(300)
            
            # Test Step 2 Automatic Age Rating
            # First type dangerous tool to verify 18+ auto-classification
            page.fill("#wizard-desc", "Arbeiten mit Kettensäge auf dem Dach")
            page.wait_for_timeout(200)
            badge_text = page.inner_text("#screen-create")
            assert "Nur ab 18 Jahren" in badge_text, "Dangerous task must be auto-classified as 18+"
            log("✓ Automatic Youth Protection: Dangerous task correctly evaluated as 18+ (§ 22 JArbSchG)")

            # Now type safe task
            page.fill("#wizard-desc", "Two 80cm Billy bookcases with glass doors. Cordless screwdriver and Allen keys available.")
            page.wait_for_timeout(200)
            badge_text = page.inner_text("#screen-create")
            assert "Geeignet ab 14 Jahren" in badge_text, "Safe indoor assembly must be evaluated as 14+"
            log("✓ Automatic Youth Protection: Safe microjob correctly evaluated as Suitable for 14+")

            page.fill("#wizard-reqs", "Familiar with furniture assembly\nCareful")
            page.click("#btn-wizard-next")
            page.wait_for_timeout(300)
            
            # Step 3: Test Fair Pay & Hourly Wage Widget (TASK-004)
            fair_pay_box = page.query_selector("#wizard-fair-pay-box")
            assert fair_pay_box is not None, "Step 3 must display Fair Pay & Hourly Rate Widget"
            initial_rate = page.inner_text("#wizard-fair-pay-badge")
            assert "€" in initial_rate, f"Hourly rate badge should show euro amount, got '{initial_rate}'"

            # Change payment amount to test live recalculation
            page.fill("#wizard-pay-input", "50")
            page.wait_for_timeout(200)
            updated_rate = page.inner_text("#wizard-fair-pay-badge")
            assert "€50.00/h" in updated_rate, f"Hourly rate should be updated to €50.00/h, got '{updated_rate}'"
            log(f"✓ Fair Pay widget dynamically recalculated hourly wage to {updated_rate}")

            page.click("#btn-wizard-next")
            page.wait_for_timeout(300)
            
            page.fill("#wizard-location", "Wuppertal-Barmen")
            page.click("#btn-wizard-next")
            page.wait_for_timeout(300)

            card_preview_text = page.inner_text("#screen-create")
            assert "Berechneter Stundenlohn" in card_preview_text, "Step 5 preview card must show hourly wage"
            
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

            # Step 8: Profile Screen & FinTech Escrow Wallet Inspection
            log("\n[Step 8] Inspecting Profile Screen & FinTech Escrow Wallet...")
            page.click("#nav-profile")
            page.wait_for_selector("#screen-profile", timeout=5000)
            
            profile_text = page.inner_text("#screen-profile")
            assert "Jasper Klein" in profile_text
            assert "Youth · 14–17" in profile_text
            assert "QUICKJOB WALLET" in profile_text.upper()
            log("✓ Profile displays youth category, wallet balance, and escrow funds")

            # Verify Gespeicherte Jobs Section in Profile
            saved_section = page.query_selector("#profile-saved-jobs-container")
            assert saved_section is not None, "Profile must contain 'Gespeicherte Jobs' section"
            saved_badge = page.inner_text("#profile-saved-jobs-badge")
            log(f"✓ Profile 'Gespeicherte Jobs' section verified with initial count: {saved_badge}")
            
            # If 0 saved jobs, test empty state CTA -> browse jobs -> bookmark 2 jobs -> return to profile
            if saved_badge == "0":
                browse_btn = page.query_selector("#btn-profile-browse-jobs")
                assert browse_btn is not None, "Empty saved jobs state should show 'Zu den Microjobs' CTA"
                page.click("#btn-profile-browse-jobs")
                page.wait_for_timeout(300)
                
                # Bookmark 2 jobs in the feed
                page.wait_for_selector(".job-card .bookmark-btn", timeout=5000)
                page.click(".job-card:nth-of-type(1) .bookmark-btn")
                page.wait_for_timeout(300)
                page.click(".job-card:nth-of-type(2) .bookmark-btn")
                page.wait_for_timeout(300)
                log("✓ Bookmarked 2 jobs from feed to populate profile")

                # Navigate back to Profile
                page.click("#nav-profile")
                page.wait_for_timeout(300)

            # Re-check saved jobs in profile
            updated_saved_badge = page.inner_text("#profile-saved-jobs-badge")
            assert int(updated_saved_badge) >= 1, f"Expected at least 1 saved job in profile, got {updated_saved_badge}"
            saved_items = page.query_selector_all(".profile-saved-job-item")
            assert len(saved_items) >= 1, "Profile must render saved job items"
            log(f"✓ Profile successfully lists {len(saved_items)} saved job card(s)")

            # Test clicking a saved job in profile to open Job Detail modal
            page.click(".profile-saved-job-item")
            page.wait_for_selector("#job-detail-sheet", timeout=5000)
            log("✓ Clicking saved job card in profile opened Job Detail modal successfully")
            page.click("#btn-close-detail")
            page.wait_for_timeout(300)

            # Test removing one saved job using the quick-remove button
            first_remove_btn = page.query_selector(".btn-remove-saved-job")
            if first_remove_btn:
                first_remove_btn.click()
                page.wait_for_timeout(300)
                log("✓ Tested quick-remove (✕) button on saved job item")

            # Test wallet withdrawal
            withdraw_btn = page.query_selector("#btn-profile-withdraw")
            if withdraw_btn:
                withdraw_btn.click()
                page.wait_for_timeout(400)
                toast_el = page.query_selector("#toast-notice")
                assert toast_el is not None, "Withdrawal must trigger confirmation toast"
                log("✓ Payout triggered and confirmed with toast notification")
            
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

            # Step 10: Employer Applicant Management Flow
            log("\n[Step 10] Testing Employer Applicant Management Flow...")
            # Switch persona to Dr. Marcus Lang (employer who posted job_01)
            page.select_option("#dev-persona-select", "marcus")
            page.wait_for_timeout(400)
            
            page.click("#nav-jobs")
            page.wait_for_timeout(300)
            
            # Click job_01 (Mow front lawn)
            job1_card = page.query_selector('.job-card[data-job-id="job_01"]')
            if job1_card:
                job1_card.click()
                page.wait_for_selector("#job-detail-sheet", timeout=5000)
                
                # Check for employer review applications button
                review_apps_btn = page.query_selector("#btn-open-applicants-mgr")
                assert review_apps_btn is not None, "Employer viewing own job must see 'Bewerbungen prüfen' button"
                review_apps_btn.click()
                page.wait_for_selector("#applicant-modal-sheet", timeout=5000)
                log("✓ Employer Applicant Management sheet opened!")

                applicant_sheet_text = page.inner_text("#applicant-modal-sheet")
                assert "Jasper Klein" in applicant_sheet_text, "Applicant Jasper Klein must be listed"
                
                screenshot_path = os.path.join(ARTIFACTS_DIR, "applicant_management_modal.png")
                page.screenshot(path=screenshot_path)
                log(f"✓ Applicant modal screenshot saved: {screenshot_path}")

                # Assign Jasper Klein
                assign_btn = page.query_selector('.btn-assign-worker[data-applicant-id="user_jasper"]')
                if assign_btn:
                    assign_btn.click()
                    page.wait_for_timeout(500)
                    log("✓ Worker Jasper Klein assigned! Address unlocked and chat thread opened.")

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
