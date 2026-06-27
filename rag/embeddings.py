from typing import Any


class Embedder:
    def __init__(self, model_name: str, local_files_only: bool = True) -> None:
        """Load the Hugging Face embedding model once for reuse."""
        from transformers import AutoModel, AutoTokenizer

        self.tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            local_files_only=local_files_only,
        )
        self.model = AutoModel.from_pretrained(
            model_name,
            local_files_only=local_files_only,
        )
        self.model.eval()

    def embed(self, texts: list[str]) -> Any:
        """Embed text and normalize vectors for cosine-like FAISS search."""
        import numpy as np
        import torch
        import torch.nn.functional as F

        if not texts:
            return np.empty((0, 0), dtype="float32")

        encoded = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            return_tensors="pt",
        )
        with torch.no_grad():
            output = self.model(**encoded)

        mask = encoded["attention_mask"].unsqueeze(-1)
        summed = (output.last_hidden_state * mask).sum(dim=1)
        counts = mask.sum(dim=1).clamp(min=1)
        vectors = F.normalize(summed / counts, p=2, dim=1)
        return vectors.cpu().numpy().astype("float32")
