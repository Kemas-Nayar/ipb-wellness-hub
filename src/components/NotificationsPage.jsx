import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useToast } from './Toast';
import '../styles/NotificationsPage.css';

const StarIcon  = ({ color = '#fff' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);
const BellIcon  = ({ color = '#fff' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const CheckIcon = ({ color = '#fff' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const ReadCheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const SpinnerIcon = () => (
  <svg className="notif-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

const TYPE_MAP = {
  achievement: { Icon: StarIcon,  color: '#F2C94C' },
  tips:        { Icon: BellIcon,  color: '#C8102E' },
  workout:     { Icon: CheckIcon, color: '#2F5DAA' },
  reservation: { Icon: CheckIcon, color: '#1A9E5C' },
  system:      { Icon: BellIcon,  color: '#6B7280' },
};

const formatRelative = (ts) => {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60)   return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

// Skeleton card
const SkeletonCard = () => (
  <div className="notif-card" style={{ opacity: 0.5, pointerEvents: 'none' }}>
    <div className="notif-icon-bubble" style={{ background: '#eee' }} />
    <div className="notif-card-content">
      <div className="skeleton skeleton-line" style={{ width: '50%', height: 13, marginBottom: 6 }} />
      <div className="skeleton skeleton-line" style={{ width: '80%', height: 11 }} />
    </div>
  </div>
);

const NotificationsPage = ({ onNavigate, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const toast = useToast();

  // Fetch from Supabase; fall back to empty array gracefully
  const fetchNotifications = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setLoading(false);
    if (!error && data) setNotifications(data);
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-' + user.id)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchNotifications())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id)
      .eq('is_read', false);
    toast.success('Semua notifikasi telah dibaca');
  };

  const deleteNotif = async (id) => {
    // Optimistic
    setNotifications(prev => prev.filter(n => n.id !== id));
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus notifikasi');
      fetchNotifications();
    }
  };

  return (
    <div className="notif-page">
      <div className="notif-header">
        <button className="notif-back-btn" onClick={() => onNavigate?.('home')}>
          <BackIcon />
        </button>
        <h1 className="notif-title">Notifications</h1>
        {unreadCount > 0 && (
          <button className="notif-mark-all-btn" onClick={markAllRead}>
            Baca Semua
          </button>
        )}
      </div>

      {unreadCount > 0 && (
        <div className="notif-unread-banner">
          <div className="notif-unread-dot" />
          <p className="notif-unread-text">{unreadCount} notifikasi belum dibaca</p>
        </div>
      )}

      <div className="notif-list">
        {loading ? (
          [1,2,3].map(i => <SkeletonCard key={i} />)
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <div style={{ marginBottom: 12 }}><BellIcon color="#ccc" /></div>
            <p>Belum ada notifikasi</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const { Icon, color } = TYPE_MAP[notif.type] || TYPE_MAP.system;
            return (
              <div
                key={notif.id}
                className={`notif-card${notif.is_read ? '' : ' unread'}`}
                onClick={() => !notif.is_read && markRead(notif.id)}
              >
                {!notif.is_read && <div className="notif-card-dot" />}
                <div className="notif-icon-bubble" style={{ background: notif.is_read ? `${color}55` : color }}>
                  <Icon color={notif.is_read ? color : '#fff'} />
                </div>
                <div className="notif-card-content">
                  <p className={`notif-card-title${notif.is_read ? ' read' : ''}`}>{notif.title}</p>
                  <p className={`notif-card-desc${notif.is_read ? ' read' : ''}`}>{notif.body}</p>
                </div>
                <div className="notif-card-bottom">
                  <div>
                    {notif.is_read ? (
                      <span className="notif-badge-read"><ReadCheckIcon />Sudah dibaca</span>
                    ) : (
                      <span className="notif-badge-new">Baru</span>
                    )}
                  </div>
                  <div className="notif-card-right">
                    <span className="notif-timestamp">{formatRelative(notif.created_at)}</span>
                    <button
                      className="notif-delete-btn"
                      onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                      title="Hapus notifikasi"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
