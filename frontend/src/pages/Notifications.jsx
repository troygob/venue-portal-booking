import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Notifications() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', profile.id)
      .order('date_sent', { ascending: false })
    setItems(data ?? [])
  }

  useEffect(() => { if (profile) load() }, [profile])

  async function markRead(id) {
    await supabase.from('notifications').update({ read_status: 'Read' }).eq('notification_id', id)
    setItems((prev) => prev.map((n) => (n.notification_id === id ? { ...n, read_status: 'Read' } : n)))
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Notifications</h1>
        <p className="text-muted text-sm mt-1">Automated updates whenever a proposal you care about changes status.</p>
      </header>

      <ul className="bg-card border border-line rounded-xl divide-y divide-line" aria-live="polite">
        {items.length === 0 && <li className="px-4 py-4 text-sm text-muted">No notifications yet.</li>}
        {items.map((n) => (
          <li key={n.notification_id}>
            <button
              onClick={() => markRead(n.notification_id)}
              className={`w-full text-left px-4 py-3 flex gap-3 items-start ${n.read_status === 'Unread' ? 'bg-[#FBF6E8]' : ''}`}
            >
              {n.read_status === 'Unread' && (
                <span className="w-1.5 h-1.5 rounded-full bg-brass mt-1.5 shrink-0" aria-hidden="true" />
              )}
              <span>
                <span className={`block text-sm ${n.read_status === 'Unread' ? 'font-semibold' : ''}`}>{n.message}</span>
                <span className="block font-mono text-[11px] text-muted mt-0.5">
                  {new Date(n.date_sent).toLocaleString()}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
