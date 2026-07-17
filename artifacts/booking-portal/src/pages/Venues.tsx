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

  const available = visibleVenues.filter((v: any) => v.status === 'Available').length;
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
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: '#C9981F' }}>
            {role === 'facilities' ? 'Management' : 'Campus spaces'}
          </p>
          <h1 className="page-title">{role === 'facilities' ? 'Venue management' : 'Venues'}</h1>
          <p className="text-muted text-sm mt-2">Real-time availability across all campus venues.</p>
        </div>
        <Link to="/calendar" className="btn-secondary self-start sm:self-auto">
          <CalendarDays className="w-4 h-4" aria-hidden="true" />
          Open calendar
        </Link>
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-5 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-navy shrink-0" aria-hidden="true" />
          <span className="text-[13px] font-bold text-muted">{available} available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose shrink-0" aria-hidden="true" />
          <span className="text-[13px] font-bold text-muted">{maintenance} under maintenance</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleVenues.map((v: any) => {
          const isAvailable = v.status === 'Available';
          return (
            <div
              key={v.venue_id}
              className="rounded-2xl flex flex-col overflow-hidden"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(10,15,28,0.07), 0 4px 12px rgba(10,15,28,0.06)',
                border: `1px solid ${isAvailable ? '#D0DAE8' : 'rgba(192,51,79,0.2)'}`,
                opacity: isAvailable ? 1 : 0.8,
              }}
            >
              {/* Color bar */}
              <div
                className="h-1.5 w-full shrink-0"
                style={{ background: isAvailable ? 'linear-gradient(90deg, #0F3D73, #164E9A)' : '#C0334F' }}
                aria-hidden="true"
              />

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-bold text-[15px] text-ink leading-tight">{v.venue_name}</h2>
                  <Badge tone={isAvailable ? 'navy' : 'rose'}>{v.status}</Badge>
                </div>

                <div className="flex items-center gap-1.5 text-[12px] text-muted mb-3">
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{v.location}</span>
                </div>

                <dl className="grid grid-cols-2 gap-2 mb-4">
                  <StatPill icon={Users2} label="Capacity" value={String(v.capacity)} />
                  <StatPill icon={Wallet} label="Fee" value={fmtMoney(v.applicable_fees)} />
                  <StatPill icon={CalendarClock} label="Notice" value={`${v.booking_deadline_days} days`} />
                </dl>

                <div className="mt-auto pt-3 border-t border-line flex items-center gap-3">
                  <Link
                    to={`/calendar?venue=${v.venue_id}`}
                    className="text-[12.5px] font-bold text-navy hover:underline underline-offset-2"
                  >
                    Check availability →
                  </Link>
                  {role === 'facilities' && (
                    <button
                      onClick={() => toggleStatus(v)}
                      className="ml-auto flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        background: isAvailable ? '#FDEAEE' : '#E4EDF8',
                        color: isAvailable ? '#C0334F' : '#0F3D73',
                        border: `1px solid ${isAvailable ? 'rgba(192,51,79,0.25)' : 'rgba(15,61,115,0.2)'}`,
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
    <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: '#F2F5FB' }}>
      <Icon className="w-3 h-3 text-muted shrink-0" strokeWidth={2} aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd className="text-[11.5px] font-bold text-ink truncate">{value}</dd>
    </div>
  );
}
