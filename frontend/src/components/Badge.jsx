const TONES = {
  forest: 'bg-[#E4EDE7] text-forest',
  brass: 'bg-brass-soft text-brass-dark',
  clay: 'bg-clay-soft text-clay',
  muted: 'bg-ledger text-muted',
}

export default function Badge({ tone = 'muted', children }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  )
}

export function statusTone(status) {
  if (status === 'Approved') return 'forest'
  if (status === 'Rejected') return 'clay'
  if (status === 'Needs Revision') return 'brass'
  return 'muted'
}
