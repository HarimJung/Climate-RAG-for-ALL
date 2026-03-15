---
description: "Diagnose and fix a broken page by running build, reading source, and resolving errors"
argument-hint: "<page-name> (e.g. posters, explore, report, compare)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# /fix-broken-page

Target page: `$ARGUMENTS`

## Mission

Diagnose why a page is broken (build errors, runtime crashes, missing data) and fix all issues so the page builds and renders correctly.

## Steps

### 1. Build check
- Run `npx next build` and capture all errors related to the page
- Save the error output for reference

### 2. Read the page file
- Read `src/app/$ARGUMENTS/page.tsx` (or find the closest match using Glob)
- If a dynamic route, check `src/app/$ARGUMENTS/[iso3]/page.tsx` or similar patterns
- Read the client component if one exists (e.g. `ExploreClient.tsx`, `PostersClient.tsx`, `CountryClient.tsx`)

### 3. Read related components
- Identify all imported components and read any that appear in error messages
- Check `src/components/charts/`, `src/components/sections/`, `src/components/posters/` for related files

### 4. Diagnose issues
Check for these common problems:
- Missing or incorrect imports
- TypeScript type errors (missing props, wrong types)
- Null/undefined data handling (missing optional chaining, no fallback)
- Broken fetch calls (wrong URL, missing error handling, no try-catch)
- Missing `'use client'` directive on client components
- React hydration mismatches
- Missing environment variables or Supabase connection issues
- Components exceeding 400 lines (CLAUDE.md rule)

### 5. Fix all identified issues
- Apply fixes one at a time, explaining each change
- Ensure fixes follow CLAUDE.md rules (white bg, no dark theme, Inter + JetBrains Mono fonts)
- Add error boundaries or fallback UI where appropriate
- Add null checks for data that may be undefined

### 6. Verify fix
- Run `npx next build` again to confirm all errors are resolved
- Report: what was wrong, what was fixed, files modified

## Rules

- Do not change the visual design unless it violates CLAUDE.md
- Do not add new dependencies without confirmation
- Preserve existing functionality -- only fix what is broken
- All fixes must pass TypeScript strict mode
- Add `SafeChart` or error boundary wrappers if a chart component crashes

## Prohibited

- Removing features to "fix" a page -- the feature must still work
- Hardcoding data values -- always fetch from Supabase or JSON
- Adding dark backgrounds or dark theme elements
- Creating new pages or routes that are not in CLAUDE.md
