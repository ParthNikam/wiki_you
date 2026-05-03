from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
import os
from .config import WIKI_DIR
from .vectorstore import get_vectorstore

def smart_query(question):
    """The main entry point for asking questions."""
    vectorstore = get_vectorstore()

    # Check Wikis first (Context Window approach)
    wiki_files = list(WIKI_DIR.glob("*.md"))
    wiki_combined = "\n".join([f.read_text(encoding="utf-8") for f in wiki_files[:10]])  # Limit to avoid token overflow

    router_prompt = ChatPromptTemplate.from_template(
        "Based on these Wiki summaries, answer the question. If you can't, say 'NOT_IN_WIKI'.\n\nWiki:\n{context}\n\nQ: {question}"
    )

    # Use Groq for speed
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.2,
        api_key=os.getenv("GROQ_API"),
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