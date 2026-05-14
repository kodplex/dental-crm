-- =============================================================================
-- Migration: 20260520120000_initial_schema.sql
-- Purpose: Creates the foundational schema for DentFlow AI
--          Includes: organizations, clinics, profiles, clinic_memberships
-- Author: Kodplex Engineering
-- Release: v0.1.0
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for fuzzy patient search

-- =============================================================================
-- Organizations (top-level entity for multi-clinic groups)
-- =============================================================================
create table if not exists organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table organizations enable row level security;

-- =============================================================================
-- Clinics (individual locations)
-- =============================================================================
create table if not exists clinics (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references organizations(id) on delete cascade,
  name          text not null,
  address       text,
  timezone      text not null default 'Asia/Kolkata',
  phone         text,
  email         text,
  ai_enabled    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table clinics enable row level security;

-- =============================================================================
-- Profiles (extends auth.users)
-- =============================================================================
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  avatar_url    text,
  updated_at    timestamptz not null default now()
);

alter table profiles enable row level security;

-- Profiles are visible to the user themselves
create policy "users_select_own_profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users_update_own_profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================================================
-- Clinic Memberships (users ↔ clinics many-to-many with roles)
-- =============================================================================
create table if not exists clinic_memberships (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references clinics(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('owner', 'admin', 'dentist', 'front_desk')),
  created_at    timestamptz not null default now(),
  unique (clinic_id, user_id)
);

alter table clinic_memberships enable row level security;

-- Users can see their own memberships
create policy "users_select_own_memberships"
  on clinic_memberships for select
  using (auth.uid() = user_id);

-- Clinic owners/admins can manage memberships
create policy "admins_manage_memberships"
  on clinic_memberships for all
  using (
    clinic_id in (
      select clinic_id from clinic_memberships
      where user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- =============================================================================
-- RLS for Clinics
-- =============================================================================
create policy "clinic_members_select_clinic"
  on clinics for select
  using (
    id in (
      select clinic_id from clinic_memberships
      where user_id = auth.uid()
    )
  );

create policy "clinic_owners_update_clinic"
  on clinics for update
  using (
    id in (
      select clinic_id from clinic_memberships
      where user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- =============================================================================
-- Audit Log (immutable — no UPDATE or DELETE policies)
-- =============================================================================
create table if not exists audit_log (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid references clinics(id),
  user_id       uuid references auth.users(id),
  table_name    text not null,
  record_id     uuid,
  action        text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_values    jsonb,
  new_values    jsonb,
  created_at    timestamptz not null default now()
);

alter table audit_log enable row level security;

-- Clinic members can read audit log; nobody can write directly
create policy "clinic_members_select_audit_log"
  on audit_log for select
  using (
    clinic_id in (
      select clinic_id from clinic_memberships
      where user_id = auth.uid()
    )
  );

-- Audit log is written by server-side functions only (service role)
