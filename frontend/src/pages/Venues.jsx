import { useEffect, useState } from 'react'
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
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">
          {role === 'facilities' ? 'Venue management' : 'Venues'}
        </h1>
        <p className="text-muted text-sm mt-1">Real-time availability across all campus venues.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleVenues.map((v) => (
          <div key={v.venue_id} className="bg-card border border-line rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{v.venue_name}</div>
              <Badge tone={v.status === 'Available' ? 'forest' : 'clay'}>{v.status}</Badge>
            </div>
            <div className="text-muted text-xs mt-1.5">{v.location}</div>
            <div className="text-muted text-xs mt-0.5">
              Capacity {v.capacity} · Fee {fmtMoney(v.applicable_fees)} · {v.booking_deadline_days}-day notice
            </div>

            {role === 'facilities' && (
              <button
                onClick={() => toggleStatus(v)}
                className="mt-3 text-xs font-semibold border border-line rounded-md px-2.5 py-1.5 hover:bg-ledger"
              >
                Mark {v.status === 'Available' ? 'under maintenance' : 'available'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
