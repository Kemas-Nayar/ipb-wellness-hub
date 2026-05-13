import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import '../styles/Qrscanpage.css';

// jsQR loaded via CDN
let jsQRPromise = null;
const loadJsQR = () => {
  if (jsQRPromise) return jsQRPromise;
  jsQRPromise = new Promise((resolve, reject) => {
    if (window.jsQR) { resolve(window.jsQR); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    script.onload  = () => resolve(window.jsQR);
    script.onerror = () => reject(new Error('jsQR load failed'));
    document.head.appendChild(script);
  });
  return jsQRPromise;
};

// QR data validator
const parseQRData = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  const prefixed = s.match(/^GYM_CHECKIN:([0-9a-f-]{36})$/i);
  if (prefixed) return { reservationId: prefixed[1] };
  const uuid = s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  if (uuid) return { reservationId: s };
  return null;
};

const S = {
  IDLE:       'idle',
  REQUESTING: 'requesting',
  SCANNING:   'scanning',
  PROCESSING: 'processing',
  SUCCESS:    'success',
  ERROR:      'error',
};


const getErrorMessage = (err) => {
  if (!err) return 'Kamera tidak bisa diakses. Coba lagi.';
  if (['NotAllowedError', 'PermissionDeniedError'].includes(err.name))
    return 'Izin kamera ditolak.\nBuka Pengaturan > Browser > Izin Kamera, lalu coba lagi.';
  if (['NotFoundError', 'DevicesNotFoundError'].includes(err.name))
    return 'Kamera tidak ditemukan di perangkat ini.';
  if (['NotReadableError', 'TrackStartError'].includes(err.name))
    return 'Kamera sedang dipakai aplikasi lain.\nTutup aplikasi kamera lain, lalu coba lagi.';
  if (err.name === 'OverconstrainedError')
    return 'Kamera tidak kompatibel. Coba izinkan kamera depan sebagai alternatif.';
  return 'Kamera bermasalah. Coba muat ulang halaman.';
};

const SCAN_INTERVAL_MS = 66;


const vibrate = (pattern) => {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch (_) {}
  }
};


