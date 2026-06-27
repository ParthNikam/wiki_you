import argparse

from rag.config import Settings, load_env_file
from rag.embeddings import Embedder
from rag.llm import LLMClient


def parse_args() -> argparse.Namespace:
    """Parse an optional one-shot question for the LLM smoke test."""
    parser = argparse.ArgumentParser(description="Ask the configured LLM one direct question.")
    parser.add_argument("question", nargs="*", help="Question to ask the LLM.")
    return parser.parse_args()


def get_question(args: argparse.Namespace) -> str:
    """Read the question from CLI args or prompt for one interactively."""
    question = " ".join(args.question).strip()
    if question:
        return question
    return input("Question: ").strip()


def main() -> None:
    """Load settings, test embeddings, call the LLM, and print the answer."""
    args = parse_args()
    load_env_file()
    settings = Settings()
    question = get_question(args)

    if not question:
        print("No question provided.")
        return

    embedder = Embedder(
        settings.embedding_model,
        local_files_only=settings.embedding_local_files_only,
    )
    vector = embedder.embed([question])
    print(f"Embedding model: {settings.embedding_model}")
    print(f"Embedding shape: {vector.shape}")
    print(f"Embedding norm: {(vector[0] ** 2).sum() ** 0.5:.3f}")

    llm = LLMClient(settings.llm_model)
    answer = llm.complete(
        "Answer the user's question directly and concisely.",
        question,
        temperature=0.2,
    )
    print(answer)


if __name__ == "__main__":
    main()
