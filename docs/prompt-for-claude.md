# Prompt to send to Claude (web/API)

Upload the file `playmorrow-snapshot.tar` and give Claude this prompt:

---

I am sending you the complete Playmorrow source code archive.

Playmorrow is an indie game discovery platform — a monorepo with a Next.js 15 frontend (apps/web), NestJS backend (apps/api), and shared Prisma database package (packages/database). It uses pnpm workspaces + Turborepo.

## Your job

Analyze the entire repository. Then produce a **single, self-contained execution prompt** that I can paste back into my CLI agent (which has read/write access to the repository) to execute.

## Context

The project has already undergone:
- A 14-phase Principal Engineer audit (result: 68/100 → 78/100 after fixes)
- 5 critical bugs fixed (CSRF header, OAuth cookie domain, FD leak, homepage errors, cosmetic filters)
- SEO fixed (OG image, canonical, JSON-LD, sitemap)
- 24 items in the last session (console→toast, alert→toast, confirm removed, N+1 batched, CSP hardened, etc.)
- Full typecheck 6/6, lint 0 errors, 17/17 pages 200

## What remains

The highest-impact remaining work is believed to be:
1. **Design system** — 4 independent game card implementations, no shared Button/Input/Modal components
2. **Isolated test database** — CI tests pollute dev DB
3. **Mobile experience** — no search on mobile, no auth actions in mobile menu
4. **Uptime monitoring** — no alerting
5. **Dynamic OG images** — per-game/studio social cards

## What I need from you

1. **Read the full archive.** Do not skip files. Understand architecture, code quality, security, UX, DevOps, everything.
2. **Identify the 5-10 highest-impact remaining improvements.** Prioritize by user-facing impact × implementation effort.
3. **For each improvement, produce a detailed execution plan** with:
   - Exact files to modify (paths)
   - Exact code changes (pseudocode or detailed description)
   - Order of operations
   - Any risks or dependencies
4. **Produce ONE prompt** for the CLI agent to execute. The prompt must be:
   - Self-contained (the agent has no context beyond what you write)
   - Specific enough that the agent can execute without asking questions
   - Organized as numbered tasks
   - Include verification steps at the end
5. **Be ruthless.** If something is low-quality, say so. If something is missing, flag it. If documentation contradicts code, report it.

## Constraints on the agent you're writing for

The agent:
- Has read/write access to the full filesystem at `/Users/nataliawindelboth/Desktop/FRONTEND/playmorrow`
- Can run shell commands, edit files, create files, move files
- Can run `pnpm dev` to start the dev server and verify changes live
- Can run `pnpm typecheck` and `pnpm lint` to verify code quality
- Can start the dev server and curl pages to verify they work
- Does NOT have access to Railway, Vercel, or any production deployment
- Should NOT install new npm packages unless essential (no `npm install`)
- Should NOT modify tests unless there's a bug in them

## Format

Your output should be a single markdown document with these sections:

### 1. Architecture Overview (what you found)
### 2. Critical Issues Found (blockers)
### 3. High-Impact Improvements (prioritized)
### 4. Full Execution Prompt

The execution prompt should start with "## EXECUTION PROMPT" and be clearly delimited so I can copy just that section.

Be thorough. Assume the project will be used by thousands of users and hundreds of indie studios.
