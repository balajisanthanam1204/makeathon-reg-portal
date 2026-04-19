-- ============================================================================
-- Make-a-Thon 7.0 — Final Registration Portal — COMPLETE Database Schema
-- Run this entire file in your Supabase SQL editor (Dashboard > SQL Editor).
--
-- This is a CLEAN-SLATE script: it drops the old tables/policies and recreates
-- everything with auth, role-based admin, draft autosave, and the new fields.
-- ⚠️ Running this will DELETE existing rows in teams/members/audit_log.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Sequence for team numbering (used in unique_member_id)
-- ----------------------------------------------------------------------------
drop sequence if exists team_number_seq;
create sequence team_number_seq start 1 maxvalue 60;

-- ----------------------------------------------------------------------------
-- 2. Drop old objects (clean slate)
-- ----------------------------------------------------------------------------
drop function if exists public.submit_registration(jsonb, jsonb[], text, text) cascade;
drop function if exists public.submit_registration_v2(jsonb, jsonb[], text, text) cascade;
drop table if exists public.audit_log cascade;
drop table if exists public.members cascade;
drop table if exists public.teams cascade;
drop table if exists public.registration_drafts cascade;
drop table if exists public.admin_login_attempts cascade;
drop table if exists public.user_roles cascade;
drop type if exists public.app_role cascade;

-- ----------------------------------------------------------------------------
-- 3. Roles enum + user_roles table (CRITICAL: roles in separate table)
-- ----------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamptz default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security-definer role checker — avoids RLS recursion
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create policy "Admins can view all roles"
  on public.user_roles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Auto-give every new signup the 'user' role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. Admin login lockout table (3 attempts -> 2 hour lock)
-- ----------------------------------------------------------------------------
create table public.admin_login_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  failed_count integer not null default 0,
  locked_until timestamptz,
  last_attempt_at timestamptz default now()
);

alter table public.admin_login_attempts enable row level security;

create policy "Users see their own attempts"
  on public.admin_login_attempts for select to authenticated
  using (user_id = auth.uid());

