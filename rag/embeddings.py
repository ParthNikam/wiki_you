from typing import Any


class Embedder:
    def __init__(self, model_name: str) -> None:
        """Load the Hugging Face embedding model once for reuse."""
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(model_name)

    def embed(self, texts: list[str]) -> Any:
        """Embed text and normalize vectors for cosine-like FAISS search."""
        import numpy as np

        if not texts:
            return np.empty((0, 0), dtype="float32")

        vectors = self.model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return vectors.astype("float32")
