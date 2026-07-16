-- ============================================================
-- Student Organization Event Approval and Venue Booking Portal
-- Supabase (Postgres) schema
-- Run this in the Supabase SQL editor, top to bottom.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- Reference / lookup ----------

create table email_role_policies (
  policy_id      uuid primary key default uuid_generate_v4(),
  email_pattern  text not null,        -- e.g. '@students.smu.edu.ph' or an exact address
  match_type     text not null check (match_type in ('domain', 'exact')),
  assigned_role  text not null check (assigned_role in ('student', 'dept_head', 'school_admin', 'facilities')),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Seed a starting policy set — edit to match the university's real domains.
insert into email_role_policies (email_pattern, match_type, assigned_role) values
  ('@students.smu.edu.ph', 'domain', 'student'),
  ('@smu.edu.ph', 'domain', 'student'),
  ('@facilities.smu.edu.ph', 'domain', 'facilities'),
  ('deptheads@smu.edu.ph', 'exact', 'dept_head'), -- replace with a real whitelist row per head
  ('admin@smu.edu.ph', 'exact', 'school_admin');

-- ---------- Core directory ----------

create table organizations (
  org_id    uuid primary key default uuid_generate_v4(),
  org_name  text not null,
  org_type  text
);

create table departments (
  department_id    uuid primary key default uuid_generate_v4(),
  department_name  text not null,
  description      text
);

-- One profile row per auth.users row. Role is written ONCE at signup by the
-- trigger below and is never client-writable (see RLS policies).
create table profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  first_name           text,
  last_name            text,
  role                 text not null check (role in ('student', 'dept_head', 'school_admin', 'facilities')),
  org_id               uuid references organizations(org_id),
  department_id        uuid references departments(department_id),
  student_id           text,
  position             text,
  contact_number       text,
  verification_status  text not null default 'Unverified' check (verification_status in ('Verified', 'Unverified')),
  created_at           timestamptz not null default now()
);

-- ---------- Venues & bookings ----------

create table venues (
  venue_id               uuid primary key default uuid_generate_v4(),
  venue_name             text not null,
  location               text,
  capacity               integer not null,
  applicable_fees        numeric(10,2) default 0,
  booking_deadline_days  integer not null default 3,
  status                 text not null default 'Available' check (status in ('Available', 'Under Maintenance', 'Unavailable'))
);

-- Seed the campus venue list — edit capacity/fees/notice period to match reality.
insert into venues (venue_name, capacity, booking_deadline_days) values
  ('Roces Hall', 300, 5),
  ('Sacred Heart Center', 500, 7),
  ('Tonus Gymnasium', 1200, 10),
  ('St. Therese Hall', 250, 5),
  ('Hotel', 150, 7),
  ('Aula Maria Hall', 400, 5),
  ('RT202', 60, 3),
  ('RT303', 60, 3),
  ('AVR1', 80, 3),
  ('AVR2', 80, 3);

create table event_proposals (
  proposal_id           uuid primary key default uuid_generate_v4(),
  org_id                uuid not null references organizations(org_id),
  officer_id            uuid not null references profiles(id),
  venue_id              uuid references venues(venue_id),
  event_title           text not null,
  event_date            date not null,
  start_time            time not null,
  end_time              time not null,
  purpose               text,
  estimated_attendance  integer,
  budget_estimate       numeric(10,2),
  status                text not null default 'Pending' check (
    status in ('Pending', 'Under Review', 'Approved', 'Rejected', 'Needs Revision')
  ),
  date_submitted        timestamptz not null default now()
);

create table proposal_attachments (
  attachment_id  uuid primary key default uuid_generate_v4(),
  proposal_id    uuid not null references event_proposals(proposal_id) on delete cascade,
  file_name      text not null,
  file_type      text,
  storage_path   text not null, -- path in a Supabase Storage bucket, e.g. 'attachments/<proposal_id>/<file>'
  upload_date    timestamptz not null default now()
);

