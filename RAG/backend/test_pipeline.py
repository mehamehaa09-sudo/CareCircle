"""Run the complete check-in-to-handoff pipeline demo."""

import json

from handoff_report import ALERTS_FILE
from pipeline import process_checkin_and_alert


if __name__ == "__main__":
    user_id = "elder_lakshmi"
    anomaly_checkin = {
        "bp_systolic": 145,
        "bp_diastolic": 82,
        "mood": "tired",
        "meds_taken": False,
    }

    natural_report = process_checkin_and_alert(user_id, anomaly_checkin)

    with ALERTS_FILE.open("r", encoding="utf-8") as file:
        saved_alert = json.load(file)[-1]

    print("FIXED-TEMPLATE REPORT")
    print(saved_alert["handoff_report"])
    print("\nGROQ-REWRITTEN REPORT")
    print(natural_report)
    print(f"\nSaved to alerts.json: {saved_alert['user_id'] == user_id}")
