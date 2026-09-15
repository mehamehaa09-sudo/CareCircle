"""Local Flask API for the CareCircle check-in pipeline."""

import json
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

from baseline_engine import save_checkin
from pipeline import process_checkin_and_alert


app = Flask(__name__)
CORS(app)

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


if __name__ == "__main__":
    app.run(port=5000, debug=True)