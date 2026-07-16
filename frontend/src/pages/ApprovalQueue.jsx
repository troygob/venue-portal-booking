import { useEffect, useState } from 'react'
import { supabase, apiPost } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { fmtMoney, ROLE_LABELS } from '../lib/roles'

const OPEN_STATUSES = ['Pending', 'Under Review']
const MANAGERIAL_ROLES = ['dept_head', 'school_admin', 'facilities']

export default function ApprovalQueue() {
  const { role, isDemo, demoProposals, setDemoProposals, setDemoNotifications } = useAuth()
  const [proposals, setProposals] = useState([])
  const [approvedByMap, setApprovedByMap] = useState({}) // proposal_id -> [role, ...]
  const [remarksFor, setRemarksFor] = useState(null) // { proposal_id, decision }
  const [remarks, setRemarks] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function load() {
    // Any managerial role can review and decide on any open proposal at
    // any time — there's no stage-lock keeping it behind a prior reviewer.
    const { data } = await supabase
      .from('event_proposals')
      .select('*')
      .in('status', OPEN_STATUSES)
      .order('date_submitted')
    const list = data ?? []
    setProposals(list)

    if (list.length > 0) {
      const { data: steps } = await supabase
        .from('approval_steps')
        .select('proposal_id, approver_role, status, action_date')
        .in('proposal_id', list.map((p) => p.proposal_id))
        .eq('status', 'Approved')
      const map = {}
      for (const s of steps ?? []) {
        const proposal = list.find((p) => p.proposal_id === s.proposal_id)
        // Only count approvals made since this proposal's current review
        // cycle started — ignore stale ones left over from before a revision.
        if (proposal && new Date(s.action_date) >= new Date(proposal.date_submitted)) {
          map[s.proposal_id] = [...new Set([...(map[s.proposal_id] ?? []), s.approver_role])]
        }
      }
      setApprovedByMap(map)
    } else {
      setApprovedByMap({})
    }
  }

  useEffect(() => {
    if (!isDemo) load()
  }, [role, isDemo])

  const visibleProposals = isDemo
    ? demoProposals.filter((p) => OPEN_STATUSES.includes(p.status))
    : proposals

  function approvedRolesFor(p) {
    return isDemo ? (p.approved_roles ?? []) : (approvedByMap[p.proposal_id] ?? [])
  }

  async function decide(proposal_id, decision, note) {
    setBusyId(proposal_id)
    try {
      if (isDemo) {
        const p = demoProposals.find((x) => x.proposal_id === proposal_id)
        if (decision === 'approve') {
          const approvedRoles = [...new Set([...(p?.approved_roles ?? []), role])]
          const fullyApproved = MANAGERIAL_ROLES.every((r) => approvedRoles.includes(r))
          setDemoProposals((prev) =>
            prev.map((x) =>
              x.proposal_id === proposal_id
                ? { ...x, approved_roles: approvedRoles, status: fullyApproved ? 'Approved' : 'Under Review' }
                : x
            )
          )
          if (fullyApproved) {
            setDemoNotifications((prev) => [
              { notification_id: `n-${Date.now()}`, recipient_id: p?.officer_id, message: `Your proposal '${p?.event_title}' has been fully approved.`, date_sent: new Date().toISOString(), read_status: 'Unread' },
              ...prev,
            ])
          }
        } else {
          const outcome = decision === 'reject' ? 'Rejected' : 'Needs Revision'
          setDemoProposals((prev) =>
            prev.map((x) =>
              x.proposal_id === proposal_id
                ? { ...x, status: outcome, approved_roles: [], ...(decision === 'revise' ? { revision_remarks: note } : {}) }
                : x
            )
          )
          const message =
            decision === 'reject'
              ? `Your proposal '${p?.event_title}' was rejected. Remarks: ${note}`
              : `Revision requested on '${p?.event_title}'. Remarks: ${note}`
          setDemoNotifications((prev) => [
            { notification_id: `n-${Date.now()}`, recipient_id: p?.officer_id, message, date_sent: new Date().toISOString(), read_status: 'Unread' },
            ...prev,
          ])
        }
      } else {
        await apiPost('/approvals/decide', { proposal_id, decision, remarks: note ?? null })
        await load()
      }
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
        <p className="text-muted text-sm mt-1">
          Any of the three managerial roles can approve, reject, or request revision, at any time —
          but a proposal is only fully approved once all three have signed off. A single reject or
          revision request still applies immediately.
        </p>
      </header>

      {visibleProposals.length === 0 ? (
        <p className="text-muted text-sm">Nothing waiting on review right now.</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {visibleProposals.map((p) => {
            const approvedRoles = approvedRolesFor(p)
            const alreadyApprovedByMe = approvedRoles.includes(role)
            return (
              <div key={p.proposal_id} className="bg-card border border-line rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[15px]">{p.event_title}</div>
                  <span className="font-mono text-xs text-muted">{p.proposal_id.slice(0, 8)}</span>
                </div>
                <div className="text-muted text-xs mt-1">
                  {p.event_date} · {p.start_time}–{p.end_time} · {p.estimated_attendance} attendees · {fmtMoney(p.budget_estimate)}
                </div>
                <p className="text-sm mt-2">{p.purpose}</p>

                <div className="text-xs mt-2.5 flex flex-wrap gap-1.5 items-center">
                  <span className="text-muted font-semibold">Approvals:</span>
                  {MANAGERIAL_ROLES.map((r) => (
                    <span
                      key={r}
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        approvedRoles.includes(r) ? 'bg-[#E4EDE7] text-forest' : 'bg-ledger text-muted'
                      }`}
                    >
                      {ROLE_LABELS[r]} {approvedRoles.includes(r) ? '✓' : '—'}
                    </span>
                  ))}
                </div>

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
                  <div className="flex gap-2 mt-3 flex-wrap items-center">
                    <button
                      onClick={() => decide(p.proposal_id, 'approve')}
                      disabled={busyId === p.proposal_id || alreadyApprovedByMe}
                      className="text-xs font-semibold bg-forest hover:bg-forest-deep text-white rounded-md px-3 py-1.5 disabled:opacity-50"
                    >
                      {alreadyApprovedByMe ? 'You approved this' : 'Approve'}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
