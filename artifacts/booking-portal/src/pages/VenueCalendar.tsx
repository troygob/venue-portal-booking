import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Users, FilePlus2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Badge, { statusTone } from '../components/Badge';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const OCCUPYING_STATUSES = ['Pending', 'Under Review', 'Approved'];

function toKey(d: Date): string { return d.toISOString().slice(0, 10); }
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function monthLabel(d: Date): string { return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
function buildGrid(monthDate: Date): Date[] {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export default function VenueCalendar() {
  const { role, isDemo, demoVenues, demoProposals } = useAuth();
  const [searchParams] = useSearchParams();
  const [venues, setVenues] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueFilter, setVenueFilter] = useState(() => searchParams.get('venue') ?? 'all');
  const [monthDate, setMonthDate] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState(() => toKey(new Date()));
  const [focused, setFocused] = useState(() => toKey(new Date()));
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (isDemo) { setVenues(demoVenues); setProposals(demoProposals.filter((p: any) => OCCUPYING_STATUSES.includes(p.status))); setLoading(false); return; }
    async function load() {
      const [{ data: v }, { data: p }] = await Promise.all([
        supabase.from('venues').select('*').order('venue_name'),
        supabase.from('event_proposals').select('*').in('status', OCCUPYING_STATUSES),
      ]);
      setVenues((v as any) ?? []); setProposals((p as any) ?? []); setLoading(false);
    }
    load();
  }, [isDemo, demoVenues, demoProposals]);

  const sortedVenues = useMemo(() => [...venues].sort((a: any, b: any) => a.venue_name.localeCompare(b.venue_name)), [venues]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of proposals) {
      if (venueFilter !== 'all' && p.venue_id !== venueFilter) continue;
      if (!map[p.event_date]) map[p.event_date] = [];
      map[p.event_date].push(p);
    }
    return map;
  }, [proposals, venueFilter]);

  const grid = useMemo(() => buildGrid(monthDate), [monthDate]);
  const selectedBookings = bookingsByDate[selected] ?? [];

  function goToMonth(delta: number) { setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1)); }

  function focusCell(key: string) { setFocused(key); requestAnimationFrame(() => cellRefs.current[key]?.focus()); }

  function handleKeyDown(e: React.KeyboardEvent, date: Date) {
    let deltaDays: number | null = null;
    if (e.key === 'ArrowRight') deltaDays = 1;
    else if (e.key === 'ArrowLeft') deltaDays = -1;
    else if (e.key === 'ArrowDown') deltaDays = 7;
    else if (e.key === 'ArrowUp') deltaDays = -7;
    else if (e.key === 'Home') deltaDays = -date.getDay();
    else if (e.key === 'End') deltaDays = 6 - date.getDay();
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(toKey(date)); return; }
    if (deltaDays === null) return;
    e.preventDefault();
    const next = new Date(date); next.setDate(date.getDate() + deltaDays);
    if (next.getMonth() !== monthDate.getMonth()) setMonthDate(new Date(next.getFullYear(), next.getMonth(), 1));
    focusCell(toKey(next));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: '#C9981F' }}>Scheduling</p>
          <h1 className="page-title">Availability calendar</h1>
          <p className="text-muted text-sm mt-2 max-w-lg">
            Check which dates are already occupied before submitting a new proposal.
          </p>
        </div>
        {role === 'student' && (
          <Link to="/submit" className="btn-primary self-start sm:self-auto">
            <FilePlus2 className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            Submit proposal
          </Link>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-5">
        <label htmlFor="venue-filter" className="text-[12px] font-bold tracking-wide uppercase text-muted shrink-0">Filter by venue</label>
        <select id="venue-filter" value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className="field-input max-w-xs">
          <option value="all">All venues</option>
          {sortedVenues.map((v: any) => <option key={v.venue_id} value={v.venue_id}>{v.venue_name}</option>)}
        </select>
      </div>

      {/* Calendar card */}
      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,15,28,0.07), 0 4px 12px rgba(10,15,28,0.06)', border: '1px solid #D0DAE8' }}
      >
        {/* Month nav */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #E8EFF6', background: '#0A0F1C' }}
        >
          <button
            onClick={() => goToMonth(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>
          <div className="font-display font-bold text-white text-lg" aria-live="polite">{monthLabel(monthDate)}</div>
          <button
            onClick={() => goToMonth(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            aria-label="Next month"
          >
            <ChevronRight className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 px-5 py-3" style={{ borderBottom: '1px solid #E8EFF6', background: '#F8FAFD' }}>
          <LegendDot color="#0F3D73" label="Approved" />
          <LegendDot color="#C9981F" label="Pending / under review" />
          <span className="text-[11px] text-muted">Click a date to see details below.</span>
        </div>

        {loading ? (
          <p className="text-muted text-sm text-center py-12" aria-live="polite">Loading calendar…</p>
        ) : (
          <table className="w-full border-collapse" role="grid" aria-label={`Venue availability for ${monthLabel(monthDate)}`}>
            <caption className="sr-only">
              Calendar — {monthLabel(monthDate)}. Use arrow keys to move between days.
            </caption>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8EFF6' }}>
                {WEEKDAYS.map((w) => (
                  <th key={w} scope="col" className="py-2.5 text-center text-[11px] font-bold tracking-widest uppercase text-muted">
                    <span className="sm:hidden">{w[0]}</span>
                    <span className="hidden sm:inline">{w}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, week) => (
                <tr key={week} style={{ borderBottom: '1px solid #E8EFF6' }}>
                  {grid.slice(week * 7, week * 7 + 7).map((date) => {
                    const key = toKey(date);
                    const inMonth = date.getMonth() === monthDate.getMonth();
                    const isToday = sameDay(date, today);
                    const isSelected = key === selected;
                    const bookings = bookingsByDate[key] ?? [];
                    const hasApproved = bookings.some((b: any) => b.status === 'Approved');
                    const hasPending = bookings.some((b: any) => b.status !== 'Approved');
                    const dotColor = hasApproved ? '#0F3D73' : hasPending ? '#C9981F' : null;
                    const ariaLabel = `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${bookings.length ? `, ${bookings.length} ${bookings.length === 1 ? 'proposal' : 'proposals'}` : ''}${isToday ? ', today' : ''}`;

                    return (
                      <td key={key} className="p-0 text-center" style={{ borderRight: '1px solid #E8EFF6' }}>
                        <button
                          ref={(el) => { cellRefs.current[key] = el; }}
                          role="gridcell"
                          type="button"
                          tabIndex={key === focused ? 0 : -1}
                          aria-selected={isSelected}
                          aria-current={isToday ? 'date' : undefined}
                          aria-label={ariaLabel}
                          onClick={() => { setSelected(key); setFocused(key); }}
                          onFocus={() => setFocused(key)}
                          onKeyDown={(e) => handleKeyDown(e, date)}
                          className="w-full h-full flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 transition-all duration-100"
                          style={{
                            background: isSelected ? '#0A0F1C' : 'transparent',
                            color: isSelected ? '#FFFFFF' : inMonth ? '#0A0F1C' : '#C0CCDA',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F2F5FB';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                        >
                          <span className={`text-[13px] font-bold leading-none ${isToday && !isSelected ? 'underline underline-offset-4 decoration-2' : ''}`}
                            style={{ textDecorationColor: isToday && !isSelected ? '#C9981F' : undefined }}
                          >
                            {date.getDate()}
                          </span>
                          {dotColor && (
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: isSelected ? '#C9981F' : dotColor }}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Selected day details */}
      <div aria-live="polite">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold tracking-widest uppercase text-muted">
            {new Date(selected + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          {selectedBookings.length > 0 && (
            <span className="text-[12px] font-bold text-navy">{selectedBookings.length} {selectedBookings.length === 1 ? 'proposal' : 'proposals'}</span>
          )}
        </div>

        {selectedBookings.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-5 flex items-center gap-3"
            style={{ background: '#FFFFFF', border: '1.5px dashed #D0DAE8' }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#E4EDF8' }} aria-hidden="true">
              <FilePlus2 className="w-4 h-4 text-navy" strokeWidth={1.75} />
            </div>
            <p className="text-muted text-sm font-medium">
              No proposals on this date{venueFilter !== 'all' ? ' at this venue' : ''} yet.
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,15,28,0.07), 0 4px 12px rgba(10,15,28,0.06)', border: '1px solid #D0DAE8' }}
          >
            {selectedBookings
              .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
              .map((p: any, i: number) => (
                <div key={p.proposal_id}>
                  {i > 0 && <div className="mx-5 h-px" style={{ background: '#E8EFF6' }} />}
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-[11px] text-center leading-tight"
                      style={{ background: '#E4EDF8', color: '#0F3D73' }}
                      aria-hidden="true"
                    >
                      {p.start_time?.slice(0, 5)}<br />{p.end_time?.slice(0, 5)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[14px] text-ink">{p.event_title}</div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />{p.venue_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" aria-hidden="true" />{p.estimated_attendance} attendees
                        </span>
                      </div>
                    </div>
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} aria-hidden="true" />
      <span className="text-[11px] font-bold text-muted">{label}</span>
    </span>
  );
}
