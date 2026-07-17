const TONES: Record<string, string> = {
  navy: 'bg-navy-light text-navy-deep',
  gold: 'bg-gold-soft text-gold-dark',
  rose: 'bg-rose-soft text-rose',
  muted: 'bg-cloud text-muted border border-line',
};

const DOT: Record<string, string> = {
  navy: 'bg-navy',
  gold: 'bg-gold-dark',
  rose: 'bg-rose',
  muted: 'bg-muted',
};

export default function Badge({ tone = 'muted', children }: { tone?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone] ?? TONES.muted}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[tone] ?? DOT.muted}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function statusTone(status: string): string {
  if (status === 'Approved') return 'navy';
  if (status === 'Rejected') return 'rose';
  if (status === 'Needs Revision') return 'gold';
  return 'muted';
}