-- RPC: verify admin pin (call after normal login). Caller must be authenticated.
create or replace function public.admin_verify(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.admin_login_attempts;
  v_correct text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Not signed in');
  end if;

  if not public.has_role(v_uid, 'admin') then
    return jsonb_build_object('ok', false, 'error', 'You are not an admin');
  end if;

  -- ensure row exists
  insert into public.admin_login_attempts (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  select * into v_row from public.admin_login_attempts where user_id = v_uid for update;

  if v_row.locked_until is not null and v_row.locked_until > now() then
    return jsonb_build_object(
      'ok', false,
      'locked', true,
      'locked_until', v_row.locked_until,
      'error', 'Locked. Try again later.'
    );
  end if;

  -- Admin PIN comes from app metadata on the user (set by you via dashboard).
  -- Fall back to env-style hard-coded if not present.
  select coalesce(raw_user_meta_data->>'admin_pin', '0000') into v_correct
  from auth.users where id = v_uid;

  if v_correct = p_pin then
    update public.admin_login_attempts
      set failed_count = 0, locked_until = null, last_attempt_at = now()
      where user_id = v_uid;
    return jsonb_build_object('ok', true);
  else
    update public.admin_login_attempts
      set failed_count = coalesce(failed_count,0) + 1,
          last_attempt_at = now(),
          locked_until = case
            when coalesce(failed_count,0) + 1 >= 3 then now() + interval '2 hours'
            else null
          end
      where user_id = v_uid
      returning * into v_row;
    return jsonb_build_object(
      'ok', false,
      'failed_count', v_row.failed_count,
      'locked', v_row.locked_until is not null,
      'locked_until', v_row.locked_until,
      'error', case when v_row.locked_until is not null
                    then 'Too many wrong attempts. Locked for 2 hours.'
                    else 'Wrong PIN. ' || (3 - v_row.failed_count)::text || ' attempts left.'
               end
    );
  end if;
end;
$$;

grant execute on function public.admin_verify(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Teams (final submitted records)
-- ----------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null unique, -- ONE TEAM PER ACCOUNT
  reference_id text unique not null,
  team_number integer unique not null,

  team_name text not null,
  team_size integer not null check (team_size between 4 and 6),
  is_svce boolean not null default false,
  college_name text,
  category text not null check (category in ('Hardware', 'Software', 'Industry Problem Statement')),

  -- Problem statement (all categories)
  problem_statement_id text,
  problem_statement_name text,
  company_name text, -- only for Industry Problem Statement

  -- Mentor
  mentor_name text not null,
  mentor_designation text,
  mentor_department text,
  mentor_phone text,
  mentor_email text,

  -- Payment (simplified — IFSC/branch dropped)
  payment_transaction_id text not null,
  payment_bank_name text not null,
  payer_name text,
  payer_mobile text,
  amount_paid integer,
  payment_screenshot_url text,

  submission_status text not null default 'pending'
    check (submission_status in ('pending', 'verified', 'rejected')),
  ip_address text,
  user_agent text,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index teams_user_id_idx on public.teams(user_id);
create index teams_status_idx on public.teams(submission_status);

-- ----------------------------------------------------------------------------
-- 6. Members
-- ----------------------------------------------------------------------------
create table public.members (
  id uuid primary key default uuid_generate_v4(),
  unique_member_id text unique not null,
  team_id uuid not null references public.teams(id) on delete cascade,
  member_order integer not null check (member_order between 1 and 6),
  is_leader boolean not null default false,

  full_name text not null,
  department text not null,
  department_other text,                  -- when department = 'Other'
  year_of_study text not null check (year_of_study in ('1st', '2nd', '3rd', '4th')),
  registration_number text,               -- now optional
  phone_number text not null,
  whatsapp_number text,                   -- new
  college_email text not null,
  personal_email text not null,
  photo_url text,
  created_at timestamptz default now(),
  unique (team_id, member_order)
);

create index members_team_id_idx on public.members(team_id);

-- ----------------------------------------------------------------------------
-- 7. Audit log
-- ----------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  event_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 8. Registration drafts (per-user autosave)
-- ----------------------------------------------------------------------------
create table public.registration_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  step integer not null default 1,
  team jsonb not null default '{}'::jsonb,
  members jsonb not null default '[]'::jsonb,
  mentor jsonb not null default '{}'::jsonb,
  payment jsonb not null default '{}'::jsonb,
  problem jsonb not null default '{}'::jsonb,
  photo_paths jsonb not null default '[]'::jsonb,        -- array of storage paths
  payment_screenshot_path text,
  payer jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.registration_drafts enable row level security;

create policy "Users manage own draft (select)"
  on public.registration_drafts for select to authenticated
  using (user_id = auth.uid());

create policy "Users manage own draft (insert)"
  on public.registration_drafts for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users manage own draft (update)"
  on public.registration_drafts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage own draft (delete)"
  on public.registration_drafts for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 9. RLS on teams / members / audit_log
-- ----------------------------------------------------------------------------
alter table public.teams enable row level security;
alter table public.members enable row level security;
alter table public.audit_log enable row level security;

-- Teams: users see own; admins see all
create policy "Users see own team"
  on public.teams for select to authenticated
  using (user_id = auth.uid());

create policy "Admins see all teams"
  on public.teams for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins update teams"
  on public.teams for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Members: users see members of own team; admins see all
create policy "Users see own team members"
  on public.members for select to authenticated
  using (exists (
    select 1 from public.teams t
    where t.id = members.team_id and t.user_id = auth.uid()
  ));

create policy "Admins see all members"
  on public.members for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Audit
create policy "Admins see audit"
  on public.audit_log for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Authenticated insert audit"
  on public.audit_log for insert to authenticated
  with check (true);

-- ----------------------------------------------------------------------------
-- 10. updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists on_teams_updated on public.teams;
create trigger on_teams_updated
  before update on public.teams
  for each row execute function public.handle_updated_at();

drop trigger if exists on_drafts_updated on public.registration_drafts;
create trigger on_drafts_updated
  before update on public.registration_drafts
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 11. Atomic submit_registration RPC — pulls everything from the user's draft
-- ----------------------------------------------------------------------------
create or replace function public.submit_registration(
  p_ip text,
  p_user_agent text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_draft public.registration_drafts;
  v_team jsonb;
  v_mentor jsonb;
  v_payment jsonb;
  v_problem jsonb;
  v_payer jsonb;
  v_members jsonb;
  v_photo_paths jsonb;
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
  v_idx integer;
  v_photo_path text;
  v_team_size integer;
  v_amount integer;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not signed in');
  end if;

  -- Block resubmission
  if exists (select 1 from public.teams where user_id = v_uid) then
    return jsonb_build_object('success', false, 'error', 'You have already submitted a team.');
  end if;

  select * into v_draft from public.registration_drafts where user_id = v_uid;
  if v_draft is null then
    return jsonb_build_object('success', false, 'error', 'No draft found.');
  end if;

  v_team := v_draft.team;
  v_mentor := v_draft.mentor;
  v_payment := v_draft.payment;
  v_problem := v_draft.problem;
  v_payer := v_draft.payer;
  v_members := v_draft.members;
  v_photo_paths := v_draft.photo_paths;
  v_team_size := (v_team->>'team_size')::int;
  v_amount := v_team_size * 350;

  if v_team_size is null or jsonb_array_length(v_members) <> v_team_size then
    return jsonb_build_object('success', false, 'error', 'Member list does not match team size.');
  end if;

  v_team_number := nextval('team_number_seq');
  v_team_number_padded := lpad(v_team_number::text, 2, '0');

  if v_team->>'category' = 'Hardware' then v_category_code := 'hw';
  elsif v_team->>'category' = 'Software' then v_category_code := 'sw';
  else v_category_code := 'is';
  end if;

  v_svce_digit := case when (v_team->>'is_svce')::boolean then '1' else '0' end;

  insert into public.teams (
    user_id, reference_id, team_number, team_name, team_size, is_svce, college_name, category,
    problem_statement_id, problem_statement_name, company_name,
    mentor_name, mentor_designation, mentor_department, mentor_phone, mentor_email,
    payment_transaction_id, payment_bank_name, payer_name, payer_mobile, amount_paid,
    payment_screenshot_url, ip_address, user_agent
  ) values (
    v_uid,
    'MAT7-' || upper(substring(uuid_generate_v4()::text, 1, 8)),
    v_team_number,
    v_team->>'team_name',
    v_team_size,
    (v_team->>'is_svce')::boolean,
    v_team->>'college_name',
    v_team->>'category',
    v_problem->>'problem_statement_id',
    v_problem->>'problem_statement_name',
    v_problem->>'company_name',
    v_mentor->>'mentor_name',
    v_mentor->>'mentor_designation',
    v_mentor->>'mentor_department',
    v_mentor->>'mentor_phone',
    v_mentor->>'mentor_email',
    v_payment->>'payment_transaction_id',
    v_payment->>'payment_bank_name',
    v_payer->>'payer_name',
    v_payer->>'payer_mobile',
    v_amount,
    v_draft.payment_screenshot_path,
    p_ip,
    p_user_agent
  ) returning id, reference_id into v_team_id, v_reference_id;

  v_idx := 0;
  for v_member in select * from jsonb_array_elements(v_members) loop
    v_idx := v_idx + 1;
    v_member_order := v_idx;
    v_unique_member_id := v_category_code || v_svce_digit || v_team_number_padded || v_member_order::text;
    v_photo_path := v_photo_paths->>(v_idx - 1);

    insert into public.members (
      unique_member_id, team_id, member_order, is_leader, full_name,
      department, department_other, year_of_study, registration_number,
      phone_number, whatsapp_number, college_email, personal_email, photo_url
    ) values (
      v_unique_member_id,
      v_team_id,
      v_member_order,
      v_member_order = 1,
      v_member->>'full_name',
      v_member->>'department',
      nullif(v_member->>'department_other',''),
      v_member->>'year_of_study',
      nullif(v_member->>'registration_number',''),
      v_member->>'phone_number',
      nullif(v_member->>'whatsapp_number',''),
      v_member->>'college_email',
      v_member->>'personal_email',
      v_photo_path
    );

    v_member_results := v_member_results || jsonb_build_object(
      'member_order', v_member_order,
      'full_name', v_member->>'full_name',
      'unique_member_id', v_unique_member_id
    );
  end loop;

  insert into public.audit_log (team_id, user_id, event_type, ip_address, user_agent)
  values (v_team_id, v_uid, 'registration_submitted', p_ip, p_user_agent);

  -- Clean up draft
  delete from public.registration_drafts where user_id = v_uid;

  return jsonb_build_object(
    'success', true,
    'reference_id', v_reference_id,
    'team_id', v_team_id,
    'team_number', v_team_number,
    'amount_paid', v_amount,
    'members', v_member_results
  );

exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.submit_registration(text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 12. Storage buckets + policies (auth-required uploads)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('member-photos', 'member-photos', false, 1048576, array['image/jpeg', 'image/png']),
  ('payment-screenshots', 'payment-screenshots', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('payment-qr', 'payment-qr', true, 1048576, array['image/png', 'image/jpeg'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public = excluded.public;

-- Drop old anon policies
drop policy if exists "Anon upload member photos" on storage.objects;
drop policy if exists "Anon upload payment screenshots" on storage.objects;
drop policy if exists "Public read payment QR" on storage.objects;
drop policy if exists "Auth upload member photos" on storage.objects;
drop policy if exists "Auth read own member photos" on storage.objects;
drop policy if exists "Auth upload payment screenshots" on storage.objects;
drop policy if exists "Auth read own payment screenshots" on storage.objects;
drop policy if exists "Admin read all member photos" on storage.objects;
drop policy if exists "Admin read all payment screenshots" on storage.objects;

-- Authenticated users can upload to their own folder (folder name = auth uid)
create policy "Auth upload member photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Auth read own member photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Auth delete own member photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Auth upload payment screenshots" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Auth read own payment screenshots" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Auth delete own payment screenshots" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

-- Admins read everything
create policy "Admin read all member photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'member-photos' and public.has_role(auth.uid(), 'admin'));

create policy "Admin read all payment screenshots" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-screenshots' and public.has_role(auth.uid(), 'admin'));

create policy "Public read payment QR" on storage.objects
  for select to anon, authenticated using (bucket_id = 'payment-qr');

-- ============================================================================
-- POST-INSTALL STEPS:
-- 1. Enable Email/Password auth in Dashboard > Authentication > Providers.
--    (Optionally turn off "Confirm email" for faster testing.)
-- 2. Sign up once via the /signup page in the app.
-- 3. In SQL editor, find your user id:
--      select id, email from auth.users;
-- 4. Promote yourself to admin:
--      insert into public.user_roles (user_id, role)
--      values ('<paste-your-user-id>', 'admin')
--      on conflict do nothing;
-- 5. Set your admin PIN (used by /admin gate):
--      update auth.users
--      set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('admin_pin','1234')
--      where id = '<paste-your-user-id>';
-- 6. Upload your payment QR as `qr.png` to the `payment-qr` storage bucket.
-- ============================================================================
