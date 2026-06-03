import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabase';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from 'recharts';
import nutrigymLogo        from '../assets/logo_nutrigymipb.png';
import healthAssistantLogo from '../assets/health_assistant.png';
import gymReservationLogo  from '../assets/gym_reservation.png';
import healthModuleLogo    from '../assets/health_module.png';
import { useRssNews }      from './useRssNews';
import '../styles/HomePage.css';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const RESERVATION_FETCH_LIMIT = 50; // FIX: was 200 — streak/chart only need recent data

const TIPS = [
  { id: 1, title: 'Stay Hydrated',    text: 'Minum minimal 8 gelas air sehari, terutama sebelum dan setelah olahraga.', icon: 'water' },
  { id: 2, title: 'Prioritas Tidur',  text: 'Targetkan 7–9 jam tidur agar otot pulih dan pikiran tetap segar.',          icon: 'sleep' },
  { id: 3, title: 'Nutrisi Seimbang', text: 'Kombinasikan karbohidrat, protein, dan lemak sehat untuk energi sepanjang hari.', icon: 'nutrition' },
];

const FEATURE_CARDS = [
  { key: 'health-assistant', label: 'AI Health Assistant', desc: 'Tanya soal kesehatan, nutrisi, dan program latihanmu kapan saja', color: '#C8102E', lightBg: '#FFF0F0', logo: healthAssistantLogo },
  { key: 'gym-reservation',  label: 'Gym Reservation',     desc: 'Reservasi sesi gym favoritmu dengan mudah dan cepat',             color: '#C8102E', lightBg: '#FFF0F0', logo: gymReservationLogo  },
  { key: 'health-module',    label: 'Health Module',       desc: 'Akses video edukasi kesehatan dan wellness terkurasi',            color: '#C8102E', lightBg: '#FFF0F0', logo: healthModuleLogo    },
];

// ─────────────────────────────────────────────
// PURE HELPERS
// ─────────────────────────────────────────────

const computeStreak = (reservations) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pastDates = [...new Set(
    reservations
      .filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date + 'T00:00:00');
        d.setHours(0, 0, 0, 0);
        return d <= today;
      })
      .map(r => r.date),
  )].sort().reverse();
  if (!pastDates.length) return 0;
  let streak = 0;
  let check  = new Date(today);
  for (const dateStr of pastDates) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((check - d) / 86_400_000);
    if (diffDays === 0 || diffDays === 1) { streak++; check = new Date(d); }
    else break;
  }
  return streak;
};

const generateActivityData = (reservations, days = 14) => {
  const today     = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days + 1);
  const dateMap = {};
  reservations.forEach(r => { if (r.date) dateMap[r.date] = true; });
  const data  = [];
  let   boost = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label   = `${d.getDate()}/${d.getMonth() + 1}`;
    boost = Math.max(0, boost - 7);
    if (dateMap[dateStr]) boost += 35;
    data.push({ date: label, activity: Math.round(Math.max(10, Math.min(100, 10 + boost))) });
  }
  return data;
};

