import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import nutrigymLogo from '../assets/logo_nutrigymipb.png';
import '../styles/ConfirmPage.css';

// ICONS 
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconCheckWhite = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const Spinner = () => (
  <svg className="confirm-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
  </svg>
);

// HELPERS 
const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

const formatDate = (date) => {
  if (!date) return '-';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return '-'; }
};

const toDateString = (date) => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch { return null; }
};

const getBmiInfo = (bmi) => {
  const v = parseFloat(bmi);
  if (isNaN(v))  return null;
  if (v < 18.5)  return { label: 'Kurus',    color: '#2F5DAA', bg: '#EEF3FF' };
  if (v < 25)    return { label: 'Normal',   color: '#27AE60', bg: '#EDFFF5' };
  if (v < 30)    return { label: 'Gemuk',    color: '#F2994A', bg: '#FFF5EB' };
  return          { label: 'Obesitas', color: '#C8102E', bg: '#FFEEEE' };
};

const validateBiodata = ({ userId, namaLengkap, email, berat, tinggi }) => {
  if (!userId)                     return 'Sesi tidak valid. Silakan login kembali.';
  if (!namaLengkap?.trim())        return 'Nama lengkap tidak boleh kosong.';
  if (!email?.trim())              return 'Email tidak boleh kosong.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                                   return 'Format email tidak valid.';
  if (!berat || berat <= 0)        return 'Berat badan harus lebih dari 0 kg.';
  if (!tinggi || tinggi <= 0)      return 'Tinggi badan harus lebih dari 0 cm.';
  return null;
};

const SkeletonCard = ({ rows = 4 }) => (
  <div className="confirm-skeleton-card">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className={`confirm-skeleton-line ${i % 3 === 0 ? 'short' : i % 3 === 1 ? 'medium' : 'long'}`}
      />
    ))}
  </div>
);

const CancelModal = ({ onStay, onLeave }) => (
  <div className="confirm-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
    <div className="confirm-modal">
      <p id="cancel-modal-title" className="confirm-modal-title">Kembali & Ubah Data?</p>
      <p className="confirm-modal-body">
        Perubahan yang belum tersimpan akan tetap ada di formulir. Yakin ingin kembali?
      </p>
      <div className="confirm-modal-actions">
        <button className="confirm-modal-stay" onClick={onStay} autoFocus>
          Tetap di sini
        </button>
        <button className="confirm-modal-leave" onClick={onLeave}>
          Ya, Kembali
        </button>
      </div>
    </div>
  </div>
);

