"""Exercise the post-retrieval scope gate without calling the LLM."""

from src.generate_rag_answer import RELEVANCE_SCORE_THRESHOLD, evidence_is_relevant
from src.rerank_rag import RagReranker
from src.retrieve_rag import RagRetriever

CASES = [
    ("Can I skip breakfast?", "diabetes", True),
    ("Why am I always hungry?", "diabetes", True),
    ("Is walking after meals a good idea?", "diabetes", True),
    ("Can stress raise my sugar levels?", "diabetes", True),
    ("Why does my vision get blurry sometimes?", "diabetes", True),
    ("Is it bad if my blood pressure is different in each arm?", "hypertension", True),
    ("Can I take my BP medicine with coffee?", "hypertension", True),
    ("How do I fix a flat bicycle tire?", "diabetes", False),
    ("What's a good recipe for pasta?", "diabetes", False),
]


def main() -> None:
    reranker = RagReranker(RagRetriever())
    print(f"Relevance threshold: {RELEVANCE_SCORE_THRESHOLD:.2f}")
    for question, condition, expected_answered in CASES:
        evidence, _ = reranker.rerank(
            question,
            condition=condition,
        )
        top_score = evidence[0].get("reranker_score") if evidence else None
        answered = evidence_is_relevant(evidence)
        matches = answered == expected_answered
        print(
            f"question={question!r}\n"
            f"top_reranker_score={top_score!r} answered={answered} "
            f"expected={expected_answered} matches_expected={matches}\n"
        )


if __name__ == "__main__":
    main()
