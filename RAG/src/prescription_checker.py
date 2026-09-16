"""Deterministic prescription overlap and FDA-evidence interaction checker."""

import argparse
import re
from collections import Counter
from pathlib import Path

import pandas as pd

try:
    from .rxnorm import RxNormClient, normalize_prescription_drugs
except ImportError:
    from rxnorm import RxNormClient, normalize_prescription_drugs


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV_PATH = ROOT / "data" / "drug_interactions.csv"
DOSAGE_RE = re.compile(
    r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|kg|ml|mL|units?|iu)\b|"
    r"\b\d+(?:\.\d+)?\s*/\s*\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml)\b",
    re.I,
)
FORM_RE = re.compile(r"\b(?:tablet|tablets|tab|tabs|capsule|capsules|cap|caps|pill|pills)\b", re.I)


def normalize_drug_name(name: str) -> str:
    """Normalize case, dosage/form text, whitespace, and punctuation deterministically."""
    normalized = str(name).strip().lower()
    normalized = DOSAGE_RE.sub(" ", normalized)
    normalized = FORM_RE.sub(" ", normalized)
    normalized = re.sub(r"[^a-z0-9_\s-]", " ", normalized)
    normalized = re.sub(r"[-\s]+", " ", normalized).strip()
    return normalized


class PrescriptionChecker:
    """Check two prescription texts against the supplied interaction dataset."""

    def __init__(self, csv_path: str | Path = DEFAULT_CSV_PATH, rxnorm_client: RxNormClient | None = None):
        self.csv_path = Path(csv_path)
        self.rxnorm_client = rxnorm_client or RxNormClient()
        self.interactions = pd.read_csv(self.csv_path).fillna("")
        required_columns = {
            "drug_a", "drug_b", "severity", "mechanism", "recommendation", "source", "evidence_text"
        }
        missing = required_columns - set(self.interactions.columns)
        if missing:
            raise ValueError(f"Interaction CSV is missing columns: {sorted(missing)}")

        self.vocabulary = sorted(
            {
                normalize_drug_name(drug)
                for drug in self.interactions["drug_a"].tolist() + self.interactions["drug_b"].tolist()
                if normalize_drug_name(drug)
            },
            key=lambda drug: (-len(drug), drug),
        )
        self._interaction_lookup = {}
        for _, row in self.interactions.iterrows():
            drug_a = normalize_drug_name(row["drug_a"])
            drug_b = normalize_drug_name(row["drug_b"])
            key = tuple(sorted((drug_a, drug_b)))
            self._interaction_lookup.setdefault(key, self._row_to_dict(row))

    @staticmethod
    def _row_to_dict(row) -> dict:
        return {
            "drug_a": normalize_drug_name(row["drug_a"]),
            "drug_b": normalize_drug_name(row["drug_b"]),
            "severity": str(row["severity"]),
            "mechanism": str(row["mechanism"]),
            "recommendation": str(row["recommendation"]),
            "source": str(row["source"]),
            "evidence_text": str(row["evidence_text"]),
        }

    def _extract_entries(self, text: str) -> tuple[list[str], list[str]]:
        recognized = []
        unrecognized = []
        for line in str(text).splitlines():
            candidate_line = line.strip()
            if not candidate_line:
                continue
            line_known = []
            for drug in self.vocabulary:
                pattern = rf"(?<![a-z0-9]){re.escape(drug)}(?![a-z0-9])"
                if re.search(pattern, candidate_line.lower()):
                    line_known.append(drug)
            if line_known:
                recognized.extend(line_known)
                continue

            candidate = normalize_drug_name(candidate_line)
            candidate = re.split(r"\b(?:take|once|twice|daily|every|morning|evening)\b", candidate, maxsplit=1)[0].strip()
            if candidate and (DOSAGE_RE.search(candidate_line) or re.search(r"\b(?:mg|mcg|ml|tablet|tab|capsule|pill)\b", candidate_line, re.I)):
                unrecognized.append(candidate)
        return recognized, unrecognized

    def extract_drugs(self, text: str) -> list[str]:
        """Extract recognized canonical drugs from prescription text.

        Unknown dosage-bearing lines are retained internally and returned by
        ``check_prescriptions`` under ``unrecognized_drugs``.
        """
        recognized, _ = self._extract_entries(text)
        return list(dict.fromkeys(recognized))

    def check_prescriptions(self, prescription_a: str, prescription_b: str | None = None) -> dict:
        recognized_a, unknown_a = self._extract_entries(prescription_a)
        recognized_b, unknown_b = self._extract_entries(prescription_b or "")
        normalized_records = normalize_prescription_drugs(
            list(dict.fromkeys(recognized_a + recognized_b)), self.rxnorm_client
        )
        rxnorm_names = {
            record["input_name"]: normalize_drug_name(record["normalized_name"] or "")
            for record in normalized_records
            if record["status"] == "normalized"
        }
        recognized_a = [rxnorm_names.get(drug, drug) for drug in recognized_a]
        recognized_b = [rxnorm_names.get(drug, drug) for drug in recognized_b]
        recognized_a = [drug if drug in self.vocabulary else normalize_drug_name(drug) for drug in recognized_a]
        recognized_b = [drug if drug in self.vocabulary else normalize_drug_name(drug) for drug in recognized_b]
        drugs_a = list(dict.fromkeys(recognized_a))
        drugs_b = list(dict.fromkeys(recognized_b))
        all_drugs = recognized_a + recognized_b
        counts = Counter(all_drugs)

        duplicates = []
        for drug, count in counts.items():
            if count > 1:
                locations = []
                if drug in recognized_a and recognized_a.count(drug) > 1:
                    locations.append("prescription_a")
                if drug in recognized_b and recognized_b.count(drug) > 1:
                    locations.append("prescription_b")
                if drug in drugs_a and drug in drugs_b:
                    locations.append("both_prescriptions")
                duplicates.extend({"drug": drug, "location": location} for location in locations)

        unique_drugs = list(dict.fromkeys(all_drugs))
        interactions = []
        for index, drug_a in enumerate(unique_drugs):
            for drug_b in unique_drugs[index + 1:]:
                interaction = self._interaction_lookup.get(tuple(sorted((drug_a, drug_b))))
                if interaction:
                    interactions.append(dict(interaction))

        warnings = [
            "Decision-support only: verify potential overlaps or interactions with a qualified clinician or pharmacist.",
        ]
        if interactions:
            warnings.append("Potential interaction identified. Verify this combination with a qualified clinician or pharmacist.")

        return {
            "prescription_a": drugs_a,
            "prescription_b": drugs_b,
            "normalized_drugs": unique_drugs,
            "duplicates": duplicates,
            "interactions": interactions,
            "unrecognized_drugs": [{"drug": drug} for drug in dict.fromkeys(unknown_a + unknown_b)],
            "warnings": warnings,
        }


