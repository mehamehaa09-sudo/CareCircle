"""Local Flask API for the CareCircle check-in pipeline."""

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, session
from flask_cors import CORS

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from baseline_engine import save_checkin
from pipeline import process_checkin_and_alert
from src.generate_rag_answer import generate_answer
from src.prescription_checker import PrescriptionChecker
from auth import (
    ALLOWED_CONDITIONS,
    ALLOWED_ROLES,
    get_current_user,
    login_user,
    logout_user,
    register_user,
    seed_demo_user,
)
from database import (
    Alert,
    CheckIn,
    HealthQuestion,
    Medication,
    MedicationSchedule,
    PrescriptionCheck,
    SessionLocal,
    init_db,
)


app = Flask(__name__)
load_dotenv(Path(__file__).with_name(".env"))
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
if not app.config["SECRET_KEY"]:
    raise RuntimeError("SECRET_KEY must be set in backend/.env")
CORS(app, origins=["http://localhost:3000", "http://localhost:3003", "http://localhost:3004"], supports_credentials=True)
init_db()
seed_demo_user()
prescription_checker = PrescriptionChecker()

ALERTS_FILE = Path(__file__).with_name("alerts.json")
REQUIRED_FIELDS = (
    "user_id",
    "bp_systolic",
    "bp_diastolic",
    "mood",
    "meds_taken",
)


@app.post("/api/checkin")
def create_checkin():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    missing_fields = [field for field in REQUIRED_FIELDS if field not in data]
    if missing_fields:
        return jsonify({"error": "Missing fields: " + ", ".join(missing_fields)}), 400

    user_id = data["user_id"]
    if not isinstance(user_id, str) or not user_id.strip():
        return jsonify({"error": "user_id must be a non-empty string."}), 400

    checkin = {
        "bp_systolic": data["bp_systolic"],
        "bp_diastolic": data["bp_diastolic"],
        "mood": data["mood"],
        "meds_taken": data["meds_taken"],
    }
    save_checkin(user_id, **checkin)
    report = process_checkin_and_alert(user_id, checkin)

    return jsonify({
        "alert_triggered": report is not None,
        "report": report,
    })


@app.get("/api/alerts/<user_id>")
def get_alerts(user_id):
    if not ALERTS_FILE.exists():
        return jsonify([])

    with ALERTS_FILE.open("r", encoding="utf-8") as file:
        alerts = json.load(file)

    user_alerts = [alert for alert in alerts if alert.get("user_id") == user_id]
    user_alerts.sort(key=lambda alert: alert.get("created_at", ""), reverse=True)
    return jsonify(user_alerts)


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400
    try:
        user = register_user(data.get("username"), data.get("password"), data.get("name"), data.get("role"), data.get("conditions"))
        return jsonify({"user": user}), 201
    except KeyError:
        return jsonify({"error": "Username is already registered."}), 409
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("username"), str) or not isinstance(data.get("password"), str):
        return jsonify({"error": "username and password are required."}), 400
    user = login_user(data["username"], data["password"])
    if user is None:
        return jsonify({"error": "Invalid username or password."}), 401
    return jsonify({"user": user})


@app.post("/api/auth/logout")
def logout():
    logout_user()
    return jsonify({"success": True})


@app.get("/api/auth/me")
def current_profile():
    user = get_current_user()
    if user is None:
        return jsonify({"error": "Authentication required."}), 401
    return jsonify({"user": {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "role": user.role,
        "conditions": [condition.condition for condition in user.conditions],
    }})


def require_login():
    if get_current_user() is None:
        return jsonify({"error": "Authentication required."}), 401
    return None


def _current_patient():
    return get_current_user()


def _serialize_medication(medication):
    return {
        "id": medication.id,
        "name": medication.name,
        "dosage": medication.dosage,
        "form": medication.form,
        "instructions": medication.instructions,
        "durationType": medication.duration_type,
        "durationDays": medication.duration_days,
        "startDate": medication.start_date,
        "endDate": medication.end_date,
        "notes": medication.notes,
        "color": medication.color,
        "createdAt": medication.created_at.isoformat() if medication.created_at else None,
        "times": [{"id": item.id, "time": item.time, "label": item.label} for item in medication.schedules],
    }


@app.get("/api/me/medications")
def get_my_medications():
    user = _current_patient()
    if user is None:
        return jsonify({"error": "Authentication required."}), 401
    db = SessionLocal()
    try:
        medications = db.query(Medication).filter_by(patient_id=user.id).order_by(Medication.created_at.desc()).all()
        return jsonify([_serialize_medication(item) for item in medications])
    finally:
        db.close()


@app.post("/api/me/medications")
def create_my_medication():
    user = _current_patient()
    if user is None:
        return jsonify({"error": "Authentication required."}), 401
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("name"), str) or not data["name"].strip():
        return jsonify({"error": "name must be a non-empty string."}), 400
    times = data.get("times", [])
    if not isinstance(times, list):
        return jsonify({"error": "times must be a list."}), 400
    db = SessionLocal()
    try:
        medication = Medication(
            patient_id=user.id,
            name=data["name"].strip(),
            dosage=str(data.get("dosage", "")),
            form=str(data.get("form", "tablet")),
            instructions=str(data.get("instructions", "anytime")),
            duration_type=data.get("durationType"),
            duration_days=data.get("durationDays"),
            start_date=data.get("startDate"),
            end_date=data.get("endDate"),
            notes=data.get("notes"),
            color=data.get("color"),
        )
        medication.schedules = [
            MedicationSchedule(time=str(item["time"]), label=str(item.get("label", "Custom")))
            for item in times if isinstance(item, dict) and item.get("time")
        ]
        db.add(medication)
        db.commit()
        db.refresh(medication)
        return jsonify(_serialize_medication(medication)), 201
    finally:
        db.close()


