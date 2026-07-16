import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { NAV_ITEMS, ROLE_LABELS } from '../lib/roles'

const DEMO_ROLES = ['student', 'dept_head', 'school_admin', 'facilities']

export default function Sidebar() {
  const { profile, role, signOut, isDemo, switchDemoRole, exitDemo } = useAuth()
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))
  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}` || profile?.email?.[0]?.toUpperCase()

  return (
    <aside className="w-[232px] shrink-0 bg-forest-deep p-5 flex flex-col text-white" aria-label="Main navigation">
      <div className="text-lg font-semibold">Venue &amp; Event Portal</div>
      <div className="text-brass text-[11px] tracking-wide mb-5">Saint Mary&apos;s University</div>

      {isDemo && (
        <div className="bg-brass/[0.15] border border-brass/40 rounded-lg px-3.5 py-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-brass font-bold tracking-wide">DEMO MODE</div>
            <button
              onClick={exitDemo}
              className="text-[11px] text-[#CFE0D5] underline underline-offset-2 hover:text-white"
            >
              Exit
            </button>
          </div>
          <label htmlFor="demo-role-switch" className="sr-only">Switch demo role</label>
          <select
            id="demo-role-switch"
            value={role}
            onChange={(e) => switchDemoRole(e.target.value)}
            className="w-full text-xs rounded-md px-2 py-1.5 bg-white/90 text-forest-deep font-semibold"
          >
            {DEMO_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white/[0.06] rounded-lg px-3.5 py-3 mb-5">
        <div className="text-[10px] text-brass font-bold tracking-wide mb-2">SIGNED IN AS</div>
        <div className="flex items-center gap-2">
          <div className="w-[30px] h-[30px] rounded-full bg-brass flex items-center justify-center text-forest-deep font-bold text-xs shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold">{profile?.first_name ? `${profile.first_name} ${profile.last_name}` : profile?.email}</div>
            {/* Role is display-only — it was assigned automatically from the
                sign-up email and cannot be changed here (except in demo mode). */}
            <div className="text-[#9FB4A6] text-xs">{ROLE_LABELS[role]}</div>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-lg text-sm font-medium ${
                isActive ? 'bg-brass text-forest-deep font-semibold' : 'text-[#CFE0D5] hover:bg-white/[0.06]'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={signOut}
        className="mt-auto text-[#9FB4A6] text-xs text-left pt-5 hover:text-white underline-offset-2 hover:underline"
      >
        {isDemo ? 'Exit demo mode' : 'Sign out'}
      </button>
    </aside>
  )
}
