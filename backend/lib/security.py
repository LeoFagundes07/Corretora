"""Auth + session helpers: password hashing, signed cookies (admin session / lead unlock),
rate limiting and small text utilities. Deny-by-default: every /api/admin route depends on
get_current_admin; restricted property fields are only served with a valid lead cookie."""

import os
import re
import time
import unicodedata
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
from fastapi import HTTPException, Request, Response
from passlib.context import CryptContext

from lib.db import db

SESSION_COOKIE = "ac_session"
LEAD_COOKIE = "ac_lead"

pwd_ctx = CryptContext(schemes=["pbkdf2_sha256"], pbkdf2_sha256__rounds=29000)


def app_secret() -> str:
    return os.environ.get("APP_SECRET") or "anne-carvalho-dev-secret"


def hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_ctx.verify(plain, hashed)
    except Exception:
        return False


def _sign(payload: dict[str, Any], days: int) -> str:
    data = {**payload, "exp": datetime.now(timezone.utc) + timedelta(days=days)}
    return jwt.encode(data, app_secret(), algorithm="HS256")


def _verify(token: Optional[str]) -> Optional[dict[str, Any]]:
    if not token:
        return None
    try:
        return jwt.decode(token, app_secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def set_session_cookie(response: Response, user_id: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        _sign({"sub": user_id, "t": "admin"}, 14),
        httponly=True,
        samesite="lax",
        max_age=14 * 86400,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/")


async def get_current_admin(request: Request) -> dict[str, Any]:
    """Server-derived principal from the signed session cookie — never from the body."""
    payload = _verify(request.cookies.get(SESSION_COOKIE))
    if not payload or payload.get("t") != "admin":
        raise HTTPException(status_code=401, detail="Faça login para acessar esta área.")
    user = await db.users.find_one({"id": payload.get("sub")})
    if not user:
        raise HTTPException(status_code=401, detail="Sessão inválida. Faça login novamente.")
    return user


def set_lead_cookie(response: Response, lead_id: str) -> None:
    response.set_cookie(
        LEAD_COOKIE,
        _sign({"lead": lead_id, "t": "lead"}, 90),
        httponly=True,
        samesite="lax",
        max_age=90 * 86400,
        path="/",
    )


def clear_lead_cookie(response: Response) -> None:
    response.delete_cookie(LEAD_COOKIE, path="/")


async def get_lead_id(request: Request) -> Optional[str]:
    payload = _verify(request.cookies.get(LEAD_COOKIE))
    if not payload or payload.get("t") != "lead":
        return None
    lead_id = str(payload.get("lead") or "")
    if lead_id and await db.leads.find_one({"id": lead_id}, {"_id": 1}):
        return lead_id
    return None


# --- rate limiting (in-memory; single-pod deployment) ---

_rate: dict[str, list[float]] = {}


def check_rate(key: str, limit: int, window_s: float) -> None:
    now = time.time()
    hits = [t for t in _rate.get(key, []) if now - t < window_s]
    if len(hits) >= limit:
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde um instante e tente novamente.")
    hits.append(now)
    _rate[key] = hits


# --- text utilities ---

def normalize_whatsapp(raw: str) -> str:
    return re.sub(r"\D", "", raw or "")


def is_valid_whatsapp(digits: str) -> bool:
    return 10 <= len(digits) <= 13


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "imovel"


def clean_meta(meta: dict[str, Any] | None) -> dict[str, str]:
    out: dict[str, str] = {}
    for k, v in (meta or {}).items():
        if len(out) >= 10:
            break
        val = str(v)[:200]
        if val:
            out[str(k)[:40]] = val
    return out
