"""Demo the structured investigation context."""

from datetime import datetime, timedelta, timezone

from baseline_engine import log_medication_change
from investigation import run_investigation


if __name__ == "__main__":
    change_date = (
        datetime.now(timezone.utc).date() - timedelta(days=3)
    ).isoformat()
    log_medication_change("elder_lakshmi", "sample medication", change_date)

    context = run_investigation(
        "elder_lakshmi",
        "anomaly",
        "sample anomaly flag for investigation",
    )

    print("INVESTIGATION CONTEXT FOR elder_lakshmi")
    for key, value in context.items():
        print(f"{key}: {value}")
