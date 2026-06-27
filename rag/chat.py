import sys
import time
from datetime import datetime
from typing import TYPE_CHECKING

from rag.config import Settings
from rag.summarizer import build_index
from rag.vector_store import ChunkRecord, FaissStore

if TYPE_CHECKING:
    from rag.embeddings import Embedder
    from rag.llm import LLMClient


CHAT_SYSTEM = """You answer questions from retrieved personal notes.
Use the supplied context only. If the context does not contain the answer, say: "I don't have that information."
Be concise, specific, and cite source filenames when helpful."""

CHAT_INTERACTIONS_FILE = "chat_interactions.summary.md"


def load_store(name: str, settings: Settings) -> FaissStore:
    """Load one named FAISS store from the summary vector folder."""
    store = FaissStore(
        settings.vector_dir / f"{name}.faiss",
        settings.vector_dir / f"{name}.metadata.json",
    )
    store.load()
    return store


def format_context(records: list[tuple[ChunkRecord, float]]) -> str:
    """Format retrieved chunks for the LLM prompt."""
    parts: list[str] = []
    for record, score in records:
        parts.append(
            f"Source: {record.source_file}\nKind: {record.kind}\nScore: {score:.3f}\n{record.text}"
        )
    return "\n\n---\n\n".join(parts)


def retrieve(
    query: str,
    settings: Settings,
    embedder: "Embedder",
    summary_store: FaissStore,
    memory_store: FaissStore,
) -> list[tuple[ChunkRecord, float]]:
    """Search summaries first, then original memory notes if summary matches are weak."""
    query_vector = embedder.embed([query])
    summary_hits = summary_store.search(query_vector, settings.retrieve_k)

    if summary_hits and summary_hits[0][1] >= 0.35:
        return summary_hits

    memory_hits = memory_store.search(query_vector, settings.retrieve_k)
    return summary_hits[:2] + memory_hits


def answer_question(
    question: str,
    settings: Settings,
    embedder: "Embedder",
    llm: "LLMClient",
    summary_store: FaissStore,
    memory_store: FaissStore,
) -> str:
    """Retrieve context and ask the LLM for a grounded answer."""
    hits = retrieve(question, settings, embedder, summary_store, memory_store)
    context = format_context(hits)
    prompt = f"""Question:
{question}

Context:
{context}"""
    return llm.complete(CHAT_SYSTEM, prompt, temperature=0.1)


def should_store_interaction(answer: str) -> bool:
    """Decide whether an answer contains useful information worth indexing."""
    normalized = answer.strip().lower()
    return bool(normalized) and "i don't have that information" not in normalized


def format_interaction_note(
    question: str,
    answer: str,
    hits: list[tuple[ChunkRecord, float]],
) -> str:
    """Format one question and answer as a compact retrieval note."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sources = sorted({record.source_file for record, _score in hits})
    source_text = ", ".join(sources) if sources else "None"
    return f"""## Chat Interaction - {timestamp}
Question: {question}

Answer: {answer}

Sources: {source_text}
"""


def next_interaction_chunk_id(summary_store: FaissStore) -> int:
    """Find the next chunk id for the chat interaction summary file."""
    return sum(
        1
        for record in summary_store.records
        if record.source_file == CHAT_INTERACTIONS_FILE
    )


def append_interaction_to_summary(settings: Settings, note: str) -> None:
    """Append one chat interaction note to the generated summary folder."""
    path = settings.summary_dir / CHAT_INTERACTIONS_FILE
    prefix = ""
    if path.exists() and path.read_text(encoding="utf-8", errors="replace").strip():
        prefix = "\n\n"
    else:
        note = f"# Chat Interactions\n\n{note}"
    with path.open("a", encoding="utf-8") as file:
        file.write(prefix + note.strip() + "\n")


def add_interaction_to_summary_index(
    question: str,
    answer: str,
    hits: list[tuple[ChunkRecord, float]],
    settings: Settings,
    embedder: "Embedder",
    summary_store: FaissStore,
) -> None:
    """Persist a useful Q&A interaction and append it to the summary vector store."""
    if not should_store_interaction(answer):
        return

    note = format_interaction_note(question, answer, hits)
    append_interaction_to_summary(settings, note)
    record = ChunkRecord(
        source_file=CHAT_INTERACTIONS_FILE,
        title="chat_interactions.summary",
        text=note,
        kind="summary",
        chunk_id=next_interaction_chunk_id(summary_store),
    )
    vectors = embedder.embed([note])
    summary_store.add(vectors, [record])
    summary_store.save()
    build_index(settings)
    print(f"Added chat interaction to {CHAT_INTERACTIONS_FILE}.")


def load_embedder(settings: Settings) -> "Embedder":
    """Load the embedding model once and report slow initialization clearly."""
    from rag.embeddings import Embedder

    started_at = time.perf_counter()
    print(f"Loading embedding model: {settings.embedding_model}", flush=True)
    embedder = Embedder(
        settings.embedding_model,
        local_files_only=settings.embedding_local_files_only,
    )
    elapsed = time.perf_counter() - started_at
    print(f"Embedding model ready in {elapsed:.1f}s.", flush=True)
    return embedder


def chat_loop(settings: Settings) -> None:
    """Run the interactive command-line chat."""
    try:
        from rag.llm import LLMClient

        print("Loading chat indexes...", flush=True)
        summary_store = load_store("summaries", settings)
        memory_store = load_store("memory", settings)
        print("Loading LLM client...", flush=True)
        llm = LLMClient(settings.llm_model)
    except FileNotFoundError as exc:
        print(f"Chat index is missing: {exc}")
        print("Run `python summarize.py --index-only` to build the vector indexes.")
        return
    except ModuleNotFoundError as exc:
        print(f"Missing Python dependency: {exc.name}")
        print("Use the same Python environment that built the vector indexes.")
        return
    except Exception as exc:
        print(f"Chat startup failed: {exc}")
        print("Check OPENAI_API_KEY and your active Python environment.")
        return

    if not sys.stdin.isatty():
        print("No interactive terminal input is attached, so the chat loop cannot wait for questions.")
        print("Run this from an interactive PowerShell or Command Prompt window.")
        return

    print("Wiki You chat. Type 'exit' or 'quit' to stop.")
    embedder = None

    try:
        while True:
            question = input("\nYou: ").strip()
            if question.lower() in {"exit", "quit"}:
                print("Goodbye.")
                break
            if not question:
                continue
            if embedder is None:
                embedder = load_embedder(settings)
            hits = retrieve(question, settings, embedder, summary_store, memory_store)
            context = format_context(hits)
            prompt = f"""Question:
{question}

Context:
{context}"""
            answer = llm.complete(CHAT_SYSTEM, prompt, temperature=0.1)
            print(f"\nAssistant: {answer}")
            add_interaction_to_summary_index(
                question,
                answer,
                hits,
                settings,
                embedder,
                summary_store,
            )
    except (EOFError, KeyboardInterrupt):
        print("\nGoodbye.")
