from typing import TYPE_CHECKING

from rag.config import Settings
from rag.vector_store import ChunkRecord, FaissStore

if TYPE_CHECKING:
    from rag.embeddings import Embedder
    from rag.llm import LLMClient


CHAT_SYSTEM = """You answer questions from retrieved personal notes.
Use the supplied context only. If the context does not contain the answer, say: "I don't have that information."
Be concise, specific, and cite source filenames when helpful."""


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


def chat_loop(settings: Settings) -> None:
    """Run the interactive command-line chat."""
    try:
        from rag.embeddings import Embedder
        from rag.llm import LLMClient

        print("Loading chat indexes...")
        summary_store = load_store("summaries", settings)
        memory_store = load_store("memory", settings)
        print("Loading embedding model...")
        embedder = Embedder(
            settings.embedding_model,
            local_files_only=settings.embedding_local_files_only,
        )
        llm = LLMClient(settings.llm_model)
    except FileNotFoundError as exc:
        print(f"Chat index is missing: {exc}")
        print("Run `python summarize.py` first to build the summary and memory indexes.")
        return
    except ModuleNotFoundError as exc:
        print(f"Missing Python dependency: {exc.name}")
        print("Install project dependencies with `pip install -r requirements.txt` in the active environment.")
        return

    print("Wiki You chat. Type 'exit' or 'quit' to stop.")

    try:
        while True:
            question = input("\nYou: ").strip()
            if question.lower() in {"exit", "quit"}:
                print("Goodbye.")
                break
            if not question:
                continue
            answer = answer_question(question, settings, embedder, llm, summary_store, memory_store)
            print(f"\nAssistant: {answer}")
    except (EOFError, KeyboardInterrupt):
        print("\nGoodbye.")