def format_safety_report(result: dict) -> str:
    lines = ["PRESCRIPTION SAFETY REPORT", "", "Medications detected:"]
    lines.extend(f"- {drug}" for drug in result["normalized_drugs"]) or lines.append("- None")
    lines.append("\nDuplicate medications:")
    if result["duplicates"]:
        lines.extend(f"- {item['drug']} ({item['location']})" for item in result["duplicates"])
    else:
        lines.append("- None")
    lines.append("\nPotential interactions:")
    if result["interactions"]:
        for interaction in result["interactions"]:
            lines.extend(
                [
                    f"- {interaction['drug_a']} + {interaction['drug_b']}",
                    f"  Severity: {interaction['severity']}",
                    f"  Mechanism: {interaction['mechanism']}",
                    f"  Recommendation: {interaction['recommendation']}",
                    f"  Source: {interaction['source']}",
                    f"  Evidence: {interaction['evidence_text']}",
                ]
            )
    else:
        lines.append("- No matching interaction evidence was found in the available dataset.")
    lines.append("\nUnrecognized medications:")
    lines.extend(f"- {item['drug']}" for item in result["unrecognized_drugs"]) or lines.append("- None")
    lines.extend(["", "Safety note:", "This tool identifies potential medication overlaps/interactions from its available evidence dataset. It does not replace a clinician or pharmacist."])
    return "\n".join(lines)


def _run_demo(checker: PrescriptionChecker) -> None:
    cases = [
        (
            "Case 1",
            "Lisinopril 10 mg\nMetformin 500 mg\nAmlodipine 5 mg",
            "Spironolactone 25 mg\nMetformin 500 mg\nAtorvastatin 20 mg",
        ),
        ("Case 2", "Metformin 500 mg\nMetformin 1000 mg", "Amlodipine 5 mg"),
        ("Case 3", "Aspirin 81 mg\nUnknownDrug 10 mg", "Metformin 500 mg"),
    ]
    for label, prescription_a, prescription_b in cases:
        result = checker.check_prescriptions(prescription_a, prescription_b)
        print(f"{label}: detected={result['normalized_drugs']}")
        print(f"  duplicates={result['duplicates']}")
        print(f"  interactions={[item['drug_a'] + ' + ' + item['drug_b'] for item in result['interactions']]}")
        print(f"  unrecognized={result['unrecognized_drugs']}")

    interaction = checker.check_prescriptions("Lisinopril 10 mg", "Spironolactone 25 mg")["interactions"]
    required = {"severity", "mechanism", "recommendation", "source", "evidence_text"}
    print(f"Known interaction fields present: {required.issubset(interaction[0]) if interaction else False}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run deterministic prescription safety demos.")
    parser.parse_args()
    _run_demo(PrescriptionChecker())


if __name__ == "__main__":
    main()