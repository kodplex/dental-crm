# Product Requirements Document — DentFlow AI

> **Version:** 0.1.0  
> **Status:** Active  
> **Owner:** Product (Kodplex)  
> **Last Updated:** 2026-05-14  

---

## How to Use This Document

This PRD is a living document. It defines what we are building and why.

**Developers:** When you pick up a GitHub issue, trace it back to a requirement here. If a requirement is unclear, leave a comment on the issue — do not guess. When you ship a feature, update the Status column of the relevant requirement to "Shipped" and note the release version.

**AI Agents:** Read this entire document before starting any task. The Product Vision and Goals sections are your decision-making compass. When in doubt, choose the implementation that best serves a solo front-desk worker at a 3-chair clinic.

---

## 1. Product Vision

DentFlow AI gives a single front-desk staff member the operational leverage of a five-person team. It eliminates the administrative friction — missed recalls, manual chart lookups, phone tag for confirmations — that causes dental clinics to lose patients and revenue without realising it.

Within 18 months, DentFlow AI should be the default recommendation when dental school graduates ask "what software should I use to run my first clinic?"

---

## 2. Target Users

### Primary

| Persona | Role | Pain Today |
|---------|------|------------|
| **Amara** | Front-desk coordinator, 2-chair clinic | Tracks appointments in Google Calendar, patients in Excel, sends reminders manually |
| **Dr. Raj** | Owner-dentist, solo practice | Cannot see which patients are overdue for recall; guesses at end-of-day revenue |

### Secondary

| Persona | Role | Pain Today |
|---------|------|------------|
| **Sara** | Office manager, 5-clinic group | No single view of cross-clinic capacity; relies on WhatsApp for updates |
| **Dr. Chen** | Associate dentist | Cannot pull up a patient's AI-summarised history before entering the operatory |

---

## 3. Goals & Success Metrics

| Goal | Key Metric | Target (v1.0) |
|------|-----------|--------------|
| Reduce appointment no-shows | No-show rate | < 8% (industry avg 18%) |
| Improve recall compliance | % patients recalled within 30 days of due date | > 65% |
| Speed up front-desk intake | Time to create a new patient record | < 90 seconds |
| Surface AI insights on demand | Time to get a patient summary | < 5 seconds |
| Enable self-managed billing | % invoices created without manual data entry | > 80% |

---

## 4. Non-Goals (v1.0)

- Native mobile app (web-responsive only)
- Direct integration with dental imaging software (CBCT, intraoral cameras)
- Insurance claims processing / EDI
- Payroll or HR features
- Patient-facing portal (v2 roadmap)

---

## 5. Feature Requirements

### F-001: Authentication & Multi-Clinic Access

**Status:** In Progress | **Target Release:** v0.1.0 | **Issue:** #1

Clinic staff authenticate via email/password or Google SSO. Each user belongs to one or more clinic workspaces. Role-based access control (RBAC) determines what each user can see and do.

**Acceptance Criteria:**
- A new user can sign up, verify email, and reach their dashboard in under 60 seconds
- Login via email/password works
- Login via Google OAuth works
- A user assigned to two clinics sees a workspace switcher
- Roles: `owner`, `admin`, `dentist`, `front_desk` — with documented permission matrix
- Session tokens expire after 8 hours of inactivity
- Password reset via email works end-to-end

**Dev note:** Auth is handled by Supabase Auth. RLS (Row-Level Security) policies on all tables enforce the multi-tenancy boundary. Never bypass RLS with the service role key in frontend code.

---

### F-002: Patient Management

**Status:** Planned | **Target Release:** v0.2.0 | **Issue:** #4

A complete patient record system. Create, search, update, and archive patient profiles. Support for medical history, allergies, contact details, insurance, and document attachments.