create table venue_bookings (
  booking_id    uuid primary key default uuid_generate_v4(),
  venue_id      uuid not null references venues(venue_id),
  proposal_id   uuid unique references event_proposals(proposal_id),
  booking_date  date not null,
  start_time    time not null,
  end_time      time not null,
  status        text not null default 'Confirmed' check (status in ('Confirmed', 'Cancelled', 'Conflict-Flagged'))
);

create table approval_steps (
  approval_step_id  uuid primary key default uuid_generate_v4(),
  proposal_id       uuid not null references event_proposals(proposal_id) on delete cascade,
  approver_role     text not null check (approver_role in ('dept_head', 'school_admin', 'facilities')),
  approver_id       uuid references profiles(id),
  sequence_order    integer not null,
  status            text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'Revision Requested')),
  remarks           text,
  action_date       timestamptz
);

create table notifications (
  notification_id  uuid primary key default uuid_generate_v4(),
  proposal_id       uuid references event_proposals(proposal_id) on delete cascade,
  recipient_id       uuid not null references profiles(id),
  message            text not null,
  date_sent          timestamptz not null default now(),
  read_status        text not null default 'Unread' check (read_status in ('Read', 'Unread')),
  channel             text not null default 'In-System' check (channel in ('Email', 'In-System'))
);

create table audit_log (
  audit_id          uuid primary key default uuid_generate_v4(),
  approval_step_id  uuid references approval_steps(approval_step_id),
  action_by         uuid references profiles(id),
  action_type       text not null,
  action_date       timestamptz not null default now(),
  details           text
);

-- ============================================================
-- Auto-RBAC: assign a role from email at signup, server-side only
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  matched_role text;
begin
  select assigned_role into matched_role
  from email_role_policies
  where is_active = true
    and (
      (match_type = 'domain' and new.email ilike '%' || email_pattern)
      or (match_type = 'exact' and new.email ilike email_pattern)
    )
  order by match_type = 'exact' desc -- exact match wins over a domain match
  limit 1;

  if matched_role is null then
    raise exception 'No role policy matches email %. Signup blocked.', new.email;
  end if;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, matched_role);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table venues enable row level security;
alter table event_proposals enable row level security;
alter table proposal_attachments enable row level security;
alter table venue_bookings enable row level security;
alter table approval_steps enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;

-- profiles: everyone can read their own row; role column is never updatable by the user
create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "update own contact info only" on profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));

-- venues: readable by anyone signed in; writable by facilities only
create policy "venues readable" on venues for select using (auth.role() = 'authenticated');
create policy "venues writable by facilities" on venues for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'facilities')
);

-- event_proposals: officers see their own; any managerial role sees all
-- open proposals (no stage-lock — any of the three can review at any time)
create policy "students see own proposals" on event_proposals for select using (
  officer_id = auth.uid()
  or exists (
    select 1 from profiles p where p.id = auth.uid()
    and p.role in ('dept_head', 'school_admin', 'facilities')
  )
);
create policy "students create own proposals" on event_proposals for insert with check (
  officer_id = auth.uid()
  and exists (select 1 from profiles where id = auth.uid() and role = 'student')
);

-- approval_steps: the officer who owns the proposal can read decisions and
-- remarks made on it (needed to show "reviewer feedback" when editing a
-- proposal marked Needs Revision); staff can read everything.
create policy "read relevant approval steps" on approval_steps for select using (
  exists (
    select 1 from event_proposals ep
    where ep.proposal_id = approval_steps.proposal_id and ep.officer_id = auth.uid()
  )
  or exists (select 1 from profiles where id = auth.uid() and role in ('dept_head', 'school_admin', 'facilities'))
);

-- notifications: only visible to their recipient
create policy "read own notifications" on notifications for select using (recipient_id = auth.uid());
create policy "update own notifications" on notifications for update using (recipient_id = auth.uid());

-- audit_log: read-only for dept_head/school_admin/facilities, never client-writable
create policy "audit log readable by staff" on audit_log for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('dept_head', 'school_admin', 'facilities'))
);

-- NOTE: approval_steps writes, cross-role notification inserts, and audit_log inserts
-- are intentionally NOT exposed to the client. Those go through the FastAPI service
-- role (backend/) so the routing/notification/audit logic can't be bypassed from the browser.
