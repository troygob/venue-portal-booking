import { useId, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus2, ClipboardCheck, Building2, CalendarDays,
  Bell, LogOut, X, Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, ROLE_LABELS } from '../lib/roles';

const DEMO_ROLES = ['student', 'dept_head', 'school_admin', 'facilities'];

const ICONS: Record<string, React.ComponentType<any>> = {
  '/': LayoutDashboard,
  '/submit': FilePlus2,
  '/queue': ClipboardCheck,
  '/venues': Building2,
  '/calendar': CalendarDays,
  '/notifications': Bell,
};

export default function Sidebar() {
  const { profile, role, signOut, isDemo, switchDemoRole, exitDemo } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const demoSelectId = useId();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role ?? ''));
  const initials =
    `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}` ||
    profile?.email?.[0]?.toUpperCase() ||
    '?';

  const content = (
    <>
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center shrink-0" aria-hidden="true">
          <Building2 className="w-5 h-5 text-navy-deep" strokeWidth={2.25} />
        </div>
        <div>
          <div className="text-[15px] font-semibold leading-tight">Venue &amp; Event Portal</div>
          <div className="text-gold text-[11px] font-medium tracking-wide leading-tight">Saint Mary&apos;s University</div>
        </div>
      </div>

      {isDemo && (
        <div className="bg-gold-soft border border-gold rounded-lg px-3.5 py-3 mb-4" style={{ background: 'rgba(201,162,39,0.15)', borderColor: 'rgba(201,162,39,0.4)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-gold font-bold tracking-wide">DEMO MODE</div>
            <button
              onClick={exitDemo}
              className="text-[11px] text-white/80 underline underline-offset-2 hover:text-white rounded"
            >
              Exit
            </button>
          </div>
          <label htmlFor={demoSelectId} className="sr-only">Switch demo role</label>
          <select
            id={demoSelectId}
            value={role ?? ''}
            onChange={(e) => switchDemoRole(e.target.value)}
            className="w-full text-xs rounded-md px-2 py-1.5 bg-white text-navy-deep font-semibold border border-transparent"
            style={{ outline: 'none' }}
          >
            {DEMO_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-lg px-3.5 py-3 mb-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="text-[10px] text-gold font-bold tracking-wide mb-2">SIGNED IN AS</div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-navy-deep font-bold text-xs shrink-0" aria-hidden="true">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : profile?.email}
            </div>
            <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {role ? ROLE_LABELS[role] : ''}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1" aria-label="Main">
        {items.map((item) => {
          const Icon = ICONS[item.to];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gold text-navy-deep font-semibold shadow-sm'
                    : 'hover:bg-white/[0.08] hover:text-white'
                }`
              }
              style={({ isActive }) => ({ color: isActive ? '#0A2C54' : 'rgba(255,255,255,0.8)' })}
            >
              {({ isActive }) => (
                <>
                  {Icon && <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} aria-hidden="true" />}
                  {item.label}
                  {isActive && <span className="sr-only">(current page)</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={signOut}
        className="flex items-center gap-2 text-sm text-left pt-5 mt-auto hover:text-white rounded-md transition-colors"
        style={{ color: 'rgba(255,255,255,0.65)' }}
      >
        <LogOut className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
        {isDemo ? 'Exit demo mode' : 'Sign out'}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-navy-deep text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gold flex items-center justify-center" aria-hidden="true">
            <Building2 className="w-4 h-4 text-navy-deep" strokeWidth={2.25} />
          </div>
          <span className="text-sm font-semibold">Venue &amp; Event Portal</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md hover:bg-white/10"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-[248px] shrink-0 bg-navy-deep p-5 flex-col text-white h-screen sticky top-0 overflow-y-auto"
        aria-label="Main navigation"
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            className="absolute inset-0"
            style={{ background: 'rgba(22,35,59,0.5)' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-navy-deep p-5 flex flex-col text-white overflow-y-auto"
            aria-label="Main navigation"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="self-end p-1.5 -mt-1 -mr-1 mb-2 rounded-md hover:bg-white/10"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
