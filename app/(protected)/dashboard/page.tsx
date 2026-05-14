import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Dashboard Page
 *
 * The main landing page for authenticated clinic staff.
 * Shows today's appointments, recent patients, and key KPIs.
 *
 * Data is fetched server-side for performance and SEO.
 *
 * PRD Reference: Supports F-001 (Auth) and provides scaffolding for F-002+
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the user's clinic memberships
  const { data: memberships } = await supabase
    .from('clinic_memberships')
    .select('clinic_id, role, clinics(id, name, timezone)')
    .eq('user_id', user.id)

  const clinics = memberships?.map((m) => m.clinics).filter(Boolean) ?? []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Good morning 👋
      </h1>

      {clinics.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <h2 className="text-lg font-medium text-gray-900">No clinics yet</h2>
          <p className="text-sm text-gray-500 mt-1">
            You are not a member of any clinic. Ask your clinic owner to add you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KPI cards will be added in v0.2.0 (Feature F-002, F-003) */}
          <KPICard label="Today's Appointments" value="—" />
          <KPICard label="Patients Overdue for Recall" value="—" />
          <KPICard label="Outstanding Treatment Plans" value="—" />
        </div>
      )}
    </div>
  )
}

function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
