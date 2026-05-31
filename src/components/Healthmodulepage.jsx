import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { supabase } from '../supabase';
import imgTubuhAtas  from '../assets/Latihan_Tubuh_Bagian_Atas.png';
import imgTubuhBawah from '../assets/Latihan_Tubuh_Bagian_Bawah.png';
import imgKardio     from '../assets/Latihan_Kardio.png';
import imgInti       from '../assets/Latihan_Inti.png';
import imgFullBody   from '../assets/Full_Body_Strength.png';
import '../styles/Healthmodulepage.css';

const CATEGORIES = [
  {
    id: 'upper',
    title: 'Latihan Tubuh Bagian Atas',
    level: 'Intermediate',
    duration: '30 Min',
    desc: 'Build strength and tone your entire body with this effective workout',
    img: imgTubuhAtas,
    videos: [
      { id: 'bzsDThZUqyI', title: 'Upper Body Warm Up',     week: 1 },
      { id: 'qEwKCR5JCog', title: 'Shoulder Press & Rows',  week: 1 },
      { id: '_owjFN4IiWM', title: 'Push & Pull Superset',   week: 2 },
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
      { id: 'gf3Vd4LVymk', title: 'Squat Fundamentals',           week: 1 },
      { id: '3Vdqz_wzT1I', title: 'Squats, Lunges & Leg Press',   week: 1 },
      { id: 'lVV3aEijelY', title: 'Hamstring Focus',              week: 2 },
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
      { id: 'ml6cT4AZdqI', title: 'HIIT Cardio Blast',   week: 1 },
      { id: 'uNKbVlGstWY', title: 'Treadmill Interval',  week: 1 },
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
      { id: 'b_TTLmmQmXU', title: 'Core Stability Basics', week: 1 },
      { id: 'z_xEzYVCqWk', title: 'Plank Variations',      week: 1 },
    ],
  },
];

const TODAY_WORKOUT = {
  id:       'full-body',
  title:    'Latihan Kekuatan Tubuh',
  level:    'Intermediate',
  duration: '30 Min',
  desc:     'Build strength and tone your entire body with this effective workout',
  img:      imgFullBody,
  videoId:  '36BuhRO3zng',
};

const ALL_VIDEOS   = CATEGORIES.flatMap(c => c.videos);
const TOTAL_VIDEOS = ALL_VIDEOS.length; // 10 total

const padTwo = (n) => String(n).padStart(2, '0');

const getWeekStart = () => {
  const d   = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  return mon.toISOString().split('T')[0];
};

const STORAGE_KEY = 'hm_progress';

const loadLocalProgress = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
};

const saveLocalProgress = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const LazyImg = memo(({ src, alt, className }) => {
  const imgRef = useRef(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (el.complete) {
      el.classList.add('loaded');
      return;
    }
    const handler = () => el.classList.add('loaded');
    el.addEventListener('load', handler);
    return () => el.removeEventListener('load', handler);
  }, []);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
});

const VideoPlayer = memo(({ videoId, onClose, onMarkComplete }) => {
  const [playing, setPlaying] = useState(false);

  // Reset state jika videoId berubah
  useEffect(() => { setPlaying(false); }, [videoId]);

  const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className="hm-video-overlay" onClick={onClose}>
      <div className="hm-video-wrapper" onClick={e => e.stopPropagation()}>
        <div className="hm-video-container">
          <button className="hm-video-close" onClick={onClose}>✕</button>

          {playing ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="hm-iframe"
              title="workout video"
            />
          ) : (
            <div className="hm-yt-facade" onClick={() => setPlaying(true)}>
              <img src={thumbUrl} alt="video thumbnail" />
              <div className="hm-yt-play-btn">▶</div>
            </div>
          )}
        </div>

        <button className="hm-mark-complete-btn" onClick={onMarkComplete}>
          ✓ Tandai Selesai
        </button>
      </div>
    </div>
  );
});

