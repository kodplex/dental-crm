# Testing Guide

> Testing strategy for DentFlow AI. Every developer is responsible for the quality of their own code.
> Tests are not optional — they are part of the Definition of Done.

---

## Testing Philosophy

We test **behaviour, not implementation**. A test should answer the question: "Does this do what the user/product expects?" — not "Does this call the right internal function?"

**The testing pyramid:**
```
        ▲
       / \
      / E2E \        (few — happy paths only)
     /───────\
    / Integration\   (some — API routes, DB queries)
   /─────────────\
  /  Unit Tests   \  (many — pure functions, business logic)
 /─────────────────\
```

---

## Test Stack

| Type | Tool | Where |
|------|------|-------|
| Unit | Vitest | `lib/**/__tests__/*.test.ts` |
| Integration | Vitest + Supabase Test | `app/api/**/__tests__/*.test.ts` |
| Component | Vitest + Testing Library | `components/**/__tests__/*.test.tsx` |
| E2E | Playwright | `e2e/*.spec.ts` |

---

## Running Tests

```bash
# All tests
npm test

# Watch mode (during development)
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (requires running dev server)
npm run test:e2e

# Type checking (not tests, but run together)
npm run type-check
```

---

## Unit Tests

### What to unit test

- All functions in `lib/` that contain business logic
- Data transformation functions
- Validation helpers
- AI prompt builders
- Date/time utilities

### What NOT to unit test

- React components with no logic (just rendering)
- Next.js App Router pages (test via integration tests)
- Database queries directly (test via integration tests)
- Third-party library behaviour

### Writing unit tests

```typescript
// lib/utils/__tests__/recall.test.ts
import { describe, it, expect } from 'vitest'
import { calculateRecallDueDate, isRecallOverdue } from '../recall'

describe('calculateRecallDueDate', () => {
  it('adds the recall interval to the last recall date', () => {
    const lastRecall = new Date('2025-11-15')
    const intervalMonths = 6
    
    const due = calculateRecallDueDate(lastRecall, intervalMonths)
    
    expect(due).toEqual(new Date('2026-05-15'))
  })

  it('returns null when no last recall date exists', () => {
    expect(calculateRecallDueDate(null, 6)).toBeNull()
  })

  it('uses 6 months as default interval when not specified', () => {
    const lastRecall = new Date('2025-11-15')
    expect(calculateRecallDueDate(lastRecall)).toEqual(new Date('2026-05-15'))
  })
})

describe('isRecallOverdue', () => {
  it('returns true when due date is in the past', () => {
    const pastDue = new Date('2026-01-01')
    expect(isRecallOverdue(pastDue)).toBe(true)
  })

  it('returns false when due date is in the future', () => {
    const futureDue = new Date('2027-01-01')
    expect(isRecallOverdue(futureDue)).toBe(false)
  })

  it('returns false when due date is null', () => {
    expect(isRecallOverdue(null)).toBe(false)
  })
})
```

---

## Integration Tests

Integration tests verify that API routes work correctly end-to-end, including database interactions.

### Setup

We use a separate Supabase test instance (separate from staging). The test database is reset before each test run.

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    environment: 'node',
  }
})

// tests/setup.ts
import { beforeAll, afterAll } from 'vitest'
import { resetTestDatabase } from './helpers/db'

beforeAll(async () => {
  await resetTestDatabase()
})
```

### Writing integration tests

```typescript
// app/api/patients/__tests__/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestClient, createTestClinic, createTestUser } from '@/tests/helpers'

describe('POST /api/patients', () => {
  let clinicId: string
  let authToken: string

  beforeEach(async () => {
    const { clinic, user, token } = await createTestClinic()
    clinicId = clinic.id
    authToken = token
  })

  it('creates a patient with valid data', async () => {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.first_name).toBe('Jane')
    expect(data.clinic_id).toBe(clinicId)
  })

  it('returns 400 when first_name is missing', async () => {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ last_name: 'Smith' }),
    })
    
    expect(response.status).toBe(400)
  })

  it('returns 401 without authentication', async () => {
    const response = await fetch('/api/patients', {
      method: 'POST',
      body: JSON.stringify({ first_name: 'Jane', last_name: 'Smith' }),
    })
    
    expect(response.status).toBe(401)
  })

  it('cannot create patients for a different clinic (RLS)', async () => {
    const { token: otherToken } = await createTestClinic()
    // otherToken belongs to a different clinic
    // Even if they pass a different clinic_id, RLS should scope the insert
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${otherToken}` },
      body: JSON.stringify({ first_name: 'Jane', last_name: 'Smith', clinic_id: clinicId }),
    })
    
    // Should succeed but create in the authenticated user's clinic, not the provided one
    const data = await response.json()
    expect(data.clinic_id).not.toBe(clinicId)
  })
})
```

---

## Component Tests

```typescript
// components/patients/__tests__/PatientCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { PatientCard } from '../PatientCard'

const mockPatient = {
  id: 'abc-123',
  first_name: 'Jane',
  last_name: 'Smith',
  phone: '+91 98765 43210',
  last_recall_date: '2025-11-15',
}

describe('PatientCard', () => {
  it('displays patient name', () => {
    render(<PatientCard patient={mockPatient} onSelect={vi.fn()} />)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('calls onSelect with patient id when clicked', async () => {
    const onSelect = vi.fn()
    render(<PatientCard patient={mockPatient} onSelect={onSelect} />)
    
    await userEvent.click(screen.getByRole('button', { name: /Jane Smith/i }))
    
    expect(onSelect).toHaveBeenCalledWith('abc-123')
  })

  it('shows recall overdue badge when recall is overdue', () => {
    const overduePatient = { ...mockPatient, last_recall_date: '2024-01-01' }
    render(<PatientCard patient={overduePatient} onSelect={vi.fn()} />)
    
    expect(screen.getByText(/recall overdue/i)).toBeInTheDocument()
  })
})
```

---

## Coverage Requirements

| Code Area | Minimum Coverage |
|-----------|-----------------|
| `lib/` (utilities, AI helpers) | 85% |
| `app/api/` (API routes) | 70% |
| `components/` (UI components) | 50% |
| Overall | 65% |

Run `npm run test:coverage` to check. CI fails if coverage drops below minimums.

---

## E2E Tests (Playwright)

E2E tests cover the most critical user flows only. They are slow and brittle — use them sparingly.

**What to E2E test:**
- Login → Dashboard
- Create patient → View patient
- Book appointment → See on calendar
- Generate AI summary

```typescript
// e2e/patient-flow.spec.ts
import { test, expect } from '@playwright/test'

test('clinic staff can create and find a patient', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'staff@testclinic.com')
  await page.fill('[name=password]', process.env.E2E_TEST_PASSWORD!)
  await page.click('button[type=submit]')

  await page.waitForURL('/dashboard')

  await page.click('[href="/patients"]')
  await page.click('text=New Patient')
  
  await page.fill('[name=first_name]', 'E2E')
  await page.fill('[name=last_name]', 'TestPatient')
  await page.fill('[name=phone]', '+91 99999 00000')
  await page.click('button[type=submit]')

  await expect(page.locator('text=E2E TestPatient')).toBeVisible()
})
```

---

## Test Data & Fixtures

- Never use real patient names or real clinic data in tests
- Use factories in `tests/factories/` to generate consistent test data
- E2E tests use a dedicated test Supabase project (separate from staging)
- Seed data for E2E in `tests/e2e/seed.ts`

---

*When you add a new feature, add tests in the same PR. When you fix a bug, add a test that would have caught it.*
