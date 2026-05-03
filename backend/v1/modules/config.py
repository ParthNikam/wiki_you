import os
from pathlib import Path

# --- Paths & Global Config ---
DB_DIR = "faiss_index"
WIKI_DIR = Path("gemini_wiki")
MEMORY_DIR = Path("md_files")
WIKI_DIR.mkdir(exist_ok=True)