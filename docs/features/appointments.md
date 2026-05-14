# Feature: Appointment Scheduling

> **PRD Reference:** F-003  
> **Target Release:** v0.2.0  
> **Status:** Planned  
> **GitHub Issue:** #5  

---

## Overview

The appointment calendar is the most-used screen in the CRM. Front-desk staff live in it all day. It must be fast, intuitive, and resistant to errors like double-booking.

---

## What Gets Built

1. Week-view calendar (default) and day-view
2. Create appointment modal (from calendar click or button)
3. Drag-and-drop reschedule
4. Appointment detail panel (status, notes, linked patient)
5. Provider filter
6. Double-booking prevention

---

## Database Schema

See `ARCHITECTURE.md` for the `appointments` table.

Key points:
- `starts_at` / `ends_at` are timestamptz (timezone-aware)
- All calendar rendering should convert to the clinic's local timezone (`clinics.timezone`)
- Status transitions are one-directional — see ARCHITECTURE.md for the state machine

---

## Double-booking Logic

```sql
-- Before inserting/updating an appointment, check for conflicts
-- A conflict exists when:
-- same provider + same time window + status not in ('cancelled', 'no_show')

SELECT id FROM appointments
WHERE provider_id = $provider_id
  AND clinic_id = $clinic_id
  AND status NOT IN ('cancelled', 'no_show')
  AND (starts_at, ends_at) OVERLAPS ($starts_at, $ends_at)
  AND id != $exclude_id  -- exclude the appointment being updated
```

This runs as a Postgres function called via RPC to ensure atomicity.

---

## UI Components

```
app/(protected)/appointments/
  page.tsx              — Calendar view
  [id]/page.tsx         — Appointment detail

components/appointments/
  AppointmentCalendar.tsx  — Main calendar grid
  AppointmentSlot.tsx      — Individual slot on calendar
  BookingModal.tsx         — Create/edit appointment form
  StatusBadge.tsx          — Colour-coded status indicator
  ProviderFilter.tsx       — Filter by provider
```

---

## Acceptance Criteria

- [ ] Calendar: day view and week view (default)
- [ ] Provider filter: single provider or all
- [ ] Create appointment: patient, provider, treatment type, duration, chair, notes
- [ ] Drag-and-drop reschedule with confirmation dialog
- [ ] Double-booking prevention (hard block; admin soft override)
- [ ] Appointment statuses: scheduled → confirmed → arrived → in_chair → completed / no_show / cancelled
- [ ] Status changes logged with timestamp and actor
- [ ] Realtime updates: another user's status change appears without page refresh

---

## Dev Checklist

- [ ] All acceptance criteria verified in staging
- [ ] Double-booking prevention tested with concurrent requests (race condition test)
- [ ] Realtime subscription tested with two browsers open
- [ ] This doc updated with final implementation notes
- [ ] PRD F-003 status updated to "Shipped: v0.2.0"
- [ ] CHANGELOG.md updated

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-14 | Initial spec created | Kodplex Product |
