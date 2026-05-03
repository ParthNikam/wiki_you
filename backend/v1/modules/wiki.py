from pathlib import Path
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
import os
from .config import WIKI_DIR

def create_wiki_page(doc):
    """Generates and saves a wiki file if it doesn't already exist."""
    file_name = Path(doc.metadata['source']).stem
    wiki_path = WIKI_DIR / f"{file_name}.md"

    if wiki_path.exists():
        return  # Skip if already exists

    print(f"Generating wiki for: {file_name}")
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.2,
        api_key=os.getenv("GROQ_API"),
    )
    prompt = ChatPromptTemplate.from_template("Summarize this document into a wiki page, it should have a title, overview, notes, and reference: {text}")
    chain = prompt | llm | StrOutputParser()
    summary = chain.invoke({"text": doc.page_content[:10000]})

    wiki_path.write_text(summary, encoding="utf-8")