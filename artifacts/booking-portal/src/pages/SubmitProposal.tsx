import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CalendarDays, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { fmtMoney } from '../lib/roles';

const initialForm = {
  venue_id: '', event_title: '', event_date: '', start_time: '', end_time: '',
  purpose: '', estimated_attendance: '', budget_estimate: '',
};
const toInputTime = (t: string) => (t ? t.slice(0, 5) : '');

export default function SubmitProposal() {
  const navigate = useNavigate();
  const { profile, isDemo, demoVenues, demoProposals, setDemoProposals, setDemoNotifications } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [venues, setVenues] = useState<any[]>([]);
  const [form, setForm] = useState(initialForm);
  const [revisionRemarks, setRevisionRemarks] = useState('');
  const [loadingExisting, setLoadingExisting] = useState(!!editId);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isDemo) setVenues(demoVenues.filter((v: any) => v.status === 'Available'));
    else supabase.from('venues').select('*').eq('status', 'Available').then(({ data }: any) => setVenues(data ?? []));
  }, [isDemo, demoVenues]);

  useEffect(() => {
    if (!editId) return;
    if (isDemo) {
      const e = demoProposals.find((p: any) => p.proposal_id === editId);
      if (e) {
        setForm({
          venue_id: e.venue_id, event_title: e.event_title, event_date: e.event_date,
          start_time: toInputTime(e.start_time), end_time: toInputTime(e.end_time),
          purpose: e.purpose, estimated_attendance: String(e.estimated_attendance),
          budget_estimate: String(e.budget_estimate),
        });
        setRevisionRemarks(e.revision_remarks ?? '');
      }
      setLoadingExisting(false);
    }
  }, [editId, isDemo, demoProposals]);

  const selectedVenue = venues.find((v: any) => v.venue_id === form.venue_id);
  const overCapacity = selectedVenue && form.estimated_attendance && Number(form.estimated_attendance) > selectedVenue.capacity;

  function update(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const payload = { ...form, estimated_attendance: Number(form.estimated_attendance), budget_estimate: Number(form.budget_estimate) };
      if (isDemo) {
        const venue = demoVenues.find((v: any) => v.venue_id === payload.venue_id);
        if (editId) {
          setDemoProposals((prev: any[]) => prev.map((p: any) =>
            p.proposal_id === editId ? { ...p, ...payload, venue_name: venue?.venue_name, status: 'Pending', approved_roles: [] } : p
          ));
        } else {
          setDemoProposals((prev: any[]) => [{
            proposal_id: `p-${Date.now()}`, officer_id: profile?.id,
            officer_name: `${profile?.first_name} ${profile?.last_name}`,
            venue_name: venue?.venue_name, status: 'Pending',
            date_submitted: new Date().toISOString(), approved_roles: [], ...payload,
          }, ...prev]);
        }
        setDemoNotifications((prev: any[]) => [{
          notification_id: `n-${Date.now()}`, recipient_id: 'demo-dept-head',
          message: `${editId ? 'Revised' : 'New'} proposal '${payload.event_title}' is awaiting review.`,
          date_sent: new Date().toISOString(), read_status: 'Unread',
        }, ...prev]);
      }
      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (loadingExisting) return <p className="text-muted text-sm" aria-live="polite">Loading…</p>;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide uppercase text-muted hover:text-ink mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" /> Back
        </Link>
        <p className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: '#C9981F' }}>
          {editId ? 'Revision' : 'New request'}
        </p>
        <h1 className="page-title">{editId ? 'Edit & resubmit' : 'Submit a proposal'}</h1>
        <p className="text-muted text-sm mt-2 max-w-lg">
          Capacity limits, fees, and booking deadlines are enforced automatically.
        </p>
        <Link
          to="/calendar"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-navy mt-3 hover:underline underline-offset-2"
        >
          <CalendarDays className="w-4 h-4" aria-hidden="true" />
          Check venue availability first
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
        </Link>
      </div>

      {editId && revisionRemarks && (
        <div className="mb-5 rounded-2xl p-4" style={{ background: '#FEF3D5', border: '1.5px solid rgba(201,152,31,0.4)' }}>
          <div className="text-[11px] font-bold tracking-widest uppercase mb-1.5" style={{ color: '#7A5A0B' }}>Reviewer feedback</div>
          <p className="text-sm font-medium" style={{ color: '#7A5A0B' }}>{revisionRemarks}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,15,28,0.07), 0 4px 12px rgba(10,15,28,0.06)', border: '1px solid #D0DAE8' }}
        noValidate
      >
        <div className="p-6 flex flex-col gap-5">
          <SectionLabel>Event details</SectionLabel>
          <Field label="Event title" htmlFor="f-title" required>
            <input id="f-title" required value={form.event_title} onChange={(e) => update('event_title', e.target.value)}
              placeholder="e.g. Freshmen Welcome Night" className="field-input" />
          </Field>

          <Field label="Venue" htmlFor="f-venue" required>
            <select id="f-venue" required value={form.venue_id} onChange={(e) => update('venue_id', e.target.value)} className="field-input">
              <option value="">Select a venue…</option>
              {venues.map((v: any) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name} — capacity {v.capacity}, {fmtMoney(v.applicable_fees)}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Date" htmlFor="f-date" required>
              <input id="f-date" type="date" required value={form.event_date} onChange={(e) => update('event_date', e.target.value)} className="field-input" />
            </Field>
            <Field label="Start time" htmlFor="f-start" required>
              <input id="f-start" type="time" required value={form.start_time} onChange={(e) => update('start_time', e.target.value)} className="field-input" />
            </Field>
            <Field label="End time" htmlFor="f-end" required>
              <input id="f-end" type="time" required value={form.end_time} onChange={(e) => update('end_time', e.target.value)} className="field-input" />
            </Field>
          </div>

          <div className="border-t border-line pt-5">
            <SectionLabel>Logistics</SectionLabel>
          </div>

          <Field label="Purpose & description" htmlFor="f-purpose" required>
            <textarea id="f-purpose" required rows={3} value={form.purpose}
              onChange={(e) => update('purpose', e.target.value)}
              placeholder="Describe the event's objectives and activities…"
              className="field-input" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Expected attendance"
              htmlFor="f-attendance"
              required
              hint={selectedVenue ? `Venue max: ${selectedVenue.capacity}` : undefined}
            >
              <input id="f-attendance" type="number" min="1" required value={form.estimated_attendance}
                onChange={(e) => update('estimated_attendance', e.target.value)}
                aria-invalid={overCapacity ? 'true' : undefined}
                aria-describedby={overCapacity ? 'capacity-error' : undefined}
                className="field-input" />
            </Field>
            <Field label="Budget estimate (₱)" htmlFor="f-budget" required>
              <input id="f-budget" type="number" min="0" required value={form.budget_estimate}
                onChange={(e) => update('budget_estimate', e.target.value)} className="field-input" />
            </Field>
          </div>
        </div>

        {/* Alerts */}
        {(overCapacity || error || success) && (
          <div className="px-6 pb-2 flex flex-col gap-3">
            {overCapacity && (
              <p id="capacity-error" role="alert" className="flex items-start gap-2.5 text-sm font-medium rounded-xl px-4 py-3" style={{ background: '#FDEAEE', color: '#C0334F' }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                Exceeds {selectedVenue.venue_name}'s capacity of {selectedVenue.capacity}.
              </p>
            )}
            {error && (
              <p role="alert" className="flex items-start gap-2.5 text-sm font-medium rounded-xl px-4 py-3" style={{ background: '#FDEAEE', color: '#C0334F' }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> {error}
              </p>
            )}
            {success && (
              <p role="status" className="flex items-start gap-2.5 text-sm font-medium rounded-xl px-4 py-3" style={{ background: '#E4EDF8', color: '#0F3D73' }}>
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                {editId ? 'Resubmitted.' : 'Submitted.'} Redirecting…
              </p>
            )}
          </div>
        )}

        <div className="px-6 pb-6 pt-2">
          <button type="submit" disabled={busy || !!overCapacity} className="btn-primary w-full">
            {busy ? 'Submitting…' : (
              <>
                {editId ? 'Save & resubmit' : 'Submit proposal'}
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold tracking-widest uppercase text-muted">{children}</div>;
}

function Field({ label, htmlFor, hint, required, children }: {
  label: string; htmlFor: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex-1">
      <label htmlFor={htmlFor} className="block text-[12px] font-bold tracking-wide uppercase text-muted mb-1.5">
        {label}{required && <span className="text-rose ml-0.5" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted mt-1 font-medium">{hint}</p>}
    </div>
  );
}
