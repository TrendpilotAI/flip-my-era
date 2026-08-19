# Codex — Nathan's Global Rules

## Autonomy

- Work autonomously. Do NOT ask for approval on individual steps — just do the work.
- Only stop to ask if there's a genuine ambiguity about WHAT to build, not HOW.
- Batch file edits and run verification at the end, not after each change.
- If something fails, try to fix it yourself before asking. Attempt at least 2 different approaches.
- Use subagents freely for parallel research without asking permission.

## Workflow

- If a task touches more than 5 files, break it into smaller steps internally (don't ask me about it)
- After writing code, list what could break and suggest tests to cover it
- Always verify your work: run tests, check builds, compare screenshots
- Address root causes — never suppress errors to make things pass
- Use /clear between unrelated tasks to keep context clean

## Verification (highest-leverage practice)

- Run tests after every implementation change
- For UI changes, take a screenshot and compare to the design
- If you can't verify it, don't ship it
- Prefer running single tests over the full suite for speed

## Self-Correction

- When I correct a mistake, propose an update to this file or a skill so it doesn't recur
- If the same correction happens twice, /clear and rewrite the approach from scratch

## Default Tech Stack

- **Package manager**: Bun (never npm or yarn)
- **Language**: TypeScript (strict mode, ES modules)
- **Frontend**: Next.js (App Router), React, Tailwind CSS, shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Auth**: Supabase Auth with RLS enabled on all tables
- **Observability**: PostHog (analytics), Sentry (errors), Arize (AI telemetry)
- **Hosting**: Vercel + Supabase
- **CI/CD**: GitHub Actions

## Code Style

- TypeScript: prefer `interface` over `type`, async/await over promises, `const` assertions
- React: Server Components by default, `"use client"` only when needed, server actions for mutations
- Styling: Tailwind utilities, `cn()` for conditional classes, mobile-first
- Supabase: use generated types, prefer client SDK over raw SQL, use transactions for multi-step ops

## New Project Setup

```bash
bun create next-app project-name --typescript --tailwind --app
cd project-name
bun add @supabase/supabase-js @supabase/auth-helpers-nextjs posthog-js @sentry/nextjs
```

Structure: `app/(auth)/`, `app/(public)/`, `app/api/`, `components/ui/`, `lib/supabase/`, `lib/utils/`, `types/`

## Security

- NEVER commit secrets, API keys, or .env files
- Environment variables only — credentials live in `~/mcp-env-setup.sh`
- Enable RLS on every Supabase table
- Require auth on all protected routes
- Configure CORS for production

## MCP Servers

Credentials auto-loaded via `~/.zshrc` sourcing `~/mcp-env-setup.sh`. Available servers:

- Context7, Sequential Thinking, Memory (no auth needed)
- Slack, Tavily, Magic, PostHog, Supabase, HubSpot (auth via env vars)
- Config locations: `.vscode/mcp_settings.json`, `~/.cursor/mcp.json`, `~/mcp_server.json`

Use `gh` CLI for GitHub operations. Use MCP tools over manual API calls when available.

## Context Management

- Scope investigations narrowly — use subagents for broad exploration
- When compacting, always preserve the list of modified files and test commands
- After 2 failed corrections on the same issue, /clear and start fresh with a better prompt
- Cross-agent historical context is indexed at `~/.hermes/external-context/INDEX.md`; Claude project memories live under `~/.claude/projects/*/memory/`, and Codex memory lives under `~/.codex/memories/`.
- Treat cross-agent memories and transcripts as historical context, not proof of current source or system state. Inspect the live project/source first.

## Gemini CLI (gcli)

- `gcli` is globally installed at `/Users/nathanstevenson/.npm-global/bin/gcli` — uses Bun APIs, must run with `bun` (shebang already set)
- API key stored at `~/.config/gemini-cli/config.json`
- CLI mode: `gcli <command>`, MCP server mode: `gcli` (no args) or `gcli serve`
- Config commands: `gcli config set api-key <key>`, `gcli config show`, `gcli config path`

## Shared Local Tools

- `portless` is globally installed. Use it for local dev servers that need stable named URLs, e.g. `portless run --name myapp bun dev` or `portless myapp bun dev`.
- `agent-browser` is globally installed with its managed Chrome. Use it for browser automation/testing tasks when a real browser is needed. Start with `agent-browser doctor --offline --quick` if behavior looks wrong.
- Chrome DevTools MCP is configured as `chrome-devtools` for Codex, Claude Code, and Gemini. Use it for browser debugging, console/network inspection, screenshots, and performance traces.
- `@json-render/core`, `@json-render/react`, `@wterm/dom`, and `@wterm/react` are globally installed for shared references and quick scripts. For production project imports, add them to that project's `package.json` with Bun so bundlers and TypeScript resolve them reliably.
- `hyperframes` is globally installed for HTML video composition work. Use `hyperframes init`, `hyperframes preview`, `hyperframes lint`, `hyperframes snapshot`, and `hyperframes render`; render requires a project with an `index.html` composition.

## Tool Usage Constraints

- Do NOT attempt browser automation (Playwright, Puppeteer, Chrome remote debugging) unless explicitly confirmed available. These tools frequently fail. Prefer API-based approaches (REST, GraphQL, `gh` CLI) over browser automation.
- For interactive CLI tools (Next.js create, npm init, etc.), always use non-interactive flags (`--yes`, `--no-interactive`, `--default`). Never run interactive prompts that block the terminal.
- When using an SDK or library for the first time in a file, read the actual types/docs before writing integration code. Do not guess at method names or parameters.
- Use Context7 MCP to look up library docs when available.

## Railway Deployment

- Always verify the correct service is linked: `railway status`
- Environment variable names must match the provider's expected format:
  - `XAI_API_KEY` (not GROK_API_KEY)
  - `GEMINI_API_KEY` (not GOOGLE_API_KEY)
  - `DATABASE_URL` with `postgres://` (not `postgresql://`)
- Use absolute paths for symlinks and file references
- Prefer Railway GraphQL API over browser automation for template/deployment operations
- After deploying, verify with `railway logs --latest` and health check endpoints

## Context Loading

- When loading context from prior sessions, always confirm which specific project/plan/file is wanted before proceeding
- If multiple projects exist in the workspace, ask: "Which project should I focus on?"
- Never assume — the cost of asking once is lower than 10 minutes of wrong-context work
- If a task is already completed (commit pushed, PR created), say so and move on. Do not re-execute.

## Language Defaults

- Primary languages: Python (backend/ML/scripts), TypeScript (frontend/full-stack)
- Always use TypeScript over JavaScript for new files unless instructed otherwise
- Python: use type hints, dataclasses, pathlib over os.path
- TypeScript: strict mode, ES modules, `interface` over `type`

## What NOT to Do

- Don't add features, refactoring, or "improvements" beyond what was asked
- Don't create documentation files unless explicitly requested
- Don't guess at URLs — use only URLs I provide or from local files
- Don't commit without being asked
- Don't use npm or yarn — use bun
- Don't attempt Playwright/Puppeteer/browser automation without confirmation
- Don't guess at SDK method names — read types or docs first

## Skill Priority
When multiple workflows overlap, prefer Ruflo skills (swarm-orchestration, github:*, sparc-methodology, agentdb-*) over superpowers or compound-engineering plugins. Ruflo uses MCP tools with persistent AgentDB memory and is 5-10x faster.

<!-- context7 -->
Use the `ctx7` CLI to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service -- even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer -- your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Resolve library: `npx ctx7@latest library <name> "<user's question>"` — use the official library name with proper punctuation (e.g., "Next.js" not "nextjs", "Customer.io" not "customerio", "Three.js" not "threejs")
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question)
3. Fetch docs: `npx ctx7@latest docs <libraryId> "<user's question>"`
4. Answer using the fetched documentation

