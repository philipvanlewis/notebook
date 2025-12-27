---
description: Create conventional commit with proper formatting
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*)
model: claude-3-5-haiku-20241022
---

# Smart Commit

Create a conventional commit with proper formatting.

Current changes: !`git status --short`

## Steps

1. Review `git status` and `git diff --staged` to see changes

2. Analyze the changes and determine:
   - Type: feat, fix, docs, style, refactor, test, chore
   - Scope: The area of code affected (optional)
   - Description: What the change does

3. Format commit message following Conventional Commits:
   ```
   <type>(<scope>): <description>

   [optional body]

   [optional footer]
   ```

4. Show me the proposed commit message and ask for confirmation

5. If confirmed, execute the commit

6. Ask if I want to push to remote
