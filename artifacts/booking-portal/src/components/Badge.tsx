const STYLES: Record<string, string> = {
  navy:  'text-[#103F7A] bg-[#E6EFF8] ring-1 ring-[#103F7A]/15',
  gold:  'text-[#76560A] bg-[#FBF0D5] ring-1 ring-[#C8961A]/20',
  rose:  'text-[#BD2F4A] bg-[#FCEAEE] ring-1 ring-[#BD2F4A]/15',
  muted: 'text-[#6B7385] bg-[#F0EDE8] ring-1 ring-black/5',
};

export default function Badge({ tone = 'muted', children }: { tone?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold tracking-wider uppercase ${STYLES[tone] ?? STYLES.muted}`}>
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
