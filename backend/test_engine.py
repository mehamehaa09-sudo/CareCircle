"""Run the CareCircle baseline engine demo cases."""

from baseline_engine import check_anomaly, check_trend, save_checkin
from seed_demo_data import USER_ID, seed_demo_data


def main():
    seed_demo_data()

    normal_checkin = {
        "bp_systolic": 135,
        "bp_diastolic": 82,
        "mood": "okay",
        "meds_taken": True,
    }
    anomaly_checkin = {
        "bp_systolic": 145,
        "bp_diastolic": 82,
        "mood": "tired",
        "meds_taken": False,
    }

    print("NORMAL CHECK-IN")
    print(check_anomaly(USER_ID, normal_checkin))
    print("\nANOMALY CHECK-IN")
    print(check_anomaly(USER_ID, anomaly_checkin))

    for systolic in (138, 141, 144):
        save_checkin(USER_ID, systolic, 82, "okay", True)

    print("\nUPWARD TREND")
    print(check_trend(USER_ID))


if __name__ == "__main__":
    main()