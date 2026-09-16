"""Build the validated prescription-interaction dataset from sourced files."""

import pandas as pd
import os
import re
import sys

from fetch_openfda import collect_openfda_rows

DDINTER_PATH = "data/ddinter_diabetes_filtered.csv"
OPENFDA_PATH = "data/openfda_interactions.csv"
FINAL_PATH = "data/drug_interactions.csv"
TEMP_PATH = FINAL_PATH + ".tmp"

FINAL_COLUMNS = ["drug_a", "drug_b", "severity", "mechanism", "recommendation", "source", "evidence_text"]

HYPERTENSION_DRUGS = {
    "lisinopril", "enalapril", "ramipril", "losartan", "valsartan", "irbesartan", "amlodipine",
    "nifedipine", "diltiazem", "verapamil", "metoprolol", "carvedilol", "propranolol",
    "hydrochlorothiazide", "chlorthalidone", "furosemide", "spironolactone", "clonidine", "hydralazine",
}
DIABETES_DRUGS = {
    "metformin", "glimepiride", "glipizide", "glyburide", "sitagliptin", "empagliflozin",
    "dapagliflozin", "canagliflozin", "pioglitazone", "insulin",
}


def load_if_exists(path):
    if os.path.exists(path):
        frame = pd.read_csv(path)
        if "evidence_text" not in frame.columns:
            frame["evidence_text"] = frame["mechanism"]
        else:
            frame["evidence_text"] = frame["evidence_text"].fillna(frame["mechanism"])
        return frame
    print(f"WARNING: {path} not found -- skipping. Run its fetch script first.")
    return pd.DataFrame(columns=FINAL_COLUMNS)


def main():
    original_df = load_if_exists(FINAL_PATH)
    openfda_df = pd.DataFrame(collect_openfda_rows())
    if openfda_df.empty:
        raise RuntimeError("openFDA returned no pairwise interaction evidence; original CSV was not changed.")
    openfda_df.to_csv(OPENFDA_PATH, index=False)
    ddinter_df = load_if_exists(DDINTER_PATH)

    # Reduce DDInter's raw columns down to our standard schema.
    # NOTE: check the printed column names from fetch_ddinter.py and adjust
    # this mapping if DDInter's actual headers differ.
    if not ddinter_df.empty:
        rename_map = {}
        for col in ddinter_df.columns:
            c = col.lower()
            if "level" in c or "severity" in c or "risk" in c:
                rename_map[col] = "severity"
            elif "mechanism" in c or "description" in c:
                rename_map[col] = "mechanism"
            elif "management" in c or "recommend" in c:
                rename_map[col] = "recommendation"
        ddinter_df = ddinter_df.rename(columns=rename_map)
        drug_cols = [c for c in ddinter_df.columns if "drug" in c.lower()]
        if len(drug_cols) >= 2:
            ddinter_df = ddinter_df.rename(columns={drug_cols[0]: "drug_a", drug_cols[1]: "drug_b"})
        if "recommendation" not in ddinter_df.columns:
            ddinter_df["recommendation"] = "Verify with prescribing clinician."
        if "evidence_text" not in ddinter_df.columns:
            ddinter_df["evidence_text"] = ddinter_df.get("mechanism", "")
        for col in FINAL_COLUMNS:
            if col not in ddinter_df.columns:
                ddinter_df[col] = ""
        ddinter_df = ddinter_df[FINAL_COLUMNS]
        ddinter_df["evidence_text"] = ddinter_df["evidence_text"].fillna(ddinter_df["mechanism"])

    combined = pd.concat([original_df, ddinter_df, openfda_df], ignore_index=True)
    combined["drug_a"] = combined["drug_a"].astype(str).str.strip().str.lower()
    combined["drug_b"] = combined["drug_b"].astype(str).str.strip().str.lower()
    combined["pair_key"] = combined.apply(lambda row: "|".join(sorted((row["drug_a"], row["drug_b"]))), axis=1)
    duplicate_rows_removed = int(combined.duplicated("pair_key").sum())
    combined = combined.drop_duplicates("pair_key").drop(columns=["pair_key"])
    combined = combined[FINAL_COLUMNS]

    if len(combined) < len(original_df) or not set(original_df["drug_a"].str.lower() + "|" + original_df["drug_b"].str.lower()).issubset(set(combined["drug_a"] + "|" + combined["drug_b"])):
        raise RuntimeError("Validation failed: original interaction records were not preserved.")

    combined.to_csv(TEMP_PATH, index=False)
    validation = pd.read_csv(TEMP_PATH)
    if validation.empty or validation.duplicated(subset=["drug_a", "drug_b"]).any():
        raise RuntimeError("Validation failed: temporary output is empty or contains duplicate pairs.")
    os.replace(TEMP_PATH, FINAL_PATH)

    unique_drugs = set(validation["drug_a"]) | set(validation["drug_b"])
    def pair_category(row):
        pair = {row["drug_a"], row["drug_b"]}
        if pair <= DIABETES_DRUGS:
            return "diabetes-diabetes"
        if pair <= HYPERTENSION_DRUGS:
            return "hypertension-hypertension"
        if pair & DIABETES_DRUGS and pair & HYPERTENSION_DRUGS:
            return "diabetes-hypertension"
        return "cardiovascular/other"

    print(f"Interaction pairs collected: {len(validation)}")
    print(f"Unique drugs: {len(unique_drugs)}")
    print(f"Pairs by therapeutic category: {validation.apply(pair_category, axis=1).value_counts().to_dict()}")
    print(f"Duplicate rows removed: {duplicate_rows_removed}")
    print("FDA labels successfully queried and explicit interaction pairs extracted are printed by fetch_openfda.py.")
    print("Source: official FDA labeling retrieved through the openFDA drug label API.")
    print("Limitations: openFDA labels vary by product; severity is not consistently graded, and absence of a pair in this filtered set does not prove no interaction.")
    print(f"Validated output: {FINAL_PATH}")


if __name__ == "__main__":
    main()