const QRScanPage = ({ onNavigate, user, params, onCheckinSuccess }) => {
  const [status,      setStatus]      = useState(S.IDLE);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [reservation, setReservation] = useState(null);
  const [jsQRReady,   setJsQRReady]   = useState(false);

  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn,        setTorchOn]        = useState(false);

  const [earlyMinutes,   setEarlyMinutes]   = useState(null);

  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const streamRef     = useRef(null);
  const rafRef        = useRef(null);
  const scannedRef    = useRef(false);
  const mountRef      = useRef(true);
  const jsQRRef       = useRef(null);
  const lastScanRef   = useRef(0);
  const errorFocusRef = useRef(null);
  const statusRef     = useRef(null);

  // Load jsQR once
  useEffect(() => {
    mountRef.current = true;
    loadJsQR()
      .then(lib => {
        if (!mountRef.current) return;
        jsQRRef.current = lib;
        setJsQRReady(true);
      })
      .catch(() => {
        if (!mountRef.current) return;
        setStatus(S.ERROR);
        setErrorMsg('Gagal memuat scanner. Periksa koneksi internet kamu.');
      });
    return () => { mountRef.current = false; };
  }, []);


  useEffect(() => {
    if (status === S.ERROR && errorFocusRef.current) {
      errorFocusRef.current.focus();
    }
  }, [status, errorMsg]);

  // Camera helpers
  const stopCamera = useCallback(() => {
    if (rafRef.current)    { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setTorchOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);


  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (_) {}
  }, [torchOn]);


  const lastSizeRef = useRef({ w: 0, h: 0 });
  const tick = useCallback(() => {
    if (scannedRef.current || !mountRef.current || !jsQRRef.current) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }


    const now = performance.now();
    if (now - lastScanRef.current < SCAN_INTERVAL_MS) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    lastScanRef.current = now;


    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      lastSizeRef.current = { w: video.videoWidth, h: video.videoHeight };
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);


    const code = jsQRRef.current(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code?.data) {
      scannedRef.current = true;
      stopCamera();
      vibrate([50, 30, 80]);
      processQR(code.data);
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [stopCamera]); // eslint-disable-line

  const openCamera = useCallback(async () => {
    if (!mountRef.current) return;
    if (!jsQRRef.current) {
      setStatus(S.ERROR);
      setErrorMsg('Scanner belum siap. Tunggu sebentar lalu coba lagi.');
      return;
    }

    setStatus(S.REQUESTING);
    setErrorMsg('');
    scannedRef.current  = false;
    lastScanRef.current = 0;
    stopCamera();

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      if (!mountRef.current) return;
      stopCamera();
      setStatus(S.ERROR);
      setErrorMsg('Kamera tidak merespons. Coba muat ulang halaman.');
    }, 10_000);

    const tryOpen = async (constraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!mountRef.current || timedOut) {
        stream.getTracks().forEach(t => t.stop());
        return false;
      }
      streamRef.current = stream;


      const track = stream.getVideoTracks()[0];
      const caps  = track?.getCapabilities?.() ?? {};
      setTorchSupported(!!caps.torch);

      const video = videoRef.current;
      if (!video) { stopCamera(); return false; }

      video.srcObject = stream;
      await video.play();

      if (!mountRef.current || timedOut) { stopCamera(); return false; }
      return true;
    };

    try {
      let opened = false;
      try {
        opened = await tryOpen({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (e1) {
        try { opened = await tryOpen({ video: true }); }
        catch (e2) { throw e1.name === 'OverconstrainedError' ? e2 : e1; }
      }

      clearTimeout(timeoutId);
      if (timedOut || !opened || !mountRef.current) return;

      setStatus(S.SCANNING);
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      clearTimeout(timeoutId);
      if (!mountRef.current || timedOut) return;
      stopCamera();
      setStatus(S.ERROR);
      setErrorMsg(getErrorMessage(err));
    }
  }, [stopCamera, tick]);

  // QR → Supabase
  const processQR = async (raw) => {
    setStatus(S.PROCESSING);
    const parsed = parseQRData(raw);
    if (!parsed) {
      setStatus(S.ERROR);
      setErrorMsg('QR code tidak dikenal atau bukan untuk aplikasi ini.');
      return;
    }
    await doCheckin(parsed.reservationId);
  };

  const doCheckin = async (reservationId) => {
    if (!user?.id) {
      setStatus(S.ERROR);
      setErrorMsg('Sesi tidak valid. Silakan login ulang.');
      return;
    }
    try {
      const { data: res, error: fe } = await supabase
        .from('reservations')
        .select('id, date, start_time, end_time, gym_name, user_id')
        .eq('id', reservationId)
        .single();

      if (fe || !res) {
        setStatus(S.ERROR);
        setErrorMsg('Reservasi tidak ditemukan. Pastikan QR code benar.');
        return;
      }
      if (res.user_id !== user.id) {
        setStatus(S.ERROR);
        setErrorMsg('QR code ini bukan milikmu. Pastikan kamu scan QR dari reservasimu sendiri.');
        return;
      }

      const now      = new Date();
      const resStart = new Date(`${res.date}T${res.start_time}`);
      const resEnd   = new Date(`${res.date}T${res.end_time}`);
      const earliest = new Date(resStart.getTime() - 30 * 60 * 1000);

      if (now < earliest) {

        const diffMin = Math.round((earliest - now) / 60000);
        setEarlyMinutes(diffMin);
        setStatus(S.ERROR);
        setErrorMsg(`Belum waktunya check-in.\nKamu bisa masuk mulai ${diffMin} menit lagi (30 menit sebelum jadwal).`);
        return;
      }
      if (now > resEnd) {
        setStatus(S.ERROR);
        setErrorMsg('Sesi gym ini sudah berakhir. Check-in tidak bisa dilakukan.');
        return;
      }

      const { error: ue } = await supabase
        .from('reservations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', reservationId)
        .eq('user_id', user.id);

      if (ue) console.warn('checkin update warning:', ue.message);

      vibrate([100, 50, 200]);
      setReservation(res);
      setEarlyMinutes(null);
      setStatus(S.SUCCESS);
      onCheckinSuccess?.();

    } catch (err) {
      console.error('doCheckin error:', err);
      setStatus(S.ERROR);
      setErrorMsg('Koneksi bermasalah. Pastikan internet kamu aktif, lalu coba lagi.');
    }
  };


  const fmt = (t) => t?.slice(0, 5).replace(':', '.') ?? '';
  const fmtDate = (d) => {
    if (!d) return '-';
    const dt     = new Date(`${d}T00:00:00`);
    const days   = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  const handleBack  = () => { stopCamera(); onNavigate('riwayat-reservasi'); };


  const handleRetry = () => {
    setStatus(S.IDLE);
    setErrorMsg('');
    setEarlyMinutes(null);
    scannedRef.current = false;

    setTimeout(() => openCamera(), 50);
  };

  const handleManualCheckin = async () => {
    if (!params?.reservationId) return;
    scannedRef.current = true;
    stopCamera();
    setStatus(S.PROCESSING);
    await doCheckin(params.reservationId);
  };


  const handleShare = async () => {
    const text = `✅ Check-in berhasil di ${reservation?.gym_name ?? 'Gym'}\n` +
      `📅 ${fmtDate(reservation?.date)} • ${fmt(reservation?.start_time)}–${fmt(reservation?.end_time)}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Bukti Check-in Gym', text }); } catch (_) {}
    } else {
      try { await navigator.clipboard.writeText(text); alert('Detail check-in disalin!'); } catch (_) {}
    }
  };


  const liveText = {
    [S.IDLE]:       jsQRReady ? 'Siap scan. Tekan Buka Kamera.' : 'Memuat scanner...',
    [S.REQUESTING]: 'Membuka kamera...',
    [S.SCANNING]:   'Kamera aktif. Arahkan ke QR code.',
    [S.PROCESSING]: 'Memproses check-in...',
    [S.SUCCESS]:    'Check-in berhasil!',
    [S.ERROR]:      `Gagal: ${errorMsg}`,
  }[status] ?? '';


  if (status === S.SUCCESS) {
    return (
      <div className="qr-success-page" role="main" aria-live="polite">
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
          <div className="qr-success-detail" role="region" aria-label="Detail reservasi">
            <div className="qr-detail-row">
              <span className="qr-detail-label">Tanggal</span>
              <span className="qr-detail-val">{fmtDate(reservation.date)}</span>
            </div>
            <div className="qr-detail-row">
              <span className="qr-detail-label">Sesi</span>
              <span className="qr-detail-val">{fmt(reservation.start_time)} – {fmt(reservation.end_time)}</span>
            </div>
            {reservation.gym_name && (
              <div className="qr-detail-row">
                <span className="qr-detail-label">Gym</span>
                <span className="qr-detail-val">{reservation.gym_name}</span>
              </div>
            )}
          </div>
        )}

        <button className="qr-btn-outline qr-btn-share" onClick={handleShare}
          aria-label="Bagikan bukti check-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Bagikan Bukti Check-in
        </button>
        <button className="qr-btn-yellow" onClick={() => onNavigate('home')}
          style={{ marginTop: 4 }}>
          Kembali ke Dashboard
        </button>
        <button className="qr-btn-outline" style={{ marginTop: 8 }}
          onClick={() => onNavigate('riwayat-reservasi')}>
          Lihat Riwayat
        </button>
      </div>
    );
  }

  return (
    <div className="qr-page" role="main">

      <div className="qr-sr-live" aria-live="polite" aria-atomic="true" ref={statusRef}>
        {liveText}
      </div>

      <div className="qr-header">
        <button className="qr-back-btn" onClick={handleBack} aria-label="Kembali ke riwayat reservasi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="qr-title">Scan QR Check-in</h1>

        {status === S.SCANNING && torchSupported ? (
          <button className={`qr-torch-btn${torchOn ? ' qr-torch-on' : ''}`}
            onClick={toggleTorch}
            aria-label={torchOn ? 'Matikan senter' : 'Nyalakan senter'}
            aria-pressed={torchOn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </button>
        ) : (
          <div style={{ width: 36 }} aria-hidden="true"/>
        )}
      </div>

      <div className="qr-body">


        {status === S.PROCESSING && (
          <div className="qr-idle" role="status" aria-label="Memproses check-in">
            <svg className="qr-spin" width="52" height="52" viewBox="0 0 24 24"
              fill="none" stroke="#C8102E" strokeWidth="2" aria-hidden="true">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83
                       M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                strokeLinecap="round"/>
            </svg>
            <p className="qr-desc" style={{ color: '#333', fontWeight: 600, marginTop: 16 }}>
              Memproses check-in...
            </p>
          </div>
        )}


        {status === S.ERROR && (
          <div className="qr-idle">
            <div className="qr-error-icon" aria-hidden="true">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" stroke="#C8102E" strokeWidth="1.5" fill="#fff0f2"/>
                <path d="M12 7v5.5M12 15.5v1" stroke="#C8102E" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="qr-error-title" id="qr-error-title">Scan Gagal</p>

            <p className="qr-error-msg" ref={errorFocusRef} tabIndex={-1}
              aria-describedby="qr-error-title" role="alert">
              {errorMsg}
            </p>

            {earlyMinutes != null && (
              <div className="qr-early-badge" aria-live="polite">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Buka {earlyMinutes} menit lagi
              </div>
            )}

            <button className="qr-btn-yellow" onClick={handleRetry}>
              Coba Scan Lagi
            </button>
            <button className="qr-btn-outline" onClick={handleBack} style={{ marginTop: 8 }}>
              Kembali
            </button>
          </div>
        )}


        {status === S.IDLE && (
          <div className="qr-idle">
            <div className="qr-placeholder" aria-hidden="true">
              <div className="qr-frame">
                <span className="qr-corner tl"/><span className="qr-corner tr"/>
                <span className="qr-corner bl"/><span className="qr-corner br"/>
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="3" height="3"/>
                  <rect x="19" y="14" width="2" height="2"/>
                  <rect x="14" y="19" width="2" height="2"/>
                  <rect x="18" y="18" width="3" height="3"/>
                </svg>
              </div>
            </div>


            {!jsQRReady && (
              <div className="qr-loading-bar" role="progressbar" aria-label="Memuat scanner"
                aria-valuetext="Memuat...">
                <div className="qr-loading-bar-fill"/>
              </div>
            )}

            <p className="qr-desc">
              {jsQRReady
                ? 'Arahkan kamera ke QR code di pintu masuk gym'
                : 'Memuat scanner, sebentar...'}
            </p>


            {jsQRReady && (
              <p className="qr-hint">
                💡 Pegang HP sejajar dengan QR, jarak 15–30 cm
              </p>
            )}


            <button
              className={`qr-btn-yellow${!jsQRReady ? ' qr-btn-loading' : ''}`}
              onClick={openCamera}
              disabled={!jsQRReady}
              aria-disabled={!jsQRReady}
            >
              {jsQRReady ? 'Buka Kamera' : (
                <>
                  <svg className="qr-spin-sm" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83
                             M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                      strokeLinecap="round"/>
                  </svg>
                  Memuat Scanner...
                </>
              )}
            </button>


            {params?.reservationId && (
              <div className="qr-manual-wrap">
                <p className="qr-manual-label">Kamera bermasalah?</p>
                <button className="qr-btn-outline" onClick={handleManualCheckin}>
                  Check-in Tanpa Scan
                </button>
              </div>
            )}
          </div>
        )}


        {status === S.REQUESTING && (
          <div className="qr-idle" role="status" aria-label="Membuka kamera">
            <div className="qr-placeholder" aria-hidden="true">
              <div className="qr-frame">
                <span className="qr-corner tl"/><span className="qr-corner tr"/>
                <span className="qr-corner bl"/><span className="qr-corner br"/>
                <svg className="qr-spin" width="48" height="48" viewBox="0 0 24 24"
                  fill="none" stroke="#C8102E" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83
                           M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                    strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <p className="qr-desc">Membuka kamera...</p>
            <p className="qr-hint">Izinkan akses kamera jika ada permintaan dari browser</p>
            <button className="qr-btn-outline"
              onClick={() => { stopCamera(); setStatus(S.IDLE); }}>
              Batalkan
            </button>
          </div>
        )}


        {status === S.SCANNING && (
          <div className="qr-scanner" role="region" aria-label="Pemindai QR aktif">
            <div className="qr-video-wrap">
              <video ref={videoRef} autoPlay playsInline muted className="qr-video"
                aria-label="Tampilan kamera"/>
              <canvas ref={canvasRef} style={{ display: 'none' }} aria-hidden="true"/>
              <div className="qr-overlay" aria-hidden="true">
                <div className="qr-scan-frame">
                  <span className="qr-corner tl"/><span className="qr-corner tr"/>
                  <span className="qr-corner bl"/><span className="qr-corner br"/>
                  <div className="qr-scan-line"/>
                </div>
              </div>
            </div>
            <p className="qr-scanning-text">Mendeteksi QR code...</p>
            <p className="qr-hint" style={{ margin: '-6px 0 8px' }}>
              Pastikan QR code ada di dalam bingkai
            </p>
            <button className="qr-btn-outline"
              onClick={() => { stopCamera(); setStatus(S.IDLE); }}
              aria-label="Batalkan scanning">
              Batalkan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanPage;