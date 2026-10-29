from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from datetime import datetime, timezone

from lib.db import db
from lib.security import (
    check_rate,
    clear_session_cookie,
    get_current_admin,
    hash_password,
    set_session_cookie,
    verify_password,
)
from models.auth import AuthStatus, AuthUser, LoginRequest, SetupRequest

router = APIRouter()


@router.get("/auth/status", response_model=AuthStatus)
async def auth_status() -> AuthStatus:
    """Tells the login screen whether the administrator account still needs to be created."""
    count = await db.users.count_documents({})
    return AuthStatus(needs_setup=count == 0)


@router.post("/auth/setup", response_model=AuthUser, status_code=201)
async def auth_setup(body: SetupRequest, response: Response) -> AuthUser:
    """First run only — creates the single administrator (the realtor). Refuses afterwards."""
    if await db.users.count_documents({}) > 0:
        raise HTTPException(status_code=409, detail="O acesso administrativo já foi criado. Faça login.")
    user = {
        "id": str(uuid4()),
        "name": body.name.strip(),
        "email": body.email.lower(),
        "password_hash": hash_password(body.password),
        "role": "admin",
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(user)
    set_session_cookie(response, user["id"])
    return AuthUser(id=user["id"], name=user["name"], email=user["email"])


@router.post("/auth/login", response_model=AuthUser)
async def auth_login(body: LoginRequest, request: Request, response: Response) -> AuthUser:
    ip = request.client.host if request.client else "anon"
    check_rate(f"login:{ip}", 15, 300)
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    set_session_cookie(response, user["id"])
    return AuthUser(id=user["id"], name=user["name"], email=user["email"])


@router.post("/auth/logout", status_code=204)
async def auth_logout(response: Response) -> None:
    clear_session_cookie(response)


@router.get("/auth/me", response_model=AuthUser)
async def auth_me(user: dict = Depends(get_current_admin)) -> AuthUser:
    return AuthUser(id=user["id"], name=user["name"], email=user["email"])


@router.patch("/auth/me", response_model=AuthUser)
async def auth_update_me(body: dict, user: dict = Depends(get_current_admin)) -> AuthUser:
    """Allows the realtor to change her own name/password (email kept as login key)."""
    name = str(body.get("name") or user["name"]).strip()
    if len(name) < 2:
        raise HTTPException(status_code=422, detail="Informe seu nome.")
    set_doc: dict = {"name": name}
    new_password = str(body.get("password") or "")
    if new_password:
        if len(new_password) < 8:
            raise HTTPException(status_code=422, detail="A nova senha deve ter ao menos 8 caracteres.")
        set_doc["password_hash"] = hash_password(new_password)
    await db.users.update_one({"id": user["id"]}, {"$set": set_doc})
    return AuthUser(id=user["id"], name=name, email=user["email"])
