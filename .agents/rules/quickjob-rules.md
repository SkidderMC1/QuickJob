# QuickJob — Projekt-Regeln & Sicherheitsleitplanken

Diese Regeln sind für alle Code-Änderungen in QuickJob bindend und dürfen nicht umgangen werden.

## 1. Zwingende Authentifizierung (Mandatory Auth Gate)
- Die App darf unter keinen Umständen unauthentifiziert genutzt werden.
- **Initialer Zustand:** Bei nicht vorhandener oder abgelaufener Session startet die App ausnahmslos auf dem Login-Bildschirm (`currentScreen: 'auth'`, `authViewMode: 'login'`).
- **Routenschutz:** Jeder Navigationsversuch ohne Authentifizierung wird durch `store.setScreen` auf den Login-Screen umgeleitet.
- **Navigationsleiste:** Die untere Navigationsleiste (`renderBottomNav`) ist für unauthentifizierte Nutzer vollständig ausgeblendet.
- **Abmelde-Verhalten:** Bei einem Klick auf „Abmelden“ oder Kontolöschung wird der Nutzer sofort wieder auf den Login-Bildschirm geleitet.

## 2. Gesetzlicher Jugendarbeitsschutz (JArbSchG, KindArbSchV, BGB)
- **Kinder unter 13 Jahren:** Beschäftigungsverbot gem. § 5 Abs. 1 JArbSchG. Dürfen keine Jobs annehmen oder inserieren.
- **Kinder 13–14 Jahre:** Maximal 2 Stunden täglich, nur leichte Arbeiten gem. KindArbSchV § 2, zwingende Elterneinwilligung (§ 113 BGB).
- **Jugendliche 15–17 Jahre:** Schutz vor gefährlichen Arbeiten gem. § 22 JArbSchG (z. B. Sperrmüll, schweres Heben, Gefahrenstoffe sind gesperrt).
- **Permanenter Filter:** Für Minderjährige ist der Jugendschutzfilter im Feed dauerhaft gesperrt und kann nicht deaktiviert werden.

## 3. Ausweis-Verifikation & Rollen (KYC)
- **Arbeitnehmer / Helfer (Worker):** Ausweis-Verifikation ist verpflichtend (Mandatory KYC). Vor Annahme bezahlter Aufträge muss der Ausweis verifiziert sein.
- **Arbeitgeber (Employer):** Ausweis-Verifikation ist optional (keine Pflicht).
- **Onboarding & Registrierung:** Bei der Registrierung gibt es eine Option zum Ausweis-Upload mit dem expliziten Hinweis: *„Du kannst deinen Ausweis auch jederzeit später in den Einstellungen hochladen.“*
- **Verifikations-Badge:** Verifizierte Profile erhalten ein sichtbares Häkchen / Badge (`✓ Ausweis verifiziert`).

## 4. Datenschutz & Standortfreigabe (DSGVO Art. 25 & TDDDG § 25)
- **Standort-Erlaubnis:** Bevor die Umkreiskarte oder die GPS-Position des Nutzers verwendet wird, muss der Nutzer explizit um Erlaubnis gefragt werden.
- **Adressverschleierung:** Exakte Hausnummern und Adressen werden im öffentlichen Feed niemals angezeigt (nur Stadtteil / Umkreis). Die vollständige Adresse wird erst nach verbindlicher Beauftragung des Helfers freigeschaltet.

## 5. UI-Invarianten & Styling
- **Kein „Switch Job“-Button:** Weder im Header noch im Profil darf ein Modus-Umschaltbutton („Switch Job / Mode Switch“) vorhanden sein.
- **Abmelde-Button (`#btn-profile-logout`):** Muss vollflächig rot gefüllt sein (`background: #dc2626; color: #ffffff`), prominent vergrößert (`padding >= 0.9rem`, `font-size >= 1rem`, `font-weight: 800`) und vollflächig sichtbar sein.
- **Dark Mode:** Vollständige Unterstützung für Hell-/Dunkel-Modus über CSS-Variablen.

