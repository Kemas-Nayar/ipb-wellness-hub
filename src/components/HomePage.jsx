import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from 'recharts';
import nutrigymLogo        from '../assets/logo_nutrigymipb.png';
import healthAssistantLogo from '../assets/health_assistant.png';
import gymReservationLogo  from '../assets/gym_reservation.png';
import healthModuleLogo    from '../assets/health_module.png';
import '../styles/HomePage.css';

const ARTICLES = [
  { id: 1, title: 'HIIT for Beginners',  category: 'HIIT',  views: 900,  desc: 'Start your HIIT journey with these foundational moves.' },
  { id: 2, title: 'Yoga Recovery',        category: 'Yoga',  views: 1200, desc: 'How yoga helps your body recover faster after workouts.' },
  { id: 3, title: 'Cardio vs Strength',   category: 'Cardio',views: 850,  desc: 'Which is better for your fitness goals?' },
  { id: 4, title: 'Advanced Yoga Poses',  category: 'Yoga',  views: 980,  desc: 'Level up your yoga practice with these advanced poses.' },
  { id: 5, title: 'Gym Basics',           category: 'gym',   views: 760,  desc: 'Everything you need to know before hitting the gym.' },
  { id: 6, title: 'HIIT Fat Burn',        category: 'HIIT',  views: 1100, desc: 'Maximize fat burning with this HIIT protocol.' },
];

const TIPS = [
  { id: 1, title: 'Stay Hydrated',      text: 'Minum minimal 8 gelas air sehari, terutama sebelum dan setelah olahraga.', icon: 'water' },
  { id: 2, title: 'Prioritas Tidur',    text: 'Targetkan 7–9 jam tidur agar otot pulih dan pikiran tetap segar.',          icon: 'sleep' },
  { id: 3, title: 'Nutrisi Seimbang',   text: 'Kombinasikan karbohidrat, protein, dan lemak sehat untuk energi sepanjang hari.', icon: 'nutrition' },
];

const FEATURE_CARDS = [
  { key: 'health-assistant', label: 'AI Health Assistant', desc: 'Tanya soal kesehatan, nutrisi, dan program latihanmu kapan saja', color: '#2F5DAA', lightBg: '#EEF3FF', logo: healthAssistantLogo },
  { key: 'gym-reservation',  label: 'Gym Reservation',     desc: 'Reservasi sesi gym favoritmu dengan mudah dan cepat',             color: '#C8102E', lightBg: '#FFF0F0', logo: gymReservationLogo  },
  { key: 'health-module',    label: 'Health Module',        desc: 'Akses video edukasi kesehatan dan wellness terkurasi',             color: '#1A9E5C', lightBg: '#EDFFF5', logo: healthModuleLogo    },
];

// PURE HELPERS  (all outside the component — zero re-creation cost)

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
    if (Math.round((check - d) / 86_400_000) <= 1) {
      streak++;
      check = new Date(d);
      check.setDate(check.getDate() - 1);
    } else break;
  }
  return streak;
};

const generateActivityData = (reservations, days = 14) => {
  const today     = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days + 1);
  const dateMap = {};
  reservations.forEach(r => { if (r.date) dateMap[r.date] = true; });
  const data = [];
  let boost  = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label   = `${d.getDate()}/${d.getMonth() + 1}`;
    if (dateMap[dateStr]) boost += 35;
    boost = Math.max(0, boost - 7);
    data.push({ date: label, activity: Math.round(Math.max(10, Math.min(100, 10 + boost))) });
  }
  return data;
};


