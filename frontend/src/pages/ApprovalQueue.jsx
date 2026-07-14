import { useEffect, useState } from 'react'
import { supabase, apiPost } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ApprovalQueue() {
  const { role } = useAuth()
  const [proposals, setProposals] = useState([])
  const [remarksFor, setRemarksFor] = useState(null) // { proposal_id, decision }
  const [remarks, setRemarks] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function load() {
    const { data } = await supabase
      .from('event_proposals')
      .select('*')
      .eq('current_stage', role)
      .order('date_submitted')
    setProposals(data ?? [])
  }

  useEffect(() => { load() }, [role])

  async function decide(proposal_id, decision, note) {
    setBusyId(proposal_id)
    try {
      await apiPost('/approvals/decide', { proposal_id, decision, remarks: note ?? null })
      await load()
    } finally {
      setBusyId(null)
      setRemarksFor(null)
      setRemarks('')
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">
          {role === 'facilities' ? 'Venue confirmations' : 'Approval queue'}
        </h1>
        <p className="text-muted text-sm mt-1">Proposals currently awaiting your review.</p>
      </header>

      {proposals.length === 0 ? (
        <p className="text-muted text-sm">Nothing waiting on you right now.</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {proposals.map((p) => (
            <div key={p.proposal_id} className="bg-card border border-line rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[15px]">{p.event_title}</div>
                <span className="font-mono text-xs text-muted">{p.proposal_id.slice(0, 8)}</span>
              </div>
              <div className="text-muted text-xs mt-1">
                {p.event_date} · {p.start_time}–{p.end_time} · {p.estimated_attendance} attendees · ₱{p.budget_estimate}
              </div>
              <p className="text-sm mt-2">{p.purpose}</p>

              {remarksFor?.proposal_id === p.proposal_id ? (
                <div className="mt-3 border border-brass rounded-lg p-3 bg-white">
                  <label htmlFor={`remarks-${p.proposal_id}`} className="text-xs font-semibold text-muted block mb-1">
                    Remarks {remarksFor.decision === 'reject' ? '(required)' : ''}
                  </label>
                  <textarea
                    id={`remarks-${p.proposal_id}`}
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full border border-line rounded-md px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => decide(p.proposal_id, remarksFor.decision, remarks)}
                      disabled={busyId === p.proposal_id || (remarksFor.decision === 'reject' && !remarks)}
                      className="text-xs font-semibold bg-forest text-white rounded-md px-3 py-1.5 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => { setRemarksFor(null); setRemarks('') }}
                      className="text-xs font-semibold border border-line rounded-md px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => decide(p.proposal_id, 'approve')}
                    disabled={busyId === p.proposal_id}
                    className="text-xs font-semibold bg-forest hover:bg-forest-deep text-white rounded-md px-3 py-1.5 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRemarksFor({ proposal_id: p.proposal_id, decision: 'revise' })}
                    className="text-xs font-semibold border border-brass text-brass-dark rounded-md px-3 py-1.5 hover:bg-brass-soft"
                  >
                    Request revision
                  </button>
                  <button
                    onClick={() => setRemarksFor({ proposal_id: p.proposal_id, decision: 'reject' })}
                    className="text-xs font-semibold border border-clay text-clay rounded-md px-3 py-1.5 hover:bg-clay-soft"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