**Acceptance Criteria:**
- Create a patient record with: name, DOB, phone, email, address, emergency contact, medical history, allergies
- Search patients by name, phone, or ID — results appear within 300ms for up to 10,000 records
- Edit any field in a patient record with full audit trail (who changed what, when)
- Soft-delete (archive) patients — archived patients are excluded from default search but recoverable
- Attach up to 10 documents per patient (consent forms, X-rays, referral letters) — max 25 MB each
- Patient records are scoped to clinic — no cross-clinic data leakage
- GDPR-compliant data export: export a patient's full record as PDF

**Dev note:** Documents stored in Supabase Storage, not in the database itself. Store only the storage path in the `patient_documents` table. See `docs/features/patient-management.md` for schema.

---

### F-003: Appointment Scheduling

**Status:** Planned | **Target Release:** v0.2.0 | **Issue:** #5

A calendar-first scheduling interface. Create, reschedule, cancel appointments. Block time for lunch, meetings, equipment maintenance. View by day/week/provider.

**Acceptance Criteria:**
- Create an appointment: patient, provider, treatment type, duration, chair/room, notes
- Calendar views: day, week (default), month
- Provider filter: show one dentist's schedule or all
- Drag-and-drop reschedule with confirmation dialog
- Double-booking prevention (hard block by default, soft override with warning for admins)
- Appointment statuses: `scheduled`, `confirmed`, `arrived`, `in_chair`, `completed`, `no_show`, `cancelled`
- Status transitions logged with timestamp and acting user
- iCal export for a provider's schedule

---

### F-004: Automated Recall & Reminders

**Status:** Planned | **Target Release:** v0.3.0 | **Issue:** #6

Automatically identify patients due for recall (6-month or 12-month, configurable per patient). Send SMS/email reminders for upcoming appointments. Track confirmation status.

**Acceptance Criteria:**
- Recall engine runs nightly (cron) and flags patients overdue or due within 30 days
- Clinic admin configures: recall interval, reminder lead time, message templates
- Reminder channels: email (required), SMS (optional, Twilio integration)
- Personalised message merge fields: `{{patient_name}}`, `{{clinic_name}}`, `{{appointment_date}}`, `{{provider_name}}`
- Two-way SMS: patient replies "YES" or "1" to confirm — status auto-updates to `confirmed`
- Opt-out management: SMS STOP and email unsubscribe honoured within 24 hours
- Reminder send history stored per patient

---

### F-005: AI Clinical Summaries

**Status:** Planned | **Target Release:** v0.3.0 | **Issue:** #7

On-demand AI-generated summaries of a patient's clinical history. Surfaces key conditions, recent treatments, overdue procedures, and risk flags before the dentist enters the operatory.

**Acceptance Criteria:**
- "Summarise Patient" button on patient profile and appointment view
- Summary generated in < 5 seconds using OpenAI GPT-4o
- Summary sections: Chief concern history, Treatment history (last 12 months), Outstanding treatment plan items, Overdue hygiene / X-rays, Allergy & medication flags, Suggested questions for today's visit
- Summaries are read-only — no AI-written content is persisted to the patient record without explicit dentist confirmation
- Each summary generation logged (model version, timestamp, user) for audit
- Clinics can disable AI features entirely from settings

---

### F-006: Treatment Plans & Notes

**Status:** Planned | **Target Release:** v0.4.0 | **Issue:** #8

Dentists create treatment plans itemising procedures, estimated costs, and priorities. Attach clinical notes to each appointment. Plans track completion status over time.

**Acceptance Criteria:**
- Create treatment plan: line items with procedure code, tooth number (FDI notation), priority, estimated cost, notes
- Plans versioned — editing creates a new version, old versions preserved
- Mark individual line items as completed (links to appointment)
- Export treatment plan as a patient-facing PDF estimate
- Clinical notes (SOAP format) attached to each appointment
- Notes support structured fields (Subjective, Objective, Assessment, Plan) and free text

---

### F-007: Billing & Revenue Dashboard

**Status:** Planned | **Target Release:** v0.4.0 | **Issue:** #9

