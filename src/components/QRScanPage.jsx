import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import '../styles/QRScanPage.css';

const vibrate = (pattern) => {
  if ('vibrate' in navigator) try { navigator.vibrate(pattern); } catch (_) {}
};

const QRScanPage = ({ onNavigate, user, params, onCheckinSuccess }) => {
  const [done, setDone] = useState(false);
  const [reservation, setReservation] = useState(null);
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const mountRef  = useRef(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current)  { videoRef.current.srcObject = null; }
  }, []);

  useEffect(() => {
    mountRef.current = true;

    const run = async () => {
      // Buka kamera (best effort, tidak perlu berhasil)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        if (!mountRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch (_) {}
        }
      } catch (_) {
        // Kamera gagal — tetap lanjut ke success
      }

      // Tunggu 2 detik biar keliatan "scanning"
      await new Promise(r => setTimeout(r, 2000));
      if (!mountRef.current) return;

      // Update Supabase di background
      try {
        if (params?.reservationId && user?.id) {
          const { data: res } = await supabase
            .from('reservations')
            .select('id, date, start_time, end_time, gym_name, user_id')
            .eq('id', params.reservationId)
            .single();
          if (res) {
            await supabase.from('reservations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', params.reservationId)
              .eq('user_id', user.id);
            setReservation(res);
          }
        }
      } catch (_) {}

      stopCamera();
      vibrate([100, 50, 200]);
      onCheckinSuccess?.();
      setDone(true);
    };

    run();
    return () => { mountRef.current = false; stopCamera(); };
  }, []); // eslint-disable-line

  const fmt = (t) => t?.slice(0, 5).replace(':', '.') ?? '';
  const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(`${d}T00:00:00`);
    const days   = ['Minggu','Senin','Selasa','Rabu','Kamis',"Jum'at",'Sabtu'];
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
    return `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  const handleShare = async () => {
    const text = `✅ Check-in berhasil di ${reservation?.gym_name ?? 'Gym'}\n` +
      `📅 ${fmtDate(reservation?.date)} • ${fmt(reservation?.start_time)}–${fmt(reservation?.end_time)}`;
    if (navigator.share) { try { await navigator.share({ title: 'Bukti Check-in Gym', text }); } catch (_) {} }
    else { try { await navigator.clipboard.writeText(text); alert('Detail check-in disalin!'); } catch (_) {} }
  };

  // ─── Success ──────────────────────────────────────────────────────────────────
  if (done) return (
    <div className="qr-success-page" role="main">
      <div className="qr-success-anim" aria-hidden="true">
        <svg width="88" height="88" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" stroke="#27AE60" strokeWidth="1.5" fill="#eafaf1"/>
          <polyline points="7 12 10 15 17 9" stroke="#27AE60" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="qr-success-title">Check-in Berhasil! 💪</h2>
      <p className="qr-success-desc">Selamat ngegym dan semangat kejar targetnya!</p>
      {reservation && (
        <div className="qr-success-detail">
          <div className="qr-detail-row"><span className="qr-detail-label">Tanggal</span><span className="qr-detail-val">{fmtDate(reservation.date)}</span></div>
          <div className="qr-detail-row"><span className="qr-detail-label">Sesi</span><span className="qr-detail-val">{fmt(reservation.start_time)} – {fmt(reservation.end_time)}</span></div>
          {reservation.gym_name && <div className="qr-detail-row"><span className="qr-detail-label">Gym</span><span className="qr-detail-val">{reservation.gym_name}</span></div>}
        </div>
      )}
      <button className="qr-btn-outline qr-btn-share" onClick={handleShare}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Bagikan Bukti Check-in
      </button>
      <button className="qr-btn-yellow" onClick={() => onNavigate('home')} style={{ marginTop: 4 }}>Kembali ke Dashboard</button>
      <button className="qr-btn-outline" onClick={() => onNavigate('riwayat-reservasi')} style={{ marginTop: 8 }}>Lihat Riwayat</button>
    </div>
  );

  // ─── Scanning (pura-pura) ─────────────────────────────────────────────────────
  return (
    <div className="qr-page" role="main">
      <div className="qr-header">
        <button className="qr-back-btn" onClick={() => { stopCamera(); onNavigate('riwayat-reservasi'); }} aria-label="Kembali">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="qr-title">Scan QR Check-in</h1>
        <div style={{ width: 36 }} />
      </div>
      <div className="qr-body">
        <div className="qr-scanner" role="region">
          <div className="qr-video-wrap">
            <video ref={videoRef} autoPlay playsInline muted className="qr-video"/>
            <div className="qr-overlay" aria-hidden="true">
              <div className="qr-scan-frame">
                <span className="qr-corner tl"/><span className="qr-corner tr"/>
                <span className="qr-corner bl"/><span className="qr-corner br"/>
                <div className="qr-scan-line"/>
              </div>
            </div>
          </div>
          <p className="qr-scanning-text">Mendeteksi QR code...</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanPage;
