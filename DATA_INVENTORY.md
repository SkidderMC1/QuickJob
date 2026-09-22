# QUICKJOB — DATA PROCESSING INVENTORY & PRIVACY MAP
**Legal Standard:** General Data Protection Regulation (GDPR / DSGVO Art. 30)  
**Version:** 1.0.0  
**Date:** 2026-09-22  

---

## 1. Overview & Data Minimization Principles
QuickJob adheres strictly to **Privacy by Design and Privacy by Default** (Art. 25 GDPR). Personal data is collected solely for explicit, legitimate purposes (Art. 5(1)(b) GDPR) and minimized to what is strictly necessary (Art. 5(1)(c) GDPR). Minors receive special protection under GDPR Art. 8, recitals 38 & 75, and § 16 BDSG.

---

## 2. Processing Activities Registry

| Process ID | Processing Activity | Categories of Personal Data | Purpose of Processing | Legal Basis (GDPR) | Data Subjects | Internal / External Recipients | Retention Period | Deletion / Anonymization Rule | International Transfers |
|---|---|---|---|---|---|---|---|---|---|
| **DPA-01** | Account Creation & Authentication | Name, email address, password hash, date of birth / age | User account management, identity validation, age verification for JArbSchG | Art. 6(1)(b) (Contract), Art. 6(1)(c) (Legal obligation JArbSchG) | Registered workers & employers | QuickJob core DB | Duration of account active status | Deleted within 30 days of account closure request | None (EU/EEA hosted) |
| **DPA-02** | Minor Age Tiering & Legal Gatekeeping | Age, school pupil status, guardian contact details | Enforcing statutory JArbSchG and KindArbSchV work restrictions | Art. 6(1)(c) (JArbSchG § 5, 8, 14, 22), Art. 8 GDPR | Minors (13–17 yrs), Legal guardians | QuickJob Legal Eligibility Engine | Duration of minor status + 3 years (regular limitation § 195 BGB) | Anonymized upon reaching age of majority (18 yrs) | None |
| **DPA-03** | Legal Guardian Digital Consent | Guardian name, email, relationship, digital signature timestamp | Evidence of parental authorization under BGB §§ 107, 113 & GDPR Art. 8 | Art. 6(1)(c) & Art. 6(1)(f) (Defense against legal claims) | Legal guardians of minors | QuickJob compliance log | Duration of minor's active account + 3 years (§ 195 BGB) | Archived in compliance vault until expiry | None |
| **DPA-04** | Job Posting & Publishing | Job title, description, category, approx location, scheduled time, budget | Facilitating neighborhood matching of tasks | Art. 6(1)(b) (Contract) | Employers | Public feed / matched workers | Until task completed or cancelled | Exact address deleted from cache after job completion | None |
| **DPA-05** | Geolocation & Privacy-Protected Address | Approximate district (public), exact street address (confidential) | Enabling worker to arrive at location; protecting domestic safety | Art. 6(1)(b) (Performance of task) | Employers, domestic premises | Assigned worker only (post-contract) | Exact address visible only during active job window | Concealed automatically once job enters COMPLETED state | None |
| **DPA-06** | In-App Messaging & Notifications | Chat messages, timestamps, participant IDs | Enabling direct task coordination and safety monitoring | Art. 6(1)(b) (Coordination) | Employers, workers | Both conversation participants, moderation upon report | Active job cycle + 90 days dispute window | Deleted upon account erasure unless safety dispute reported | None |
| **DPA-07** | Reviews, Ratings & Badges | Numerical rating (1–5), compliments tags, public feedback text | Quality assurance, trustworthiness, community reputation | Art. 6(1)(b) (Platform review system) | Employers, workers | Public platform users | Lifetime of user profile | Retained as anonymized feedback if account deleted | None |
| **DPA-08** | Payment Reconciliation & Wallet | Payment amount, currency, escrow state, bank payout IBAN (masked) | Financial settlement of completed tasks, escrow execution | Art. 6(1)(b) & Art. 6(1)(c) (Tax compliance § 147 AO, § 257 HGB) | Workers, employers | BaFin-regulated Payment Provider (e.g. Stripe), Tax authorities upon audit | **10 years mandatory retention** (`RETENTION_REQUIRED`) | Financial ledgers locked; PII stripped after 10-year statutory window | Regulated EU payment partner |
| **DPA-09** | Safety Incident & Abuse Reporting | Reporter ID, reported user ID, violation category, text description | Platform security, preventing child endangerment, DSA compliance | Art. 6(1)(c) (DSA Art. 16) & Art. 6(1)(f) (Platform safety) | Reporting users, reported users | Safety & Trust Team, Law enforcement if criminal | 3 years or until closure of statutory proceedings | Archived securely in restricted audit storage | None |
| **DPA-10** | Terminal Storage & Device State | LocalStorage keys (`quickjob_state_v1`, consent tokens) | Functional state, offline PWA cache, TDDDG § 25 consent recording | § 25 Abs. 2 Nr. 2 TDDDG (Necessary) & Art. 6(1)(a) (Consent for optional) | Website & PWA visitors | User device local storage | Until browser cache cleared or user revokes consent | Instant clearance via Privacy Settings | None |

---

## 3. Data Subject Rights Request Matrix (DSAR)
- **Art. 15 (Access)**: User clicks "Daten-Export herunterladen" in Settings -> System generates comprehensive JSON dump.
- **Art. 16 (Rectification)**: User can edit profile details, bio, and skills directly.
- **Art. 17 (Erasure)**: User clicks "Konto löschen" -> Profile data, chat threads, and preferences are purged immediately; financial ledger entries are preserved under `RETENTION_REQUIRED` citing § 147 AO.
- **Art. 21 (Objection)**: Right to object to non-essential processing via TDDDG Consent Manager.

---
*Maintained by QuickJob Data Protection Officer / Privacy Engineering*
