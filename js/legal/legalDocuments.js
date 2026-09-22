/**
 * QuickJob Versioned Legal Documents Architecture
 * Provides immutable, versioned texts for AGB, Privacy Policy, Impressum (§ 5 DDG),
 * Consumer Cancellation Policy (§§ 312g, 355 BGB), and Youth Protection Charter.
 *
 * Missing real-world production data is explicitly flagged as [LEGAL_CONFIGURATION_REQUIRED].
 */

export const LegalDocumentTypes = {
  AGB: 'AGB',
  PRIVACY: 'PRIVACY',
  IMPRESSUM: 'IMPRESSUM',
  WIDERRUF: 'WIDERRUF',
  YOUTH_PROTECTION: 'YOUTH_PROTECTION'
};

export const LEGAL_DOCUMENTS = {
  AGB: {
    id: 'AGB',
    title: 'Allgemeine Geschäftsbedingungen (AGB)',
    version: '1.1.0',
    effectiveFrom: '2026-09-22',
    lawyerReviewStatus: 'DRAFT_REQUIRING_QUALIFIED_LAWYER_REVIEW',
    summary: 'Vertragsbedingungen für die Vermittlung und Durchführung von Nachbarschafts-Microjobs über QuickJob.',
    content: `
# Allgemeine Geschäftsbedingungen (AGB) der Plattform QuickJob
**Version:** 1.1.0 (Stand: 22. September 2026)  
*Status: Technischer Entwurf — Erfordert anwaltliche Endprüfung durch Fachanwalt für IT- und Arbeitsrecht.*

## 1. Geltungsbereich & Vertragsgegenstand
1.1 Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform QuickJob (Webanwendung, PWA und mobile Ansichten) durch registrierte Nutzer (Auftraggeber und Auftragnehmer/Helfer).  
1.2 QuickJob ist eine Vermittlungsplattform, die private Nachbarschaftshilfe, Miniaufträge und Hilfstätigkeiten zwischen Nutzern koordiniert. Soweit nicht ausdrücklich anders vereinbart, kommt der eigentliche Dienst- oder Werkvertrag über die zu erbringende Leistung unmittelbar zwischen dem Auftraggeber und dem Helfer zustande.

## 2. Registrierung & Minderjährigenschutz (§§ 106 ff., 113 BGB; JArbSchG)
2.1 Die Registrierung als Helfer ist ab vollendetem 13. Lebensjahr zulässig. Für Personen unter 13 Jahren gilt ein ausnahmsloses Nutzungsverbot (§ 5 Abs. 1 JArbSchG).  
2.2 Minderjährige Nutzer (13 bis 17 Jahre) bedürfen zur wirksamen Registrierung und Annahme von Aufträgen der ausdrücklichen Einwilligung ihrer Personensorgeberechtigten (gesetzlichen Vertreter) gemäß §§ 107, 113 BGB.  
2.3 QuickJob behält sich vor, Nachweise über die Einwilligung der Personensorgeberechtigten anzufordern und Konten ohne verifizierte Zustimmung für Auftragsannahmen zu sperren.

## 3. Zulässige Tätigkeiten & Jugendarbeitsschutz
3.1 Für Minderjährige sind Tätigkeiten, die den Bestimmungen des Jugendarbeitsschutzgesetzes (JArbSchG) oder der Kinderarbeitsschutzverordnung (KindArbSchV) widersprechen, streng untersagt.  
3.2 Insbesondere sind gefährliche Arbeiten (§ 22 JArbSchG), Arbeiten mit schweren Lasten, giftigen Stoffen, gefährlichen Werkzeugen (z. B. Motorsägen), Höhenarbeiten sowie Arbeiten nach 20:00 Uhr (bzw. nach 18:00 Uhr für Kinder von 13–14 Jahren) für Minderjährige gesperrt.

## 4. Zahlungsabwicklung & Treuhand (Escrow)
4.1 Zahlungen zwischen Auftraggebern und Helfern werden über einen lizenzierten Zahlungsdienstleister (z. B. BaFin-reguliertes E-Geld-Institut / Stripe Connect) treuhänderisch abgewickelt. QuickJob selbst verwahrt keine Fremdgelder ohne aufsichtsrechtliche Genehmigung (§ 1 ZAG).  
4.2 Der vereinbarte Vergütungsbetrag wird bei Auftragsvergabe im Treuhand-Wallet reserviert und nach Bestätigung der ordnungsgemäßen Ausführung durch den Auftraggeber freigegeben.

## 5. Haftung & Gewährleistung (§§ 307 ff. BGB)
5.1 QuickJob haftet für Vorsatz und grobe Fahrlässigkeit uneingeschränkt. Für leichte Fahrlässigkeit haftet QuickJob nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten), beschränkt auf den vertragstypisch vorhersehbaren Schaden.  
5.2 Für die tatsächliche Durchführung und Mangelfreiheit der vermittelten Hilfstätigkeiten haften die Vertragsparteien (Auftraggeber und Helfer) nach den gesetzlichen Bestimmungen des BGB.

## 6. Schlussbestimmungen
6.1 Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.  
6.2 Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
    `
  },

  PRIVACY: {
    id: 'PRIVACY',
    title: 'Datenschutzerklärung (DSGVO / BDSG)',
    version: '1.1.0',
    effectiveFrom: '2026-09-22',
    lawyerReviewStatus: 'DSGVO_COMPLIANT_ARCHITECTURE',
    summary: 'Informationen über Art, Umfang und Zwecke der Erhebung und Verwendung personenbezogener Daten gem. Art. 13/14 DSGVO.',
    content: `
# Datenschutzerklärung der Plattform QuickJob
**Version:** 1.1.0 (Stand: 22. September 2026)

## 1. Verantwortlicher
Verantwortliche Stelle im Sinne der Datenschutz-Grundverordnung (DSGVO) und des Bundesdatenschutzgesetzes (BDSG):  
**[LEGAL_CONFIGURATION_REQUIRED: Plattformbetreiber / QuickJob Betreibergesellschaft]**  
E-Mail: datenschutz@quickjob.local  
Datenschutzbeauftragter: [LEGAL_CONFIGURATION_REQUIRED: Benennung DPO falls gesetzlich erforderlich gem. § 38 BDSG]

## 2. Grundsätze der Datenverarbeitung & Datensparsamkeit
Wir verarbeiten personenbezogene Daten streng nach den Grundsätzen von Privacy by Design und Privacy by Default (Art. 25 DSGVO). Wir erheben ausschließlich Daten, die für die Durchführung der Nachbarschafts-Microjobs technisch oder rechtlich erforderlich sind.

## 3. Besondere Schutzmaßnahmen für Minderjährige (Art. 8 DSGVO)
3.1 Die Privatsphäre von Minderjährigen genießt höchsten Schutz. Die genaue Wohnanschrift oder private Telefonnummer minderjähriger Helfer wird niemals öffentlich im Feed angezeigt.  
3.2 Bei Nutzern unter 16 Jahren wird für die Verarbeitung personenbezogener Daten im Rahmen von Diensten der Informationsgesellschaft die Zustimmung der Träger der elterlichen Verantwortung eingeholt (Art. 8 Abs. 1 DSGVO i.V.m. § 16 BDSG).

## 4. Rechtsgrundlagen der Verarbeitung (Art. 6 DSGVO)
- **Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung):** Vermittlung von Aufträgen, Bereitstellung des Nutzerkontos, Chat-Kommunikation, Auszahlung.
- **Art. 6 Abs. 1 lit. c DSGVO (Rechtliche Verpflichtung):** Altersverifikation gem. JArbSchG, steuerliche Aufbewahrungspflichten gem. § 147 AO / § 257 HGB.
- **Art. 6 Abs. 1 lit. a DSGVO (Einwilligung):** Freiwillige Speichertechnologien und Präferenzen gem. § 25 Abs. 1 TDDDG.
- **Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse):** Missbrauchs- und Betrugsprävention, Schutz vor rechtswidrigen Inhalten gem. Art. 16 DSA.

## 5. Rechte der betroffenen Person (Art. 15–21 DSGVO)
Jeder Nutzer hat das Recht auf:
- **Auskunft und Datenübertragbarkeit (Art. 15, 20 DSGVO):** Sie können Ihre kompletten Kontodaten jederzeit als strukturierte JSON-Datei im Profil exportieren.
- **Berichtigung (Art. 16 DSGVO):** Änderung unrichtiger Profildaten direkt in der App.
- **Löschung ("Recht auf Vergessenwerden", Art. 17 DSGVO):** Vollständige Löschung Ihres Kontos. Gesetzliche Aufbewahrungspflichten für steuerlich relevante Zahlungsdaten (§ 147 AO: 10 Jahre) bleiben unberührt (RETENTION_REQUIRED).
- **Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO):** Über den Zustimmungsmanager im Profil jederzeit mit Wirkung für die Zukunft widerrufbar.
    `
  },

  IMPRESSUM: {
    id: 'IMPRESSUM',
    title: 'Impressum / Anbieterkennzeichnung (§ 5 DDG)',
    version: '1.1.0',
    effectiveFrom: '2026-09-22',
    lawyerReviewStatus: 'TEMPLATE_REQUIRING_OPERATOR_DATA',
    summary: 'Gesetzlich vorgeschriebene Anbieterkennzeichnung gemäß Digitale-Dienste-Gesetz (DDG).',
    content: `
# Impressum
Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG):

### Diensteanbieter
**[LEGAL_CONFIGURATION_REQUIRED: QuickJob Plattform Betreibergesellschaft mbH i.G.]**  
Musterstraße 42  
42103 Wuppertal  
Deutschland

### Vertreten durch
Geschäftsführer: **[LEGAL_CONFIGURATION_REQUIRED: Vollständiger Name der Geschäftsführung]**

### Kontakt
Telefon: **[LEGAL_CONFIGURATION_REQUIRED: +49 (0) 202 0000000]**  
E-Mail: compliance@quickjob.local  
Web: https://quickjob.local

### Registereintragung
Eintragung im Handelsregister:  
Registergericht: **[LEGAL_CONFIGURATION_REQUIRED: Amtsgericht Wuppertal]**  
Registernummer: **[LEGAL_CONFIGURATION_REQUIRED: HRB XXXXX]**

### Umsatzsteuer-Identifikationsnummer
Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:  
**[LEGAL_CONFIGURATION_REQUIRED: DE 999 999 999]**

### Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
**[LEGAL_CONFIGURATION_REQUIRED: Name, Anschrift des redaktionell Verantwortlichen]**

### Online-Streitbeilegung (Art. 14 Abs. 1 ODR-VO)
Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr.  
Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
    `
  },

  WIDERRUF: {
    id: 'WIDERRUF',
    title: 'Widerrufsbelehrung für Verbraucher (§§ 312g, 355 BGB)',
    version: '1.0.0',
    effectiveFrom: '2026-09-22',
    lawyerReviewStatus: 'STATUTORY_INSTRUCTION_DRAFT',
    summary: 'Gesetzliche Belehrung über das Widerrufsrecht bei Fernabsatzverträgen über Dienstleistungen.',
    content: `
# Widerrufsbelehrung für Verbraucher
Verbraucher haben bei Abschluss eines Fernabsatzgeschäfts grundsätzlich ein gesetzliches Widerrufsrecht.

### Widerrufsrecht
Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.  
Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.

Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail an widerruf@quickjob.local) über Ihren Entschluss informieren.

### Vorzeitiges Erlöschen des Widerrufsrechts
Das Widerrufsrecht erlischt bei einem Vertrag zur Erbringung von Dienstleistungen vorzeitig, wenn der Unternehmer die Dienstleistung vollständig erbracht hat und mit der Ausführung der Dienstleistung erst begonnen hat, nachdem der Verbraucher dazu seine ausdrückliche Zustimmung gegeben hat und gleichzeitig seine Kenntnis davon bestätigt hat, dass er sein Widerrufsrecht bei vollständiger Vertragserfüllung verliert.
    `
  },

  YOUTH_PROTECTION: {
    id: 'YOUTH_PROTECTION',
    title: 'QuickJob Jugendschutz-Charta (JArbSchG / KindArbSchV)',
    version: '1.0.0',
    effectiveFrom: '2026-09-22',
    lawyerReviewStatus: 'COMPLIANCE_ENFORCED',
    summary: 'Verbindliche Schutzregeln für Kinder und Jugendliche auf der Plattform QuickJob.',
    content: `
# QuickJob Jugendschutz-Charta
Sicherheit, Gesundheit und gesetzlicher Schutz junger Menschen stehen bei QuickJob an oberster Stelle.

### 1. Gesetzliche Altersstufen
- **Unter 13 Jahren:** Vollständiges Verbot jeglicher Erwerbstätigkeit (§ 5 Abs. 1 JArbSchG).
- **13 bis 14 Jahre:** Ausschließlich leichte Hilfstätigkeiten nach KindArbSchV § 2 (Botengänge, leichte Gartenhilfe, Nachhilfe, Tierbetreuung). Maximal 2 Stunden täglich zwischen 08:00 und 18:00 Uhr, zwingend mit Zustimmung der Eltern.
- **15 bis 17 Jahre:** Arbeitszeit maximal 8 Stunden täglich zwischen 06:00 und 20:00 Uhr (§ 14 JArbSchG). Keine gefährlichen Arbeiten (§ 22 JArbSchG).

### 2. Nicht deaktivierbarer Schutzfilter
Für minderjährige Nutzer ist der Jugendschutz-Filter technisch dauerhaft gesperrt und kann weder versehentlich noch absichtlich abgeschaltet werden.

### 3. Notfall- und Meldewege
Bei verdächtigen Aufträgen, Verstößen gegen Arbeitszeitregeln oder unangemessenem Verhalten steht jederzeit der 1-Klick-Meldebutton (🚩 Melden) sowie kostenfreie Notfallnummern bereit:
- **Nummer gegen Kummer für Kinder und Jugendliche:** 116 111 (kostenfrei & anonym)
- **Polizei-Notruf:** 110
    `
  }
};

export class LegalDocumentsManager {
  static getDocument(docType) {
    return LEGAL_DOCUMENTS[docType] || null;
  }

  static getAllDocuments() {
    return Object.values(LEGAL_DOCUMENTS);
  }

  static getDocumentVersion(docType) {
    const doc = LEGAL_DOCUMENTS[docType];
    return doc ? doc.version : null;
  }
}
