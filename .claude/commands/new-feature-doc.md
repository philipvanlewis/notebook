---
description: Create documentation for a new or existing feature
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Document a Feature

Create or update documentation for a feature in @docs/features/.

## Steps

1. Ask me:
   - What feature should I document?
   - Is this a new feature or updating existing docs?
   - Who is the target audience? (users, developers, both)

2. If new feature, create `docs/features/<feature-name>.md` with this template:

```markdown
# Feature: <Feature Name>

## Overview
Brief description of what this feature does.

## Usage

### Basic Example
```code
// Example usage
```

### Configuration Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|

## How It Works
Technical explanation of the implementation.

## Related Features
- Link to related features

## Changelog
- YYYY-MM-DD: Initial implementation
```

3. If updating existing docs:
   - Read current documentation
   - Add/update relevant sections
   - Update the changelog at the bottom

4. Update @docs/architecture.md if this feature affects system design

5. Summarize what was documented
