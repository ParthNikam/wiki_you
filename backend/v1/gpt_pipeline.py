import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


load_dotenv()


MEMORY_DIR = Path("./md_files")
WIKI_DIR = Path("./gpt_wiki")
INDEX_DIR = Path("./memory_index")

WIKI_DIR.mkdir(parents=True, exist_ok=True)


embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={"device": "cuda"},
)

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=75,
)


def _get_llm() -> ChatGroq:
    return ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.2,
        api_key=os.getenv("GROQ_API"),  # type: ignore[arg-type]
    )


def _load_memory_docs() -> list[Document]:
    loader = DirectoryLoader(
        str(MEMORY_DIR),
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8", "autodetect_encoding": True},
        show_progress=True,
        use_multithreading=True,
    )
    return loader.load()


def get_vectorstore(embeddings_model: HuggingFaceEmbeddings, docs: list[Document] | None = None) -> FAISS:
    if (INDEX_DIR / "index.faiss").exists():
        print("Loading existing FAISS index...")
        return FAISS.load_local(
            str(INDEX_DIR),
            embeddings_model,
            allow_dangerous_deserialization=True,
        )

    if docs is None:
        raise ValueError("No index found and no documents provided to build one.")

    print("Building FAISS index (first time)...")
    chunks = _splitter.split_documents(docs)
    vs = FAISS.from_documents(chunks, embeddings_model)
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    vs.save_local(str(INDEX_DIR))
    return vs


def add_to_vectorstore(new_docs: list[Document], embeddings_model: HuggingFaceEmbeddings) -> FAISS:
    vs = get_vectorstore(embeddings_model, docs=[])
    chunks = _splitter.split_documents(new_docs)
    vs.add_documents(chunks)
    vs.save_local(str(INDEX_DIR))
    return vs


def load_or_create_vectorstore(embeddings_model: HuggingFaceEmbeddings) -> FAISS | None:
    if (INDEX_DIR / "index.faiss").exists():
        return FAISS.load_local(
            str(INDEX_DIR),
            embeddings_model,
            allow_dangerous_deserialization=True,
        )
    return None


def wiki_path(doc: Document) -> Path:
    source = Path(doc.metadata.get("source", "unknown"))
    return WIKI_DIR / f"{source.stem}.md"


def rebuild_index(wiki_dir: Path = WIKI_DIR) -> Path:
    wiki_dir.mkdir(parents=True, exist_ok=True)
    pages = sorted(page for page in wiki_dir.glob("*.md") if page.name != "index.md")

    lines = ["# Wiki Index", ""]
    for page in pages:
        title = page.stem.replace("-", " ").replace("_", " ").title()
        lines.append(f"- [{title}]({page.name})")

    index_path = wiki_dir / "index.md"
    index_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return index_path


def _build_wiki_content(doc: Document) -> str:
    source_name = Path(doc.metadata.get("source", "unknown")).name
    prompt = ChatPromptTemplate.from_template(
        "Summarize this markdown note into a wiki page with sections for "
        "Title, Overview, Notes, and Source.\n\nDocument:\n{text}"
    )

    try:
        chain = prompt | _get_llm() | StrOutputParser()
        return chain.invoke({"text": doc.page_content[:10000]})
    except Exception:
        excerpt = doc.page_content[:1200].strip()
        return (
            f"# {Path(source_name).stem}\n\n"
            "## Overview\n"
            "Auto-generated fallback summary.\n\n"
            "## Notes\n"
            f"{excerpt}\n\n"
            "## Source\n"
            f"{source_name}\n"
        )


def generate_wiki_pages(docs: list[Document]) -> list[Path]:
    created_paths: list[Path] = []

    for doc in docs:
        path = wiki_path(doc)
        path.parent.mkdir(parents=True, exist_ok=True)

        content = _build_wiki_content(doc)
        path.write_text(content, encoding="utf-8")
        created_paths.append(path)
        print(f"created wiki for {path}")

    rebuild_index(WIKI_DIR)
    return created_paths


def add_documents(file_paths: list[str], embeddings_model: HuggingFaceEmbeddings = embeddings) -> list[Document]:
    docs: list[Document] = []

    for path in file_paths:
        loader = TextLoader(path, encoding="utf-8", autodetect_encoding=True)
        docs.extend(loader.load())

    if not docs:
        return []

    vs = load_or_create_vectorstore(embeddings_model)
    chunks = _splitter.split_documents(docs)

    if vs is not None:
        vs.add_documents(chunks)
    else:
        vs = FAISS.from_documents(chunks, embeddings_model)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    vs.save_local(str(INDEX_DIR))
    generate_wiki_pages(docs)
    return docs


def initialize_database() -> FAISS | None:
    if not MEMORY_DIR.exists():
        return None

    docs = _load_memory_docs()
    if not docs:
        return None

    generate_wiki_pages(docs)
    return get_vectorstore(embeddings, docs=docs)


vectorstore = load_or_create_vectorstore(embeddings)


def ask(query: str) -> str:
    vs = load_or_create_vectorstore(embeddings)
    if vs is None:
        vs = initialize_database()

    if vs is None:
        raise ValueError("No documents available to answer questions from.")

    retriever = vs.as_retriever(search_kwargs={"k": 5})
    docs = retriever.invoke(query)
    context = "\n\n".join(d.page_content for d in docs)

    response = _get_llm().invoke(
        f"Answer using only the context below.\n\n{context}\n\nQuestion: {query}"
    )
    return response.content


if __name__ == "__main__":
    # initialize_database()
    answer = ask("who was the girl I really liked?")
    print(answer)


