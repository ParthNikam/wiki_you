from pathlib import Path

from rag.chunking import chunk_text
from rag.config import Settings, ensure_dirs
from rag.documents import Document, list_markdown_files, read_document, summary_path_for, write_text
from rag.embeddings import Embedder
from rag.llm import LLMClient
from rag.vector_store import ChunkRecord, FaissStore


SUMMARY_SYSTEM = """You summarize personal markdown notes into accurate retrieval notes.
Extract only information supported by the source. Keep names, events, actions, ideas, dates, and emotional context when present."""


def summarize_chunk(llm: LLMClient, document: Document, chunk: str, chunk_no: int) -> str:
    """Summarize one chunk into structured bullets."""
    prompt = f"""Source file: {document.path.name}
Chunk: {chunk_no}

Return concise markdown with these sections:
- People
- Events
- Actions
- Ideas
- Summary

Content:
{chunk}"""
    return llm.complete(SUMMARY_SYSTEM, prompt)


def merge_summaries(llm: LLMClient, document: Document, chunk_summaries: list[str]) -> str:
    """Merge chunk summaries into one final file summary."""
    joined = "\n\n---\n\n".join(chunk_summaries)
    prompt = f"""Source file: {document.path.name}

Merge these chunk notes into one non-redundant markdown summary.
Use exactly these headings:
# {document.title}
## People
## Events
## Actions
## Ideas
## Summary
## Source File

Under Source File, write the original filename.

Chunk notes:
{joined}"""
    return llm.complete(SUMMARY_SYSTEM, prompt)


def summarize_document(llm: LLMClient, settings: Settings, document: Document) -> Path:
    """Create or replace a summary markdown file for one document."""
    chunks = chunk_text(document.text, settings.chunk_size, settings.chunk_overlap)
    chunk_summaries = [
        summarize_chunk(llm, document, chunk, index + 1)
        for index, chunk in enumerate(chunks)
    ]
    final_summary = merge_summaries(llm, document, chunk_summaries)
    output_path = summary_path_for(document.path, settings.summary_dir)
    write_text(output_path, final_summary)
    return output_path


def build_index(settings: Settings) -> Path:
    """Create summary/Index.md from generated summary files."""
    rows = ["# Summary Index", ""]
    for path in sorted(settings.summary_dir.glob("*.summary.md")):
        text = path.read_text(encoding="utf-8", errors="replace")
        brief = next((line.strip("- ").strip() for line in text.splitlines() if line.strip().startswith("-")), "")
        rows.append(f"- [{path.stem.replace('.summary', '')}]({path.name}) - {brief}")

    index_path = settings.summary_dir / "Index.md"
    write_text(index_path, "\n".join(rows))
    return index_path


def make_records(folder: Path, kind: str, settings: Settings) -> list[ChunkRecord]:
    """Turn markdown files into chunk metadata records."""
    records: list[ChunkRecord] = []
    for path in list_markdown_files(folder):
        document = read_document(path)
        for chunk_id, chunk in enumerate(chunk_text(document.text, settings.chunk_size, settings.chunk_overlap)):
            records.append(
                ChunkRecord(
                    source_file=path.name,
                    title=document.title,
                    text=chunk,
                    kind=kind,
                    chunk_id=chunk_id,
                )
            )
    return records


def save_store(name: str, records: list[ChunkRecord], embedder: Embedder, settings: Settings) -> None:
    """Embed records and save a FAISS vector store."""
    vectors = embedder.embed([record.text for record in records])
    store = FaissStore(
        settings.vector_dir / f"{name}.faiss",
        settings.vector_dir / f"{name}.metadata.json",
    )
    store.build(vectors, records)
    store.save()


def run_summarization(settings: Settings) -> None:
    """Summarize all memory markdown files and rebuild retrieval indexes."""
    ensure_dirs(settings)
    llm = LLMClient(settings.llm_model)

    for path in list_markdown_files(settings.memory_dir):
        document = read_document(path)
        if document.text:
            summarize_document(llm, settings, document)

    build_index(settings)
    embedder = Embedder(settings.embedding_model)
    save_store("summaries", make_records(settings.summary_dir, "summary", settings), embedder, settings)
    save_store("memory", make_records(settings.memory_dir, "memory", settings), embedder, settings)
