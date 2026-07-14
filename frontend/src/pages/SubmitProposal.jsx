import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, apiPost } from '../supabaseClient'
import { fmtMoney } from '../lib/roles'

const initialForm = {
  venue_id: '', event_title: '', event_date: '', start_time: '', end_time: '',
  purpose: '', estimated_attendance: '', budget_estimate: '',
}

export default function SubmitProposal() {
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('venues').select('*').eq('status', 'Available').then(({ data }) => setVenues(data ?? []))
  }, [])

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
      await apiPost('/proposals', {
        ...form,
        estimated_attendance: Number(form.estimated_attendance),
        budget_estimate: Number(form.budget_estimate),
      })
      setSuccess(true)
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Submit a proposal</h1>
        <p className="text-muted text-sm mt-1">Venue capacity, fees, and booking deadlines are enforced automatically.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3.5" noValidate>
        <Field label="Event title" htmlFor="f-title">
          <input id="f-title" required value={form.event_title} onChange={(e) => update('event_title', e.target.value)}
                 className="w-full border border-line rounded-md px-3 py-2 text-sm" />
        </Field>

        <Field label="Venue" htmlFor="f-venue">
          <select id="f-venue" required value={form.venue_id} onChange={(e) => update('venue_id', e.target.value)}
                  className="w-full border border-line rounded-md px-3 py-2 text-sm">
            <option value="">Select a venue…</option>
            {venues.map((v) => (
              <option key={v.venue_id} value={v.venue_id}>
                {v.venue_name} — capacity {v.capacity}, {fmtMoney(v.applicable_fees)}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex gap-3">
          <Field label="Date" htmlFor="f-date">
            <input id="f-date" type="date" required value={form.event_date} onChange={(e) => update('event_date', e.target.value)}
                   className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          </Field>
          <Field label="Start" htmlFor="f-start">
            <input id="f-start" type="time" required value={form.start_time} onChange={(e) => update('start_time', e.target.value)}
                   className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          </Field>
          <Field label="End" htmlFor="f-end">
            <input id="f-end" type="time" required value={form.end_time} onChange={(e) => update('end_time', e.target.value)}
                   className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          </Field>
        </div>

        <Field label="Purpose" htmlFor="f-purpose">
          <textarea id="f-purpose" required rows={3} value={form.purpose} onChange={(e) => update('purpose', e.target.value)}
                    className="w-full border border-line rounded-md px-3 py-2 text-sm" />
        </Field>

        <div className="flex gap-3">
          <Field label="Estimated attendance" htmlFor="f-attendance">
            <input id="f-attendance" type="number" min="1" required value={form.estimated_attendance}
                   onChange={(e) => update('estimated_attendance', e.target.value)}
                   className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          </Field>
          <Field label="Budget estimate" htmlFor="f-budget">
            <input id="f-budget" type="number" min="0" required value={form.budget_estimate}
                   onChange={(e) => update('budget_estimate', e.target.value)}
                   className="w-full border border-line rounded-md px-3 py-2 text-sm" />
          </Field>
        </div>

        {/* Prevent the error before submit, per HCI error-prevention guidance */}
        {overCapacity && (
          <p role="alert" className="flex items-center gap-2 bg-clay-soft text-clay text-sm rounded-md px-3 py-2">
            This exceeds {selectedVenue.venue_name}&apos;s capacity of {selectedVenue.capacity}.
          </p>
        )}
        {error && (
          <p role="alert" className="bg-clay-soft text-clay text-sm rounded-md px-3 py-2">{error}</p>
        )}
        {success && (
          <p role="status" className="bg-[#E4EDE7] text-forest text-sm rounded-md px-3 py-2">
            Submitted. Redirecting to your dashboard…
          </p>
        )}

        <button
          type="submit"
          disabled={busy || overCapacity}
          className="bg-forest hover:bg-forest-deep disabled:opacity-60 text-white font-semibold text-sm rounded-md py-2.5"
        >
          {busy ? 'Submitting…' : 'Submit proposal'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="flex-1">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-muted block mb-1">{label}</label>
      {children}
    </div>
  )
}
