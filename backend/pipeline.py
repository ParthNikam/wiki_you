"""
memory_pipeline.py
──────────────────
A coherent pipeline that:
  1. Loads .md files from /memory
  2. Builds / updates a FAISS RAG vectorstore
  3. Generates a wiki (per-entity pages + index) from each file
  4. Exposes add_memory_file() to ingest new files incrementally
  5. Exposes answer() — wiki-first, RAG fallback

Dependencies:
  pip install langchain langchain-community langchain-groq langchain-google-genai
              langchain-huggingface faiss-cpu sentence-transformers python-dotenv pydantic
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Literal, cast

from dotenv import load_dotenv
from pydantic import BaseModel

# ── LangChain ──────────────────────────────────────────────────────────────
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, Runnable
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

# ── Paths ───────────────────────────────────────────────────────────────────
MEMORY_DIR  = Path("memory")
WIKI_DIR    = Path("wiki")
INDEX_PATH  = Path("memory_index")

TYPE_DIRS = {
    "person":  "people",
    "concept": "concepts",
    "event":   "events",
    "project": "projects",
}

# ══════════════════════════════════════════════════════════════════════════════
# 1.  SHARED MODELS / LLMs
# ══════════════════════════════════════════════════════════════════════════════

def _make_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def _make_groq(temperature: float = 0.2) -> ChatGroq:
    return ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=temperature,
        api_key=os.getenv("GROQ_API"), # type: ignore
    )


def _make_gemini(temperature: float = 0.0) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=temperature,
        google_api_key=os.getenv("GOOG_API"),
    )


# ══════════════════════════════════════════════════════════════════════════════
# 2.  RAG VECTORSTORE
# ══════════════════════════════════════════════════════════════════════════════

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=75,
    separators=["\n\n", "\n", ". ", " "],
)


def _load_all_docs() -> list[Document]:
    loader = DirectoryLoader(
        str(MEMORY_DIR),
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8", "autodetect_encoding": True},
        show_progress=True,
        use_multithreading=True,
    )
    return loader.load()


def build_vectorstore(force_rebuild: bool = False) -> FAISS:
    """
    Build (or load) the FAISS index.
    Set force_rebuild=True to re-index everything from scratch.
    """
    embeddings = _make_embeddings()

    if not force_rebuild and (INDEX_PATH / "index.faiss").exists():
        print(f"Loading existing FAISS index from {INDEX_PATH}/")
        return FAISS.load_local(
            str(INDEX_PATH), embeddings, allow_dangerous_deserialization=True
        )

    print("Building FAISS index from scratch…")
    docs   = _load_all_docs()
    chunks = _splitter.split_documents(docs)
    vs     = FAISS.from_documents(chunks, embeddings)
    INDEX_PATH.mkdir(parents=True, exist_ok=True)
    vs.save_local(str(INDEX_PATH))
    print(f"Indexed {vs.index.ntotal} vectors → {INDEX_PATH}/")
    return vs


def _add_docs_to_vectorstore(vs: FAISS, docs: list[Document]) -> FAISS:
    """Incrementally add new documents to an existing vectorstore."""
    chunks = _splitter.split_documents(docs)
    vs.add_documents(chunks)
    vs.save_local(str(INDEX_PATH))
    print(f"Added {len(chunks)} new chunks; total = {vs.index.ntotal}")
    return vs


# ══════════════════════════════════════════════════════════════════════════════
# 3.  WIKI GENERATION
# ══════════════════════════════════════════════════════════════════════════════

class Entity(BaseModel):
    name: str
    type: Literal["person", "concept", "event", "project"]
    slug: str          # kebab-case
    relevance: str     # one sentence


class ExtractionResult(BaseModel):
    entities: list[Entity]


_extraction_prompt = ChatPromptTemplate.from_messages([
    ("system", """Extract every notable entity from this document that warrants its own wiki page.
Only include entities that are substantive — not passing mentions.
For each entity, assign a type: person, concept, event, or project.
The slug must be kebab-case (e.g. 'john-douglas', 'procrastination').
Return the result as a JSON object with an 'entities' key."""),
    ("human", "{document}"),
])

_wiki_page_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a precise wiki author. Write a concise wiki page for the entity below.
Format:
# {name}
**Type**: {type}

## Overview
<2-3 sentence overview>

## Notes
<bullet points of key facts from the source document>

## Source References
<filename(s) where this entity appears>

Keep it factual and grounded in the provided context. Do not invent details."""),
    ("human", "Entity: {name}\nType: {type}\nRelevance: {relevance}\nSource document ({source}):\n{document}"),
])


def _wiki_path(entity: Entity) -> Path:
    return WIKI_DIR / TYPE_DIRS[entity.type] / f"{entity.slug}.md"


