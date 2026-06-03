import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import '../styles/Gymreservationpage.css';

// Constants
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const KAPASITAS = 15;


const FALLBACK_SLOTS = [
  { id: 'f1', jam_mulai: '16:30:00', jam_selesai: '17:30:00', nama_sesi: 'Sesi Sore 1', kapasitas_max: KAPASITAS },
  { id: 'f2', jam_mulai: '17:30:00', jam_selesai: '19:00:00', nama_sesi: 'Sesi Sore 2', kapasitas_max: KAPASITAS },
];

// Helpers
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDay    = (y, m) => new Date(y, m, 1).getDay();
const toDateStr      = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const fmtTime        = (t) => t?.slice(0,5).replace(':','.') || '';
const fmtDate        = (y, m, d) => {
  if (!d) return '';
  const date = new Date(y, m, d);
  return `${['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][date.getDay()]}, ${d} ${MONTHS_ID[m]} ${y}`;
};

// Icons
const IcArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const IcChevL = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IcChevR = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcCal = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2.5"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const IcClock = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcUsers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcCheckCircle = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
    {size > 20 ? null : <circle cx="12" cy="12" r="10" strokeWidth="2"/>}
  </svg>
);
const IcConfetti = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 15L2 22l7-3.5"/><path d="M14 2l-1.5 3.5L16 7l-3.5 1.5L14 12l-1.5-3.5L9 10l3.5-1.5L11 5l3 1z"/>
    <path d="M20 10l-1 2.5 2.5-1L20 14l-1-2.5L16.5 12 19 11z"/>
  </svg>
);


const Skeleton = () => (
  <div className="gr-skel-list">
    {[1,2].map(i => (
      <div key={i} className="gr-skel-card">
        <div className="gr-skel-line gr-skel-lg"/>
        <div className="gr-skel-line gr-skel-md"/>
        <div className="gr-skel-line gr-skel-sm"/>
      </div>
    ))}
  </div>
);


