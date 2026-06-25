# RAG Personal Notes Summarizer

This repository is a Python-based personal note summarization and retrieval assistant. It reads markdown files from `memory/`, summarizes them into `summary/`, builds FAISS vector indexes, and provides a CLI chat interface over the stored notes.

## Project Overview

- `memory/` contains the source markdown notes.
- `summary/` is the generated summary output folder.
- `rag/` contains the application package:
  - `chat.py` - CLI chat interface and retrieval flow
  - `summarizer.py` - summarization workflow and index building
  - `config.py` - settings, path configuration, and environment helper
  - `documents.py` - markdown loading, summary path generation, and file utilities
  - `chunking.py` - chunking logic for long text inputs
  - `embeddings.py` - Hugging Face embedding wrapper
  - `vector_store.py` - FAISS vector store creation, persistence, and search
  - `llm.py` - OpenAI LLM client wrapper
- `main.py` runs the chat experience.
- `summarize.py` is reserved as a project entry point for summarization workflows.
- `AGENTS.md` captures architecture notes, tech stack, and project map.

## Key Features

- Summarize long personal notes by chunking text and using an LLM.
- Build a retrieval index for both summarized notes and original memory notes.
- Query notes through a simple command-line chat interface.
- Keep the retrieval prompt grounded in source context and cite note filenames.

## Installation

1. Create or activate a Python virtual environment.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install the required Python packages.

```powershell
pip install openai sentence-transformers faiss-cpu
```

3. Set your OpenAI credentials.

```powershell
$env:OPENAI_API_KEY="your_api_key"
```

Optionally, add the key to a `.env` file at the repository root:

```text
OPENAI_API_KEY=your_api_key
```

## Usage

### Run the chat interface

```powershell
python main.py
```

Then type questions about your notes. Enter `exit` or `quit` to stop.

### Summarization workflow

The summarization and indexing work is implemented in `rag/summarizer.py`. It:

- reads markdown files from `memory/`
- chunks long note text with paragraph-aware overlap
- summarizes each chunk with the LLM
- merges chunk summaries into structured markdown notes
- builds FAISS vector indexes for both summaries and original notes

> Note: `summarize.py` currently exists as a placeholder entry point in the repository root.

## Configuration

The project uses `rag.config.Settings` with defaults:

- `memory_dir`: `memory/`
- `summary_dir`: `summary/`
- `vector_dir`: `summary/vectors/`
- `embedding_model`: `BAAI/bge-small-en-v1.5`
- `llm_model`: `gpt-4o-mini`
- `chunk_size`: `2200`
- `chunk_overlap`: `250`
- `retrieve_k`: `5`

Adjust these values in code or extend `Settings` for runtime configuration.

## Project Structure

```text
RAG/
├── AGENTS.md
├── main.py
├── README.md
├── summarize.py
├── memory/
│   └── ... personal markdown notes ...
├── summary/
│   └── ... generated summaries and indexes ...
└── rag/
    ├── chat.py
    ├── chunking.py
    ├── config.py
    ├── documents.py
    ├── embeddings.py
    ├── llm.py
    ├── summarizer.py
    └── vector_store.py
```

## Notes

- Summaries are generated in a structured markdown format with headings for people, events, actions, ideas, and a summary block.
- The chat interface retrieves context from summaries first, then falls back to original memory notes if needed.
- The project is designed to be modular and easy to extend with additional LLM or vector store backends.

## License

This project does not specify a license file. Add one if you plan to share or reuse the code publicly.