const { trendingCategory, trendingArticles } = (() => {
  const catViews = {}, catCount = {};
  ARTICLES.forEach(a => {
    const cat = a.category.toLowerCase();
    catViews[cat] = (catViews[cat] || 0) + a.views;
    catCount[cat] = (catCount[cat] || 0) + 1;
  });
  const scored = Object.keys(catViews)
    .map(cat => ({ cat, score: catViews[cat] * 0.7 + catCount[cat] * 1000 }))
    .sort((a, b) => b.score - a.score);
  const top = scored[0]?.cat || '';
  return {
    trendingCategory: top,
    trendingArticles: top ? ARTICLES.filter(a => a.category.toLowerCase() === top).sort((a, b) => b.views - a.views) : [],
  };
})();

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

const formatTime = (t) => t?.slice(0, 5).replace(':', '.') || '';

const loadVideoProgressFromStorage = () => {
  try {
    const raw      = localStorage.getItem('hm_progress');
    const progress = raw ? JSON.parse(raw) : {};
    if (typeof progress !== 'object' || progress === null || Array.isArray(progress)) return { completed: 0, total: 10 };
    const completed = Object.values(progress).filter(v => (v?.progress || 0) >= 90).length;
    return { completed, total: 10 };
  } catch {
    return { completed: 0, total: 10 };
  }
};

// SVG ICONS
const IcFire     = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E6A800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 6 6 10 6 14a6 6 0 0012 0c0-3-1.5-6-3-8-1 2-1.5 3-1.5 4s-.5 2-1.5 2"/></svg>;
const IcDumbbell = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M6 6v12M18 6v12M3 9v6M21 9v6"/></svg>;
const IcClock    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2F5DAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>;
const IcCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;

const tipIcons = {
  water:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F5DAA" strokeWidth="2" strokeLinecap="round"><path d="M12 2C6 8 4 13 4 16a8 8 0 0016 0c0-3-2-8-8-14z"/></svg>,
  sleep:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  nutrition: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A9E5C" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};
const tipIconBg = { water: '#EEF3FF', sleep: '#F3F0FF', nutrition: '#EDFFF5' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{label}</p>
      <p className="chart-tooltip-value">{payload[0].value} pts</p>
    </div>
  );
};


const SkeletonCard = ({ height = 90 }) => (
  <div className="skeleton" style={{ height, borderRadius: 16 }} />
);

