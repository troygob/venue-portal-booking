-- ============================================================
-- Migration for an EXISTING project (schema.sql already applied once).
-- Run this in the Supabase SQL editor. Safe to run once.
-- ============================================================

-- 1. Drop the stage-lock column — approvals are no longer routed through
--    a fixed dept_head -> school_admin -> facilities sequence.
alter table event_proposals drop column if exists current_stage;

-- 2. Replace the proposals visibility policy: any managerial role now sees
--    every open proposal, not just ones routed to their stage.
drop policy if exists "students see own proposals" on event_proposals;
create policy "students see own proposals" on event_proposals for select using (
  officer_id = auth.uid()
  or exists (
    select 1 from profiles p where p.id = auth.uid()
    and p.role in ('dept_head', 'school_admin', 'facilities')
  )
);

-- 3. New read policy for approval_steps so students can see reviewer
--    remarks on their own proposal (needed for the "edit & resubmit" flow).
drop policy if exists "read relevant approval steps" on approval_steps;
create policy "read relevant approval steps" on approval_steps for select using (
  exists (
    select 1 from event_proposals ep
    where ep.proposal_id = approval_steps.proposal_id and ep.officer_id = auth.uid()
  )
  or exists (select 1 from profiles where id = auth.uid() and role in ('dept_head', 'school_admin', 'facilities'))
);

-- 4. Seed the campus venue list, only if venues is currently empty —
--    remove this guard and edit the values if you want to add these
--    alongside venues you already created manually.
insert into venues (venue_name, capacity, booking_deadline_days)
select * from (values
  ('Roces Hall', 300, 5),
  ('Sacred Heart Center', 500, 7),
  ('Tonus Gymnasium', 1200, 10),
  ('St. Therese Hall', 250, 5),
  ('Hotel', 150, 7),
  ('Aula Maria Hall', 400, 5),
  ('RT202', 60, 3),
  ('RT303', 60, 3),
  ('AVR1', 80, 3),
  ('AVR2', 80, 3)
) as v(venue_name, capacity, booking_deadline_days)
where not exists (select 1 from venues);
