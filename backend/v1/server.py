from fastapi import FastAPI
from pydantic import BaseModel
from contextlib import asynccontextmanager
from v1.modules.vectorstore import get_vectorstore
from v1.modules.query import smart_query
from v1.modules.vectorstore import add_new_document
import os
from dotenv import load_dotenv

load_dotenv()

# Global variable for vectorstore
vectorstore = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global vectorstore
    # Load the vectorstore on startup
    vectorstore = get_vectorstore()
    yield
    # Cleanup if needed

app = FastAPI(lifespan=lifespan)

class QueryRequest(BaseModel):
    question: str

class AddDocumentRequest(BaseModel):
    content: str
    filename: str  # e.g., "new_doc.md"

@app.get('/')
def root():
    return {"message": "Wiki Pipeline Server"}

@app.post('/query')
def query(request: QueryRequest):
    answer = smart_query(request.question)
    return {"answer": answer}

@app.post('/add_document')
def add_doc(request: AddDocumentRequest):
    add_new_document(request.content, request.filename)
    return {"message": f"Document {request.filename} added successfully"}



# Keep existing endpoints if needed
class Item(BaseModel):
    name: str
    price: float

@app.get('/greet')
def greet(name: str):
    return {"message": f"Hello {name}"}

@app.post('/items')
def create_item(item: Item):
    return {"recieved": item}


