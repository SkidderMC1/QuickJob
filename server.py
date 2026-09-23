"""
QuickJob Production Server Entry Point
Combines FastAPI REST API for Authentication, Sessions, and Legal Compliance
with high-performance static file serving for the QuickJob PWA frontend.
"""
import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import json

from backend.database import init_db, seed_default_legal_documents, get_db_connection
from backend.security import hash_password
from backend.api_auth import router as auth_router

app = FastAPI(
    title="QuickJob API & Application Server",
    version="1.1.0",
    docs_url="/api/docs",
    redoc_url=None
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(auth_router)


def seed_default_personas():
    """Seed default personas with secure PBKDF2 hashed passwords if DB is empty."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    default_pw_hash = hash_password("Password123!")

    personas = [
        (
            "user_jasper", "jasper@quickjob.local", default_pw_hash,
            "Jasper Klein", "@jasper_k", 16, "YOUTH_14_17", 1, 1, "worker",
            75.0, 28.0, 4.9, 97,
            json.dumps(["Garden", "Computer & Technology", "Tutoring"]),
            "Wuppertal-Elberfeld",
            "Schüler (16 Jahre) mit Begeisterung für Gartenarbeit und PC-Hilfe.",
            json.dumps({
                "id": "gdr_jasper_01",
                "minorId": "user_jasper",
                "minorName": "Jasper Klein",
                "guardianName": "Sabine Klein",
                "guardianEmail": "sabine.klein@familie-klein.de",
                "relationship": "Mutter",
                "maxWeeklyHours": 10,
                "status": "ACTIVE",
                "authorizedAt": now,
                "signatureVerificationCode": "QJ-GDR-MUM-9482",
                "termsVersion": "1.1.0"
            }),
            now, now
        ),
        (
            "user_sophia", "sophia@quickjob.local", default_pw_hash,
            "Sophia Weber", "@sophia_w", 22, "YOUNG_WORKER_18_25", 1, 0, "worker",
            120.0, 0.0, 5.0, 100,
            json.dumps(["Tutoring", "Shopping & Errands", "Animals"]),
            "Wuppertal-Barmen",
            "Studentin für Nachhilfe und Haustierbetreuung.",
            None, now, now
        ),
        (
            "user_marcus", "marcus@quickjob.local", default_pw_hash,
            "Dr. Marcus Lang", "@dr_lang", 48, "ADULT", 1, 0, "employer",
            50.0, 28.0, 4.9, 100,
            json.dumps(["Employer"]),
            "Wuppertal-Elberfeld (Briller Viertel)",
            "Hauseigentümer auf der Suche nach zuverlässiger Nachbarschaftshilfe.",
            None, now, now
        ),
        (
            "user_lena", "lena@quickjob.local", default_pw_hash,
            "Lena Sommer", "@lena_s14", 14, "CHILD_13_14", 1, 1, "worker",
            35.0, 0.0, 4.9, 98,
            json.dumps(["Tutoring", "Animals"]),
            "Wuppertal-Barmen",
            "14-jährige Schülerin auf der Suche nach leichten Taschengeld-Tätigkeiten (KindArbSchV).",
            json.dumps({
                "id": "gdr_lena_01",
                "minorId": "user_lena",
                "minorName": "Lena Sommer",
                "guardianName": "Michael Sommer",
                "guardianEmail": "m.sommer@sommer-net.de",
                "relationship": "Vater",
                "maxWeeklyHours": 6,
                "status": "ACTIVE",
                "authorizedAt": now,
                "signatureVerificationCode": "QJ-GDR-DAD-4412",
                "termsVersion": "1.1.0"
            }),
            now, now
        ),
        (
            "user_felix", "felix@quickjob.local", default_pw_hash,
            "Felix Weber", "@felix_w12", 12, "CHILD_UNDER_13", 0, 0, "worker",
            0.0, 0.0, 5.0, 100,
            json.dumps(["Gaming"]),
            "Wuppertal-Elberfeld",
            "Schüler (12 Jahre). Beschäftigungsverbot gem. § 5 Abs. 1 JArbSchG.",
            None, now, now
        )
    ]

    for p in personas:
        cursor.execute("""
        INSERT OR IGNORE INTO users (
            id, email, password_hash, name, handle, age, age_category,
            email_verified, has_parent_consent, role, wallet_balance, escrow_balance,
            rating, reliability, skills, location_approx, bio, guardian_consent_json,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, p)

    conn.commit()
    conn.close()


# Initialize database and seed records
init_db()
seed_default_legal_documents()
seed_default_personas()

# Serve static frontend files (must be mounted last to allow API routes precedence)
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")


if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, log_level="info")
