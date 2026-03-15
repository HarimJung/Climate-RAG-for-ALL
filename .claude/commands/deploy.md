---
description: "Build, commit, and push to production in one command"
argument-hint: "<commit-message> (e.g. 'fix: resolve posters map error')"
allowed-tools:
  - Bash
---

# /deploy

Commit message: `$ARGUMENTS`

## Mission

Verify the build passes, then commit and push all changes to production (main branch on Vercel).

## Steps

### 1. Build verification
- Run `npx next build` to verify the build passes with zero errors
- If the build fails, stop immediately and report the errors -- do not push broken code

### 2. Review changes
- Run `git status` to see all changed, added, and deleted files
- Run `git diff --stat` to show a summary of what changed
- Flag any suspicious files (`.env`, credentials, large binaries) -- do not stage these

### 3. Stage changes
- Run `git add -A` to stage all changes
- Exclude any sensitive files if detected in step 2

### 4. Commit
- Commit with the provided message: `$ARGUMENTS`
- Follow conventional commit format if the message uses it (feat:, fix:, chore:, docs:)

### 5. Push
- Run `git push origin main`
- Wait for push to complete

### 6. Report
- Confirm push succeeded
- List all files that were committed
- Remind: Vercel will auto-deploy from main branch

## Rules

- Never push if the build fails
- Never push sensitive files (.env, .env.local, credentials, API keys)
- Always use the exact commit message provided in $ARGUMENTS
- Only push to main branch (this project uses single-branch workflow)

## Prohibited

- Force pushing (`git push --force`)
- Pushing with `--no-verify`
- Amending previous commits
- Pushing to branches other than main without explicit instruction
