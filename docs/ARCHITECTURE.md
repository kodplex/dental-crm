# Architecture — DentFlow AI

> This document describes the system design: how components connect, where data lives, and why key decisions were made.
>
> **Keep this updated.** When you add a table, change an endpoint, or introduce a new service, update the relevant section on the same PR.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / Client                      │
│         Next.js App (React Server + Client Components)    │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
          ┌─────────────┼──────────────────┐
          │             │                  │
    ┌─────▼──────┐ ┌────▼─────┐  ┌────────▼───────┐
    │  Next.js   │ │ Supabase │  │   OpenAI API   │
    │  API Routes│ │  (BaaS)  │  │   (GPT-4o)     │
    └─────┬──────┘ └────┬─────┘  └────────────────┘
          │             │
          │    ┌────────┴──────────────────┐
          │    │   PostgreSQL Database     │
          │    │   (Supabase managed)      │
          │    ├───────────────────────────┤
          │    │   Supabase Auth           │
          │    │   Supabase Storage        │
          │    │   Supabase Realtime       │
          │    └───────────────────────────┘
          │
    ┌─────▼──────────────────────┐
    │         Vercel             │
    │   Edge Functions + CDN     │
    └────────────────────────────┘
```

---

## Technology Decisions

### Why Next.js (App Router)?

- Hybrid server/client rendering: patient data fetched server-side (faster, secure), interactive UI stays client-side
- API Routes co-located with frontend — single deployment unit
- Native Vercel integration: preview deployments on every PR with zero config
- Strong TypeScript support

### Why Supabase?

- Postgres with RLS: multi-tenancy is enforced at the database level, not just in application code — a critical safety property for clinic data
- Realtime subscriptions: appointment status changes propagate instantly to all open browsers
- Auth with Google OAuth out-of-the-box
- Storage for patient documents with presigned URLs
- Open source — can self-host if compliance requires it

### Why Vercel AI SDK?

- Streaming text responses from OpenAI with minimal boilerplate
- React hooks (`useChat`, `useCompletion`) for streaming UI
- Model-agnostic — can switch from OpenAI to Anthropic without changing component code

---

## Database Schema

### Core Tables

```sql
-- Multi-tenancy root
organizations
  id            uuid PK
  name          text
  created_at    timestamptz

-- Each clinic location
clinics
  id            uuid PK
  org_id        uuid FK → organizations(id)
  name          text
  address       text
  timezone      text  -- IANA timezone string e.g. "Asia/Kolkata"
  created_at    timestamptz

-- User accounts (managed by Supabase Auth)
users  (= auth.users, extended via profiles)

-- Profile extension for auth.users
profiles
  id            uuid PK FK → auth.users(id)
  full_name     text
  avatar_url    text
  updated_at    timestamptz

-- Clinic membership (many-to-many: users ↔ clinics)
clinic_memberships
  id            uuid PK
  clinic_id     uuid FK → clinics(id)
  user_id       uuid FK → auth.users(id)
  role          text  -- 'owner' | 'admin' | 'dentist' | 'front_desk'
  created_at    timestamptz

-- Patient records
patients
  id            uuid PK
  clinic_id     uuid FK → clinics(id)
  first_name    text
  last_name     text
  date_of_birth date
  email         text
  phone         text
  address       jsonb  -- { street, city, state, postal_code, country }
  medical_history text
  allergies     text[]
  recall_interval_months int  DEFAULT 6
  last_recall_date date
  archived_at   timestamptz  -- null = active
  created_at    timestamptz
  updated_at    timestamptz
  created_by    uuid FK → auth.users(id)

-- Appointment records
appointments
  id            uuid PK
  clinic_id     uuid FK → clinics(id)
  patient_id    uuid FK → patients(id)
  provider_id   uuid FK → auth.users(id)
  treatment_type text
  chair         text
  starts_at     timestamptz
  ends_at       timestamptz
  status        text  -- see Appointment Status below
  notes         text
  created_at    timestamptz
  updated_at    timestamptz

-- Treatment plans
treatment_plans
  id            uuid PK
  clinic_id     uuid FK → clinics(id)
  patient_id    uuid FK → patients(id)
  created_by    uuid FK → auth.users(id)
  title         text
  status        text  -- 'draft' | 'presented' | 'accepted' | 'in_progress' | 'completed'
  version       int   DEFAULT 1
  created_at    timestamptz

