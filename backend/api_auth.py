"""
EasyJob Authentication, Account Management & Legal Compliance API Router
Provides production-grade REST endpoints with SQLite persistence, PBKDF2 hashing,
secure sessions, single-use tokens, rate limiting, and auditable AGB acceptance.
"""
from fastapi import APIRouter, Request, Response, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
import os
import json
import hmac
import logging
import secrets
import sqlite3
import hashlib
from datetime import datetime, timezone

from .database import get_db_connection
from .security import (
    hash_password,
    verify_password,
    validate_password_strength,
    validate_email_format,
    generate_secure_token,
    hash_token,
    get_token_expiration,
    is_expired
)
from .rate_limiter import rate_limiter
from .email_service import EmailService

router = APIRouter(prefix="/api")
logger = logging.getLogger("quickjob")

COOKIE_NAME = "qj_session"
SESSION_DURATION_SECONDS = 7 * 24 * 3600  # 7 days
DEFAULT_DEV_KEY = "quickjob-dev-test-secret"
# Dev endpoints are only usable in these (non-production) environments.
DEV_ENVIRONMENTS = {"development", "test", "testing", "ci", "local"}


def _get_configured_dev_key() -> Optional[str]:
    """Return the dev key. An explicit QUICKJOB_DEV_KEY always wins; the built-in
    default is only accepted while running in an explicit dev/test environment."""
    key = os.environ.get("QUICKJOB_DEV_KEY")
    if key:
        return key
    env = os.environ.get("QUICKJOB_ENV", "development").strip().lower()
    if env in DEV_ENVIRONMENTS:
        return DEFAULT_DEV_KEY
    return None


def verify_dev_access(request: Request):
    """Fail-closed guard for developer-only endpoints.

    Rules:
    - Only explicit non-production environments (dev/test/ci/local) may use them.
    - The key is read exclusively from the ``X-Dev-Key`` header (no query-param
      channel, which leaks into logs/Referer) and compared in constant time.
    """
    env = os.environ.get("QUICKJOB_ENV", "development").strip().lower()
    configured_key = _get_configured_dev_key()
    if env not in DEV_ENVIRONMENTS or not configured_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Entwickler-Schnittstellen sind in dieser Umgebung deaktiviert."
        )

    # Defense-in-depth: developer endpoints are only reachable from the local
    # host, even if the key were ever exposed or the bind address changed.
    client_host = request.client.host if request.client else ""
    if client_host not in ("127.0.0.1", "::1", "localhost"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Entwickler-Schnittstellen sind nur lokal erreichbar."
        )

    # compare_digest raises TypeError on non-ASCII str, so compare encoded bytes.
    client_key = (request.headers.get("X-Dev-Key") or "").encode("utf-8")
    if not client_key or not hmac.compare_digest(client_key, configured_key.encode("utf-8")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zugriff verweigert: Ungültiger oder fehlender Entwicklerschlüssel (X-Dev-Key)."
        )


def _cookie_is_secure(request: Request) -> bool:
    """Derive the session cookie ``Secure`` flag from the environment/scheme."""
    if os.environ.get("QUICKJOB_ENV", "development").strip().lower() == "production":
        return True
    forwarded = request.headers.get("X-Forwarded-Proto")
    if forwarded:
        return forwarded.split(",")[0].strip().lower() == "https"
    return request.url.scheme == "https"


# --- Pydantic Request Models ---
class RegisterRequest(BaseModel):
    email: str
    password: str
    password_confirmation: str
    name: str
    age: int
    agb_accepted: bool
    agb_version: str = "1.1.0"
    role: Optional[str] = "worker"


class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: Optional[bool] = True


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    new_password_confirmation: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    new_password_confirmation: str


# --- Helper to extract current authenticated user ---
def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get(COOKIE_NAME)
    auth_header = request.headers.get("Authorization")
    if not session_token and auth_header and auth_header.startswith("Bearer "):
        session_token = auth_header[7:].strip()

    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nicht authentifiziert. Keine gültige Sitzung gefunden."
        )

    token_h = hash_token(session_token)
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT s.id as session_id, s.expires_at, u.*
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token_hash = ? AND u.deleted_at IS NULL
        """, (token_h,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sitzung ist ungültig oder abgelaufen."
            )

        session_data = dict(row)
        if is_expired(session_data["expires_at"]):
            cursor.execute("DELETE FROM sessions WHERE id = ?", (session_data["session_id"],))
            conn.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an."
            )
    finally:
        conn.close()

    return session_data


def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    """Authorize an authenticated request as a platform administrator."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zugriff verweigert: Administratorrechte erforderlich."
        )
    return user


