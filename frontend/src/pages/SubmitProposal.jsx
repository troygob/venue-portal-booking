import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, CalendarDays } from 'lucide-react'
import { supabase, apiPost, apiPut } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { fmtMoney } from '../lib/roles'

const initialForm = {
  venue_id: '', event_title: '', event_date: '', start_time: '', end_time: '',
  purpose: '', estimated_attendance: '', budget_estimate: '',
}

// Postgres returns time columns as 'HH:MM:SS' — <input type="time"> wants 'HH:MM'.
const toInputTime = (t) => (t ? t.slice(0, 5) : '')

export default function SubmitProposal() {
  const navigate = useNavigate()
  const { profile, isDemo, demoVenues, demoProposals, setDemoProposals, setDemoNotifications } = useAuth()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [venues, setVenues] = useState([])
  const [form, setForm] = useState(initialForm)
  const [revisionRemarks, setRevisionRemarks] = useState('')
  const [loadingExisting, setLoadingExisting] = useState(!!editId)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  // Load the venue list.
  useEffect(() => {
    if (isDemo) {
      setVenues(demoVenues.filter((v) => v.status === 'Available'))
    } else {
      supabase.from('venues').select('*').eq('status', 'Available').then(({ data }) => setVenues(data ?? []))
    }
  }, [isDemo, demoVenues])

  // If editing, load the existing proposal (must belong to the caller and
  // be marked 'Needs Revision' — enforced again server-side on save).
  useEffect(() => {
    if (!editId) return
    if (isDemo) {
      const existing = demoProposals.find((p) => p.proposal_id === editId)
      if (existing) {
        setForm({
          venue_id: existing.venue_id,
          event_title: existing.event_title,
          event_date: existing.event_date,
          start_time: toInputTime(existing.start_time),
          end_time: toInputTime(existing.end_time),
          purpose: existing.purpose,
          estimated_attendance: String(existing.estimated_attendance),
          budget_estimate: String(existing.budget_estimate),
        })
        setRevisionRemarks(existing.revision_remarks ?? '')
      }
      setLoadingExisting(false)
      return
    }
    async function loadExisting() {
      const { data: proposal } = await supabase
        .from('event_proposals').select('*').eq('proposal_id', editId).single()
      if (proposal) {
        setForm({
          venue_id: proposal.venue_id,
          event_title: proposal.event_title,
          event_date: proposal.event_date,
          start_time: toInputTime(proposal.start_time),
          end_time: toInputTime(proposal.end_time),
          purpose: proposal.purpose,
          estimated_attendance: String(proposal.estimated_attendance),
          budget_estimate: String(proposal.budget_estimate),
        })
      }
      const { data: steps } = await supabase
        .from('approval_steps')
        .select('remarks')
        .eq('proposal_id', editId)
        .eq('status', 'Revision Requested')
        .order('action_date', { ascending: false })
        .limit(1)
      setRevisionRemarks(steps?.[0]?.remarks ?? '')
      setLoadingExisting(false)
    }
    loadExisting()
  }, [editId, isDemo, demoProposals])

  const selectedVenue = venues.find((v) => v.venue_id === form.venue_id)
  const overCapacity =
    selectedVenue && form.estimated_attendance && Number(form.estimated_attendance) > selectedVenue.capacity

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = {
        ...form,
        estimated_attendance: Number(form.estimated_attendance),
        budget_estimate: Number(form.budget_estimate),
      }

      if (isDemo) {
        const venue = demoVenues.find((v) => v.venue_id === payload.venue_id)
        if (editId) {
          setDemoProposals((prev) =>
            prev.map((p) =>
              p.proposal_id === editId
                ? { ...p, ...payload, venue_name: venue?.venue_name, status: 'Pending', approved_roles: [] }
                : p
            )
          )
        } else {
          const newProposal = {
            proposal_id: `p-${Date.now()}`,
            officer_id: profile.id,
            officer_name: `${profile.first_name} ${profile.last_name}`,
            venue_name: venue?.venue_name,
            status: 'Pending',
            date_submitted: new Date().toISOString(),
            approved_roles: [],
            ...payload,
          }
          setDemoProposals((prev) => [newProposal, ...prev])
        }
        setDemoNotifications((prev) => [
          {
            notification_id: `n-${Date.now()}`,
            recipient_id: 'demo-dept-head',
            message: `${editId ? 'Revised proposal' : 'New proposal'} '${payload.event_title}' is awaiting review.`,
            date_sent: new Date().toISOString(),
            read_status: 'Unread',
          },
          ...prev,
        ])
      } else if (editId) {
        await apiPut(`/proposals/${editId}`, payload)
      } else {
        await apiPost('/proposals', payload)
      }

      setSuccess(true)
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loadingExisting) {
    return <p className="text-muted text-sm" aria-live="polite">Loading…</p>
  }

  return (
    <div className="max-w-xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy-deep">
          {editId ? 'Edit & resubmit proposal' : 'Submit a proposal'}
        </h1>
        <p className="text-muted text-sm mt-1.5">Venue capacity, fees, and booking deadlines are enforced automatically.</p>
        <Link to="/calendar" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy underline underline-offset-2 hover:no-underline mt-2">
          <CalendarDays className="w-4 h-4" aria-hidden="true" />
          Check venue availability first
        </Link>
      </header>

      {editId && revisionRemarks && (
        <div className="mb-4 bg-gold-soft border border-gold rounded-lg px-4 py-3">
          <div className="text-xs font-semibold text-gold-dark mb-1">Reviewer feedback</div>
          <p className="text-sm text-gold-dark">{revisionRemarks}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4 shadow-card" noValidate>
        <Field label="Event title" htmlFor="f-title">
          <input id="f-title" required value={form.event_title} onChange={(e) => update('event_title', e.target.value)}
                 className="field-input" />
        </Field>

        <Field label="Venue" htmlFor="f-venue">
          <select id="f-venue" required value={form.venue_id} onChange={(e) => update('venue_id', e.target.value)}
                  className="field-input">
            <option value="">Select a venue…</option>
            {venues.map((v) => (
              <option key={v.venue_id} value={v.venue_id}>
                {v.venue_name} — capacity {v.capacity}, {fmtMoney(v.applicable_fees)}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-col sm:flex-row gap-3.5">
          <Field label="Date" htmlFor="f-date">
            <input id="f-date" type="date" required value={form.event_date} onChange={(e) => update('event_date', e.target.value)}
                   className="field-input" />
          </Field>
          <Field label="Start" htmlFor="f-start">
            <input id="f-start" type="time" required value={form.start_time} onChange={(e) => update('start_time', e.target.value)}
                   className="field-input" />
          </Field>
          <Field label="End" htmlFor="f-end">
            <input id="f-end" type="time" required value={form.end_time} onChange={(e) => update('end_time', e.target.value)}
                   className="field-input" />
          </Field>
        </div>

        <Field label="Purpose" htmlFor="f-purpose">
          <textarea id="f-purpose" required rows={3} value={form.purpose} onChange={(e) => update('purpose', e.target.value)}
                    className="field-input resize-y" />
        </Field>

        <div className="flex flex-col sm:flex-row gap-3.5">
          <Field label="Estimated attendance" htmlFor="f-attendance" hint={selectedVenue ? `Max ${selectedVenue.capacity} for this venue` : undefined}>
            <input id="f-attendance" type="number" min="1" required value={form.estimated_attendance}
                   onChange={(e) => update('estimated_attendance', e.target.value)}
                   aria-invalid={overCapacity ? 'true' : undefined}
                   aria-describedby={overCapacity ? 'capacity-error' : undefined}
                   className="field-input" />
          </Field>
          <Field label="Budget estimate (₱)" htmlFor="f-budget">
            <input id="f-budget" type="number" min="0" required value={form.budget_estimate}
                   onChange={(e) => update('budget_estimate', e.target.value)}
                   className="field-input" />
          </Field>
        </div>

        {/* Prevent the error before submit, per HCI error-prevention guidance */}
        {overCapacity && (
          <p id="capacity-error" role="alert" className="flex items-start gap-2 bg-rose-soft text-rose text-sm rounded-lg px-3.5 py-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            This exceeds {selectedVenue.venue_name}&apos;s capacity of {selectedVenue.capacity}.
          </p>
        )}
        {error && (
          <p role="alert" className="flex items-start gap-2 bg-rose-soft text-rose text-sm rounded-lg px-3.5 py-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="flex items-start gap-2 bg-navy-light text-navy-deep text-sm rounded-lg px-3.5 py-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            {editId ? 'Resubmitted.' : 'Submitted.'} Redirecting to your dashboard…
          </p>
        )}

        <button type="submit" disabled={busy || overCapacity} className="btn-primary w-full">
          {busy ? 'Submitting…' : editId ? 'Save changes & resubmit' : 'Submit proposal'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, htmlFor, hint, children }) {
  return (
    <div className="flex-1">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-muted block mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  )
}
