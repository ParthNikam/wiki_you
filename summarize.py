import argparse
import sys

from rag.config import Settings, ensure_dirs, load_env_file
from rag.summarizer import rebuild_vector_stores, run_summarization


def parse_args() -> argparse.Namespace:
    """Parse summarization workflow options."""
    parser = argparse.ArgumentParser(description="Summarize notes and build chat indexes.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate summaries even when summary files already exist.",
    )
    parser.add_argument(
        "--index-only",
        action="store_true",
        help="Only rebuild FAISS indexes from existing memory and summary files.",
    )
    return parser.parse_args()


def main() -> None:
    """Run the summarization or index rebuild entry point."""
    args = parse_args()
    load_env_file()
    settings = Settings()
    ensure_dirs(settings)

    try:
        if args.index_only:
            rebuild_vector_stores(settings)
            return

        run_summarization(settings, skip_existing=not args.force)
    except ModuleNotFoundError as exc:
        print(f"Missing Python dependency: {exc.name}")
        print("Install dependencies in this same Python environment with:")
        print(f"{sys.executable} -m pip install -r requirements.txt")
        raise SystemExit(1) from exc
    except OSError as exc:
        print(f"Could not build vector stores: {exc}")
        print("The embedding model may need to be downloaded before FAISS files can be written.")
        raise SystemExit(1) from exc
    except RuntimeError as exc:
        print(f"Could not build vector stores: {exc}")
        print("The embedding model may need Hugging Face access before FAISS files can be written.")
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
