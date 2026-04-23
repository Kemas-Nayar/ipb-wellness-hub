import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import imgTubuhAtas from '../assets/Latihan_Tubuh_Bagian_Atas.png';
import imgTubuhBawah from '../assets/Latihan_Tubuh_Bagian_Bawah.png';
import imgKardio from '../assets/Latihan_Kardio.png';
import imgInti from '../assets/Latihan_Inti.png';
import imgFullBody from '../assets/Full_Body_Strength.png';
import '../styles/HealthModulePage.css';

// ─── DATA ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'upper',
    title: 'Latihan Tubuh Bagian Atas',
    level: 'Intermediate',
    duration: '30 Min',
    desc: 'Build strength and tone your entire body with this effective workout',
    img: imgTubuhAtas,
    videos: [
      { id: 'dQw4w9WgXcQ', title: 'Upper Body Warm Up', week: 1 },
      { id: 'IODxDxX7oi4', title: 'Shoulder Press & Rows', week: 1 },
      { id: 'vc1E5CfRfos', title: 'Push & Pull Superset', week: 2 },
    ],
  },
  {
    id: 'lower',
    title: 'Latihan Tubuh Bagian Bawah',
    level: 'Intermediate',
    duration: '30 Min',
    desc: 'Build strength and tone your entire body with this effective workout',
    img: imgTubuhBawah,
    videos: [
      { id: 'aclHkVaku9U', title: 'Squat Fundamentals', week: 1 },
      { id: 'nhoikoUEI8U', title: 'Leg Press & Lunges', week: 1 },
      { id: 'kiBSwWordFE', title: 'Hamstring Focus', week: 2 },
    ],
  },
  {
    id: 'cardio',
    title: 'Latihan Kardio',
    level: 'Intermediate',
    duration: '30 Min',
    desc: 'Build strength and tone your entire body with this effective workout',
    img: imgKardio,
    videos: [
      { id: 'ml6cT4AZdqI', title: 'HIIT Cardio Blast', week: 1 },
      { id: 'M0uO8X3_tEA', title: 'Treadmill Interval', week: 1 },
    ],
  },
  {
    id: 'core',
    title: 'Latihan Inti',
    level: 'Pemula',
    duration: '30 Min',
    desc: 'Build strength and tone your entire body with this effective workout',
    img: imgInti,
    videos: [
      { id: 'DHD1-2P4Hm0', title: 'Core Stability Basics', week: 1 },
      { id: 'AnYl6Mv5pwo', title: 'Plank Variations', week: 1 },
    ],
  },
];

const TODAY_WORKOUT = {
  id: 'full-body',
  title: 'Latihan Kekuatan Tubuh',
  level: 'Intermediate',
  duration: '30 Min',
  desc: 'Build strength and tone your entire body with this effective workout',
  img: imgFullBody,
  videoId: 'vc1E5CfRfos',
};

const WEEKLY_TARGET = 5;

// ─── UTILS ───────────────────────────────────────────────────────────────────
const padTwo = (n) => String(n).padStart(2, '0');

const calcStreak = (reservations) => {
  if (!reservations?.length) return 0;
  const days = [...new Set(reservations.map(r => r.date))].sort().reverse();
  let streak = 0;
  let prev = null;
  for (const d of days) {
    const cur = new Date(d);
    if (!prev) { streak = 1; prev = cur; continue; }
    const diff = (prev - cur) / 86400000;
    if (diff === 1) { streak++; prev = cur; }
    else break;
  }
  return streak;
};

const calcDuration = (reservations) => {
  if (!reservations?.length) return '00:00';
  let totalMin = 0;
  for (const r of reservations) {
    const [sh, sm] = r.start_time.split(':').map(Number);
    const [eh, em] = r.end_time.split(':').map(Number);
    totalMin += (eh * 60 + em) - (sh * 60 + sm);
  }
  return `${padTwo(Math.floor(totalMin / 60))}:${padTwo(totalMin % 60)}`;
};

const getWeekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().split('T')[0];
};

const loadProgress = () => {
  try { return JSON.parse(localStorage.getItem('hm_progress') || '{}'); }
  catch { return {}; }
};

