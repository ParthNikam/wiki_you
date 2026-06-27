from dataclasses import dataclass
from pathlib import Path
import os


ROOT_DIR = Path(__file__).resolve().parent.parent
MEMORY_DIR = ROOT_DIR / "memory"
SUMMARY_DIR = ROOT_DIR / "summary"
VECTOR_DIR = SUMMARY_DIR / "vectors"


@dataclass(frozen=True)
class Settings:
    memory_dir: Path = MEMORY_DIR
    summary_dir: Path = SUMMARY_DIR
    vector_dir: Path = VECTOR_DIR
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_local_files_only: bool = True
    llm_model: str = "gpt-4o-mini"
    chunk_size: int = 2200
    chunk_overlap: int = 250
    retrieve_k: int = 5


def load_env_file(path: Path = ROOT_DIR / ".env") -> None:
    """Load simple KEY=VALUE lines from .env without requiring extra packages."""
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def ensure_dirs(settings: Settings) -> None:
    """Create output folders used by summaries and vector indexes."""
    settings.summary_dir.mkdir(parents=True, exist_ok=True)
    settings.vector_dir.mkdir(parents=True, exist_ok=True)
