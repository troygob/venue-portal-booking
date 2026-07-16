# Venue & Event Portal — React + Supabase + Python scaffold

Rebuild of the vanilla-JS prototype (`venue_booking.html` / `styles.css` / `scripts.js`)
onto a real stack, restyled to Saint Mary's University's blue-and-gold visual identity.

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

## UI redesign (this pass)

1. **SMU color system** — replaced the old forest/brass/clay palette with a Marian
   navy-blue + gold + white system (`tailwind.config.js`), matching smu.edu.ph's blue-and-white
   identity with a gold accent drawn from the university emblem. Every text/background pairing
   was checked against WCAG 2.1 contrast minimums (4.5:1 for body text, 3:1 for large text and
   UI component borders) — see the comment above the `colors` block.
2. **Accessibility pass** — status is never color-only (badges carry a dot + text label),
   form inputs use a `field` border shade that clears 3:1 against white, all interactive
   elements keep a visible gold focus ring, the mobile nav drawer traps focus visually and
   restores it, and the new calendar is a proper `role="grid"` with roving-tabindex arrow-key
   navigation, `aria-current="date"`, and a screen-reader-only day summary per cell.
3. **Modernized UI/UX** — new type pairing (Fraunces display / Public Sans body), `lucide-react`
   icons throughout, card elevation via `shadow-card`/`shadow-raised`, a responsive mobile
   sidebar drawer, empty/loading states with icons, and a restyled login screen.
4. **Venue Availability Calendar** (`frontend/src/pages/VenueCalendar.jsx`, route `/calendar`) —
   month-grid view of all venues (or one, via the filter or a `Venues` page deep-link) showing
   which dates already have Pending/Under Review/Approved proposals, with a day-detail list
   below the grid. Wired into both demo mode and the live Supabase data path.

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
