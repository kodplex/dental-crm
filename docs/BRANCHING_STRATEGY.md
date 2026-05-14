# Branching Strategy

> DentFlow AI uses a simplified Git Flow adapted for a small, fast-moving team.
> This is the only branching strategy used in this repo. Deviations require team discussion.

---

## Branch Overview

```
main ─────────────────────────────────────── production
  │
  └── develop ──────────────────────────── integration
        │
        ├── feature/42-patient-search     ← new features
        ├── fix/67-double-booking         ← bug fixes
        ├── chore/update-deps             ← maintenance
        ├── docs/update-agent-guide       ← docs only
        └── release/v0.2.0               ← release prep
```

---

## The Two Permanent Branches

### `main`
- **Represents:** What is deployed to production right now
- **Who can push:** Nobody directly. Only via merged PRs from `release/*` or `hotfix/*`
- **Protected:** Yes — requires PR + 1 approval + all CI passing
- **Rule:** Every commit on `main` must have a corresponding git tag

### `develop`
- **Represents:** Completed work waiting for the next release
- **Who can push:** Nobody directly. Only via merged feature/fix/chore PRs
- **Protected:** Yes — requires PR + 1 approval + CI passing
- **Rule:** `develop` must always be in a deployable state (staging environment)

---

## Short-lived Branch Types

### `feature/<issue-number>-<slug>`

For new features from the PRD.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/42-patient-search
```

- Branch from: `develop`
- Merge back to: `develop` (via PR)
- Naming: `feature/42-patient-search`, `feature/5-appointment-calendar`
- Lifetime: Until the feature PR is merged (< 1 week target)

### `fix/<issue-number>-<slug>`

For non-urgent bug fixes.

```bash
git checkout -b fix/67-appointment-double-booking
```

- Branch from: `develop`
- Merge back to: `develop` (via PR)
- Naming: `fix/67-double-booking`, `fix/23-login-redirect`

### `hotfix/<version>-<slug>`

For urgent production fixes that cannot wait for the next release cycle.

```bash
git checkout main
git pull origin main
git checkout -b hotfix/v0.1.1-login-crash
```

- Branch from: `main` (NOT develop)
- Merge back to: `main` AND `develop` (via two PRs)
- After merge: bump patch version, create release tag immediately

### `chore/<slug>`

For maintenance tasks: dependency upgrades, config changes, CI tweaks.

```bash
git checkout -b chore/upgrade-next-14.3
```

- Branch from: `develop`
- Merge back to: `develop`

### `docs/<slug>`

For documentation-only changes that do not touch application code.

```bash
git checkout -b docs/update-contributing-guide
```

- Branch from: `develop`
- Merge back to: `develop`
- Note: Docs changes on an existing feature branch should stay on that branch, not be split out.

### `release/<version>`

For release preparation — version bumps, changelog updates, final checks.

```bash
git checkout develop
git checkout -b release/v0.2.0
```

- Branch from: `develop`
- Merge to: `main` AND `develop`
- Only bug fixes and release prep commits allowed on this branch — no new features

---

## Branch Naming Rules

| Rule | Good | Bad |
|------|------|-----|
| Use kebab-case | `feature/patient-search` | `feature/patientSearch` |
| Include issue number when one exists | `feature/42-patient-search` | `feature/patient-search` |
| Be descriptive but concise | `fix/67-double-booking` | `fix/bug` |
| Use correct prefix | `feature/`, `fix/`, `hotfix/`, `chore/`, `docs/`, `release/` | `my-branch`, `test`, `wip` |
| Lowercase only | `fix/login-bug` | `Fix/Login-Bug` |

---

## Merge Strategy

| Branch | Merge Strategy | Reason |
|--------|---------------|--------|
| `feature/*` → `develop` | Squash merge | Clean linear history; one feature = one commit |
| `fix/*` → `develop` | Squash merge | Same |
| `chore/*` → `develop` | Rebase merge | Preserves individual upgrade commits for debugging |
| `docs/*` → `develop` | Squash merge | Clean |
| `release/*` → `main` | Merge commit | Preserves the release boundary in history |
| `release/*` → `develop` | Merge commit | Sync version bump back |
| `hotfix/*` → `main` | Merge commit | Preserves hotfix in history |
| `hotfix/*` → `develop` | Merge commit | Sync fix back |

**Never rebase a branch that has been pushed and has an open PR.** Rebasing rewrites history and breaks other people's local copies.

---

## Keeping Your Branch Up to Date

If `develop` has advanced while you were working on your feature, sync it:

```bash
# Preferred: rebase your work on top of latest develop
git fetch origin
git rebase origin/develop

# Alternative: merge develop into your branch (creates a merge commit)
git merge origin/develop
```

Resolve conflicts, run tests, push force (only your own branch):
```bash
git push --force-with-lease origin feature/42-patient-search
```

`--force-with-lease` is safer than `--force` — it refuses to overwrite if someone else pushed since your last pull.

---

## Pull Request Rules

1. All PRs target `develop` (unless it is a `release/*` or `hotfix/*` PR to `main`)
2. PR title follows Conventional Commits format
3. PR body uses the PR template — every section filled
4. At least 1 approval required before merge
5. All CI checks must pass
6. No unresolved review comments
7. Branch must be up to date with target branch

---

## Visual: A Feature Lifecycle

```
develop  ──●────────────────────────────────●── 
            \                              /
             ●──●──●──●  feature/42-...  ●
               commit commit commit    squash-merge
```

```
develop  ──●──────────────────────────────────●──●── 
           |                                 /   |
           └── release/v0.2.0 ──●──●──chore ──  |
                                                 |
main     ──────────────────────────────────────●──── v0.2.0 tag
```

---

*Last updated: 2026-05-14. Changes to this document require team discussion.*