def sanitize_user_dict(user_dict: dict) -> dict:
    """Strip sensitive fields before returning to frontend."""
    clean = {k: v for k, v in user_dict.items() if k not in ("password_hash", "token_hash", "session_id")}
    clean["email_verified"] = bool(clean.get("email_verified"))
    clean["skills"] = json.loads(clean.get("skills") or "[]")
    if clean.get("guardian_consent_json"):
        clean["guardian_consent"] = json.loads(clean["guardian_consent_json"])
    else:
        clean["guardian_consent"] = None
    return clean


# --- 1. Registration ---
@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, request: Request, response: Response):
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Rate limiting (atomic check+record closes the check/record race)
    allowed, retry_after = rate_limiter.hit("register", client_ip, ip=client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Zu viele Registrierungsversuche. Bitte warten Sie {retry_after} Sekunden."
        )

    # 1. Validation
    email = req.email.strip().lower()
    if not validate_email_format(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ungültige E-Mail-Adresse.")

    if req.password != req.password_confirmation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Die Passwörter stimmen nicht überein.")

    is_valid_pw, pw_msg = validate_password_strength(req.password)
    if not is_valid_pw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=pw_msg)

    # Name and parameter boundary validation
    clean_name = req.name.strip()
    if not clean_name or len(clean_name) > 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name muss zwischen 1 und 100 Zeichen lang sein.")

    if req.age > 120:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ungültige Altersangabe (maximal 120 Jahre).")

    if req.role and req.role not in ("worker", "employer"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ungültige Rolle. Erlaubt sind: 'worker', 'employer'.")

    # Statutory Age Gate (JArbSchG § 5 Abs. 1)
    if req.age < 13:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registrierung unzulässig: Kinder unter 13 Jahren dürfen nach § 5 Abs. 1 JArbSchG nicht erwerbstätig sein."
        )

    # Mandatory explicit AGB acceptance (§ 305 Abs. 2 BGB)
    if not req.agb_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Die Registrierung erfordert die ausdrückliche Zustimmung zu den Allgemeinen Geschäftsbedingungen (AGB)."
        )

    # Age category mapping
    if req.age <= 14:
        age_cat = "CHILD_13_14"
    elif req.age <= 17:
        age_cat = "YOUTH_14_17"
    elif req.age <= 25:
        age_cat = "YOUNG_WORKER_18_25"
    else:
        age_cat = "ADULT"

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check existing email
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte melden Sie sich an."
            )

        user_id = f"usr_{secrets.token_hex(8)}"
        now = datetime.now(timezone.utc).isoformat()
        pw_hash = hash_password(req.password)
        handle = f"@{req.name.lower().replace(' ', '_')}_{secrets.token_hex(2)}"

        # Create user. SQLite enforces the UNIQUE email constraint during execute(),
        # not only at commit(), so the INSERT and the commit share one IntegrityError
        # guard to return a clean 409 instead of a 500 on a lost registration race.
        try:
            cursor.execute("""
            INSERT INTO users (
                id, email, password_hash, name, handle, age, age_category,
                email_verified, has_parent_consent, role, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
            """, (user_id, email, pw_hash, req.name.strip(), handle, req.age, age_cat, req.role or "worker", now, now))

            # Record auditable AGB acceptance (§ 305 BGB audit trail)
            acceptance_id = f"agb_acc_{secrets.token_hex(8)}"
            user_agent = request.headers.get("User-Agent", "")
            cursor.execute("""
            INSERT INTO legal_acceptances (
                id, user_id, document_id, document_version, accepted_at,
                acceptance_status, ip_address, user_agent
            ) VALUES (?, ?, 'AGB', ?, ?, 'ACCEPTED', ?, ?)
            """, (acceptance_id, user_id, req.agb_version, now, client_ip, user_agent))

            # Generate single-use email verification token
            raw_verif_token, verif_hash = generate_secure_token()
            verif_id = f"tok_{secrets.token_hex(8)}"
            verif_exp = get_token_expiration("EMAIL_VERIFICATION")
            cursor.execute("""
            INSERT INTO verification_tokens (id, user_id, token_hash, token_type, created_at, expires_at)
            VALUES (?, ?, ?, 'EMAIL_VERIFICATION', ?, ?)
            """, (verif_id, user_id, verif_hash, now, verif_exp))

            # Establish initial session
            raw_session_token, session_hash = generate_secure_token()
            session_id = f"sess_{secrets.token_hex(8)}"
            session_exp = get_token_expiration("SESSION")
            cursor.execute("""
            INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, user_agent, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (session_id, user_id, session_hash, now, session_exp, user_agent, client_ip))

            conn.commit()
        except sqlite3.IntegrityError:
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte melden Sie sich an."
            )

        # Send verification email via outbox; a dispatch failure must not turn a
        # successful signup into a 500 (the account is already committed).
        try:
            EmailService.send_verification_email(
                recipient=email,
                name=req.name.strip(),
                raw_token=raw_verif_token
            )
        except Exception as exc:
            logger.warning("Verification email dispatch failed for %s: %s", email, exc)

        # Fetch created user for response
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        created_user = sanitize_user_dict(dict(cursor.fetchone()))
    finally:
        conn.close()

    # Set secure HttpOnly cookie; the raw token never appears in the JSON body.
    response.set_cookie(
        key=COOKIE_NAME,
        value=raw_session_token,
        max_age=SESSION_DURATION_SECONDS,
        httponly=True,
        samesite="lax",
        secure=_cookie_is_secure(request),
        path="/"
    )

    return {
        "success": True,
        "message": "Registrierung erfolgreich. Bitte bestätigen Sie Ihre E-Mail-Adresse.",
        "user": created_user
    }


# --- 2. Login ---
@router.post("/auth/login")
def login(req: LoginRequest, request: Request, response: Response):
    client_ip = request.client.host if request.client else "127.0.0.1"
    email = req.email.strip().lower()

    # Rate limiting (atomic hit records the attempt so concurrent brute-force
    # requests cannot slip past the check; reset on success below)
    login_identifier = f"{client_ip}:{email}"
    allowed, retry_after = rate_limiter.hit("login", login_identifier, ip=client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Zu viele Anmeldeversuche. Bitte warten Sie {retry_after} Sekunden."
        )

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ? AND deleted_at IS NULL", (email,))
        row = cursor.fetchone()

        if not row or not verify_password(req.password, row["password_hash"]):
            # Generic error message to prevent user enumeration
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Ungültige E-Mail-Adresse oder Passwort."
            )

        user = dict(row)

        # Create authenticated session
        now = datetime.now(timezone.utc).isoformat()
        raw_session_token, session_hash = generate_secure_token()
        session_id = f"sess_{secrets.token_hex(8)}"
        session_exp = get_token_expiration("SESSION")
        user_agent = request.headers.get("User-Agent", "")

        cursor.execute("""
        INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, user_agent, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (session_id, user["id"], session_hash, now, session_exp, user_agent, client_ip))

        conn.commit()
    finally:
        conn.close()

    rate_limiter.reset("login", login_identifier, ip=client_ip)

    response.set_cookie(
        key=COOKIE_NAME,
        value=raw_session_token,
        max_age=SESSION_DURATION_SECONDS if req.remember_me else None,
        httponly=True,
        samesite="lax",
        secure=_cookie_is_secure(request),
        path="/"
    )

    return {
        "success": True,
        "message": "Erfolgreich angemeldet.",
        "user": sanitize_user_dict(user)
    }


