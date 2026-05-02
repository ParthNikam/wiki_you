import os
from dotenv import load_dotenv
from pathlib import Path
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq


load_dotenv()

# --- Paths & Global Config ---
DB_DIR = "faiss_index"
WIKI_DIR = Path("wiki_store")
MEMORY_DIR = Path("memory")
WIKI_DIR.mkdir(exist_ok=True)

# Initialize Embeddings (miniLM is fast and local)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


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
    
    # 1. Create Wikis (Gemini)
    for doc in docs:
        create_wiki_page(doc)
        
    # 2. Create FAISS
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)
    vectorstore = FAISS.from_documents(chunks, embeddings)
    vectorstore.save_local(DB_DIR)
    return vectorstore

def create_wiki_page(doc):
    """Generates and saves a wiki file if it doesn't already exist."""
    file_name = Path(doc.metadata['source']).stem
    wiki_path = WIKI_DIR / f"{file_name}.md"
    
    if wiki_path.exists():
        return # Skip if already exists
    
    print(f"Generating wiki for: {file_name}")
    # Use your gemini_llm here
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.2,
        api_key=os.getenv("GROQ_API"), # type: ignore
    )
    prompt = ChatPromptTemplate.from_template("Summarize this document into a wiki page, it should have a title, overview, notes, and reference: {text}")
    chain = prompt | llm | StrOutputParser()
    summary = chain.invoke({"text": doc.page_content[:10000]})
    
    wiki_path.write_text(summary, encoding="utf-8")

def add_new_document(file_path):
    """Adds a new file to the existing vectorstore without rebuilding."""
    vectorstore = get_vectorstore()
    loader = TextLoader(file_path)
    new_doc = loader.load()[0]
    
    # Create wiki
    create_wiki_page(new_doc)
    
    # Add to FAISS and overwrite the local save
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    new_chunks = splitter.split_documents([new_doc])
    vectorstore.add_documents(new_chunks)
    vectorstore.save_local(DB_DIR)
    print(f"Successfully added {file_path} to persistence.")

def smart_query(question):
    """The main entry point for asking questions."""
    vectorstore = get_vectorstore()
    
    # Check Wikis first (Context Window approach)
    wiki_files = list(WIKI_DIR.glob("*.md"))
    wiki_combined = "\n".join([f.read_text(encoding="utf-8") for f in wiki_files[:10]]) # Limit to avoid token overflow
    
    router_prompt = ChatPromptTemplate.from_template(
        "Based on these Wiki summaries, answer the question. If you can't, say 'NOT_IN_WIKI'.\n\nWiki:\n{context}\n\nQ: {question}"
    )
    
    # Use Groq for speed
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.2,
        api_key=os.getenv("GROQ_API"), # type: ignore
    )
    response = (router_prompt | llm | StrOutputParser()).invoke({
        "context": wiki_combined,
        "question": question
    })
    
    if "NOT_IN_WIKI" in response:
        print("Falling back to RAG...")
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
        rag_prompt = ChatPromptTemplate.from_template("Answer based on these snippets:\n{context}\n\nQ: {question}")
        rag_chain = ({"context": retriever, "question": lambda x: x} | rag_prompt | llm | StrOutputParser())
        return rag_chain.invoke(question)
    
    return response

# --- Usage Example ---
# On first run, it builds. On second run, it's instant.
# answer = smart_query("What are my core personality traits?")
# print(answer)

initialize_database()
