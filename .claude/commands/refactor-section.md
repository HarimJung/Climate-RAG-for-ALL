---
description: "Break a large component into section + chart sub-components"
argument-hint: "<file-path> (e.g. src/app/posters/PostersClient.tsx)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# /refactor-section

Target file: `$ARGUMENTS`

## Mission

Break one large component file into smaller section components following the VisualClimate pattern established in the CountryClient refactor.

## Steps

### 1. Analyze (read-only)
- Read the target file completely
- Count total lines (`wc -l`)
- Identify logical sections (look for section comments like `{/* === SECTION_NAME === */}`)
- Identify inline helper functions (utility functions, sub-components defined in the same file)
- Identify inline chart/SVG components
- List all imports and determine which are used by which section

### 2. Plan the split
- Group code into: **shared helpers**, **chart components**, **section components**, **remaining shell**
- Each extracted file must be < 400 lines (CLAUDE.md rule)
- The remaining shell keeps: imports, types, state, useEffect, derived data, JSX return with section composition
- Print the plan as a table: `| Extracted File | Lines | Contents |`
- Ask for confirmation before proceeding

### 3. Create shared helpers file
- Path: `src/components/sections/shared.tsx` (append if exists)
- Move: ErrorBoundary, SafeChart, utility functions (ordinal, signed, formatters)
- All exports must be named exports

### 4. Create chart component files
- Path: `src/components/charts/<ChartName>.tsx`
- Each chart is self-contained with its own `useState`, `useCallback`
- Move SVG helper functions (niceMax, xTicks) into charts that use them, or into shared if used by 2+
- Add `'use client'` directive at top

### 5. Create section component files
- Path: `src/components/sections/<SectionName>.tsx`
- Props interface: accept all data the section needs + chart components as render props
- Import shared helpers from `./shared`
- Import standalone charts (ClimateGap, NDCGapChart, etc.) directly
- Add `'use client'` directive at top

### 6. Rewrite the shell
- Keep: state declarations, useEffect, derived computations, hero JSX
- Replace inline sections with `<SectionName {...props} />`
- Pass chart components as render props: `EmissionsLineChart={EmissionsLineChart}`
- Remove unused imports

### 7. Verify
- Run `npm run build` -- must pass with zero errors
- Run `wc -l` on the rewritten file -- must be < 400 lines
- Run `wc -l` on each new file -- must be < 400 lines

## Rules

- Preserve exact JSX output -- zero visual changes
- Never modify chart logic, only move it
- Named exports only (no default exports)
- Follow existing import alias convention: `@/components/...`
- TypeScript strict mode -- all props must be typed
- Keep the `'use client'` directive on all client components

## Prohibited

- Changing any CSS classes, colors, or layout
- Adding new features, refactoring logic, or "improving" code
- Creating barrel files (index.ts) -- import directly from each file
- Merging unrelated components into one file
- Removing any existing functionality
- Modifying files in `docs/drafts/` (Antigravity's domain)
