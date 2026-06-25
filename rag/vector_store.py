from dataclasses import asdict, dataclass
from pathlib import Path
import json

import faiss
import numpy as np


@dataclass(frozen=True)
class ChunkRecord:
    source_file: str
    title: str
    text: str
    kind: str
    chunk_id: int


class FaissStore:
    def __init__(self, index_path: Path, metadata_path: Path) -> None:
        """Keep FAISS vectors and JSON metadata together."""
        self.index_path = index_path
        self.metadata_path = metadata_path
        self.index: faiss.Index | None = None
        self.records: list[ChunkRecord] = []

    def build(self, vectors: np.ndarray, records: list[ChunkRecord]) -> None:
        """Build an inner-product index from already-normalized vectors."""
        if len(records) == 0 or vectors.size == 0:
            raise ValueError("Cannot build a vector store with no records.")

        index = faiss.IndexFlatIP(vectors.shape[1])
        index.add(vectors)
        self.index = index
        self.records = records

    def save(self) -> None:
        """Persist the FAISS index and chunk metadata to disk."""
        if self.index is None:
            raise ValueError("No FAISS index has been built.")

        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(self.index_path))
        data = [asdict(record) for record in self.records]
        self.metadata_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def load(self) -> None:
        """Load the FAISS index and metadata from disk."""
        if not self.index_path.exists() or not self.metadata_path.exists():
            raise FileNotFoundError(f"Missing vector store: {self.index_path}")

        self.index = faiss.read_index(str(self.index_path))
        raw_records = json.loads(self.metadata_path.read_text(encoding="utf-8"))
        self.records = [ChunkRecord(**record) for record in raw_records]

    def search(self, query_vector: np.ndarray, k: int) -> list[tuple[ChunkRecord, float]]:
        """Search the vector store and return records with scores."""
        if self.index is None:
            raise ValueError("Vector store is not loaded.")

        scores, ids = self.index.search(query_vector, k)
        results: list[tuple[ChunkRecord, float]] = []
        for idx, score in zip(ids[0], scores[0]):
            if idx < 0:
                continue
            results.append((self.records[int(idx)], float(score)))
        return results
