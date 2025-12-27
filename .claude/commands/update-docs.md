---
description: Update all automated documentation based on recent changes
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git log:*), Bash(git diff:*)
---

# Update All Documentation

Update all automated documentation based on recent changes.

Current git status: !`git log --oneline -5`

## Steps

1. Read the current state of:
   - @CLAUDE.md
   - @docs/architecture.md
   - @docs/project-status.md
   - @docs/changelog.md

2. Review recent git commits since last documentation update

3. Scan the codebase for structural changes:
   - New files/directories
   - New dependencies in package.json/requirements.txt/etc
   - New API endpoints or routes
   - Database schema changes

4. Update each document:
   - **architecture.md**: Add any new components, update diagrams
   - **project-status.md**: Update progress, accomplishments, where we left off
   - **changelog.md**: Add entries for unreleased changes if not already there
   - **CLAUDE.md**: Update key files table if structure changed

5. Set "Last updated" timestamps to today's date

6. Commit changes with message: "docs: Update automated documentation"

7. Summarize what was updated