const SkeletonLoading = () => (
  <div className="hm-loading">
    <div className="hm-skeleton hm-skeleton-header" />
    <div className="hm-skeleton hm-skeleton-stats" />
    <div className="hm-skeleton hm-skeleton-card" />
    <div className="hm-skeleton hm-skeleton-card" />
    <div className="hm-skeleton hm-skeleton-card" />
  </div>
);

const VideoCard = memo(({ cat, onWatch, progress }) => {
  const { completedVideos, totalVideos, allDone, pct } = useMemo(() => {
    const total     = cat.videos?.length || 0;
    const completed = cat.videos?.filter(v => (progress?.[v.id]?.progress || 0) >= 90).length || 0;
    return {
      completedVideos: completed,
      totalVideos: total,
      allDone: completed === total && total > 0,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [cat.videos, progress]);

  const handleWatch = useCallback(() => onWatch(cat), [cat, onWatch]);
  const handleWatchBtn = useCallback((e) => { e.stopPropagation(); onWatch(cat); }, [cat, onWatch]);

  return (
    <div className="hm-video-card" onClick={handleWatch}>
      <div className="hm-video-thumb">
        <LazyImg src={cat.img} alt={cat.title} />
        <div className="hm-play-btn">▶</div>
        {allDone && <div className="hm-completed-badge">✓ Selesai</div>}
      </div>
      <div className="hm-video-info">
        <h4 className="hm-video-title">{cat.title}</h4>
        <p className="hm-video-meta">{totalVideos} video · {cat.level}</p>
        <div className="hm-card-progress">
          <div className="hm-card-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <button className="hm-tonton-btn" onClick={handleWatchBtn}>
          {allDone ? '▶ Tonton Lagi' : 'Tonton'}
        </button>
      </div>
    </div>
  );
});

const DetailPage = memo(({ category, onBack, onOpenDetail, progress, onWatchVideo }) => {
  const others = useMemo(() => CATEGORIES.filter(c => c.id !== category.id), [category.id]);

  return (
    <div className="hm-detail-page">
      <div className="hm-detail-header">
        <button className="hm-back-btn" onClick={onBack} aria-label="Kembali" />
      </div>
      <div className="hm-detail-info">
        <h2 className="hm-detail-title">{category.title}</h2>
        <p className="hm-detail-desc">{category.desc}</p>
        <p className="hm-detail-level">{category.level} · {category.duration}</p>
      </div>

      <div
        className="hm-detail-hero"
        onClick={() => category.videos[0] && onWatchVideo(category.videos[0].id)}
      >
        <LazyImg src={category.img} alt={category.title} className="hm-detail-hero-img" />
        <div className="hm-detail-play">▶</div>
      </div>

      <div className="hm-detail-body">
        <h3 className="hm-section-title">Video dalam Modul Ini</h3>

        {category.videos.map(v => {
          const pct  = progress?.[v.id]?.progress || 0;
          const done = pct >= 90;
          return (
            <div key={v.id} className="hm-detail-video-row" onClick={() => onWatchVideo(v.id)}>
              <div className={`hm-detail-video-icon ${done ? 'done' : ''}`}>
                {done ? '✓' : '▶'}
              </div>
              <div className="hm-detail-video-text">
                <p className="hm-detail-video-title">{v.title}</p>
                <p className="hm-detail-video-week">Minggu {v.week}</p>
              </div>
              <div className="hm-detail-video-right">
                {done
                  ? <span className="hm-done-label">Selesai</span>
                  : pct > 0
                    ? <span className="hm-progress-label">{pct}%</span>
                    : null}
              </div>
            </div>
          );
        })}

        <h3 className="hm-section-title hm-section-title--top">Video Lainnya</h3>
        {others.map(cat => (
          <VideoCard
            key={cat.id}
            cat={cat}
            onWatch={() => onOpenDetail(cat)}
            progress={progress}
          />
        ))}
      </div>
    </div>
  );
});


const HealthModulePage = ({ onNavigate, user }) => {
  const cachedReservationsRef = useRef(null);
  const cachedProgressDataRef = useRef(null);

  const [reservationCount, setReservationCount] = useState({ total: 0, thisWeek: 0 });
  const [progress, setProgress]     = useState(loadLocalProgress);
  const [activeDetail, setActiveDetail] = useState(null);
  const [activeVideo, setActiveVideo]   = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    // Invalidate caches when user changes to prevent cross-user pollution
    cachedReservationsRef.current = null;
    cachedProgressDataRef.current = null;

    if (!user) {
      setProgress(loadLocalProgress());
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      const weekStart = getWeekStart();

      if (!cachedReservationsRef.current) {
        const { data } = await supabase
          .from('reservations')
          .select('id, date')
          .eq('user_id', user.id);
        cachedReservationsRef.current = data || [];
      }
      const reservations = cachedReservationsRef.current;
      const thisWeek = reservations.filter(r => r.date && r.date >= weekStart);
      setReservationCount({ total: reservations.length, thisWeek: thisWeek.length });

      if (!cachedProgressDataRef.current) {
        const { data, error } = await supabase
          .from('user_video_progress')
          .select('video_id, progress, last_watched')
          .eq('pengguna_id', user.id);

        if (!error) cachedProgressDataRef.current = data || [];
      }

      const progressData = cachedProgressDataRef.current;
      if (progressData !== null) {
        const progressMap = {};
        progressData.forEach(row => {
          progressMap[row.video_id] = { progress: row.progress, lastWatched: row.last_watched };
        });
        setProgress(progressMap);
        saveLocalProgress(progressMap);
      }

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  // Derived stats — useMemo agar tidak dihitung ulang setiap render
  const { completedCount, videoPct, videoLeft, todayDone } = useMemo(() => {
    const completed = ALL_VIDEOS.filter(v => (progress[v.id]?.progress || 0) >= 90).length;
    return {
      completedCount: completed,
      videoPct: Math.round((completed / TOTAL_VIDEOS) * 100),
      videoLeft: TOTAL_VIDEOS - completed,
      todayDone: (progress[TODAY_WORKOUT.videoId]?.progress || 0) >= 90,
    };
  }, [progress]);

  const handleWatchVideo = useCallback((videoId) => {
    if (!videoId) return;
    setActiveVideo(videoId);
  }, []);

  const handleVideoClose = useCallback(async () => {
    if (!activeVideo) return;
    const current = progress[activeVideo]?.progress || 0;
    if (current < 90) {
      const newProgress = Math.max(current, 10);
      const updated = {
        ...progress,
        [activeVideo]: { progress: newProgress, lastWatched: Date.now() },
      };
      setProgress(updated);
      saveLocalProgress(updated);
      cachedProgressDataRef.current = null; // invalidate cache

      if (user) {
        await supabase.from('user_video_progress').upsert({
          pengguna_id: user.id,
          video_id:    activeVideo,
          progress:    newProgress,
          last_watched: new Date().toISOString(),
        }, { onConflict: 'pengguna_id,video_id' });
      }
    }
    setActiveVideo(null);
  }, [activeVideo, progress, user]);

  const handleMarkComplete = useCallback(async () => {
    if (!activeVideo) return;
    const updated = {
      ...progress,
      [activeVideo]: { progress: 100, lastWatched: Date.now() },
    };
    setProgress(updated);
    saveLocalProgress(updated);
    cachedProgressDataRef.current = null; // invalidate cache

    if (user) {
      await supabase.from('user_video_progress').upsert({
        pengguna_id: user.id,
        video_id:    activeVideo,
        progress:    100,
        last_watched: new Date().toISOString(),
      }, { onConflict: 'pengguna_id,video_id' });
    }
    setActiveVideo(null);
  }, [activeVideo, progress, user]);

  const handleOpenDetail = useCallback((cat) => setActiveDetail(cat), []);
  const handleBackDetail  = useCallback(() => setActiveDetail(null), []);

    if (loading) return <SkeletonLoading />;

  if (activeDetail) {
    return (
      <>
        <DetailPage
          category={activeDetail}
          onBack={handleBackDetail}
          onOpenDetail={handleOpenDetail}
          progress={progress}
          onWatchVideo={handleWatchVideo}
        />
        {activeVideo && (
          <VideoPlayer
            videoId={activeVideo}
            onClose={handleVideoClose}
            onMarkComplete={handleMarkComplete}
          />
        )}
      </>
    );
  }

  return (
    <div className="hm-page">
      <div className="hm-header">
        <button className="hm-back-btn" onClick={() => onNavigate('home')} aria-label="Kembali" />
        <div className="hm-header-text">
          <h2 className="hm-title">Modul Latihan</h2>
          <p className="hm-subtitle">Stay Active, Stay Healthy!</p>
        </div>
        <button className="hm-help-btn" onClick={() => onNavigate('health-assistant')}>?</button>
      </div>

      <div className="hm-body">
        <div className="hm-stats-card">
          <div className="hm-stats-row">
            <div className="hm-stat hm-stat-red">
              <span className="hm-stat-icon" style={{ background: '#FFF0F0', color: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 6 6 10 6 14a6 6 0 0012 0c0-3-1.5-6-3-8-1 2-1.5 3-1.5 4s-.5 2-1.5 2"/></svg>
              </span>
              <div>
                <p className="hm-stat-label">Total Gym</p>
                <p className="hm-stat-value">{padTwo(reservationCount.total)} sesi</p>
              </div>
            </div>
            <div className="hm-stat hm-stat-red">
              <span className="hm-stat-icon" style={{ background: '#FFF0F0', color: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </span>
              <div>
                <p className="hm-stat-label">Minggu Ini</p>
                <p className="hm-stat-value">{padTwo(reservationCount.thisWeek)} sesi</p>
              </div>
            </div>
            <div className="hm-stat hm-stat-red">
              <span className="hm-stat-icon" style={{ background: '#FFF0F0', color: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              </span>
              <div>
                <p className="hm-stat-label-sm">Video Selesai</p>
                <p className="hm-stat-value">{completedCount}/{TOTAL_VIDEOS}</p>
              </div>
            </div>
          </div>

          <div className="hm-weekly">
            <div className="hm-weekly-row">
              <span className="hm-weekly-label">Progress Modul</span>
              <span className="hm-weekly-left">
                {videoLeft > 0 ? `${videoLeft} video lagi` : 'Semua selesai!'}
              </span>
            </div>
            <div className="hm-progress-track">
              <div className="hm-progress-fill" style={{ width: `${videoPct}%` }} />
              <span className="hm-progress-pct">{videoPct}%</span>
            </div>
          </div>
        </div>
        <div className="hm-section-header">
          <div className="hm-section-bar" />
          <h3 className="hm-section-title">Today's Workout</h3>
        </div>

        <div className="hm-today-card" onClick={() => handleWatchVideo(TODAY_WORKOUT.videoId)}>
          <div className="hm-today-thumb">
            <LazyImg src={TODAY_WORKOUT.img} alt={TODAY_WORKOUT.title} />
            <div className="hm-play-btn">▶</div>
            {todayDone && <div className="hm-completed-badge">✓ Selesai</div>}
          </div>
          <div className="hm-today-info">
            <h4 className="hm-today-title">{TODAY_WORKOUT.title}</h4>
            <p className="hm-today-meta">{TODAY_WORKOUT.level} · {TODAY_WORKOUT.duration}</p>
            <p className="hm-today-desc">{TODAY_WORKOUT.desc}</p>
            <button
              className="hm-tonton-btn"
              onClick={e => { e.stopPropagation(); handleWatchVideo(TODAY_WORKOUT.videoId); }}
            >
              {todayDone ? '▶ Tonton Lagi' : 'Tonton'}
            </button>
          </div>
        </div>
        <h3 className="hm-section-title">Video Tutorial</h3>
        <div className="hm-video-list">
          {CATEGORIES.map(cat => (
            <VideoCard
              key={cat.id}
              cat={cat}
              onWatch={handleOpenDetail}
              progress={progress}
            />
          ))}
        </div>
      </div>

      {activeVideo && (
        <VideoPlayer
          videoId={activeVideo}
          onClose={handleVideoClose}
          onMarkComplete={handleMarkComplete}
        />
      )}
    </div>
  );
};

export default HealthModulePage;