const Calendar = ({ year, month, selectedDate, onSelectDate, onPrev, onNext, reservationMap = {} }) => {
  const today       = new Date();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);
  const prevDays    = getDaysInMonth(year, month - 1);

  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isPast  = (d) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, curr: false });
  for (let d = 1; d <= daysInMonth; d++)   cells.push({ day: d, curr: true });
  while (cells.length < 42)                cells.push({ day: cells.length - daysInMonth - firstDay + 1, curr: false });

  return (
    <div className="gr-cal">
      <div className="gr-cal-nav">
        <button className="gr-cal-nav-btn" onClick={onPrev}><IcChevL /></button>
        <span className="gr-cal-title">{MONTHS[month]} {year}</span>
        <button className="gr-cal-nav-btn" onClick={onNext}><IcChevR /></button>
      </div>
      <div className="gr-cal-grid">
        {DAYS.map(d => <div key={d} className="gr-cal-dn">{d}</div>)}
        {cells.map((c, i) => {
          const sel = c.curr && selectedDate === c.day;
          const dis = !c.curr || isPast(c.day);
          const dateStr = c.curr ? toDateStr(year, month, c.day) : '';
          const count = c.curr ? (reservationMap[dateStr] || 0) : 0;

          return (
            <button key={i} disabled={dis}
              onClick={() => !dis && onSelectDate(c.day)}
              className={[
                'gr-cal-day',
                !c.curr                         ? 'gr-cal-day--dim'   : '',
                c.curr && isPast(c.day)          ? 'gr-cal-day--past'  : '',
                c.curr && isToday(c.day) && !sel ? 'gr-cal-day--today' : '',
                sel                              ? 'gr-cal-day--sel'   : '',
              ].filter(Boolean).join(' ')}>
              <span>{c.day}</span>
              {count > 0 && (
                <div className="gr-cal-dots">
                  {Array.from({length: Math.min(count, 3)}).map((_, idx) => (
                    <div key={idx} className="gr-cal-dot" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};


const SessionList = ({ year, month, selectedDate, sessions, loading, selectedSession, onSelect }) => {
  if (!selectedDate) return (
    <div className="gr-empty">
      <IcCal size={28} />
      <p>Pilih tanggal untuk melihat jadwal</p>
    </div>
  );
  if (loading) return <Skeleton />;
  if (!sessions.length) return (
    <div className="gr-empty">
      <IcCal size={28} />
      <p>Tidak ada sesi pada tanggal ini</p>
      <span>Coba pilih tanggal lain</span>
    </div>
  );

  const today = new Date();
  const isToday = selectedDate === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="gr-sess-list">
      {sessions.map(s => {
        const terisi    = s.terisi ?? 0;
        const kapasitas = s.kapasitas_max ?? KAPASITAS;
        const sisa      = kapasitas - terisi;
        const penuh     = sisa <= 0;
        const sel       = selectedSession?.id === s.id;

        // Check if session has already passed on the same day
        let isPastTime = false;
        if (isToday && s.jam_mulai) {
          const [hours, minutes] = s.jam_mulai.split(':').map(Number);
          const sessionTime = new Date();
          sessionTime.setHours(hours, minutes, 0, 0);
          isPastTime = today > sessionTime;
        }

        const disabled = penuh || isPastTime;

        return (
          <button key={s.id} disabled={disabled} onClick={() => onSelect(s)}
            className={['gr-sess', sel ? 'gr-sess--sel' : '', penuh || isPastTime ? 'gr-sess--full' : ''].filter(Boolean).join(' ')}>
            <div className="gr-sess-left">
              <div className="gr-sess-time-row">
                <IcClock />
                <span className="gr-sess-time">{fmtTime(s.jam_mulai)} – {fmtTime(s.jam_selesai)}</span>
              </div>
              <span className="gr-sess-name">{s.nama_sesi || 'Sesi Gym'}</span>
            </div>
            <div className="gr-sess-right">
              {isPastTime ? (
                <span className="gr-badge gr-badge--full" style={{ background: '#e0e0e0', color: '#888' }}>Sudah Lewat</span>
              ) : penuh ? (
                <span className="gr-badge gr-badge--full">Penuh</span>
              ) : (
                <>
                  <div className="gr-quota"><IcUsers /><span>{terisi}/{kapasitas}</span></div>
                  <span className="gr-sisa">{sisa} tersisa</span>
                </>
              )}
            </div>
            {sel && <div className="gr-sess-check">✓</div>}
          </button>
        );
      })}
    </div>
  );
};


const ConfirmModal = ({ year, month, selectedDate, selectedSession, loading, error, onConfirm, onCancel }) => (
  <div className="gr-conf-page">
    <div className="gr-topbar">
      <button className="gr-ic-btn" onClick={onCancel}><IcArrow /></button>
      <span className="gr-topbar-title">Konfirmasi Reservasi</span>
      <div style={{ width: 36 }} />
    </div>

    <div className="gr-conf-body">
      <div className="gr-conf-card">
        <div className="gr-conf-head">
          <div className="gr-conf-icon"><IcCal size={26} /></div>
          <div>
            <p className="gr-conf-eyebrow">Reservasi Baru</p>
            <h3 className="gr-conf-title">Konfirmasi<br />Reservasi</h3>
          </div>
        </div>

        <div className="gr-conf-sep" />

        <p className="gr-conf-label">Anda akan reservasi pada:</p>
        <div className="gr-conf-detail">
          <div className="gr-conf-detail-icon"><IcCal size={16} /></div>
          <div>
            <p className="gr-conf-date">{fmtDate(year, month, selectedDate)}</p>
            <p className="gr-conf-time">{fmtTime(selectedSession?.jam_mulai)} – {fmtTime(selectedSession?.jam_selesai)}</p>
            <p className="gr-conf-sess">{selectedSession?.nama_sesi || 'Sesi Gym'}</p>
          </div>
        </div>

        {error && <div className="gr-error">{error}</div>}

        <div className="gr-conf-sep" />

        <div className="gr-conf-actions">
          <button className="gr-btn-ghost" onClick={onCancel} disabled={loading}>Batal</button>
          <button className="gr-btn-primary" onClick={onConfirm} disabled={loading}>
            {loading
              ? <span className="gr-btn-loading"><span className="gr-spinner" />Memproses</span>
              : 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  </div>
);


const SuccessState = ({ year, month, selectedDate, selectedSession, onNavigate }) => (
  <div className="gr-succ-page">
    <div className="gr-succ-bg" />
    <div className="gr-succ-content">
      <div className="gr-succ-confetti"><IcConfetti /></div>
      <div className="gr-succ-ring">
        <div className="gr-succ-circle"><IcCheckCircle /></div>
      </div>

      <h2 className="gr-succ-title">Reservasi Berhasil!</h2>
      <p className="gr-succ-desc">
        Kamu berhasil reservasi <strong>{selectedSession?.nama_sesi || 'Sesi Gym'}</strong>
      </p>

      <div className="gr-succ-pills">
        <div className="gr-succ-pill">
          <IcCal size={14} />
          <span>{fmtDate(year, month, selectedDate)}</span>
        </div>
        <div className="gr-succ-pill">
          <IcClock size={14} />
          <span>{fmtTime(selectedSession?.jam_mulai)} – {fmtTime(selectedSession?.jam_selesai)}</span>
        </div>
      </div>

      <div className="gr-succ-actions">
        <button className="gr-btn-primary gr-btn-full" onClick={() => onNavigate('riwayat-reservasi')}>
          Lihat Riwayat Reservasi
        </button>
        <button className="gr-btn-ghost gr-btn-full" onClick={() => onNavigate('home')}>
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  </div>
);

// Fetch sessions with live count
const fetchSessionsWithCount = async (year, month, selDate) => {
  const dateStr = toDateStr(year, month, selDate);

  // Fetch sesi_gym sessions for the selected date
  const { data: sesiData, error: sesiErr } = await supabase
    .from('sesi_gym')
    .select('*')
    .eq('tanggal', dateStr)
    .order('jam_mulai');

  const baseSessions =
    sesiErr || !sesiData || sesiData.length === 0
      ? FALLBACK_SLOTS.map(s => ({
          ...s,
          id: `${dateStr}-${s.id}`,
          tanggal: dateStr,
          kapasitas_max: KAPASITAS,
        }))
      : sesiData.map(s => ({ ...s, kapasitas_max: s.kapasitas_max ?? KAPASITAS }));

  // Count reservasi per sesi_id
  const { data: reservasiCounts } = await supabase
    .from('reservasi')
    .select('sesi_id', { count: 'exact' })
    .eq('status', 'dikonfirmasi')
    .in('sesi_id', baseSessions.filter(s => !s.id.startsWith(dateStr)).map(s => s.id));

  const countMap = {};
  (baseSessions || []).forEach(s => {
    countMap[s.id] = 0;
  });

  if (reservasiCounts) {
    reservasiCounts.forEach(r => {
      countMap[r.sesi_id] = (countMap[r.sesi_id] || 0) + 1;
    });
  }

  return baseSessions.map(s => ({
    ...s,
    terisi: countMap[s.id] || 0,
  }));
};

const GymReservationPage = ({ onNavigate, user }) => {
  const today = new Date();
  const [year,    setYear]    = useState(today.getFullYear());
  const [month,   setMonth]   = useState(today.getMonth());
  const [selDate, setSelDate] = useState(null);
  const [selSess, setSelSess] = useState(null);
  const [sessions,setSessions]= useState([]);
  const [loadSess,setLoadSess]= useState(false);
  const [confirm, setConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState('');

  const [userReservations, setUserReservations] = useState([]);
  const [loadingRes, setLoadingRes] = useState(true);
  const [penggunaId, setPenggunaId] = useState(null);

  // Fetch pengguna ID from pengguna table using auth user email
  const fetchPenggunaId = useCallback(async () => {
    if (!user?.email) return;
    try {
      const { data } = await supabase
        .from('pengguna')
        .select('id')
        .eq('email', user.email)
        .single();
      if (data?.id) {
        setPenggunaId(data.id);
      } else {
        console.warn('[GymReservation] Pengguna tidak ditemukan di database');
      }
    } catch (err) {
      console.error('[GymReservation] Error fetching pengguna:', err);
    }
  }, [user?.email]);

  const fetchUserReservations = useCallback(async () => {
    if (!penggunaId) return;
    setLoadingRes(true);
    // Fetch reservasi with joined sesi_gym data
    const { data } = await supabase
      .from('reservasi')
      .select('id, sesi_id, status, waktu_reservasi, sesi_gym(tanggal, jam_mulai, jam_selesai, nama_sesi)')
      .eq('pengguna_id', penggunaId)
      .order('waktu_reservasi', { ascending: false });
    
    setUserReservations(data || []);
    setLoadingRes(false);
  }, [penggunaId]);

  // Fetch pengguna ID on mount
  useEffect(() => {
    fetchPenggunaId();
  }, [fetchPenggunaId]);

  // Fetch reservations when pengguna ID is available
  useEffect(() => {
    fetchUserReservations();
  }, [fetchUserReservations]);

  const todayDateStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const stats = useMemo(() => {
    const total = userReservations.length;
    const upcoming = userReservations.filter(r => r.sesi_gym?.tanggal >= todayDateStr);
    const completed = userReservations.filter(r => r.sesi_gym?.tanggal < todayDateStr);
    
    return {
      total,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      upcomingList: upcoming.sort((a,b) => (a.sesi_gym?.tanggal || '').localeCompare(b.sesi_gym?.tanggal || '')),
      historyList: completed
    };
  }, [userReservations, todayDateStr]);

  const reservationMap = useMemo(() => {
    const map = {};
    userReservations.forEach(r => {
      const date = r.sesi_gym?.tanggal;
      if (date) {
        map[date] = (map[date] || 0) + 1;
      }
    });
    return map;
  }, [userReservations]);

  const loadSessions = useCallback(async (y, m, d) => {
    setLoadSess(true);
    setSelSess(null);
    try {
      const result = await fetchSessionsWithCount(y, m, d);
      setSessions(result);
    } catch {
      setSessions([]);
    } finally {
      setLoadSess(false);
    }
  }, []);

  useEffect(() => {
    if (!selDate) { setSessions([]); return; }
    loadSessions(year, month, selDate);
  }, [selDate, year, month, loadSessions]);

  // Realtime subscription
  useEffect(() => {
    if (!selDate) return;
    const dateStr = toDateStr(year, month, selDate);
    const channel = supabase
      .channel(`reservasi-${dateStr}`)
      .on(
        'postgres_changes',
        { schema: 'public', table: 'reservasi' },
        { schema: 'public', table: 'reservations' },
        () => { loadSessions(year, month, selDate); fetchUserReservations(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selDate, year, month, loadSessions, fetchUserReservations]);

  // Month navigation
  const prevMonth = () => {
    setSelDate(null); setSelSess(null); setError('');
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelDate(null); setSelSess(null); setError('');
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleConfirm = async () => {
    if (!selDate || !selSess || !penggunaId) return;
    setBusy(true); setError('');

    try {
      // Check if user already has a reservation for this session
      const { data: existing } = await supabase
        .from('reservasi')
        .select('id')
        .eq('pengguna_id', penggunaId)
        .eq('sesi_id', selSess.id)
        .maybeSingle();

      if (existing) throw new Error('Kamu sudah memiliki reservasi untuk sesi ini.');

      // Check capacity
      const { count: currentCount } = await supabase
        .from('reservasi')
        .select('id', { count: 'exact', head: true })
        .eq('sesi_id', selSess.id)
        .eq('status', 'dikonfirmasi');

      const kapasitas = selSess.kapasitas_max ?? KAPASITAS;
      if ((currentCount ?? 0) >= kapasitas) {
        throw new Error('Maaf, sesi ini baru saja penuh. Silakan pilih sesi lain.');
      }

      // Insert reservation with pengguna_id from database
      const { error: err } = await supabase
        .from('reservasi')
        .insert({
          pengguna_id:    penggunaId,
          sesi_id:        selSess.id,
          status:         'menunggu',
        });

      if (err) {
        if (err.code === '23505') throw new Error('Kamu sudah memiliki reservasi untuk sesi ini.');
        throw new Error(err.message);
      }

      setConfirm(false);
      setSuccess(true);
      fetchUserReservations();
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  // Render
  if (success) return (
    <SuccessState
      year={year} month={month}
      selectedDate={selDate} selectedSession={selSess}
      onNavigate={onNavigate}
    />
  );

  if (confirm) return (
    <ConfirmModal
      year={year} month={month}
      selectedDate={selDate} selectedSession={selSess}
      loading={busy} error={error}
      onConfirm={handleConfirm}
      onCancel={() => { setConfirm(false); setError(''); }}
    />
  );

  return (
    <div className="gr-page">
      <div className="gr-topbar">
        <button className="gr-ic-btn" onClick={() => onNavigate('home')}><IcArrow /></button>
        <span className="gr-topbar-title">Reservasi Gym</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="gr-scroll">
        <div className="res-container">
          
          <div className="res-stats-box">
            <div className="res-stat-item" onClick={() => onNavigate('riwayat-reservasi')}>
              <div className="res-stat-ic"><IcCal size={18} /></div>
              <span className="res-stat-label">TOTAL RESERVASI</span>
              <span className="res-stat-value">{stats.total}</span>
              <span className="res-stat-sub">Semua waktu</span>
            </div>
            <div className="res-stat-div" />
            <div className="res-stat-item" onClick={() => onNavigate('riwayat-reservasi')}>
              <div className="res-stat-ic"><IcCheckCircle size={18} /></div>
              <span className="res-stat-label">SELESAI</span>
              <span className="res-stat-value">{stats.completedCount}</span>
              <span className="res-stat-sub">Reservasi</span>
            </div>
            <div className="res-stat-div" />
            <div className="res-stat-item" onClick={() => onNavigate('riwayat-reservasi')}>
              <div className="res-stat-ic"><IcClock size={18} /></div>
              <span className="res-stat-label">AKAN DATANG</span>
              <span className="res-stat-value">{stats.upcomingCount}</span>
              <span className="res-stat-sub">Reservasi</span>
            </div>
          </div>

          <div className="res-layout-grid">
            <div className="res-col-main">
              <Calendar
                year={year} month={month} selectedDate={selDate}
                onSelectDate={d => { setSelDate(d); setSelSess(null); setError(''); }}
                onPrev={prevMonth} onNext={nextMonth}
                reservationMap={reservationMap}
              />
              <div className="gr-sess-section" style={{ marginTop: 20 }}>
                <div className="gr-sess-header">
                  <div className="gr-sess-bar" />
                  <h3 className="gr-sess-title">
                    Pilih Sesi
                    {selDate && !loadSess && sessions.length > 0 && (
                      <span className="gr-sess-date-hint"> · {fmtDate(year, month, selDate)}</span>
                    )}
                  </h3>
                </div>
                 <SessionList
                   year={year} month={month} selectedDate={selDate} sessions={sessions} loading={loadSess}
                   selectedSession={selSess}
                   onSelect={s => { setSelSess(s); setError(''); }}
                 />
                {error && <div className="gr-error">{error}</div>}
                {selDate && (
                  <button
                    className="gr-btn-primary gr-btn-full"
                    disabled={!selDate || !selSess}
                    style={{ marginTop: 10 }}
                    onClick={() => { setError(''); setConfirm(true); }}>
                    Lanjut Reservasi
                  </button>
                )}
              </div>
            </div>

            <div className="res-col-side">
              <div className="res-section">
                <div className="res-sec-head">
                  <h3 className="res-sec-title">Akan Datang</h3>
                  <button className="res-sec-link" onClick={() => onNavigate('riwayat-reservasi')}>Lihat semua</button>
                </div>
                <div className="res-list-container">
                  {stats.upcomingList.length > 0 ? stats.upcomingList.slice(0, 3).map(r => (
                    <div key={r.id} className="res-list-card" onClick={() => onNavigate('riwayat-reservasi')}>
                      <div className="res-list-date upcoming">
                        <span className="res-list-d">{parseInt(r.sesi_gym?.tanggal?.split('-')[2] || '0')}</span>
                        <span className="res-list-m">{MONTHS_ID[parseInt(r.sesi_gym?.tanggal?.split('-')[1] || '1')-1]?.slice(0,3) || ''}</span>
                      </div>
                      <div className="res-list-info">
                        <span className="res-list-time">{fmtTime(r.sesi_gym?.jam_mulai)}</span>
                        <span className="res-list-name">{r.sesi_gym?.nama_sesi || 'Sesi Gym'}</span>
                      </div>
                      <div className="res-list-action">
                        <div className="res-list-icon"><IcClock size={16} /></div>
                        <IcChevR />
                      </div>
                    </div>
                  )) : (
                    <p style={{fontSize: 12, color: 'var(--t3)', margin: 0, padding: 12}}>Belum ada jadwal upcoming</p>
                  )}
                </div>
              </div>

              <div className="res-section">
                <div className="res-sec-head">
                  <h3 className="res-sec-title">Riwayat Terakhir</h3>
                  <button className="res-sec-link" onClick={() => onNavigate('riwayat-reservasi')}>Lihat semua</button>
                </div>
                <div className="res-list-container">
                  {stats.historyList.length > 0 ? stats.historyList.slice(0, 3).map(r => (
                    <div key={r.id} className="res-list-card" onClick={() => onNavigate('riwayat-reservasi')}>
                      <div className="res-list-date history">
                        <span className="res-list-d">{parseInt(r.sesi_gym?.tanggal?.split('-')[2] || '0')}</span>
                        <span className="res-list-m">{MONTHS_ID[parseInt(r.sesi_gym?.tanggal?.split('-')[1] || '1')-1]?.slice(0,3) || ''}</span>
                      </div>
                      <div className="res-list-info">
                        <span className="res-list-time">{fmtTime(r.sesi_gym?.jam_mulai)}</span>
                        <span className="res-list-name">{r.sesi_gym?.nama_sesi || 'Sesi Gym'}</span>
                      </div>
                      <div className="res-list-action">
                        <div className="res-badge-selesai">Selesai</div>
                        <IcChevR />
                      </div>
                    </div>
                  )) : (
                    <p style={{fontSize: 12, color: 'var(--t3)', margin: 0, padding: 12}}>Belum ada riwayat</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GymReservationPage;
