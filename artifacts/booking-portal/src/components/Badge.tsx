const STYLES: Record<string, string> = {
  navy: 'bg-navy text-white',
  gold: 'bg-gold text-white',
  rose: 'bg-rose text-white',
  green: 'bg-emerald-600 text-white',
  muted: 'bg-line-strong/40 text-muted border border-line-strong',
};

export default function Badge({ tone = 'muted', children }: { tone?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${STYLES[tone] ?? STYLES.muted}`}
    >
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
