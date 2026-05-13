import React, { useState, useEffect } from 'react';
import '../styles/GantiAkunPage.css';

const STORAGE_KEY = 'saved_accounts';
const ACTIVE_KEY  = 'active_uid';

const loadSavedAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const saveAccountsToStorage = (accounts) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

const GantiAkunPage = ({
  onNavigate,
  user,
  profile,
  onSwitchAccount,  
  onRemoveAccount,
}) => {
  const [accounts,    setAccounts]    = useState([]);
  const [activeUid,   setActiveUid]   = useState(null);
  const [removingUid, setRemovingUid] = useState(null);
  const [switching,   setSwitching]   = useState(null); // uid yang sedang diproses

    useEffect(() => {
    const currentUid   = user?.uid || user?.id || 'current';
    const currentName  = profile?.nama_lengkap || user?.email?.split('@')[0] || 'User';
    const currentEmail = profile?.email || user?.email || '';
    const currentPhoto = profile?.foto_url || null;

    // Baca token Supabase aktif dari localStorage
    const supabaseSession = (() => {
      try {
        const key = Object.keys(localStorage).find(
          k => k.startsWith('sb-') && k.endsWith('-auth-token')
        );
        if (!key) return null;
        return JSON.parse(localStorage.getItem(key));
      } catch { return null; }
    })();

    const stored = loadSavedAccounts();
    const alreadyStored = stored.find(a => a.uid === currentUid);

    if (!alreadyStored) {
      const updated = [
        {
          uid:           currentUid,
          nama:          currentName,
          email:         currentEmail,
          foto:          currentPhoto,
          access_token:  supabaseSession?.access_token  || null,
          refresh_token: supabaseSession?.refresh_token || null,
        },
        ...stored,
      ];
      saveAccountsToStorage(updated);
      setAccounts(updated);
    } else {
      // Selalu update token akun aktif supaya selalu fresh
      const updated = stored.map(a =>
        a.uid === currentUid
          ? {
              ...a,
              access_token:  supabaseSession?.access_token  || a.access_token,
              refresh_token: supabaseSession?.refresh_token || a.refresh_token,
            }
          : a
      );
      saveAccountsToStorage(updated);
      setAccounts(updated);
    }

    const storedActive = localStorage.getItem(ACTIVE_KEY) || currentUid;
    setActiveUid(storedActive);
  }, [user, profile]);

    const handleSwitch = (account) => {
    if (account.uid === activeUid || switching) return;

    if (!account.access_token || !account.refresh_token) {
      // Token tidak ada → harus login ulang
      onNavigate('login');
      return;
    }

    setSwitching(account.uid);
    localStorage.setItem(ACTIVE_KEY, account.uid);
    setActiveUid(account.uid);
    // App.jsx yang lakukan setSession + fetchProfile + navigate
    onSwitchAccount?.(account);
  };

    const handleRemove = (e, uid) => {
    e.stopPropagation();
    if (uid === activeUid) return;

    setRemovingUid(uid);
    setTimeout(() => {
      const updated = accounts.filter(a => a.uid !== uid);
      saveAccountsToStorage(updated);
      setAccounts(updated);
      setRemovingUid(null);
      onRemoveAccount?.(uid);
    }, 280);
  };

    return (
    <div className="ga-page">

      {/* Header */}
      <div className="ga-header">
        <button className="ga-back" onClick={() => onNavigate('profile')} aria-label="Kembali">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="ga-title">Ganti Akun</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="ga-section-label">Akun Tersimpan</div>

      <div className="ga-card">
        {accounts.map((account, idx) => {
          const isActive    = account.uid === activeUid;
          const isRemoving  = account.uid === removingUid;
          const isSwitching = account.uid === switching;
          const hasToken    = !!(account.access_token && account.refresh_token);
          const initial     = account.nama?.charAt(0).toUpperCase() || '?';

          return (
            <React.Fragment key={account.uid}>
              {idx > 0 && <div className="ga-divider" />}

              <div
                className={[
                  'ga-account-item',
                  isActive    ? 'is-active'    : 'is-switchable',
                  isRemoving  ? 'is-removing'  : '',
                  isSwitching ? 'is-switching' : '',
                ].join(' ').trim()}
                onClick={() => handleSwitch(account)}
                role={isActive ? 'presentation' : 'button'}
                tabIndex={isActive ? -1 : 0}
                onKeyDown={e => e.key === 'Enter' && handleSwitch(account)}
                aria-label={isActive ? `Akun aktif: ${account.nama}` : `Pilih akun ${account.nama}`}
              >
                <div className={`ga-avatar ${isActive ? 'ga-avatar--active' : 'ga-avatar--idle'}`}>
                  {account.foto
                    ? <img src={account.foto} alt={account.nama} className="ga-avatar-img" />
                    : initial
                  }
                </div>

                <div className="ga-info">
                  <p className="ga-name">{account.nama}</p>
                  <p className="ga-email">{account.email}</p>
                  {!isActive && !hasToken && (
                    <p className="ga-relogin-hint">Login ulang diperlukan</p>
                  )}
                </div>

                {isActive ? (
                  <div className="ga-active-badge" aria-hidden>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Aktif</span>
                  </div>
                ) : isSwitching ? (
                  <div className="ga-spinner" aria-label="Memuat..." />
                ) : (
                  <div className="ga-item-actions">
                    <button
                      className="ga-remove-btn"
                      onClick={(e) => handleRemove(e, account.uid)}
                      aria-label={`Hapus akun ${account.nama}`}
                      title="Hapus dari daftar"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                    <svg className="ga-switch-arrow" width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        <div className="ga-divider" />
        <button className="ga-add-item" onClick={() => onNavigate('login')}>
          <div className="ga-add-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#C8102E" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <span className="ga-add-label">Tambahkan Akun</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#ccc" strokeWidth="2" strokeLinecap="round">
            <path d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <p className="ga-info-text">
        Akun tersimpan bisa langsung dipilih tanpa perlu login ulang.
        <br />Ketuk <strong>✕</strong> untuk menghapus akun dari daftar.
      </p>
    </div>
  );
};

export default GantiAkunPage;