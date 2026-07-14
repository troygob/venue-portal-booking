# Venue & Event Portal — React + Supabase + Python scaffold

Rebuild of the vanilla-JS prototype (`venue_booking.html` / `styles.css` / `scripts.js`)
onto a real stack, keeping the same forest/brass/clay visual identity.

## How the pieces fit together

- **Supabase** (`supabase/schema.sql`) — Postgres tables matching the ERD, Supabase Auth
  for login, and a database trigger that assigns each new account's `role` from its email
  address against `email_role_policies` — the "auto-RBAC" you asked for. Row Level Security
  policies mean the React app can talk to Supabase directly for reads and simple writes,
  and a signed-in user can never see or touch another role's data even if the frontend had a bug.
- **FastAPI** (`backend/`) — handles the workflow logic RLS can't express safely: submitting
  a proposal (capacity/deadline/conflict checks), and advancing a proposal through the
  approval sequence (writing `approval_steps`, `audit_log`, and `notifications` together).
  It uses the Supabase *service role* key, so every route re-checks the caller's real,
  server-assigned role before doing anything.
- **React** (`frontend/`, Vite + Tailwind) — the UI. Sidebar navigation and page access are
  both driven from the same `NAV_ITEMS` role list, so a role never sees a menu item it can't
  use. Baseline HCI/accessibility choices are built in: visible focus rings, `prefers-reduced-motion`
  support, a skip-to-content link, inline form validation with `role="alert"`/`role="status"`
  messaging, and error prevention (e.g. the capacity check fires before submit, not after a rejection).

## Setup

1. **Supabase**: create a project, open the SQL editor, paste and run `supabase/schema.sql`.
   Edit the seed rows in `email_role_policies` to match your university's real email domains
   before anyone signs up.
2. **Backend**:
   ```
   cd backend
   pip install -r requirements.txt
   cp .env.example .env   # fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   uvicorn main:app --reload
   ```
3. **Frontend**:
   ```
   cd frontend
   npm install
   cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   npm run dev
   ```

## What's a starting point vs. done

Wired up and functional: auth + auto role assignment, dashboard, submit proposal (with
live capacity/conflict checks), approval queue (approve/reject/request revision), venues
(with facilities-only status toggle), notifications.

Left for you to extend: file attachments (wire to Supabase Storage — `proposal_attachments.storage_path`
already anticipates this), the activity/audit log page (the `audit_log` table and API writes
exist; there's no page reading it yet), and email delivery for `channel = 'Email'` notifications
(currently only logged to the table — plug in Supabase's SMTP integration or a provider like Resend).
