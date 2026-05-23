---
description: Important rules for working with the dev server in Awel. You MUST follow these rules when the dev server needs restarting or when running dev commands.
---

# Dev Server — Awel Managed Process

**Awel manages the dev server process (e.g. `npm run dev`) automatically.** You do NOT control it directly.

## Critical Rules

1. **NEVER kill or restart the dev server yourself.** Do not run commands like:
   - `kill`, `pkill`, `killall` targeting the dev server process
   - `npm run dev`, `npx next dev`, or any command that starts a new dev server
   - `lsof -i` + `kill` to free the port

2. **If the dev server needs restarting** (e.g. after changing `next.config.js`, `.env`, or `package.json`), tell the user to restart it. Do not attempt to restart it yourself.

3. **The dev server auto-restarts** when it crashes. Awel watches the process and restarts it automatically. If there is a build error, fix the code — the server will restart on its own once the file is saved.

4. **HMR handles most changes.** After editing React components, pages, or styles, the browser updates automatically via Hot Module Replacement. No restart is needed.

## What You CAN Do

- Edit project files normally (Read, Write, Edit) — HMR will pick up changes
- Run `npm install` to add dependencies (Awel will detect the restart need)
- Run build/lint/test commands like `npm run build`, `npx tsc --noEmit`, `npx eslint`
