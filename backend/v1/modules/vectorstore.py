import os
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from .config import DB_DIR, MEMORY_DIR
from .embeddings import embeddings
from .wiki import create_wiki_page

def get_vectorstore():
    """
    Checks if the vectorstore exists.
    If yes, loads it. If no, creates it from scratch.
    """
    if os.path.exists(DB_DIR):
        print("--- Loading existing FAISS index from disk ---")
        return FAISS.load_local(DB_DIR, embeddings, allow_dangerous_deserialization=True)
    else:
        print("--- No index found. Initializing new vectorstore ---")
        return initialize_database()

def initialize_database():
    """Initial process for first-time setup."""
    loader = DirectoryLoader(
        str(MEMORY_DIR),
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={
            "encoding": "utf-8",
            "autodetect_encoding": True
        }
    )

    try:
        docs = loader.load()
    except Exception as e:
        print(f"Error during loading: {e}")
        return None

    # 1. Create Wikis
    for doc in docs:
        create_wiki_page(doc)

    # 2. Create FAISS
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)
    vectorstore = FAISS.from_documents(chunks, embeddings)
    vectorstore.save_local(DB_DIR)
    return vectorstore

def add_new_document(content: str, filename: str):
    """Adds a new document content to the existing vectorstore without rebuilding."""
    vectorstore = get_vectorstore()

    # Create document
    new_doc = Document(page_content=content, metadata={"source": filename})

    # Create wiki
    create_wiki_page(new_doc)

    # Add to FAISS and overwrite the local save
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    new_chunks = splitter.split_documents([new_doc])
    vectorstore.add_documents(new_chunks)
    vectorstore.save_local(DB_DIR)
    print(f"Successfully added {filename} to persistence.")