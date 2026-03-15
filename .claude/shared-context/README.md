# Shared Context

This directory contains shared context files that agents use for cross-agent communication.
Files here persist across sessions and are readable by all agents.

## Usage
- Place data summaries, intermediate results, or coordination files here
- Agents should check this directory before starting work for relevant context
- Clean up stale files after tasks complete