# --- 3. Logout ---
@router.post("/auth/logout")
def logout(request: Request, response: Response):
    session_token = request.cookies.get(COOKIE_NAME)
    auth_header = request.headers.get("Authorization")
    if not session_token and auth_header and auth_header.startswith("Bearer "):
        session_token = auth_header[7:].strip()

    if session_token:
        token_h = hash_token(session_token)
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM sessions WHERE token_hash = ?", (token_h,))
            conn.commit()
        finally:
            conn.close()

    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"success": True, "message": "Erfolgreich abgemeldet."}


# --- 4. Current User Session (/api/auth/me) ---
@router.get("/auth/me")
@router.get("/auth/session")
def get_session(user: dict = Depends(get_current_user)):
    return {
        "authenticated": True,
        "user": sanitize_user_dict(user)
    }


# --- 5. Verify Email ---
@router.post("/auth/verify-email")
def verify_email(req: VerifyEmailRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"

    raw_token = req.token.strip()
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verifizierungs-Token fehlt.")

    # Rate limit before touching the token store (blunts token-guessing floods).
    token_h = hash_token(raw_token)
    allowed, retry_after = rate_limiter.hit("verify_email", f"{client_ip}:{token_h[:16]}", ip=client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Zu viele Verifizierungsversuche. Bitte warten Sie {retry_after} Sekunden."
        )

    now = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM verification_tokens
        WHERE token_hash = ? AND token_type = 'EMAIL_VERIFICATION'
        """, (token_h,))
        tok = cursor.fetchone()

        if not tok:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ungültiger Verifizierungs-Token.")

        if tok["used_at"] is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dieser Link wurde bereits verwendet.")

        if is_expired(tok["expires_at"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Der Verifizierungs-Link ist abgelaufen. Bitte fordern Sie einen neuen an.")

        # Mark token used & user verified
        cursor.execute("UPDATE verification_tokens SET used_at = ? WHERE id = ?", (now, tok["id"]))
        cursor.execute("UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?", (now, tok["user_id"]))
        cursor.execute("SELECT * FROM users WHERE id = ?", (tok["user_id"],))
        verified_user = sanitize_user_dict(dict(cursor.fetchone()))
        conn.commit()
    finally:
        conn.close()

    return {
        "success": True,
        "message": "E-Mail-Adresse erfolgreich verifiziert! Ihr Konto ist nun vollständig aktiv.",
        "user": verified_user
    }


# --- 6. Resend Verification Email ---
@router.post("/auth/resend-verification")
def resend_verification(req: ResendVerificationRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    email = req.email.strip().lower()

    allowed, retry_after = rate_limiter.hit("resend_verification", f"{client_ip}:{email}", ip=client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Bitte warten Sie {retry_after} Sekunden, bevor Sie einen neuen Link anfordern."
        )

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email_verified FROM users WHERE email = ? AND deleted_at IS NULL", (email,))
        user = cursor.fetchone()

        if user and not user["email_verified"]:
            raw_token, token_h = generate_secure_token()
            now = datetime.now(timezone.utc).isoformat()
            exp = get_token_expiration("EMAIL_VERIFICATION")

            cursor.execute("""
            INSERT INTO verification_tokens (id, user_id, token_hash, token_type, created_at, expires_at)
            VALUES (?, ?, ?, 'EMAIL_VERIFICATION', ?, ?)
            """, (f"tok_{secrets.token_hex(8)}", user["id"], token_h, now, exp))
            conn.commit()

            try:
                EmailService.send_verification_email(
                    recipient=email,
                    name=user["name"],
                    raw_token=raw_token
                )
            except Exception as exc:
                logger.warning("Verification email dispatch failed for %s: %s", email, exc)
    finally:
        conn.close()
    return {"success": True, "message": "Falls Ihr Konto noch nicht verifiziert ist, wurde ein neuer Bestätigungslink versendet."}


# --- 7. Forgot Password ---
@router.post("/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    email = req.email.strip().lower()

    allowed, retry_after = rate_limiter.hit("forgot_password", f"{client_ip}:{email}", ip=client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Bitte warten Sie {retry_after} Sekunden für eine erneute Anfrage."
        )

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM users WHERE email = ? AND deleted_at IS NULL", (email,))
        user = cursor.fetchone()

        if user:
            raw_token, token_h = generate_secure_token()
            now = datetime.now(timezone.utc).isoformat()
            exp = get_token_expiration("PASSWORD_RESET")

            cursor.execute("""
            INSERT INTO verification_tokens (id, user_id, token_hash, token_type, created_at, expires_at)
            VALUES (?, ?, ?, 'PASSWORD_RESET', ?, ?)
            """, (f"tok_{secrets.token_hex(8)}", user["id"], token_h, now, exp))
            conn.commit()

            try:
                EmailService.send_password_reset_email(
                    recipient=email,
                    name=user["name"],
                    raw_token=raw_token
                )
            except Exception as exc:
                logger.warning("Password reset email dispatch failed for %s: %s", email, exc)
    finally:
        conn.close()
    # Generic safe response preventing user enumeration
    return {
        "success": True,
        "message": "Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts versandt."
    }


# --- 8. Reset Password ---
@router.post("/auth/reset-password")
def reset_password(req: ResetPasswordRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"

    raw_token = req.token.strip()
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset-Token fehlt.")

    if req.new_password != req.new_password_confirmation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Die Passwörter stimmen nicht überein.")

    is_valid, msg = validate_password_strength(req.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Rate limit before touching the token store (blunts token-guessing floods).
    token_h = hash_token(raw_token)
    allowed, retry_after = rate_limiter.hit("reset_password", f"{client_ip}:{token_h[:16]}", ip=client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Zu viele Versuche zum Zurücksetzen des Passworts. Bitte warten Sie {retry_after} Sekunden."
        )

    now = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM verification_tokens
        WHERE token_hash = ? AND token_type = 'PASSWORD_RESET'
        """, (token_h,))
        tok = cursor.fetchone()

        if not tok:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ungültiger oder abgelaufener Reset-Link.")

        if tok["used_at"] is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dieser Link wurde bereits verwendet.")

        if is_expired(tok["expires_at"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Der Reset-Link ist abgelaufen. Bitte fordern Sie einen neuen an.")

        # Mark token used
        cursor.execute("UPDATE verification_tokens SET used_at = ? WHERE id = ?", (now, tok["id"]))

        # Update password hash
        new_hash = hash_password(req.new_password)
        cursor.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", (new_hash, now, tok["user_id"]))

        # Invalidate all existing sessions for this user (security requirement!)
        cursor.execute("DELETE FROM sessions WHERE user_id = ?", (tok["user_id"],))

        conn.commit()
    finally:
        conn.close()

    return {"success": True, "message": "Ihr Passwort wurde erfolgreich geändert. Alle bestehenden Sitzungen wurden beendet. Bitte melden Sie sich an."}


# --- 9. Change Password (Authenticated) ---
@router.post("/auth/change-password")
def change_password(req: ChangePasswordRequest, request: Request, user: dict = Depends(get_current_user)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    allowed, retry_after = rate_limiter.hit("change_password", f"{client_ip}:{user['id']}", ip=client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Zu viele Passwortänderungen. Bitte warten Sie {retry_after} Sekunden."
        )

    if not verify_password(req.current_password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Das aktuelle Passwort ist nicht korrekt.")

    if req.new_password != req.new_password_confirmation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Die neuen Passwörter stimmen nicht überein.")

    is_valid, msg = validate_password_strength(req.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    now = datetime.now(timezone.utc).isoformat()
    new_hash = hash_password(req.new_password)

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", (new_hash, now, user["id"]))
        # Invalidate every OTHER session (e.g. stolen tokens); keep the caller signed in.
        cursor.execute("DELETE FROM sessions WHERE user_id = ? AND id != ?", (user["id"], user.get("session_id")))
        conn.commit()
    finally:
        conn.close()

    return {"success": True, "message": "Passwort erfolgreich aktualisiert. Andere Sitzungen wurden abgemeldet."}


# --- 10. Account Deletion (GDPR Art. 17 with § 147 AO Retention Hold) ---
@router.delete("/auth/account")
def delete_account(response: Response, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    now = datetime.now(timezone.utc).isoformat()

    # Create statutory fiscal retention record (§ 147 AO / § 257 HGB: 10-year retention).
    # Feb 29 has no counterpart 10 years later, so clamp the day to avoid ValueError.
    now_dt = datetime.now(timezone.utc)
    try:
        retention_dt = now_dt.replace(year=now_dt.year + 10)
    except ValueError:
        retention_dt = now_dt.replace(year=now_dt.year + 10, day=28)
    retention_exp = retention_dt.isoformat()

    total_balance = float(user.get("wallet_balance", 0.0)) + float(user.get("escrow_balance", 0.0))

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO fiscal_ledger_retention (
            id, user_id, record_type, amount, currency, statutory_basis,
            retained_at, retention_expires_at, audit_payload_json
        ) VALUES (?, ?, ?, ?, 'EUR', '§ 147 Abs. 1 Nr. 4 AO (10 Jahre Aufbewahrung)', ?, ?, ?)
        """, (
            f"fisc_{secrets.token_hex(8)}",
            user_id,
            'WALLET_BALANCE' if total_balance > 0 else 'ACCOUNT_CLOSING_LEDGER',
            total_balance,
            now,
            retention_exp,
            json.dumps({
                "wallet_balance": user.get("wallet_balance", 0.0),
                "escrow_balance": user.get("escrow_balance", 0.0),
                "email_hash": hashlib.sha256(user["email"].encode("utf-8")).hexdigest(),
                "closed_at": now
            })
        ))

        # Anonymize / soft-delete personal records
        cursor.execute("""
        UPDATE users SET
            name = 'Gelöschter Nutzer',
            handle = '@deleted_user',
            email = ?,
            password_hash = 'DELETED',
            bio = '',
            skills = '[]',
            guardian_consent_json = NULL,
            deleted_at = ?
        WHERE id = ?
        """, (f"deleted_{user_id}@quickjob.local", now, user_id))

        # Invalidate all sessions
        cursor.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()

    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {
        "success": True,
        "message": "Ihr Konto wurde gelöscht. Relevante Buchungsbelege werden gem. § 147 AO für 10 Jahre archiviert."
    }


# --- 11. Dev Outbox Inspection Helper (Restricted to Authorized Dev/Test Environments) ---
@router.get("/dev/latest-email", dependencies=[Depends(verify_dev_access)])
def get_latest_email(recipient: Optional[str] = None, template_type: Optional[str] = None):
    email = EmailService.get_latest_email(recipient=recipient, template_type=template_type)
    if not email:
        return {"found": False, "email": None}
    return {"found": True, "email": email}


@router.post("/dev/reset-rate-limits", dependencies=[Depends(verify_dev_access)])
def dev_reset_rate_limits():
    rate_limiter.clear_all()
    return {"success": True, "message": "Rate limits successfully reset."}


# --- 12. Legal Documents & Acceptances ---
@router.get("/legal/documents")
def get_legal_documents():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, type, version, title, content, effective_from FROM legal_documents ORDER BY type")
        docs = [dict(r) for r in cursor.fetchall()]
    finally:
        conn.close()
    return {"documents": docs}


@router.get("/legal/acceptances")
def get_user_acceptances(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, document_id, document_version, accepted_at, acceptance_status
        FROM legal_acceptances
        WHERE user_id = ?
        ORDER BY accepted_at DESC
        """, (user["id"],))
        acceptances = [dict(r) for r in cursor.fetchall()]
    finally:
        conn.close()
    return {"acceptances": acceptances}


# --- 13. Admin & Compliance Moderation Endpoints ---
class AdminActionRequest(BaseModel):
    action: str  # 'WARN' | 'BAN' | 'DISMISS' | 'RESOLVE'
    notes: Optional[str] = None


@router.get("/admin/reports")
def get_admin_reports(admin: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports ORDER BY created_at DESC")
        reports = [dict(r) for r in cursor.fetchall()]
    finally:
        conn.close()
    return {"reports": reports}


@router.post("/admin/reports/{report_id}/action")
def take_report_action(report_id: str, req: AdminActionRequest, admin: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()

        status_map = {
            "WARN": "WARNED",
            "BAN": "BANNED",
            "DISMISS": "DISMISSED",
            "RESOLVE": "RESOLVED"
        }
        new_status = status_map.get(req.action.upper(), "RESOLVED")

        cursor.execute("""
        UPDATE reports 
        SET status = ?, action_taken = ?, admin_notes = ?, resolved_at = ?
        WHERE id = ?
        """, (new_status, f"Aktion: {req.action}", req.notes or "", now, report_id))

        if req.action.upper() == "BAN":
            cursor.execute("SELECT reported_user_id FROM reports WHERE id = ?", (report_id,))
            row = cursor.fetchone()
            if row and row["reported_user_id"]:
                cursor.execute("UPDATE users SET deleted_at = ? WHERE id = ?", (now, row["reported_user_id"]))

        conn.commit()
    finally:
        conn.close()
    return {"success": True, "status": new_status, "report_id": report_id}


@router.get("/admin/stats")
def get_admin_stats(admin: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL")
        total_users = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as pending FROM reports WHERE status = 'PENDING'")
        pending_reports = cursor.fetchone()["pending"]
    finally:
        conn.close()
    return {
        "totalUsers": total_users,
        "pendingReports": pending_reports,
        "activeJobsCount": 48,
        "escrowVolumeEur": 3420.50,
        "kycVerificationRate": 94.2
    }
