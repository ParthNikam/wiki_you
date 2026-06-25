from rag.config import Settings, ensure_dirs, load_env_file
from rag.summarizer import run_summarization, summarize_single_doc

if __name__ == "__main__":
    load_env_file()
    settings = Settings()
    ensure_dirs(settings)
    run_summarization(settings)
    # summarize_single_doc(settings)