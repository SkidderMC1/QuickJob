"""
EasyJob Production Server Entry Point
Combines FastAPI REST API for Authentication, Sessions, and Legal Compliance
with high-performance static file serving for the EasyJob PWA frontend.
"""
import os
import logging
import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from datetime import datetime, timezone
import json

from backend.database import init_db, seed_default_legal_documents, get_db_connection
from backend.security import hash_password
from backend.api_auth import router as auth_router, DEV_ENVIRONMENTS

logger = logging.getLogger("quickjob")

app = FastAPI(
    title="EasyJob API & Application Server",
    version="1.1.0",
    docs_url="/api/docs",
    redoc_url=None
)

# Whitelisted CORS origins (strictly forbids wildcard origin reflection with credentials)
ALLOWED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://localhost:3000"
]
# Allow local network devices (LAN RFC1918) on the same Wi-Fi/Ethernet network
ALLOWED_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

BLOCKED_PATH_PREFIXES = (
    "/.git",
    "/data",
    "/backend",
    "/tests",
    "/.gemini",
    "/.agents",
    "/.vscode",
    "/.env",
)

BLOCKED_EXTENSIONS = (
    ".py",
    ".pyc",
    ".db",
    ".sqlite",
    ".sqlite3",
    ".log",
    ".bak",
    ".env",
    ".md",
    ".ini",
    ".toml",
    ".yaml",
    ".yml"
)


