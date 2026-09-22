# QUICKJOB — LEGAL REQUIREMENTS DATABASE & COMPLIANCE REGISTRY
**Status Standard:** ISO/IEC 27001 & GDPR Art. 25 Traceability  
**Auditor:** QuickJob Compliance Engineering Team  
**Review Date:** 2026-09-22  

---

## 1. Traceability Schema
Every legal requirement follows strict end-to-end traceability:
```
LAW & SECTION 
  → STATUTORY REQUIREMENT 
  → PRODUCT RULE 
  → CODE IMPLEMENTATION 
  → COMPLIANCE TEST 
  → VERIFICATION RESULT
```

---

## 2. Requirement Registry

### REQ-YOUTH-001: Absolute Prohibition of Child Labor Under 13 Years
- **ID**: `REQ-YOUTH-001`
- **Legal Area**: Employment / Youth Protection
- **Law**: Jugendarbeitsschutzgesetz (JArbSchG)
- **Section**: § 5 Abs. 1
- **Official Source**: [gesetze-im-internet.de/jarbschg/__5.html](https://www.gesetze-im-internet.de/jarbschg/__5.html)
- **Source Date**: Valid as of 2026-09-22
- **Statutory Requirement**: Children under 13 years of age may not be employed under any circumstances.
- **Applies To**: All users under 13 years of age.
- **Product Consequence**: Children under 13 cannot register as workers, accept tasks, or be matched with microjobs.
- **Technical Consequence**: Centralized `LegalEligibilityEngine` hard-blocks any user with `age < 13` with `isEligible: false`, `reasonCode: PROHIBITED_UNDER_13`. Store and UI reject application.
- **Implementation Status**: `IMPLEMENTED`
- **Verification Status**: `VERIFIED`
- **Legal Review Required**: `NO` (Clear statutory fact)
- **Traceability**:
  - *Law*: JArbSchG § 5 Abs. 1
  - *Product Rule*: PR-YOUTH-UNDER-13-BAN
  - *Code*: `js/legal/legalEngine.js:evaluateEligibility()` & `js/state/store.js:applyToJob()`
  - *Test*: `tests/test_compliance.py::test_under_13_absolute_block`

---

### REQ-YOUTH-002: Restricted Permitted Work for Children Aged 13–14 (KindArbSchV)
- **ID**: `REQ-YOUTH-002`
- **Legal Area**: Employment / Youth Protection
- **Law**: JArbSchG § 5 Abs. 3 & Kinderarbeitsschutzverordnung (KindArbSchV)
- **Section**: JArbSchG § 5 Abs. 3, KindArbSchV §§ 1, 2
- **Official Source**: [gesetze-im-internet.de/kindarbschv/__2.html](https://www.gesetze-im-internet.de/kindarbschv/__2.html)
- **Source Date**: Valid as of 2026-09-22
- **Statutory Requirement**: Children aged 13–14 may only perform light, suitable activities (KindArbSchV § 2) for maximum 2 hours daily, strictly between 08:00 and 18:00, not before or during school, and only with guardian consent.
- **Applies To**: Users aged 13 to 14.
- **Product Consequence**: Maximum task duration capped at 2.0 hours. Scheduled times before 08:00 or after 18:00 are blocked. Only permitted categories allowed (garden, errands, tutoring, pet care, light tech).
- **Technical Consequence**: `LegalEligibilityEngine` validates `category`, `duration <= 2`, `time >= 08:00 && time <= 18:00`, and checks `hasGuardianConsent`.
- **Implementation Status**: `IMPLEMENTED`
- **Verification Status**: `VERIFIED`
- **Legal Review Required**: `NO`
- **Traceability**:
  - *Law*: JArbSchG § 5(3), KindArbSchV § 2
  - *Product Rule*: PR-YOUTH-13-14-LIMITS
  - *Code*: `js/legal/legalEngine.js`
  - *Test*: `tests/test_compliance.py::test_child_13_14_limitations`

---

### REQ-YOUTH-003: Hazardous Work and Physical Strain Restrictions (15–17 Years)
- **ID**: `REQ-YOUTH-003`
- **Legal Area**: Employment / Youth Protection
- **Law**: JArbSchG
- **Section**: §§ 14, 22, 23
- **Official Source**: [gesetze-im-internet.de/jarbschg/__22.html](https://www.gesetze-im-internet.de/jarbschg/__22.html)
- **Source Date**: Valid as of 2026-09-22
- **Statutory Requirement**: Prohibits hazardous tasks (heights, machinery, toxic chemicals, heavy disposal, over-strain) and night work after 20:00 for youth under 18. Piecework prohibited (§ 23).
- **Applies To**: Users aged 15 to 17.
- **Product Consequence**: Permanent non-deactivatable safety filter. 18+ hazardous disposal, chemicals, chainsaws, ladders, and post-20:00 tasks are barred.
- **Technical Consequence**: `LegalEligibilityEngine` scans danger taxonomy and time constraints. `store.js` protects filter from deactivation.
- **Implementation Status**: `IMPLEMENTED`
- **Verification Status**: `VERIFIED`
- **Legal Review Required**: `NO`
- **Traceability**:
  - *Law*: JArbSchG §§ 14, 22
  - *Product Rule*: PR-YOUTH-15-17-SAFETY
  - *Code*: `js/legal/legalEngine.js`, `js/screens/jobsScreen.js`, `js/state/store.js`
  - *Test*: `tests/test_flows.py` Step 3 & `tests/test_compliance.py`

---

### REQ-CIVIL-001: Guardian Contract Authorization for Minors (BGB §§ 107, 113)
- **ID**: `REQ-CIVIL-001`
- **Legal Area**: Civil Law / Contract Formation
- **Law**: Bürgerliches Gesetzbuch (BGB)
- **Section**: §§ 106, 107, 108, 113
- **Official Source**: [gesetze-im-internet.de/bgb/__113.html](https://www.gesetze-im-internet.de/bgb/__113.html)
- **Source Date**: Valid as of 2026-09-22
- **Statutory Requirement**: Contracts entered by minors (7–17) require guardian consent or authorization (§ 113 BGB for service/employment).
- **Applies To**: All users aged 13 to 17.
- **Product Consequence**: Minor must complete a Digital Guardian Consent flow before applying for tasks. Guardian can view authorized terms and revoke consent.
- **Technical Consequence**: `guardianConsent.js` module storing verifiable consent records: `{ minorId, guardianName, guardianEmail, relationship, authorizedAt, status, termsVersion }`.
- **Implementation Status**: `IMPLEMENTED`
- **Verification Status**: `VERIFIED`
- **Legal Review Required**: `YES` (Formal verification threshold review)
- **Traceability**:
  - *Law*: BGB §§ 107, 113
  - *Product Rule*: PR-CIVIL-GUARDIAN-CONSENT
  - *Code*: `js/legal/guardianConsent.js` & `js/screens/profileScreen.js`
  - *Test*: `tests/test_compliance.py::test_guardian_consent_flow`

---

### REQ-CIVIL-002: Transparent AGB Incorporation & Versioned Audit Trail (BGB §§ 305 ff.)
- **ID**: `REQ-CIVIL-002`
- **Legal Area**: Civil Law / AGB
- **Law**: BGB
- **Section**: §§ 305, 305a, 305c, 307
- **Official Source**: [gesetze-im-internet.de/bgb/__305.html](https://www.gesetze-im-internet.de/bgb/__305.html)
- **Source Date**: Valid as of 2026-09-22
- **Statutory Requirement**: Terms must be explicitly brought to the user's attention prior to contract conclusion, with opportunity to inspect, and explicitly accepted. No silent changes.
- **Applies To**: All platform users.
- **Product Consequence**: Explicit modal with un-preselected checkbox; recorded acceptance log with exact document version (e.g. `AGB_v1.1`), timestamp, and user ID.
- **Technical Consequence**: Store records `agbAcceptanceHistory: [{ documentId, version, acceptedAt, userId }]`.
- **Implementation Status**: `IMPLEMENTED`
- **Verification Status**: `VERIFIED`
- **Legal Review Required**: `YES` (Substantive clause review by attorney)
- **Traceability**:
  - *Law*: BGB § 305 Abs. 2
  - *Product Rule*: PR-CIVIL-EXPLICIT-AGB
  - *Code*: `js/legal/legalDocuments.js` & `js/screens/legalModal.js`
  - *Test*: `tests/test_compliance.py::test_agb_explicit_acceptance`

---

### REQ-PRIV-001: Data Protection by Design & Minor Privacy (GDPR Art. 5, 8, 25)
- **ID**: `REQ-PRIV-001`
- **Legal Area**: Data Protection
- **Law**: DSGVO (Regulation (EU) 2016/679) & BDSG
- **Section**: Art. 5(1)(c), Art. 8, Art. 25 GDPR; § 16 BDSG
- **Official Source**: [eur-lex.europa.eu](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679)
- **Source Date**: Valid as of 2026-09-22
- **Statutory Requirement**: High level of privacy for minors; strict data minimization; exact home addresses and precise geolocation coordinates must never be publicly exposed.
- **Applies To**: All platform users, specifically minors.
- **Product Consequence**: Exact addresses are concealed in general feeds and revealed only to assigned workers after contract confirmation. Minor contact data is protected.
- **Technical Consequence**: Feed renders only `approxLocation`. `exactAddress` gated behind assignment check.
- **Implementation Status**: `IMPLEMENTED`
- **Verification Status**: `VERIFIED`
- **Legal Review Required**: `NO`
- **Traceability**:
  - *Law*: GDPR Art. 5(1)(c), Art. 25
  - *Product Rule*: PR-PRIV-LOCATION-MINIMIZATION
  - *Code*: `js/screens/jobDetailScreen.js` & `js/screens/jobsScreen.js`
  - *Test*: `tests/test_flows.py` Step 4

---

### REQ-PRIV-002: Data Subject Rights & Fiscal Retention Exceptions (GDPR Art. 15, 17)
- **ID**: `REQ-PRIV-002`
- **Legal Area**: Data Protection
- **Law**: DSGVO Art. 15, 17, 20 i.V.m. Abgabenordnung (AO) § 147 & Handelsgesetzbuch (HGB) § 257
- **Section**: GDPR Art. 15, 17(3)(b); § 147 AO; § 257 HGB
- **Official Source**: [eur-lex.europa.eu](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679)
- **Source Date**: Valid as of 2026-09-22
- **Statutory Requirement**: Users have the right to access and export their data (Art. 15, 20) and request erasure (Art. 17). However, tax and commercial law requires preserving accounting/payment records for 10 years (`RETENTION_REQUIRED`).
- **Applies To**: All users.
- **Product Consequence**: Settings portal provides:
  1. `Daten-Export herunterladen (JSON)` (instant export).
  2. `Konto löschen` (erases profile, chat, credentials, but maintains an anonymized financial ledger record citing § 147 AO).
- **Technical Consequence**: `dataSubjectRights.js` module handling JSON export and selective erasure with statutory audit retention.
- **Implementation Status**: `IMPLEMENTED`
- **Verification Status**: `VERIFIED`
- **Legal Review Required**: `NO`
- **Traceability**:
  - *Law*: GDPR Art. 15, 17; § 147 AO
  - *Product Rule*: PR-PRIV-DATA-SUBJECT-RIGHTS
  - *Code*: `js/legal/dataSubjectRights.js` & `js/screens/profileScreen.js`
  - *Test*: `tests/test_compliance.py::test_data_export_and_retention_deletion`

---

### REQ-CONSENT-001: Terminal Storage Consent Without Dark Patterns (TDDDG § 25)
- **ID**: `REQ-CONSENT-001`
- **Legal Area**: Telecommunications & Digital Media Privacy
- **Law**: TDDDG
- **Section**: § 25 Abs. 1, Abs. 2 Nr. 2
- **Official Source**: [gesetze-im-internet.de/tdddg/__25.html](https://www.gesetze-im-internet.de/tdddg/__25.html)
- **Source Date**: Valid as of 2026-09-22
- **Statutory Requirement**: Terminal storage requires informed, prior consent. Strictly necessary storage is exempt. No dark patterns; rejection must be equally accessible as acceptance.
- **Applies To**: All visitors and users.
- **Product Consequence**: Consent banner with equal buttons `[Alle ablehnen]` and `[Alle akzeptieren]`. Only `strictly_necessary` storage is written before consent. Optional analytics/personalization disabled upon rejection. Revocation available at any time.
- **Technical Consequence**: `consentManager.js` gatekeeping storage keys.
- **Implementation Status**: `IMPLEMENTED`
- **Verification Status**: `VERIFIED`
- **Legal Review Required**: `NO`
- **Traceability**:
  - *Law*: TDDDG § 25
  - *Product Rule*: PR-CONSENT-TDDDG-COMPLIANT
  - *Code*: `js/legal/consentManager.js` & `js/components/consentBanner.js`
  - *Test*: `tests/test_compliance.py::test_tdddg_consent_flow`

---

### REQ-PLATFORM-001: Provider Information / Impressum (DDG § 5)
- **ID**: `REQ-PLATFORM-001`
- **Legal Area**: Platform Regulation
- **Law**: Digitale-Dienste-Gesetz (DDG)
- **Section**: § 5
- **Official Source**: [gesetze-im-internet.de/ddg/__5.html](https://www.gesetze-im-internet.de/ddg/__5.html)
- **Source Date**: Valid as of 2026-09-22
- **Statutory Requirement**: Full provider identification (name, legal form, address, email, fast contact, commercial register, VAT ID).
- **Applies To**: Platform operator.
- **Product Consequence**: Dedicated Impressum view accessible within 2 clicks from any screen. Missing real-world production data explicitly tagged as `LEGAL_CONFIGURATION_REQUIRED`.
- **Technical Consequence**: `legalDocuments.js:getImpressum()` rendering compliant structure.
- **Implementation Status**: `IMPLEMENTED`
- **Verification Status**: `VERIFIED`
- **Legal Review Required**: `YES` (Operator company details)
- **Traceability**:
  - *Law*: DDG § 5
  - *Product Rule*: PR-PLATFORM-IMPRESSUM
  - *Code*: `js/legal/legalDocuments.js`
  - *Test*: `tests/test_compliance.py::test_impressum_structure`

---

### REQ-PLATFORM-002: Notice and Action & Child Safety Reporting (DSA Art. 16, 28)
- **ID**: `REQ-PLATFORM-002`
- **Legal Area**: Digital Services Act
- **Law**: Verordnung (EU) 2022/2065 (DSA)
- **Section**: Art. 16, 20, 28
- **Official Source**: [eur-lex.europa.eu](https://eur-lex.europa.eu/eli/reg/2022/2065/oj)
- **Source Date**: Valid as of 2026-09-22
- **Statutory Requirement**: Electronic notification mechanism for illegal content with prompt confirmation, reasoned decision-making, and high minor safety safeguards.
- **Applies To**: Platform users, employers, workers.
- **Product Consequence**: Report modal with structured categories (Jugendschutz, Verdacht auf Ausbeutung/Gefahr, Belästigung, Betrug). Confirmation and emergency hotlines (116 111, 110).
- **Technical Consequence**: Flagged listings instantly marked `moderation: 'FLAGGED'`; audit trail recorded.
- **Implementation Status**: `IMPLEMENTED`
- **Verification Status**: `VERIFIED`
- **Legal Review Required**: `NO`
- **Traceability**:
  - *Law*: DSA Art. 16, 28
  - *Product Rule*: PR-DSA-NOTICE-AND-ACTION
  - *Code*: `js/screens/reportModal.js`
  - *Test*: `tests/test_flows.py` Step 4

---
*Maintained by QuickJob Compliance Engineering*
