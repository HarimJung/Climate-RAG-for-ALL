---
description: "Run a comprehensive system audit: build, data, pages, code quality, and report results"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# /full-audit

## Mission

Run a comprehensive audit of the entire VisualClimate system and produce a summary report with pass/fail status for each check.

## Steps

### 1. Build check
- Run `npx next build`
- Record: PASS or FAIL
- If FAIL, capture error messages for the report

### 2. Data coverage
- Query Supabase `country_data` for:
  - Total rows (target: 172,121+)
  - Unique countries (target: 250)
  - Unique indicator codes (target: 61)
- Query `countries` table for total count
- Query `indicators` table for total count
- Record: coverage percentage for each metric

### 3. Page health
Check that these routes have valid page files and no obvious errors:
- `/` (Home)
- `/explore` (Explore)
- `/posters` (Posters)
- `/report` or `/country` (Report Card)
- `/compare` (Compare)
- `/methodology` (Methodology)
- `/about` (About)
- `/learn` (Learn)
- For each: confirm the page.tsx file exists and has no syntax errors

### 4. Code quality — TODO/FIXME/HACK
- Search all `src/` files for `TODO`, `FIXME`, `HACK`, `XXX`, `TEMP`
- Count occurrences per file
- List the top 10 files with most markers

### 5. Component size check
- Check all `.tsx` files in `src/` for line count
- Flag any component file over 400 lines (CLAUDE.md rule)
- List: file path, line count, recommended action

### 6. Dead code detection
- Search for unused imports in `src/` files (imports not referenced in the file body)
- Check for exported functions/components not imported anywhere else
- List the top findings

### 7. JSON data validation
- Check all JSON files in `public/data/` are valid JSON (parse without errors)
- Count files in each subdirectory:
  - `public/data/kaya/` (target: 68 files)
  - `public/data/ndc-gap/` (target: 204 files)
  - Other data directories
- Flag any empty or malformed JSON files

### 8. Navigation check
- Verify the navigation component only shows: Home, Explore, Posters (CLAUDE.md rule)
- Check that other pages (Methodology, About, Learn, Insights) are in the footer only

### 9. Design system compliance
- Search for prohibited dark background colors: `bg-slate-900`, `bg-slate-800`, `#0a0a1a`, `#0d1117`
- Search for any `dark:` Tailwind classes (dark theme is prohibited)
- Flag violations

### 10. Generate report
Print a summary table:

```
=== VisualClimate Full Audit Report ===
Date: [today]

| # | Check               | Status | Details                    |
|---|---------------------|--------|----------------------------|
| 1 | Build               | PASS   | 0 errors                   |
| 2 | Data: rows          | PASS   | 172,121 rows               |
| 3 | Data: countries     | PASS   | 250 countries              |
| 4 | Data: indicators    | PASS   | 61 indicators              |
| 5 | Page health         | PASS   | 8/8 routes OK              |
| 6 | Code markers        | WARN   | 12 TODOs, 3 FIXMEs         |
| 7 | Component sizes     | FAIL   | 2 files over 400 lines     |
| 8 | Dead code           | WARN   | 5 unused imports           |
| 9 | JSON data           | PASS   | All valid, 278 files       |
| 10| Navigation          | PASS   | 3 items only               |
| 11| Design compliance   | PASS   | No dark backgrounds found  |

Overall: X/11 PASS, Y WARN, Z FAIL
```

## Rules

- This is a read-only audit -- do not fix any issues, only report them
- All data queries must use real Supabase data, not cached or estimated values
- Report must be factual -- do not editorialize or suggest priorities
- Use exact line counts and file paths

## Prohibited

- Modifying any source files during the audit
- Running destructive commands (delete, reset, clean)
- Making assumptions about data -- query everything directly
- Skipping any of the 10 checks
