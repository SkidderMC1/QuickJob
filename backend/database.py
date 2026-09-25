"""
QuickJob Persistent SQLite Database & Schema Manager
Provides ACID-compliant relational persistence for accounts, sessions,
single-use cryptographic tokens, legal documents, and auditable AGB acceptances.
"""
import os
import sqlite3
import json
from datetime import datetime, timezone

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DB_PATH = os.path.join(DB_DIR, "quickjob.db")
OUTBOX_DIR = os.path.join(DB_DIR, "outbox")

os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(OUTBOX_DIR, exist_ok=True)


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        handle TEXT NOT NULL,
        age INTEGER NOT NULL,
        age_category TEXT NOT NULL,
        email_verified INTEGER NOT NULL DEFAULT 0,
        has_parent_consent INTEGER NOT NULL DEFAULT 0,
        role TEXT NOT NULL DEFAULT 'worker',
        wallet_balance REAL NOT NULL DEFAULT 0.0,
        escrow_balance REAL NOT NULL DEFAULT 0.0,
        rating REAL NOT NULL DEFAULT 5.0,
        reliability INTEGER NOT NULL DEFAULT 100,
        skills TEXT NOT NULL DEFAULT '[]',
        location_approx TEXT NOT NULL DEFAULT 'Wuppertal',
        bio TEXT NOT NULL DEFAULT '',
        guardian_consent_json TEXT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT NULL
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")

    # 2. Sessions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        user_agent TEXT NULL,
        ip_address TEXT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);")

    # 3. Cryptographic Verification & Reset Tokens Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT UNIQUE NOT NULL,
        token_type TEXT NOT NULL, -- 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tokens_hash ON verification_tokens(token_hash);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tokens_user_type ON verification_tokens(user_id, token_type);")

    # 4. Versioned Legal Documents Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS legal_documents (
        id TEXT NOT NULL,
        type TEXT NOT NULL, -- 'AGB' | 'PRIVACY' | 'IMPRESSUM' | 'WIDERRUF' | 'YOUTH_PROTECTION'
        version TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        effective_from TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (id, version)
    );
    """)

    # 5. Auditable Legal Acceptance Records Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS legal_acceptances (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        document_id TEXT NOT NULL,
        document_version TEXT NOT NULL,
        accepted_at TEXT NOT NULL,
        acceptance_status TEXT NOT NULL, -- 'ACCEPTED'
        ip_address TEXT NULL,
        user_agent TEXT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_acceptances_user ON legal_acceptances(user_id);")

    # 6. Emails Outbox & Delivery Log Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        template_type TEXT NOT NULL,
        token TEXT NULL,
        content_preview TEXT NULL,
        created_at TEXT NOT NULL
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);")

    # 7. Fiscal Accounting Ledger for Retention Compliance (§ 147 AO / § 257 HGB)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fiscal_ledger_retention (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        record_type TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        statutory_basis TEXT NOT NULL DEFAULT '§ 147 AO (10 Jahre Aufbewahrung)',
        retained_at TEXT NOT NULL,
        retention_expires_at TEXT NOT NULL,
        audit_payload_json TEXT NOT NULL
    );
    """)

    # 8. Reported Users & Moderation Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL,
        reporter_name TEXT NOT NULL,
        reporter_email TEXT NOT NULL,
        reported_user_id TEXT NOT NULL,
        reported_user_name TEXT NOT NULL,
        reported_user_email TEXT NOT NULL,
        reported_user_role TEXT NOT NULL DEFAULT 'worker',
        category TEXT NOT NULL,
        category_label TEXT NOT NULL,
        reason TEXT NOT NULL,
        details TEXT NOT NULL,
        job_id TEXT NULL,
        job_title TEXT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        severity TEXT NOT NULL DEFAULT 'MEDIUM',
        action_taken TEXT NULL,
        admin_notes TEXT NULL,
        created_at TEXT NOT NULL,
        resolved_at TEXT NULL
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);")

    conn.commit()
    conn.close()


def seed_default_legal_documents():
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    default_docs = [
        (
            'AGB', 'AGB', '1.1.0',
            'Allgemeine Geschäftsbedingungen (AGB)',
            '# Allgemeine Geschäftsbedingungen (AGB)\nVersion 1.1.0\nGeltung für Nachbarschafts-Microjobs gem. §§ 305 ff. BGB.',
            '2026-09-22', now
        ),
        (
            'PRIVACY', 'PRIVACY', '1.1.0',
            'Datenschutzerklärung (DSGVO / BDSG)',
            '# Datenschutzerklärung\nVersion 1.1.0\nInformationen nach Art. 13/14 DSGVO. Datensparsamkeit & Jugendschutz.',
            '2026-09-22', now
        ),
        (
            'IMPRESSUM', 'IMPRESSUM', '1.1.0',
            'Impressum / Anbieterkennzeichnung (§ 5 DDG)',
            '# Impressum\nAngaben nach § 5 DDG.\n[LEGAL_CONFIGURATION_REQUIRED: Plattformbetreiber]',
            '2026-09-22', now
        )
    ]

    for doc in default_docs:
        cursor.execute("""
        INSERT OR IGNORE INTO legal_documents (id, type, version, title, content, effective_from, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, doc)

    conn.commit()
    conn.close()
