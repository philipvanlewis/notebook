---
description: Create GitHub Pull Request with proper description
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git diff:*), Bash(git push:*), Bash(gh pr create:*), Bash(gh pr view:*)
---

# Create Pull Request

Create a GitHub Pull Request with a well-structured description.

Current branch: !`git branch --show-current`

## Steps

1. Check current branch status:
   - Ensure we're not on main/master
   - Check for uncommitted changes
   - Verify branch is pushed to remote

2. Gather information for the PR:
   - Review commits on this branch: `git log main..HEAD --oneline`
   - Review the diff: `git diff main...HEAD --stat`

3. Draft PR description with:
   - **Title**: Concise summary of changes
   - **Summary**: What this PR does and why
   - **Changes**: Bullet list of key changes
   - **Testing**: How to test the changes
   - **Screenshots**: If UI changes (ask me to provide)

4. Show me the proposed PR and ask for confirmation

5. Create the PR using GitHub CLI:
   ```bash
   gh pr create --title "<title>" --body "<body>"
   ```

6. Return the PR URL
