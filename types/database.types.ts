/**
 * Database types for DentFlow AI
 *
 * Generated from Supabase schema. Run `npm run generate-types` to regenerate.
 * Do not edit manually — your changes will be overwritten.
 *
 * To regenerate:
 *   npx supabase gen types typescript --project-id your-project-ref > types/database.types.ts
 */

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'arrived'
  | 'in_chair'
  | 'completed'
  | 'no_show'
  | 'cancelled'

export type UserRole = 'owner' | 'admin' | 'dentist' | 'front_desk'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      clinics: {
        Row: {
          id: string
          org_id: string | null
          name: string
          address: string | null
          timezone: string
          phone: string | null
          email: string | null
          ai_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          name: string
          address?: string | null
          timezone?: string
          phone?: string | null
          email?: string | null
          ai_enabled?: boolean
        }
        Update: Partial<Database['public']['Tables']['clinics']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Insert'], 'id'>>
      }
      clinic_memberships: {
        Row: {
          id: string
          clinic_id: string
          user_id: string
          role: UserRole
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          user_id: string
          role: UserRole
          created_at?: string
        }
        Update: Partial<Pick<Database['public']['Tables']['clinic_memberships']['Insert'], 'role'>>
      }
      patients: {
        Row: {
          id: string
          clinic_id: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          email: string | null
          phone: string | null
          address: Record<string, string> | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          medical_history: string | null
          allergies: string[] | null
          recall_interval_months: number
          last_recall_date: string | null
          notes: string | null
          archived_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          clinic_id: string
          first_name: string
          last_name: string
          date_of_birth?: string | null
          email?: string | null
          phone?: string | null
          address?: Record<string, string> | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_history?: string | null
          allergies?: string[] | null
          recall_interval_months?: number
          last_recall_date?: string | null
          notes?: string | null
        }
        Update: Partial<Omit<Database['public']['Tables']['patients']['Insert'], 'clinic_id'>>
      }
      appointments: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string
          provider_id: string
          treatment_type: string | null
          chair: string | null
          starts_at: string
          ends_at: string
          status: AppointmentStatus
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_id: string
          provider_id: string
          treatment_type?: string | null
          chair?: string | null
          starts_at: string
          ends_at: string
          status?: AppointmentStatus
          notes?: string | null
        }
        Update: Partial<Omit<Database['public']['Tables']['appointments']['Insert'], 'clinic_id' | 'patient_id'>>
      }
    }
  }
}
