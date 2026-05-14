# Release Management Guide

> This guide defines how DentFlow AI ships software. Every developer and AI agent must follow this process.
> Inspired by practices at Vercel, Linear, and the Supabase team.

---

## Philosophy

We release **frequently and safely**. A release is not a big-bang event — it is a routine operation that can be done by any team member. Small, frequent releases reduce risk, shorten feedback loops, and make debugging trivial.

**Principles:**
- Every merge to `main` is potentially shippable
- Releases are tagged, documented, and traceable to issues
- If you cannot describe what changed in a release, the release is not ready
- Breaking changes require a major version bump and advance notice

---

## Release Types

| Type | Version Bump | Example | When |
|------|-------------|---------|------|
| **Major** | `X.0.0` | `1.0.0 → 2.0.0` | Breaking API changes, major architecture overhaul |
| **Minor** | `0.X.0` | `0.1.0 → 0.2.0` | New feature milestone, backwards-compatible |
| **Patch** | `0.0.X` | `0.1.0 → 0.1.1` | Bug fixes, security patches, small improvements |
| **Pre-release** | `0.1.0-beta.1` | `0.1.0-beta.1` | Testing before a milestone release |
| **Hotfix** | `0.0.X` | `0.1.0 → 0.1.1` | Emergency patch to production |

See [SEMANTIC_VERSIONING.md](SEMANTIC_VERSIONING.md) for full rules.

---

## Standard Release Process

### Step 1: Prepare the release branch

```bash
# Branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v0.2.0
```

### Step 2: Bump the version

```bash
# Update package.json version
npm version minor --no-git-tag-version   # for minor
npm version patch --no-git-tag-version   # for patch
npm version major --no-git-tag-version   # for major
```

### Step 3: Update CHANGELOG.md

Move everything from `[Unreleased]` to a new versioned section:

```markdown
## [0.2.0] — 2026-06-10

### Added
- Patient management: create, search, edit, archive patients (#4, #12, #13)
- Appointment calendar: day/week view, drag-and-drop rescheduling (#5, #15)
- Double-booking prevention (#18)

### Fixed
- Login redirect loop on expired sessions (#22)

### Security
- Upgraded next-auth to patch CVE-2026-XXXX
```

Update the comparison links at the bottom of CHANGELOG.md:
```markdown
[0.2.0]: https://github.com/kodplex/dental-crm/compare/v0.1.0...v0.2.0
```

### Step 4: Final checks

```bash
npm run lint
npm run type-check
npm test
npm run build
```

All must pass. Zero errors. Zero warnings in type-check.

### Step 5: Commit and push the release branch

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): bump version to v0.2.0"
git push origin release/v0.2.0
```

### Step 6: Open PRs

Open **two PRs**:
1. `release/v0.2.0` → `main` (the production release)
2. `release/v0.2.0` → `develop` (sync the version bump back)

Get both reviewed and approved before merging.

### Step 7: Merge to main and tag

```bash
git checkout main
git pull origin main
# Merge via GitHub UI (squash-merge the release PR)

# Then tag the release
git tag -a v0.2.0 -m "Release v0.2.0: Patient Management MVP"
git push origin v0.2.0
```

### Step 8: Create the GitHub Release

The tagging in step 7 triggers the automated release workflow (`.github/workflows/release.yml`), which:
- Creates a GitHub Release from the tag
- Attaches the CHANGELOG entry as release notes
- Deploys to production via Vercel

If the workflow fails, create the release manually:

```bash
gh release create v0.2.0 \
  --title "v0.2.0 — Patient Management MVP" \
  --notes-file <(awk '/^## \[0\.2\.0\]/,/^## \[/' CHANGELOG.md | head -n -1) \
  --latest
```

### Step 9: Verify production

After the Vercel deployment completes:
- [ ] Open the production URL and log in
- [ ] Test the primary user flow affected by this release
- [ ] Check Sentry for new error spikes
- [ ] Check Vercel Analytics for anomalies
- [ ] If anything is broken: initiate the hotfix process immediately

### Step 10: Announce the release

Post a summary in the team's communication channel:

```
🚀 DentFlow AI v0.2.0 is live!

What's new:
- Patient management (create, search, edit, archive)
- Appointment calendar with drag-and-drop rescheduling

Fixes:
- Login redirect loop on expired sessions

Release notes: https://github.com/kodplex/dental-crm/releases/tag/v0.2.0
```

---

## Hotfix Process

A hotfix is an emergency patch to production that cannot wait for the next planned release.

**Triggers:** Data loss, authentication failure, payment processing errors, security vulnerabilities, crashes affecting > 10% of users.

```bash
# Branch from main (not develop!)
git checkout main
git pull origin main
git checkout -b hotfix/v0.1.1-login-crash

# Make the minimal fix
# ...

# Bump patch version
npm version patch --no-git-tag-version

# Update CHANGELOG
# Add entry to [Unreleased] section, then immediately move to a new [0.1.1] section

# Commit
git add .
git commit -m "fix(auth): resolve login crash on expired token

Closes #99"

# Push and open PR to main
git push origin hotfix/v0.1.1-login-crash
# Open PR: hotfix/v0.1.1-login-crash → main
```

After merging to main, **immediately** merge main back into develop:

```bash
git checkout develop
git merge main
git push origin develop
```

---

## Release Calendar

| Version | Theme | Planned Date |
|---------|-------|--------------|
| v0.1.0 | Foundation | 2026-05-20 |
| v0.2.0 | Patient Management MVP | 2026-06-10 |
| v0.3.0 | Automation + AI Summaries | 2026-07-01 |
| v0.4.0 | Treatment Plans + Billing | 2026-07-22 |
| v0.5.0 | Multi-Clinic Groups | 2026-08-12 |
| v1.0.0 | Public Beta | 2026-09-01 |

Dates are targets, not commitments. If a release will be late, update this table and communicate early.

---

## What Makes a Good Release Note

Good release notes are written for the **user**, not the developer.

**Bad:**
> Refactored PatientService to use repository pattern. Updated Supabase client to v2.

**Good:**
> Patients now load 3x faster. Added phone number search alongside name search.

**Rule of thumb:** If a non-technical clinic manager can read the release notes and understand what changed, they are good.

---

## Rollback

If a production release causes critical issues and a hotfix is not fast enough:

1. In Vercel dashboard: go to the deployment, click "Promote to Production" on the previous good deployment
2. This is immediate and does not require a code change
3. Create a GitHub issue documenting what broke and why
4. The bad release tag stays — do not delete it. Add a note to the GitHub Release that it was rolled back.

---

*Maintained by the engineering team. Last updated: 2026-05-14*
