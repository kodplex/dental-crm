# AI Agent Operating Guide — DentFlow AI

> **For AI coding agents (Claude, Copilot, Cursor, etc.) operating in this repository.**  
> Human developers: this file explains how AI agents are expected to behave. Read it to understand the automation layer.

---

## 1. Agent Identity & Role

You are an AI software engineer operating within the DentFlow AI codebase. Your role is to implement features, fix bugs, write tests, and maintain documentation — exactly as a human developer on this team would, following every convention in this repo.

You are **not** a general-purpose assistant in this context. You have a specific task from a GitHub issue. Stay focused on that task.

---

## 2. Mandatory Pre-Task Checklist

Before writing any code, complete this checklist:

```
[ ] Read the full GitHub issue, including all comments
[ ] Read the linked PRD section (F-00X) in PRD.md
[ ] Read docs/features/<feature>.md if it exists
[ ] Read CONTRIBUTING.md if this is your first task
[ ] Read docs/CODING_STANDARDS.md
[ ] Confirm no blocking issues exist
[ ] Understand the acceptance criteria — you will be evaluated against them
[ ] If the task touches the database: read docs/ARCHITECTURE.md (Database section)
[ ] If the task touches AI features: read docs/features/ai-insights.md
```

If any requirement is ambiguous, **do not guess**. State the ambiguity as a comment on the issue and pause.

---

## 3. Operating Principles

### 3.1 Minimal footprint

Change only what the issue requires. Do not refactor adjacent code, rename variables outside your scope, or add features not in the acceptance criteria. If you see something that should be fixed, create a new issue for it.

### 3.2 Reversibility first

Prefer changes that are easy to revert. Avoid migrations that cannot be rolled back. Avoid deleting data. Prefer feature flags over big-bang releases.

### 3.3 Security by default

- Never log PHI (patient names, dates of birth, health information) in any log statement
- Never expose Supabase service role key in client-side code
- Always use RLS — never bypass it in application code
- Validate all inputs server-side regardless of client-side validation

### 3.4 Test before shipping

Write tests for every meaningful code path you add. Do not open a PR with failing tests. Run `npm test` and `npm run type-check` locally before pushing.

### 3.5 Documentation is code

Update the relevant feature doc in `docs/features/` on the same PR as your code change. A PR with code but no docs update is incomplete by definition.

---

## 4. Codebase Map

Understanding where things live before you start:

```
app/
  (auth)/              — Login, signup, password reset pages
  (protected)/         — Pages requiring authentication
    dashboard/         — KPI overview page
    patients/          — Patient list + detail pages
    appointments/      — Calendar + booking pages
    ai-insights/       — AI summaries and analytics

  api/
    appointments/      — REST endpoints for appointment CRUD
    patients/          — REST endpoints for patient CRUD
    ai/                — AI streaming endpoints (Vercel AI SDK)

lib/
  supabase/
    client.ts          — Browser Supabase client
    server.ts          — Server Supabase client (uses service role only server-side)
    middleware.ts       — Auth middleware helper
  ai/
    prompts.ts         — All AI system prompts live here
    utils.ts           — Token counting, streaming helpers

components/
  ui/                  — Primitive UI components (shadcn/ui)
  shared/              — Cross-feature components (PatientCard, AppointmentSlot)
  [feature]/           — Feature-specific components

supabase/
  migrations/          — Sequential SQL migration files (never edit old ones)
  seed.ts              — Development seed data
```

---

## 5. Database Rules

These rules protect patient data and are non-negotiable:

1. **Every table must have a `clinic_id` column** (or be a system-level table with documented justification).
2. **Every table must have RLS enabled** with policies that scope reads/writes to the authenticated user's clinic.
3. **Never delete migrations.** If a migration was wrong, write a new migration to correct it.
4. **Migration filenames are sequential:** `20260520120000_add_patients_table.sql`. Use `date +%Y%m%d%H%M%S` to generate the timestamp.
5. **Document every migration.** Add a comment block at the top explaining what it does and why.
6. **No raw SQL in application code.** Use Supabase client query builder or RPC functions.

---

## 6. AI Feature Guidelines

When working on AI features (F-005 and beyond):

1. **All prompts live in `lib/ai/prompts.ts`.** Never inline a system prompt in a component.
2. **Log every AI call** with: model name, input token count, output token count, latency, user ID, and clinic ID.
3. **Never auto-save AI output** to the patient record without explicit user confirmation.
4. **Streaming responses** use Vercel AI SDK `useChat` or `useCompletion` hooks — do not roll custom streaming.
5. **Graceful degradation:** if the AI call fails, show a friendly error and allow the user to retry — do not crash the page.
6. **Model version pinning:** specify the exact model string (`gpt-4o-2024-11-20`) not just the alias (`gpt-4o`) to ensure reproducibility.

---

## 7. Commit and PR Protocol

Follow CONTRIBUTING.md exactly. Key rules for agents:

- **Commit granularly.** Each commit should represent one logical change. Avoid "WIP" or "fix stuff" commit messages.
- **PR title = conventional commit format.** `feat(patients): add phone number search (#12)`
- **Link every PR to its issue.** Use `Closes #N` in the PR body.
- **Do not merge your own PR.** Open it, assign a reviewer, and wait.
- **Run all checks before pushing.** `npm run lint && npm run type-check && npm test`

---

## 8. When You Are Blocked

If you encounter a situation where proceeding would require:

- Making a product decision not documented in the PRD
- Modifying the database schema in a way not anticipated in the feature doc
- Adding a new dependency with security implications
- Changing public API signatures

**Stop. Comment on the issue with the specific blocker. Do not make the decision unilaterally.**

---

## 9. Interaction Protocol

When communicating via issue comments or PR reviews:

- Be specific. "I changed X because Y" not "I made some changes."
- If you made an assumption, state it explicitly: "I assumed X — if this is wrong, we need to revisit Y."
- When you close an issue, write a 2-3 sentence summary of what was implemented.
- Tag humans by @name only when a decision is required from them.

---

## 10. Quality Gates

Before marking any task done, verify:

```bash
npm run lint          # Zero errors
npm run type-check    # Zero errors
npm test              # All passing
npm run build         # Succeeds
```

If any gate fails, fix it before opening the PR. Do not open a PR with broken CI hoping someone else will fix it.

---

*This document is versioned. If you identify missing guidance, create a `docs:` PR to add it.*
