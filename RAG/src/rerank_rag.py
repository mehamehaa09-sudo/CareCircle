"""Neural cross-encoder reranking over the existing hybrid RAG candidates."""

import argparse
import sys
from pathlib import Path

from sentence_transformers import CrossEncoder

try:
    from .retrieve_rag import RagRetriever
except ImportError:
    from retrieve_rag import RagRetriever


ROOT = Path(__file__).resolve().parents[1]
MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"
MODEL_CACHE_DIR = ROOT / "data" / "rag_models" / "cross_encoder"
DEFAULT_CANDIDATE_POOL = 20
DEFAULT_TOP_K = 5


class RagReranker:
    """Run hybrid retrieval followed by local neural cross-encoder scoring."""

    def __init__(self, retriever: RagRetriever | None = None):
        self.retriever = retriever or RagRetriever()
        MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        self.model = CrossEncoder(MODEL_NAME, cache_folder=str(MODEL_CACHE_DIR))

    def rerank(
        self,
        query: str,
        candidate_pool: int = DEFAULT_CANDIDATE_POOL,
        top_k: int = DEFAULT_TOP_K,
        condition: str | None = None,
    ) -> tuple[list[dict], list[dict]]:
        """Return reranked results and the original hybrid candidate ranking."""
        candidates = self.retriever.hybrid_search(query, top_k=candidate_pool, condition=condition)
        rerank_query = self.retriever._retrieval_query(query)
        pairs = [(rerank_query, candidate["text"]) for candidate in candidates]
        reranker_scores = self.model.predict(pairs, show_progress_bar=False)

        reranked = []
        for candidate, score in zip(candidates, reranker_scores):
            result = {
                "text": candidate["text"],
                "metadata": dict(candidate["metadata"]),
                "hybrid_score": float(candidate["score"]),
                "reranker_score": float(score),
                "method": "hybrid + cross-encoder",
            }
            reranked.append(result)
        reranked.sort(key=lambda result: result["reranker_score"], reverse=True)
        return reranked[:top_k], candidates


def print_results(query: str, results: list[dict], candidate_count: int) -> None:
    print(f"Query: {query}")
    print(f"Candidate count: {candidate_count}")
    print(f"Final result count: {len(results)}")
    print(f"Reranker model: {MODEL_NAME}")
    for rank, result in enumerate(results, start=1):
        metadata = result["metadata"]
        page = metadata["page"] if metadata["page"] is not None else "web"
        section = metadata.get("section") or "(none)"
        print(f"\n[{rank}] reranker_score={result['reranker_score']:.6f} hybrid_score={result['hybrid_score']:.6f}")
        print(f"source={metadata['source']}")
        print(f"document={metadata['document']} | page={page} | section={section}")
        print(f"chunk_id={metadata['chunk_id']} | condition={metadata['condition']}")
        print(f"text={result['text']}")


def ordering_changed(results: list[dict], candidates: list[dict]) -> bool:
    original_ids = [candidate["metadata"]["chunk_id"] for candidate in candidates[:len(results)]]
    reranked_ids = [result["metadata"]["chunk_id"] for result in results]
    return original_ids != reranked_ids


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="Rerank retrieved source chunks without generating an answer.")
    parser.add_argument("query", nargs="?", help="Question to retrieve and rerank")
    parser.add_argument("--candidate-pool", type=int, default=DEFAULT_CANDIDATE_POOL)
    parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K)
    args = parser.parse_args()

    query = args.query or input("Query: ")
    reranker = RagReranker()
    results, candidates = reranker.rerank(query, args.candidate_pool, args.top_k)
    print_results(query, results, len(candidates))
    print(f"Hybrid ordering changed: {'yes' if ordering_changed(results, candidates) else 'no'}")
    print(f"Model cache: {MODEL_CACHE_DIR}")


if __name__ == "__main__":
    main()