const saveProgress = (data) => {
  localStorage.setItem('hm_progress', JSON.stringify(data));
};

// ─── VIDEO PLAYER ─────────────────────────────────────────────────────────────
const VideoPlayer = ({ videoId, onClose, onProgress }) => {
  const iframeRef = useRef(null);
  return (
    <div className="hm-video-overlay" onClick={onClose}>
      <div className="hm-video-container" onClick={e => e.stopPropagation()}>
        <button className="hm-video-close" onClick={onClose}>✕</button>
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="hm-iframe"
          title="workout video"
        />
      </div>
    </div>
  );
};

// ─── VIDEO CARD ───────────────────────────────────────────────────────────────
const VideoCard = ({ cat, onWatch, progress }) => {
  const pct = progress?.[cat.videos?.[0]?.id]?.progress || 0;
  const totalVideos = cat.videos?.length || 0;
  const completedVideos = cat.videos?.filter(v => (progress?.[v.id]?.progress || 0) >= 90).length || 0;
  return (
    <div className="hm-video-card" onClick={() => onWatch(cat)}>
      <div className="hm-video-thumb">
        <img src={cat.img} alt={cat.title} />
        <div className="hm-play-btn">▶</div>
        {completedVideos === totalVideos && totalVideos > 0 && (
          <div className="hm-completed-badge">✓ Selesai</div>
        )}
      </div>
      <div className="hm-video-info">
        <h4 className="hm-video-title">{cat.title}</h4>
        <p className="hm-video-meta">{cat.videos?.length || 0} Minggu · {cat.videos?.length || 0} video</p>
        <button className="hm-tonton-btn" onClick={e => { e.stopPropagation(); onWatch(cat); }}>Tonton</button>
      </div>
    </div>
  );
};

