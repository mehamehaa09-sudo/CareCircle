"""Gather structured context for a flagged CareCircle check-in."""

import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from statistics import mean


CHECKINS_FILE = Path(__file__).with_name("checkins.json")
MEDICATION_CHANGES_FILE = Path(__file__).with_name("med_changes.json")


def _load_json(path):
    if not path.exists():
        return {}

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    text = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text).date()
    except ValueError:
        try:
            return date.fromisoformat(text)
        except ValueError:
            return None


def _stored_flag_matches(checkin, flag_type):
    if checkin.get("flag_type") == flag_type:
        return True
    flags = checkin.get("flags", [])
    if isinstance(flags, str):
        flags = [flags]
    return flag_type in flags


def _is_anomaly(checkins, index):
    if index < 3:
        return False

    current = checkins[index]
    baseline = checkins[:index]
    baseline_systolic = mean(item["bp_systolic"] for item in baseline)
    increase_percent = (
        (current["bp_systolic"] - baseline_systolic) / baseline_systolic * 100
    )
    concerning_mood = current.get("mood") in {"tired", "dizzy"}
    return (
        (increase_percent > 5 and concerning_mood)
        or (current.get("meds_taken") is False and concerning_mood)
        or increase_percent > 15
    )


def _is_trend(checkins, index, window=3):
    if index < window - 1:
        return False

    recent = checkins[index - window + 1 : index + 1]
    first_value = recent[0]["bp_systolic"]
    last_value = recent[-1]["bp_systolic"]
    return (
        last_value > first_value
        and ((last_value - first_value) / first_value * 100) > 3
    )


def _has_repeat_occurrence(checkins, flag_type):
    for index, checkin in enumerate(checkins[:-1]):
        if _stored_flag_matches(checkin, flag_type):
            return True
        if flag_type == "anomaly" and _is_anomaly(checkins, index):
            return True
        if flag_type == "trend" and _is_trend(checkins, index):
            return True
    return False


def _recent_medication_change(changes):
    today = datetime.now(timezone.utc).date()
    recent_changes = []
    for change in changes:
        change_date = _parse_date(change.get("date"))
        if change_date is None:
            continue
        days_ago = (today - change_date).days
        if 0 <= days_ago <= 7:
            recent_changes.append((days_ago, change))

    if not recent_changes:
        return None

    days_ago, change = min(recent_changes, key=lambda item: item[0])
    return {"medication": change.get("medication"), "days_ago": days_ago}


def run_investigation(user_id, flag_type, flag_reason):
    """Return check-in and medication context for a flagged user."""
    checkins = _load_json(CHECKINS_FILE).get(user_id, [])
    latest_checkin = checkins[-1] if checkins else {}
    recent_checkins = checkins[-5:]
    recent_symptoms = [
        {
            key: checkin[key]
            for key in ("timestamp", "mood", "symptom", "symptoms")
            if key in checkin
        }
        for checkin in recent_checkins
    ]

    medication_changes = _load_json(MEDICATION_CHANGES_FILE).get(user_id, [])
    return {
        "current_meds_status": latest_checkin.get("meds_taken"),
        "recent_symptoms": recent_symptoms,
        "repeat_occurrence": _has_repeat_occurrence(checkins, flag_type),
        "recent_med_change": _recent_medication_change(medication_changes),
    }