-- Individual items within a treatment plan
treatment_plan_items
  id            uuid PK
  plan_id       uuid FK → treatment_plans(id)
  tooth_number  text  -- FDI notation e.g. "11", "23"
  procedure_code text
  description   text
  estimated_cost decimal(10,2)
  priority      text  -- 'urgent' | 'recommended' | 'elective'
  status        text  -- 'pending' | 'completed' | 'declined'
  completed_at  timestamptz
  appointment_id uuid FK → appointments(id)

-- AI generation log (audit)
ai_generations
  id            uuid PK
  clinic_id     uuid FK → clinics(id)
  user_id       uuid FK → auth.users(id)
  patient_id    uuid FK → patients(id)
  generation_type text  -- 'patient_summary' | 'recall_message' | ...
  model         text    -- exact model string e.g. 'gpt-4o-2024-11-20'
  prompt_tokens int
  completion_tokens int
  latency_ms    int
  created_at    timestamptz

-- Immutable audit log for sensitive changes
audit_log
  id            uuid PK
  clinic_id     uuid FK → clinics(id)
  user_id       uuid FK → auth.users(id)
  table_name    text
  record_id     uuid
  action        text  -- 'INSERT' | 'UPDATE' | 'DELETE'
  old_values    jsonb
  new_values    jsonb
  created_at    timestamptz
```

### Appointment Status Machine

```
scheduled → confirmed → arrived → in_chair → completed
                                           ↘ no_show
scheduled → cancelled
confirmed → cancelled
```

Only forward transitions are valid (you cannot un-complete an appointment). Status changes must go through the API, not direct DB updates from the client.

### RLS Policy Pattern

Every patient-data table uses the same RLS pattern:

```sql
-- Users can only see records belonging to their clinic(s)
create policy "clinic_members_select"
  on [table_name] for select
  using (
    clinic_id in (
      select clinic_id from clinic_memberships
      where user_id = auth.uid()
    )
  );
```

---

## API Structure

### Authentication
All API routes require a valid Supabase session. Unauthenticated requests return 401.

### Endpoint patterns

```
GET    /api/patients              — list (paginated, filterable)
POST   /api/patients              — create
GET    /api/patients/[id]         — get one
PATCH  /api/patients/[id]         — update
DELETE /api/patients/[id]         — archive (soft delete)

GET    /api/appointments          — list (date range, provider filter)
POST   /api/appointments          — create
PATCH  /api/appointments/[id]     — update (reschedule, status change)
DELETE /api/appointments/[id]     — cancel

POST   /api/ai/patient-summary    — stream AI summary for a patient
POST   /api/ai/recall-message     — generate personalised recall message
```

### Response format

All API responses follow:
```json
{
  "data": { ... },      // present on success
  "error": "message",  // present on error
  "meta": {            // present on paginated lists
    "total": 247,
    "page": 1,
    "per_page": 50
  }
}
```

---

## File Storage

Patient documents stored in Supabase Storage:

```
bucket: patient-documents (private)
path:   {clinic_id}/{patient_id}/{timestamp}-{filename}
```

Files served via short-lived signed URLs (1 hour expiry) generated server-side. Never serve documents via public bucket URLs.

---

## Realtime Subscriptions

Used for appointment status updates across concurrent browser sessions:

```typescript
// Subscribe to appointment changes for the current clinic's calendar
supabase
  .channel('appointments')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'appointments',
    filter: `clinic_id=eq.${clinicId}`
  }, (payload) => {
    updateCalendar(payload.new)
  })
  .subscribe()
```

---

## Environment Architecture

| Environment | Branch | URL | Purpose |
|------------|--------|-----|---------|
| Development | local | `localhost:3000` | Active development |
| Preview | `feature/*`, `fix/*` | Vercel preview URL | PR review |
| Staging | `develop` | `staging.dentflow.ai` | Integration testing |
| Production | `main` | `app.dentflow.ai` | Live users |

Each environment has its own Supabase project. Never point staging/preview at the production database.

---

*Last updated: 2026-05-14. Schema changes require updating this document.*