def _parse_description(page_path: Path) -> tuple[str, str]:
    text        = page_path.read_text(encoding="utf-8")
    title_match = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    desc_match  = re.search(r"^(?!#)(.{20,})", text, re.MULTILINE)
    title = title_match.group(1) if title_match else page_path.stem
    desc  = desc_match.group(1)[:80] if desc_match else ""
    return title, desc


def rebuild_wiki_index() -> None:
    """Regenerate wiki/index.md from existing pages."""
    sections = {
        "people":   "People",
        "concepts": "Concepts",
        "events":   "Events",
        "projects": "Projects",
    }
    lines = ["# Wiki Index\n"]
    for folder, heading in sections.items():
        folder_path = WIKI_DIR / folder
        if not folder_path.exists():
            continue
        pages = sorted(folder_path.glob("*.md"))
        if not pages:
            continue
        lines.append(f"## {heading}\n")
        for page in pages:
            title, desc = _parse_description(page)
            lines.append(f"- [{title}]({folder}/{page.name}) — {desc}")
        lines.append("")
    WIKI_DIR.mkdir(parents=True, exist_ok=True)
    (WIKI_DIR / "index.md").write_text("\n".join(lines), encoding="utf-8")
    print("Wiki index rebuilt.")


def generate_wiki_for_doc(doc: Document) -> list[Path]:
    """
    Extract entities from a single Document, write a wiki page for each,
    and return the list of created/updated paths.
    """
    groq          = _make_groq()
    # gemini        = _make_gemini()
    structured_llm = groq.with_structured_output(ExtractionResult)
    extraction_chain = _extraction_prompt | structured_llm

    result = cast(ExtractionResult, extraction_chain.invoke({"document": doc.page_content}))
    if not result.entities:
        print(f"  No entities found in {doc.metadata.get('source', '?')}")
        return []

    wiki_writer  = _wiki_page_prompt | groq | StrOutputParser()
    source_name  = Path(doc.metadata.get("source", "unknown")).name
    created: list[Path] = []

    for entity in result.entities:
        page_path = _wiki_path(entity)
        page_path.parent.mkdir(parents=True, exist_ok=True)

        # Append to existing page or create new one
        mode   = "a" if page_path.exists() else "w"
        action = "Updated" if page_path.exists() else "Created"

        content = wiki_writer.invoke({
            "name":     entity.name,
            "type":     entity.type,
            "slug":     entity.slug,
            "relevance": entity.relevance,
            "source":   source_name,
            "document": doc.page_content,
        })

        with page_path.open(mode, encoding="utf-8") as f:
            if mode == "a":
                f.write(f"\n\n---\n*Additional context from {source_name}*\n\n{content}")
            else:
                f.write(content)

        print(f"  {action} wiki page: {page_path}")
        created.append(page_path)

    return created


def build_wiki(docs: list[Document] | None = None) -> None:
    """Generate wiki pages for all memory documents."""
    if docs is None:
        docs = _load_all_docs()
    print(f"Generating wiki for {len(docs)} document(s)…")
    for doc in docs:
        print(f"Processing: {Path(doc.metadata.get('source','?')).name}")
        generate_wiki_for_doc(doc)
    rebuild_wiki_index()


# ══════════════════════════════════════════════════════════════════════════════
# 4.  FULL PIPELINE INIT
# ══════════════════════════════════════════════════════════════════════════════

def init_pipeline(force_rebuild: bool = False) -> FAISS:
    """
    Run the full pipeline:
      - Build / load vectorstore
      - Generate wiki for all memory docs (skipped if wiki/index.md exists and not force_rebuild)
    Returns the FAISS vectorstore.
    """
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    vs = build_vectorstore(force_rebuild=force_rebuild)

    wiki_index = WIKI_DIR / "index.md"
    if force_rebuild or not wiki_index.exists():
        docs = _load_all_docs()
        build_wiki(docs)
    else:
        print("Wiki index already exists — skipping wiki generation. Use force_rebuild=True to regenerate.")

    return vs


# ══════════════════════════════════════════════════════════════════════════════
# 5.  ADD NEW FILE
# ══════════════════════════════════════════════════════════════════════════════

def add_memory_file(file_path: str | Path,vs: FAISS | None = None,) -> FAISS:
    """
    Add a new .md file to the memory system:
      1. Copies it into MEMORY_DIR (if not already there)
      2. Adds its chunks to the FAISS vectorstore
      3. Generates wiki pages for its entities
      4. Rebuilds the wiki index

    Returns the updated vectorstore.
    """
    src = Path(file_path)
    if not src.exists():
        raise FileNotFoundError(src)

    # Copy into memory dir if it's not already there
    dest = MEMORY_DIR / src.name
    if src.resolve() != dest.resolve():
        MEMORY_DIR.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(src.read_bytes())
        print(f"Copied {src.name} → {dest}")
    else:
        print(f"File already in memory dir: {dest}")

    # Load the single document
    loader = TextLoader(str(dest), encoding="utf-8", autodetect_encoding=True)
    new_docs = loader.load()

    # Update vectorstore
    if vs is None:
        embeddings = _make_embeddings()
        if (INDEX_PATH / "index.faiss").exists():
            vs = FAISS.load_local(str(INDEX_PATH), embeddings, allow_dangerous_deserialization=True)
        else:
            vs = FAISS.from_documents(_splitter.split_documents(new_docs), embeddings)
            INDEX_PATH.mkdir(parents=True, exist_ok=True)
            vs.save_local(str(INDEX_PATH))
            # Wiki for this first doc
            for doc in new_docs:
                generate_wiki_for_doc(doc)
            rebuild_wiki_index()
            return vs

    vs = _add_docs_to_vectorstore(vs, new_docs)

    # Update wiki
    for doc in new_docs:
        generate_wiki_for_doc(doc)
    rebuild_wiki_index()

    return vs


