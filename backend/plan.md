Technical Plan: Karpathy LLM Wiki on top of your RAG pipeline
The Core Shift
Your current system: raw .md → chunk → FAISS → retrieve chunks → LLM answers

Karpathy's pattern: raw .md (immutable) → LLM synthesizes → wiki/*.md pages → FAISS on wiki → answer

The wiki is a compounding artifact. Every ingested note enriches structured entity/concept pages. Retrieval hits synthesis, not raw chunks. The LLM does the tedious bookkeeping (cross-references, contradiction detection) that humans hate.

Phase 1 — Wiki Directory Structure
Create wiki/ alongside memory/. Define three page types in a wiki/schema.md conventions doc:


wiki/
  schema.md          ← conventions (page types, frontmatter, link syntax)
  index.md           ← catalog organized by category (auto-maintained)
  log.md             ← append-only chronological ingest record
  people/            ← entity pages for people (Mahi, teammates, etc.)
  concepts/          ← recurring themes (procrastination, ego, authenticity)
  events/            ← dated events synthesized from journal entries
  projects/          ← project pages (OakHackfest, drone work, etc.)
Each wiki page gets frontmatter:


---
type: concept | entity | event | project
aliases: [...]
last_updated: YYYY-MM-DD
sources: [memory/file.md, ...]
---
Why this matters for your notes: You already have natural entities — people like Mahi, projects like the swarm algorithm, themes like procrastination. The wiki gives them persistent, cross-linked homes instead of living buried in individual journal files.

Phase 2 — Ingest Pipeline (the main new piece)
This is a multi-step LLM chain that runs whenever a new memory/*.md is added:

Step 1 — Extract: LLM reads the raw source and emits a structured list of affected entities/concepts + key facts.

Step 2 — Gather: Load existing wiki pages for each extracted entity (if they exist).

Step 3 — Synthesize: LLM receives (raw source, existing wiki pages) and returns updated page content for each affected wiki file. A single journal entry typically touches 5–10 pages.

Step 4 — Write + Log: Persist the updated pages, update wiki/index.md categories, append a one-liner to wiki/log.md with a [INGEST] prefix and timestamp.

Key prompt design decision: give the LLM the existing wiki page so it patches rather than overwrites — this is what makes knowledge compound rather than reset.


# rough chain structure (using your existing LangChain setup)
ingest_chain = (
    extract_entities_prompt | gemini_llm  # gemini-2.5-flash, better for synthesis
    | gather_existing_wiki_pages          # file reads
    | synthesize_wiki_pages_prompt | gemini_llm
    | write_wiki_pages                    # file writes + index/log update
)
Use Gemini 2.5 Flash (which you already have) for ingest — it has a large context window which matters when loading multiple existing wiki pages simultaneously.

Phase 3 — Replace FAISS Target
Rebuild the FAISS index on wiki/*.md instead of memory/*.md. Wiki pages are already synthesized summaries, so:

Fewer, denser chunks (less noise)
Cross-references in page content give retrieval implicit context
Retrieval scores improve because pages are written to be informative, not diary-stream
Keep the old memory/-based index available as a fallback for verbatim quote lookups (e.g., "what did I write exactly on Oct 31 2022").

Phase 4 — Query Pipeline Enhancement
Minimal change to your existing chain — just swap the retriever source to wiki pages. One addition: a "save good answers" gate.

When an answer synthesizes something non-obvious (e.g., "across 6 entries, your pattern with ego conflicts always precedes a productivity spike"), optionally write that synthesis as a new wiki page under wiki/insights/. This is the compounding loop — queries enrich the wiki, which improves future queries.

Phase 5 — Lint Pipeline
A periodic sweep (run manually or on a schedule) that:

Orphan detection: Scan all wiki pages for [[links]] or source references, flag any that point to missing files.
Contradiction check: LLM reads pairs of related pages and flags factual inconsistencies (e.g., two event pages claim different dates for the same thing).
Staleness check: Pages whose sources frontmatter points to a memory/ file that has since been modified.
Output appends to wiki/log.md with [LINT] prefix.

Phase 6 — FastAPI Backend
Expose the pipeline to your existing Next.js frontend (you already have a dashboard):

Endpoint	Description
POST /ingest	Body: {filename} or {content} — triggers ingest pipeline for one file
POST /ingest/all	Runs ingest across all memory/*.md not yet in log.md
POST /query	Body: {question} — returns answer + source wiki pages
GET /wiki	Lists all wiki pages with metadata
GET /wiki/{path}	Returns raw content of a wiki page
POST /lint	Triggers lint sweep, returns report
Implementation Order
wiki/schema.md + directory structure — 30 min, no code
Ingest chain (Phase 2) — the hardest part, core LLM prompt engineering
Rebuild FAISS on wiki (Phase 3) — trivial change to existing code
FastAPI wrapper (Phase 6) — connect to your Next.js dashboard
Query enhancement / insight saving (Phase 4) — optional
Lint pipeline (Phase 5) — lowest urgency, run periodically
The ingest pipeline is where 80% of the interesting work lives. Get the prompts right there — everything else is plumbing.