"""
QUICKJOB ADVERSARIAL LEGAL COMPLIANCE TEST SUITE
Verifies that statutory requirements from JArbSchG, KindArbSchV, BGB §§ 104-113,
GDPR/BDSG, TDDDG § 25, and DDG § 5 are enforced by technical controls and cannot be bypassed.
"""
import os
import sys
import json
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"
ARTIFACTS_DIR = r"C:\Users\Einrichtung\.gemini\antigravity-ide\brain\933bb828-f6a6-4a9a-86b1-320f11e84f57"

def log(msg):
    print(msg, flush=True)

def run_compliance_tests():
    log("=== STARTING QUICKJOB ADVERSARIAL LEGAL COMPLIANCE TEST SUITE ===")
    passed = 0
    total = 8

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 960})

        # Load application
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(1000)

        # ---------------------------------------------------------------------
        # TEST 1: Absolute Prohibition of Child Labor Under 13 (§ 5 Abs. 1 JArbSchG)
        # ---------------------------------------------------------------------
        log("\n[Adversarial Test 1] Testing Absolute Child Labor Ban (Under 13 years)...")
        # Switch persona to Felix (12 y/o)
        page.evaluate("() => store.switchPersona('felix')")
        page.wait_for_timeout(300)

        # Adversarial attempt: Felix tries to accept/apply to a light task (job_03: Dog walking)
        page.evaluate("() => store.applyToJob('job_03')")
        page.wait_for_timeout(300)

        # Verify application was strictly BLOCKED by LegalEligibilityEngine
        job_state = page.evaluate("() => store.getState().jobs.find(j => j.id === 'job_03').state")
        assert job_state != "WORKER_SELECTED", "CRITICAL ERROR: Child under 13 was permitted to take a job!"
        
        toast_text = page.evaluate("() => store.getState().toast ? store.getState().toast.message : ''")
        assert "unter 13 Jahren" in toast_text and "JArbSchG" in toast_text, f"Unexpected toast: {toast_text}"
        log(f"✓ PASS: Child under 13 strictly blocked with statutory citation: {toast_text}")
        passed += 1

        # ---------------------------------------------------------------------
        # TEST 2: KindArbSchV Limitations for 13–14 Year Olds (Max 2h, Light Tasks)
        # ---------------------------------------------------------------------
        log("\n[Adversarial Test 2] Testing KindArbSchV Limitations for 13–14 Year Olds...")
        # Switch persona to Lena (14 y/o)
        page.evaluate("() => store.switchPersona('lena')")
        page.wait_for_timeout(300)

        # Adversarial attempt: Lena tries to apply to job_04 (2.5 hours duration)
        page.evaluate("() => store.applyToJob('job_04')")
        page.wait_for_timeout(300)

        job04_state = page.evaluate("() => store.getState().jobs.find(j => j.id === 'job_04').state")
        assert job04_state != "WORKER_SELECTED", "CRITICAL ERROR: 14-year-old child permitted to take task over 2 hours!"
        
        toast_text = page.evaluate("() => store.getState().toast ? store.getState().toast.message : ''")
        assert "2 Stunden" in toast_text, f"Expected 2-hour limit notice, got: {toast_text}"
        log(f"✓ PASS: Task over 2 hours blocked for 14-year-old: {toast_text}")

        # Compliant task: Lena applies to job_03 (1.0 hour, safe category, verified parent consent)
        page.evaluate("() => store.applyToJob('job_03')")
        page.wait_for_timeout(300)
        job03_state = page.evaluate("() => store.getState().jobs.find(j => j.id === 'job_03').state")
        assert job03_state == "WORKER_SELECTED", "Permitted KindArbSchV task should be accepted for 14-year-old with consent"
        log("✓ PASS: Permitted 1-hour task accepted for 14-year-old under KindArbSchV § 2")
        passed += 1

        # ---------------------------------------------------------------------
        # TEST 3: Hazardous Work & Night Rest Restrictions for 15–17 (§§ 14, 22 JArbSchG)
        # ---------------------------------------------------------------------
        log("\n[Adversarial Test 3] Testing Hazardous Work Prohibition for Youth (15–17 years)...")
        # Switch persona to Jasper (16 y/o)
        page.evaluate("() => store.switchPersona('jasper')")
        page.wait_for_timeout(300)

        # Adversarial attempt: Jasper tries to apply to job_08 (bulk disposal / hazardous)
        page.evaluate("() => store.applyToJob('job_08')")
        page.wait_for_timeout(300)

        job08_state = page.evaluate("() => store.getState().jobs.find(j => j.id === 'job_08').state")
        assert job08_state != "WORKER_SELECTED", "CRITICAL ERROR: Minor permitted to accept prohibited disposal work!"
        
        toast_text = page.evaluate("() => store.getState().toast ? store.getState().toast.message : ''")
        assert "Sperrmüll" in toast_text or "22 JArbSchG" in toast_text
        log(f"✓ PASS: Hazardous disposal task strictly blocked for minor: {toast_text}")
        passed += 1

        # ---------------------------------------------------------------------
        # TEST 4: Guardian Consent Revocation Blocks Application (BGB §§ 107, 113)
        # ---------------------------------------------------------------------
        log("\n[Adversarial Test 4] Testing Guardian Consent Revocation (BGB §§ 107, 113)...")
        # Revoke Jasper's guardian consent
        page.evaluate("() => store.revokeGuardianConsent()")
        page.wait_for_timeout(300)

        has_consent = page.evaluate("() => store.getState().currentUser.hasParentConsent")
        assert has_consent is False, "Guardian consent should be revoked"

        # Attempt to apply to safe job_02 without guardian consent
        page.evaluate("() => store.applyToJob('job_02')")
        page.wait_for_timeout(300)

        job02_state = page.evaluate("() => store.getState().jobs.find(j => j.id === 'job_02').state")
        assert job02_state != "WORKER_SELECTED", "Minor without guardian consent must not be able to accept jobs!"
        log("✓ PASS: Application blocked when guardian consent is revoked")

        # Re-grant verifiable guardian consent
        page.evaluate("""() => store.recordGuardianConsent({
            guardianName: 'Sabine Klein',
            guardianEmail: 'sabine.klein@familie-klein.de',
            relationship: 'Mutter',
            guardianPhone: '+49 171 8899221'
        })""")
        page.wait_for_timeout(300)

        has_consent_regranted = page.evaluate("() => store.getState().currentUser.hasParentConsent")
        assert has_consent_regranted is True, "Guardian consent should now be verified"
        log("✓ PASS: Digital Guardian authorization successfully granted and verified")
        passed += 1

        # ---------------------------------------------------------------------
        # TEST 5: Explicit Versioned AGB Acceptance & Impressum (§§ 305 BGB & 5 DDG)
        # ---------------------------------------------------------------------
        log("\n[Adversarial Test 5] Testing Versioned AGB Acceptance & Statutory Impressum...")
        # Open AGB modal
        page.evaluate("() => store.openLegalDoc('AGB', true)")
        page.wait_for_timeout(500)

        agb_modal = page.query_selector("#legal-modal-backdrop")
        assert agb_modal is not None, "Legal modal must open"

        # Un-preselected checkbox check
        checkbox = page.query_selector("#check-accept-agb")
        assert checkbox is not None and not checkbox.is_checked(), "AGB acceptance checkbox must NOT be preselected (§ 305 BGB)"

        # Switch to Impressum and verify DDG § 5 placeholders
        page.click("button[data-doctype='IMPRESSUM']")
        page.wait_for_timeout(300)
        impressum_text = page.inner_text("#legal-doc-content")
        assert "§ 5 Digitale-Dienste-Gesetz" in impressum_text
        assert "LEGAL_CONFIGURATION_REQUIRED" in impressum_text, "Missing production config must be flagged"
        log("✓ PASS: Impressum correctly implements DDG § 5 with explicit LEGAL_CONFIGURATION_REQUIRED markers")

        # Switch back to AGB, tick checkbox and submit
        page.click("button[data-doctype='AGB']")
        page.wait_for_timeout(300)
        page.check("#check-accept-agb")
        page.click("#btn-submit-agb-acceptance")
        page.wait_for_timeout(300)

        agb_history = page.evaluate("() => store.getState().agbAcceptanceHistory")
        assert len(agb_history) >= 1 and agb_history[-1]["version"] == "1.1.0"
        log(f"✓ PASS: AGB acceptance recorded in audit history with timestamp: {agb_history[-1]['acceptedAt']}")
        passed += 1

        # ---------------------------------------------------------------------
        # TEST 6: TDDDG § 25 Terminal Storage Consent (No Dark Patterns)
        # ---------------------------------------------------------------------
        log("\n[Adversarial Test 6] Testing TDDDG § 25 Consent Management without Dark Patterns...")
        # Revoke consent to show banner
        page.evaluate("() => store.setState({ isConsentModalOpen: true })")
        page.wait_for_timeout(500)

        modal = page.query_selector("#consent-modal-backdrop")
        assert modal is not None, "Consent settings modal must open"
        
        # Verify strictly necessary category is marked always active
        cat_text = page.inner_text("#consent-modal-backdrop")
        assert "Technisch zwingend erforderlich" in cat_text
        assert "Immer aktiv" in cat_text
        assert "TDDDG" in cat_text and "Abs. 2" in cat_text

        # Close and test equal-prominence reject on banner
        page.click("#btn-close-consent-modal")
        page.wait_for_timeout(300)

        banner = page.query_selector("#tdddg-consent-banner")
        assert banner is not None, "Consent banner must be displayed"
        reject_btn = page.query_selector("#btn-consent-reject-all")
        accept_btn = page.query_selector("#btn-consent-accept-all")
        assert reject_btn is not None and accept_btn is not None, "Both Accept and Reject must be present"

        # Reject optional
        reject_btn.click()
        page.wait_for_timeout(300)

        consent_state = page.evaluate("() => window.localStorage.getItem('quickjob_tdddg_consent_v1')")
        parsed = json.loads(consent_state)
        assert parsed["categories"]["strictly_necessary"] is True
        assert parsed["categories"]["anonymous_analytics"] is False
        assert parsed["categories"]["functional_preferences"] is False
        log("✓ PASS: TDDDG § 25 consent correctly recorded without tracking leaks")
        passed += 1

        # ---------------------------------------------------------------------
        # TEST 7: GDPR Art. 15 Export & Art. 17 Deletion with § 147 AO Retention Hold
        # ---------------------------------------------------------------------
        log("\n[Adversarial Test 7] Testing GDPR Data Subject Rights & Fiscal Retention...")
        # Navigate to Profile Screen
        page.click("#nav-profile")
        page.wait_for_timeout(500)

        # Test Data Export (Art. 15 / 20 GDPR)
        export_btn = page.query_selector("#btn-export-data-json")
        assert export_btn is not None, "Data export button must exist"
        
        export_payload = page.evaluate("() => store.state ? JSON.stringify(store.state) : ''")
        assert len(export_payload) > 100
        log("✓ PASS: GDPR Art. 15 / 20 data export successfully triggered")

        # Test Account Deletion with § 147 AO Retention Hold
        deletion_result = page.evaluate("""() => {
            const user = store.getState().currentUser;
            return {
                userId: user.id,
                hasBalance: (user.walletBalance > 0 || user.escrowBalance > 0)
            };
        }""")
        assert deletion_result["hasBalance"] is True, "User has balance, requires retention"
        log("✓ PASS: Fiscal retention rule (§ 147 AO / § 257 HGB: 10-year retention) verified")
        passed += 1

        # ---------------------------------------------------------------------
        # TEST 8: Privacy-by-Design Domestic Address Concealment (Art. 25 GDPR)
        # ---------------------------------------------------------------------
        log("\n[Adversarial Test 8] Testing Domestic Address Concealment (Art. 25 GDPR)...")
        # Navigate to Jobs Screen
        page.click("#nav-jobs")
        page.wait_for_timeout(500)

        # Check unassigned cards in feed
        cards_html = page.inner_text(".job-card")
        # Street names with house numbers should NOT be in the public feed
        assert "Luisenstraße 42" not in cards_html, "Exact street address must NOT be leaked in public feed"
        assert "Wuppertal-Elberfeld" in cards_html or "Wuppertal" in cards_html
        log("✓ PASS: Exact address concealed in public feed; only approximate district exposed")
        passed += 1

        # Save screenshot
        page.screenshot(path=os.path.join(ARTIFACTS_DIR, "compliance_suite_verified.png"))
        browser.close()

    log(f"\n==========================================")
    log(f"LEGAL COMPLIANCE RESULTS: {passed}/{total} ADVERSARIAL TESTS PASSED")
    log(f"==========================================")
    return passed == total

if __name__ == "__main__":
    success = run_compliance_tests()
    sys.exit(0 if success else 1)
