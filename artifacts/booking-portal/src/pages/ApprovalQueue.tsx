import { useEffect, useState } from 'react';
import { Check, Undo2, X, Users, Wallet, Clock3, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { fmtMoney, ROLE_LABELS } from '../lib/roles';
import Badge, { statusTone } from '../components/Badge';

const OPEN_STATUSES = ['Pending', 'Under Review'];
const MANAGERIAL_ROLES = ['dept_head', 'school_admin', 'facilities'];

const ROLE_COLORS: Record<string, string> = {
  dept_head: '#3B82F6',
  school_admin: '#A855F7',
  facilities: '#F97316',
};

export default function ApprovalQueue() {
  const { role, isDemo, demoProposals, setDemoProposals, setDemoNotifications } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [approvedByMap, setApprovedByMap] = useState<Record<string, string[]>>({});
  const [remarksFor, setRemarksFor] = useState<{ proposal_id: string; decision: string } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('event_proposals').select('*').in('status', OPEN_STATUSES).order('date_submitted');
    const list = data ?? [];
    setProposals(list);
    if (list.length > 0) {
      const { data: steps } = await supabase.from('approval_steps')
        .select('proposal_id, approver_role, status, action_date')
        .in('proposal_id', list.map((p: any) => p.proposal_id)).eq('status', 'Approved');
      const map: Record<string, string[]> = {};
      for (const s of steps ?? []) {
        const p = list.find((x: any) => x.proposal_id === s.proposal_id);
        if (p && new Date(s.action_date) >= new Date(p.date_submitted))
          map[s.proposal_id] = [...new Set([...(map[s.proposal_id] ?? []), s.approver_role])];
      }
      setApprovedByMap(map);
    }
  }

  useEffect(() => { if (!isDemo) load(); }, [role, isDemo]);

  const visibleProposals: any[] = isDemo
    ? demoProposals.filter((p: any) => OPEN_STATUSES.includes(p.status))
    : proposals;

  function approvedRolesFor(p: any): string[] {
    return isDemo ? (p.approved_roles ?? []) : (approvedByMap[p.proposal_id] ?? []);
  }

  async function decide(proposal_id: string, decision: string, note?: string) {
    setBusyId(proposal_id);
    try {
      if (isDemo) {
        const p = demoProposals.find((x: any) => x.proposal_id === proposal_id);
        if (decision === 'approve') {
          const approvedRoles = [...new Set([...(p?.approved_roles ?? []), role])] as string[];
          const fullyApproved = MANAGERIAL_ROLES.every((r) => approvedRoles.includes(r));
          setDemoProposals((prev: any[]) => prev.map((x: any) =>
            x.proposal_id === proposal_id
              ? { ...x, approved_roles: approvedRoles, status: fullyApproved ? 'Approved' : 'Under Review' }
              : x
          ));
          if (fullyApproved) {
            setDemoNotifications((prev: any[]) => [{
              notification_id: `n-${Date.now()}`, recipient_id: p?.officer_id,
              message: `Your proposal '${p?.event_title}' has been fully approved.`,
              date_sent: new Date().toISOString(), read_status: 'Unread',
            }, ...prev]);
          }
        } else {
          const outcome = decision === 'reject' ? 'Rejected' : 'Needs Revision';
          setDemoProposals((prev: any[]) => prev.map((x: any) =>
            x.proposal_id === proposal_id
              ? { ...x, status: outcome, approved_roles: [], ...(decision === 'revise' ? { revision_remarks: note } : {}) }
              : x
          ));
          setDemoNotifications((prev: any[]) => [{
            notification_id: `n-${Date.now()}`, recipient_id: p?.officer_id,
            message: decision === 'reject'
              ? `Your proposal '${p?.event_title}' was rejected. ${note ? `Remarks: ${note}` : ''}`
              : `Revision requested on '${p?.event_title}'. Remarks: ${note}`,
            date_sent: new Date().toISOString(), read_status: 'Unread',
          }, ...prev]);
        }
      }
    } finally {
      setBusyId(null); setRemarksFor(null); setRemarks('');
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: '#C9981F' }}>Review</p>
        <h1 className="page-title">{role === 'facilities' ? 'Venue confirmations' : 'Approval queue'}</h1>
        <p className="text-muted text-sm mt-2 max-w-xl">
          All three managerial roles must sign off — a proposal is only approved once each has confirmed.
        </p>
      </div>

      {visibleProposals.length === 0 ? (
        <div className="rounded-2xl px-6 py-12 text-center" style={{ background: '#FFFFFF', border: '2px dashed #D0DAE8' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#E4EDF8' }} aria-hidden="true">
            <Check className="w-6 h-6 text-navy" strokeWidth={2} />
          </div>
          <p className="text-muted text-sm font-medium">Queue is clear — nothing awaiting review.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleProposals.map((p: any) => {
            const approvedRoles = approvedRolesFor(p);
            const alreadyApprovedByMe = approvedRoles.includes(role ?? '');
            const isExpanded = expandedId === p.proposal_id;

            return (
              <div
                key={p.proposal_id}
                className="rounded-2xl overflow-hidden transition-shadow"
                style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,15,28,0.07), 0 4px 12px rgba(10,15,28,0.06)', border: '1px solid #D0DAE8' }}
              >
                {/* Card header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.proposal_id)}
                  className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-surface transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1">
                      <span className="font-bold text-[15px] text-ink">{p.event_title}</span>
                      <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="w-3.5 h-3.5" aria-hidden="true" />{p.event_date} · {p.start_time?.slice(0,5)}–{p.end_time?.slice(0,5)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" aria-hidden="true" />{p.estimated_attendance} attendees
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5" aria-hidden="true" />{fmtMoney(p.budget_estimate)}
                      </span>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-muted shrink-0 mt-1" aria-hidden="true" />
                    : <ChevronDown className="w-4 h-4 text-muted shrink-0 mt-1" aria-hidden="true" />
                  }
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-line">
                    {/* Purpose */}
                    <p className="text-sm text-muted leading-relaxed py-4">{p.purpose}</p>

                    {/* Approvals progress */}
                    <div className="mb-4">
                      <div className="text-[11px] font-bold tracking-widest uppercase text-muted mb-2.5">Approvals</div>
                      <div className="flex flex-wrap gap-2">
                        {MANAGERIAL_ROLES.map((r) => {
                          const done = approvedRoles.includes(r);
                          return (
                            <div
                              key={r}
                              className="flex items-center gap-2 rounded-xl px-3 py-2"
                              style={{
                                background: done ? '#E4EDF8' : '#F2F5FB',
                                border: `1.5px solid ${done ? '#164E9A' : '#D0DAE8'}`,
                              }}
                            >
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: done ? '#0F3D73' : '#D0DAE8' }}
                                aria-hidden="true"
                              >
                                {done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                              </div>
                              <span
                                className="text-[12px] font-bold"
                                style={{
                                  color: done ? '#0F3D73' : '#8898AA',
                                  borderLeft: r === role ? `2px solid ${ROLE_COLORS[r]}` : undefined,
                                  paddingLeft: r === role ? '8px' : undefined,
                                }}
                              >
                                {ROLE_LABELS[r]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action area */}
                    {remarksFor?.proposal_id === p.proposal_id ? (
                      <div className="rounded-xl p-4" style={{ background: '#F2F5FB', border: '1.5px solid #D0DAE8' }}>
                        <label htmlFor={`remarks-${p.proposal_id}`} className="block text-[12px] font-bold tracking-wide uppercase text-muted mb-2">
                          {remarksFor.decision === 'reject' ? 'Rejection reason (required)' : 'Revision notes'}
                        </label>
                        <textarea
                          id={`remarks-${p.proposal_id}`}
                          rows={2}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          className="field-input"
                          placeholder="Add your notes for the submitter…"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => decide(p.proposal_id, remarksFor.decision, remarks)}
                            disabled={busyId === p.proposal_id || (remarksFor.decision === 'reject' && !remarks.trim())}
                            className="btn-primary"
                            style={{ padding: '0.5rem 1rem', minHeight: '36px', fontSize: '13px' }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRemarksFor(null); setRemarks(''); }}
                            className="btn-secondary"
                            style={{ padding: '0.5rem 1rem', minHeight: '36px', fontSize: '13px', border: '1.5px solid #D0DAE8' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => decide(p.proposal_id, 'approve')}
                          disabled={busyId === p.proposal_id || alreadyApprovedByMe}
                          className="btn-primary"
                          style={{ padding: '0.5625rem 1.125rem', minHeight: '40px', fontSize: '13px' }}
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                          {alreadyApprovedByMe ? 'You approved this' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setRemarksFor({ proposal_id: p.proposal_id, decision: 'revise' })}
                          className="btn-secondary"
                          style={{ padding: '0.5625rem 1.125rem', minHeight: '40px', fontSize: '13px', border: '1.5px solid #C9981F', color: '#7A5A0B', background: '#FEF3D5' }}
                        >
                          <Undo2 className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                          Request revision
                        </button>
                        <button
                          onClick={() => setRemarksFor({ proposal_id: p.proposal_id, decision: 'reject' })}
                          className="btn-secondary"
                          style={{ padding: '0.5625rem 1.125rem', minHeight: '40px', fontSize: '13px', border: '1.5px solid #C0334F', color: '#C0334F', background: '#FDEAEE' }}
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
