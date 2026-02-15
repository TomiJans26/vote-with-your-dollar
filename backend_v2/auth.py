import re
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash, check_password_hash
import jwt as pyjwt

from database import get_db
from models import User
from schemas import RegisterRequest, LoginRequest, AuthResponse, TokenResponse, UserResponse
from config import settings
from email_utils import generate_verify_code, send_verification_email, VERIFY_CODE_EXPIRY_MINUTES

router = APIRouter(prefix="/api/auth", tags=["auth"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _create_token(user_id: int, expires_delta: timedelta, token_type: str = "access") -> str:
    payload = {
        "sub": str(user_id),
        "type": token_type,
        "exp": datetime.now(timezone.utc) + expires_delta,
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _create_tokens(user_id: int) -> tuple[str, str]:
    access = _create_token(user_id, timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES), "access")
    refresh = _create_token(user_id, timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS), "refresh")
    return access, refresh


def get_current_user(db: Session, token: str) -> User:
    try:
        payload = pyjwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        user_id = int(payload["sub"])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user


def _extract_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing authorization header")
    return authorization[7:]


# Dependency
from fastapi import Header

def auth_required(authorization: str = Header(None), db: Session = Depends(get_db)):
    token = _extract_token(authorization)
    return get_current_user(db, token)


def auth_optional(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        return None
    try:
        token = _extract_token(authorization)
        return get_current_user(db, token)
    except Exception:
        return None


@router.post("/register", status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    errors = []
    email = req.email.strip().lower()
    username = req.username.strip()
    password = req.password

    if not email or not EMAIL_RE.match(email):
        errors.append("Valid email is required")
    if not username or len(username) < 2 or len(username) > 80:
        errors.append("Username must be 2-80 characters")
    if not re.match(r"^[a-zA-Z0-9_.\-]+$", username):
        errors.append("Username can only contain letters, numbers, underscores, dots, and hyphens")
    if len(password) < 8:
        errors.append("Password must be at least 8 characters")
    if errors:
        raise HTTPException(400, {"error": errors[0], "errors": errors})

    if db.query(User).filter_by(email=email).first():
        raise HTTPException(409, "Email already registered")
    if db.query(User).filter_by(username=username).first():
        raise HTTPException(409, "Username already taken")

    code = generate_verify_code()
    user = User(
        email=email,
        username=username,
        password_hash=generate_password_hash(password),
        email_verified=False,
        verify_code=code,
        verify_code_expires=datetime.now(timezone.utc) + timedelta(minutes=VERIFY_CODE_EXPIRY_MINUTES),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    send_verification_email(email, username, code)

    access, refresh = _create_tokens(user.id)
    return {"user": user.to_dict(), "access_token": access, "refresh_token": refresh}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    if not email or not req.password:
        raise HTTPException(400, "Email and password are required")

    user = db.query(User).filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, req.password):
        raise HTTPException(401, "Invalid email or password")

    access, refresh = _create_tokens(user.id)
    return {"user": user.to_dict(), "access_token": access, "refresh_token": refresh}


@router.post("/refresh")
def refresh(authorization: str = Header(None)):
    token = _extract_token(authorization)
    try:
        payload = pyjwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Not a refresh token")
        user_id = int(payload["sub"])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Refresh token expired")
    except Exception:
        raise HTTPException(401, "Invalid refresh token")

    access = _create_token(user_id, timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES), "access")
    return {"access_token": access}


class VerifyRequest(BaseModel):
    code: str


@router.post("/verify-email")
def verify_email(req: VerifyRequest, user: User = Depends(auth_required), db: Session = Depends(get_db)):
    if user.email_verified:
        return {"message": "Email already verified", "user": user.to_dict()}

    if not user.verify_code:
        raise HTTPException(400, "No verification code pending. Request a new one.")

    if user.verify_code_expires and datetime.now(timezone.utc) > user.verify_code_expires.replace(tzinfo=timezone.utc) if user.verify_code_expires.tzinfo is None else user.verify_code_expires:
        raise HTTPException(400, "Verification code expired. Request a new one.")

    if req.code.strip() != user.verify_code:
        raise HTTPException(400, "Invalid verification code")

    user.email_verified = True
    user.verify_code = None
    user.verify_code_expires = None
    db.commit()
    db.refresh(user)
    return {"message": "Email verified!", "user": user.to_dict()}


@router.post("/resend-verification")
def resend_verification(user: User = Depends(auth_required), db: Session = Depends(get_db)):
    if user.email_verified:
        return {"message": "Email already verified"}

    code = generate_verify_code()
    user.verify_code = code
    user.verify_code_expires = datetime.now(timezone.utc) + timedelta(minutes=VERIFY_CODE_EXPIRY_MINUTES)
    db.commit()

    sent = send_verification_email(user.email, user.username, code)
    if not sent:
        raise HTTPException(500, "Failed to send verification email. Please try again.")

    return {"message": "Verification code sent!"}


@router.get("/me")
def me(user: User = Depends(auth_required), db: Session = Depends(get_db)):
    return {"user": user.to_dict()}
