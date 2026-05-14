# Changelog

All notable changes to DentFlow AI are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## How to Update This File

**Developers:** Every PR that changes user-visible behaviour, database schema, or public API must add an entry to the `[Unreleased]` section. The release manager moves `[Unreleased]` to a versioned section at release time.

Write entries from the perspective of a **user or developer consuming the product** — not from the perspective of implementation. Bad: "Refactored the appointment service." Good: "Appointments now load 40% faster on week view."

### Entry format

```
### Added
- Short description of new behaviour. (#issue-number)

### Changed
- What changed and why. (#issue-number)

### Fixed
- What was broken and is now fixed. (#issue-number)

### Removed
- What was removed. (#issue-number)

### Security
- Vulnerabilities patched. (CVE-YYYY-XXXXX if applicable)

### Deprecated
- What will be removed in a future release.
```

---

## [Unreleased]

_Entries added here by developers as work is merged to `develop`._

### Added
- Initial project scaffold: Next.js 14 + Supabase template
- Supabase Auth integration (email/password + Google OAuth)
- Base database schema: clinics, users, patients, appointments, audit_log
- Row-Level Security policies for multi-tenant data isolation
- CI pipeline: lint, type-check, build, test on every PR
- GitHub issue templates: bug, feature, task, epic
- Pull request template with Definition of Done checklist
- Automated release workflow triggered by version tags
- Project documentation: PRD, AGENT, SKILLS, CONTRIBUTING, ARCHITECTURE

---

## [0.1.0] — 2026-05-20

### Added
- Project foundation: Next.js 14 (App Router) + Supabase + TypeScript
- Supabase Auth: email/password sign-up, Google OAuth, password reset
- Protected route middleware — unauthenticated users redirected to `/login`
- Dashboard shell with sidebar navigation
- Base Postgres schema with RLS for clinic-scoped multi-tenancy
- Initial Supabase migrations versioned under `supabase/migrations/`
- CI/CD with GitHub Actions: lint → type-check → test → build
- Staging deployment on Vercel preview URLs
- Production deployment on merge to `main`
- Full developer documentation suite

---

_Older releases will appear here as the project ships._

[Unreleased]: https://github.com/kodplex/dental-crm/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kodplex/dental-crm/releases/tag/v0.1.0
