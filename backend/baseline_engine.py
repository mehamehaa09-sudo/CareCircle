"""Local JSON-backed baseline and anomaly engine for CareCircle."""

import json
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean


CHECKINS_FILE = Path(__file__).with_name("checkins.json")


def _load_checkins():
    if not CHECKINS_FILE.exists():
        return {}

    with CHECKINS_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def _write_checkins(checkins):
    with CHECKINS_FILE.open("w", encoding="utf-8") as file:
        json.dump(checkins, file, indent=2)


def save_checkin(user_id, bp_systolic, bp_diastolic, mood, meds_taken):
    """Append a check-in for a user and persist it to the local JSON file."""
    checkins = _load_checkins()
    checkins.setdefault(user_id, []).append(
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "bp_systolic": bp_systolic,
            "bp_diastolic": bp_diastolic,
            "mood": mood,
            "meds_taken": meds_taken,
        }
    )
    _write_checkins(checkins)


def get_baseline(user_id):
    """Return the average of all stored check-ins except the latest one."""
    checkins = _load_checkins().get(user_id, [])
    past_checkins = checkins[:-1]

    if len(past_checkins) < 3:
        return None

    return {
        "bp_systolic": mean(checkin["bp_systolic"] for checkin in past_checkins),
        "bp_diastolic": mean(checkin["bp_diastolic"] for checkin in past_checkins),
    }


def check_anomaly(user_id, latest_checkin):
    """Compare a latest check-in with the user's stored personal baseline."""
    baseline = get_baseline(user_id)
    if baseline is None:
        return {
            "anomaly": False,
            "reason": "Not enough history to establish a personal baseline.",
        }

    systolic = latest_checkin["bp_systolic"]
    baseline_systolic = baseline["bp_systolic"]
    increase_percent = ((systolic - baseline_systolic) / baseline_systolic) * 100
    concerning_mood = latest_checkin.get("mood") in {"tired", "dizzy"}
    reasons = []

    if increase_percent > 5 and concerning_mood:
        reasons.append(
            f"systolic {systolic} is {increase_percent:.1f}% above baseline "
            f"{baseline_systolic:.1f} and mood is {latest_checkin['mood']}"
        )

    if latest_checkin.get("meds_taken") is False and concerning_mood:
        reasons.append(
            f"medication was not taken and mood is {latest_checkin['mood']}"
        )

    if increase_percent > 15:
        reasons.append(
            f"systolic {systolic} is {increase_percent:.1f}% above baseline "
            f"{baseline_systolic:.1f}"
        )

    if reasons:
        return {"anomaly": True, "reason": "; ".join(reasons)}

    return {
        "anomaly": False,
        "reason": (
            f"No anomaly: systolic {systolic} vs baseline "
            f"{baseline_systolic:.1f}; mood and medication rules were not triggered."
        ),
    }


def check_trend(user_id, window=3):
    """Check whether recent systolic blood pressure has a significant upward trend."""
    checkins = _load_checkins().get(user_id, [])
    if len(checkins) < window:
        return {"trending": False, "reason": "not enough history yet"}

    recent_checkins = checkins[-window:]
    systolic_values = [checkin["bp_systolic"] for checkin in recent_checkins]
    first_value = systolic_values[0]
    last_value = systolic_values[-1]
    total_increase_percent = ((last_value - first_value) / first_value) * 100
    slope = (last_value - first_value) / (window - 1)

    if slope > 0 and total_increase_percent > 3:
        return {
            "trending": True,
            "reason": (
                f"BP has risen from {first_value} to {last_value} over "
                f"the last {window} check-ins ({total_increase_percent:.1f}% increase)."
            ),
        }

    return {"trending": False, "reason": "no significant trend"}


def log_medication_change(user_id, medication_name, change_date=None):
    """Append a medication change to the local medication-change history."""
    medication_changes_file = Path(__file__).with_name("med_changes.json")
    if medication_changes_file.exists():
        with medication_changes_file.open("r", encoding="utf-8") as file:
            medication_changes = json.load(file)
    else:
        medication_changes = {}

    medication_changes.setdefault(user_id, []).append(
        {
            "medication": medication_name,
            "date": change_date or datetime.now(timezone.utc).date().isoformat(),
        }
    )

    with medication_changes_file.open("w", encoding="utf-8") as file:
        json.dump(medication_changes, file, indent=2)