"""Build local dense and sparse retrieval artifacts from CareCircle sources."""

import json
import re
from pathlib import Path
from typing import Iterable

import numpy as np
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer


ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE_DIR = ROOT / "data" / "Knowledge"
NIDDK_CACHE_DIR = ROOT / "data" / "rag_sources" / "niddk"
INDEX_DIR = ROOT / "data" / "rag_index"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

NIDDK_URLS = (
    "https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes",
    "https://www.niddk.nih.gov/health-information/diabetes/overview/managing-diabetes",
    "https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems",
)


def clean_text(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return text.strip()


def condition_for(path: Path) -> str:
    relative = path.relative_to(KNOWLEDGE_DIR).parts
    return relative[0].lower() if relative else "general"


def split_chunk(text: str, max_chars: int = 1400, overlap: int = 180) -> list[str]:
    paragraphs = [clean_text(part) for part in re.split(r"\n\s*\n", text) if clean_text(part)]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if len(current) + len(paragraph) + 2 <= max_chars:
            current = f"{current}\n\n{paragraph}".strip()
            continue
        if current:
            chunks.append(current)
        tail = current[-overlap:] if current else ""
        current = f"{tail}\n\n{paragraph}".strip()
    if current:
        chunks.append(current)
    return chunks


def pdf_documents() -> Iterable[dict]:
    for path in sorted(KNOWLEDGE_DIR.rglob("*.pdf")):
        reader = PdfReader(str(path))
        for page_number, page in enumerate(reader.pages, start=1):
            text = clean_text(page.extract_text() or "")
            if not text:
                continue
            yield {
                "text": text,
                "source": str(path.relative_to(ROOT)).replace("\\", "/"),
                "document": path.name,
                "condition": condition_for(path),
                "page": page_number,
                "section": None,
            }


def fetch_niddk(url: str) -> tuple[str, str]:
    NIDDK_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    slug = url.rstrip("/").split("/")[-1]
    cache_path = NIDDK_CACHE_DIR / f"{slug}.html"
    if cache_path.exists():
        html = cache_path.read_text(encoding="utf-8")
    else:
        response = requests.get(url, timeout=45, headers={"User-Agent": "CareCircle-RAG/1.0"})
        response.raise_for_status()
        html = response.text
        cache_path.write_text(html, encoding="utf-8")
    return url, html


def niddk_documents() -> Iterable[dict]:
    for url in NIDDK_URLS:
        _, html = fetch_niddk(url)
        soup = BeautifulSoup(html, "html.parser")
        for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
            element.decompose()
        main = soup.find("main") or soup.find("article") or soup.body
        if main is None:
            raise ValueError(f"No readable article body found for {url}")
        blocks = []
        section = None
        for element in main.find_all(["h1", "h2", "h3", "p", "li"]):
            value = clean_text(element.get_text(" ", strip=True))
            if not value:
                continue
            if element.name in {"h1", "h2", "h3"}:
                section = value
                blocks.append(f"{value}\n")
            else:
                blocks.append(value)
        text = "\n\n".join(blocks)
        yield {
            "text": text,
            "source": url,
            "document": url.rstrip("/").split("/")[-1],
            "condition": "diabetes",
            "page": None,
            "section": section,
        }


def build_chunks() -> list[dict]:
    source_documents = list(pdf_documents()) + list(niddk_documents())
    chunks = []
    for document in source_documents:
        for index, text in enumerate(split_chunk(document["text"])):
            chunks.append({
                "text": text,
                "metadata": {
                    "source": document["source"],
                    "document": document["document"],
                    "condition": document["condition"],
                    "page": document["page"],
                    "section": document["section"],
                    "chunk_id": f"{document['document']}:{document['page'] or 'web'}:{index}",
                },
            })
    return chunks


def save_sparse_index(chunks: list[dict]) -> None:
    tokenized = [re.findall(r"[a-z0-9]+", chunk["text"].lower()) for chunk in chunks]
    (INDEX_DIR / "bm25.json").write_text(
        json.dumps({"tokenized_chunks": tokenized}, ensure_ascii=False), encoding="utf-8"
    )


def main() -> None:
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    chunks = build_chunks()
    if not chunks:
        raise RuntimeError("No chunks were created from the configured sources.")

    (INDEX_DIR / "chunks.jsonl").write_text(
        "\n".join(json.dumps(chunk, ensure_ascii=False) for chunk in chunks) + "\n",
        encoding="utf-8",
    )
    save_sparse_index(chunks)

    model = SentenceTransformer(EMBEDDING_MODEL)
    embeddings = model.encode(
        [chunk["text"] for chunk in chunks],
        normalize_embeddings=True,
        show_progress_bar=True,
    )
    np.save(INDEX_DIR / "embeddings.npy", np.asarray(embeddings, dtype=np.float32))
    (INDEX_DIR / "index_metadata.json").write_text(
        json.dumps({"embedding_model": EMBEDDING_MODEL, "chunk_count": len(chunks)}, indent=2),
        encoding="utf-8",
    )

    by_condition = {}
    by_source = {}
    for chunk in chunks:
        metadata = chunk["metadata"]
        by_condition[metadata["condition"]] = by_condition.get(metadata["condition"], 0) + 1
        by_source[metadata["source"]] = by_source.get(metadata["source"], 0) + 1
    print(f"Source documents: {len(set(chunk['metadata']['document'] for chunk in chunks))}")
    print(f"Chunks: {len(chunks)}")
    print(f"Chunks by condition: {by_condition}")
    print(f"Chunks by source: {by_source}")
    print("Embeddings successfully created: True")
    print(f"Local indexes/data saved to: {INDEX_DIR}")


if __name__ == "__main__":
    main()