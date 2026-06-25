def chunk_text(text: str, chunk_size: int = 2200, overlap: int = 250) -> list[str]:
    """Split text into overlapping chunks with paragraph-aware boundaries."""
    clean = text.strip()
    if not clean:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(clean):
        end = min(start + chunk_size, len(clean))
        if end < len(clean):
            boundary = clean.rfind("\n\n", start, end)
            if boundary > start + chunk_size // 2:
                end = boundary

        chunk = clean[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= len(clean):
            break
        start = max(0, end - overlap)

    return chunks
