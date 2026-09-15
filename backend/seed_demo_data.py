"""Seed five normal check-ins for the CareCircle demo user."""

import json
from datetime import datetime, timedelta, timezone

from baseline_engine import CHECKINS_FILE, save_checkin


USER_ID = "elder_lakshmi"


def seed_demo_data():
    checkins = {}
    if CHECKINS_FILE.exists():
        with CHECKINS_FILE.open("r", encoding="utf-8") as file:
            checkins = json.load(file)
        checkins.pop(USER_ID, None)
        with CHECKINS_FILE.open("w", encoding="utf-8") as file:
            json.dump(checkins, file, indent=2)

    for days_ago, systolic in enumerate((136, 138, 135, 139, 137), start=5):
        save_checkin(USER_ID, systolic, 82, "okay", True)
        with CHECKINS_FILE.open("r", encoding="utf-8") as file:
            checkins = json.load(file)
        checkins[USER_ID][-1]["timestamp"] = (
            datetime.now(timezone.utc) - timedelta(days=days_ago)
        ).isoformat()
        with CHECKINS_FILE.open("w", encoding="utf-8") as file:
            json.dump(checkins, file, indent=2)


if __name__ == "__main__":
    seed_demo_data()
    print(f"Seeded 5 normal check-ins for {USER_ID}.")