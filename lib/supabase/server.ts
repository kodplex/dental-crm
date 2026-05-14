import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

/**
 * Creates a Supabase client for use in Server Components and API Routes.
 *
 * This client reads the user's session from cookies, so RLS policies
 * apply based on the authenticated user.
 *
 * For admin operations that need to bypass RLS, use createAdminClient()
 * in server-side API routes only — NEVER in components.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cookies can only be set in middleware or route handlers
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase admin client that bypasses RLS.
 *
 * USE WITH EXTREME CAUTION. Only for:
 * - Server-side operations that legitimately need to cross clinic boundaries
 * - Webhook handlers
 * - Background jobs
 *
 * NEVER use in client components or expose via API routes accessible without auth.
 */
export function createAdminClient() {
  // Intentionally not async — this is a synchronous operation
  // The service role key check happens at module load time
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin client')
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
