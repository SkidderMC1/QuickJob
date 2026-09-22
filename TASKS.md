# QuickJob Dynamic Task System (Living Product State)

## Task Universe Overview

| ID | Title | Type | Priority | Impact | Effort | Confidence | Status |
|---|---|---|---|---|---|---|---|
| **TASK-001** | Job Feed Tab Navigation (Entdecken / Gemerkt / Meine Aufträge) | UX / FEATURE | P1 | 8 | 3 | 9 | **DONE** |
| **TASK-002** | Report & Safety Incident Workflow (Job/Chat Melden & Notfall-Hotline) | SECURITY / SAFETY | P0 | 9 | 3 | 9 | **DONE** |
| **TASK-003** | Interactive Simulated Employer/Worker Auto-Replies in Chat | UX / INTERACTION | P2 | 7 | 2 | 9 | **DONE** |
| **TASK-004** | Fair Pay & Hourly Rate Indicator in Job Creation Wizard | UX / FEATURE | P2 | 8 | 2 | 9 | **DONE** |
| **TASK-008** | Profile Saved Jobs Section & Job Detail Bookmark Integration | USER_REQUEST | P0 | 9 | 2 | 9 | **DONE** |
| **TASK-009** | Permanent, Non-Deactivatable Youth Protection Filter for Minors (§ 22 JArbSchG) | USER_REQUEST | P0 | 10 | 2 | 9 | **DONE** |
| **TASK-005** | Parent/Guardian Digital Consent Signature & Verification Portal (BGB §§ 107, 113) | LEGAL / SAFETY | P0 | 10 | 3 | 9 | **DONE** |
| **TASK-010** | Centralized Authoritative Legal Eligibility Engine (JArbSchG & KindArbSchV 4-Tier Gatekeeper) | LEGAL / CORE | P0 | 10 | 3 | 9 | **DONE** |
| **TASK-011** | Versioned Legal Documents Architecture & Explicit AGB Acceptance (BGB § 305 & DDG § 5) | LEGAL / AGB | P0 | 9 | 3 | 9 | **DONE** |
| **TASK-012** | TDDDG § 25 Terminal Storage Consent Manager without Dark Patterns | PRIVACY / TDDDG | P0 | 9 | 2 | 9 | **DONE** |
| **TASK-013** | GDPR Art. 15-21 Data Subject Rights Portal & Fiscal Retention Hold (§ 147 AO) | PRIVACY / GDPR | P0 | 9 | 3 | 9 | **DONE** |
| **TASK-014** | Adversarial Legal Compliance Automated Playwright Test Suite (8/8 Scenarios) | QA / COMPLIANCE | P0 | 10 | 3 | 9 | **DONE** |
| **TASK-006** | Microjob Completion Photo Proof & Before/After Upload Widget | TRUST / ESCROW | P1 | 8 | 3 | 9 | **BACKLOG** |
| **TASK-007** | Live In-Job Safety Check-In & One-Tap Guardian Geoshare SOS | SAFETY / EMERGENCY | P1 | 9 | 4 | 8 | **BACKLOG** |

---

## Detailed Task Specifications & Verification Records

### TASK-001: Job Feed Tab Navigation (Entdecken / Gemerkt / Meine Aufträge) — DONE
- **Description**: Add 3-segment view switch to `jobsScreen.js`:
  1. `🌐 Entdecken` (Discover feed with category, distance, and payment filters)
  2. `⭐ Gemerkt` (Bookmarked jobs only)
  3. `📋 Meine Aufträge` (Jobs where user has applied or been assigned)
- **Status**: Verified in automated Playwright suite with screenshot `feed_saved_tab.png`.

### TASK-002: Report & Safety Incident Workflow (Job/Chat Melden) — DONE
- **Description**: Add safety report button (`🚩 Melden`) to `jobDetailScreen.js` and `messagesScreen.js`.
- **Implementation**:
  - Modal `js/screens/reportModal.js` with 4 violation categories (Jugendschutz-Verstoß, Verdächtiges Inserat, Belästigung, Treuhandverstoß).
  - Prominent emergency helpline banner: Nummer gegen Kummer (116 111) and Notruf (110).
  - Instant confidential submission toast and job flagging.
- **Status**: Verified in automated Playwright suite with screenshot `safety_incident_report_modal.png`.

### TASK-003: Interactive Simulated Employer/Worker Auto-Replies in Chat — DONE
- **Description**: Chat auto-responds contextually within 850ms when user messages about arrival, timing, tools, or completion.
- **Implementation**: `triggerSimulatedReply` in `store.js` parsing intents and adding realistic responses from conversation participant.
- **Status**: Verified in automated Playwright suite.

### TASK-004: Fair Pay & Hourly Rate Indicator in Job Creation Wizard — DONE
- **Description**: Live hourly wage calculation in wizard Step 3 and Step 5 card preview with encouragement badges.
- **Implementation**:
  - Function `calculateHourlyRate(payment, duration)` in `createJobScreen.js`.
  - Dynamic `#wizard-fair-pay-box` recalculating on slider, input, or duration select changes.
  - Step 5 card preview badge displaying `€X.XX/Std`.
- **Status**: Verified in automated Playwright suite with screenshot `create_job_preview_step5.png`.

