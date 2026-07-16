import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users2, MapPin, Wallet, CalendarClock, CalendarDays } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/Badge'
import { fmtMoney } from '../lib/roles'

export default function Venues() {
  const { role, isDemo, demoVenues, setDemoVenues } = useAuth()
  const [venues, setVenues] = useState([])

  useEffect(() => {
    if (!isDemo) {
      supabase.from('venues').select('*').order('venue_name').then(({ data }) => setVenues(data ?? []))
    }
  }, [isDemo])

  const visibleVenues = isDemo ? [...demoVenues].sort((a, b) => a.venue_name.localeCompare(b.venue_name)) : venues

  async function toggleStatus(v) {
    const next = v.status === 'Available' ? 'Under Maintenance' : 'Available'
    if (isDemo) {
      setDemoVenues((prev) => prev.map((x) => (x.venue_id === v.venue_id ? { ...x, status: next } : x)))
      return
    }
    const { error } = await supabase.from('venues').update({ status: next }).eq('venue_id', v.venue_id)
    if (!error) setVenues((prev) => prev.map((x) => (x.venue_id === v.venue_id ? { ...x, status: next } : x)))
  }

  return (
    <div>
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy-deep">
            {role === 'facilities' ? 'Venue management' : 'Venues'}
          </h1>
          <p className="text-muted text-sm mt-1.5">Real-time availability across all campus venues.</p>
        </div>
        <Link to="/calendar" className="btn-secondary self-start sm:self-auto">
          <CalendarDays className="w-4 h-4" aria-hidden="true" />
          Open calendar view
        </Link>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleVenues.map((v) => (
          <div key={v.venue_id} className="bg-card border border-line rounded-xl p-4 shadow-card flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-[15px]">{v.venue_name}</div>
              <Badge tone={v.status === 'Available' ? 'navy' : 'rose'}>{v.status}</Badge>
            </div>
            <div className="text-muted text-xs mt-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {v.location}
            </div>
            <dl className="text-muted text-xs mt-2 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Users2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Capacity</dt>
                <dd>Capacity {v.capacity}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Fee</dt>
                <dd>{fmtMoney(v.applicable_fees)} fee</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Booking notice</dt>
                <dd>{v.booking_deadline_days}-day advance notice</dd>
              </div>
            </dl>

            <div className="mt-3.5 pt-3.5 border-t border-line flex flex-wrap gap-2 items-center">
              <Link
                to={`/calendar?venue=${v.venue_id}`}
                className="text-xs font-semibold text-navy underline underline-offset-2 hover:no-underline"
              >
                View availability
              </Link>
              {role === 'facilities' && (
                <button
                  onClick={() => toggleStatus(v)}
                  className="ml-auto text-xs font-semibold border border-line rounded-md px-2.5 py-1.5 hover:bg-navy-light"
                >
                  Mark {v.status === 'Available' ? 'under maintenance' : 'available'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
