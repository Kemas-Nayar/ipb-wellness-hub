import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import '../styles/SubPage.css';
import '../styles/PersonalInfoPage.css';

// SVG Icons
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.95 1.18 2 2 0 012.92 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8.91a16 16 0 006 6l1.07-1.08a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);

const IconGender = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M12 12v8M8 16h8"/>
    <path d="M17 3l4 4M21 3h-4v4"/>
  </svg>
);

const IconWeight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a3 3 0 100 6 3 3 0 000-6z"/>
    <path d="M6.343 9.343L3 12.686V21h18v-8.314l-3.343-3.343"/>
    <path d="M9 9h6"/>
  </svg>
);

const IconHeight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/>
  </svg>
);

const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconSuccess = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconWarning = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);


const PersonalInfoPage = ({ onNavigate, user }) => {
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    namaLengkap: '',
    email: '',
    telepon: '',
    tanggalLahir: '',
    gender: '',
    beratKg: '',
    tinggiCm: '',
  });

  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const fetchData = async () => {
      setIsFetching(true);
      const { data } = await supabase
        .from('profiles')
        .select('nama_lengkap, email, nomor_telepon, tanggal_lahir, gender, berat_kg, tinggi_cm, avatar_url')
        .eq('id', user.id)
        .single();

      if (!mounted) return;

      if (data) {
        const loaded = {
          namaLengkap: data.nama_lengkap || '',
          email: data.email || user.email || '',
          telepon: data.nomor_telepon || '',
          tanggalLahir: data.tanggal_lahir || '',
          gender: data.gender || '',
          beratKg: data.berat_kg?.toString() || '',
          tinggiCm: data.tinggi_cm?.toString() || '',
        };
        setForm(loaded);
        setSnapshot(loaded);
        if (data.avatar_url) {
          if (data.avatar_url.startsWith('http')) {
            setAvatarUrl(data.avatar_url);
          } else {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(data.avatar_url);
            setAvatarUrl(urlData?.publicUrl || null);
          }
        }
      }
      setIsFetching(false);
    };

    fetchData();
    return () => { mounted = false; };
  }, [user]);

  const handlePhotoClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { setError('Ukuran foto maksimal 2MB'); return; }
    if (!file.type.startsWith('image/')) { setError('File harus berupa gambar'); return; }

    setIsUploadingPhoto(true);
    setError('');

    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + '?t=' + Date.now();

      await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
    } catch (err) {
      setError('Gagal upload foto: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleEdit = () => {
    setSnapshot({ ...form });
    setIsEdit(true);
    setError('');
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    if (snapshot) setForm(snapshot);
    setIsEdit(false);
    setError('');
  };

  const validate = () => {
    if (!form.namaLengkap.trim()) return 'Nama lengkap wajib diisi';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) return 'Format email tidak valid';
    if (form.beratKg && (isNaN(form.beratKg) || parseFloat(form.beratKg) <= 0)) return 'Berat badan tidak valid';
    if (form.tinggiCm && (isNaN(form.tinggiCm) || parseFloat(form.tinggiCm) <= 0)) return 'Tinggi badan tidak valid';
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    setError('');

    const { error: saveError } = await supabase.from('profiles').upsert({
      id: user.id,
      nama_lengkap: form.namaLengkap.trim(),
      email: form.email.trim(),
      nomor_telepon: form.telepon,
      tanggal_lahir: form.tanggalLahir || null,
      gender: form.gender,
      berat_kg: form.beratKg ? parseFloat(form.beratKg) : null,
      tinggi_cm: form.tinggiCm ? parseFloat(form.tinggiCm) : null,
      updated_at: new Date().toISOString(),
    });

    setIsLoading(false);

    if (saveError) {
      setError('Gagal menyimpan: ' + saveError.message);
    } else {
      setIsEdit(false);
      setSaveSuccess(true);
      setSnapshot({ ...form });
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const setField = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setError('');
  };

  const bmi = form.beratKg && form.tinggiCm &&
    parseFloat(form.beratKg) > 0 && parseFloat(form.tinggiCm) > 0
    ? (parseFloat(form.beratKg) / Math.pow(parseFloat(form.tinggiCm) / 100, 2)).toFixed(1)
    : null;

  const getBmiInfo = (val) => {
    const v = parseFloat(val);
    if (v < 18.5) return { label: 'Kurus', color: '#2F5DAA', bg: '#EEF3FF' };
    if (v < 25)   return { label: 'Normal', color: '#27AE60', bg: '#EDFFF5' };
    if (v < 30)   return { label: 'Gemuk', color: '#F2994A', bg: '#FFF5EB' };
    return { label: 'Obesitas', color: '#C8102E', bg: '#FFEEEE' };
  };

  const avatarInitial = form.namaLengkap.charAt(0).toUpperCase()
    || user?.email?.charAt(0).toUpperCase() || 'U';


  const identityFields = [
    { label: 'Nama Lengkap',   key: 'namaLengkap',  type: 'text',  placeholder: 'Nama Lengkap',  Icon: IconUser },
    { label: 'Alamat E-Mail',  key: 'email',         type: 'email', placeholder: 'Email',          Icon: IconMail },
    { label: 'Nomor Telepon',  key: 'telepon',       type: 'tel',   placeholder: 'Nomor Telepon',  Icon: IconPhone },
    { label: 'Tanggal Lahir',  key: 'tanggalLahir',  type: 'date',  placeholder: 'Tanggal Lahir',  Icon: IconCalendar },
  ];

  if (isFetching) {
    return (
      <div className="subpage pi-loading-screen">
        <div className="pi-loading-spinner" />
        <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="subpage pi-page">


      <div className="subpage-header">
        <button
          className="subpage-back"
          onClick={() => isEdit ? handleCancel() : onNavigate('profile')}
        >
          <IconBack />
        </button>
        <span className="subpage-title">Informasi Pribadi</span>
        <button
          className="subpage-edit-btn"
          onClick={isEdit ? handleSave : handleEdit}
          disabled={isLoading}
        >
          <span className="edit-label">
            {isLoading
              ? <div className="pi-btn-spinner" />
              : isEdit
                ? <><IconCheck /> Simpan</>
                : <><IconEdit /> Edit</>
            }
          </span>
        </button>
      </div>


      {saveSuccess && (
        <div className="pi-banner pi-banner-success">
          <IconSuccess /> Data berhasil disimpan!
        </div>
      )}
      {error && (
        <div className="pi-banner pi-banner-error">
          <IconWarning /> {error}
        </div>
      )}


      <div className="pi-avatar-section">
        <div className="pi-avatar-wrap" onClick={handlePhotoClick}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="pi-avatar-img" />
          ) : (
            <div className="pi-avatar-placeholder">{avatarInitial}</div>
          )}
          <div className={`pi-avatar-overlay ${isUploadingPhoto ? 'uploading' : ''}`}>
            {isUploadingPhoto
              ? <div className="pi-upload-spinner" />
              : <>
                  <IconCamera />
                  <span>Ganti Foto</span>
                </>
            }
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />

        <p className="pi-avatar-name">{form.namaLengkap || 'Nama Lengkap'}</p>
        <p className="pi-avatar-email">{form.email}</p>
      </div>


      <div className="pi-form">


        <div className="pi-section-label">Identitas</div>
        <div className="pi-card">
          {identityFields.map(({ label, key, type, placeholder, Icon }) => (
            <div className="pi-field" key={key}>
              <label className="pi-field-label">{label}</label>
              <div className="pi-input-wrap">
                <span className="pi-input-icon"><Icon /></span>
                <input
                  className="pi-input"
                  type={type}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  disabled={!isEdit}
                  placeholder={placeholder}
                />
              </div>
            </div>
          ))}


          <div className="pi-field">
            <label className="pi-field-label">Jenis Kelamin</label>
            <div className="pi-input-wrap">
              <span className="pi-input-icon"><IconGender /></span>
              {isEdit ? (
                <select
                  className="pi-input"
                  value={form.gender}
                  onChange={(e) => setField('gender', e.target.value)}
                >
                  <option value="">-- Pilih --</option>
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </select>
              ) : (
                <input
                  className="pi-input"
                  value={form.gender
                    ? (form.gender === 'laki-laki' ? 'Laki-laki' : 'Perempuan')
                    : '-'}
                  disabled
                />
              )}
            </div>
          </div>
        </div>


        <div className="pi-section-label">Data Fisik</div>
        <div className="pi-card">
          <div className="pi-row">
            <div className="pi-field" style={{ flex: 1 }}>
              <label className="pi-field-label">Berat (kg)</label>
              <div className="pi-input-wrap">
                <span className="pi-input-icon"><IconWeight /></span>
                <input
                  className="pi-input"
                  type="number"
                  value={form.beratKg}
                  onChange={(e) => setField('beratKg', e.target.value)}
                  disabled={!isEdit}
                  placeholder="kg"
                  min="0" max="300"
                />
              </div>
            </div>
            <div className="pi-field" style={{ flex: 1 }}>
              <label className="pi-field-label">Tinggi (cm)</label>
              <div className="pi-input-wrap">
                <span className="pi-input-icon"><IconHeight /></span>
                <input
                  className="pi-input"
                  type="number"
                  value={form.tinggiCm}
                  onChange={(e) => setField('tinggiCm', e.target.value)}
                  disabled={!isEdit}
                  placeholder="cm"
                  min="0" max="300"
                />
              </div>
            </div>
          </div>


          {bmi && (() => {
            const info = getBmiInfo(bmi);
            return (
              <div className="pi-bmi-card" style={{ background: info.bg }}>
                <div className="pi-bmi-left">
                  <p className="pi-bmi-title">Body Mass Index</p>
                  <p className="pi-bmi-value" style={{ color: info.color }}>{bmi}</p>
                  <span className="pi-bmi-badge" style={{ background: info.color }}>
                    {info.label}
                  </span>
                </div>
                <div className="pi-bmi-right">
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#e8e8e8" strokeWidth="6"/>
                    <circle
                      cx="32" cy="32" r="26"
                      fill="none"
                      stroke={info.color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - Math.min(parseFloat(bmi) / 40, 1))}`}
                      transform="rotate(-90 32 32)"
                    />
                    <text x="32" y="32" textAnchor="middle" dominantBaseline="middle"
                      fontSize="12" fontWeight="800" fill={info.color}>
                      {bmi}
                    </text>
                  </svg>
                </div>
              </div>
            );
          })()}
        </div>


        {isEdit && (
          <div className="pi-footer">
            <button className="pi-btn-save" onClick={handleSave} disabled={isLoading}>
              {isLoading
                ? <span className="pi-btn-loading"><div className="pi-btn-spinner-white" /> Menyimpan...</span>
                : 'Simpan Perubahan'
              }
            </button>
            <button className="pi-btn-cancel" onClick={handleCancel}>
              Batalkan
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default PersonalInfoPage;