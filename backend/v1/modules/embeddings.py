from langchain_huggingface import HuggingFaceEmbeddings
import os

# Initialize Embeddings (miniLM is fast and local)
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={"device": "cuda", "token": os.getenv("HF_TOKEN")}
)