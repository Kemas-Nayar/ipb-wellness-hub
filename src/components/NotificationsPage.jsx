import React, { useState } from 'react';
import '../styles/NotificationsPage.css';

// SVG Icons
const StarIcon = ({ color = '#fff' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const BellIcon = ({ color = '#fff' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const CheckIcon = ({ color = '#fff' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
    <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ReadCheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ICON_MAP = {
  achievement: StarIcon,
  tips: BellIcon,
  workout: CheckIcon,
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'achievement',
    title: 'Pencapaian Terbuka!',
    description: 'Kerja bagus! kamu meraih lencana "Morning Person" selama 7 hari berturut-turut.',
    timestamp: 'Baru saja',
    color: '#F2C94C',
    read: false,
  },
  {
    id: 2,
    type: 'tips',
    title: 'Tips Kesehatan!',
    description: 'Konsumsi protein untuk kepenuhan serat harian',
    timestamp: '1 jam yang lalu',
    color: '#C8102E',
    read: false,
  },
  {
    id: 3,
    type: 'workout',
    title: 'Latihan sudah selesai!',
    description: 'Selamat! kamu telah melakukan latihan selama 30 menit',
    timestamp: '1 hari yang lalu',
    color: '#2F5DAA',
    read: true,
  },
];

const NotificationsPage = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const deleteNotif = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="notif-page">
      {/* Header */}
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

      {/* Unread banner */}
      {unreadCount > 0 && (
        <div className="notif-unread-banner">
          <div className="notif-unread-dot" />
          <p className="notif-unread-text">{unreadCount} notifikasi belum dibaca</p>
        </div>
      )}

      {/* List */}
      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <div style={{ marginBottom: 12 }}>
              <BellIcon color="#ccc" />
            </div>
            <p>Belum ada notifikasi</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const IconComponent = ICON_MAP[notif.type] || BellIcon;

            return (
              <div
                key={notif.id}
                className={`notif-card${notif.read ? '' : ' unread'}`}
                onClick={() => !notif.read && markRead(notif.id)}
              >
                {/* Unread dot */}
                {!notif.read && <div className="notif-card-dot" />}

                {/* Icon bubble */}
                <div
                  className="notif-icon-bubble"
                  style={{
                    background: notif.read ? `${notif.color}55` : notif.color,
                  }}
                >
                  <IconComponent color={notif.read ? notif.color : '#fff'} />
                </div>

                {/* Content */}
                <div className="notif-card-content">
                  <p className={`notif-card-title${notif.read ? ' read' : ''}`}>
                    {notif.title}
                  </p>
                  <p className={`notif-card-desc${notif.read ? ' read' : ''}`}>
                    {notif.description}
                  </p>
                </div>

                {/* Bottom row */}
                <div className="notif-card-bottom">
                  <div>
                    {notif.read ? (
                      <span className="notif-badge-read">
                        <ReadCheckIcon />
                        Sudah dibaca
                      </span>
                    ) : (
                      <span className="notif-badge-new">Baru</span>
                    )}
                  </div>
                  <div className="notif-card-right">
                    <span className="notif-timestamp">{notif.timestamp}</span>
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