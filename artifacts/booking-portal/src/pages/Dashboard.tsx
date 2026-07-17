import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, CheckCircle2, AlertCircle, Plus, CalendarDays, ArrowUpRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import Badge, { statusTone } from '../components/Badge';
import { useCounter } from '../hooks/useCounter';

export default function Dashboard() {
  const { profile, role, isDemo, demoProposals } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    async function load() {
      let q = supabase.from('event_proposals').select('*').order('date_submitted', { ascending: false }).limit(8);
      if (role === 'student') q = q.eq('officer_id', profile.id);
      const { data } = await q;
      setProposals(data ?? []);
      setLoading(false);
    }
    if (profile) load();
  }, [profile, role, isDemo]);

  const source: any[] = isDemo
    ? (role === 'student' ? demoProposals.filter((p: any) => p.officer_id === profile?.id) : demoProposals)
    : proposals;

  const pending   = source.filter((p) => ['Pending', 'Under Review'].includes(p.status)).length;
  const approved  = source.filter((p) => p.status === 'Approved').length;
  const needsAttn = source.filter((p) => p.status === 'Needs Revision').length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">
        <div className="anim-fade-up">
          <div className="eyebrow">
            {role === 'student' ? 'My proposals' : 'Overview'}
          </div>
          <h1 className="page-title">
            {role === 'student' ? 'Proposal tracker' : 'Dashboard'}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center anim-fade-up" style={{ '--anim-delay': '60ms' } as any}>
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

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" role="group" aria-label="Summary statistics">
        <StatCard value={pending}   label="In progress"     color="#103F7A" bg="rgba(16,63,122,0.06)"   icon={Clock3}        delay={80}  />
        <StatCard value={approved}  label="Approved"        color="#0F9B58" bg="rgba(15,155,88,0.06)"   icon={CheckCircle2}  delay={160} />
        <StatCard value={needsAttn} label="Needs attention" color="#BD2F4A" bg="rgba(189,47,74,0.06)"   icon={AlertCircle}   delay={240} />
      </div>

      {/* Activity list */}
      <div>
        <div className="flex items-center justify-between mb-4 anim-fade-up" style={{ '--anim-delay': '200ms' } as any}>
          <h2 className="text-[10.5px] font-black tracking-[0.15em] uppercase text-[#6B7385]">Recent activity</h2>
          {source.length > 0 && (
            <Link
              to={role === 'student' ? '/submit' : '/queue'}
              className="text-[11.5px] font-bold flex items-center gap-0.5 hover:underline underline-offset-2"
              style={{ color: '#103F7A' }}
            >
              {role === 'student' ? 'New proposal' : 'View queue'}
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm py-4" style={{ color: '#6B7385' }} aria-live="polite">
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(16,63,122,0.2)', borderTopColor: '#103F7A' }} aria-hidden="true" />
            Loading…
          </div>
        ) : source.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-12 text-center anim-scale-in"
            style={{ background: '#FEFCF9', border: '1.5px dashed #E0D9CF', '--anim-delay': '220ms' } as any}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#E6EFF8' }} aria-hidden="true">
              <Clock3 className="w-6 h-6" style={{ color: '#103F7A' }} strokeWidth={1.75} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#6B7385' }}>
              {role === 'student' ? 'No proposals yet.' : 'Nothing here yet.'}
            </p>
            {role === 'student' && (
              <Link to="/submit" className="inline-flex items-center gap-1 mt-3 text-sm font-bold hover:underline underline-offset-2" style={{ color: '#103F7A' }}>
                Submit your first <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
              </Link>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden anim-fade-up"
            style={{
              background: '#FEFCF9',
              border: '1px solid #E0D9CF',
              boxShadow: '0 1px 3px rgba(12,17,29,0.05), 0 4px 16px rgba(12,17,29,0.06)',
              '--anim-delay': '220ms',
            } as any}
          >
            {source.map((p: any, i: number) => (
              <div
                key={p.proposal_id}
                className="px-5 py-4 flex items-center gap-4 transition-colors anim-fade-up"
                style={{
                  borderTop: i > 0 ? '1px solid #EDE8E2' : 'none',
                  '--anim-delay': `${280 + i * 45}ms`,
                } as any}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#F8F5F0'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <span
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black tabular-nums"
                  style={{ background: '#EDE8E2', color: '#6B7385' }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13.5px] truncate text-[#0C111D]">{p.event_title}</div>
                  <div className="text-[11.5px] mt-0.5 truncate" style={{ color: '#6B7385' }}>
                    {p.venue_name} · {p.event_date}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                  {role === 'student' && p.status === 'Needs Revision' && (
                    <Link to={`/submit?edit=${p.proposal_id}`} className="text-[11.5px] font-bold hover:underline underline-offset-2" style={{ color: '#76560A' }}>
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  value, label, color, bg, icon: Icon, delay,
}: { value: number; label: string; color: string; bg: string; icon: React.ComponentType<any>; delay: number }) {
  const count = useCounter(value, 650, delay + 120);
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4 anim-fade-up"
      style={{
        background: '#FEFCF9',
        border: '1px solid #E0D9CF',
        boxShadow: '0 1px 3px rgba(12,17,29,0.05), 0 4px 16px rgba(12,17,29,0.06)',
        cursor: 'default',
        '--anim-delay': `${delay}ms`,
      } as any}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(12,17,29,0.10), 0 2px 6px rgba(12,17,29,0.06)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(12,17,29,0.05), 0 4px 16px rgba(12,17,29,0.06)';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }} aria-hidden="true">
        <Icon className="w-5 h-5" strokeWidth={2} style={{ color }} />
      </div>
      <div>
        <div className="text-[10px] font-black tracking-[0.14em] uppercase" style={{ color, opacity: 0.65 }}>{label}</div>
        <div
          className="font-display text-[2.5rem] font-bold leading-none mt-0.5 tracking-[-0.04em] tabular-nums"
          style={{ color }}
          aria-label={`${value} ${label}`}
        >
          {count}
        </div>
      </div>
    </div>
  );
}
