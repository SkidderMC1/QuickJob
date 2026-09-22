# QuickJob Dynamic Task System (Living Product State)

## Task Universe Overview

| ID | Title | Type | Priority | Impact | Effort | Confidence | Status |
|---|---|---|---|---|---|---|---|
| **TASK-001** | Job Feed Tab Navigation (Entdecken / Gemerkt / Meine Aufträge) | UX / FEATURE | P1 | 8 | 3 | 9 | **DONE** |
| **TASK-002** | Report & Safety Incident Workflow (Job/Chat Melden & Notfall-Hotline) | SECURITY / SAFETY | P0 | 9 | 3 | 9 | **DONE** |
| **TASK-003** | Interactive Simulated Employer/Worker Auto-Replies in Chat | UX / INTERACTION | P2 | 7 | 2 | 9 | **DONE** |
| **TASK-004** | Fair Pay & Hourly Rate Indicator in Job Creation Wizard | UX / FEATURE | P2 | 8 | 2 | 9 | **DONE** |
| **TASK-005** | Parent/Guardian Digital Consent Signature & Verification Portal | LEGAL / SAFETY | P1 | 9 | 3 | 9 | **READY** |
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

### TASK-005: Parent/Guardian Digital Consent Signature & Verification Portal — READY
- **Description**: Provide an interactive verification flow for minors under 16 with parent phone/SMS consent verification badge.
- **Acceptance Criteria**:
  - Minors 14–15 receive a dedicated "Eltern-Zustimmung" status widget in Profile.
  - Generates verifiable SMS/QR consent request link.
  - Profile and applicant modal display "Eltern-Zustimmung verifiziert ✓ (§ 5 JArbSchG)".

---
*Maintained by QuickJob Autonomous Product Controller*
