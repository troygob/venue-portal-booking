import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, CheckCircle2, AlertCircle, Plus, CalendarDays, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Badge, { statusTone } from '../components/Badge';

export default function Dashboard() {
  const { profile, role, isDemo, demoProposals } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    async function load() {
      let query = supabase.from('event_proposals').select('*').order('date_submitted', { ascending: false }).limit(6);
      if (role === 'student') query = query.eq('officer_id', profile.id);
      const { data } = await query;
      setProposals(data ?? []);
      setLoading(false);
    }
    if (profile) load();
  }, [profile, role, isDemo]);

  const source: any[] = isDemo
    ? (role === 'student' ? demoProposals.filter((p: any) => p.officer_id === profile?.id) : demoProposals)
    : proposals;

  const pending = source.filter((p) => p.status === 'Pending' || p.status === 'Under Review').length;
  const approved = source.filter((p) => p.status === 'Approved').length;
  const needsAttention = source.filter((p) => p.status === 'Needs Revision').length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: '#C9981F' }}>
            {role === 'student' ? 'My proposals' : 'Overview'}
          </p>
          <h1 className="page-title">
            {role === 'student' ? 'Proposal tracker' : 'Dashboard'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === 'student' && (
            <Link to="/submit" className="btn-primary">
              <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
              New proposal
            </Link>
          )}
          <Link to="/calendar" className="btn-secondary">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            Calendar
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" role="group" aria-label="Summary statistics">
        <StatCard
          value={pending}
          label="In progress"
          icon={Clock3}
          accent="#164E9A"
          bg="rgba(22,78,154,0.07)"
        />
        <StatCard
          value={approved}
          label="Approved"
          icon={CheckCircle2}
          accent="#0F9B58"
          bg="rgba(15,155,88,0.07)"
        />
        <StatCard
          value={needsAttention}
          label="Needs attention"
          icon={AlertCircle}
          accent="#C0334F"
          bg="rgba(192,51,79,0.07)"
        />
      </div>

      {/* Proposals list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold tracking-widest uppercase text-muted">Recent activity</h2>
          {source.length > 0 && (
            <Link to={role === 'student' ? '/submit' : '/queue'} className="text-[12px] font-bold text-navy flex items-center gap-1 hover:underline underline-offset-2">
              {role === 'student' ? 'New proposal' : 'View queue'}
              <ArrowRight className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted text-sm py-4" aria-live="polite">
            <div className="w-4 h-4 rounded-full border-2 border-navy/20 border-t-navy animate-spin" aria-hidden="true" />
            Loading…
          </div>
        ) : source.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ background: '#FFFFFF', border: '2px dashed #D0DAE8' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: '#E4EDF8' }}
              aria-hidden="true"
            >
              <Clock3 className="w-6 h-6 text-navy" strokeWidth={1.75} />
            </div>
            <p className="text-muted text-sm font-medium">
              {role === 'student' ? "No proposals yet." : "Nothing here yet."}
            </p>
            {role === 'student' && (
              <Link to="/submit" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-navy hover:underline underline-offset-2">
                Submit your first proposal <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,15,28,0.07), 0 4px 12px rgba(10,15,28,0.06)', border: '1px solid #D0DAE8' }}>
            <ul className="divide-y" style={{ divideColor: '#E8EFF6' } as any}>
              {source.map((p: any, i: number) => (
                <li
                  key={p.proposal_id}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-surface transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-[13px]"
                    style={{ background: '#E4EDF8', color: '#164E9A' }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px] truncate">{p.event_title}</div>
                    <div className="text-muted text-[12px] mt-0.5">{p.venue_name} · {p.event_date}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                    {role === 'student' && p.status === 'Needs Revision' && (
                      <Link
                        to={`/submit?edit=${p.proposal_id}`}
                        className="text-[12px] font-bold text-gold-dark underline underline-offset-2 hover:no-underline"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  value, label, icon: Icon, accent, bg,
}: {
  value: number; label: string; icon: React.ComponentType<any>; accent: string; bg: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4 relative overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,15,28,0.07), 0 4px 12px rgba(10,15,28,0.06)', border: '1px solid #D0DAE8' }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: accent }} aria-hidden="true" />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: bg }}
        aria-hidden="true"
      >
        <Icon className="w-5 h-5" strokeWidth={2} style={{ color: accent }} />
      </div>
      <div>
        <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: accent, opacity: 0.7 }}>
          {label}
        </div>
        <div className="font-display text-4xl font-bold leading-none mt-1" style={{ color: accent }}>
          {value}
        </div>
      </div>
    </div>
  );
}
