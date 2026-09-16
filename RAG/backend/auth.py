"""Account registration, login, logout, and authenticated profile helpers."""

import os

from flask import session
from werkzeug.security import check_password_hash, generate_password_hash
from sqlalchemy.orm import selectinload

from database import PatientCondition, SessionLocal, User


ALLOWED_ROLES = {"elderly", "caretaker"}
ALLOWED_CONDITIONS = {"diabetes", "hypertension", "none"}


def _conditions(values):
    if not isinstance(values, list) or not values:
        raise ValueError("conditions must be a non-empty list")
    normalized = list(dict.fromkeys(values))
    if any(value not in ALLOWED_CONDITIONS for value in normalized):
        raise ValueError("conditions must contain only diabetes, hypertension, or none")
    if "none" in normalized and len(normalized) > 1:
        raise ValueError("none cannot be combined with another condition")
    return normalized


def _safe_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": user.role,
        "conditions": [condition.condition for condition in user.conditions],
    }


def register_user(username, password, name, role, conditions) -> dict:
    if not isinstance(username, str) or not username.strip():
        raise ValueError("username is required")
    if not isinstance(password, str) or not password:
        raise ValueError("password is required")
    if not isinstance(name, str) or not name.strip():
        raise ValueError("name is required")
    if role not in ALLOWED_ROLES:
        raise ValueError("role must be elderly or caretaker")
    normalized_conditions = _conditions(conditions)

    db = SessionLocal()
    try:
        if db.query(User).filter_by(username=username.strip().lower()).first():
            raise KeyError("username already exists")
        user = User(
            username=username.strip().lower(),
            password_hash=generate_password_hash(password),
            name=name.strip(),
            role=role,
        )
        user.conditions = [PatientCondition(condition=value) for value in normalized_conditions]
        db.add(user)
        db.commit()
        db.refresh(user)
        return _safe_user(user)
    finally:
        db.close()


def login_user(username, password) -> dict | None:
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(username=str(username).strip().lower()).first()
        if not user or not check_password_hash(user.password_hash, password):
            return None
        session["user_id"] = user.id
        return _safe_user(user)
    finally:
        db.close()


def logout_user() -> None:
    session.clear()


def get_current_user() -> User | None:
    user_id = session.get("user_id")
    if user_id is None:
        return None
    db = SessionLocal()
    try:
        user = db.query(User).options(selectinload(User.conditions)).filter_by(id=user_id).first()
        if user is None:
            return None
        db.expunge(user)
        return user
    finally:
        db.close()


def seed_demo_user() -> None:
    password = os.getenv("DEMO_PASSWORD")
    if not password:
        return
    db = SessionLocal()
    try:
        if db.query(User).filter_by(username="grandpa").first():
            return
        user = User(
            username="grandpa",
            password_hash=generate_password_hash(password),
            name="Grandpa Robert",
            role="elderly",
            conditions=[
                PatientCondition(condition="diabetes"),
                PatientCondition(condition="hypertension"),
            ],
        )
        db.add(user)
        db.commit()
    finally:
        db.close()