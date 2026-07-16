const TONES = {
  navy: 'bg-navy-light text-navy-deep',
  gold: 'bg-gold-soft text-gold-dark',
  rose: 'bg-rose-soft text-rose',
  muted: 'bg-cloud text-muted border border-line',
}

const DOT = {
  navy: 'bg-navy',
  gold: 'bg-gold-dark',
  rose: 'bg-rose',
  muted: 'bg-muted',
}

export default function Badge({ tone = 'muted', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[tone]}`} aria-hidden="true" />
      {children}
    </span>
  )
}

export function statusTone(status) {
  if (status === 'Approved') return 'navy'
  if (status === 'Rejected') return 'rose'
  if (status === 'Needs Revision') return 'gold'
  return 'muted'
}