// COMPONENT 
const ConfirmPage = ({ onNavigate, biodata }) => {
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const redirectTimerRef = useRef(null);
  const isMountedRef     = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!biodata) {
      redirectTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) onNavigate('biodata');
      }, 800);
    }
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [biodata]);

  if (!biodata) {
    return (
      <div className="confirm-page-outer">
        <div className="confirm-page">
          <div className="confirm-header" />
          <div className="confirm-inner">
            <SkeletonCard rows={5} />
            <SkeletonCard rows={3} />
          </div>
        </div>
      </div>
    );
  }

  const {
    userId,
    namaLengkap  = '',
    gender       = '',
    tanggalLahir = null,
    email        = '',
    nomorTelepon = null,
    berat        = 0,
    tinggi       = 0,
  } = biodata;

  const bmi     = berat > 0 && tinggi > 0
    ? (berat / Math.pow(tinggi / 100, 2)).toFixed(1)
    : null;
  const bmiInfo = bmi ? getBmiInfo(bmi) : null;

  const requestCancel = useCallback(() => {
    if (!isLoading) setShowCancelModal(true);
  }, [isLoading]);

  const handleConfirm = async () => {
    const validationError = validateBiodata({ userId, namaLengkap, email, berat, tinggi });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        id:            userId,
        nama_lengkap:  namaLengkap,
        gender,
        tanggal_lahir: toDateString(tanggalLahir),
        email,
        nomor_telepon: nomorTelepon || null,
        berat_kg:      berat,
        tinggi_cm:     tinggi,
        updated_at:    new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      if (isMountedRef.current) {
        setSuccess(true);
        redirectTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) onNavigate('home');
        }, 1400);
      }

    } catch (err) {
      console.error('[ConfirmPage] upsert failed:', err);

      if (!isMountedRef.current) return;
      if (err?.code === '23505') {
        setError('Data sudah tersimpan. Mengarahkan...');
        redirectTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) onNavigate('home');
        }, 1500);
      } else if (err?.message?.includes('JWT') || err?.code === 'PGRST301') {
        setError('Sesi kadaluarsa. Silakan login kembali.');
      } else if (
        err instanceof TypeError ||                
        err?.message?.toLowerCase().includes('failed to fetch') ||
        err?.message?.toLowerCase().includes('networkerror') ||
        err?.message?.toLowerCase().includes('load failed')   
      ) {
        setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } else {
        setError('Gagal menyimpan data. Silakan coba lagi.');
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  const Row = ({ label, value }) => (
    <div className="confirm-row">
      <span className="confirm-row-label">{label}</span>
      <span className="confirm-row-value">{value || '-'}</span>
    </div>
  );

  const genderLabel = gender === 'laki-laki'
    ? '♂ Laki-laki'
    : gender === 'perempuan'
      ? '♀ Perempuan'
      : '-';

  const submitLabel = isLoading
    ? 'Menyimpan...'
    : success
      ? 'Tersimpan!'
      : 'Simpan & Mulai →';

  return (
    <div className="confirm-page-outer">
      {showCancelModal && (
        <CancelModal
          onStay={() => setShowCancelModal(false)}
          onLeave={() => { setShowCancelModal(false); onNavigate('biodata'); }}
        />
      )}

      <div className="confirm-page">

        {/* Header */}
        <div className="confirm-header">
          <button
            className="confirm-back-btn"
            onClick={requestCancel}
            disabled={isLoading}
            aria-label="Kembali ubah data"
          >
            <IconBack /> Ubah Data
          </button>
          <img src={nutrigymLogo} alt="NutriGym IPB" className="confirm-logo" />
        </div>

        {/* Progress */}
        <div className="confirm-progress" aria-label="Langkah 2 dari 2">
          <div className="confirm-progress-track">
            <div className="confirm-progress-fill" />
          </div>
          <span className="confirm-progress-label">Langkah 2 dari 2</span>
        </div>

        <h1 className="confirm-title">Konfirmasi Data</h1>
        <p className="confirm-subtitle">Pastikan semua data sudah benar sebelum disimpan</p>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {success && 'Data berhasil disimpan!'}
          {error && error}
        </div>
        <div className="confirm-inner">

          {error && (
            <div className="confirm-error" role="alert">{error}</div>
          )}
          <div className="confirm-cards-grid">
            <div className="confirm-card">
              <div className="confirm-card-header">
                <span className="confirm-card-label">Identitas</span>
                <button
                  className="confirm-edit-btn"
                  onClick={requestCancel}
                  disabled={isLoading}
                >
                  <IconEdit /> Edit
                </button>
              </div>
              <div className="confirm-card-body">
                <Row label="Nama Lengkap"  value={namaLengkap} />
                <Row label="Jenis Kelamin" value={genderLabel} />
                <Row label="Tanggal Lahir" value={formatDate(tanggalLahir)} />
                <Row label="Email"         value={email} />
                {nomorTelepon && <Row label="No. Telepon" value={nomorTelepon} />}
              </div>
            </div>
            <div className="confirm-card">
              <div className="confirm-card-header">
                <span className="confirm-card-label">Data Fisik</span>
                <button
                  className="confirm-edit-btn"
                  onClick={requestCancel}
                  disabled={isLoading}
                >
                  <IconEdit /> Edit
                </button>
              </div>
              <div className="confirm-card-body">
                <Row label="Berat Badan"  value={berat  ? `${berat} kg`  : '-'} />
                <Row label="Tinggi Badan" value={tinggi ? `${tinggi} cm` : '-'} />

                {bmi && bmiInfo && (
                  <div className="confirm-bmi" style={{ background: bmiInfo.bg }}>
                    <div className="confirm-bmi-left">
                      <span className="confirm-bmi-label">Indeks Massa Tubuh</span>
                      <span className="confirm-bmi-value" style={{ color: bmiInfo.color }}>{bmi}</span>
                    </div>
                    <span className="confirm-bmi-badge" style={{ background: bmiInfo.color }}>
                      {bmiInfo.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
          <button
            type="button"
            className={`confirm-submit-btn${success ? ' success' : ''}`}
            onClick={handleConfirm}
            disabled={isLoading || success}
            aria-label={submitLabel}
          >
            {isLoading ? (
              <><Spinner /> Menyimpan...</>
            ) : success ? (
              <><IconCheckWhite /> Tersimpan!</>
            ) : (
              'Simpan & Mulai →'
            )}
          </button>

          <button
            type="button"
            className="confirm-cancel-btn"
            onClick={requestCancel}
            disabled={isLoading}
          >
            Kembali & Ubah Data
          </button>

        </div>

      </div>
    </div>
  );
};

export default ConfirmPage;