// COMPONENT
const HomePage = ({ onNavigate, user, refreshKey = 0 }) => {
  const [profile,         setProfile]         = useState(null);
  const [allReservations, setAllReservations] = useState([]);
  const [nextReservation, setNextReservation] = useState(null);
  const [loading,         setLoading]         = useState(true);   // unified loading flag
  const [bmi,             setBmi]             = useState(null);
  const [videoProgress]                       = useState(loadVideoProgressFromStorage); // stable — localStorage
  const [selectedArticle, setSelectedArticle] = useState(null);

    const gymStreak        = useMemo(() => computeStreak(allReservations),        [allReservations]);
  const totalSessions    = useMemo(() => allReservations.length,                [allReservations]);
  const totalDurationHrs = useMemo(() => (totalSessions * 1.5).toFixed(1),     [totalSessions]);
  const activityData     = useMemo(() => generateActivityData(allReservations), [allReservations]);
  const bmiInfo          = useMemo(() => getBmiInfo(bmi),                       [bmi]);

  const hasActivity = allReservations.length > 0;
  const allZero     = gymStreak === 0 && totalSessions === 0;
  const progressPct = Math.round((videoProgress.completed / videoProgress.total) * 100);

    const now      = new Date();
  const resStart = nextReservation?.date && nextReservation?.start_time
    ? new Date(`${nextReservation.date}T${nextReservation.start_time}`) : null;
  const resEnd   = nextReservation?.date && nextReservation?.end_time
    ? new Date(`${nextReservation.date}T${nextReservation.end_time}`) : null;
  const resIsBerlangsung = resStart && resEnd && now >= resStart && now <= resEnd;
  const resStatusText    = resIsBerlangsung ? 'Sedang Berlangsung' : 'Upcoming';
  const resStatusColor   = resIsBerlangsung ? '#E6A800' : '#1A9E5C';
  const resStatusBg      = resIsBerlangsung ? '#FFF8E1' : '#EDFFF5';

  useEffect(() => {
    if (!user) return;
    let alive = true;

    const run = async () => {
      setLoading(true);

      // Fetch profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('nama_lengkap, email, berat_kg, tinggi_cm, avatar_url')
        .eq('id', user.id)
        .single();

      if (alive && prof) {
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

      // Fetch only the columns HomePage actually needs; add sensible limit
      const { data: res, error } = await supabase
        .from('reservations')
        .select('id, date, start_time, end_time')  
        .eq('user_id', user.id)
        .order('date',       { ascending: true })
        .order('start_time', { ascending: true })
        .limit(200);                                

      if (alive) {
        if (!error) {
          setAllReservations(res || []);
          const upcoming = (res || []).find(r => {
            if (!r.date || !r.end_time) return false;
            return new Date(`${r.date}T${r.end_time}`) >= new Date();
          });
          setNextReservation(upcoming || null);
        } else {
          console.error('[HomePage] reservations fetch:', error.message);
        }
        setLoading(false);
      }
    };

    run();
    return () => { alive = false; };
  }, [user, refreshKey]);   

    const firstName     = profile?.nama_lengkap?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const avatarInitial = firstName.charAt(0).toUpperCase();

    return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-header-left">
          <img src={nutrigymLogo} alt="NutriGym" className="home-logo" />
          <div>
            <h2 className="home-greeting">Hello, {firstName}!</h2>
            <p className="home-subtitle">Yuk olahraga bareng aku!</p>
          </div>
        </div>
        <div className="home-header-right">
          <button className="home-bell-btn" onClick={() => onNavigate('notifications')} aria-label="Notifikasi">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </button>
          <div className="home-avatar" onClick={() => onNavigate('profile')} role="button" tabIndex={0}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="Avatar" style={{ width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover' }} />
              : avatarInitial}
          </div>
        </div>
      </div>
      <div className="home-stats-banner" role="button" tabIndex={0}
        onClick={() => onNavigate('riwayat-reservasi')}
        style={{ cursor: 'pointer' }}>
        <div className="stats-row">
          <div className="home-stat-item">
            <div className="stat-icon-wrap" style={{ background: '#FFF8E1' }}><IcFire /></div>
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
            <div className="stat-icon-wrap" style={{ background: '#EEF3FF' }}><IcClock /></div>
            <div>
              <p className="home-stat-value">{loading ? '—' : `${totalDurationHrs}j`}</p>
              <p className="home-stat-label">Durasi</p>
            </div>
          </div>
        </div>
        {!loading && allZero && (
          <button
            className="stats-nudge-btn"
            onClick={(e) => { e.stopPropagation(); onNavigate('gym-reservation'); }}
          >
            Mulai sesi pertama →
          </button>
        )}
      </div>
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke={f.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        ))}
      </div>
      <p className="section-label">Ringkasan</p>
      <div className="home-cards">

        {/* BMI — only renders when data available */}
        {bmi && bmiInfo && (
          <div className="home-card card-wide bmi-card" style={{ background: bmiInfo.bg, borderColor: 'transparent' }}>
            <div className="bmi-left">
              <p className="bmi-label">Body Mass Index</p>
              <div className="bmi-value-row">
                <span className="bmi-number" style={{ color: bmiInfo.color }}>{bmi}</span>
                <span className="bmi-unit">kg/m²</span>
              </div>
              <span className="bmi-status" style={{ background: bmiInfo.color }}>{bmiInfo.label}</span>
              <p className="bmi-detail">{profile?.berat_kg} kg · {profile?.tinggi_cm} cm</p>
            </div>
            <div className="bmi-gauge-wrap">
              <div className="bmi-gauge-bar">
                <div className="bmi-gauge-fill" style={{
                  width: `${Math.min(Math.max((parseFloat(bmi) - 10) / 30 * 100, 5), 95)}%`,
                  background: bmiInfo.color,
                }} />
                <div className="bmi-gauge-thumb" style={{
                  left: `${Math.min(Math.max((parseFloat(bmi) - 10) / 30 * 100, 5), 95)}%`,
                  background: bmiInfo.color,
                }} />
              </div>
              <div className="bmi-gauge-labels"><span>Kurus</span><span>Normal</span><span>Gemuk</span></div>
            </div>
          </div>
        )}

        {/* Aktivitas Latihan */}
        <div className="home-card card-wide">
          <div className="card-header-row">
            <h3 className="card-title red">Aktivitas Latihan</h3>
            <span className="score-badge">{activityData[activityData.length - 1]?.activity ?? 10} pts</span>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ) : hasActivity ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={activityData} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#ccc', fontFamily: 'Poppins' }}
                    axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 9, fill: '#ccc', fontFamily: 'Poppins' }}
                    axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="activity" stroke="#E6A800" strokeWidth={2.5}
                    dot={false} activeDot={{ r: 4, fill: '#E6A800', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                <span className="chart-legend-dot" />
                <span className="chart-legend-text">Skor naik setiap reservasi gym</span>
              </div>
            </>
          ) : (
            <div className="chart-empty-state">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 12h4l3-8 4 16 3-8h4" />
              </svg>
              <p className="chart-empty-title">Belum ada data aktivitas</p>
              <p className="chart-empty-desc">Grafik muncul setelah reservasi gym pertamamu</p>
              <button className="chart-empty-btn" onClick={() => onNavigate('gym-reservation')}>
                Reservasi Sekarang →
              </button>
            </div>
          )}
        </div>

        {/* Reservasiku */}
        <div className="home-card card-half">
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
                  <span className="reservation-status-badge"
                    style={{ color: resStatusColor, background: resStatusBg }}>
                    {resStatusText}
                  </span>
                </div>
              </div>
              <button className="reservation-btn" onClick={() => onNavigate('riwayat-reservasi')}>
                Lihat semua →
              </button>
            </>
          ) : (
            <div className="reservation-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <p className="empty-state">Belum ada reservasi</p>
              <button className="reservation-btn" onClick={() => onNavigate('gym-reservation')}>+ Buat Reservasi</button>
            </div>
          )}
        </div>

        {/* Video Progress */}
        <div className="home-card card-half">
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

        {/* Trending */}
        <div className="home-card card-half">
          <div className="card-header-row">
            <h3 className="card-title red">Trending</h3>
            {trendingCategory && (
              <span className="trending-cat-badge">{trendingCategory.toUpperCase()}</span>
            )}
          </div>
          <div className="trending-list-inline">
            {trendingArticles.slice(0, 2).map((a, i) => (
              <button
                key={a.id}
                className={`trending-item-inline${selectedArticle?.id === a.id ? ' active' : ''}`}
                onClick={() => setSelectedArticle(selectedArticle?.id === a.id ? null : a)}
              >
                <span className="trending-rank-inline">#{i + 1}</span>
                <span className="trending-title-inline">{a.title}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
          {selectedArticle && (
            <div className="trending-detail-inline">
              <p className="trending-detail-title">{selectedArticle.title}</p>
              <p className="trending-detail-desc">{selectedArticle.desc}</p>
            </div>
          )}
        </div>

        {/* Tips Sehat */}
        <div className="home-card card-half">
          <h3 className="card-title red">Tips Sehat</h3>
          <div className="tips-list-inline">
            {TIPS.map(tip => (
              <div className="tips-item-inline" key={tip.id}>
                <div className="tips-icon-inline" style={{ background: tipIconBg[tip.icon] }}>
                  {tipIcons[tip.icon]}
                </div>
                <div>
                  <p className="tips-item-title">{tip.title}</p>
                  <p className="tips-item-text">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;