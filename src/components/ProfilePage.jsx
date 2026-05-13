import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import '../styles/ProfilePage.css';

const IcUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const IcHelp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IcSwitch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <path d="M7 23l-4-4 4-4"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);
const IcLogout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcChevron = ({ color = '#C0C0C0' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5l7 7-7 7"/>
  </svg>
);
const IcBack = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const IcEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const MENU_ITEMS = [
  { Icon: IcUser,     label: 'Informasi Pribadi', page: 'personal-info', color: '#4F46E5' },
  { Icon: IcCalendar, label: 'Riwayat Reservasi', page: 'riwayat-reservasi', color: '#0891B2' },
  { Icon: IcHelp,     label: 'FAQ & Help Center', page: 'faq', color: '#D97706' },
  { Icon: IcSettings, label: 'Pengaturan',         page: 'pengaturan', color: '#6B7280' },
];

const ProfilePage = ({ onNavigate, user }) => {
  const [profile,    setProfile]    = useState(null);
  const [avatarUrl,  setAvatarUrl]  = useState(null);
  const [uploading,  setUploading]  = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('nama_lengkap, email, avatar_url')
        .eq('id', user.id)
        .single();
      if (data) {
        setProfile(data);
        if (data.avatar_url) {
          if (data.avatar_url.startsWith('http')) {
            setAvatarUrl(data.avatar_url);
          } else {
            // Get public URL dari Supabase Storage
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(data.avatar_url);
            setAvatarUrl(urlData?.publicUrl || null);
          }
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validasi ukuran & tipe
    if (file.size > 2 * 1024 * 1024) { alert('Ukuran foto maksimal 2MB'); return; }
    if (!file.type.startsWith('image/')) { alert('File harus berupa gambar'); return; }

    setUploading(true);
    try {
      const ext      = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload ke Supabase Storage bucket 'avatars'
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (upErr) throw upErr;

      // Dapatkan public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl + '?t=' + Date.now();

      // Simpan path ke tabel profiles
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      // Tampilkan preview langsung
      setAvatarUrl(publicUrl);
    } catch (err) {
      alert('Gagal upload foto: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const userName     = profile?.nama_lengkap || user?.email?.split('@')[0] || 'User';
  const userEmail    = profile?.email || user?.email || '';
  const avatarInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="pp-page">

      {/* Header */}
      <div className="pp-header">
        <button className="pp-back-btn" onClick={() => onNavigate('home')}>
          <IcBack />
        </button>
        <span className="pp-header-title">Profile</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Profile Card */}
      <div className="pp-card">
        {/* Banner abu-abu subtle */}
        <div className="pp-banner" />

        <div className="pp-info-row">
          {/* Avatar dengan upload */}
          <div className="pp-avatar-wrap">
            <label className="pp-avatar-label" title={uploading ? 'Mengupload...' : 'Ganti foto'}>
              <input
                type="file"
                accept="image/*"
                className="pp-avatar-input"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="pp-avatar-img" />
              ) : (
                <div className="pp-avatar-initial">{avatarInitial}</div>
              )}
              {!uploading && (
                <div className="pp-avatar-edit-badge">
                  <IcEdit />
                </div>
              )}
              {uploading && <div className="pp-avatar-loading" />}
            </label>
          </div>

          <div className="pp-name-wrap">
            <p className="pp-name">{userName}</p>
            <p className="pp-email">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Setting Menu */}
      <p className="pp-section-label">Setting</p>
      <div className="pp-menu-group">
        {MENU_ITEMS.map(({ Icon, label, page, color }, i) => (
          <button key={i} className="pp-menu-item" onClick={() => onNavigate(page)}>
            <div className="pp-menu-icon-wrap" style={{ background: color + '18' }}>
              <span style={{ color }}><Icon /></span>
            </div>
            <span className="pp-menu-label">{label}</span>
            <IcChevron />
          </button>
        ))}
      </div>

      {/* Ganti Akun */}
      <div className="pp-menu-group">
        <button className="pp-menu-item" onClick={() => onNavigate('ganti-akun')}>
          <div className="pp-menu-icon-wrap" style={{ background: '#0891B218' }}>
            <span style={{ color: '#0891B2' }}><IcSwitch /></span>
          </div>
          <span className="pp-menu-label">Ganti Akun</span>
          <IcChevron />
        </button>
      </div>

      {/* Logout */}
      <div className="pp-menu-group">
        <button className="pp-menu-item pp-menu-item--danger" onClick={() => onNavigate('logout')}>
          <div className="pp-menu-icon-wrap" style={{ background: '#C8102E18' }}>
            <span style={{ color: '#C8102E' }}><IcLogout /></span>
          </div>
          <span className="pp-menu-label pp-menu-label--danger">Keluar dari akun</span>
          <IcChevron color="#C8102E" />
        </button>
      </div>

    </div>
  );
};

export default ProfilePage;