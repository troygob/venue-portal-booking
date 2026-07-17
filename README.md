# Venue & Event Portal — Saint Mary's University

A live, clickable demo of an end-to-end campus venue and event booking system for Saint Mary's University (Philippines). Four user roles move a proposal from submission through department approval, school admin sign-off, and final facilities confirmation — all in one traceable workflow.

> **Demo mode is fully self-contained.** No account, database, or backend credentials are required. Everything runs on in-memory sample data that resets when you re-enter demo mode.

---

## Screenshots

| Login | Dashboard | Approval Queue |
|---|---|---|
| Split-screen hero with gold gradient headline and role cards | Animated stat counters + staggered proposal list | Collapsible proposal cards with inline approval progress |

---

## Features

### Four roles, one workflow

| Role | What they do |
|---|---|
| **Student Leader** | Submit event proposals, track status, resubmit after revision |
| **Department Head** | Review proposals, approve or request revision with remarks |
| **School Admin** | Final administrative sign-off before facilities confirmation |
| **Facilities Manager** | Confirm venue availability, toggle venue maintenance status |

### Pages

- **Dashboard** — role-specific stat cards with animated counters; recent activity list
- **Submit Proposal** — full proposal form with capacity validation and edit/resubmit flow
- **Approval Queue** — collapsible proposal cards, multi-step approval tracker, inline remarks
- **Venues** — grid of campus venues with real-time availability status toggle (Facilities Manager)
- **Availability Calendar** — month grid with dot indicators; day-detail time-block view
- **Notifications** — relative timestamps, unread gold tint, mark-all-read

### Design system

- **Palette:** Obsidian (`#07090F`) sidebar · Marian navy blue · Gold (`#C8961A`) accent · Warm parchment surfaces (`#FEFCF9`)
- **Fonts:** Fraunces (display) · Public Sans (body) · IBM Plex Mono (timestamps/mono)
- **Animations:** Page transitions on every route change · Staggered entrance on all lists and grids · Ease-out cubic number counters on stat cards · Card hover lifts · All animations respect `prefers-reduced-motion`
- **Accessible:** Skip-to-content link · `aria-live` regions · `aria-label` on all icon buttons · Keyboard-navigable calendar grid

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v4 (`@theme` tokens, plain CSS components) |
| Routing | React Router v6 |
| Icons | Lucide React |
| Auth (real mode) | Supabase Auth (no-op stub in demo mode) |
| Database (real mode) | Supabase PostgreSQL (bypassed in demo mode) |
| Monorepo | pnpm workspaces |

---

## Getting started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9

### Install

```bash
pnpm install
```

### Run the dev server

```bash
pnpm --filter @workspace/booking-portal run dev
```

The portal is served at the path configured in `BASE_PATH` (set automatically on Replit; defaults to `/booking-portal` locally if you set it yourself).

### Build

```bash
pnpm run build
```

---

## Demo mode

Click any of the four role cards on the login screen — no email or password needed.

| Role card | Signs you in as |
|---|---|
| Student Leader | Pepito Manaloto, Org President |
| Department Head | John Jacinto, Student Affairs |
| School Admin | Corazon Cruz, System Administrator |
| Facilities Manager | Ben Benito, Facilities Manager |

All actions (submit, approve, reject, toggle venue status, mark notifications read) update shared in-memory state, so changes made as one role are visible when you switch to another. State resets when you exit demo mode and re-enter.

---

## Project structure

```
artifacts/booking-portal/
├── src/
│   ├── components/
│   │   ├── Badge.tsx          # Status pill badges
│   │   ├── PageTransition.tsx # Route-change fade animation
│   │   └── Sidebar.tsx        # Obsidian nav with gold active indicator
│   ├── context/
│   │   └── AuthContext.tsx    # Auth provider — real Supabase + demo mode
│   ├── hooks/
│   │   └── useCounter.ts      # Ease-out cubic animated number counter
│   ├── lib/
│   │   ├── demoData.ts        # All in-memory sample data
│   │   └── roles.ts           # Role labels, nav items, currency formatter
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── SubmitProposal.tsx
│   │   ├── ApprovalQueue.tsx
│   │   ├── Venues.tsx
│   │   ├── VenueCalendar.tsx
│   │   └── Notifications.tsx
│   ├── supabaseClient.ts      # No-op stub (real client when env vars present)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css              # Design tokens, keyframes, component classes
└── package.json
```

---

## Connecting a real backend

The app switches between demo mode and live Supabase automatically based on whether `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.

1. Create a Supabase project and set up the schema (tables: `profiles`, `event_proposals`, `venues`, `approval_steps`, `notifications`)
2. Add the environment variables to your deployment environment
3. Remove the `isDemo` guard branches — or keep them as a permanent demo/staging path

---

## License

MIT