# ══════════════════════════════════════════════════════════════════════════════
# 6.  QUESTION ANSWERING  (wiki-first, RAG fallback)
# ══════════════════════════════════════════════════════════════════════════════

_WIKI_QA_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful assistant with access to a personal wiki.
Answer the question using only the provided wiki content.
If the wiki content is insufficient or doesn't contain the answer, reply EXACTLY with:
INSUFFICIENT_CONTEXT

Wiki content:
{wiki_context}"""),
    ("human", "{question}"),
])

_RAG_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a personal assistant with access to the user's private notes and journal entries.
Answer the question using only the provided context. Be specific and reference source documents where relevant.
If the context doesn't contain enough information, say so.

Context:
{context}"""),
    ("human", "{question}"),
])


def _search_wiki(question: str, top_k: int = 5) -> str:
    """Search wiki pages for text relevant to the question (simple keyword scan)."""
    question_lower = question.lower()
    keywords = set(re.findall(r"\b\w{4,}\b", question_lower))

    hits: list[tuple[int, str, str]] = []  # (score, rel_path, snippet)
    for page in WIKI_DIR.rglob("*.md"):
        if page.name == "index.md":
            continue
        text  = page.read_text(encoding="utf-8")
        score = sum(1 for kw in keywords if kw in text.lower())
        if score > 0:
            rel = str(page.relative_to(WIKI_DIR))
            hits.append((score, rel, text[:1500]))  # cap snippet

    hits.sort(key=lambda x: -x[0])
    if not hits:
        return ""
    return "\n\n---\n".join(
        f"[{rel}]\n{snippet}" for _, rel, snippet in hits[:top_k]
    )


def _build_rag_chain(vs: FAISS) -> object:
    retriever = vs.as_retriever(search_type="similarity", search_kwargs={"k": 5})
    llm       = _make_groq(temperature=0.2)

    def format_docs(docs: list[Document]) -> str:
        return "".join(
            f"[{Path(d.metadata['source']).name}]\n{d.page_content}\n\n"
            for d in docs
        )

    return (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | _RAG_PROMPT
        | llm
        | StrOutputParser()
    )


def answer(question: str, vs: FAISS | None = None) -> str:
    """
    Answer a question:
      1. Search the wiki for relevant pages.
      2. Ask the LLM to answer from wiki content.
      3. If the LLM says INSUFFICIENT_CONTEXT, fall back to RAG.
    """
    llm = _make_groq(temperature=0.2)

    # ── Step 1: Wiki lookup ──────────────────────────────────────────────────
    wiki_context = _search_wiki(question)

    if wiki_context:
        wiki_chain    = _WIKI_QA_PROMPT | llm | StrOutputParser()
        wiki_response = wiki_chain.invoke({
            "wiki_context": wiki_context,
            "question":     question,
        })
        if "INSUFFICIENT_CONTEXT" not in wiki_response:
            print("[source: wiki]")
            return wiki_response
        print("[wiki: insufficient → falling back to RAG]")
    else:
        print("[wiki: no relevant pages found → falling back to RAG]")

    # ── Step 2: RAG fallback ─────────────────────────────────────────────────
    if vs is None:
        embeddings = _make_embeddings()
        vs = FAISS.load_local(str(INDEX_PATH), embeddings, allow_dangerous_deserialization=True)

    rag_chain = _build_rag_chain(vs)
    print("[source: RAG]")
    return rag_chain.invoke(question) 


# ══════════════════════════════════════════════════════════════════════════════
# 7.  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # ── Full initialisation ──────────────────────────────────────────────────
    vs = init_pipeline(force_rebuild=False)

    # ── Example: add a new file on the fly ───────────────────────────────────
    # vs = add_memory_file("path/to/new_note.md", vs=vs)

    # ── Example: ask a question ──────────────────────────────────────────────
    questions = [
        # "Describe my personality based on everything you know about me.",
        # "What projects am I currently working on?",
        "Who is Nick?",
    ]
    for q in questions:
        print(f"\nQ: {q}")
        print(f"A: {answer(q, vs=vs)}")