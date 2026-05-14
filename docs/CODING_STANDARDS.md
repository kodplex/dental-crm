# Coding Standards

> These are the non-negotiable conventions for DentFlow AI.
> They exist because consistency reduces cognitive load — every file feels familiar, every PR is easier to review.
>
> If you think a rule is wrong, open a PR to change it with justification. Do not simply ignore it.

---

## TypeScript

### Always

- Use TypeScript for all new files. No `.js` files in `app/`, `components/`, or `lib/`.
- Type all function parameters and return values explicitly for exported functions.
- Use `type` for object shapes that will not be extended; use `interface` for shapes that will.
- Use `unknown` instead of `any` when a type is truly unknown; then narrow it.
- Prefer `const` over `let`. Never use `var`.

### Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Variables, functions | `camelCase` | `patientId`, `fetchAppointments` |
| Components | `PascalCase` | `PatientCard`, `AppointmentCalendar` |
| Types and Interfaces | `PascalCase` | `Patient`, `AppointmentStatus` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_FILE_SIZE_MB`, `DEFAULT_RECALL_MONTHS` |
| Files: components | `PascalCase.tsx` | `PatientCard.tsx` |
| Files: utilities | `kebab-case.ts` | `date-utils.ts`, `format-phone.ts` |
| Files: pages (App Router) | `page.tsx`, `layout.tsx` | as required by Next.js |
| Database columns | `snake_case` | `first_name`, `clinic_id` |
| Supabase table names | `snake_case`, plural | `patients`, `appointments` |

### Nullability

```typescript
// Bad — accessing potentially null value
const name = patient.first_name.toUpperCase()

// Good — check first
const name = patient.first_name?.toUpperCase() ?? 'Unknown'

// Bad — using non-null assertion without justification
const user = getUser()!

// Good — assert with comment when you are certain
// User is guaranteed non-null here because middleware redirected unauthenticated requests
const user = getUser()!
```

---

## React & Next.js

### Component structure

Every component file follows this order:

```typescript
// 1. Imports (external → internal → relative)
import { useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { PatientCard } from '@/components/patients/PatientCard'
import type { Patient } from '@/types'

// 2. Types (local to this file)
type Props = {
  patients: Patient[]
  onSelect: (id: string) => void
}

// 3. Constants (local to this file)
const MAX_VISIBLE = 50

// 4. Component
export function PatientList({ patients, onSelect }: Props) {
  // 4a. Hooks (always at top)
  const [filter, setFilter] = useState('')
  
  // 4b. Derived values
  const visible = patients.slice(0, MAX_VISIBLE)
  
  // 4c. Handlers
  function handleFilterChange(value: string) {
    setFilter(value)
  }
  
  // 4d. Render
  return (
    <div>
      {visible.map(patient => (
        <PatientCard key={patient.id} patient={patient} onSelect={onSelect} />
      ))}
    </div>
  )
}
```

### Server vs Client components

```typescript
// Default to Server Components — no 'use client' directive
// Add 'use client' only when you need:
//   - useState, useEffect, useReducer
//   - Browser APIs (window, document)
//   - Event handlers that need interactivity
//   - Third-party libraries that require browser context

'use client'  // ← only when necessary

export function InteractiveCalendar() { ... }
```

### Data fetching

- Fetch data in Server Components or API routes, not in client components
- Use `loading.tsx` and `error.tsx` files for route-level loading/error states
- For client-side data that updates, use SWR or Tanstack Query patterns

---

## Error Handling

### API routes

Every API route must handle errors explicitly:

```typescript
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('patients').select('*')
    
    if (error) {
      console.error('[patients:GET]', error.message)  // Log internally
      return NextResponse.json(
        { error: 'Failed to load patients' },  // Generic message to client
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (err) {
    console.error('[patients:GET] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Never expose internal details in error responses

```typescript
// Bad — exposes internal implementation
return NextResponse.json({ error: error.message }, { status: 500 })
// error.message might be: "column 'patient_namee' does not exist"

// Good — generic client message, internal logging
console.error('[context]', error)
return NextResponse.json({ error: 'Failed to load patient data' }, { status: 500 })
```

### PHI in logs

```typescript
// NEVER log patient-identifiable information
console.log('Processing patient:', patient.first_name, patient.date_of_birth)  // BAD

// Log IDs only
console.log('Processing patient:', patient.id)  // GOOD
```

---

## Database

- All Supabase queries use the type-safe client: import types from `@/types/database.types`
- Never use `.single()` without checking the error — it throws if 0 or 2+ rows found
- Use `.maybeSingle()` when 0 rows is a valid result
- All mutations must verify the user has permission before proceeding (RLS enforces this, but explicit checks add defence-in-depth)
- Migrations: one migration per logical change, never edit existing migrations

---

## CSS / Tailwind

- Use Tailwind utility classes; do not write custom CSS unless absolutely necessary
- Group related utilities: layout → spacing → typography → colour → state
  ```tsx
  // Good — grouped
  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
  
  // Bad — random order
  className="text-white hover:bg-blue-700 flex px-4 bg-blue-600 py-2 font-medium gap-2 items-center text-sm"
  ```
- Extract repeated class combinations into components, not CSS files
- Use semantic colour names from the design token system, not hardcoded hex values

---

## Testing

Full guide: [docs/TESTING.md](TESTING.md). Quick rules:

- Unit test all pure functions in `lib/`
- Test edge cases: empty arrays, null values, network errors
- Test names must describe behaviour, not implementation:
  - Good: `"returns empty array when no patients found"`
  - Bad: `"tests fetchPatients function"`
- Never test implementation details (private methods, internal state)
- Mock Supabase at the module level, not in individual tests

---

## Comments

```typescript
// Good — explains WHY, not WHAT
// Supabase RLS already scopes this to the user's clinic,
// but we add an explicit check here to catch misuse of the service client
if (patient.clinic_id !== user.clinic_id) throw new Error('Access denied')

// Bad — explains WHAT (already obvious from the code)
// Set the filter to the input value
setFilter(inputValue)

// Good — documents a non-obvious constraint
// FDI tooth notation: upper right quadrant = 1x, upper left = 2x,
// lower left = 3x, lower right = 4x. Tooth #11 = upper right first incisor.
const toothQuadrant = Math.floor(toothNumber / 10)
```

---

## Linting & Formatting

- ESLint config: `.eslintrc` in root — do not add `// eslint-disable` without a comment explaining why
- Prettier is configured — run `npm run format` before committing
- Husky pre-commit hook runs lint-staged — fix lint errors before committing
- TypeScript strict mode is enabled — no `@ts-ignore` without an explaining comment

---

## Environment Variables

- All new environment variables must be added to `.env.example` with a placeholder and comment
- Server-only secrets never have the `NEXT_PUBLIC_` prefix
- Document what each variable is for in `.env.example`

```env
# .env.example
# Supabase project URL (found in Supabase dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase service role key — NEVER expose this client-side
# Used only in server-side API routes for admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI API key for AI features (F-005+)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...
```

---

*These standards evolve. When the team agrees on a change, update this document in the same PR.*