@app.delete("/api/me/medications/<int:medication_id>")
def delete_my_medication(medication_id):
    user = _current_patient()
    if user is None:
        return jsonify({"error": "Authentication required."}), 401
    db = SessionLocal()
    try:
        medication = db.query(Medication).filter_by(id=medication_id, patient_id=user.id).first()
        if medication is None:
            return jsonify({"error": "Medication not found."}), 404
        db.delete(medication)
        db.commit()
        return jsonify({"success": True})
    finally:
        db.close()


@app.get("/api/me/checkins")
def get_my_checkins():
    user = _current_patient()
    if user is None:
        return jsonify({"error": "Authentication required."}), 401
    db = SessionLocal()
    try:
        items = db.query(CheckIn).filter_by(patient_id=user.id).order_by(CheckIn.timestamp.desc()).all()
        return jsonify([{
            "id": item.id,
            "timestamp": item.timestamp.isoformat(),
            "bp_systolic": item.bp_systolic,
            "bp_diastolic": item.bp_diastolic,
            "mood": item.mood,
            "meds_taken": item.meds_taken,
        } for item in items])
    finally:
        db.close()


@app.post("/api/me/checkins")
def create_my_checkin():
    user = _current_patient()
    if user is None:
        return jsonify({"error": "Authentication required."}), 401
    data = request.get_json(silent=True)
    fields = ("bp_systolic", "bp_diastolic", "mood", "meds_taken")
    if not isinstance(data, dict) or any(field not in data for field in fields):
        return jsonify({"error": "bp_systolic, bp_diastolic, mood, and meds_taken are required."}), 400
    db = SessionLocal()
    try:
        item = CheckIn(patient_id=user.id, **{field: data[field] for field in fields})
        db.add(item)
        db.commit()
        db.refresh(item)
        return jsonify({"id": item.id, "timestamp": item.timestamp.isoformat()}), 201
    finally:
        db.close()


@app.get("/api/me/alerts")
def get_my_alerts():
    user = _current_patient()
    if user is None:
        return jsonify({"error": "Authentication required."}), 401
    db = SessionLocal()
    try:
        items = db.query(Alert).filter_by(patient_id=user.id).order_by(Alert.created_at.desc()).all()
        return jsonify([{
            "id": item.id,
            "flag_type": item.flag_type,
            "handoff_report": item.handoff_report,
            "created_at": item.created_at.isoformat(),
            "resolved": item.resolved,
        } for item in items])
    finally:
        db.close()


@app.get("/api/me/health-questions")
def get_my_health_questions():
    user = _current_patient()
    if user is None:
        return jsonify({"error": "Authentication required."}), 401
    db = SessionLocal()
    try:
        items = db.query(HealthQuestion).filter_by(patient_id=user.id).order_by(HealthQuestion.created_at.desc()).all()
        return jsonify([{
            "id": item.id,
            "question": item.question,
            "condition_used": item.condition_used,
            "answer": item.answer,
            "citations": json.loads(item.citations_json or "[]"),
            "created_at": item.created_at.isoformat(),
        } for item in items])
    finally:
        db.close()


@app.get("/api/me/prescription-checks")
def get_my_prescription_checks():
    user = _current_patient()
    if user is None:
        return jsonify({"error": "Authentication required."}), 401
    db = SessionLocal()
    try:
        items = db.query(PrescriptionCheck).filter_by(patient_id=user.id).order_by(PrescriptionCheck.created_at.desc()).all()
        return jsonify([{
            "id": item.id,
            "prescription_a": item.prescription_a,
            "prescription_b": item.prescription_b,
            "result": json.loads(item.result_json or "{}"),
            "created_at": item.created_at.isoformat(),
        } for item in items])
    finally:
        db.close()


@app.post("/api/health-question")
def answer_health_question():
    auth_error = require_login()
    if auth_error:
        return auth_error
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    question = data.get("question")
    if not isinstance(question, str) or not question.strip():
        return jsonify({"error": "question must be a non-empty string."}), 400

    patient = _current_patient()
    patient_conditions = {item.condition for item in patient.conditions}
    condition = "both" if len(patient_conditions) != 1 else next(iter(patient_conditions))
    if condition not in {"diabetes", "hypertension", "both"}:
        condition = "both"
    normalized_question = question.strip()
    try:
        result = generate_answer(normalized_question, condition=condition)
        db = SessionLocal()
        try:
            db.add(HealthQuestion(
                patient_id=patient.id,
                question=normalized_question,
                condition_used=condition,
                answer=result["answer"],
                citations_json=json.dumps(result.get("citations", [])),
            ))
            db.commit()
        finally:
            db.close()
        return jsonify(result)
    except Exception:
        app.logger.exception("Health question generation failed")
        return jsonify({"error": "Unable to generate a health answer."}), 500


@app.post("/api/prescription-check")
def check_prescription():
    auth_error = require_login()
    if auth_error:
        return auth_error
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    prescription_a = data.get("prescription_a")
    prescription_b = data.get("prescription_b")
    if not isinstance(prescription_a, str) or not prescription_a.strip():
        return jsonify({"error": "prescription_a must be a non-empty string."}), 400
    if prescription_b is not None and not isinstance(prescription_b, str):
        return jsonify({"error": "prescription_b must be a string when provided."}), 400

    try:
        result = prescription_checker.check_prescriptions(
            prescription_a.strip(),
            prescription_b.strip() if prescription_b is not None else None,
        )
        return jsonify(result)
    except Exception:
        app.logger.exception("Prescription check failed")
        return jsonify({"error": "Unable to check the prescriptions."}), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)