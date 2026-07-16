import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Badge, { statusTone } from '../components/Badge'

export default function Dashboard() {
  const { profile, role, isDemo, demoProposals } = useAuth()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setLoading(false)
      return
    }
    async function load() {
      let query = supabase.from('event_proposals').select('*').order('date_submitted', { ascending: false }).limit(6)
      if (role === 'student') query = query.eq('officer_id', profile.id)
      const { data } = await query
      setProposals(data ?? [])
      setLoading(false)
    }
    if (profile) load()
  }, [profile, role, isDemo])

  const source = isDemo
    ? (role === 'student' ? demoProposals.filter((p) => p.officer_id === profile.id) : demoProposals)
    : proposals

  const pending = source.filter((p) => p.status === 'Pending' || p.status === 'Under Review').length
  const approved = source.filter((p) => p.status === 'Approved').length
  const needsAttention = source.filter((p) => p.status === 'Needs Revision').length

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">
          {role === 'student' ? 'Your proposals' : 'Dashboard'}
        </h1>
        <p className="text-muted text-sm mt-1">
          {role === 'student'
            ? 'Track your event proposals from submission to venue confirmation.'
            : 'A live view of proposals moving through the approval workflow.'}
        </p>
      </header>

      <div className="flex gap-3.5 mb-6" role="group" aria-label="Summary statistics">
        <Stat label="In progress" value={pending} tone="text-forest" />
        <Stat label="Approved" value={approved} tone="text-forest" />
        <Stat label="Needs your attention" value={needsAttention} tone="text-clay" />
      </div>

      {role === 'student' && (
        <Link
          to="/submit"
          className="inline-block mb-6 bg-forest hover:bg-forest-deep text-white text-sm font-semibold rounded-md px-4 py-2.5"
        >
          Submit a new proposal
        </Link>
      )}

      <h2 className="font-semibold text-base mb-2.5">Recent activity</h2>
      {loading ? (
        <p className="text-muted text-sm" aria-live="polite">Loading…</p>
      ) : source.length === 0 ? (
        <p className="text-muted text-sm">Nothing here yet.</p>
      ) : (
        <ul className="bg-card border border-line rounded-xl divide-y divide-line">
          {source.map((p) => (
            <li key={p.proposal_id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{p.event_title}</div>
                <div className="text-muted text-xs mt-0.5">{p.event_date}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                {role === 'student' && p.status === 'Needs Revision' && (
                  <Link
                    to={`/submit?edit=${p.proposal_id}`}
                    className="text-xs font-semibold text-brass-dark underline underline-offset-2 hover:no-underline"
                  >
                    Edit &amp; resubmit
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="bg-card border border-line rounded-xl px-4 py-3.5 flex-1">
      <div className="text-xs text-muted font-semibold">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${tone}`}>{value}</div>
    </div>
  )
}
