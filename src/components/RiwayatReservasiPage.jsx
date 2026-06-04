import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import QRScannerModal from './QRScannerModal';
import { useToast } from './Toast';
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

// Deteksi check-in dari kolom status saja (ditulis oleh QRScannerModal).
// Workaround timestamp dihapus karena menyebabkan false positive untuk reservasi baru.
const hasCheckedIn = (r) => {
  return r.status === 'checked-in' || r.status === 'hadir';
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
  const toast = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading,   setLoading]         = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error,     setError]           = useState(null);
  const [filter,    setFilter]          = useState('all');
  const [page,      setPage]            = useState(1);
  const [hasMore,   setHasMore]         = useState(false);
  const [now,       setNow]             = useState(() => new Date());
  const [showScannerData, setShowScannerData] = useState(null); // { id, fromReservasi }
  const [cancelReservation, setCancelReservation] = useState(null);
  const [penggunaId, setPenggunaId]     = useState(null);
  const loaderRef                       = useRef(null);

  // Timer untuk update status real-time
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fetch penggunaId agar bisa query tabel reservasi (singular)
  useEffect(() => {
    if (!user?.email) return;
    supabase
      .from('pengguna')
      .select('id')
      .ilike('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) setPenggunaId(data.id);
      });
  }, [user?.email]);

  const fetchPage = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!user?.id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      // Sumber UTAMA: reservasi (singular) — punya status admin (menunggu/dikonfirmasi/hadir)
      // Semua booking modern masuk sini, sehingga gate admin aktif
      let reservasiItems = [];
      if (penggunaId) {
        const { data: reservasiData } = await supabase
          .from('reservasi')
          .select('id, sesi_id, status, waktu_reservasi, sesi_gym(tanggal, jam_mulai, jam_selesai, nama_sesi)')
          .eq('pengguna_id', penggunaId)
          .order('waktu_reservasi', { ascending: false });

        reservasiItems = (reservasiData || [])
          .filter(r => r.sesi_gym?.tanggal)
          .map(r => ({
            id:            r.id,
            date:          r.sesi_gym.tanggal,
            start_time:    r.sesi_gym.jam_mulai,
            end_time:      r.sesi_gym.jam_selesai,
            gym_name:      r.sesi_gym.nama_sesi || 'Sesi Gym',
            status:        r.status,
            notes:         null,
            created_at:    r.waktu_reservasi,
            updated_at:    r.waktu_reservasi,
            checked_in_at: null,
            _fromReservasi: true,
            _sesiId:       r.sesi_id,
          }));
      }

      // Sumber SEKUNDER: reservations (plural) — hanya untuk data legacy tanpa entri di reservasi
      const from = (pageNum - 1) * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;
      const { data: resData, error: fetchError, count } = await supabase
        .from('reservations')
        .select('id, date, start_time, end_time, gym_name, notes, status, checked_in_at, created_at, updated_at', { count: 'exact' })
        .eq('user_id', user.id)
        .order('date',       { ascending: false })
        .order('start_time', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      // Tambahkan dari reservations HANYA jika tidak ada di reservasi (legacy data)
      const reservasiKeys = new Set(reservasiItems.map(r => `${r.date}|${r.start_time}`));
      const legacyItems = (resData || []).filter(r => !reservasiKeys.has(`${r.date}|${r.start_time}`));

      // Gabung & urutkan
      const merged = [...reservasiItems, ...legacyItems]
        .sort((a, b) => {
          const d = (b.date || '').localeCompare(a.date || '');
          return d !== 0 ? d : (b.start_time || '').localeCompare(a.start_time || '');
        });

      setReservations(prev => pageNum === 1 ? merged : [...prev, ...merged]);
      setHasMore((count ?? 0) > pageNum * PAGE_SIZE);
      setPage(pageNum);
    } catch (e) {
      setError('Gagal memuat data reservasi. Coba lagi.');
    }

    isRefresh ? setRefreshing(false) : setLoading(false);
  }, [user?.id, penggunaId]);

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
            // Cek duplikat sebelum prepend — bisa terjadi jika fetchPage dan realtime keduanya aktif
            setReservations(prev => {
              const alreadyExists = prev.some(r => r.id === payload.new.id);
              if (alreadyExists) return prev;
              return [payload.new, ...prev];
            });
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

  const confirmCancel = async (id) => {
    // Simpan data reservasi sebelum dihapus dari state
    const cancelledReservation = reservations.find(r => r.id === id);

    // Optimistic update dulu agar UI langsung responsif
    setReservations(prev => prev.filter(r => r.id !== id));
    try {
      if (cancelledReservation?._fromReservasi) {
        // Item dari tabel reservasi (singular) — hapus langsung
        const { error: err } = await supabase
          .from('reservasi')
          .delete()
          .eq('id', id);
        if (err) throw err;
      } else {
        // Item dari tabel reservations (plural) — hapus lalu sync reservasi
        const { error: err } = await supabase
          .from('reservations')
          .delete()
          .eq('id', id);
        if (err) throw err;

        // Juga hapus dari reservasi (singular) agar slot kapasitas terbebas & bisa daftar ulang
        if (cancelledReservation?.date && cancelledReservation?.start_time && user?.email) {
          const { data: sesiData } = await supabase
            .from('sesi_gym')
            .select('id')
            .eq('tanggal', cancelledReservation.date)
            .eq('jam_mulai', cancelledReservation.start_time)
            .maybeSingle();

          const { data: penggunaData } = await supabase
            .from('pengguna')
            .select('id')
            .ilike('email', user.email)
            .maybeSingle();

          if (sesiData?.id && penggunaData?.id) {
            await supabase
              .from('reservasi')
              .delete()
              .eq('pengguna_id', penggunaData.id)
              .eq('sesi_id', sesiData.id);
          }
        }
      }

      toast.success('Reservasi berhasil dibatalkan.');
    } catch (e) {
      // Rollback: fetch ulang jika gagal
      fetchPage(1, true);
      toast.error('Gagal membatalkan reservasi: ' + e.message);
    }
  };


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
                      ) : r._fromReservasi && r.status !== 'dikonfirmasi' ? (
                        /* Menunggu konfirmasi admin — belum bisa check-in */
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <div style={{
                            width: 36, height: 36,
                            borderRadius: '50%',
                            background: '#FFF8E7',
                            border: '1.5px solid #F59E0B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16
                          }}>⏳</div>
                          <span style={{
                            fontSize: 9,
                            color: '#F59E0B',
                            fontWeight: 700,
                            textAlign: 'center',
                            lineHeight: 1.2,
                            fontFamily: "'Poppins', sans-serif"
                          }}>Menunggu<br/>Konfirmasi</span>
                          <button
                            onClick={() => setCancelReservation(r)}
                            style={{
                              marginTop: 2,
                              background: '#FFE8EB',
                              border: '1.5px solid #FFD0D6',
                              color: '#C8102E',
                              fontSize: 9,
                              fontWeight: 700,
                              fontFamily: "'Poppins', sans-serif",
                              cursor: 'pointer',
                              padding: '4px 6px',
                              borderRadius: '8px',
                              width: '100%',
                              textAlign: 'center',
                            }}
                            title="Batalkan Sesi"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        /* Sudah dikonfirmasi admin — bisa check-in */
                        <>
                          <button
                            className="riwayat-checkin-btn"
                            onClick={() => setShowScannerData({ id: r.id, fromReservasi: !!r._fromReservasi })}
                            title="Scan QR untuk check-in"
                            aria-label={`Check-in untuk reservasi ${r.gym_name || 'Gym'}`}
                          >
                            <IconQR />
                          </button>
                          <button
                            onClick={() => setCancelReservation(r)}
                            style={{
                              marginTop: 8,
                              background: '#FFE8EB',
                              border: '1.5px solid #FFD0D6',
                              color: '#C8102E',
                              fontSize: 10,
                              fontWeight: 700,
                              fontFamily: "'Poppins', sans-serif",
                              cursor: 'pointer',
                              padding: '5px 8px',
                              borderRadius: '10px',
                              width: '100%',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              transition: 'transform 0.1s, background 0.1s'
                            }}
                            title="Batalkan Sesi"
                          >
                            Batal Sesi
                          </button>
                        </>
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

      {showScannerData && (
        <QRScannerModal
          reservationId={showScannerData.id}
          fromReservasi={showScannerData.fromReservasi}
          onClose={() => setShowScannerData(null)}
          onSuccess={() => {
            setShowScannerData(null);
            fetchPage(1, true); // Refresh list to show checkmark
          }}
        />
      )}

      {cancelReservation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 20
        }}>
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 360,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#FFE8EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <IconAlert />
            </div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#1a1a1a',
              margin: '0 0 8px 0'
            }}>Batalkan Sesi?</h3>
            <p style={{
              fontSize: 13,
              color: '#666',
              lineHeight: 1.5,
              margin: '0 0 24px 0'
            }}>
              Apakah kamu yakin ingin membatalkan reservasi gym pada hari <strong>{parseLocal(cancelReservation.date).getDate()} {MONTHS[parseLocal(cancelReservation.date).getMonth()]}</strong> pukul <strong>{formatTime(cancelReservation.start_time)}</strong>?
            </p>
            <div style={{
              display: 'flex',
              gap: 12,
              width: '100%'
            }}>
              <button
                onClick={() => setCancelReservation(null)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#666',
                  cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                Kembali
              </button>
              <button
                onClick={() => {
                  confirmCancel(cancelReservation.id);
                  setCancelReservation(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: '#C8102E',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(200, 16, 46, 0.2)',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiwayatReservasiPage;