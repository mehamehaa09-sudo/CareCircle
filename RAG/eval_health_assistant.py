"""Evaluate the condition-scoped health assistant with representative questions."""

from src.generate_rag_answer import INSUFFICIENT_EVIDENCE_ANSWER, generate_answer


CASES = [
    ("Can I skip breakfast?", "diabetes", "answered"),
    ("Why am I always hungry?", "diabetes", "answered"),
    ("Is walking after meals a good idea?", "diabetes", "answered"),
    ("Can stress raise my sugar levels?", "diabetes", "answered"),
    ("Is honey better than sugar?", "diabetes", "answered"),
    ("What is HbA1c?", "diabetes", "answered"),
    ("What should I do if my blood sugar is too low?", "diabetes", "answered"),
    ("Can I eat rice every day if I have diabetes?", "diabetes", "answered"),
    ("Is it bad if my blood pressure is different in each arm?", "hypertension", "answered"),
    ("Can I take my BP medicine with coffee?", "hypertension", "answered"),
    ("How should blood pressure be measured at home?", "hypertension", "answered"),
    ("How does sodium affect blood pressure?", "hypertension", "answered"),
    ("How do I fix a flat bicycle tire?", "diabetes", "refused"),
    ("What's a good recipe for pasta?", "diabetes", "refused"),
    ("How do I repair a bicycle?", "diabetes", "refused"),
    ("Is it normal to have joint pain in the morning?", "diabetes", "refused"),
    ("What causes a common cold?", "diabetes", "refused"),
    ("How much sleep do adults need?", "diabetes", "refused"),
]


def actual_outcome(result: dict) -> str:
    answer = result.get("answer", "")
    return "refused" if answer == INSUFFICIENT_EVIDENCE_ANSWER else "answered"


def citation_sources(result: dict) -> list[str]:
    return [citation["source"] for citation in result.get("citations", [])]


def main() -> None:
    correct = 0
    answer_cases = 0
    answer_correct = 0
    refuse_cases = 0
    refuse_correct = 0

    print("Health assistant evaluation")
    print("=" * 80)
    for index, (question, condition, expected) in enumerate(CASES, 1):
        result = generate_answer(question, condition=condition)
        actual = actual_outcome(result)
        matches = actual == expected
        correct += matches
        if expected == "answered":
            answer_cases += 1
            answer_correct += matches
            sources = citation_sources(result)
            print(f"CITATIONS {index}: {sources}")
        else:
            refuse_cases += 1
            refuse_correct += matches
        print(
            f"{index:02d}. {question} | condition={condition} | "
            f"expected={expected.upper()} | actual={actual.upper()} | "
            f"{'MATCH' if matches else 'MISMATCH'}"
        )

    print("\nSummary")
    print("=" * 80)
    print(f"Total accuracy: {correct}/{len(CASES)}")
    print(f"Should-answer accuracy: {answer_correct}/{answer_cases}")
    print(f"Should-refuse accuracy: {refuse_correct}/{refuse_cases}")


if __name__ == "__main__":
    main()