// ─── DETAIL PAGE ─────────────────────────────────────────────────────────────
const DetailPage = ({ category, onBack, progress, onWatchVideo }) => {
  const others = CATEGORIES.filter(c => c.id !== category.id);
  return (
    <div className="hm-detail-page">
      <div className="hm-detail-header">
        <button className="hm-back-btn" onClick={onBack}>←</button>
      </div>
      <div className="hm-detail-info">
        <h2 className="hm-detail-title">{category.title}</h2>
        <p className="hm-detail-desc">{category.desc}</p>
        <p className="hm-detail-level">{category.level} · {category.duration}</p>
      </div>
      <div className="hm-detail-hero" onClick={() => onWatchVideo(category.videos[0]?.id)}>
        <img src={category.img} alt={category.title} className="hm-detail-hero-img" />
        <div className="hm-detail-play">▶</div>
      </div>
      <div className="hm-detail-body">
        <h3 className="hm-section-title">Video Lainnya</h3>
        {others.map(cat => (
          <VideoCard key={cat.id} cat={cat} onWatch={() => onWatchVideo(cat.videos[0]?.id)} progress={progress} />
        ))}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const HealthModulePage = ({ onNavigate, user }) => {
  const [reservations, setReservations] = useState([]);
  const [progress, setProgress] = useState(loadProgress());
  const [activeDetail, setActiveDetail] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchReservations = async () => {
      const { data } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      setReservations(data || []);
      setLoading(false);
    };
    fetchReservations();
  }, [user]);

  // Stats
  const streak = calcStreak(reservations);
  const duration = calcDuration(reservations);

  const allVideos = CATEGORIES.flatMap(c => c.videos);
  const completedCount = allVideos.filter(v => (progress[v.id]?.progress || 0) >= 90).length;
  const totalVideos = allVideos.length;

  const weekStart = getWeekStart();
  const weeklyDone = reservations.filter(r => r.date >= weekStart).length;
  const weeklyLeft = Math.max(0, WEEKLY_TARGET - weeklyDone);
  const weeklyPct = Math.min(100, Math.round((weeklyDone / WEEKLY_TARGET) * 100));

  const handleWatchVideo = (videoId) => {
    if (!videoId) return;
    setActiveVideo(videoId);
  };

  const handleVideoClose = () => {
    // Mark partial progress
    if (activeVideo) {
      const updated = { ...progress, [activeVideo]: { progress: Math.max(progress[activeVideo]?.progress || 0, 50), lastWatched: Date.now() } };
      setProgress(updated);
      saveProgress(updated);
    }
    setActiveVideo(null);
  };

  if (loading) return <div className="hm-loading">Loading...</div>;

  if (activeDetail) {
    return (
      <>
        <DetailPage
          category={activeDetail}
          onBack={() => setActiveDetail(null)}
          progress={progress}
          onWatchVideo={handleWatchVideo}
        />
        {activeVideo && <VideoPlayer videoId={activeVideo} onClose={handleVideoClose} />}
      </>
    );
  }

  return (
    <div className="hm-page">
      {/* Header */}
      <div className="hm-header">
        <button className="hm-back-btn" onClick={() => onNavigate('home')}>←</button>
        <div className="hm-header-text">
          <h2 className="hm-title">Modul Latihan</h2>
          <p className="hm-subtitle">Stay Active, Stay Healthy!</p>
        </div>
        <button className="hm-help-btn">?</button>
      </div>

      <div className="hm-body">
        {/* Stats Card */}
        <div className="hm-stats-card">
          <div className="hm-stats-row">
            <div className="hm-stat hm-stat-red">
              <span className="hm-stat-icon">🔥</span>
              <div>
                <p className="hm-stat-label">Gym Streak</p>
                <p className="hm-stat-value">{padTwo(streak)} hari</p>
              </div>
            </div>
            <div className="hm-stat hm-stat-blue">
              <span className="hm-stat-icon">⏱️</span>
              <div>
                <p className="hm-stat-label">Durasi</p>
                <p className="hm-stat-value">{duration} min</p>
              </div>
            </div>
            <div className="hm-stat hm-stat-yellow">
              <span className="hm-stat-icon">🏋️</span>
              <div>
                <p className="hm-stat-label-sm">Modul<br/>Terselesaikan</p>
                <p className="hm-stat-value">{completedCount}/{totalVideos}</p>
              </div>
            </div>
          </div>
          {/* Weekly Goal */}
          <div className="hm-weekly">
            <div className="hm-weekly-row">
              <span className="hm-weekly-label">Weekly Goal</span>
              <span className="hm-weekly-left">{weeklyLeft} workouts left</span>
            </div>
            <div className="hm-progress-track">
              <div className="hm-progress-fill" style={{ width: `${weeklyPct}%` }} />
              <span className="hm-progress-pct">{weeklyPct}%</span>
            </div>
          </div>
        </div>

        {/* Today's Workout */}
        <div className="hm-section-header">
          <div className="hm-section-bar" />
          <h3 className="hm-section-title">Today's Workout</h3>
        </div>

        <div className="hm-today-card" onClick={() => handleWatchVideo(TODAY_WORKOUT.videoId)}>
          <div className="hm-today-thumb">
            <img src={TODAY_WORKOUT.img} alt={TODAY_WORKOUT.title} />
            <div className="hm-play-btn">▶</div>
          </div>
          <div className="hm-today-info">
            <h4 className="hm-today-title">{TODAY_WORKOUT.title}</h4>
            <p className="hm-today-meta">{TODAY_WORKOUT.level} · {TODAY_WORKOUT.duration}</p>
            <p className="hm-today-desc">{TODAY_WORKOUT.desc}</p>
            <button className="hm-tonton-btn" onClick={e => { e.stopPropagation(); handleWatchVideo(TODAY_WORKOUT.videoId); }}>Tonton</button>
          </div>
        </div>

        {/* Video Tutorial */}
        <h3 className="hm-section-title-plain">Video Tutorial</h3>
        <div className="hm-video-list">
          {CATEGORIES.map(cat => (
            <VideoCard key={cat.id} cat={cat} onWatch={() => setActiveDetail(cat)} progress={progress} />
          ))}
        </div>
      </div>

      {activeVideo && <VideoPlayer videoId={activeVideo} onClose={handleVideoClose} />}
    </div>
  );
};

export default HealthModulePage;