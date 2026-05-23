---
description: Read, write, or search project memories stored in .awel/memory.json. Use this skill when you need to save important project patterns, conventions, or decisions for future sessions, or retrieve past context about unfamiliar parts of the codebase.
---

# Memory — Persistent Project Knowledge

Awel stores persistent project memories in `.awel/memory.json`. These memories survive across sessions and help maintain context about the project.

## Data Format

The file contains a JSON array of memory entries:

```json
[
  {
    "id": "uuid-string",
    "content": "Description of the fact, pattern, or rule",
    "tags": ["keyword1", "keyword2"],
    "scope": "always | contextual",
    "source": "agent",
    "createdAt": "ISO-timestamp",
    "usageCount": 0,
    "lastUsedAt": "ISO-timestamp"
  }
]
```

## Scopes

- **always**: Injected into every conversation automatically. Use for project-wide rules, tech stack info, coding conventions.
- **contextual**: Only retrieved on demand via search. Use for specific facts about files, components, or past decisions.

## How to Read Memories

Read the file directly:

```bash
cat .awel/memory.json
```

## How to Write a Memory

1. Read the current file (or start with `[]` if it doesn't exist)
2. Append a new entry with a UUID, timestamp, and the fields above
3. Write the updated array back

Example using Bash:

```bash
node -e "
const fs = require('fs');
const path = '.awel/memory.json';
const entries = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf-8')) : [];
entries.push({
  id: crypto.randomUUID(),
  content: 'YOUR MEMORY CONTENT HERE',
  tags: ['tag1', 'tag2'],
  scope: 'contextual',
  source: 'agent',
  createdAt: new Date().toISOString(),
  usageCount: 0,
  lastUsedAt: new Date().toISOString()
});
fs.mkdirSync('.awel', { recursive: true });
fs.writeFileSync(path, JSON.stringify(entries, null, 2) + '\n');
console.log('Memory saved');
"
```

## How to Search Memories

Read the file and filter by matching query keywords against content and tags (case-insensitive).
When you retrieve contextual memories, bump their `usageCount` and `lastUsedAt`.

## Guidelines

- When you discover important project patterns, conventions, or constraints, save them as memories.
- Use `always` scope sparingly — only for things every conversation needs (tech stack, coding rules, directory conventions).
- Use `contextual` scope for specific facts about files, components, or past decisions.
- Write factual, specific content. Avoid vague generalizations.
- Include relevant tags (file names, component names, library names) for better search.
- Before working on an unfamiliar part of the codebase, search memories for relevant context.
