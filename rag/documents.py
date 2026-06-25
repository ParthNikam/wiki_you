from dataclasses import dataclass
from pathlib import Path
import re


@dataclass(frozen=True)
class Document:
    path: Path
    title: str
    text: str


def list_markdown_files(folder: Path) -> list[Path]:
    """Return markdown files in a stable order, skipping generated indexes."""
    return sorted(
        path
        for path in folder.glob("*.md")
        if path.is_file() and path.name.lower() != "index.md"
    )


def read_document(path: Path) -> Document:
    """Read one markdown file as a Document."""
    text = path.read_text(encoding="utf-8", errors="replace").strip()
    return Document(path=path, title=path.stem, text=text)


def safe_summary_name(source_path: Path) -> str:
    """Convert a source file path into a safe summary filename."""
    name = re.sub(r"[^\w\- .()]", "_", source_path.stem).strip()
    return f"{name}.summary.md"


def summary_path_for(source_path: Path, summary_dir: Path) -> Path:
    """Build the summary path for a source markdown file."""
    return summary_dir / safe_summary_name(source_path)


def write_text(path: Path, text: str) -> None:
    """Write UTF-8 text, creating parent folders first."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.strip() + "\n", encoding="utf-8")
