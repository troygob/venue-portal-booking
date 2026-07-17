import { useId, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus2, ClipboardCheck, Building2, CalendarDays,
  Bell, LogOut, X, Menu, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, ROLE_LABELS } from '../lib/roles';

const DEMO_ROLES = ['student', 'dept_head', 'school_admin', 'facilities'];
const ICONS: Record<string, React.ComponentType<any>> = {
  '/': LayoutDashboard, '/submit': FilePlus2, '/queue': ClipboardCheck,
  '/venues': Building2, '/calendar': CalendarDays, '/notifications': Bell,
};
const ROLE_COLORS: Record<string, string> = {
  student: '#4ADE80', dept_head: '#60A5FA', school_admin: '#C084FC', facilities: '#FB923C',
};

export default function Sidebar() {
  const { profile, role, signOut, isDemo, switchDemoRole, exitDemo, demoNotifications } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const demoSelectId = useId();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role ?? ''));
  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}` || profile?.email?.[0]?.toUpperCase() || '?';
  const unread = isDemo
    ? demoNotifications.filter((n: any) => n.recipient_id === profile?.id && n.read_status === 'Unread').length
    : 0;

  const content = (
    <div className="flex flex-col h-full">
      {/* Wordmark */}
      <div className="mb-10 px-1">
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#C8961A,#E4AA20)' }}
            aria-hidden="true"
          >
            <Building2 className="w-4 h-4" style={{ color: '#07090F' }} strokeWidth={2.5} />
          </div>
          <span className="text-white text-[13px] font-bold leading-none tracking-tight">Venue &amp; Event Portal</span>
        </div>
        <div
          className="mt-2 h-px"
          style={{ background: 'linear-gradient(90deg,rgba(200,150,26,0.5),transparent)' }}
          aria-hidden="true"
        />
        <p className="mt-2 text-[9.5px] font-bold tracking-[0.2em] uppercase" style={{ color: '#C8961A' }}>
          Saint Mary&apos;s University
        </p>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div
          className="mb-6 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(200,150,26,0.25)', background: 'rgba(200,150,26,0.07)' }}
        >
          <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8961A] animate-pulse" aria-hidden="true" />
              <span className="text-[9px] font-black tracking-[0.18em] uppercase text-[#C8961A]">Demo mode</span>
            </span>
            <button
              onClick={exitDemo}
              className="text-[10px] font-bold underline underline-offset-2 hover:no-underline"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Exit
            </button>
          </div>
          <div className="px-3 pb-3">
            <label htmlFor={demoSelectId} className="sr-only">Switch demo role</label>
            <div className="relative">
              <select
                id={demoSelectId}
                value={role ?? ''}
                onChange={(e) => switchDemoRole(e.target.value)}
                className="w-full appearance-none text-[12.5px] font-bold rounded-xl px-3 py-2 pr-8 text-white"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }}
              >
                {DEMO_ROLES.map((r) => (
                  <option key={r} value={r} style={{ background: '#07090F', color: '#fff' }}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }} aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1" aria-label="Main">
        {items.map((item) => {
          const Icon = ICONS[item.to];
          const isNotif = item.to === '/notifications';
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)}>
              {({ isActive }) => (
                <span
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all duration-150 relative"
                  style={{
                    background: isActive ? 'rgba(200,150,26,0.12)' : 'transparent',
                    color: isActive ? '#E4AA20' : 'rgba(255,255,255,0.55)',
                    fontWeight: isActive ? 700 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
                    }
                  }}
                >
                  {/* Active gold left bar */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                      style={{ height: '60%', background: '#C8961A' }}
                      aria-hidden="true"
                    />
                  )}
                  {Icon && (
                    <Icon
                      className="w-[16px] h-[16px] shrink-0"
                      strokeWidth={isActive ? 2.25 : 1.75}
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex-1 tracking-tight">{item.label}</span>
                  {isNotif && unread > 0 && (
                    <span
                      className="text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                      style={{ background: '#C8961A', color: '#07090F' }}
                      aria-label={`${unread} unread`}
                    >
                      {unread}
                    </span>
                  )}
                  {isActive && <span className="sr-only">(current page)</span>}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile footer */}
      <div
        className="mt-8 pt-5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black shrink-0"
            style={{
              background: role ? ROLE_COLORS[role] + '22' : 'rgba(255,255,255,0.1)',
              border: `1.5px solid ${role ? ROLE_COLORS[role] + '50' : 'rgba(255,255,255,0.15)'}`,
              color: role ? ROLE_COLORS[role] : '#fff',
            }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-bold text-white truncate leading-tight">
              {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : profile?.email}
            </div>
            {role && (
              <div className="text-[10px] font-semibold mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {ROLE_LABELS[role]}
              </div>
            )}
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg hover:bg-white/8 transition-colors shrink-0"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            aria-label={isDemo ? 'Exit demo mode' : 'Sign out'}
            title={isDemo ? 'Exit demo mode' : 'Sign out'}
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 text-white"
        style={{ background: '#07090F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#C8961A,#E4AA20)' }} aria-hidden="true">
            <Building2 className="w-3.5 h-3.5" style={{ color: '#07090F' }} strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-bold tracking-tight">Venue &amp; Event Portal</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Open navigation menu" aria-expanded={mobileOpen}>
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-58 shrink-0 flex-col h-screen sticky top-0 overflow-y-auto px-4 py-6"
        style={{ width: '228px', background: '#07090F', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        aria-label="Main navigation"
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            className="absolute inset-0"
            style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 flex flex-col px-4 py-6 overflow-y-auto"
            style={{ background: '#07090F', borderRight: '1px solid rgba(255,255,255,0.05)' }}
            aria-label="Main navigation"
          >
            <button onClick={() => setMobileOpen(false)} className="self-end p-1.5 rounded-lg hover:bg-white/10 mb-4" style={{ color: 'rgba(255,255,255,0.4)' }} aria-label="Close navigation menu">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
