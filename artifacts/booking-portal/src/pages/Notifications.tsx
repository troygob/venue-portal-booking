import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
  const { profile, isDemo, demoNotifications, setDemoNotifications } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const { data } = await supabase.from('notifications').select('*')
      .eq('recipient_id', profile?.id).order('date_sent', { ascending: false });
    setItems((data as any) ?? []);
  }

  useEffect(() => { if (!isDemo && profile) load(); }, [profile, isDemo]);

  const visibleItems: any[] = isDemo
    ? [...demoNotifications]
        .filter((n: any) => n.recipient_id === profile?.id)
        .sort((a: any, b: any) => new Date(b.date_sent).getTime() - new Date(a.date_sent).getTime())
    : items;

  const unreadCount = visibleItems.filter((n: any) => n.read_status === 'Unread').length;

  async function markRead(id: string) {
    if (isDemo) {
      setDemoNotifications((prev: any[]) => prev.map((n: any) => n.notification_id === id ? { ...n, read_status: 'Read' } : n));
      return;
    }
    await supabase.from('notifications').update({ read_status: 'Read' }).eq('notification_id', id);
    setItems((prev: any[]) => prev.map((n: any) => n.notification_id === id ? { ...n, read_status: 'Read' } : n));
  }

  function markAllRead() {
    if (isDemo) {
      setDemoNotifications((prev: any[]) => prev.map((n: any) =>
        n.recipient_id === profile?.id ? { ...n, read_status: 'Read' } : n
      ));
    }
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: '#C9981F' }}>Inbox</p>
          <h1 className="page-title flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span
                className="text-sm font-black rounded-full px-2.5 py-0.5"
                style={{ background: '#C9981F', color: '#0A0F1C' }}
              >
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary" style={{ fontSize: '13px', padding: '0.5rem 1rem', minHeight: '36px' }}>
            <CheckCheck className="w-4 h-4" aria-hidden="true" />
            Mark all read
          </button>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl px-6 py-14 text-center" style={{ background: '#FFFFFF', border: '2px dashed #D0DAE8' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#E4EDF8' }} aria-hidden="true">
            <BellOff className="w-7 h-7 text-navy" strokeWidth={1.75} />
          </div>
          <p className="text-muted text-sm font-medium">No notifications yet.</p>
          <p className="text-muted text-[12px] mt-1">You'll be notified here whenever a proposal you care about changes status.</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(10,15,28,0.07), 0 4px 12px rgba(10,15,28,0.06)', border: '1px solid #D0DAE8' }}
          aria-live="polite"
        >
          {visibleItems.map((n: any, i: number) => {
            const isUnread = n.read_status === 'Unread';
            return (
              <div key={n.notification_id}>
                {i > 0 && <div className="mx-5 h-px" style={{ background: '#E8EFF6' }} />}
                <button
                  onClick={() => markRead(n.notification_id)}
                  className="w-full text-left px-5 py-4 flex gap-4 items-start transition-colors hover:bg-surface"
                  style={{ background: isUnread ? 'rgba(201,152,31,0.04)' : 'transparent' }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: isUnread ? '#FEF3D5' : '#F2F5FB' }}
                    aria-hidden="true"
                  >
                    <Bell className="w-4 h-4" strokeWidth={isUnread ? 2.5 : 1.75} style={{ color: isUnread ? '#C9981F' : '#8898AA' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13.5px] leading-snug ${isUnread ? 'font-semibold text-ink' : 'text-muted'}`}>
                      {n.message}
                      {isUnread && <span className="sr-only"> (unread)</span>}
                    </p>
                    <p className="font-mono text-[11px] text-muted mt-1.5">{formatDate(n.date_sent)}</p>
                  </div>
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: '#C9981F' }} aria-hidden="true" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
