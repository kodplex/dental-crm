# Feature: AI Clinical Summaries & Insights

> **PRD Reference:** F-005  
> **Target Release:** v0.3.0  
> **Status:** Planned  
> **GitHub Issue:** #7  

---

## Overview

AI-powered clinical summaries let dentists review a patient's complete history in seconds before entering the operatory. This is the flagship AI feature and differentiates DentFlow AI from traditional CRMs.

---

## What Gets Built

1. "Summarise Patient" button on patient profile and appointment view
2. Streaming AI summary with structured sections
3. AI generation audit log
4. Clinic-level AI on/off toggle in settings

---

## Prompt Design

All prompts live in `lib/ai/prompts.ts`.

The patient summary prompt receives:
- Patient demographics (no full name — use initials for privacy in prompts)
- Appointment history (last 24 months)
- Treatment plan items (outstanding)
- Allergy and medical history flags
- Last X-ray date, last hygiene date

The summary output is structured markdown:
```
## Today's Visit Context
[Chief concern or scheduled treatment]

## Recent Treatments (12 months)
[Bulleted list of procedures]

## Outstanding Treatment Plan
[Prioritised list of pending items]

## Clinical Flags
[Allergies, medications, medical conditions relevant to dental treatment]

## Overdue Care
[Overdue hygiene, X-rays, recalls]

## Suggested Chair-Side Topics
[Questions for the dentist to consider raising]
```

---

## Security & Privacy

- Patient names are sent to OpenAI — this is unavoidable for personalised summaries
- Clinics must agree to AI data processing terms before enabling AI features
- All AI calls are logged in `ai_generations` table
- Summaries are never auto-saved — dentist must explicitly confirm before any content persists

---

## Dev Checklist

- [ ] Streaming response works end-to-end
- [ ] AI features can be disabled per clinic
- [ ] All generations logged in `ai_generations`
- [ ] Graceful degradation when OpenAI is unavailable
- [ ] This doc updated after implementation
- [ ] PRD F-005 status updated to "Shipped: v0.3.0"

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-14 | Initial spec created | Kodplex Product |
