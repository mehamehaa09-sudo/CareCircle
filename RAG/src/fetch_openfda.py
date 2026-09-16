"""Collect explicit pairwise interactions from official openFDA labels."""

import requests
import pandas as pd
import time
import os
from itertools import combinations
import re

OUT_PATH = "data/openfda_interactions.csv"
LABEL_FIELDS = ("drug_interactions", "warnings_and_cautions", "contraindications", "boxed_warning", "clinical_pharmacology", "warnings", "precautions")

TARGET_DRUGS = {
    "metformin": ("metformin",), "glimepiride": ("glimepiride",), "glipizide": ("glipizide",),
    "glyburide": ("glyburide", "glibenclamide"), "sitagliptin": ("sitagliptin",),
    "empagliflozin": ("empagliflozin",), "dapagliflozin": ("dapagliflozin",),
    "canagliflozin": ("canagliflozin",), "pioglitazone": ("pioglitazone",),
    "insulin": ("insulin", "insulin lispro", "insulin glargine", "insulin aspart"),
    "lisinopril": ("lisinopril",), "enalapril": ("enalapril",), "ramipril": ("ramipril",),
    "losartan": ("losartan",), "valsartan": ("valsartan",), "irbesartan": ("irbesartan",),
    "amlodipine": ("amlodipine",), "nifedipine": ("nifedipine",), "diltiazem": ("diltiazem",),
    "verapamil": ("verapamil",), "metoprolol": ("metoprolol",), "carvedilol": ("carvedilol",),
    "propranolol": ("propranolol",), "hydrochlorothiazide": ("hydrochlorothiazide", "hctz"),
    "chlorthalidone": ("chlorthalidone",), "furosemide": ("furosemide",),
    "spironolactone": ("spironolactone",), "clonidine": ("clonidine",), "hydralazine": ("hydralazine",),
    "simvastatin": ("simvastatin",), "atorvastatin": ("atorvastatin",), "rosuvastatin": ("rosuvastatin",),
    "pravastatin": ("pravastatin",), "fenofibrate": ("fenofibrate",), "ibuprofen": ("ibuprofen",),
    "naproxen": ("naproxen",), "aspirin": ("aspirin",), "clopidogrel": ("clopidogrel",),
    "warfarin": ("warfarin",), "digoxin": ("digoxin",), "amiodarone": ("amiodarone",),
}

INTERACTION_TERMS = re.compile(r"\b(coadministr|co-admin|concomitant|interaction|interact|combined|increase(?:s|d)?\s+(?:the\s+)?(?:plasma\s+)?concentration|decrease(?:s|d)?\s+(?:the\s+)?(?:plasma\s+)?concentration|monitor|adjust|dose|contraindicated|myopathy|hypoglycemia|hyperkalemia|hypotension|bradycardia|bleeding|qt prolongation)\b", re.I)


def fetch_labels(drug_name, aliases):
    """Fetch multiple official label formulations by generic and brand searches."""
    url = "https://api.fda.gov/drug/label.json"
    labels, seen_ids = [], set()
    searches = [f'openfda.generic_name:"{drug_name}"'] + [f'openfda.brand_name:"{alias}"' for alias in aliases]
    for search in searches:
        try:
            resp = requests.get(url, params={"search": search, "limit": 5}, timeout=30)
            if not resp.ok:
                continue
            for label in resp.json().get("results", []):
                if label.get("id") and label["id"] not in seen_ids:
                    seen_ids.add(label["id"])
                    labels.append(label)
        except requests.RequestException as error:
            print(f"  openFDA request failed for {drug_name}: {error}")
    return labels


def extract_evidence(label, partner_aliases):
    """Return passages naming the partner and containing interaction language."""
    matches = []
    for field in LABEL_FIELDS:
        for block in label.get(field, []):
            for sentence in re.split(r"(?<=[.!?])\s+", str(block)):
                mentions_partner = any(re.search(rf"\b{re.escape(alias)}\b", sentence, re.I) for alias in partner_aliases)
                if mentions_partner and INTERACTION_TERMS.search(sentence):
                    matches.append(f"[{field}] {sentence.strip()}")
    return " ".join(matches[:3]) if matches else None


def collect_openfda_rows():
    label_cache = {}
    successful_labels = 0
    rows = []
    drugs = list(TARGET_DRUGS)

    for drug_name in drugs:
        print(f"Fetching openFDA label for {drug_name} ...")
        label_cache[drug_name] = fetch_labels(drug_name, TARGET_DRUGS[drug_name])
        successful_labels += len(label_cache[drug_name])
        time.sleep(0.15)

    for drug_a, drug_b in combinations(drugs, 2):
        evidence = []
        for primary, partner in ((drug_a, drug_b), (drug_b, drug_a)):
            for label in label_cache[primary]:
                snippet = extract_evidence(label, TARGET_DRUGS[partner])
                if snippet:
                    evidence.append((label, snippet))

        if evidence:
            label, snippet = max(evidence, key=lambda item: len(item[1]))
            rows.append({
                "drug_a": drug_a,
                "drug_b": drug_b,
                "severity": "Not stated in FDA label",
                "mechanism": snippet,
                "recommendation": "Follow the management information in the FDA label and verify with prescribing clinician.",
                "source": f"https://api.fda.gov/drug/label.json?search=id:{label['id']}",
                "evidence_text": snippet,
            })
            print(f"  FOUND: {drug_a} + {drug_b}")

    print(f"FDA labels successfully queried: {successful_labels}")
    print(f"Explicit interaction pairs extracted: {len(rows)}")
    return rows


def main():
    os.makedirs("data", exist_ok=True)
    df = pd.DataFrame(collect_openfda_rows())
    df.to_csv(OUT_PATH, index=False)
    print(f"\nSaved {len(df)} sourced rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
