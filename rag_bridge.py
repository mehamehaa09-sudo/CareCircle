import json
import sys
from pathlib import Path

RAG_ROOT = Path(__file__).resolve().parent / "RAG"
sys.path.insert(0, str(RAG_ROOT))

from src.generate_rag_answer import generate_answer
from src.prescription_checker import PrescriptionChecker


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else "question"
    if mode == "prescription":
        prescription_a = sys.argv[2] if len(sys.argv) > 2 else ""
        prescription_b = sys.argv[3] if len(sys.argv) > 3 else ""
        result = PrescriptionChecker().check_prescriptions(prescription_a, prescription_b)
    else:
        question = " ".join(sys.argv[1:]).strip()
        if not question:
            raise ValueError("question is required")
        result = generate_answer(question, condition="both")
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(1)
