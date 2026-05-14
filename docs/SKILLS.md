# Agent Skills Catalogue — DentFlow AI

> This file catalogues the capabilities an AI agent operating in this repository has demonstrated or is expected to develop. It is a living document — update it when new skills are validated or deprecated.
>
> **Developers:** When you teach an AI agent a new pattern (e.g., how to write a Supabase migration, how to use the AI streaming endpoint), document it here so future agents and developers can replicate it.

---

## Skill Levels

| Level | Meaning |
|-------|---------|
| `verified` | Skill has been demonstrated and reviewed by a human |
| `in-progress` | Skill is being developed or tested |
| `planned` | Skill identified but not yet implemented |
| `deprecated` | Skill replaced by newer approach |

---

## Category: Database & Supabase

### SK-DB-001: Write a database migration
**Status:** `verified` | **First demonstrated:** v0.1.0

An agent can write a correctly structured Supabase migration file:

```sql
-- Migration: 20260520120000_add_patients_table.sql
-- Purpose: Creates the patients table with clinic-scoped RLS
-- Author: Agent (claude-sonnet-4-6)
-- Reviewed: [human reviewer name]

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

-- Enable RLS
alter table patients enable row level security;

-- Policy: clinic members can see their clinic's patients
create policy "clinic_members_select_patients"
  on patients for select
  using (
    clinic_id in (
      select clinic_id from clinic_memberships
      where user_id = auth.uid()
    )
  );

-- Policy: clinic members can insert patients for their clinic
create policy "clinic_members_insert_patients"
  on patients for insert
  with check (
    clinic_id in (
      select clinic_id from clinic_memberships
      where user_id = auth.uid()
    )
  );
```

**Key requirements checked:**
- File named with `YYYYMMDDHHmmss_` prefix
- Comment block with purpose, author, reviewer
- `clinic_id` foreign key on every patient-data table
- RLS enabled with appropriate policies
- Uses `gen_random_uuid()` for primary keys

---

### SK-DB-002: Query with Supabase client
**Status:** `verified` | **First demonstrated:** v0.1.0

Agent knows the correct client to use in each context:

```typescript
// Server component or API route — use server client
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Client component — use browser client
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

Query patterns:
```typescript
// Fetch with clinic scoping (RLS handles this, but explicit is clearer)
const { data, error } = await supabase
  .from('patients')
  .select('id, first_name, last_name, phone, email')
  .eq('archived_at', null)
  .order('last_name', { ascending: true })
  .limit(50)

if (error) throw new Error(`Failed to fetch patients: ${error.message}`)
```

---

### SK-DB-003: Write and use RPC functions
**Status:** `in-progress`

For complex queries that would require multiple round trips, agent can write Postgres functions called via Supabase RPC.

---

## Category: Next.js App Router

### SK-NEXT-001: Server Component data fetching
**Status:** `verified` | **First demonstrated:** v0.1.0

```typescript
// app/(protected)/patients/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PatientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .is('archived_at', null)
    .order('last_name')

  if (error) throw error

  return <PatientList patients={patients} />
}
```

---

### SK-NEXT-002: API Route with validation
**Status:** `verified` | **First demonstrated:** v0.1.0

```typescript
// app/api/patients/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreatePatientSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  date_of_birth: z.string().date().optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = CreatePatientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('patients')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
```

---

## Category: AI Integration

### SK-AI-001: Streaming AI response with Vercel AI SDK
**Status:** `in-progress` | **Target:** v0.3.0

```typescript
// app/api/ai/patient-summary/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { PATIENT_SUMMARY_PROMPT } from '@/lib/ai/prompts'

export async function POST(request: Request) {
  const { patientId } = await request.json()
  
  // Fetch patient data
  const supabase = await createClient()
  const patientContext = await buildPatientContext(supabase, patientId)

  const result = await streamText({
    model: openai('gpt-4o-2024-11-20'),
    system: PATIENT_SUMMARY_PROMPT,
    messages: [{ role: 'user', content: patientContext }],
    maxTokens: 1000,
  })

  return result.toDataStreamResponse()
}
```

---

### SK-AI-002: Write AI prompts
**Status:** `in-progress`

All prompts live in `lib/ai/prompts.ts`. Each prompt must:
- Have a constant name in SCREAMING_SNAKE_CASE
- Have a JSDoc comment explaining its purpose
- Be tested with at least 3 example inputs before shipping

---

## Category: Testing

### SK-TEST-001: Write a Vitest unit test
**Status:** `verified`

```typescript
// lib/ai/__tests__/prompts.test.ts
import { describe, it, expect } from 'vitest'
import { buildPatientContext } from '../utils'

describe('buildPatientContext', () => {
  it('includes patient name in context', () => {
    const context = buildPatientContext({
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '1985-03-15',
    })
    expect(context).toContain('Jane Smith')
  })

  it('redacts PHI from context when flag set', () => {
    const context = buildPatientContext(mockPatient, { redactPHI: true })
    expect(context).not.toContain('Jane Smith')
    expect(context).not.toContain('1985-03-15')
  })
})
```

---

## Skill Gaps (Known)

The following skills are not yet demonstrated and should be validated before relying on them:

| Skill | Description | Priority |
|-------|-------------|---------|
| SK-TEST-002 | Integration tests with Supabase test instance | High |
| SK-DB-003 | Complex RPC functions | Medium |
| SK-AI-003 | Multi-turn conversation with tool use | High |
| SK-INFRA-001 | Vercel environment variable management via CLI | Medium |

---

*When you develop a new skill pattern, add it here. Include a working code example. Update the status when reviewed by a human.*
