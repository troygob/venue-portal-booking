import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users2, MapPin, Wallet, CalendarClock, CalendarDays, Wrench } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import { fmtMoney } from '../lib/roles';

export default function Venues() {
  const { role, isDemo, demoVenues, setDemoVenues } = useAuth();
  const [venues, setVenues] = useState<any[]>([]);

  useEffect(() => {
    if (!isDemo) supabase.from('venues').select('*').order('venue_name').then(({ data }: any) => setVenues(data ?? []));
  }, [isDemo]);

  const visibleVenues = isDemo
    ? [...demoVenues].sort((a: any, b: any) => a.venue_name.localeCompare(b.venue_name))
    : [...venues].sort((a: any, b: any) => a.venue_name.localeCompare(b.venue_name));

  const available   = visibleVenues.filter((v: any) => v.status === 'Available').length;
  const maintenance = visibleVenues.filter((v: any) => v.status !== 'Available').length;

  async function toggleStatus(v: any) {
    const next = v.status === 'Available' ? 'Under Maintenance' : 'Available';
    if (isDemo) {
      setDemoVenues((prev: any[]) => prev.map((x: any) => (x.venue_id === v.venue_id ? { ...x, status: next } : x)));
      return;
    }
    const { error } = await supabase.from('venues').update({ status: next }).eq('venue_id', v.venue_id);
    if (!error) setVenues((prev: any[]) => prev.map((x: any) => (x.venue_id === v.venue_id ? { ...x, status: next } : x)));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div className="anim-fade-up">
          <div className="eyebrow">{role === 'facilities' ? 'Management' : 'Campus spaces'}</div>
          <h1 className="page-title">{role === 'facilities' ? 'Venue management' : 'Venues'}</h1>
          <p className="text-sm mt-2" style={{ color: '#6B7385' }}>Real-time availability across all campus venues.</p>
        </div>
        <Link to="/calendar" className="btn-secondary self-start sm:self-auto anim-fade-up" style={{ '--anim-delay': '60ms' } as any}>
          <CalendarDays className="w-4 h-4" aria-hidden="true" />
          Open calendar
        </Link>
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-5 mb-6 anim-fade-up" style={{ '--anim-delay': '80ms' } as any}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#103F7A' }} aria-hidden="true" />
          <span className="text-[13px] font-bold" style={{ color: '#6B7385' }}>{available} available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#BD2F4A' }} aria-hidden="true" />
          <span className="text-[13px] font-bold" style={{ color: '#6B7385' }}>{maintenance} under maintenance</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleVenues.map((v: any, i: number) => {
          const isAvailable = v.status === 'Available';
          return (
            <div
              key={v.venue_id}
              className="rounded-2xl flex flex-col overflow-hidden anim-fade-up"
              style={{
                background: '#FEFCF9',
                boxShadow: '0 1px 3px rgba(12,17,29,0.06), 0 4px 12px rgba(12,17,29,0.06)',
                border: `1px solid ${isAvailable ? '#E0D9CF' : 'rgba(189,47,74,0.18)'}`,
                opacity: isAvailable ? 1 : 0.85,
                transition: 'box-shadow 220ms ease, transform 220ms ease, opacity 220ms ease',
                '--anim-delay': `${120 + i * 55}ms`,
              } as any}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(12,17,29,0.11), 0 2px 6px rgba(12,17,29,0.06)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(12,17,29,0.06), 0 4px 12px rgba(12,17,29,0.06)';
                (e.currentTarget as HTMLElement).style.transform = '';
              }}
            >
              {/* Color bar */}
              <div
                className="h-[3px] w-full shrink-0"
                style={{ background: isAvailable ? 'linear-gradient(90deg,#103F7A,#1A56A8)' : '#BD2F4A' }}
                aria-hidden="true"
              />

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-bold text-[15px] text-[#0C111D] leading-tight">{v.venue_name}</h2>
                  <Badge tone={isAvailable ? 'navy' : 'rose'}>{v.status}</Badge>
                </div>

                <div className="flex items-center gap-1.5 text-[12px] mb-3" style={{ color: '#6B7385' }}>
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{v.location}</span>
                </div>

                <dl className="grid grid-cols-2 gap-2 mb-4">
                  <StatPill icon={Users2}     label="Capacity" value={String(v.capacity)} />
                  <StatPill icon={Wallet}     label="Fee"      value={fmtMoney(v.applicable_fees)} />
                  <StatPill icon={CalendarClock} label="Notice" value={`${v.booking_deadline_days} days`} />
                </dl>

                <div className="mt-auto pt-3 flex items-center gap-3" style={{ borderTop: '1px solid #EDE8E2' }}>
                  <Link
                    to={`/calendar?venue=${v.venue_id}`}
                    className="text-[12.5px] font-bold hover:underline underline-offset-2"
                    style={{ color: '#103F7A' }}
                  >
                    Check availability →
                  </Link>
                  {role === 'facilities' && (
                    <button
                      onClick={() => toggleStatus(v)}
                      className="ml-auto flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
                      style={{
                        background: isAvailable ? '#FCEAEE' : '#E6EFF8',
                        color: isAvailable ? '#BD2F4A' : '#103F7A',
                        border: `1px solid ${isAvailable ? 'rgba(189,47,74,0.2)' : 'rgba(16,63,122,0.15)'}`,
                      }}
                    >
                      <Wrench className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                      {isAvailable ? 'Set maintenance' : 'Set available'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: React.ComponentType<any>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5" style={{ background: '#F0EDE8' }}>
      <Icon className="w-3 h-3 shrink-0" strokeWidth={2} style={{ color: '#6B7385' }} aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd className="text-[11.5px] font-bold text-[#0C111D] truncate">{value}</dd>
    </div>
  );
}
