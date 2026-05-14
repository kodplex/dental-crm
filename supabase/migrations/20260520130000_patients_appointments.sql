-- =============================================================================
-- Migration: 20260520130000_patients_appointments.sql
-- Purpose: Creates patients and appointments tables with full RLS
-- Author: Kodplex Engineering
-- Release: v0.1.0 (schema foundation) — data loaded in v0.2.0
-- Depends on: 20260520120000_initial_schema.sql
-- =============================================================================

-- =============================================================================
-- Patients
-- =============================================================================
create table if not exists patients (
  id                      uuid primary key default gen_random_uuid(),
  clinic_id               uuid not null references clinics(id) on delete cascade,
  first_name              text not null,
  last_name               text not null,
  date_of_birth           date,
  email                   text,
  phone                   text,
  address                 jsonb,       -- { street, city, state, postal_code, country }
  emergency_contact_name  text,
  emergency_contact_phone text,
  medical_history         text,
  allergies               text[],
  recall_interval_months  int not null default 6,
  last_recall_date        date,
  notes                   text,
  archived_at             timestamptz, -- null = active patient
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid references auth.users(id)
);

-- Indexes for common queries
create index patients_clinic_id_idx on patients(clinic_id);
create index patients_last_name_trgm_idx on patients using gin(last_name gin_trgm_ops);
create index patients_first_name_trgm_idx on patients using gin(first_name gin_trgm_ops);
create index patients_phone_idx on patients(phone);
create index patients_recall_idx on patients(clinic_id, last_recall_date) where archived_at is null;

alter table patients enable row level security;

create policy "clinic_members_select_patients"
  on patients for select
  using (clinic_id in (select clinic_id from clinic_memberships where user_id = auth.uid()));

create policy "clinic_members_insert_patients"
  on patients for insert
  with check (clinic_id in (select clinic_id from clinic_memberships where user_id = auth.uid()));

create policy "clinic_members_update_patients"
  on patients for update
  using (clinic_id in (select clinic_id from clinic_memberships where user_id = auth.uid()));

-- Soft-delete: only owners/admins can archive
create policy "clinic_admins_archive_patients"
  on patients for update
  using (
    clinic_id in (
      select clinic_id from clinic_memberships
      where user_id = auth.uid() and role in ('owner', 'admin', 'front_desk')
    )
  );

-- =============================================================================
-- Appointments
-- =============================================================================
create type appointment_status as enum (
  'scheduled', 'confirmed', 'arrived', 'in_chair', 'completed', 'no_show', 'cancelled'
);

create table if not exists appointments (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics(id) on delete cascade,
  patient_id      uuid not null references patients(id) on delete cascade,
  provider_id     uuid not null references auth.users(id),
  treatment_type  text,
  chair           text,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  status          appointment_status not null default 'scheduled',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),

  constraint valid_duration check (ends_at > starts_at)
);

create index appointments_clinic_date_idx on appointments(clinic_id, starts_at);
create index appointments_provider_date_idx on appointments(provider_id, starts_at);
create index appointments_patient_idx on appointments(patient_id);
create index appointments_status_idx on appointments(clinic_id, status);

alter table appointments enable row level security;

create policy "clinic_members_select_appointments"
  on appointments for select
  using (clinic_id in (select clinic_id from clinic_memberships where user_id = auth.uid()));

create policy "clinic_members_insert_appointments"
  on appointments for insert
  with check (clinic_id in (select clinic_id from clinic_memberships where user_id = auth.uid()));

create policy "clinic_members_update_appointments"
  on appointments for update
  using (clinic_id in (select clinic_id from clinic_memberships where user_id = auth.uid()));

-- =============================================================================
-- AI Generation Log
-- =============================================================================
create table if not exists ai_generations (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics(id),
  user_id             uuid not null references auth.users(id),
  patient_id          uuid references patients(id),
  generation_type     text not null,
  model               text not null,
  prompt_tokens       int,
  completion_tokens   int,
  latency_ms          int,
  created_at          timestamptz not null default now()
);

alter table ai_generations enable row level security;

create policy "clinic_admins_select_ai_log"
  on ai_generations for select
  using (
    clinic_id in (
      select clinic_id from clinic_memberships
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );
