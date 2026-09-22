# QUICKJOB — LEGAL & COMPLIANCE AUDIT REPORT
**Document Version:** 1.0.0  
**Audit Date:** 2026-09-22  
**Auditor Roles:** Legal & Compliance Researcher, Privacy Engineer, Security Engineer, Product Engineer, QA Reviewer  
**Jurisdiction:** Federal Republic of Germany (FRG) & European Union (EU)  
**Notice:** This audit report was compiled through rigorous legal engineering analysis of German federal and EU legislation. Per section 26 of the QuickJob Compliance Standard, this analysis distinguishes between *Legal Facts*, *Legal Interpretations*, *Engineering Decisions*, and *Required Qualified Legal Review*. It does not constitute formal legal advice by an independent Rechtsanwalt (attorney-at-law) or certified Datenschutzbeauftragter (DPO).

---

## 1. APPLICABLE LAWS & STATUTES

| Domain | Law / Regulation | Citation / Abbreviation | Official Source | Status / Version |
|---|---|---|---|---|
| **Child & Youth Labor Protection** | Jugendarbeitsschutzgesetz | JArbSchG | [gesetze-im-internet.de/jarbschg](https://www.gesetze-im-internet.de/jarbschg/) | Current Federal Law |
| **Child Labor Protection Ordinance** | Kinderarbeitsschutzverordnung | KindArbSchV | [gesetze-im-internet.de/kindarbschv](https://www.gesetze-im-internet.de/kindarbschv/) | Current Federal Ordinance |
| **Civil Law & Contracts** | Bürgerliches Gesetzbuch | BGB (§§ 104–113, §§ 305–310, §§ 312 ff., § 611a) | [gesetze-im-internet.de/bgb](https://www.gesetze-im-internet.de/bgb/) | Current Federal Code |
| **Data Protection (EU)** | General Data Protection Regulation | GDPR / DSGVO (VO (EU) 2016/679) | [eur-lex.europa.eu](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679) | EU Regulation |
| **Data Protection (Federal)** | Bundesdatenschutzgesetz | BDSG (§ 16) | [gesetze-im-internet.de/bdsg_2018](https://www.gesetze-im-internet.de/bdsg_2018/) | Current Federal Law |
| **Telecommunications & Digital Services Data Protection** | Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz | TDDDG (§ 25) | [gesetze-im-internet.de/tdddg](https://www.gesetze-im-internet.de/tdddg/) | In force since May 2024 |
| **Digital Services Act** | Verordnung über digitale Dienste | DSA (VO (EU) 2022/2065) | [eur-lex.europa.eu](https://eur-lex.europa.eu/eli/reg/2022/2065/oj) | EU Regulation |
| **Digital Services Provider Info** | Digitale-Dienste-Gesetz (formerly TMG) | DDG (§ 5 Impressum) | [gesetze-im-internet.de/ddg](https://www.gesetze-im-internet.de/ddg/) | In force since May 2024 |
| **Financial Supervision & Escrow** | Zahlungsdiensteaufsichtsgesetz | ZAG (§ 1 Abs. 1, § 10) | [gesetze-im-internet.de/zag_2018](https://www.gesetze-im-internet.de/zag_2018/) | BaFin Regulations |
| **Combating Clandestine Work** | Schwarzarbeitsbekämpfungsgesetz | SchwarzArbG (§ 1, § 6) | [gesetze-im-internet.de/schwarzarbg_2004](https://www.gesetze-im-internet.de/schwarzarbg_2004/) | Federal Law |

---

## 2. KEY STATUTORY REQUIREMENTS (IN PRACTICAL TERMS)

### 2.1 Youth & Child Protection (JArbSchG & KindArbSchV)
German labor law creates **four distinct age tiers**, rejecting any binary "under 18" assumption:

1. **Under 13 years (Kinder unter 13)**:
   - *Legal Fact (§ 5 Abs. 1 JArbSchG)*: Absolute ban on employment.
   - *Consequence*: Persons under 13 must never register as workers, accept jobs, or be matched with employers.
2. **13 to 14 years (Kinder 13–14 Jahre)**:
   - *Legal Fact (§ 5 Abs. 3 JArbSchG & KindArbSchV § 2)*: Employment is permitted **only** if:
     - The work is light and suitable for children (KindArbSchV § 2: errands, newspaper delivery, light household tasks, tutoring, babysitting, pet care, shopping without heavy loads).
     - Maximum **2 hours per day** (up to 3 hours in agricultural family businesses).
     - Permitted **only between 08:00 and 18:00**.
     - Strictly forbidden before or during school hours.
     - Strictly requires the verifiable consent/authorization of the legal guardian (Personensorgeberechtigte).
3. **15 to 17 years (Jugendliche 15–17 Jahre)**:
   - *Full-time School Pupils (Vollzeitschulpflichtige Jugendliche, § 5 Abs. 4 JArbSchG)*:
     - Permitted to work during school holidays for a maximum of **4 weeks (20 working days) per calendar year**, or light activities as under § 5 Abs. 3.
   - *Working Hours (§ 8 JArbSchG)*:
     - Max **8 hours per day**, max **40 hours per week**.
   - *Rest Hours & Time of Day (§ 14 JArbSchG)*:
     - Permitted only between **06:00 and 20:00** (special industry exceptions like bakeries do not apply to household microjobs).
   - *Weekend Rest (§§ 16, 17 JArbSchG)*:
     - Work on Saturdays and Sundays is prohibited for youth, with narrow statutory exceptions.
   - *Hazardous Work Prohibitions (§ 22 JArbSchG)*:
     - Strictly forbidden: Work exceeding physical/mental capability, elevated danger of accidents, heights (scaffolding, ladders > 2m, roofs), heavy machinery (chainsaws, power hammer drills), dangerous substances (chemicals, asbestos, poisons, hot bitumen), extreme heat/cold/noise.
   - *Piecework / Tempo Work Prohibition (§ 23 JArbSchG)*:
     - Akkordarbeit (piecework) and tempo-paced tasks are prohibited for minors.
4. **18+ years (Volljährige)**:
   - Governed by standard civil and labor law (ArbZG, BGB).

### 2.2 Civil Law, Contract Formation & Guardianship (BGB)
- **Limited Legal Capacity (§ 106 BGB)**: Minors aged 7 to 17 are limited in contractual capacity.
- **Guardian Consent Requirement (§ 107 BGB)**: Contracts that are not purely legally beneficial (*nicht lediglich rechtlich vorteilhaft*) require the prior consent (*Einwilligung*) or subsequent approval (*Genehmigung*, § 108 BGB) of parents/guardians.
- **Misconception regarding the "Pocket Money Clause" (§ 110 BGB)**:
  - *Legal Fact*: § 110 BGB only validates transactions executed immediately with means provided for that specific purpose or for free disposal. It does **not** validate continuing obligations (*Dauerschuldverhältnisse*), platform terms of service agreements, or employment/service contracts (*Dienstverträge*).
- **Service/Employment Authorization (§ 113 BGB)**:
  - *Legal Fact*: A minor may be generally or specifically authorized by their legal guardian to enter into a service or employment contract. This authorization grants the minor the capacity to undertake legal actions directly related to that employment.
  - *Product Consequence*: QuickJob must provide a formal, verifiable Digital Guardian Authorization & Signature Flow before a minor can accept jobs.

### 2.3 General Terms and Conditions (AGB §§ 305 ff. BGB)
- **Explicit Incorporation (§ 305 Abs. 2 BGB)**: AGB become part of a contract only if the user is explicitly informed before contract conclusion, given a reasonable opportunity to view their content, and explicitly agrees.
- **Evidence Obligation**: QuickJob must maintain an auditable, immutable record proving:
  - User ID,
  - Document identifier and version string (e.g. `AGB_v1.1`),
  - Timestamp of agreement (ISO 8601),
  - Document text checksum/hash,
  - Re-acceptance required upon material updates (no silent replacement).

### 2.4 Data Protection & Privacy (GDPR / BDSG)
- **Lawfulness of Processing (Art. 6 GDPR)**: Every personal data field must be mapped to a specific legal basis:
  - Performance of contract (Art. 6(1)(b) GDPR): User credentials, job details, worker assignments, payment reconciliation.
  - Legal obligation (Art. 6(1)(c) GDPR): Age verification under JArbSchG, financial record retention under § 147 AO / § 257 HGB.
  - Consent (Art. 6(1)(a) GDPR): Non-essential storage, optional marketing/analytics.
  - Legitimate interests (Art. 6(1)(f) GDPR): Platform security, fraud prevention, safety reporting.
- **Processing of Minor Personal Data (Art. 8 GDPR & § 16 BDSG)**:
  - Information society services offered directly to a child require parental consent if the child is under 16 years old.
  - High degree of data minimization: Minors' exact home addresses, phone numbers, and location coordinates must never be publicly exposed or discoverable.
- **Data Subject Rights (Articles 15–21 GDPR)**:
  - Right of Access / Data Portability (Art. 15, 20): Users must be able to export all their account and activity data in a structured JSON format.
  - Right to Rectification (Art. 16) & Restriction (Art. 18).
  - Right to Erasure ("Right to be Forgotten", Art. 17): Users must be able to request complete account deletion, *except* for data subject to statutory tax and commercial retention laws (`RETENTION_REQUIRED` under § 147 AO and § 257 HGB: 10-year retention for payment/billing records).

### 2.5 Cookies & Terminal Storage (TDDDG § 25)
- **Statutory Principle (§ 25 Abs. 1 TDDDG)**: Storing or accessing data on a user's terminal equipment requires informed, unambiguous, and prior consent.
- **Exemptions (§ 25 Abs. 2 Nr. 2 TDDDG)**: Storage strictly necessary to deliver a service explicitly requested by the user does not require consent (e.g., active session token, UI theme preference, safety filter state, consent state record).
- **Prohibition of Dark Patterns**:
  - Rejection of non-essential technologies must be as simple and prominent as acceptance (equal visual weight for "Alle Ablehnen" and "Alle Akzeptieren").
  - Granular selection must be available.
  - Consent must be revocable at any time without adverse consequences.

### 2.6 Digital Services Act & Notice-and-Action (DSA VO (EU) 2022/2065)
- **Notice and Action (Art. 16 DSA)**: The platform must provide an easily accessible, electronic reporting mechanism for illegal content (e.g. hazardous child labor solicitations, safety violations, harassment).
- **Internal Complaint-Handling System (Art. 20 DSA)**: Transparent notification of decisions and the possibility to appeal moderation actions.
- **Protection of Minors (Art. 28 DSA)**: Platforms accessible to minors must guarantee a high level of privacy, safety, and security, and must not engage in targeted profiling for advertising.

### 2.7 Payments, Escrow & BaFin Regulation (ZAG)
- **Custody of Funds (§ 1 Abs. 1 ZAG)**: Holding third-party funds in escrow constitutes regulated money transmission / escrow activity requiring a BaFin banking or payment institution license.
- *Engineering Decision & Disclaimer*: QuickJob cannot act as an unlicensed escrow custodian. In production, QuickJob must route payments through a licensed payment service provider (e.g., BaFin-licensed Stripe Connect / Mangopay escrow). The UI and documentation must clearly state this requirement.

---

## 3. AUDIT OF THE CURRENT QUICKJOB APPLICATION (GAP ANALYSIS)

| Area | Current Implementation State | Identified Legal Gap | Severity | Risk Level |
|---|---|---|---|---|
| **Age Classification** | 3 coarse buckets (`YOUTH_14_17`, `YOUNG_WORKER_18_25`, `ADULT`) | Missing explicit statutory tiering: **Under 13** (absolute ban) and **13–14** (KindArbSchV 2h/day, 8–18h window, parental consent) | High | Critical (P0) |
| **Eligibility Rule Engine** | Ad-hoc checks scattered in `safetyClassifier.js`, `jobsScreen.js`, and `store.js` | Lack of a centralized, authoritative `LegalEligibilityEngine` enforcing KindArbSchV, JArbSchG §§ 5, 8, 14, 22 on both UI and state/backend levels | High | Critical (P0) |
| **Guardian Authorization** | Simulated boolean flag `hasParentConsent: true` on mock Jasper | No formal legal consent workflow, no guardian data capture, no verifiability, no revocability mechanism under BGB §§ 107, 113 | High | Critical (P0) |
| **Terms of Service (AGB)** | No explicit acceptance dialog, no version tracking | Failure to meet § 305 Abs. 2 BGB incorporation requirements; lack of auditable acceptance logs (`userId`, `version`, `timestamp`) | High | Critical (P0) |
| **Cookie / Storage Consent** | LocalStorage used without TDDDG § 25 banner or category classification | Missing TDDDG § 25 consent management system with equal Accept/Reject buttons, category classification, and revocation interface | Medium | High (P1) |
| **Data Subject Rights** | No export, no deletion with retention logic | Violation of GDPR Articles 15 (access/export) and 17 (erasure with § 147 AO retention exceptions) | Medium | High (P1) |
| **Platform Info / Impressum** | Generic safety modal exists; no statutory Impressum under § 5 DDG | Missing statutory provider identification; placeholders needed with `LEGAL_CONFIGURATION_REQUIRED` | Medium | Medium (P2) |
| **Notice & Action (DSA)** | Basic `reportModal.js` exists | Needs formalization under Art. 16 DSA with transparent confirmation and appeal documentation | Low | Medium (P2) |

---

## 4. CONCRETE ENGINEERING & PRODUCT REQUIREMENTS

### 4.1 Centralized `LegalEligibilityEngine` (`js/legal/legalEngine.js`)
Inputs:
- Worker age (exact integer)
- School status (`in_school` vs `completed`)
- Task category (household, garden, disposal, shopping, animals, carrying, tech, tutoring, other)
- Job text (title, description)
- Scheduled time of day (e.g. `14:00`, `19:30`, `21:00`)
- Estimated duration (hours)
- Physical parameters (heavy lifting keywords, machinery, heights)

Outputs:
```json
{
  "isEligible": false,
  "ageTier": "CHILD_13_14",
  "reason": "Tasks over 2 hours violate KindArbSchV § 2 for 13–14 year olds.",
  "legalBasis": "§ 5 Abs. 3 JArbSchG i.V.m. § 2 KindArbSchV",
  "guardianConsentRequired": true,
  "blockedReason": "MAX_HOURS_EXCEEDED",
  "reviewRequired": false
}
```

### 4.2 Legal Guardian Portal & Digital Authorization (`js/legal/guardianConsent.js`)
- Minors (under 18) must have an active Guardian Authorization on file before:
  - Applying for any microjob,
  - Entering into a service agreement under BGB § 113,
  - Processing personal data under GDPR Art. 8.
- Workflow:
  1. Minor requests authorization by providing Guardian Name, Guardian Email/Phone, and Relationship (Mutter, Vater, Vormund).
  2. Guardian receives formal declaration of consent specifying:
     - Permitted activity types (KindArbSchV-compliant),
     - Maximum weekly hours,
     - Right to revoke consent at any time (*Widerrufsrecht*).
  3. Guardian confirms with digital signature / timestamped acceptance.
  4. System records `GUARDIAN_AUTHORIZATION` audit record.

### 4.3 Versioned Legal Documents & Explicit AGB Acceptance (`js/legal/legalDocuments.js`)
- Maintained documents:
  - `AGB_v1.1` (Allgemeine Geschäftsbedingungen mit Plattformregeln, Pflichten, Haftungsbeschränkung nach §§ 305 ff. BGB),
  - `PRIVACY_POLICY_v1.1` (Datenschutzerklärung nach Art. 13/14 DSGVO),
  - `IMPRESSUM_v1.1` (Anbieterkennzeichnung gem. § 5 DDG mit `LEGAL_CONFIGURATION_REQUIRED`),
  - `WIDERRUF_v1.0` (Widerrufsbelehrung für Verbraucher gem. § 312g, § 355 BGB),
  - `YOUTH_PROTECTION_v1.0` (Jugendschutz-Charta nach JArbSchG).
- Explicit Acceptance Dialog:
  - Checkbox cannot be preselected.
  - Audit trail recorded in store: `{ userId, documentId, version, acceptedAt, userAgent }`.
  - Material update triggers re-acceptance prompt.

### 4.4 TDDDG § 25 Compliant Consent Manager (`js/legal/consentManager.js`)
- Banner displayed on first launch.
- Two equal prominent buttons: `[Alle ablehnen]` and `[Alle akzeptieren]`, plus `[Einstellungen anpassen]`.
- Categories:
  1. `strictly_necessary` (Session, Security, Jugendschutz-Filter-State, Consent-Token — always active).
  2. `functional_preferences` (Saved UI layout, theme — optional).
  3. `anonymous_analytics` (Local performance counters — optional, blocked until consent).
- Re-accessible at any time from Profile / Footer.

### 4.5 GDPR Data Subject Rights Portal (`js/legal/dataSubjectRights.js`)
- **Art. 15 / 20 Data Export**: Instant download of all personal user data as structured JSON (`quickjob-data-export.json`).
- **Art. 17 Account Deletion**:
  - Transparent deletion of profiles, messages, and non-essential logs.
  - Mandatory preservation of fiscal/transaction data under `RETENTION_REQUIRED` (§ 147 AO, § 257 HGB: 10-year retention rule explained clearly to user).

---

## 5. OPEN LEGAL QUESTIONS (REQUIRING QUALIFIED LAWYER REVIEW)

The following items are categorized as **`LAWYER_REVIEW_REQUIRED`** and must not be treated as final legal certainty without external legal counsel:
1. **Platform Liability & Tax Classification**:
   - Question: Does QuickJob's fixed pricing recommendation create a risk of being classified as an employer or temporary employment agency (*Arbeitnehmerüberlassung*) rather than an intermediary marketplace?
   - Professional Review: Labor Law Specialist (*Fachanwalt für Arbeitsrecht*).
2. **Payment Escrow Exemption**:
   - Question: Does the simulated escrow escrow flow require a commercial agency exemption (*Handelsvertreterprivileg*, § 2 Abs. 1 Nr. 2 ZAG) if QuickJob acts on behalf of both buyer and seller?
   - Professional Review: Banking & Financial Regulatory Specialist (*BaFin-Experte / Fachanwalt für Bankrecht*).
3. **Parental Verification Standard**:
   - Question: Does email-based guardian confirmation satisfy the requirement for "reasonable efforts to verify consent" under GDPR Art. 8(2) for informational services, or is Video-Ident / PostIdent required for minors under 16?
   - Professional Review: Data Protection Officer / Privacy Attorney (*Datenschutz-Fachanwalt*).

---
*Signed by: QuickJob Compliance Engineering Team*
