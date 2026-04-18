-- ============================================================================
-- Make-a-Thon 7.0 — Final Registration Portal — Database Schema
-- Run this entire file in your Supabase SQL editor.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- Sequence drives the [TT] portion of unique_member_id
create sequence if not exists team_number_seq start 1 maxvalue 60;

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  reference_id text unique not null,
  team_number integer unique not null,
  team_name text not null,
  team_size integer not null check (team_size between 4 and 6),
  is_svce boolean not null default false,
  college_name text,
  category text not null check (category in ('Hardware', 'Software', 'Industry Problem Statement')),
  mentor_name text not null,
  mentor_department text,
  mentor_phone text,
  mentor_email text,
  payment_transaction_id text not null,
  payment_bank_name text not null,
  payment_ifsc_code text not null,
  payment_branch_name text not null,
  payment_branch_code text not null,
  payment_screenshot_url text,
  submission_status text not null default 'pending' check (submission_status in ('pending', 'verified', 'rejected')),
  ip_address text,
  user_agent text,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.members (
  id uuid primary key default uuid_generate_v4(),
  unique_member_id text unique not null,
  team_id uuid not null references public.teams(id) on delete cascade,
  member_order integer not null check (member_order between 1 and 6),
  is_leader boolean not null default false,
  full_name text not null,
  department text not null,
  year_of_study text not null check (year_of_study in ('1st', '2nd', '3rd', '4th')),
  registration_number text not null,
  college_name text not null,
  phone_number text not null,
  college_email text not null,
  personal_email text not null,
  photo_url text,
  created_at timestamptz default now(),
  unique (team_id, member_order)
);

create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id),
  event_type text not null,
  event_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_teams_updated on public.teams;
create trigger on_teams_updated
  before update on public.teams
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- ATOMIC REGISTRATION RPC
-- ============================================================================

create or replace function public.submit_registration(
  p_team jsonb,
  p_members jsonb[],
  p_ip text,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_reference_id text;
  v_team_number integer;
  v_team_number_padded text;
  v_category_code text;
  v_svce_digit text;
  v_member jsonb;
  v_member_order integer;
  v_unique_member_id text;
  v_member_results jsonb := '[]'::jsonb;
begin
  v_team_number := nextval('team_number_seq');
  v_team_number_padded := lpad(v_team_number::text, 2, '0');

  if p_team->>'category' = 'Hardware' then
    v_category_code := 'hw';
  elsif p_team->>'category' = 'Software' then
    v_category_code := 'sw';
  else
    v_category_code := 'is';
  end if;

  if (p_team->>'is_svce')::boolean then
    v_svce_digit := '1';
  else
    v_svce_digit := '0';
  end if;

  insert into public.teams (
    reference_id, team_number, team_name, team_size, is_svce, college_name, category,
    mentor_name, mentor_department, mentor_phone, mentor_email,
    payment_transaction_id, payment_bank_name, payment_ifsc_code,
    payment_branch_name, payment_branch_code, payment_screenshot_url,
    ip_address, user_agent
  ) values (
    'MAT7-' || upper(substring(uuid_generate_v4()::text, 1, 8)),
    v_team_number,
    p_team->>'team_name',
    (p_team->>'team_size')::int,
    (p_team->>'is_svce')::boolean,
    p_team->>'college_name',
    p_team->>'category',
    p_team->>'mentor_name',
    p_team->>'mentor_department',
    p_team->>'mentor_phone',
    p_team->>'mentor_email',
    p_team->>'payment_transaction_id',
    p_team->>'payment_bank_name',
    p_team->>'payment_ifsc_code',
    p_team->>'payment_branch_name',
    p_team->>'payment_branch_code',
    p_team->>'payment_screenshot_url',
    p_ip,
    p_user_agent
  ) returning id, reference_id into v_team_id, v_reference_id;

  foreach v_member in array p_members loop
    v_member_order := (v_member->>'member_order')::int;
    v_unique_member_id := v_category_code || v_svce_digit || v_team_number_padded || v_member_order::text;

    insert into public.members (
      unique_member_id, team_id, member_order, is_leader, full_name, department,
      year_of_study, registration_number, college_name,
      phone_number, college_email, personal_email, photo_url
    ) values (
      v_unique_member_id,
      v_team_id,
      v_member_order,
      (v_member->>'is_leader')::boolean,
      v_member->>'full_name',
      v_member->>'department',
      v_member->>'year_of_study',
      v_member->>'registration_number',
      v_member->>'college_name',
      v_member->>'phone_number',
      v_member->>'college_email',
      v_member->>'personal_email',
      v_member->>'photo_url'
    );

    v_member_results := v_member_results || jsonb_build_object(
      'member_order', v_member_order,
      'full_name', v_member->>'full_name',
      'unique_member_id', v_unique_member_id
    );
  end loop;

  insert into public.audit_log (team_id, event_type, ip_address, user_agent)
  values (v_team_id, 'registration_submitted', p_ip, p_user_agent);

  return jsonb_build_object(
    'success', true,
    'reference_id', v_reference_id,
    'team_id', v_team_id,
    'team_number', v_team_number,
    'members', v_member_results
  );

exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.submit_registration(jsonb, jsonb[], text, text) to anon;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.teams enable row level security;
alter table public.members enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "Allow anonymous insert on teams" on public.teams;
drop policy if exists "No public read on teams" on public.teams;
drop policy if exists "Allow anonymous insert on members" on public.members;
drop policy if exists "No public read on members" on public.members;
drop policy if exists "Allow insert on audit log" on public.audit_log;

create policy "Allow anonymous insert on teams" on public.teams for insert to anon with check (true);
create policy "No public read on teams" on public.teams for select to anon using (false);
create policy "Allow anonymous insert on members" on public.members for insert to anon with check (true);
create policy "No public read on members" on public.members for select to anon using (false);
create policy "Allow insert on audit log" on public.audit_log for insert to anon with check (true);

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('member-photos', 'member-photos', false, 5242880, array['image/jpeg', 'image/png']),
  ('payment-screenshots', 'payment-screenshots', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('payment-qr', 'payment-qr', true, 1048576, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "Anon upload member photos" on storage.objects;
drop policy if exists "Anon upload payment screenshots" on storage.objects;
drop policy if exists "Public read payment QR" on storage.objects;

create policy "Anon upload member photos" on storage.objects for insert to anon with check (bucket_id = 'member-photos');
create policy "Anon upload payment screenshots" on storage.objects for insert to anon with check (bucket_id = 'payment-screenshots');
create policy "Public read payment QR" on storage.objects for select to anon using (bucket_id = 'payment-qr');
