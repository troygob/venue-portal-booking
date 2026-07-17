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
  '/': LayoutDashboard,
  '/submit': FilePlus2,
  '/queue': ClipboardCheck,
  '/venues': Building2,
  '/calendar': CalendarDays,
  '/notifications': Bell,
};

const ROLE_COLORS: Record<string, string> = {
  student: '#22C55E',
  dept_head: '#3B82F6',
  school_admin: '#A855F7',
  facilities: '#F97316',
};

export default function Sidebar() {
  const { profile, role, signOut, isDemo, switchDemoRole, exitDemo, demoNotifications } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const demoSelectId = useId();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role ?? ''));
  const initials =
    `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}` ||
    profile?.email?.[0]?.toUpperCase() || '?';

  const unreadCount = isDemo
    ? demoNotifications.filter((n: any) => n.recipient_id === profile?.id && n.read_status === 'Unread').length
    : 0;

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #C9981F 0%, #E8AE23 100%)' }}
          aria-hidden="true"
        >
          <Building2 className="w-[18px] h-[18px] text-ink" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[13px] font-bold leading-tight tracking-tight text-white">
            Venue &amp; Event Portal
          </div>
          <div className="text-[10px] font-semibold tracking-widest uppercase leading-tight mt-0.5" style={{ color: '#C9981F' }}>
            Saint Mary&apos;s University
          </div>
        </div>
      </div>

      {/* Demo mode banner */}
      {isDemo && (
        <div
          className="mb-5 rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(201,152,31,0.3)', background: 'rgba(201,152,31,0.08)' }}
        >
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                style={{ background: '#C9981F' }}
                aria-hidden="true"
              />
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#C9981F' }}>
                Demo mode
              </span>
            </div>
            <button
              onClick={exitDemo}
              className="text-[11px] font-semibold underline underline-offset-2 hover:no-underline rounded"
              style={{ color: 'rgba(255,255,255,0.5)' }}
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
                className="w-full appearance-none text-[13px] font-bold rounded-lg px-3 py-2 pr-8 text-white"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  outline: 'none',
                }}
              >
                {DEMO_ROLES.map((r) => (
                  <option key={r} value={r} style={{ background: '#0A0F1C', color: '#fff' }}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1" aria-label="Main">
        {items.map((item) => {
          const Icon = ICONS[item.to];
          const isNotif = item.to === '/notifications';
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
            >
              {({ isActive }) => (
                <span
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-150"
                  style={{
                    background: isActive ? '#C9981F' : 'transparent',
                    color: isActive ? '#0A0F1C' : 'rgba(255,255,255,0.65)',
                    boxShadow: isActive ? '0 4px 12px rgba(201,152,31,0.35)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)';
                  }}
                >
                  {Icon && <Icon className="w-[17px] h-[17px] shrink-0" strokeWidth={isActive ? 2.5 : 1.75} aria-hidden="true" />}
                  <span className="flex-1">{item.label}</span>
                  {isNotif && unreadCount > 0 && (
                    <span
                      className="text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                      style={{ background: isActive ? '#0A0F1C' : '#C9981F', color: isActive ? '#C9981F' : '#0A0F1C' }}
                      aria-label={`${unreadCount} unread`}
                    >
                      {unreadCount}
                    </span>
                  )}
                  {isActive && <span className="sr-only">(current page)</span>}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile */}
      <div
        className="mt-6 rounded-xl p-3.5 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black shrink-0"
          style={{ background: '#C9981F', color: '#0A0F1C' }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-white truncate leading-tight">
            {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : profile?.email}
          </div>
          {role && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: ROLE_COLORS[role] ?? '#C9981F' }}
                aria-hidden="true"
              />
              <span className="text-[11px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {ROLE_LABELS[role]}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={signOut}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label={isDemo ? 'Exit demo mode' : 'Sign out'}
          title={isDemo ? 'Exit demo mode' : 'Sign out'}
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <LogOut className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 text-white"
        style={{ background: '#0A0F1C', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9981F 0%, #E8AE23 100%)' }}
            aria-hidden="true"
          >
            <Building2 className="w-3.5 h-3.5 text-ink" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-bold">Venue &amp; Event Portal</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-60 shrink-0 flex-col h-screen sticky top-0 overflow-y-auto p-5"
        style={{ background: '#0A0F1C', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        aria-label="Main navigation"
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            className="absolute inset-0"
            style={{ background: 'rgba(10,15,28,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 flex flex-col p-5 overflow-y-auto"
            style={{ background: '#0A0F1C', borderRight: '1px solid rgba(255,255,255,0.05)' }}
            aria-label="Main navigation"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="self-end p-1.5 rounded-lg hover:bg-white/10 mb-4"
              style={{ color: 'rgba(255,255,255,0.5)' }}
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
