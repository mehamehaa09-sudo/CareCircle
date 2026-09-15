"""Run the check-in flag, investigation, and handoff pipeline."""

from baseline_engine import check_anomaly, check_trend
from handoff_report import generate_handoff_report, rewrite_report_naturally
from investigation import run_investigation


def process_checkin_and_alert(user_id, latest_checkin):
    """Return a natural-language report when a check-in raises a flag."""
    anomaly_result = check_anomaly(user_id, latest_checkin)
    trend_result = check_trend(user_id)

    if anomaly_result.get("anomaly"):
        flag_type = "anomaly"
        flag_reason = anomaly_result["reason"]
    elif trend_result.get("trending"):
        flag_type = "trend"
        flag_reason = trend_result["reason"]
    else:
        return None

    investigation_context = run_investigation(
        user_id, flag_type, flag_reason
    )
    investigation_context["current_meds_status"] = latest_checkin.get(
        "meds_taken"
    )
    fixed_report = generate_handoff_report(
        user_id, flag_type, flag_reason, investigation_context
    )
    return rewrite_report_naturally(fixed_report)
