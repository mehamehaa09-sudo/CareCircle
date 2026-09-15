"""Create fixed-format caregiver handoff reports."""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


ALERTS_FILE = Path(__file__).with_name("alerts.json")
GROQ_MODEL = "openai/gpt-oss-120b"


def _load_alerts():
    if not ALERTS_FILE.exists():
        return []

    with ALERTS_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def generate_handoff_report(
    user_id, flag_type, flag_reason, investigation_context
):
    """Generate and persist a fixed-format handoff report."""
    medication_status = investigation_context.get("current_meds_status")
    medication_taken_text = "Yes" if medication_status else "No"
    report_lines = [
        f"🚨 {user_id} — Today's Handoff",
        str(flag_reason),
        f"Medication taken today: {medication_taken_text}",
    ]

    recent_med_change = investigation_context.get("recent_med_change")
    if recent_med_change:
        report_lines.append(
            f"Medication changed {recent_med_change['days_ago']} days ago"
        )

    if investigation_context.get("repeat_occurrence"):
        report_lines.append("Similar issue occurred before")
    else:
        report_lines.append("First time this has been observed")

    report_lines.append("Needs caregiver attention.")
    handoff_report = "\n".join(report_lines)

    alerts = _load_alerts()
    alerts.append(
        {
            "user_id": user_id,
            "flag_type": flag_type,
            "handoff_report": handoff_report,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "resolved": False,
        }
    )
    with ALERTS_FILE.open("w", encoding="utf-8") as file:
        json.dump(alerts, file, indent=2, ensure_ascii=False)

    return handoff_report


def rewrite_report_naturally(fixed_report_text):
    """Rewrite a fixed report while preserving every factual detail."""
    load_dotenv()
    import os

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print(
            "GROQ_API_KEY is not set; using the fixed report.",
            file=sys.stderr,
        )
        return fixed_report_text

    prompt = (
        "Rewrite the following caregiver handoff report in warm, clear, natural "
        "language for a worried family member. Preserve every factual detail "
        "exactly: do not add, remove, or change any numbers, dates, medication "
        "names, statuses, flag reasons, or conclusions. Only rephrase the tone "
        "and flow. Return only the rewritten report.\n\n"
        f"Original report:\n{fixed_report_text}"
    )

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        rewritten_text = response.choices[0].message.content
        return rewritten_text.strip() if rewritten_text else fixed_report_text
    except Exception as error:
        print(
            f"Groq rewrite failed ({type(error).__name__}): {error}; "
            "using the fixed report.",
            file=sys.stderr,
        )
        return fixed_report_text
