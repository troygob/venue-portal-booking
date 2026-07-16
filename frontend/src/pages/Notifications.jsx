import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Notifications() {
  const { profile, isDemo, demoNotifications, setDemoNotifications } = useAuth()
  const [items, setItems] = useState([])

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', profile.id)
      .order('date_sent', { ascending: false })
    setItems(data ?? [])
  }

  useEffect(() => {
    if (!isDemo && profile) load()
  }, [profile, isDemo])

  const visibleItems = isDemo
    ? demoNotifications
        .filter((n) => n.recipient_id === profile.id)
        .sort((a, b) => new Date(b.date_sent) - new Date(a.date_sent))
    : items

  const unreadCount = visibleItems.filter((n) => n.read_status === 'Unread').length

  async function markRead(id) {
    if (isDemo) {
      setDemoNotifications((prev) => prev.map((n) => (n.notification_id === id ? { ...n, read_status: 'Read' } : n)))
      return
    }
    await supabase.from('notifications').update({ read_status: 'Read' }).eq('notification_id', id)
    setItems((prev) => prev.map((n) => (n.notification_id === id ? { ...n, read_status: 'Read' } : n)))
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy-deep flex items-center gap-2.5">
          Notifications
          {unreadCount > 0 && (
            <span className="text-xs font-sans font-bold bg-gold text-navy-deep rounded-full px-2 py-0.5">
              {unreadCount} new
            </span>
          )}
        </h1>
        <p className="text-muted text-sm mt-1.5">Automated updates whenever a proposal you care about changes status.</p>
      </header>

      {visibleItems.length === 0 ? (
        <div className="bg-card border border-dashed border-line rounded-xl px-4 py-10 text-center flex flex-col items-center gap-2">
          <BellOff className="w-6 h-6 text-muted" aria-hidden="true" />
          <p className="text-muted text-sm">No notifications yet.</p>
        </div>
      ) : (
        <ul className="bg-card border border-line rounded-xl divide-y divide-line shadow-card" aria-live="polite">
          {visibleItems.map((n) => (
            <li key={n.notification_id}>
              <button
                onClick={() => markRead(n.notification_id)}
                className={`w-full text-left px-4 py-3.5 flex gap-3 items-start hover:bg-navy-light/40 ${n.read_status === 'Unread' ? 'bg-gold-soft/60' : ''}`}
              >
                {n.read_status === 'Unread' ? (
                  <Bell className="w-4 h-4 text-gold-dark mt-0.5 shrink-0" aria-hidden="true" />
                ) : (
                  <span className="w-4 shrink-0" aria-hidden="true" />
                )}
                <span>
                  <span className={`block text-sm ${n.read_status === 'Unread' ? 'font-semibold' : ''}`}>
                    {n.message}
                    {n.read_status === 'Unread' && <span className="sr-only"> (unread)</span>}
                  </span>
                  <span className="block font-mono text-[11px] text-muted mt-1">
                    {new Date(n.date_sent).toLocaleString()}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
