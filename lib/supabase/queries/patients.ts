import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Patient = Database['public']['Tables']['patients']['Row']
type PatientInsert = Database['public']['Tables']['patients']['Insert']

/**
 * Fetch paginated patient list for a clinic.
 * Search uses pg_trgm fuzzy matching on first_name + last_name.
 * Results exclude archived patients by default.
 *
 * PRD: F-002 — results must appear within 300ms for up to 10,000 records
 */
export async function listPatients(
  supabase: SupabaseClient<Database>,
  options: {
    search?: string
    page?: number
    perPage?: number
    includeArchived?: boolean
  } = {}
) {
  const { search, page = 1, perPage = 50, includeArchived = false } = options
  const offset = (page - 1) * perPage

  let query = supabase
    .from('patients')
    .select('id, first_name, last_name, phone, email, date_of_birth, last_recall_date, recall_interval_months, archived_at', {
      count: 'exact',
    })
    .order('last_name', { ascending: true })
    .range(offset, offset + perPage - 1)

  if (!includeArchived) {
    query = query.is('archived_at', null)
  }

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query
  if (error) throw new Error(`Failed to list patients: ${error.message}`)
  return { patients: data ?? [], total: count ?? 0 }
}

/**
 * Fetch a single patient by ID.
 * Returns null if the patient does not exist or is not accessible.
 */
export async function getPatient(
  supabase: SupabaseClient<Database>,
  patientId: string
): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .maybeSingle()

  if (error) throw new Error(`Failed to fetch patient: ${error.message}`)
  return data
}

/**
 * Create a new patient record.
 */
export async function createPatient(
  supabase: SupabaseClient<Database>,
  clinicId: string,
  input: Omit<PatientInsert, 'clinic_id'>
): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert({ ...input, clinic_id: clinicId })
    .select()
    .single()

  if (error) throw new Error(`Failed to create patient: ${error.message}`)
  return data
}

/**
 * Soft-delete a patient by setting archived_at.
 */
export async function archivePatient(
  supabase: SupabaseClient<Database>,
  patientId: string
): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', patientId)
    .is('archived_at', null)

  if (error) throw new Error(`Failed to archive patient: ${error.message}`)
}
