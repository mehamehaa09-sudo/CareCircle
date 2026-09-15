"""Run hand-crafted scenarios through the complete alert pipeline."""

from baseline_engine import check_anomaly, check_trend, save_checkin
from pipeline import process_checkin_and_alert


ELDER_USER = "elder_lakshmi"
FALSE_ALARM_USER = "eval_false_alarm"
TREND_USER = "eval_trend"


def _flag_type(user_id, checkin):
    anomaly = check_anomaly(user_id, checkin)
    if anomaly.get("anomaly"):
        return "anomaly"

    trend = check_trend(user_id)
    if trend.get("trending"):
        return "trend"

    return "none"


def _run_scenario(number, description, user_id, checkin, expected):
    actual = _flag_type(user_id, checkin)
    report = process_checkin_and_alert(user_id, checkin)
    passed = actual == expected

    print(f"SCENARIO {number}: {description}")
    print(f"Input: {checkin}")
    print(f"Flag: {actual} (expected: {expected})")
    if report is not None:
        print("Final generated report:")
        print(report)
    else:
        print("Final generated report: none")
    print(f"Result: {'PASS' if passed else 'FAIL'}\n")
    return passed


def main():
    scenario_results = []

    scenario_results.append(
        _run_scenario(
            1,
            "Medication-related anomaly",
            ELDER_USER,
            {
                "bp_systolic": 145,
                "bp_diastolic": 82,
                "mood": "tired",
                "meds_taken": False,
            },
            "anomaly",
        )
    )

    scenario_results.append(
        _run_scenario(
            2,
            "Mild elevation with no concerning symptoms",
            FALSE_ALARM_USER,
            {
                "bp_systolic": 140,
                "bp_diastolic": 82,
                "mood": "okay",
                "meds_taken": True,
            },
            "none",
        )
    )

    for systolic in (138, 141, 144):
        save_checkin(TREND_USER, systolic, 82, "okay", True)

    scenario_results.append(
        _run_scenario(
            3,
            "Gradual upward blood-pressure trend",
            TREND_USER,
            {
                "bp_systolic": 144,
                "bp_diastolic": 82,
                "mood": "okay",
                "meds_taken": True,
            },
            "trend",
        )
    )

    correctly_flagged = sum(
        passed and expected != "none"
        for passed, expected in zip(scenario_results, ("anomaly", "none", "trend"))
    )
    correctly_silent = sum(
        passed and expected == "none"
        for passed, expected in zip(scenario_results, ("anomaly", "none", "trend"))
    )
    print(
        f"SUMMARY: {correctly_flagged}/3 correctly flagged, "
        f"{correctly_silent}/3 correctly stayed silent"
    )


if __name__ == "__main__":
    main()
