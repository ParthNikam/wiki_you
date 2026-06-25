from rag.config import Settings
from rag.embeddings import Embedder
from rag.llm import LLMClient
from rag.vector_store import ChunkRecord, FaissStore


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


def retrieve(query: str, settings: Settings, embedder: Embedder) -> list[tuple[ChunkRecord, float]]:
    """Search summaries first, then original memory notes if summary matches are weak."""
    query_vector = embedder.embed([query])
    summary_hits = load_store("summaries", settings).search(query_vector, settings.retrieve_k)

    if summary_hits and summary_hits[0][1] >= 0.35:
        return summary_hits

    memory_hits = load_store("memory", settings).search(query_vector, settings.retrieve_k)
    return summary_hits[:2] + memory_hits


def answer_question(question: str, settings: Settings, embedder: Embedder, llm: LLMClient) -> str:
    """Retrieve context and ask the LLM for a grounded answer."""
    hits = retrieve(question, settings, embedder)
    context = format_context(hits)
    prompt = f"""Question:
{question}

Context:
{context}"""
    return llm.complete(CHAT_SYSTEM, prompt, temperature=0.1)


def chat_loop(settings: Settings) -> None:
    """Run the interactive command-line chat."""
    embedder = Embedder(settings.embedding_model)
    llm = LLMClient(settings.llm_model)
    print("Wiki You chat. Type 'exit' or 'quit' to stop.")

    while True:
        question = input("\nYou: ").strip()
        if question.lower() in {"exit", "quit"}:
            break
        if not question:
            continue
        print(f"\nAssistant: {answer_question(question, settings, embedder, llm)}")
