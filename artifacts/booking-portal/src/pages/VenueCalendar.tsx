import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Badge, { statusTone } from '../components/Badge';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const OCCUPYING_STATUSES = ['Pending', 'Under Review', 'Approved'];

function toKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
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
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState(() => toKey(new Date()));
  const [focused, setFocused] = useState(() => toKey(new Date()));
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (isDemo) {
      setVenues(demoVenues);
      setProposals(demoProposals.filter((p: any) => OCCUPYING_STATUSES.includes(p.status)));
      setLoading(false);
      return;
    }
    async function load() {
      const [{ data: v }, { data: p }] = await Promise.all([
        supabase.from('venues').select('*').order('venue_name'),
        supabase.from('event_proposals').select('*').in('status', OCCUPYING_STATUSES),
      ]);
      setVenues((v as any) ?? []);
      setProposals((p as any) ?? []);
      setLoading(false);
    }
    load();
  }, [isDemo, demoVenues, demoProposals]);

  const sortedVenues = useMemo(
    () => [...venues].sort((a: any, b: any) => a.venue_name.localeCompare(b.venue_name)),
    [venues]
  );

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
  const selectedVenueUnderMaintenance =
    venueFilter !== 'all' && venues.find((v: any) => v.venue_id === venueFilter)?.status === 'Under Maintenance';

  function goToMonth(delta: number) {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  function focusCell(key: string) {
    setFocused(key);
    requestAnimationFrame(() => cellRefs.current[key]?.focus());
  }

  function handleKeyDown(e: React.KeyboardEvent, date: Date) {
    let deltaDays: number | null = null;
    if (e.key === 'ArrowRight') deltaDays = 1;
    else if (e.key === 'ArrowLeft') deltaDays = -1;
    else if (e.key === 'ArrowDown') deltaDays = 7;
    else if (e.key === 'ArrowUp') deltaDays = -7;
    else if (e.key === 'Home') deltaDays = -date.getDay();
    else if (e.key === 'End') deltaDays = 6 - date.getDay();
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelected(toKey(date));
      return;
    }
    if (deltaDays === null) return;
    e.preventDefault();
    const next = new Date(date);
    next.setDate(date.getDate() + deltaDays);
    if (next.getMonth() !== monthDate.getMonth()) {
      setMonthDate(new Date(next.getFullYear(), next.getMonth(), 1));
    }
    focusCell(toKey(next));
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy-deep">Venue availability calendar</h1>
        <p className="text-muted text-sm mt-1.5 max-w-2xl">
          See which dates already have proposals in progress before you submit — filter by venue to check a specific
          space, or view everything at once.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <label htmlFor="venue-filter" className="text-xs font-semibold text-muted block mb-1">Venue</label>
          <select
            id="venue-filter"
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="field-input"
          >
            <option value="all">All venues</option>
            {sortedVenues.map((v: any) => (
              <option key={v.venue_id} value={v.venue_id}>{v.venue_name}</option>
            ))}
          </select>
        </div>
        {role === 'student' && (
          <Link to="/submit" className="btn-primary sm:ml-auto sm:self-end">
            Submit a proposal
          </Link>
        )}
      </div>

      {selectedVenueUnderMaintenance && (
        <p role="status" className="bg-rose-soft text-rose text-sm rounded-lg px-3.5 py-2.5 mb-4">
          This venue is currently marked under maintenance and isn&apos;t accepting new bookings.
        </p>
      )}

      <div className="bg-card border border-line rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-line">
          <button onClick={() => goToMonth(-1)} className="p-2 rounded-md hover:bg-navy-light text-navy-deep" aria-label="Previous month">
            <ChevronLeft className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>
          <div className="font-display font-semibold text-base sm:text-lg" aria-live="polite">{monthLabel(monthDate)}</div>
          <button onClick={() => goToMonth(1)} className="p-2 rounded-md hover:bg-navy-light text-navy-deep" aria-label="Next month">
            <ChevronRight className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 sm:px-5 py-3 text-xs text-muted border-b border-line">
          <LegendItem swatch="bg-navy" label="Approved proposals" />
          <LegendItem swatch="bg-gold-dark" label="Pending / under review" />
          <LegendItem swatch="bg-line" label="No proposals" outline />
        </div>
        <p className="px-4 sm:px-5 pb-2 text-[11px] text-muted -mt-1">Select a day to see exact time slots below.</p>

        {loading ? (
          <p className="text-muted text-sm px-5 py-8 text-center" aria-live="polite">Loading calendar…</p>
        ) : (
          <table className="w-full border-collapse" role="grid" aria-label={`Venue availability for ${monthLabel(monthDate)}`}>
            <caption className="sr-only">
              Calendar showing venue proposal activity for {monthLabel(monthDate)}. Use arrow keys to move between days.
            </caption>
            <thead>
              <tr>
                {WEEKDAYS.map((w) => (
                  <th key={w} scope="col" className="text-[11px] font-semibold text-muted py-2 border-b border-line">
                    <span className="sm:hidden">{w[0]}</span>
                    <span className="hidden sm:inline">{w}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, week) => (
                <tr key={week}>
                  {grid.slice(week * 7, week * 7 + 7).map((date) => {
                    const key = toKey(date);
                    const inMonth = date.getMonth() === monthDate.getMonth();
                    const isToday = sameDay(date, today);
                    const isSelected = key === selected;
                    const bookings = bookingsByDate[key] ?? [];
                    const hasApproved = bookings.some((b: any) => b.status === 'Approved');
                    const hasPending = bookings.some((b: any) => b.status !== 'Approved');
                    const label = `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${
                      bookings.length ? `, ${bookings.length} ${bookings.length === 1 ? 'proposal' : 'proposals'}` : ', no proposals'
                    }${isToday ? ', today' : ''}`;

                    return (
                      <td key={key} className="border-b border-line p-0 text-center">
                        <button
                          ref={(el) => { cellRefs.current[key] = el; }}
                          role="gridcell"
                          type="button"
                          tabIndex={key === focused ? 0 : -1}
                          aria-selected={isSelected}
                          aria-current={isToday ? 'date' : undefined}
                          aria-label={label}
                          onClick={() => { setSelected(key); setFocused(key); }}
                          onFocus={() => setFocused(key)}
                          onKeyDown={(e) => handleKeyDown(e, date)}
                          className={`w-full aspect-square sm:aspect-[4/3] flex flex-col items-center justify-center gap-1 text-sm transition-colors
                            ${inMonth ? 'text-ink' : 'text-muted'}
                            ${isSelected ? 'bg-navy text-white font-semibold' : 'hover:bg-navy-light'}
                          `}
                        >
                          <span className={`${isToday && !isSelected ? 'underline underline-offset-4 decoration-2 decoration-gold font-semibold' : ''}`}>
                            {date.getDate()}
                          </span>
                          {(hasApproved || hasPending) && (
                            <span
                              className={`min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold leading-none
                                ${isSelected
                                  ? 'bg-white text-navy-deep'
                                  : hasApproved
                                    ? 'bg-navy text-white'
                                    : 'bg-gold-dark text-white'}
                              `}
                              aria-hidden="true"
                            >
                              {bookings.length}
                            </span>
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

      <div className="mt-5" aria-live="polite">
        <h2 className="font-semibold text-base mb-2.5">
          {new Date(selected + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h2>
        {selectedBookings.length === 0 ? (
          <p className="text-muted text-sm bg-card border border-line rounded-xl px-4 py-3.5">
            No proposals for this date{venueFilter !== 'all' ? ' at this venue' : ''} yet.
          </p>
        ) : (
          <ul className="bg-card border border-line rounded-xl divide-y divide-line">
            {selectedBookings
              .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
              .map((p: any) => (
                <li key={p.proposal_id} className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{p.event_title}</div>
                    <div className="text-muted text-xs mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        {p.venue_name}
                      </span>
                      <span>{p.start_time?.slice(0, 5)}–{p.end_time?.slice(0, 5)}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" aria-hidden="true" />
                        {p.estimated_attendance}
                      </span>
                    </div>
                  </div>
                  <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function LegendItem({ swatch, label, outline }: { swatch: string; label: string; outline?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${swatch} ${outline ? 'border border-line' : ''}`} aria-hidden="true" />
      {label}
    </span>
  );
}
