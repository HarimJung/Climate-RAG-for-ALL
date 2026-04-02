# Backend Preservation Skill

## Purpose
Protect existing backend functionality during frontend redesign.

## Rules
- Do not change Supabase schema
- Do not rewrite API contracts unless absolutely necessary
- Do not rewrite scoring logic
- Do not remove existing agent/skill infrastructure
- Do not break current routes
- Do not modify data seeding behavior unless explicitly requested
- Do not remove poster generation or report generation logic
- Do not change RAG ingestion logic unless explicitly requested

## Preferred Strategy
- replace page layout before touching logic
- preserve data-fetching contracts
- use adapter functions if UI needs reshaped data
- refactor components before refactoring backend
- keep route structure stable

## If unsure
Prefer preserving current implementation and improving only:
- layout
- hierarchy
- copy
- styling
- component composition