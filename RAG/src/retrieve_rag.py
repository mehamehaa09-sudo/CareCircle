"""Dense, sparse, and hybrid retrieval over the local RAG artifacts."""

import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer


ROOT = Path(__file__).resolve().parents[1]
INDEX_DIR = ROOT / "data" / "rag_index"
DEFAULT_MODEL = "all-MiniLM-L6-v2"
RRF_K = 60


class RagRetriever:
    """Load the persisted indexes and expose dense, sparse, and hybrid search."""

    def __init__(self, index_dir: Path = INDEX_DIR):
        self.index_dir = Path(index_dir)
        self.chunks = [
            json.loads(line)
            for line in (self.index_dir / "chunks.jsonl").read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        self.embeddings = np.load(self.index_dir / "embeddings.npy")
        with (self.index_dir / "bm25.json").open("r", encoding="utf-8") as file:
            sparse_data = json.load(file)
        self.tokenized_chunks = sparse_data["tokenized_chunks"]
        self.bm25 = BM25Okapi(self.tokenized_chunks)
        metadata_path = self.index_dir / "index_metadata.json"
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        self.model = SentenceTransformer(metadata.get("embedding_model", DEFAULT_MODEL))

        if len(self.chunks) != len(self.embeddings) or len(self.chunks) != len(self.tokenized_chunks):
            raise ValueError("RAG artifacts have inconsistent chunk counts.")

    @staticmethod
    def _tokens(text: str) -> list[str]:
        return re.findall(r"[a-z0-9]+", text.lower())

    @staticmethod
    def _retrieval_query(query: str) -> str:
        """Add general clinical vocabulary used by the indexed guidance."""
        lowered = query.lower()
        expansions = []
        if any(term in lowered for term in ("eat", "drink", "food", "meal", "sugar", "rice", "mango", "tea")):
            expansions.extend((
                "diabetes nutrition",
                "meal planning",
                "carbohydrate intake",
                "food choices",
                "added sugars",
                "healthy eating pattern",
            ))
        if any(term in lowered for term in ("hungry", "hunger", "thirsty", "thirst", "low blood", "too low")):
            expansions.extend((
                "blood glucose symptoms",
                "hyperglycemia",
                "hypoglycemia",
                "diabetes management",
            ))
        return " ".join((query, *expansions))

    def dense_search(self, query: str, top_k: int = 5) -> list[dict]:
        """Return top chunks ranked by cosine similarity."""
        query_embedding = self.model.encode([self._retrieval_query(query)], normalize_embeddings=True)[0]
        scores = self.embeddings @ query_embedding
        indices = np.argsort(scores)[::-1][:top_k]
        return [self._result(int(index), float(scores[index]), "dense") for index in indices]

    def sparse_search(self, query: str, top_k: int = 5) -> list[dict]:
        """Return top chunks ranked by BM25 score."""
        scores = np.asarray(self.bm25.get_scores(self._tokens(self._retrieval_query(query))))
        indices = np.argsort(scores)[::-1][:top_k]
        return [self._result(int(index), float(scores[index]), "sparse") for index in indices]

    def hybrid_search(self, query: str, top_k: int = 5, condition: str | None = None) -> list[dict]:
        """Fuse dense and sparse rankings with Reciprocal Rank Fusion.

        RRF is used because cosine and BM25 scores have different scales. Each
        candidate receives 1 / (60 + rank) from each result list, and candidates
        appearing in both lists naturally rank above one-method candidates.
        """
        dense = self.dense_search(query, top_k=len(self.chunks))
        sparse = self.sparse_search(query, top_k=len(self.chunks))
        if condition in {"diabetes", "hypertension"}:
            dense = [item for item in dense if item["metadata"].get("condition") == condition]
            sparse = [item for item in sparse if item["metadata"].get("condition") == condition]
        dense = dense[:top_k]
        sparse = sparse[:top_k]
        by_chunk = {}

        for rank, result in enumerate(dense, start=1):
            chunk_id = result["metadata"]["chunk_id"]
            entry = by_chunk.setdefault(chunk_id, {"result": result, "score": 0.0, "methods": []})
            entry["score"] += 1 / (RRF_K + rank)
            entry["methods"].append("dense")

        for rank, result in enumerate(sparse, start=1):
            chunk_id = result["metadata"]["chunk_id"]
            entry = by_chunk.setdefault(chunk_id, {"result": result, "score": 0.0, "methods": []})
            entry["score"] += 1 / (RRF_K + rank)
            entry["methods"].append("sparse")
            if entry["result"]["method"] == "dense":
                entry["result"] = result

        fused = []
        for entry in by_chunk.values():
            result = dict(entry["result"])
            result["method"] = "hybrid (" + "+".join(entry["methods"]) + ")"
            result["score"] = entry["score"]
            fused.append(result)
        fused.sort(key=lambda result: result["score"], reverse=True)
        return fused[:top_k]

    def _result(self, index: int, score: float, method: str) -> dict:
        chunk = self.chunks[index]
        return {
            "method": method,
            "score": score,
            "text": chunk["text"],
            "metadata": chunk["metadata"],
        }


def print_results(query: str, results: list[dict]) -> None:
    print(f"\nQuery: {query}")
    for rank, result in enumerate(results, start=1):
        metadata = result["metadata"]
        location = f"page={metadata['page']}" if metadata["page"] is not None else "page=web"
        if metadata.get("section"):
            location += f", section={metadata['section']}"
        print(f"\n[{rank}] method={result['method']} score={result['score']:.6f}")
        print(f"source={metadata['source']} | document={metadata['document']} | {location}")
        print(f"chunk_id={metadata['chunk_id']} | condition={metadata['condition']}")
        print(f"text={result['text']}")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Retrieve source chunks without generating an answer.")
    parser.add_argument("query", nargs="?", help="Question to retrieve evidence for")
    parser.add_argument("--method", choices=("dense", "sparse", "hybrid"), default="hybrid")
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    retriever = RagRetriever()
    query = args.query or input("Query: ")
    results = getattr(retriever, f"{args.method}_search")(query, top_k=args.top_k)
    print_results(query, results)


if __name__ == "__main__":
    main()