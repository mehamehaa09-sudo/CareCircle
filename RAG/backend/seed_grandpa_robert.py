"""Seed a normal five-day baseline for the default Grandpa Robert profile."""

import json
from datetime import datetime, timedelta, timezone

from baseline_engine import CHECKINS_FILE, save_checkin


USER_ID = "user-elderly-1"
SEED_RECORDS = (
    (5, 135, 85),
    (4, 136, 86),
    (3, 137, 86),
    (2, 139, 87),
    (1, 140, 88),
)


def _reset_user_history():
    if CHECKINS_FILE.exists():
        with CHECKINS_FILE.open("r", encoding="utf-8") as file:
            checkins = json.load(file)
    else:
        checkins = {}

    checkins.pop(USER_ID, None)
    with CHECKINS_FILE.open("w", encoding="utf-8") as file:
        json.dump(checkins, file, indent=2)


def seed_grandpa_robert():
    _reset_user_history()

    for _, systolic, diastolic in SEED_RECORDS:
        save_checkin(USER_ID, systolic, diastolic, "okay", True)

    with CHECKINS_FILE.open("r", encoding="utf-8") as file:
        checkins = json.load(file)

    seeded_checkins = checkins[USER_ID][-len(SEED_RECORDS):]
    now = datetime.now(timezone.utc)
    for checkin, (days_ago, _, _) in zip(seeded_checkins, SEED_RECORDS):
        timestamp = now - timedelta(days=days_ago)
        checkin["timestamp"] = timestamp.isoformat()

    with CHECKINS_FILE.open("w", encoding="utf-8") as file:
        json.dump(checkins, file, indent=2)

    print(f"Seeded {len(seeded_checkins)} normal check-ins for {USER_ID}:")
    for checkin in seeded_checkins:
        print(
            f"- {checkin['timestamp']}: "
            f"{checkin['bp_systolic']}/{checkin['bp_diastolic']}, "
            f"mood={checkin['mood']}, meds_taken={checkin['meds_taken']}"
        )


if __name__ == "__main__":
    seed_grandpa_robert()