"""Evaluate duplicate detection and FDA-evidence prescription interactions."""

from src.prescription_checker import PrescriptionChecker


CASES = [
    (
        "duplicate across prescriptions",
        ["Metformin 500mg"],
        ["Metformin 500mg", "Lisinopril 10mg"],
        True,
        False,
    ),
    (
        "duplicate across prescriptions",
        ["Atorvastatin 20mg", "Amlodipine 5mg"],
        ["Atorvastatin 20mg"],
        True,
        True,
    ),
    (
        "known FDA interaction",
        ["Lisinopril 10mg"],
        ["Spironolactone 25mg"],
        False,
        True,
    ),
    (
        "known FDA interaction",
        ["Amlodipine 5mg"],
        ["Simvastatin 20mg"],
        False,
        True,
    ),
    (
        "known FDA interaction",
        ["Metformin 500mg"],
        ["Propranolol 40mg"],
        False,
        True,
    ),
    (
        "known FDA interaction",
        ["Glimepiride 2mg"],
        ["Propranolol 40mg"],
        False,
        True,
    ),
    (
        "known FDA interaction",
        ["Verapamil 80mg"],
        ["Metoprolol 25mg"],
        False,
        True,
    ),
    (
        "clean",
        ["Metformin 500mg"],
        ["Losartan 50mg"],
        False,
        False,
    ),
    (
        "clean",
        ["Amlodipine 5mg"],
        ["Losartan 50mg"],
        False,
        False,
    ),
    (
        "clean",
        ["Metformin 500mg"],
        ["Amlodipine 5mg"],
        False,
        False,
    ),
    (
        "clean",
        ["Losartan 50mg"],
        ["Atorvastatin 20mg"],
        False,
        False,
    ),
    (
        "clean",
        ["Metformin 500mg"],
        ["Atorvastatin 20mg"],
        False,
        False,
    ),
]


def prescription_text(drugs: list[str]) -> str:
    return "\n".join(drugs)


def main() -> None:
    checker = PrescriptionChecker()
    correct = 0

    print("Prescription checker evaluation")
    print("=" * 100)
    for index, (category, prescription_a, prescription_b, expected_duplicate, expected_interaction) in enumerate(CASES, 1):
        result = checker.check_prescriptions(
            prescription_text(prescription_a),
            prescription_text(prescription_b),
        )
        actual_duplicate = bool(result["duplicates"])
        actual_interaction = bool(result["interactions"])
        matches = actual_duplicate == expected_duplicate and actual_interaction == expected_interaction
        correct += matches
        print(
            f"{index:02d}. category={category}\n"
            f"    A={prescription_a}\n"
            f"    B={prescription_b}\n"
            f"    expected: duplicates={expected_duplicate}, interactions={expected_interaction}\n"
            f"    actual:   duplicates={result['duplicates']}, interactions="
            f"{[item['drug_a'] + ' + ' + item['drug_b'] for item in result['interactions']]}\n"
            f"    {'MATCH' if matches else 'MISMATCH'}"
        )

    print("\nSummary")
    print("=" * 100)
    print(f"Overall accuracy: {correct}/{len(CASES)}")


if __name__ == "__main__":
    main()