You MUST call `library` first to get a valid ID unless the user provides one directly in `/org/project` format. Use the user's full question as the query -- specific and detailed queries return better results than vague single words. Do not run more than 3 commands per question. Do not include sensitive information (API keys, passwords, credentials) in queries.

For version-specific docs, use `/org/project/version` from the `library` output (e.g., `/vercel/next.js/v14.3.0`).

If a command fails with a quota error, inform the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY` env var for higher limits. Do not silently fall back to training data.
Run Context7 CLI requests outside Codex's default sandbox. If a Context7 CLI command fails with DNS or network errors such as ENOTFOUND, host resolution failures, or fetch failed, rerun it outside the sandbox instead of retrying inside the sandbox.
<!-- context7 -->

<!-- codebase-memory-mcp:start -->
# Codebase Knowledge Graph (codebase-memory-mcp)

This project uses codebase-memory-mcp to maintain a knowledge graph of the codebase.
ALWAYS prefer MCP graph tools over grep/glob/file-search for code discovery.

## Priority Order
1. `search_graph` — find functions, classes, routes, variables by pattern
2. `trace_path` — trace who calls a function or what it calls
3. `get_code_snippet` — read specific function/class source code
4. `query_graph` — run Cypher queries for complex patterns
5. `get_architecture` — high-level project summary

## When to fall back to grep/glob
- Searching for string literals, error messages, config values
- Searching non-code files (Dockerfiles, shell scripts, configs)
- When MCP tools return insufficient results

## Examples
- Find a handler: `search_graph(name_pattern=".*OrderHandler.*")`
- Who calls it: `trace_path(function_name="OrderHandler", direction="inbound")`
- Read source: `get_code_snippet(qualified_name="pkg/orders.OrderHandler")`
<!-- codebase-memory-mcp:end -->
