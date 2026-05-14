# Semantic Versioning Guide

> DentFlow AI uses Semantic Versioning 2.0.0. This document explains the rules, examples, and edge cases specific to this project.

---

## The Format

```
MAJOR.MINOR.PATCH[-PRE_RELEASE][+BUILD]

Examples:
  0.1.0         — initial release
  0.2.0         — new minor feature
  0.2.1         — patch fix
  1.0.0         — first stable release
  1.1.0-beta.1  — beta of next minor
  2.0.0-rc.1    — release candidate for major
```

---

## When to Bump What

### PATCH (`0.1.0 → 0.1.1`)

Increment PATCH when you make **backwards-compatible bug fixes**.

| Qualifies as PATCH | Does NOT qualify |
|-------------------|-----------------|
| Fix a crash | Add a new API endpoint |
| Fix incorrect data display | Change a database column type |
| Fix a typo in UI text | Remove a feature |
| Update a dependency for a security patch | Change auth flow |
| Fix broken CSS | Add a new page |

```bash
npm version patch --no-git-tag-version
# 0.1.0 → 0.1.1
```

### MINOR (`0.1.0 → 0.2.0`)

Increment MINOR when you add **new functionality in a backwards-compatible manner**.

| Qualifies as MINOR |
|-------------------|
| New feature from the PRD (F-002, F-003, etc.) |
| New API endpoint |
| New optional configuration option |
| New page or major UI addition |
| Feature flag enabling new behaviour |

```bash
npm version minor --no-git-tag-version
# 0.1.0 → 0.2.0
```

### MAJOR (`0.x.x → 1.0.0` or `1.x.x → 2.0.0`)

Increment MAJOR when you make **incompatible API changes**.

| Qualifies as MAJOR |
|-------------------|
| Removing an API endpoint |
| Renaming a database table or column that external systems depend on |
| Changing auth token format (invalidates existing sessions) |
| Removing a supported feature |
| Changing the URL structure for the main app routes |
| First stable public release (0.x.x → 1.0.0) |

```bash
npm version major --no-git-tag-version
# 0.9.0 → 1.0.0
```

---

## Pre-release Versions

Used for testing before an official release:

```
0.2.0-alpha.1   — very early, likely broken
0.2.0-beta.1    — feature-complete, needs testing
0.2.0-rc.1      — release candidate, only critical bugs block release
```

Pre-release versions are always lower than the release:
`0.2.0-rc.1 < 0.2.0`

---

## The 0.x.x Convention

**While the version is 0.x.x, MINOR bumps may include breaking changes.**

This is intentional. Version 0.x.x signals that the public API is not yet stable. We are in active development and users should expect change.

Once we reach v1.0.0, the rules above are strictly enforced.

---

## Practical Examples for This Project

| Change | Version bump | Reason |
|--------|-------------|--------|
| Fix patient search returning wrong results | `patch` | Bug fix |
| Add appointment drag-and-drop | `minor` | New feature |
| Add phone number to patient record | `minor` | New functionality |
| Remove `GET /api/v1/patients` endpoint | `major` | Breaking API removal |
| Fix typo in "Schedule Appointment" button | `patch` | UI bug fix |
| First clinic pays us money | `1.0.0` | Stable release |
| Migrate from Supabase Auth to custom auth | `major` | Breaking change to all sessions |
| Add AI summary button | `minor` | New optional feature |
| Fix AI summary crashing on empty history | `patch` | Bug fix |

---

## Git Tags

Every release must have a corresponding git tag:

```bash
# Annotated tag (preferred — includes message and tagger info)
git tag -a v0.2.0 -m "Release v0.2.0: Patient Management MVP"
git push origin v0.2.0

# List all release tags
git tag -l "v*" --sort=-version:refname | head -10
```

**Tag format:** `v` prefix + semver. Always `v0.2.0`, never `0.2.0` or `release-0.2.0`.

---

## Why This Matters

1. **Communicates intent.** A PATCH release tells users "nothing changed that you need to worry about." A MAJOR release says "read the migration guide."
2. **Enables automation.** Our CI/CD uses version tags to trigger deployments and generate changelogs automatically.
3. **Protects users.** Clinics running DentFlow AI need to know when an update might break their workflows.
4. **Builds trust.** Predictable versioning signals engineering maturity.

---

*Reference: [semver.org](https://semver.org) | [Keep a Changelog](https://keepachangelog.com)*