Generate invoices from completed treatment plan items. Track payment status. Revenue dashboard for clinic owner with daily/monthly/YTD views.

**Acceptance Criteria:**
- Auto-generate invoice from a completed appointment's treatment items
- Manual line-item override on invoice before sending
- Payment status: `draft`, `sent`, `partial`, `paid`, `overdue`, `void`
- Mark payments received (cash, card, bank transfer, insurance)
- Revenue dashboard: daily revenue, monthly trend, top procedures by revenue, outstanding balance list
- CSV export of invoices for accountant handoff

---

### F-008: Multi-Clinic Group Management

**Status:** Planned | **Target Release:** v0.5.0 | **Issue:** #10

Clinic group owners manage multiple locations from a single account. Aggregate reporting, staff management across locations, shared patient records (with consent).

**Acceptance Criteria:**
- Create an Organisation with multiple Clinic workspaces
- Organisation-level roles: `org_owner`, `org_admin`
- Aggregate dashboard: combined revenue, appointment volume, no-show rate by clinic
- Staff can be assigned to multiple clinics
- Patient record sharing across clinics requires explicit patient consent (consent stored and auditable)

---

## 6. Technical Requirements

### Performance
- Page load (LCP) < 2.5s on 4G connection
- API response time P95 < 500ms for all list endpoints
- Search results < 300ms for up to 10,000 patient records

### Security
- All data encrypted in transit (TLS 1.2+) and at rest (Supabase default)
- Row-Level Security on all Supabase tables
- No PHI (Protected Health Information) in client-side logs or error messages
- GDPR and HIPAA considerations documented (see `SECURITY.md`)
- Dependency vulnerability scanning in CI

### Accessibility
- WCAG 2.1 AA compliance
- All interactive elements keyboard-navigable
- Screen reader tested (VoiceOver, NVDA)

### Browser Support
- Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
- No IE support

---

## 7. Release Roadmap

| Release | Version | Theme | Target Date |
|---------|---------|-------|-------------|
| Foundation | v0.1.0 | Auth, DB schema, CI/CD, project scaffolding | 2026-05-20 |
| Patient MVP | v0.2.0 | Patient management + appointment scheduling | 2026-06-10 |
| Automation | v0.3.0 | Recall engine + AI summaries | 2026-07-01 |
| Clinical | v0.4.0 | Treatment plans + billing | 2026-07-22 |
| Scale | v0.5.0 | Multi-clinic groups | 2026-08-12 |
| Public Beta | v1.0.0 | Hardening, accessibility, docs | 2026-09-01 |

---

## 8. Open Questions

| # | Question | Owner | Due |
|---|---------|-------|-----|
| OQ-1 | Which SMS provider? Twilio vs Vonage vs Plivo — cost comparison needed | Eng | v0.3.0 planning |
| OQ-2 | Is HIPAA BAA required for US clinic customers? Legal review needed | Legal | Before v1.0 |
| OQ-3 | Should treatment plan PDFs be generated server-side or client-side? | Eng | v0.4.0 planning |
| OQ-4 | Do we need offline support for areas with poor connectivity? | Product | v1.0 planning |

---

## 9. Glossary

| Term | Definition |
|------|-----------|
| **Recall** | Scheduled follow-up appointment, typically 6 or 12 months after last hygiene visit |
| **PHI** | Protected Health Information — any patient data that could identify an individual |
| **SOAP note** | Structured clinical note: Subjective, Objective, Assessment, Plan |
| **FDI notation** | International tooth numbering system (11-18, 21-28, 31-38, 41-48) |
| **Chair** | Physical dental treatment chair in the operatory |
| **Operatory** | A single treatment room in the clinic |
| **Treatment plan** | A list of procedures recommended for a patient with costs and priorities |
| **No-show** | Patient who had an appointment but did not arrive or cancel |

---

*When you ship a feature, change its Status in section 5 to "Shipped: vX.Y.Z" and link the GitHub release. Do not delete old requirements — they are the history of product decisions.*
