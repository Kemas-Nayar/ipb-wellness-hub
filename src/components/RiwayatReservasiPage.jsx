import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import QRScannerModal from './QRScannerModal';
import '../styles/RiwayatReservasiPage.css';

const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

const IconRefresh = ({ spinning }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    className={spinning ? 'spin' : ''} aria-hidden="true">
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

const IconSpinner = () => (
  <svg className="spin" width="36" height="36" viewBox="0 0 24 24"
    fill="none" stroke="#C8102E" strokeWidth="2" aria-hidden="true">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83
             M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
  </svg>
);

const IconCalendar = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
    stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="2" />
  </svg>
);

const IconQR = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3" />
  </svg>
);

const IconCheck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconAlert = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
    stroke="#C8102E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const DAYS   = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

const PAGE_SIZE    = 20;
const ALL_STATUSES = ['upcoming', 'berlangsung', 'selesai'];

const STATUS_LABEL = {
  berlangsung : 'Berlangsung',
  selesai     : 'Selesai',
  upcoming    : 'Upcoming',
};

const parseLocal  = (dateStr) => new Date(`${dateStr}T00:00:00`);
const formatTime  = (t) => t?.slice(0, 5).replace(':', '.') || '';

const computeStatus = (r, now = new Date()) => {
  if (!r.date || !r.start_time || !r.end_time) return 'upcoming';
  const resStart = new Date(`${r.date}T${r.start_time}`);
  const resEnd   = new Date(`${r.date}T${r.end_time}`);
  if (now >= resStart && now <= resEnd) return 'berlangsung';
  if (now > resEnd)                     return 'selesai';
  return 'upcoming';
};

// Sudah checkin kalau updated_at berbeda dari created_at (di-update saat scan)
const hasCheckedIn = (r) => {
  if (!r.updated_at || !r.created_at) return false;
  return new Date(r.updated_at) - new Date(r.created_at) > 2000;
};

const SkeletonCard = () => (
  <div className="riwayat-card riwayat-skeleton" aria-hidden="true">
    <div className="skeleton-box" style={{ width: 48, height: 56, borderRadius: 12 }} />
    <div className="riwayat-info" style={{ gap: 6, display: 'flex', flexDirection: 'column' }}>
      <div className="skeleton-line" style={{ width: '40%', height: 10 }} />
      <div className="skeleton-line" style={{ width: '70%', height: 14 }} />
      <div className="skeleton-line" style={{ width: '50%', height: 11 }} />
      <div className="skeleton-line" style={{ width: '30%', height: 20, borderRadius: 20 }} />
    </div>
    <div className="skeleton-box" style={{ width: 44, height: 44, borderRadius: '50%' }} />
  </div>
);

const FilterBar = ({ activeFilter, onChange }) => (
  <div className="riwayat-filter-bar" role="group" aria-label="Filter status reservasi">
    {['all', ...ALL_STATUSES].map((f) => (
      <button
        key={f}
        className={`riwayat-filter-btn ${activeFilter === f ? 'active' : ''} ${f !== 'all' ? f : ''}`}
        onClick={() => onChange(f)}
        aria-pressed={activeFilter === f}
      >
        {f === 'all' ? 'Semua' : STATUS_LABEL[f]}
      </button>
    ))}
  </div>
);

