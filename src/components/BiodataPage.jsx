import React, { useState, useRef, useEffect } from 'react';
 import nutrigymLogo from '../assets/logo_nutrigymipb.png';
 import DatePicker from './DatePicker';
import '../styles/BiodataPage.css';

// SVG Icons
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMale = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#fff' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="10" cy="14" r="5"/>
    <path d="M19 5l-5.5 5.5M15 5h4v4"/>
  </svg>
);
const IconFemale = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#fff' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="12" cy="8" r="5"/>
    <path d="M12 13v8M9 18h6"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5l7 7-7 7"/>
  </svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <path d="M22 6l-10 7L2 6"/>
  </svg>
);
const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
  </svg>
);
const IconWeight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2h12l2 5H4L6 2zM4 7h16v15H4z"/>
    <path d="M9 12h6"/>
  </svg>
);
const IconHeight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2v20M7 7l5-5 5 5M7 17l5 5 5-5"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27AE60"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const IconSpinner = () => (
  <svg className="bio-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4M12 8h.01"/>
  </svg>
);

// Helpers
const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

const parseToDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
};

const formatDate = (date) => {
  const d = parseToDate(date);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};


const normalizeDecimal = (val) => val.replace(',', '.');


const sanitizeDecimalInput = (val) => {
  const normalised = val.replace(',', '.');
  return normalised.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
};

const getBmiCategory = (bmi) => {
  const val = parseFloat(bmi);
  if (isNaN(val))  return null;
  if (val < 18.5)  return { label: 'Kurus',    color: '#2F5DAA', bg: '#EEF3FF', range: '< 18.5' };
  if (val < 25)    return { label: 'Normal',   color: '#27AE60', bg: '#EDFFF5', range: '18.5 – 24.9' };
  if (val < 30)    return { label: 'Gemuk',    color: '#F2994A', bg: '#FFF5EB', range: '25 – 29.9' };
  return             { label: 'Obesitas', color: '#C8102E', bg: '#FFEEEE', range: '≥ 30' };
};


const getAgeBounds = () => {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  return { minDate, maxDate };
};

// Date picker
const InlineDatePicker = ({ value, onDone, onCancel }) => {
  const today = new Date();
  const initialDate = value instanceof Date && !isNaN(value.getTime()) ? value : new Date(2000, 0, 1);

  const [day,   setDay]   = useState(String(initialDate.getDate()));
  const [month, setMonth] = useState(String(initialDate.getMonth() + 1));
  const [year,  setYear]  = useState(String(initialDate.getFullYear()));
  const [err,   setErr]   = useState('');

  const { minDate, maxDate } = getAgeBounds();

  const handleDone = () => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!d || !m || !y || y < 1900 || y > today.getFullYear()) {
      setErr('Tanggal tidak valid'); return;
    }
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) { setErr('Tanggal tidak valid'); return; }
    if (date > maxDate) { setErr('Usia minimal 10 tahun'); return; }
    if (date < minDate) { setErr('Tanggal lahir tidak valid (maks 100 tahun)'); return; }
    onDone(date);
  };

  return (
    <div className="bio-datepicker-overlay" role="dialog" aria-modal="true" aria-label="Pilih tanggal lahir">
      <div className="bio-datepicker-sheet">
        <div className="bio-datepicker-header">
          <span className="bio-datepicker-title">Tanggal Lahir</span>
          <button type="button" className="bio-datepicker-close" onClick={onCancel} aria-label="Tutup">✕</button>
        </div>
        <div className="bio-datepicker-body">
          <div className="bio-datepicker-row">
            <div className="bio-datepicker-field">
              <label htmlFor="dp-day" className="bio-datepicker-label">Tanggal</label>
              <input id="dp-day" type="text" inputMode="numeric" className="bio-datepicker-input"
                value={day} maxLength={2} placeholder="DD"
                onChange={e => { setDay(e.target.value.replace(/\D/g,'')); setErr(''); }} />
            </div>
            <div className="bio-datepicker-field bio-datepicker-field--month">
              <label htmlFor="dp-month" className="bio-datepicker-label">Bulan</label>
              <select id="dp-month" className="bio-datepicker-input bio-datepicker-select"
                value={month} onChange={e => { setMonth(e.target.value); setErr(''); }}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>{m}</option>
                ))}
              </select>
            </div>
            <div className="bio-datepicker-field">
              <label htmlFor="dp-year" className="bio-datepicker-label">Tahun</label>
              <input id="dp-year" type="text" inputMode="numeric" className="bio-datepicker-input"
                value={year} maxLength={4} placeholder="YYYY"
                onChange={e => { setYear(e.target.value.replace(/\D/g,'')); setErr(''); }} />
            </div>
          </div>
          {err && <p className="bio-datepicker-err" role="alert">{err}</p>}
        </div>
        <div className="bio-datepicker-actions">
          <button type="button" className="bio-datepicker-cancel" onClick={onCancel}>Batal</button>
          <button type="button" className="bio-datepicker-done" onClick={handleDone}>Pilih</button>
        </div>
      </div>
    </div>
  );
};

// Cancel confirm dialog
const CancelDialog = ({ onConfirm, onDismiss }) => (
  <div className="bio-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title">
    <div className="bio-dialog-sheet">
      <h2 id="cancel-dialog-title" className="bio-dialog-title">Batalkan pendaftaran?</h2>
      <p className="bio-dialog-body">Data yang sudah kamu isi akan hilang. Yakin ingin keluar?</p>
      <div className="bio-dialog-actions">
        <button type="button" className="bio-dialog-keep" onClick={onDismiss}>Lanjutkan isi</button>
        <button type="button" className="bio-dialog-leave" onClick={onConfirm}>Ya, keluar</button>
      </div>
    </div>
  </div>
);

// Main component
const BiodataPage = ({ onNavigate, user, initialData }) => {
  const [namaLengkap,    setNamaLengkap]    = useState(initialData?.namaLengkap   || '');
  const [gender,         setGender]         = useState(initialData?.gender        || null);
  const [tanggalLahir,   setTanggalLahir]   = useState(() => parseToDate(initialData?.tanggalLahir));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email,          setEmail]          = useState(initialData?.email         || user?.email || '');
  const [nomorTelepon,   setNomorTelepon]   = useState(initialData?.nomorTelepon  || '');
  const [berat,          setBerat]          = useState(initialData?.berat         ? String(initialData.berat)  : '');
  const [tinggi,         setTinggi]         = useState(initialData?.tinggi        ? String(initialData.tinggi) : '');
  const [errors,         setErrors]         = useState({});
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [showCancel,     setShowCancel]     = useState(false);


  const firstErrorRef = useRef(null);

  const clearError = (field) => setErrors(prev => ({ ...prev, [field]: '' }));

  const isDirty = !!(namaLengkap || gender || tanggalLahir || email || berat || tinggi);

    const validate = () => {
    const e = {};
    if (!namaLengkap.trim())
      e.namaLengkap = 'Nama lengkap wajib diisi';

    if (!gender)
      e.gender = 'Pilih jenis kelamin';

    if (!tanggalLahir) {
      e.tanggalLahir = 'Pilih tanggal lahir';
    } else {
      const { minDate, maxDate } = getAgeBounds();
      if (tanggalLahir > maxDate) e.tanggalLahir = 'Usia minimal 10 tahun';
      else if (tanggalLahir < minDate) e.tanggalLahir = 'Tanggal lahir tidak valid';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail)
      e.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(trimmedEmail))
      e.email = 'Format email tidak valid';

    const b = parseFloat(normalizeDecimal(berat));
    if (!berat.trim())          e.berat = 'Berat badan wajib diisi';
    else if (isNaN(b) || b <= 0) e.berat = 'Berat harus lebih dari 0';
    else if (b > 300)            e.berat = 'Berat tidak valid (maks 300 kg)';

    const t = parseFloat(normalizeDecimal(tinggi));
    if (!tinggi.trim())          e.tinggi = 'Tinggi badan wajib diisi';
    else if (isNaN(t) || t <= 0) e.tinggi = 'Tinggi harus lebih dari 0';
    else if (t > 300)            e.tinggi = 'Tinggi tidak valid (maks 300 cm)';

    return e;
  };

    const handleNext = () => {
    if (isSubmitting) return;
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      setTimeout(() => {
        const el = document.querySelector('[data-error="true"]');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 120;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          el.focus?.();
        }
      }, 150);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      onNavigate?.('confirm', {
        userId:       user?.id,
        namaLengkap:  namaLengkap.trim(),
        gender,
        tanggalLahir,
        email:        email.trim(),
        nomorTelepon: nomorTelepon.trim() || null,
        berat:        parseFloat(normalizeDecimal(berat)),
        tinggi:       parseFloat(normalizeDecimal(tinggi)),
      });
      setIsSubmitting(false);
    }, 400);
  };

  const handleCancelRequest = () => {
    if (isDirty) { setShowCancel(true); }
    else         { onNavigate?.('login'); }
  };

    const beratNum  = parseFloat(normalizeDecimal(berat));
  const tinggiNum = parseFloat(normalizeDecimal(tinggi));
  const bmi = !isNaN(beratNum) && !isNaN(tinggiNum) && beratNum > 0 && tinggiNum > 0
    ? (beratNum / Math.pow(tinggiNum / 100, 2)).toFixed(1)
    : null;
  const bmiInfo = bmi ? getBmiCategory(bmi) : null;


  const ErrorMsg = ({ field, id }) => errors[field] ? (
    <p
      id={id}
      className="bio-error-msg"
      role="alert"
      data-error="true"
      tabIndex={-1}
      ref={firstErrorRef}
    >
      <span className="bio-error-icon" aria-hidden="true">!</span>
      {errors[field]}
    </p>
  ) : null;

    return (
    <div className="biodata-page">
      {showCancel && (
        <CancelDialog
          onConfirm={() => onNavigate?.('login')}
          onDismiss={() => setShowCancel(false)}
        />
      )}
      {showDatePicker && (
        <InlineDatePicker
          value={tanggalLahir}
          onCancel={() => setShowDatePicker(false)}
          onDone={date => {
            setTanggalLahir(date);
            clearError('tanggalLahir');
            setShowDatePicker(false);
          }}
        />
      )}
      <header className="biodata-header">
        <button
          type="button"
          className="biodata-back-btn"
          onClick={handleCancelRequest}
          aria-label="Kembali ke halaman login"
        >
          <IconBack /> Kembali
        </button>

        <img
  src={nutrigymLogo}
  alt="NutriGym IPB"
  className="biodata-logo"
  height={36}
/>
      </header>
      <div className="biodata-progress" role="progressbar" aria-valuenow={1} aria-valuemin={1} aria-valuemax={2} aria-label="Langkah 1 dari 2">
        <div className="biodata-progress-track">
          <div className="biodata-progress-fill" style={{ width: '50%' }} />
        </div>
        <span className="biodata-progress-label" aria-hidden="true">Langkah 1 / 2</span>
      </div>
      <div className="biodata-steps" aria-hidden="true">
        <div className="biodata-step biodata-step--active">
          <div className="biodata-step-dot">1</div>
          <span className="biodata-step-label">Biodata</span>
        </div>
        <div className="biodata-step-line" />
        <div className="biodata-step biodata-step--inactive">
          <div className="biodata-step-dot">2</div>
          <span className="biodata-step-label">Konfirmasi</span>
        </div>
      </div>

      <h1 className="biodata-title">Isi Biodata</h1>
      <p className="biodata-subtitle">
        Lengkapi data diri untuk mendapatkan program yang personal.{' '}
        <span className="bio-required-note"><span aria-hidden="true">*</span> Wajib diisi</span>
      </p>
      {errors.submit && (
        <div className="bio-submit-error" role="alert">{errors.submit}</div>
      )}

      {/* Informasi Pribadi */}
      <section className="bio-card" aria-labelledby="card-pribadi-heading">
        <div className="bio-card-header">
          <div className="bio-card-icon"><IconUser /></div>
          <span id="card-pribadi-heading" className="bio-card-label">Informasi Pribadi</span>
        </div>
        <div className="bio-card-body">
          <div className="bio-field-group">
            <label htmlFor="namaLengkap" className="bio-field-label">
              Nama Lengkap <span className="bio-required-star" aria-hidden="true">*</span>
            </label>
            <div className={`bio-input-row ${errors.namaLengkap ? 'has-error' : namaLengkap ? 'has-value' : ''}`}>
              <IconUser />
              <input
                id="namaLengkap"
                type="text"
                placeholder="Nama lengkap sesuai KTP"
                value={namaLengkap}
                onChange={e => { setNamaLengkap(e.target.value); clearError('namaLengkap'); }}
                className="bio-input"
                autoComplete="name"
                aria-required="true"
                aria-invalid={!!errors.namaLengkap}
                aria-describedby={errors.namaLengkap ? 'err-nama' : undefined}
              />
              {namaLengkap && !errors.namaLengkap && <IconCheck />}
            </div>
            <ErrorMsg field="namaLengkap" id="err-nama" />
          </div>
          <div className="bio-field-group">
            <p
              id="gender-label"
              className="bio-field-label"
            >
              Jenis Kelamin <span className="bio-required-star" aria-hidden="true">*</span>
            </p>
            <div
              className="bio-gender-row"
              role="group"
              aria-labelledby="gender-label"
              aria-required="true"
            >
              <button
                type="button"
                className={`bio-gender-btn ${gender === 'laki-laki' ? 'selected' : ''} ${errors.gender ? 'has-error' : ''}`}
                onClick={() => { setGender('laki-laki'); clearError('gender'); }}
                aria-pressed={gender === 'laki-laki'}
              >
                <IconMale active={gender === 'laki-laki'} /> Laki-laki
              </button>
              <button
                type="button"
                className={`bio-gender-btn ${gender === 'perempuan' ? 'selected' : ''} ${errors.gender ? 'has-error' : ''}`}
                onClick={() => { setGender('perempuan'); clearError('gender'); }}
                aria-pressed={gender === 'perempuan'}
              >
                <IconFemale active={gender === 'perempuan'} /> Perempuan
              </button>
            </div>
            <ErrorMsg field="gender" id="err-gender" />
          </div>
          <div className="bio-field-group">
            <label id="dob-label" className="bio-field-label">
              Tanggal Lahir <span className="bio-required-star" aria-hidden="true">*</span>
            </label>
            <button
              type="button"
              className={`bio-date-row ${errors.tanggalLahir ? 'has-error' : tanggalLahir ? 'has-value' : ''}`}
              onClick={() => setShowDatePicker(true)}
              aria-haspopup="dialog"
              aria-expanded={showDatePicker}
              aria-labelledby="dob-label"
              aria-describedby={errors.tanggalLahir ? 'err-dob' : undefined}
            >
              <div className="bio-date-left">
                <IconCalendar />
                <span className={tanggalLahir ? 'bio-date-value' : 'bio-date-placeholder'}>
                  {tanggalLahir ? formatDate(tanggalLahir) : 'Pilih tanggal lahir'}
                </span>
              </div>
              {tanggalLahir ? <IconCheck /> : <IconChevronRight />}
            </button>
            <ErrorMsg field="tanggalLahir" id="err-dob" />
          </div>

        </div>
      </section>

      {/* Kontak */}
      <section className="bio-card" aria-labelledby="card-kontak-heading">
        <div className="bio-card-header">
          <div className="bio-card-icon"><IconMail /></div>
          <span id="card-kontak-heading" className="bio-card-label">Kontak</span>
        </div>
        <div className="bio-card-body">
          <div className="bio-field-group">
            <label htmlFor="email" className="bio-field-label">
              Alamat Email <span className="bio-required-star" aria-hidden="true">*</span>
            </label>
            <div className={`bio-input-row ${errors.email ? 'has-error' : email && /\S+@\S+\.\S+/.test(email.trim()) ? 'has-value' : ''}`}>
              <IconMail />
              <input
                id="email"
                type="email"
                placeholder="contoh@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError('email'); }}
                className="bio-input"
                autoComplete="email"
                inputMode="email"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'err-email' : undefined}
              />
              {email && !errors.email && /\S+@\S+\.\S+/.test(email.trim()) && <IconCheck />}
            </div>
            <ErrorMsg field="email" id="err-email" />
          </div>
          <div className="bio-field-group">
            <label htmlFor="nomorTelepon" className="bio-field-label">
              Nomor Telepon
              <span className="bio-optional-inline">opsional</span>
            </label>
            <div className="bio-input-row">
              <IconPhone />
              <input
                id="nomorTelepon"
                type="text"
                inputMode="tel"
                placeholder="+62 812 xxxx xxxx"
                value={nomorTelepon}
                onChange={e => setNomorTelepon(e.target.value)}
                className="bio-input"
                autoComplete="tel"
                aria-describedby="hint-telp"
              />
            </div>
            <p id="hint-telp" className="bio-hint">
              <IconInfo /> Contoh: +62 812 3456 7890
            </p>
          </div>

        </div>
      </section>

      {/* Data Fisik */}
      <section className="bio-card" aria-labelledby="card-fisik-heading">
        <div className="bio-card-header">
          <div className="bio-card-icon"><IconHeight /></div>
          <span id="card-fisik-heading" className="bio-card-label">Data Fisik</span>
          <span className="bio-card-sublabel">Digunakan untuk menghitung kebutuhan kalori kamu</span>
        </div>
        <div className="bio-card-body">

          <div className="bio-fisik-row">
            <div className="bio-fisik-col">
              <label htmlFor="berat" className="bio-field-label">
                Berat <span className="bio-required-star" aria-hidden="true">*</span>
              </label>
              <div className={`bio-input-row bio-fisik-input ${errors.berat ? 'has-error' : berat ? 'has-value' : ''}`}>
                <IconWeight />
                <input
                  id="berat"
                  type="text"
                  inputMode="decimal"
                  placeholder="kg"
                  value={berat}
                  onChange={e => { setBerat(sanitizeDecimalInput(e.target.value)); clearError('berat'); }}
                  className="bio-input"
                  aria-required="true"
                  aria-invalid={!!errors.berat}
                  aria-describedby={errors.berat ? 'err-berat' : 'hint-berat'}
                  aria-label="Berat badan dalam kilogram"
                />
              </div>
              <p id="hint-berat" className="bio-hint bio-hint--center">dalam kg</p>
              <ErrorMsg field="berat" id="err-berat" />
            </div>
            <div className="bio-fisik-col">
              <label htmlFor="tinggi" className="bio-field-label">
                Tinggi <span className="bio-required-star" aria-hidden="true">*</span>
              </label>
              <div className={`bio-input-row bio-fisik-input ${errors.tinggi ? 'has-error' : tinggi ? 'has-value' : ''}`}>
                <IconHeight />
                <input
                  id="tinggi"
                  type="text"
                  inputMode="decimal"
                  placeholder="cm"
                  value={tinggi}
                  onChange={e => { setTinggi(sanitizeDecimalInput(e.target.value)); clearError('tinggi'); }}
                  className="bio-input"
                  aria-required="true"
                  aria-invalid={!!errors.tinggi}
                  aria-describedby={errors.tinggi ? 'err-tinggi' : 'hint-tinggi'}
                  aria-label="Tinggi badan dalam sentimeter"
                />
              </div>
              <p id="hint-tinggi" className="bio-hint bio-hint--center">dalam cm</p>
              <ErrorMsg field="tinggi" id="err-tinggi" />
            </div>

          </div>
          <div
            className="bio-bmi-preview"
            style={{
              background:  bmiInfo ? bmiInfo.bg : '#f5f5f5',
              opacity:     bmi ? 1 : 0,
              transform:   bmi ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.98)',
              pointerEvents: bmi ? 'auto' : 'none',
            }}
            aria-live="polite"
            aria-atomic="true"
            aria-label={bmi && bmiInfo ? `BMI kamu ${bmi}, kategori ${bmiInfo.label}` : ''}
          >
            <div className="bio-bmi-preview-left">
              <p className="bio-bmi-label">BMI Kamu</p>
              <p className="bio-bmi-value" style={{ color: bmiInfo?.color }}>{bmi ?? '—'}</p>
              <p className="bio-bmi-range" style={{ color: bmiInfo?.color }}>Normal: 18.5 – 24.9</p>
            </div>
            <div className="bio-bmi-right">
              {bmiInfo && (
                <>
                  <span className="bio-bmi-badge" style={{ background: bmiInfo.color }}>{bmiInfo.label}</span>
                  <p className="bio-bmi-range-badge" style={{ color: bmiInfo.color }}>{bmiInfo.range}</p>
                </>
              )}
            </div>
          </div>

        </div>
      </section>
      <button
        type="button"
        className={`bio-submit-btn ${isSubmitting ? 'loading' : ''}`}
        onClick={handleNext}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <span className="bio-btn-loading">
            <IconSpinner /> Memproses…
          </span>
        ) : (
          'Lanjut ke Konfirmasi →'
        )}
      </button>

      <button
        type="button"
        className="bio-cancel-btn"
        onClick={handleCancelRequest}
        disabled={isSubmitting}
      >
        Batalkan
      </button>

    </div>
  );
};

export default BiodataPage;