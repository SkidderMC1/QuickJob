"""
QuickJob Email Dispatch & Outbox Infrastructure
Sends transactional emails (Email Verification, Password Reset, Security Notices).
In development and test environments, logs outbox records to SQLite and disk,
allowing automated verification without external SMTP dependencies.
"""
import os
import json
from datetime import datetime, timezone
from .database import get_db_connection, OUTBOX_DIR


class EmailService:
    @staticmethod
    def send_verification_email(recipient: str, name: str, raw_token: str, base_url: str = "http://127.0.0.1:8000"):
        verification_link = f"{base_url}/?verify_token={raw_token}"
        subject = "Bitte bestätige deine E-Mail-Adresse für QuickJob"
        content = f"""Hallo {name},

vielen Dank für deine Registrierung bei QuickJob!
Um dein Konto zu aktivieren und Nachbarschafts-Microjobs ausführen oder inserieren zu können, bestätige bitte deine E-Mail-Adresse:

{verification_link}

Dieser Link ist 24 Stunden lang gültig und kann nur einmal verwendet werden.

Falls du dich nicht bei QuickJob registriert hast, kannst du diese Nachricht ignorieren.

Dein QuickJob Team
"""
        return EmailService._record_email(
            recipient=recipient,
            subject=subject,
            template_type="EMAIL_VERIFICATION",
            token=raw_token,
            content=content
        )

    @staticmethod
    def send_password_reset_email(recipient: str, name: str, raw_token: str, base_url: str = "http://127.0.0.1:8000"):
        reset_link = f"{base_url}/?reset_token={raw_token}"
        subject = "Passwort zurücksetzen für dein QuickJob-Konto"
        content = f"""Hallo {name},

wir haben eine Anfrage zum Zurücksetzen deines Passworts für QuickJob erhalten.
Über folgenden Link kannst du ein neues, sicheres Passwort festlegen:

{reset_link}

Dieser Link ist 1 Stunde lang gültig.

Falls du diese Anfrage nicht gestellt hast, wurde dein Passwort nicht geändert. Du kannst diese E-Mail ignorieren.

Dein QuickJob Team
"""
        return EmailService._record_email(
            recipient=recipient,
            subject=subject,
            template_type="PASSWORD_RESET",
            token=raw_token,
            content=content
        )

    @staticmethod
    def _record_email(recipient: str, subject: str, template_type: str, token: str, content: str):
        now = datetime.now(timezone.utc).isoformat()
        log_id = f"eml_{int(datetime.now().timestamp()*1000)}"

        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO email_logs (id, recipient, subject, template_type, token, content_preview, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (log_id, recipient, subject, template_type, token, content[:400], now))
        conn.commit()
        conn.close()

        # Save to outbox file for dev inspection
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{log_id}.txt"
        filepath = os.path.join(OUTBOX_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"To: {recipient}\nSubject: {subject}\nDate: {now}\nToken: {token}\n\n{content}")

        return {
            "id": log_id,
            "recipient": recipient,
            "subject": subject,
            "token": token,
            "sent_at": now
        }

    @staticmethod
    def get_latest_email(recipient: str = None, template_type: str = None):
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "SELECT * FROM email_logs WHERE 1=1"
        params = []
        if recipient:
            query += " AND recipient = ?"
            params.append(recipient.strip().lower())
        if template_type:
            query += " AND UPPER(template_type) = ?"
            params.append(template_type.strip().upper())
        query += " ORDER BY created_at DESC LIMIT 1"

        cursor.execute(query, params)
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None
