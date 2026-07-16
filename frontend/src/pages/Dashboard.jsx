import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock3, CheckCircle2, AlertCircle, Plus, CalendarDays } from 'lucide-react'
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
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy-deep">
          {role === 'student' ? 'Your proposals' : 'Dashboard'}
        </h1>
        <p className="text-muted text-sm mt-1.5">
          {role === 'student'
            ? 'Track your event proposals from submission to venue confirmation.'
            : 'A live view of proposals moving through the approval workflow.'}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6" role="group" aria-label="Summary statistics">
        <Stat icon={Clock3} label="In progress" value={pending} tone="text-navy" iconBg="bg-navy-light" />
        <Stat icon={CheckCircle2} label="Approved" value={approved} tone="text-navy" iconBg="bg-navy-light" />
        <Stat icon={AlertCircle} label="Needs your attention" value={needsAttention} tone="text-rose" iconBg="bg-rose-soft" />
      </div>

      <div className="flex flex-wrap gap-2.5 mb-6">
        {role === 'student' && (
          <Link to="/submit" className="btn-primary">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Submit a new proposal
          </Link>
        )}
        <Link to="/calendar" className="btn-secondary">
          <CalendarDays className="w-4 h-4" aria-hidden="true" />
          View availability calendar
        </Link>
      </div>

      <h2 className="font-semibold text-base mb-2.5">Recent activity</h2>
      {loading ? (
        <p className="text-muted text-sm" aria-live="polite">Loading…</p>
      ) : source.length === 0 ? (
        <div className="bg-card border border-dashed border-line rounded-xl px-4 py-8 text-center">
          <p className="text-muted text-sm">
            {role === 'student' ? "You haven't submitted any proposals yet." : 'Nothing here yet.'}
          </p>
          {role === 'student' && (
            <Link to="/submit" className="inline-block mt-3 text-sm font-semibold text-navy underline underline-offset-2 hover:no-underline">
              Submit your first proposal
            </Link>
          )}
        </div>
      ) : (
        <ul className="bg-card border border-line rounded-xl divide-y divide-line shadow-card">
          {source.map((p) => (
            <li key={p.proposal_id} className="px-4 py-3.5 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.event_title}</div>
                <div className="text-muted text-xs mt-0.5">{p.event_date}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                {role === 'student' && p.status === 'Needs Revision' && (
                  <Link
                    to={`/submit?edit=${p.proposal_id}`}
                    className="text-xs font-semibold text-gold-dark underline underline-offset-2 hover:no-underline"
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

function Stat({ icon: Icon, label, value, tone, iconBg }) {
  return (
    <div className="bg-card border border-line rounded-xl px-4 py-4 flex items-center gap-3.5 shadow-card">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`} aria-hidden="true">
        <Icon className={`w-5 h-5 ${tone}`} strokeWidth={2} />
      </div>
      <div>
        <div className="text-xs text-muted font-semibold">{label}</div>
        <div className={`text-2xl font-display font-semibold mt-0.5 ${tone}`}>{value}</div>
      </div>
    </div>
  )
}
