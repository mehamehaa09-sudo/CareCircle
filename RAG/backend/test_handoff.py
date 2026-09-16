"""Run the investigation scenario and create a caregiver handoff report."""

import json
from datetime import datetime, timedelta, timezone

from baseline_engine import log_medication_change
from handoff_report import ALERTS_FILE, generate_handoff_report
from investigation import run_investigation


if __name__ == "__main__":
    user_id = "elder_lakshmi"
    flag_type = "anomaly"
    flag_reason = "Sample anomaly flag for handoff"
    change_date = (
        datetime.now(timezone.utc).date() - timedelta(days=3)
    ).isoformat()

    log_medication_change(user_id, "sample medication", change_date)
    investigation_context = run_investigation(user_id, flag_type, flag_reason)
    handoff_report = generate_handoff_report(
        user_id, flag_type, flag_reason, investigation_context
    )

    print("FINAL HANDOFF REPORT")
    print(handoff_report)

    with ALERTS_FILE.open("r", encoding="utf-8") as file:
        alerts = json.load(file)
    saved = alerts[-1]
    print(f"\nSaved to alerts.json: {saved['handoff_report'] == handoff_report}")