const RiwayatReservasiPage = ({ onNavigate, onBack, fromPage = 'profile', user, refreshTrigger }) => {
  const [reservations, setReservations] = useState([]);
  const [loading,   setLoading]         = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error,     setError]           = useState(null);
  const [filter,    setFilter]          = useState('all');
  const [page,      setPage]            = useState(1);
  const [hasMore,   setHasMore]         = useState(false);
  const [now,       setNow]             = useState(() => new Date());
  const [showScannerId, setShowScannerId] = useState(null);
  const loaderRef                       = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchPage = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!user?.id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    const from = (pageNum - 1) * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    const { data, error: fetchError, count } = await supabase
      .from('reservations')
      .select('id, date, start_time, end_time, gym_name, notes, created_at, updated_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('date',       { ascending: false })
      .order('start_time', { ascending: false })
      .range(from, to);

    if (fetchError) {
      setError('Gagal memuat data reservasi. Coba lagi.');
    } else if (data) {
      setReservations(prev => pageNum === 1 ? data : [...prev, ...data]);
      setHasMore((count ?? 0) > pageNum * PAGE_SIZE);
      setPage(pageNum);
    }

    isRefresh ? setRefreshing(false) : setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchPage(1); }, [fetchPage, refreshTrigger]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) fetchPage(page + 1); },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPage]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`reservations:user:${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reservations', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReservations(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setReservations(prev =>
              prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r)
            );
          } else if (payload.eventType === 'DELETE') {
            setReservations(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const withStatus = reservations.map(r => ({ ...r, _status: computeStatus(r, now) }));
  const filtered   = filter === 'all' ? withStatus : withStatus.filter(r => r._status === filter);
  const counts     = withStatus.reduce((acc, r) => {
    acc[r._status] = (acc[r._status] || 0) + 1;
    return acc;
  }, {});

  const handleBack = () => {
    if (typeof onBack === 'function') onBack();
    else onNavigate(fromPage === 'qr-scan' ? 'home' : fromPage);
  };

  return (
    <div className="riwayat-page">
      <div className="riwayat-header">
        <button className="riwayat-back-btn" onClick={handleBack} aria-label="Kembali ke halaman sebelumnya">
          <IconBack />
        </button>
        <span className="riwayat-title" id="page-title">Riwayat Reservasi</span>
        <button className="riwayat-refresh-btn" onClick={() => fetchPage(1, true)}
          aria-label="Muat ulang" disabled={refreshing}>
          <IconRefresh spinning={refreshing} />
        </button>
      </div>

      {refreshing && <div className="riwayat-refresh-overlay" aria-live="polite" aria-label="Memperbarui data..." />}

      {loading ? (
        <div aria-live="polite" aria-label="Memuat data reservasi">
          <div className="riwayat-list">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>

      ) : error ? (
        <div className="riwayat-center" role="alert">
          <IconAlert />
          <p className="riwayat-empty-title">Terjadi Kesalahan</p>
          <p className="riwayat-empty-desc">{error}</p>
          <button className="riwayat-cta-btn" onClick={() => fetchPage(1)}>Coba Lagi</button>
        </div>

      ) : reservations.length === 0 ? (
        <div className="riwayat-center">
          <IconCalendar />
          <p className="riwayat-empty-title">Belum ada reservasi</p>
          <p className="riwayat-empty-desc">Kamu belum pernah melakukan reservasi gym</p>
          <button className="riwayat-cta-btn" onClick={() => onNavigate('gym-reservation')}>Buat Reservasi</button>
        </div>

      ) : (
        <>
          <div className="riwayat-summary" role="region" aria-label="Ringkasan reservasi">
            <div className="summary-chip">
              <div className="summary-chip-count">{reservations.length}</div>
              <div className="summary-chip-label" aria-hidden="true">Total</div>
            </div>
            <div className="summary-chip">
              <div className="summary-chip-count blue">{counts.upcoming || 0}</div>
              <div className="summary-chip-label" aria-hidden="true">Upcoming</div>
            </div>
            <div className="summary-chip">
              <div className="summary-chip-count red">{counts.berlangsung || 0}</div>
              <div className="summary-chip-label" aria-hidden="true">Berlangsung</div>
            </div>
            <div className="summary-chip">
              <div className="summary-chip-count green">{counts.selesai || 0}</div>
              <div className="summary-chip-label" aria-hidden="true">Selesai</div>
            </div>
          </div>

          <FilterBar activeFilter={filter} onChange={(f) => setFilter(f)} />

          <div className="riwayat-list" role="list" aria-label="Daftar reservasi">
            {filtered.length === 0 ? (
              <div className="riwayat-center" style={{ padding: '40px 24px' }}>
                <IconCalendar />
                <p className="riwayat-empty-title">Tidak ada reservasi</p>
                <p className="riwayat-empty-desc">Tidak ada reservasi dengan status "{STATUS_LABEL[filter]}"</p>
                <button className="riwayat-filter-reset" onClick={() => setFilter('all')}>Tampilkan semua</button>
              </div>
            ) : (
              filtered.map((r) => {
                const status    = r._status;
                const checkedIn = hasCheckedIn(r);
                const dt        = parseLocal(r.date);

                return (
                  <article
                    className={`riwayat-card status-${status}`}
                    key={r.id}
                    role="listitem"
                    aria-label={`Reservasi ${r.gym_name || 'Gym'} ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}, status ${STATUS_LABEL[status]}${checkedIn ? ', sudah check-in' : ''}`}
                  >
                    <div className={`riwayat-datebox ${status}`} aria-hidden="true">
                      <span className="riwayat-datebox-day">{dt.getDate()}</span>
                      <span className="riwayat-datebox-month">{MONTHS[dt.getMonth()]}</span>
                    </div>

                    <div className="riwayat-info">
                      <div className="riwayat-weekday" aria-hidden="true">{DAYS[dt.getDay()]} · {dt.getFullYear()}</div>
                      <div className="riwayat-gymname">{r.gym_name || 'Gym'}</div>
                      <div className="riwayat-time">{formatTime(r.start_time)} – {formatTime(r.end_time)}</div>
                      {r.notes && <div className="riwayat-notes" title={r.notes}>{r.notes}</div>}
                      <span className={`riwayat-badge ${status}`} role="status">{STATUS_LABEL[status]}</span>
                    </div>

                    <div className="riwayat-action">
                      {checkedIn ? (
                        /* Sudah checkin — tampilkan ceklis hijau */
                        <div className="riwayat-done-icon" aria-label="Sudah check-in" role="img">
                          <IconCheck />
                        </div>
                      ) : status === 'selesai' ? (
                        /* Selesai tapi belum checkin — ceklis abu */
                        <div className="riwayat-done-icon" aria-label="Reservasi selesai" role="img"
                          style={{ opacity: 0.3 }}>
                          <IconCheck />
                        </div>
                      ) : (
                        /* Belum checkin, masih bisa — tombol QR */
                        <button
                          className="riwayat-checkin-btn"
                          onClick={() => setShowScannerId(r.id)}
                          title="Scan QR untuk check-in"
                          aria-label={`Check-in untuk reservasi ${r.gym_name || 'Gym'}`}
                        >
                          <IconQR />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}

            {hasMore && (
              <div ref={loaderRef} className="riwayat-load-more" aria-live="polite">
                <IconSpinner />
              </div>
            )}
          </div>
        </>
      )}

      {showScannerId && (
        <QRScannerModal
          reservationId={showScannerId}
          onClose={() => setShowScannerId(null)}
          onSuccess={() => {
            setShowScannerId(null);
            fetchPage(1, true); // Refresh list to show checkmark
          }}
        />
      )}
    </div>
  );
};

export default RiwayatReservasiPage;