@app.middleware("http")
async def security_and_path_filter_middleware(request: Request, call_next):
    raw_path = request.url.path.lower()

    # Block directory traversal attempts
    if ".." in raw_path or "%2e" in raw_path or "\\ " in raw_path or "//" in raw_path:
        return PlainTextResponse("Forbidden: Invalid path traversal attempt.", status_code=status.HTTP_403_FORBIDDEN)

    # Block direct access to internal directories or private files
    if any(raw_path.startswith(prefix) for prefix in BLOCKED_PATH_PREFIXES):
        return PlainTextResponse("Not Found", status_code=status.HTTP_404_NOT_FOUND)

    if any(raw_path.endswith(ext) for ext in BLOCKED_EXTENSIONS):
        return PlainTextResponse("Not Found", status_code=status.HTTP_404_NOT_FOUND)

    response = await call_next(request)

    # Defensive HTTP Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # geolocation must be allowed for same-origin so the map "locate me" works;
    # microphone/camera stay disabled.
    response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data:; "
        "connect-src 'self';"
    )

    if any(raw_path.endswith(ext) for ext in [".js", ".css", ".html", "/"]):
        response.headers["Cache-Control"] = "no-cache, must-revalidate"

    return response


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
        ),
        (
            "user_admin", "admin@quickjob.local", default_pw_hash,
            "Plattform Admin", "@admin", 35, "ADULT", 1, 0, "admin",
            0.0, 0.0, 5.0, 100,
            json.dumps(["Administration", "Moderation", "Compliance"]),
            "Wuppertal-Zentrum",
            "Offizieller EasyJob System-Administrator und Compliance Moderator.",
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

    reports_seed = [
        (
            "rep_101", "user_jasper", "Jasper Klein", "jasper@quickjob.local",
            "user_kevin_b", "Kevin Breuer", "kevin.breuer98@example.de", "employer",
            "JUGENDSCHUTZ_VERSTOSS", "Verstoß gegen Jugendschutz (§ 8 & § 22 JArbSchG)",
            "Unangemessene Forderungen & Überschreitung der gesetzlichen Ruhezeiten",
            "Der Auftraggeber verlangte schweres Heben von 40kg Betonplatten und Arbeitszeiten bis nach 21:00 Uhr. Bei Weigerung wurde mit Zahlungsverweigerung gedroht.",
            "job_01", "Gartenmauer abreißen & schwere Steine schleppen", "PENDING", "HIGH",
            None, None, now, None
        ),
        (
            "rep_102", "user_sophia", "Sophia Weber", "sophia@quickjob.local",
            "user_artur_s", "Artur Schneider", "artur.trade@mail-fake.com", "employer",
            "BETRUGSVERDACHT", "Zahlungsumgehung / Phishing-Verdacht",
            "Aufforderung zur Abwicklung außerhalb von EasyJob Treuhand",
            "Hat wiederholt versucht, die Treuhand-Zahlung zu umgehen und per verdächtiger externer Website zur Eingabe von Bankdaten aufzufordern.",
            "job_03", "Kartonagen sortieren im Lager", "PENDING", "CRITICAL",
            None, None, now, None
        ),
        (
            "rep_103", "user_marcus", "Dr. Marcus Lang", "marcus@quickjob.local",
            "user_tim_v", "Tim Vogt", "tim.vogt@testmail.de", "worker",
            "ZUVERLAESSIGKEIT", "Unentschuldigtes Nichterscheinen (No-Show)",
            "Wiederholtes Nichterscheinen ohne Absage",
            "Helfer hat den fest zugesagten Auftrag zur Gartenpflege zum zweiten Mal kurzfristig unentschuldigt geschwänzt.",
            "job_01", "Gartenpflege & Rasen mähen", "WARNED", "MEDIUM",
            "Offizielle Verwarnung erteilt", "Verwarnung wegen No-Show ausgesprochen", now, now
        )
    ]

    for r in reports_seed:
        cursor.execute("""
        INSERT OR IGNORE INTO reports (
            id, reporter_id, reporter_name, reporter_email,
            reported_user_id, reported_user_name, reported_user_email, reported_user_role,
            category, category_label, reason, details, job_id, job_title,
            status, severity, action_taken, admin_notes, created_at, resolved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, r)

    conn.commit()
    conn.close()


# Initialize database and seed records
init_db()
seed_default_legal_documents()

# Default demo personas all share the well-known password "Password123!", so they
# must never be created in production. Only seed them for local dev/test/demo runs,
# using the same shared environment set as the dev-endpoint guard (api_auth).
QUICKJOB_ENV = os.environ.get("QUICKJOB_ENV", "development").strip().lower()
if "QUICKJOB_ENV" not in os.environ:
    logger.warning(
        "QUICKJOB_ENV is unset; defaulting to 'development'. This is intended for local "
        "dev/test only (dev endpoints and demo seeding stay enabled). "
        "Set QUICKJOB_ENV=production in real deployments."
    )
if QUICKJOB_ENV != "production" and QUICKJOB_ENV in DEV_ENVIRONMENTS:
    seed_default_personas()

# Serve static assets securely from whitelisted subdirectories
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))
CSS_DIR = os.path.join(STATIC_DIR, "css")
JS_DIR = os.path.join(STATIC_DIR, "js")
ICONS_DIR = os.path.join(STATIC_DIR, "icons")

if os.path.exists(CSS_DIR):
    app.mount("/css", StaticFiles(directory=CSS_DIR), name="css")
if os.path.exists(JS_DIR):
    app.mount("/js", StaticFiles(directory=JS_DIR), name="js")
if os.path.exists(ICONS_DIR):
    app.mount("/icons", StaticFiles(directory=ICONS_DIR), name="icons")


@app.get("/", include_in_schema=False)
@app.get("/index.html", include_in_schema=False)
async def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    return FileResponse(index_path, media_type="text/html")


@app.get("/manifest.json", include_in_schema=False)
async def serve_manifest():
    manifest_path = os.path.join(STATIC_DIR, "manifest.json")
    return FileResponse(manifest_path, media_type="application/manifest+json")


@app.get("/sw.js", include_in_schema=False)
async def serve_service_worker():
    sw_path = os.path.join(STATIC_DIR, "sw.js")
    return FileResponse(sw_path, media_type="application/javascript")


if __name__ == "__main__":
    # Bind to all interfaces by default so other devices on the same network can
    # reach the dev server. Set QUICKJOB_HOST=127.0.0.1 to restrict to localhost.
    host = os.environ.get("QUICKJOB_HOST", "0.0.0.0")
    port = int(os.environ.get("QUICKJOB_PORT", "8000"))
    uvicorn.run("server:app", host=host, port=port, log_level="info")
