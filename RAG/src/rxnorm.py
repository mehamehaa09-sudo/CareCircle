"""Small official RxNorm client with a local success cache."""

import json
from pathlib import Path

import requests


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CACHE_PATH = ROOT / "data" / "rxnorm_cache.json"
RXNORM_BASE_URL = "https://rxnav.nlm.nih.gov/REST"


class RxNormClient:
    def __init__(self, cache_path: str | Path = DEFAULT_CACHE_PATH, timeout: int = 15):
        self.cache_path = Path(cache_path)
        self.timeout = timeout
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        if self.cache_path.exists():
            try:
                self.cache = json.loads(self.cache_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                self.cache = {}
        else:
            self.cache = {}
        self.last_errors: list[str] = []

    def _save_cache(self) -> None:
        self.cache_path.write_text(
            json.dumps(self.cache, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    @staticmethod
    def _key(name: str) -> str:
        return " ".join(str(name).lower().split())

    def get_rxcui(self, name: str) -> str | None:
        key = self._key(name)
        cached = self.cache.get(key)
        if cached:
            return cached.get("rxcui")
        try:
            response = requests.get(
                f"{RXNORM_BASE_URL}/rxcui.json",
                params={"name": name},
                timeout=self.timeout,
            )
            response.raise_for_status()
            ids = response.json().get("idGroup", {}).get("rxnormId", [])
            return str(ids[0]) if ids else None
        except (requests.RequestException, ValueError, IndexError, KeyError) as error:
            self.last_errors.append(f"{name}: {type(error).__name__}: {error}")
            return None

    def normalize_drug_name(self, name: str) -> dict:
        key = self._key(name)
        if key in self.cache:
            cached = self.cache[key]
            return {
                "input_name": name,
                "normalized_name": cached.get("normalized_name"),
                "rxcui": cached.get("rxcui"),
                "status": "normalized",
            }

        rxcui = self.get_rxcui(name)
        if not rxcui:
            return {"input_name": name, "normalized_name": None, "rxcui": None, "status": "unrecognized"}

        try:
            response = requests.get(
                f"{RXNORM_BASE_URL}/rxcui/{rxcui}/allrelated.json",
                timeout=self.timeout,
            )
            response.raise_for_status()
            groups = response.json().get("allRelatedGroup", {}).get("conceptGroup", [])
            ingredient = next(
                (
                    concept.get("name")
                    for group in groups
                    if group.get("tty") == "IN"
                    for concept in group.get("conceptProperties", [])
                    if concept.get("name")
                ),
                None,
            )
        except (requests.RequestException, ValueError, KeyError, TypeError) as error:
            self.last_errors.append(f"{name}: {type(error).__name__}: {error}")
            return {"input_name": name, "normalized_name": None, "rxcui": None, "status": "unrecognized"}

        if not ingredient:
            return {"input_name": name, "normalized_name": None, "rxcui": None, "status": "unrecognized"}

        result = {
            "input_name": name,
            "normalized_name": " ".join(ingredient.lower().split()),
            "rxcui": str(rxcui),
            "status": "normalized",
        }
        self.cache[key] = {
            "normalized_name": result["normalized_name"],
            "rxcui": result["rxcui"],
        }
        self._save_cache()
        return result


def normalize_prescription_drugs(drugs: list[str], client: RxNormClient | None = None) -> list[dict]:
    active_client = client or RxNormClient()
    return [active_client.normalize_drug_name(drug) for drug in drugs]