## 6. Vorher-/Nachher-Bildnachweis & KI-Verifikation (Proof of Work)
- **Workflow:** Helfer können vor Beginn ein „Vorher“-Bild und nach Abschluss ein „Nachher“-Bild im Chat oder Detail-Dialog hochladen.
- **Multimodal AI-Verifikation:**
  - Der Nachweis wird über ein Vision-Modell (z. B. Gemini Vision) analysiert, das Vorher- und Nachher-Bild semantisch mit der Aufgabenbeschreibung abgleicht.
  - Das Modell liefert ein strukturiertes Ergebnis (`verified: boolean`, `confidence: number`, `summary: string`).
  - **Treuhand-Sicherheit:** Die KI-Prüfung dient als automatisierter Nachweis und Vorprüfung; die finale Auszahlung aus dem Treuhandkonto (Escrow) erfolgt durch Bestätigung des Auftraggebers oder automatisch nach Ablauf der 24h-Prüffrist.

## 7. Eltern-Dashboard, Eltern-Link & Eltern-Code (Parental Supervision)
- **Eltern-Link:** Muss in den Profil-Einstellungen (`profileScreen`) prominent sichtbar und mit einem Klick kopierbar sein.
- **6-stelliger Eltern-Code (PIN):**
  - **Standardzustand:** Ist standardmäßig *deaktiviert* (`isCodeProtected: false`).
  - **Optionale Aktivierung:** Kann in den Einstellungen jederzeit vom Jugendlichen oder den Eltern aktiviert und geändert werden.
  - **Zugriffsschutz:** Wenn der Code aktiviert ist, MUSS beim Aufrufen des Eltern-Links bzw. Dashboards zwingend die PIN-Abfrage erscheinen und das Dashboard gesperrt bleiben, bis der korrekte Code eingegeben wurde.
- **Inhalte des Eltern-Dashboards:**
  - Gesetzliche Arbeitszeitüberwachung (Einhaltung der max. 2 Stunden täglich gem. § 2 KindArbSchV / JArbSchG).
  - Übersicht über Verdienste, aktive und abgeschlossene Jobs.
  - Schnellzugriff auf Notfallkontakte und Arbeitgeber-Informationen.

## 8. Live Check-In & Notfall-System (Safety First)
- **Live Check-In im Chat:**
  - Sobald ein Job aktiv ist, stehen im Chat die Status-Buttons bereit:
    - `📍 Ich bin da` (setzt `checkInStatus: 'ARRIVED'`).
    - `✅ Job beendet` (setzt `checkInStatus: 'COMPLETED'` und leitet den Abschluss-Flow ein).
- **1-Tap Notfall-Button (SOS):**
  - Während aktiver Jobs muss ein auffälliger, roter Notfall-Button (`🚨 SOS Notfall`) permanent erreichbar sein.
  - Ein Klick öffnet unverzüglich das Notfall-Sheet mit Direktwahltasten für:
    - **110** (Polizei)
    - **112** (Rettungsdienst / Feuerwehr)
    - **Eltern-Notruf** (hinterlegte Telefonnummer)
    - **Live-Standort teilen** (Übermittlung der aktuellen Koordinaten).

## 9. Rechtssicheres Quittungswesen & Trinkgeld (§ 368 BGB / § 147 AO)
- **Quittungspflicht:** Für jeden beendeten Job muss eine offizielle, rechtssichere Quittung gem. § 368 BGB abrufbar und druckbar sein (mit Arbeitgeber, Helfer, Betrag, Datum, Leistungsbeschreibung und Steuerhinweis für Taschengeldarbeiten).
- **Trinkgeld (Tip):**
  - Im Bewertungs- und Abschluss-Dialog kann ein Trinkgeld ausgewählt werden (`0 €`, `+2 €`, `+5 €`, `+10 €`).
  - Trinkgelder fließen zu 100 % direkt an den Helfer.

## 10. Profil-Badges & Gamification
- **Ausweis-Badge:** Nach erfolgreicher Ausweis-Prüfung erhält das Profil ein festes, verifiziertes Häkchen (`✓ Ausweis verifiziert`).
- **Tätigkeits-Badges:** Helfer schalten durch erledigte Jobs Badges frei (z. B. *Tierfreund*, *Garten-Profi*, *Einkaufs-Held*, *Blitzschnell*, *5-Sterne-Liebling*).

