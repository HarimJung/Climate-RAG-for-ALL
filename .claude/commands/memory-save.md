---
description: "Save current session insights, completed work, and patterns to MEMORY.md"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# /memory-save

## Mission

Capture everything learned and accomplished in the current session and persist it to the project memory file so future sessions have full context.

## Steps

### 1. Read current memory
- Read `~/.claude/projects/-Users-harimgemmajung-Documents-visualclimate/memory/MEMORY.md`
- Note the current structure and last update date

### 2. Gather session insights
Collect from this conversation:

**Completed Work**
- What features were built or enhanced
- What bugs were fixed (with commit hashes if available)
- What files were created or modified

**Patterns Discovered**
- New coding patterns or conventions established
- Data flow patterns identified
- Workarounds for specific issues

**Bugs & Resolutions**
- What errors were encountered
- Root causes identified
- How they were resolved

**Architecture Changes**
- New files or components added
- Files deleted or merged
- Import structure changes

**Data Updates**
- New countries or indicators added
- ETL scripts run and their results
- Data coverage changes

### 3. Update MEMORY.md
- Update the `Last Updated` date to today
- Update `Project Stats` (run `git rev-list --count HEAD` for commit count, check build status)
- Add new entries to `Completed Work` section (most recent first, with commit hashes)
- Add any new entries to `Known Issues / Tech Debt`
- Update `Next Tasks` based on what was completed
- Add new entries to `Patterns & Gotchas` if any were discovered
- Update file line counts if major files changed (run `wc -l`)

### 4. Verify
- Read the updated MEMORY.md to confirm it is well-formatted
- Ensure no duplicate entries were added
- Confirm the file is valid markdown

### 5. Report
- Summarize what was saved: X completed items, Y new patterns, Z known issues updated

## Rules

- Preserve all existing memory entries -- only append or update, never delete
- Use the same formatting conventions as the existing file
- Commit hashes must be real (from `git log`), never fabricated
- Keep entries concise -- one line per item where possible
- Date format: YYYY-MM-DD

## Prohibited

- Deleting or overwriting existing memory entries
- Adding speculative or planned work as "completed"
- Fabricating commit hashes or build statuses
- Changing the file structure or section names