const getBmiInfo = (bmi) => {
  if (!bmi) return null;
  const v = parseFloat(bmi);
  if (v < 18.5) return { label: 'Kurus',    color: '#2F5DAA', bg: '#EEF3FF' };
  if (v < 25)   return { label: 'Normal',   color: '#1A9E5C', bg: '#EDFFF5' };
  if (v < 30)   return { label: 'Gemuk',    color: '#E6A800', bg: '#FFF8E1' };
  return              { label: 'Obesitas', color: '#C8102E', bg: '#FFF0F0' };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return '';
  const months = ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatTime = (t) => {
  if (!t || typeof t !== 'string') return '';
  const match = t.match(/^(\d{2}):(\d{2})/);
  if (!match) { console.warn('[formatTime] unexpected format from DB:', t); return t; }
  return `${match[1]}.${match[2]}`;
};

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '';
  const d    = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now  = new Date();
  const diff = Math.floor((now - d) / 86_400_000);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  if (diff  <  7) return `${diff} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const loadVideoProgressFromStorage = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return { completed: 0, total: 10 };
    const raw      = localStorage.getItem('hm_progress');
    const progress = raw ? JSON.parse(raw) : {};
    if (typeof progress !== 'object' || progress === null || Array.isArray(progress))
      return { completed: 0, total: 10 };
    const completed = Object.values(progress).filter(v => (v?.progress || 0) >= 90).length;
    return { completed, total: 10 };
  } catch { return { completed: 0, total: 10 }; }
};

// ─────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────
const IcFire     = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E6A800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 6 6 10 6 14a6 6 0 0012 0c0-3-1.5-6-3-8-1 2-1.5 3-1.5 4s-.5 2-1.5 2"/></svg>;
const IcDumbbell = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M6 6v12M18 6v12M3 9v6M21 9v6"/></svg>;
const IcClock    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2F5DAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>;
const IcCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const IcRefresh  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;
const IcExternalLink = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;

const tipIcons = {
  water:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round"><path d="M12 2C6 8 4 13 4 16a8 8 0 0016 0c0-3-2-8-8-14z"/></svg>,
  sleep:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  nutrition: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};
const tipIconBg = { water: '#FFF0F0', sleep: '#FFF0F0', nutrition: '#FFF0F0' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{label}</p>
      <p className="chart-tooltip-value">{payload[0].value} pts</p>
    </div>
  );
};

// ─────────────────────────────────────────────
// NEWS SUB-COMPONENTS
// ─────────────────────────────────────────────

const NewsCard = ({ article, isSelected, onClick }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      className={`news-card${isSelected ? ' news-card--active' : ''}`}
      onClick={onClick}
      aria-expanded={isSelected}
    >
      {article.thumbnail && !imgError && (
        <div className="news-card-thumb">
          <img
            src={article.thumbnail}
            alt=""
            aria-hidden="true"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </div>
      )}
      <div className="news-card-body">
        <div className="news-card-meta-row">
          <span className="news-card-flag">{article.flag}</span>
          <span className="news-card-source">{article.source}</span>
          <span className="news-card-dot">·</span>
          <span className="news-card-time">{formatRelativeDate(article.timestamp)}</span>
        </div>
        <p className="news-card-title">{article.title}</p>
        {isSelected && (
          <div className="news-card-expand">
            {article.desc && <p className="news-card-desc">{article.desc}</p>}
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-card-link"
                onClick={e => e.stopPropagation()}
              >
                Baca selengkapnya <IcExternalLink />
              </a>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

const LangTabs = ({ value, onChange }) => (
  <div className="news-lang-tabs" role="tablist" aria-label="Filter bahasa">
    {['ALL', 'ID', 'EN'].map(lang => (
      <button
        key={lang}
        role="tab"
        aria-selected={value === lang}
        className={`news-lang-tab${value === lang ? ' news-lang-tab--active' : ''}`}
        onClick={() => onChange(lang)}
      >
        {lang === 'ID' ? 'ID' : lang === 'EN' ? 'EN' : 'Semua'}
      </button>
    ))}
  </div>
);

/**
 * FIX: NewsSection sekarang menerima prop className agar bisa dikontrol
 * dari parent (misalnya card-wide untuk full-width di dalam grid).
 */
const NewsSection = ({ className = '' }) => {
  const {
    filtered, loading, error, isFallback,
    langFilter, setLangFilter, refresh,
  } = useRssNews();

  const [selectedId, setSelectedId] = useState(null);

  const handleCardClick = (id) =>
    setSelectedId(prev => (prev === id ? null : id));

  return (
    <div className={`home-card news-section ${className}`}>
      <div className="card-header-row">
        <h3 className="card-title red">Berita Kesehatan &amp; Fitness</h3>
        <button
          className="news-refresh-btn"
          onClick={refresh}
          aria-label="Muat ulang berita"
          disabled={loading}
        >
          <span className={loading ? 'spin' : ''}><IcRefresh /></span>
        </button>
      </div>

      <LangTabs value={langFilter} onChange={v => { setLangFilter(v); setSelectedId(null); }} />

      {isFallback && error && (
        <div className="news-offline-notice" role="status">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="news-skeleton-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="news-skeleton-item">
              <div className="skeleton skeleton-line" style={{ width: '40%', marginBottom: 6 }} />
              <div className="skeleton skeleton-line" style={{ width: '90%', marginBottom: 4 }} />
              <div className="skeleton skeleton-line" style={{ width: '70%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="news-empty">
          <p>Tidak ada artikel untuk bahasa ini.</p>
        </div>
      ) : (
        <div className="news-list">
          {filtered.slice(0, 3).map(article => (
            <NewsCard
              key={article.id}
              article={article}
              isSelected={selectedId === article.id}
              onClick={() => handleCardClick(article.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
const HomePage = ({ onNavigate, user, refreshKey = 0, silentRefreshKey = 0 }) => {
  const [profile,         setProfile]         = useState(null);
  const [allReservations, setAllReservations] = useState([]);
  const [nextReservation, setNextReservation] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [bmi,             setBmi]             = useState(null);
  const [fetchError,      setFetchError]      = useState(null);
  const [unreadCount,     setUnreadCount]     = useState(0);

  const [videoProgress] = useState(() => loadVideoProgressFromStorage());

  const gymStreak     = useMemo(() => computeStreak(allReservations),  [allReservations]);
  const totalSessions = useMemo(() => allReservations.length,          [allReservations]);

  const totalDurationHrs = useMemo(() => {
    const total = allReservations.reduce((acc, r) => {
      if (!r.start_time || !r.end_time || !r.date) return acc;
      const s   = new Date(`${r.date}T${r.start_time}`);
      const e   = new Date(`${r.date}T${r.end_time}`);
      const hrs = (e - s) / 3_600_000;
      return acc + (hrs > 0 ? hrs : 0);
    }, 0);
    return total.toFixed(1);
  }, [allReservations]);

  const activityData = useMemo(() => generateActivityData(allReservations), [allReservations]);
  const bmiInfo      = useMemo(() => getBmiInfo(bmi),                       [bmi]);

  const hasActivity = allReservations.length > 0;
  const allZero     = gymStreak === 0 && totalSessions === 0;
  const progressPct = useMemo(
    () => Math.round((videoProgress.completed / Math.max(videoProgress.total, 1)) * 100),
    [videoProgress],
  );

  const resStatus = useMemo(() => {
    const now   = new Date();
    const start = nextReservation?.date && nextReservation?.start_time
      ? new Date(`${nextReservation.date}T${nextReservation.start_time}`) : null;
    const end   = nextReservation?.date && nextReservation?.end_time
      ? new Date(`${nextReservation.date}T${nextReservation.end_time}`) : null;
    const berlangsung = !!(start && end && now >= start && now <= end);
    return {
      berlangsung,
      text:  berlangsung ? 'Sedang Berlangsung' : 'Upcoming',
      color: berlangsung ? '#E6A800' : '#1A9E5C',
      bg:    berlangsung ? '#FFF8E1' : '#EDFFF5',
    };
  }, [nextReservation]);

  // Helper: fetch semua data dan update state
  // isSilent = true berarti tidak munculkan loading skeleton
  // PENTING: dependency [user?.id] bukan [user] — object `user` berubah reference
  // setiap token refresh meski user ID sama. Kalau pakai [user], fetchAllData
  // akan recreate setiap refresh → useEffect re-run → setLoading(true) → blank!
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!user?.id) { if (!isSilent) setLoading(false); return; }
    const userId = user.id; // capture ID saat callback dibuat
    const ctrl = { alive: true };

    if (!isSilent) setLoading(true);
    setFetchError(null);

    try {
      const [profResult, resResult, notifResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('nama_lengkap, email, berat_kg, tinggi_cm, avatar_url')
          .eq('id', userId)
          .single(),
        supabase
          .from('reservations')
          .select('id, date, start_time, end_time')
          .eq('user_id', userId)
          .order('date',       { ascending: true })
          .order('start_time', { ascending: true })
          .limit(RESERVATION_FETCH_LIMIT),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false),
      ]);

      if (!ctrl.alive) return;

      // Handle profile
      const prof = profResult.data;
      if (prof) {
        let avatarUrl = prof.avatar_url;
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          const { data: u } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
          avatarUrl = u?.publicUrl || null;
        }
        setProfile({ ...prof, avatar_url: avatarUrl });
        if (prof.berat_kg && prof.tinggi_cm) {
          const h = prof.tinggi_cm / 100;
          setBmi((prof.berat_kg / (h * h)).toFixed(1));
        }
      }

      // Handle reservations
      if (!resResult.error) {
        const rows = resResult.data || [];
        setAllReservations(rows);
        const upcoming = rows.find(r => {
          if (!r.date || !r.end_time) return false;
          return new Date(`${r.date}T${r.end_time}`) >= new Date();
        });
        setNextReservation(upcoming || null);
      } else {
        console.error('[HomePage] reservations fetch:', resResult.error.message);
        if (!isSilent) setFetchError('Gagal memuat reservasi. Coba lagi.');
      }

      // Handle notifications count
      if (notifResult.count !== null) setUnreadCount(notifResult.count);

    } catch (err) {
      if (ctrl.alive && !isSilent) {
        console.error('[HomePage] unexpected error:', err);
        setFetchError('Terjadi kesalahan. Periksa koneksi dan coba lagi.');
      }
    } finally {
      if (ctrl.alive) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // <— hanya ID, bukan object user

  // Fetch awal / forced refresh (booking baru, dll) — tampilkan loading
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData, refreshKey]);

  // Silent refresh saat balik dari tab lain — data lama tetap tampil
  useEffect(() => {
    if (silentRefreshKey === 0) return; // skip mount
    fetchAllData(true);
  }, [silentRefreshKey]); // eslint-disable-line react-hooks/exhaustive-deps


  const firstName     = profile?.nama_lengkap?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const avatarInitial = firstName.charAt(0).toUpperCase();

  return (
    <div className="home-page">

      {/* ── HEADER ── */}
      <div className="home-header">
        <div className="home-header-left">
          <img src={nutrigymLogo} alt="NutriGym" className="home-logo" />
          <div>
            <h2 className="home-greeting">Hello, {firstName}!</h2>
            <p className="home-subtitle">Yuk olahraga bareng aku!</p>
          </div>
        </div>
        <div className="home-header-right">
          <button className="home-bell-btn" onClick={() => onNavigate('notifications')} aria-label="Notifikasi" style={{ position: 'relative' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                background: '#C8102E', color: '#fff',
                borderRadius: '50%', width: 16, height: 16,
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, pointerEvents: 'none',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div
            className="home-avatar"
            onClick={() => onNavigate('profile')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onNavigate('profile')}
            aria-label="Profil saya"
          >
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="Avatar" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
              : avatarInitial}
          </div>
        </div>
      </div>

      {/* ── ERROR BANNER ── */}
      {fetchError && !loading && (
        <div className="home-error-banner" role="alert">
          <span className="home-error-text">{fetchError}</span>
          <button className="home-error-retry" onClick={() => window.location.reload()} aria-label="Coba muat ulang">
            <IcRefresh /> Coba Lagi
          </button>
        </div>
      )}

      {/* ── STATS BANNER ── */}
      <div
        className="home-stats-banner"
        role="button"
        tabIndex={0}
        aria-label="Lihat riwayat reservasi"
        onClick={() => onNavigate('riwayat-reservasi')}
        onKeyDown={e => e.key === 'Enter' && onNavigate('riwayat-reservasi')}
        style={{ cursor: 'pointer' }}
      >
        <div className="stats-row">
          <div className="home-stat-item">
            <div className="stat-icon-wrap" style={{ background: '#FFF0F0' }}><IcFire /></div>
            <div>
              <p className="home-stat-value">{loading ? '—' : gymStreak}</p>
              <p className="home-stat-label">Day Streak</p>
            </div>
          </div>
          <div className="home-stat-item">
            <div className="stat-icon-wrap" style={{ background: '#FFF0F0' }}><IcDumbbell /></div>
            <div>
              <p className="home-stat-value">{loading ? '—' : totalSessions}</p>
              <p className="home-stat-label">Total Sesi</p>
            </div>
          </div>
          <div className="home-stat-item">
            <div className="stat-icon-wrap" style={{ background: '#FFF0F0' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg></div>
            <div>
              <p className="home-stat-value">{loading ? '—' : `${totalDurationHrs}j`}</p>
              <p className="home-stat-label">Durasi</p>
            </div>
          </div>
        </div>
        {!loading && allZero && (
          <button className="stats-nudge-btn" onClick={e => { e.stopPropagation(); onNavigate('gym-reservation'); }}>
            Mulai sesi pertama →
          </button>
        )}
      </div>

      {/* ── FEATURE CARDS ── */}
      <p className="section-label">Fitur Utama</p>
      <div className="feature-spotlight-list">
        {FEATURE_CARDS.map((f, idx) => (
          <button
            key={f.key}
            className="feature-spotlight-card"
            style={{ '--feat-color': f.color, '--feat-light': f.lightBg, animationDelay: `${idx * 70}ms` }}
            onClick={() => onNavigate(f.key)}
          >
            <div className="feat-icon-container">
              <img src={f.logo} alt={f.label} className="feat-logo" />
            </div>
            <div className="feat-content">
              <p className="feat-title" style={{ color: f.color }}>{f.label}</p>
              <p className="feat-desc">{f.desc}</p>
            </div>
            <div className="feat-arrow" style={{ background: f.lightBg }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* ── CARDS GRID ── */}
      <p className="section-label">Ringkasan</p>
      <div className="home-cards">

        {/* Aktivitas Latihan */}
        <div className="home-card">
          <div className="card-header-row">
            <h3 className="card-title red">Aktivitas Latihan</h3>
            <span className="score-badge">{activityData[activityData.length - 1]?.activity ?? 10} pts</span>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 90, borderRadius: 12, marginTop: 10 }} />
          ) : hasActivity ? (
            <>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={activityData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f9f9f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#ccc', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 9, fill: '#ccc', fontFamily: 'Poppins' }} axisLine={false} tickLine={false} domain={['dataMin', 'dataMax + 20']} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="activity" stroke="var(--blue)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--blue)', strokeWidth: 0 }} isAnimationActive={true} animationDuration={800} />
                </LineChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                <span className="chart-legend-dot" style={{ background: 'var(--blue)' }} />
                <span className="chart-legend-text">Tren rutinitas</span>
              </div>
            </>
          ) : (
            <div className="chart-empty-state">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>
              <p className="chart-empty-title">Belum ada data aktivitas</p>
              <p className="chart-empty-desc">Grafik muncul setelah reservasi gym pertamamu</p>
              <button className="chart-empty-btn" onClick={() => onNavigate('gym-reservation')}>Reservasi Sekarang →</button>
            </div>
          )}
        </div>

        {/*
          FIX: Removed compact-grid wrapper so these cards join the main home-cards grid,
          creating a perfect 2x2 layout on desktop without stretching.
        */}
        <div className="home-card">
          <h3 className="card-title red">Reservasiku</h3>
          {loading ? (
            <>
              <div className="skeleton skeleton-line" style={{ width: '60%', marginBottom: 8 }} />
              <div className="skeleton skeleton-line" style={{ width: '80%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 32, borderRadius: 12 }} />
            </>
          ) : nextReservation ? (
            <>
              <div className="reservation-info">
                <div className="reservation-icon-wrap"><IcCalendar /></div>
                <div style={{ minWidth: 0 }}>
                  <p className="reservation-date">{formatDate(nextReservation.date) || 'Tanggal tidak tersedia'}</p>
                  <p className="reservation-time">
                    {nextReservation.start_time && nextReservation.end_time
                      ? `${formatTime(nextReservation.start_time)} – ${formatTime(nextReservation.end_time)}`
                      : 'Waktu belum ditentukan'}
                  </p>
                  <span className="reservation-status-badge" style={{ color: resStatus.color, background: resStatus.bg }}>
                    {resStatus.text}
                  </span>
                </div>
              </div>
              <button className="reservation-btn" onClick={() => onNavigate('riwayat-reservasi')}>Lihat semua →</button>
            </>
          ) : (
            <div className="reservation-empty">
              <p className="empty-state">Belum ada reservasi</p>
              <button className="reservation-btn" onClick={() => onNavigate('gym-reservation')}>+ Buat Reservasi</button>
            </div>
          )}
        </div>

        <div className="home-card">
          <h3 className="card-title red">Video Selesai</h3>
          <div className="video-progress-circle-wrap">
            <svg width="68" height="68" viewBox="0 0 68 68">
              <circle cx="34" cy="34" r="28" fill="none" stroke="#f0f0f0" strokeWidth="6" />
              <circle cx="34" cy="34" r="28" fill="none" stroke="#E6A800" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPct / 100)}`}
                transform="rotate(-90 34 34)"
              />
              <text x="34" y="34" textAnchor="middle" dominantBaseline="middle"
                fontSize="12" fontWeight="800" fill="#333" fontFamily="Poppins, sans-serif">
                {progressPct}%
              </text>
            </svg>
          </div>
          <p className="progress-label">{videoProgress.completed}/{videoProgress.total} video</p>
          <button className="card-link-btn" onClick={() => onNavigate('health-module')}>Lihat modul →</button>
        </div>

        {/*
          TIPS: 3 columns inline to save space
        */}
        <div className="home-card card-wide" style={{ padding: '8px 12px' }}>
          <div className="tips-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            {TIPS.map(tip => (
              <div className="tips-item-inline" key={tip.id} style={{ padding: '4px', border: 'none', background: 'transparent' }}>
                <div className="tips-icon-inline" style={{ background: tipIconBg[tip.icon], width: 24, height: 24 }}>{tipIcons[tip.icon]}</div>
                <div>
                  <p className="tips-item-title">{tip.title}</p>
                  <p className="tips-item-text">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── NEWS SECTION ── */}
      <div style={{ padding: '0 16px 16px', marginTop: '16px' }}>
        <NewsSection />
      </div>

    </div>
  );
};

export default HomePage;