# Contributing to DentFlow AI

This document is your operating manual. Read it before writing a single line of code.
It exists so the team can move fast, stay aligned, and ship without a PM in every loop.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Before You Start a Task](#before-you-start-a-task)
3. [Branch Strategy](#branch-strategy)
4. [Commit Messages](#commit-messages)
5. [Pull Request Process](#pull-request-process)
6. [Code Review Standards](#code-review-standards)
7. [Definition of Done](#definition-of-done)
8. [Issue Lifecycle](#issue-lifecycle)
9. [Keeping Docs Updated](#keeping-docs-updated)
10. [Getting Unstuck](#getting-unstuck)

---

## Philosophy

We operate like a lean startup with an engineering-first culture:

**Clarity over cleverness.** Code that a new team member understands in 5 minutes is worth more than code that impresses nobody.

**Documentation is a first-class deliverable.** A feature is not done until its doc is updated. If you completed the code but not the doc, the issue stays open.

**Small PRs, fast reviews.** A PR that changes 3 files gets reviewed in 30 minutes. A PR that changes 30 files sits in review for 3 days. Break work into shippable slices.

**Issues are the source of truth.** If it is not in a GitHub issue, it does not exist as planned work. If you discover unexpected work mid-task, create an issue for it before doing it.

**Own your work end to end.** From reading the issue to updating the docs to verifying in staging. Nobody should have to chase you for status.

---

## Before You Start a Task

Before touching code on any issue:

1. **Re-read the issue.** Check the acceptance criteria. If anything is unclear, comment on the issue and tag the relevant person. Do not guess.
2. **Trace it to the PRD.** Every issue references a feature requirement (F-001, F-002 ...). Read that section in [PRD.md](../PRD.md).
3. **Check for blockers.** Is this issue blocked by another open issue? Check the "Blocked by" field. Do not start blocked work.
4. **Check the feature doc.** If a feature doc exists in `docs/features/`, read it. It contains schema details, edge cases, and prior decisions.
5. **Assign yourself** on GitHub. This signals to others that work is in progress.
6. **Create your branch** using the naming convention below.

---

## Branch Strategy

Full guide: [docs/BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md)

Quick reference:

```
main        — production code only. Never commit directly.
develop     — integration branch. All feature PRs merge here.
feature/*   — new features (branch from develop)
fix/*       — bug fixes (branch from develop, or main for hotfixes)
chore/*     — dependency updates, refactors, tooling
docs/*      — documentation-only changes
release/*   — release preparation (branch from develop)
hotfix/*    — emergency fix to production (branch from main)
```

**Branch naming:**

```
feature/42-patient-search
fix/67-appointment-double-booking
docs/update-agent-skills
hotfix/99-login-crash-prod
```

Always include the issue number when one exists.

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). This is not optional — it powers our automated changelog and release notes.

### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer: Closes #issue]
```

### Types

| Type | When to use |
|------|------------|
| `feat` | A new feature visible to users |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, no logic change |
| `refactor` | Code change that is not a feature or fix |
| `test` | Adding or updating tests |
| `chore` | Build tools, dependencies, CI config |
| `perf` | Performance improvements |
| `revert` | Reverting a previous commit |

### Breaking changes

Append `!` after the type/scope, and include `BREAKING CHANGE:` in the footer:

```
feat(auth)!: switch session tokens to httpOnly cookies

BREAKING CHANGE: existing sessions invalidated on deploy.
Users will be redirected to /login.
```

### Examples

```bash
feat(patients): add patient search by phone number

Implements fuzzy search using Postgres pg_trgm extension.
Returns top 10 results ranked by similarity score.

Closes #12

---

fix(appointments): prevent double-booking when dragging

The drag handler was not checking for overlapping appointments
on the target provider before optimistically updating the UI.

Closes #34

---

docs(agent): update SKILLS.md with billing capabilities

---

chore(deps): upgrade next from 14.2.3 to 14.2.9
```

---

## Pull Request Process

### Creating a PR

1. Push your branch and open a PR **to `develop`** (not to `main`).
2. Use the PR template — fill every section. Empty sections will be asked about.
3. Link the issue(s) this PR closes using `Closes #N` in the description.
4. Assign at least one reviewer.
5. Check that all CI checks pass before requesting review.

### PR Title

Use the same format as commit messages:

```
feat(patients): patient search with fuzzy matching (#12)
```

### PR Size Guidelines

| Lines changed | Status |
|--------------|--------|
| < 200 | Ideal |
| 200–500 | Acceptable |
| > 500 | Break it up before opening |

If your PR must be large (e.g., initial feature scaffolding), add a comment explaining why and walk the reviewer through the change in the PR description.

### Merging

- Squash-merge feature branches (the PR title becomes the commit message)
- Rebase-merge chore/docs branches to preserve clean history
- **Never merge your own PR** unless you are the sole contributor on an urgent hotfix

---

## Code Review Standards

### As a reviewer

- Review within 1 business day of assignment
- Distinguish between blocking comments (must fix) and suggestions (nice to have) — prefix suggestions with `nit:` or `suggestion:`
- Approve when the code is correct and safe, even if you would have done it differently
- Do not request changes for style issues that should be caught by the linter

### As an author

- Respond to every comment before re-requesting review
- If you disagree with feedback, explain why — do not silently change or silently ignore
- After addressing all feedback, leave a top-level comment: "All comments addressed"

---

## Definition of Done

A task is **done** when all of the following are true:

- [ ] Code is merged to `develop`
- [ ] All CI checks green (lint, type-check, tests)
- [ ] No regressions in existing tests
- [ ] The feature works in a staging/preview deployment
- [ ] The related GitHub issue is closed
- [ ] `docs/features/<feature>.md` is updated (if applicable)
- [ ] `CHANGELOG.md` has an entry in the `[Unreleased]` section
- [ ] PRD requirement status updated (if feature is fully complete)
- [ ] Any new environment variables documented in `.env.example`

---

## Issue Lifecycle

```
Open → In Progress → In Review → Done
```

**Labels you will use:**

| Label | Meaning |
|-------|---------|
| `status: todo` | Ready to be picked up |
| `status: in-progress` | Someone is working on it |
| `status: in-review` | PR opened, awaiting review |
| `status: blocked` | Cannot proceed — blocked by dependency |
| `type: feature` | New functionality |
| `type: bug` | Something is broken |
| `type: chore` | Technical maintenance |
| `type: docs` | Documentation only |
| `priority: critical` | Drop everything |
| `priority: high` | Current sprint |
| `priority: medium` | Next sprint |
| `priority: low` | Backlog |
| `size: XS` | < 2 hours |
| `size: S` | 2–4 hours |
| `size: M` | 1 day |
| `size: L` | 2–3 days |
| `size: XL` | Break this up |

---

## Keeping Docs Updated

This is the rule that separates functional teams from chaotic ones:

**If you change behavior, you update the doc on the same PR.**

| You changed... | Update... |
|----------------|-----------|
| A feature | `docs/features/<feature>.md` |
| The database schema | `docs/ARCHITECTURE.md` + migration file comments |
| An API endpoint | Inline JSDoc comment + `docs/ARCHITECTURE.md` |
| A CI workflow | `docs/DEPLOYMENT.md` |
| Branch strategy | `docs/BRANCHING_STRATEGY.md` |
| How to run the app | `README.md` |
| A release | `CHANGELOG.md` + GitHub Release notes |
| Agent capabilities | `docs/SKILLS.md` |

If you are unsure which doc to update, update the one you wish existed when you picked up the issue.

---

## Getting Unstuck

**Stuck on an issue for more than 2 hours?**

1. Write down what you have tried in a comment on the issue.
2. Tag a team member with a specific question — not "I'm stuck."
3. If it is a product decision (not technical), tag the product owner.

**Discovered unexpected complexity that will delay the work?**

1. Comment on the issue immediately with your revised estimate.
2. If the scope is substantially larger, propose breaking the issue into smaller ones.

**Found a bug while working on a feature?**

1. Create a new issue for the bug (do not fix it in the same PR unless it is a 1-line fix).
2. Note the bug issue number in your feature PR description.

---

*Last updated: 2026-05-14 | If this guide is wrong or missing something, open a PR to fix it — do not just mention it in Slack.*
