"""Generate citation-grounded answers from reranked local evidence using Groq."""

import argparse
import json
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

try:
    from .rerank_rag import RagReranker
except ImportError:
    from rerank_rag import RagReranker


ROOT = Path(__file__).resolve().parents[1]
BACKEND_ENV = ROOT / "backend" / ".env"
GROQ_MODEL = "openai/gpt-oss-120b"
DEFAULT_TOP_K = 5
RELEVANCE_SCORE_THRESHOLD = -8.0
MAX_EVIDENCE_CHARS_PER_CHUNK = 900
INSUFFICIENT_EVIDENCE_ANSWER = "The available sources do not provide enough information to answer that."
SUPPORTED_CONDITIONS = {"diabetes", "hypertension", "both"}


class MissingGroqApiKeyError(RuntimeError):
    """Raised when grounded generation cannot be configured."""


def _load_groq_client() -> Groq:
    load_dotenv(BACKEND_ENV)
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise MissingGroqApiKeyError(
            "GROQ_API_KEY is not configured. Add it to backend/.env before running grounded generation."
        )
    return Groq(api_key=api_key)


def _citation_for(index: int, evidence: dict) -> dict:
    metadata = evidence["metadata"]
    return {
        "id": index,
        "source": metadata["source"],
        "document": metadata["document"],
        "page": metadata["page"],
        "section": metadata.get("section"),
        "chunk_id": metadata["chunk_id"],
    }


def _format_source(index: int, evidence: dict) -> str:
    metadata = evidence["metadata"]
    page = metadata["page"] if metadata["page"] is not None else "web"
    section = metadata.get("section") or "not specified"
    text = evidence["text"]
    if len(text) > MAX_EVIDENCE_CHARS_PER_CHUNK:
        text = text[:MAX_EVIDENCE_CHARS_PER_CHUNK].rsplit(" ", 1)[0] + " [...]"
    return (
        f"SOURCE [{index}]\n"
        f"Document: {metadata['document']}\n"
        f"Condition: {metadata['condition']}\n"
        f"Page: {page}\n"
        f"Section: {section}\n"
        f"Source: {metadata['source']}\n"
        f"Text:\n{text}"
    )


def build_grounded_prompt(question: str, evidence: list[dict]) -> tuple[str, list[dict]]:
    citations = [_citation_for(index, item) for index, item in enumerate(evidence, start=1)]
    evidence_text = "\n\n".join(
        _format_source(index, item) for index, item in enumerate(evidence, start=1)
    )
    prompt = f"""You are answering a general health-information question using only the supplied evidence.

Rules:
- Answer ONLY from the supplied evidence. Do not use outside knowledge.
- Do not invent medical facts, values, diagnoses, or treatment details.
- If the evidence is insufficient, say: "The available sources do not provide enough information to answer that." 
- Apply clearly supported general principles to closely related examples even when the exact food, drink, or product name is not repeated in the evidence. For example, if the evidence discusses carbohydrate, added sugar, or sugar-sweetened products, use that guidance to address a related sweetener comparison without claiming unsupported differences between products.
- When the evidence supports the general principle but not a universal personal limit or direct comparison, explain the supported principle, state what remains individualized or unknown, and do not invent a numeric limit or product-specific claim.
- Do not diagnose the user.
- Do not prescribe, change, start, or stop medication.
- Do not tell the user to stop medication.
- Recommend consulting a qualified clinician or pharmacist when appropriate.
- Cite every factual claim with one or more supplied citations in the exact form [1], [2], etc.
- Do not create citations that are not present in the supplied evidence.
- Keep the response concise and understandable for a patient.

Question:
{question}

Supplied evidence:
{evidence_text}

Return only the answer with inline citations."""
    return prompt, citations


def evidence_is_relevant(evidence: list[dict]) -> bool:
    """Apply the post-retrieval scope gate to the highest reranker score."""
    return bool(evidence) and evidence[0].get("reranker_score", float("-inf")) >= RELEVANCE_SCORE_THRESHOLD


def generate_answer(question: str, condition: str = "both", reranker: RagReranker | None = None) -> dict:
    """Retrieve evidence and generate one citation-grounded answer."""
    if condition not in SUPPORTED_CONDITIONS:
        raise ValueError("condition must be diabetes, hypertension, or both")
    active_reranker = reranker or RagReranker()
    retrieval_condition = condition if condition != "both" else None
    evidence, _ = active_reranker.rerank(question, top_k=DEFAULT_TOP_K, condition=retrieval_condition)
    if not evidence_is_relevant(evidence):
        return {
            "question": question,
            "answer": "The available sources do not provide enough information to answer that.",
            "citations": [],
            "retrieved_evidence": [],
            "model": GROQ_MODEL,
        }
    prompt, citations = build_grounded_prompt(question, evidence)
    client = _load_groq_client()
    valid_citation_ids = {citation["id"] for citation in citations}
    answer = ""
    for attempt in range(2):
        retry_prompt = prompt
        if attempt:
            retry_prompt += (
                "\n\nIMPORTANT: Your previous response was missing valid citations. "
                "Return every factual paragraph with citations written exactly as [1], [2], [3], [4], or [5]."
            )
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": retry_prompt}],
            temperature=0.1,
        )
        answer = response.choices[0].message.content or ""
        answer = re.sub(r"【(\d+)】", r"[\1]", answer.strip())
        cited_ids = {int(value) for value in re.findall(r"\[(\d+)\]", answer)}
        if answer == INSUFFICIENT_EVIDENCE_ANSWER:
            break
        if answer and cited_ids and cited_ids.issubset(valid_citation_ids):
            break
    else:
        raise RuntimeError(
            "Groq returned an answer without valid citations tied to the retrieved evidence."
        )

    return {
        "question": question,
        "answer": answer,
        "citations": [] if answer == INSUFFICIENT_EVIDENCE_ANSWER else citations,
        "retrieved_evidence": evidence,
        "model": GROQ_MODEL,
    }


def print_result(result: dict) -> None:
    print(f"Question: {result['question']}")
    print(f"\nGenerated answer:\n{result['answer']}")
    print("\nCitations:")
    for citation in result["citations"]:
        page = citation["page"] if citation["page"] is not None else "web"
        section = citation["section"] or "not specified"
        print(
            f"[{citation['id']}] {citation['document']}, page={page}, "
            f"section={section}, source={citation['source']}"
        )
    print("\nEvidence sources used:")
    for citation in result["citations"]:
        print(f"- {citation['source']}")
    print(f"\nModel: {result['model']}")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Generate a citation-grounded answer from local RAG evidence.")
    parser.add_argument("question", nargs="?", help="Question to answer from retrieved evidence")
    args = parser.parse_args()
    question = args.question or input("Question: ")
    print_result(generate_answer(question))


if __name__ == "__main__":
    main()