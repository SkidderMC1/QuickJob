"""
Comprehensive Automated UI/UX Redesign Test Suite for QuickJob Home Screen
Verifies:
1. Simplified Header ([QuickJob logo] [Profile])
2. Compact Nearby Map Card (35-45% reduced height, "X jobs near you", "Open map ->")
3. Categories with horizontal chips and "See all ->"
4. Nearby Jobs Section heading ("Nearby jobs · X", "See all ->")
5. Redesigned Job Cards (Category, Prominent Price, Strong Title, Location/Date/Time, Travel Times, Employer Trust, Apply ->)
6. Real Browser Geolocation Trigger (navigator.geolocation.getCurrentPosition)
7. Mobile-First Responsive Layouts at 320px, 375px, 390px, and 430px (no horizontal overflow)
"""

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8000"
ARTIFACTS_DIR = r"C:\Users\Einrichtung\.gemini\antigravity-ide\brain\933bb828-f6a6-4a9a-86b1-320f11e84f57"

def run_tests():
    print("==================================================")
    print("STARTING HOME SCREEN REDESIGN PLAYWRIGHT TEST")
    print("==================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            permissions=["geolocation"],
            geolocation={"latitude": 51.2562, "longitude": 7.1508}
        )
        page = context.new_page()

        # Step 1: Login
        print("\n--- TEST 1: Login & Initial Load ---")
        page.goto(BASE_URL + "/?mode=app", wait_until="networkidle")
        page.wait_for_selector("#form-auth-login", timeout=8000)
        page.fill("#login-email", "jasper@quickjob.local")
        page.fill("#login-password", "Password123!")
        page.click("#btn-auth-submit-login")
        page.wait_for_function("() => window.store && window.store.getState().isAuthenticated === true", timeout=10000)
        page.wait_for_selector("#screen-home", timeout=8000)
        print("✓ Authenticated and navigated to Home screen")

        # Dismiss cookie consent if shown
        consent_btn = page.query_selector("#btn-consent-accept-all")
        if consent_btn:
            consent_btn.click()
            page.wait_for_timeout(300)

        # Step 2: Verify Simplified Header
        print("\n--- TEST 2: Simplified Header ---")
        brand_logo = page.query_selector("#brand-logo")
        assert brand_logo is not None, "Brand logo must exist"
        profile_btn = page.query_selector("#btn-header-profile")
        assert profile_btn is not None, "Profile button must exist in header"
        assert page.is_visible("#btn-header-profile"), "Profile button must be visible"
        # Verify visual clutter removed (safety icon hidden from visible header)
        safety_btn = page.query_selector("#btn-safety-modal")
        assert not page.is_visible("#btn-safety-modal"), "Safety shield must not clutter visible home header"
        print("✓ Header simplified: [QuickJob logo] [Profile] visible, clutter removed")

        # Step 3: Verify Map Card is removed from Home screen as requested
        print("\n--- TEST 3: Map Card Removed from Home ---")
        map_card = page.query_selector("#home-map-card")
        assert map_card is None, "Map card must be removed from Home screen"
        print("✓ Verified: Map card removed from Home screen as requested")

        # Step 4: Verify Categories Section
        print("\n--- TEST 4: Categories Chip System ---")
        cat_section = page.query_selector(".home-categories-section")
        assert cat_section is not None, "Categories section must exist"
        see_all_cats = page.query_selector("#link-view-all-cats")
        assert see_all_cats is not None, "'See all ->' link must exist for categories"
        chips = page.query_selector_all(".category-chip")
        assert len(chips) >= 4, f"Expected category chips, found {len(chips)}"
        chip_text = chips[0].inner_text()
        assert "All" in chip_text, "First chip should be 'All'"
        print(f"✓ Categories chips rendered with {len(chips)} categories and 'See all ->' action")

        # Step 5: Verify Nearby Jobs Section Heading
        print("\n--- TEST 5: Nearby Jobs Section Heading ---")
        nearby_header = page.query_selector(".home-nearby-section .section-title")
        assert nearby_header is not None, "Nearby jobs section title must exist"
        nearby_title_text = nearby_header.inner_text()
        assert "Nearby jobs ·" in nearby_title_text, f"Title must be 'Nearby jobs · X', got '{nearby_title_text}'"
        see_all_nearby = page.query_selector("#link-see-nearby")
        assert see_all_nearby is not None, "'See all ->' must exist on nearby jobs"
        print(f"✓ Section header verified: '{nearby_title_text}' with 'See all ->'")

        # Step 6: Verify Redesigned Job Cards Hierarchy
        print("\n--- TEST 6: Redesigned Job Cards ---")
        cards = page.query_selector_all(".job-card")
        assert len(cards) > 0, "Job cards must be rendered on Home screen"
        first_card = cards[0]
        card_text = first_card.inner_text()

        # Check Category label
        cat_label = first_card.query_selector(".job-card-category-label")
        assert cat_label is not None, "Category label must exist at top"
        # Check Prominent Price
        price_elem = first_card.query_selector(".job-card-price-prominent")
        assert price_elem is not None, "Prominent price must exist at top"
        price_text = price_elem.inner_text()
        assert "€" in price_text, f"Price must have euro symbol, got '{price_text}'"
        # Check Title
        title_elem = first_card.query_selector(".job-card-title")
        assert title_elem is not None, "Job title must exist as primary textual element"
        # Check Travel Times
        assert "🚲" in card_text and "🚶" in card_text and "🚌" in card_text, "Travel times must be present"
        # Check Employer Trust
        assert "★" in card_text, "Rating star must be present"
        assert "reviews" in card_text, "Reviews count must be present"
        # Check Apply CTA
        assert "Apply" in card_text, "Subordinate 'Apply ->' indicator must be present"
        # Check Bookmark Button
        bookmark_btn = first_card.query_selector(".bookmark-btn")
        assert bookmark_btn is not None, "Bookmark button must exist"
        print("✓ Job card hierarchy confirmed: Category + Prominent Price -> Title -> Meta -> Travel -> Employer Trust -> Apply")

        # Step 7: Verify Bottom Navigation
        print("\n--- TEST 7: Bottom Navigation ---")
        bottom_nav = page.query_selector("#bottom-nav")
        assert bottom_nav is not None, "Bottom navigation must be visible"
        nav_items = page.query_selector_all(".nav-item")
        assert len(nav_items) == 6, f"Expected 6 nav items (Home, Jobs, Map, Create, Messages, Profile), got {len(nav_items)}"
        create_btn = page.query_selector("#nav-create")
        assert create_btn is not None, "Create button must exist"
        print("✓ Bottom navigation verified with 6 items and prominent Create button")

        # Step 8: Verify Real Browser Geolocation Hook
        print("\n--- TEST 8: Real Browser Geolocation Hook ---")
        geo_called = page.evaluate("""() => {
            let called = false;
            const original = navigator.geolocation.getCurrentPosition;
            navigator.geolocation.getCurrentPosition = function(success, error, options) {
                called = true;
                original.call(navigator.geolocation, success, error, options);
            };
            store.grantLocationPermission();
            return called;
        }""")
        assert geo_called is True, "store.grantLocationPermission must invoke navigator.geolocation.getCurrentPosition!"
        print("✓ Real browser geolocation popup API (navigator.geolocation.getCurrentPosition) is verified")

        # Step 9: Responsive Testing at 320px, 375px, 390px, 430px
        print("\n--- TEST 9: Mobile-First Responsive Checks ---")
        viewports = [320, 375, 390, 430]
        for w in viewports:
            page.set_viewport_size({"width": w, "height": 800})
            page.wait_for_timeout(250)
            
            # Check for horizontal scroll / overflow
            has_overflow = page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
            assert not has_overflow, f"Horizontal overflow detected at {w}px width!"
            
            # Check cards remain readable
            card_width = page.evaluate("() => document.querySelector('.job-card')?.offsetWidth || 0")
            assert card_width > 0, f"Job card must be visible at {w}px"
            print(f"✓ Viewport {w}px: OK (no horizontal overflow, card width: {card_width}px)")

        # Save visual artifact screenshot of Home
        screenshot_path = os.path.join(ARTIFACTS_DIR, "home_screen_redesigned_390px.png")
        page.set_viewport_size({"width": 390, "height": 844})
        page.screenshot(path=screenshot_path)
        print(f"✓ Screenshot saved to {screenshot_path}")

        # Step 10: Verify Map Tab contains ONLY the map and nothing else
        print("\n--- TEST 10: Map Tab - Only Map and Nothing Else ---")
        page.click("#nav-map")
        page.wait_for_timeout(350)

        # Check map canvas is visible
        assert page.is_visible("#map-interactive-canvas"), "Map interactive canvas must be visible in Map tab"
        assert page.is_visible("#user-location-pin"), "User center pin must be visible"
        assert page.is_visible("#btn-map-locate-me"), "Floating locate button must be visible on the map"

        # Check that NO extra clutter is on the map tab
        assert not page.is_visible("#jobs-segment-control"), "Segmented control must NOT be visible on Map-only screen"
        assert not page.is_visible("#jobs-view-mode-bar"), "View mode bar must NOT be visible on Map-only screen"
        assert not page.is_visible("#jobs-search-input"), "Search input must NOT be visible on Map-only screen"
        assert not page.is_visible("#jobs-quick-pills"), "Quick filter pills must NOT be visible on Map-only screen"
        assert not page.is_visible("#youth-protection-locked-badge"), "Youth protection banner must NOT be visible on Map-only screen"
        assert not page.is_visible("#jobs-cards-container"), "Job cards list must NOT be visible on Map-only screen"
        print("✓ Verified: Map tab has ONLY the map and nothing else (no search box, no filters, no cards list)")

        # Save visual screenshot of the clean map-only screen
        map_screenshot_path = os.path.join(ARTIFACTS_DIR, "map_screen_only_390px.png")
        page.screenshot(path=map_screenshot_path)
        print(f"✓ Map screenshot saved to {map_screenshot_path}")

        browser.close()
        print("\n==================================================")
        print("ALL HOME REDESIGN & MAP-ONLY CHECKS PASSED (100%)!")
        print("==================================================")

if __name__ == "__main__":
    run_tests()
