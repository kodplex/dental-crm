# Feature: Patient Management

> **PRD Reference:** F-002  
> **Target Release:** v0.2.0  
> **Status:** Planned  
> **GitHub Issue:** #4  

---

## Overview

The patient management module is the core of DentFlow AI. Every other feature — appointments, treatment plans, billing, AI summaries — is anchored to a patient record. Getting this right is the most important thing we do in v0.2.0.

---

## What Gets Built

1. Patient list page with search and filters
2. Patient profile page (view + edit)
3. Create patient form
4. Archive (soft-delete) flow
5. Document attachment (upload, view, delete)
6. Audit trail display for admin users

---

## Database Schema

See `docs/ARCHITECTURE.md` for the full `patients` table definition.

Key points for developers:
- `archived_at` is the soft-delete field — null means active
- `medical_history` and `allergies` are free text / text array respectively
- `recall_interval_months` defaults to 6 but is configurable per patient
- `address` is stored as JSONB for flexibility

---

## API Endpoints

```
GET    /api/patients              list (paginated, searchable)
POST   /api/patients              create
GET    /api/patients/[id]         get one (full profile)
PATCH  /api/patients/[id]         update fields
DELETE /api/patients/[id]         archive (sets archived_at)

POST   /api/patients/[id]/documents    upload document
GET    /api/patients/[id]/documents    list documents
DELETE /api/patients/[id]/documents/[docId]  delete document
```

### Search API

Search supports three query params:
- `q` — full-text search across name fields
- `phone` — exact or partial phone match
- `status` — `active` (default) | `archived` | `all`

Uses Postgres `pg_trgm` for fuzzy name matching. Requires the extension enabled in the migration.

---

## UI Components

```
app/(protected)/patients/
  page.tsx              — Patient list + search
  [id]/
    page.tsx            — Patient profile (read)
    edit/page.tsx       — Edit patient form
  new/page.tsx          — Create patient form

components/patients/
  PatientList.tsx        — List with search bar
  PatientCard.tsx        — Single patient row/card
  PatientForm.tsx        — Create/edit form
  PatientProfile.tsx     — Full profile view
  DocumentUploader.tsx   — File upload component
  RecallBadge.tsx        — Overdue/upcoming recall indicator
```

---

## Acceptance Criteria

Copied from PRD F-002 for convenience:

- [ ] Create a patient record with: name, DOB, phone, email, address, emergency contact, medical history, allergies
- [ ] Search patients by name, phone, or ID — results appear within 300ms for up to 10,000 records
- [ ] Edit any field in a patient record with full audit trail
- [ ] Soft-delete (archive) patients — archived excluded from default search
- [ ] Attach up to 10 documents per patient (consent forms, X-rays) — max 25 MB each
- [ ] Patient records scoped to clinic (no cross-clinic leakage)
- [ ] GDPR-compliant data export as PDF

---

## Edge Cases to Handle

| Edge case | Expected behaviour |
|-----------|-------------------|
| Patient with same name exists | Warn but allow creation (use DOB + phone to confirm identity) |
| File upload fails mid-stream | Show error, allow retry. Do not leave partial records in DB. |
| Search with no results | Show empty state with "New Patient" CTA |
| Archive patient with future appointments | Block archive, show warning with appointment list |
| Duplicate phone number | Warn on save with link to existing patient |

---

## Security Notes

- Documents stored in private Supabase Storage bucket
- Document URLs are signed (1-hour expiry) — generated server-side only
- `SUPABASE_SERVICE_ROLE_KEY` used only in `app/api/` routes — never in components
- All queries go through RLS — no explicit clinic_id filter needed but added for clarity

---

## Dev Checklist

When you complete this feature:

- [ ] All acceptance criteria verified in staging
- [ ] Unit tests for: search ranking, recall date calculation, document URL generation
- [ ] Integration tests for: CRUD API, document upload, RLS enforcement
- [ ] E2E test: create patient → search → view → edit → archive
- [ ] This doc updated with: final schema (if changed), any edge cases discovered, known limitations
- [ ] PRD F-002 status updated to "Shipped: v0.2.0"
- [ ] CHANGELOG.md `[Unreleased]` section updated
- [ ] `.env.example` updated if new env vars added

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-14 | Initial spec created | Kodplex Product |

*Add an entry every time this feature is meaningfully changed.*
