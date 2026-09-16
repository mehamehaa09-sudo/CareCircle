"""
Step 1: Download DDInter's ATC-class-A CSV (alimentary tract & metabolism drugs,
which includes metformin, glimepiride) and filter it down to rows involving
our target diabetes drugs.

Run: python src/fetch_ddinter.py
Output: data/ddinter_diabetes_filtered.csv
"""

import requests
import pandas as pd
import os

DDINTER_URL = "https://ddinter.scbdd.com/static/media/download/ddinter_downloads_code_A.csv"
RAW_PATH = "data/ddinter_raw_A.csv"
OUT_PATH = "data/ddinter_diabetes_filtered.csv"

# Drugs we care about for this project
TARGET_DRUGS = {
    "metformin", "glimepiride", "insulin",
    "hydrochlorothiazide", "metoprolol",  # in case cross-category pairs show up here
}


def download_raw():
    os.makedirs("data", exist_ok=True)
    print(f"Downloading {DDINTER_URL} ...")
    resp = requests.get(DDINTER_URL, timeout=60)
    resp.raise_for_status()
    with open(RAW_PATH, "wb") as f:
        f.write(resp.content)
    print(f"Saved raw file to {RAW_PATH} ({len(resp.content)/1e6:.1f} MB)")


def filter_for_targets():
    df = pd.read_csv(RAW_PATH)
    print("Columns found in DDInter file:", list(df.columns))

    # DDInter columns are typically something like: Drug_A, Drug_B, Level, ...
    # Normalize column names to lowercase for safety, then adjust below if needed.
    df.columns = [c.strip().lower() for c in df.columns]

    # Try to find the two drug-name columns automatically
    drug_cols = [c for c in df.columns if "drug" in c]
    if len(drug_cols) < 2:
        raise ValueError(
            f"Couldn't auto-detect drug name columns. Found columns: {list(df.columns)}. "
            "Open the CSV manually and check the real column names, then edit this script."
        )
    col_a, col_b = drug_cols[0], drug_cols[1]
    print(f"Using columns '{col_a}' and '{col_b}' as the drug pair")

    def norm(x):
        return str(x).strip().lower()

    mask = df[col_a].apply(norm).isin(TARGET_DRUGS) | df[col_b].apply(norm).isin(TARGET_DRUGS)
    filtered = df[mask].copy()
    filtered["source"] = "DDInter (ddinter.scbdd.com), ATC class A bulk download"

    filtered.to_csv(OUT_PATH, index=False)
    print(f"Found {len(filtered)} matching rows. Saved to {OUT_PATH}")
    print(filtered.head(10))


if __name__ == "__main__":
    download_raw()
    filter_for_targets()
