"""
QuickJob Cryptographic Security & Password Management
Implements OWASP & NIST compliant password hashing (PBKDF2-HMAC-SHA256 with 600,000 iterations),
constant-time verification, cryptographic token hashing, and password policy enforcement.
"""
import hashlib
import hmac
import secrets
import re
from datetime import datetime, timezone, timedelta

PBKDF2_ITERATIONS = 600_000
HASH_NAME = 'sha256'
TOKEN_EXPIRATION_HOURS = {
    'EMAIL_VERIFICATION': 24,
    'PASSWORD_RESET': 1,
    'SESSION': 7 * 24  # 7 days
}


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 600,000 iterations and 32-byte random salt."""
    if not password:
        raise ValueError("Password cannot be empty")
    salt = secrets.token_hex(32)
    dk = hashlib.pbkdf2_hmac(
        HASH_NAME,
        password.encode('utf-8'),
        bytes.fromhex(salt),
        PBKDF2_ITERATIONS
    )
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${dk.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify password against stored PBKDF2 hash using constant-time comparison."""
    if not plain_password or not stored_hash:
        return False
    try:
        parts = stored_hash.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected_hash = parts[3]

        computed_dk = hashlib.pbkdf2_hmac(
            HASH_NAME,
            plain_password.encode('utf-8'),
            salt,
            iterations
        )
        return hmac.compare_digest(computed_dk.hex(), expected_hash)
    except Exception:
        return False


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password against security guidelines."""
    if not password or len(password) < 8:
        return False, "Das Passwort muss mindestens 8 Zeichen lang sein."
    if len(password) > 128:
        return False, "Das Passwort darf maximal 128 Zeichen lang sein."
    if not re.search(r'[A-Za-z]', password):
        return False, "Das Passwort muss mindestens einen Buchstaben enthalten."
    if not re.search(r'[\d\W_]', password):
        return False, "Das Passwort muss mindestens eine Ziffer oder ein Sonderzeichen enthalten."
    return True, ""


def validate_email_format(email: str) -> bool:
    """Check basic RFC-compliant email structure."""
    if not email or len(email) > 254:
        return False
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, email.strip()))


def generate_secure_token() -> tuple[str, str]:
    """
    Generate a cryptographically secure token.
    Returns (raw_token, token_hash).
    Only token_hash is stored in the database to prevent token leakage from DB backups.
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_token(raw_token)
    return raw_token, token_hash


def hash_token(raw_token: str) -> str:
    """Compute SHA-256 digest of raw token."""
    return hashlib.sha256(raw_token.strip().encode('utf-8')).hexdigest()


def get_token_expiration(token_type: str) -> str:
    """Return ISO8601 expiration timestamp for token type."""
    hours = TOKEN_EXPIRATION_HOURS.get(token_type, 1)
    exp = datetime.now(timezone.utc) + timedelta(hours=hours)
    return exp.isoformat()


def is_expired(expiration_iso: str) -> bool:
    """Check if ISO8601 timestamp has expired."""
    try:
        exp = datetime.fromisoformat(expiration_iso)
        now = datetime.now(timezone.utc)
        return now > exp
    except Exception:
        return True