### TASK-008: Profile Saved Jobs Section & Job Detail Bookmark Integration — DONE
- **User Request**: "ich möchte die möglichkeit haben jobs zu speicheern und die gespeichersten jobs in meinem profil anzusehen"
- **Implementation**:
  - Added `#btn-detail-bookmark` (`⭐ Gemerkt` / `☆ Merken`) in the Job Detail modal header ([`jobDetailScreen.js`](file:///c:/Users/Einrichtung/Desktop/app/js/screens/jobDetailScreen.js)).
  - Added `Gemerkt` count badge in Profile stats grid.
  - Added dedicated **`⭐ Gespeicherte Jobs`** card in [`profileScreen.js`](file:///c:/Users/Einrichtung/Desktop/app/js/screens/profileScreen.js) with list of saved cards, direct detail-view on click, and 1-tap quick remove button (`✕`).
  - Added helpful empty state with "Zu den Microjobs" action when no jobs are saved.
- **Status**: 100% verified in automated Playwright suite with screenshot `profile_screen.png`.

### TASK-009: Permanent, Non-Deactivatable Youth Protection Filter for Minors (§ 22 JArbSchG) — DONE
- **User Request**: "der jugenschutz filter sollte niht deaktivirbar sein"
- **Legal Context**: Under German Youth Employment Act (§ 22 JArbSchG), adolescents must be protected from hazardous work (heavy lifting, dangerous substances, late hours, disposal). Minors must not be able to opt out of safety measures.
- **Implementation**:
  - `store.js`:
    - Added `isMinor()` helper method evaluating user age and category (`user.ageCategory === 'YOUTH_14_17' || user.age < 18`).
    - Enforced protection in `setFilter(key, value)`: Any attempt to set `onlySuitableForMyAge` to `false` for minors is rejected and raises an informative error toast.
  - `jobsScreen.js`:
    - Replaced the deactivation checkbox (`<input type="checkbox" id="check-age-filter">`) with an unmodifiable compliance badge `#youth-protection-locked-badge`: `🛡️ Gesetzlicher Jugendschutz aktiv (JArbSchG)` and `🔒 Dauerhaft aktiv`.
    - Clicking the badge triggers an explanatory toast explaining the statutory non-deactivatability under § 22 JArbSchG.
    - Filter logic strictly removes all jobs marked with `minAge > 17`, `disposal` category, or `ageSuitability` containing `18` whenever `isMinor` is true.
- **Status**: 100% verified in automated Playwright suite (Step 3: badge presence, unbypassable status, exclusion of dangerous 18+ jobs).

### TASK-005: Parent/Guardian Digital Consent Signature & Verification Portal (BGB §§ 107, 113) — DONE
- **Description**: Verifiable digital consent portal for minors under German Civil Law (§§ 107, 113 BGB) and GDPR Art. 8.
- **Implementation**:
  - `guardianConsent.js`: Generation of auditable records with verification code (`QJ-GDR-...`), max weekly hours, authorized categories, and timestamp.
  - Revocation workflow (`revokeAuthorization`) immediately locking minors out of job applications.
  - UI modal `guardianModal.js` and management section in `profileScreen.js`.
- **Status**: 100% verified in `tests/test_compliance.py` (Test 4).

### TASK-010: Centralized Authoritative Legal Eligibility Engine (JArbSchG & KindArbSchV) — DONE
- **Description**: Single source of truth for age classification and job eligibility, enforcing 4 statutory tiers:
  1. Under 13: Absolute prohibition (§ 5 Abs. 1 JArbSchG).
  2. 13–14: KindArbSchV § 2 light work only, max 2 hours/day, between 08:00 and 18:00, with guardian consent.
  3. 15–17: JArbSchG §§ 8, 14, 22 max 8 hours/day, 06:00 to 20:00, dangerous tasks strictly barred.
  4. 18+: General labor law.
- **Implementation**: `js/legal/legalEngine.js`, enforced in `store.js:applyToJob()` and `createJob()`.
- **Status**: 100% verified in `tests/test_compliance.py` (Tests 1, 2, 3).

### TASK-011: Versioned Legal Documents & Explicit AGB Acceptance (BGB § 305 & DDG § 5) — DONE
- **Description**: Maintain versioned legal texts (AGB v1.1, Privacy Policy v1.1, Impressum v1.1, Widerrufsbelehrung, Jugendschutz-Charta).
- **Implementation**:
  - `js/legal/legalDocuments.js` with explicit `[LEGAL_CONFIGURATION_REQUIRED]` placeholders for operator info.
  - `js/screens/legalModal.js` with un-preselected checkbox and audit history logging (`userId`, `version`, `acceptedAt`).
- **Status**: 100% verified in `tests/test_compliance.py` (Test 5).

### TASK-012: TDDDG § 25 Terminal Storage Consent Manager without Dark Patterns — DONE
- **Description**: Legally compliant storage consent banner per § 25 TDDDG. Strictly necessary technologies exempt under § 25 Abs. 2 Nr. 2. Equal prominence for "Alle ablehnen" and "Alle akzeptieren".
- **Implementation**: `js/legal/consentManager.js`, `js/components/consentBanner.js`.
- **Status**: 100% verified in `tests/test_compliance.py` (Test 6).

### TASK-013: GDPR Art. 15-21 Data Subject Rights Portal & Fiscal Retention Hold (§ 147 AO) — DONE
- **Description**: Machine-readable JSON data export (Art. 15, 20 GDPR) and account erasure (Art. 17 GDPR) with mandatory 10-year fiscal retention (`RETENTION_REQUIRED`) under § 147 AO / § 257 HGB.
- **Implementation**: `js/legal/dataSubjectRights.js`, wired to `profileScreen.js`.
- **Status**: 100% verified in `tests/test_compliance.py` (Test 7).

### TASK-014: Adversarial Legal Compliance Automated Playwright Test Suite — DONE
- **Description**: 8 automated adversarial tests actively attempting to bypass statutory child labor bans, duration limits, hazardous tasks, and un-preselected checkboxes.
- **Implementation**: `tests/test_compliance.py` covering all 8 legal scenarios with 100% pass rate.
- **Status**: 100% verified (8/8 passed).

---
*Maintained by QuickJob Autonomous Product Controller*
