import React, { useState } from 'react';
import { supabase } from '../supabase';
import '../styles/SubPage.css';

const LogoutPage = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    onNavigate('landing');
  };

  return (
    <div className="subpage logout-page">
      <div className="subpage-header">
        <button className="subpage-back" onClick={() => onNavigate('profile')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="subpage-title">Keluar Akun</span>
        <div style={{ width: 60 }} />
      </div>

      <div className="logout-body">
        <div className="logout-icon">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#f06b6b" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="logout-title">Keluar dari Akun?</h2>
        <p className="logout-desc">Apakah anda yakin ingin keluar dari akun ini?</p>

        <button className="btn-logout-red" onClick={handleLogout} disabled={loading}>
          {loading ? 'Keluar...' : 'Keluar'}
        </button>
        <button className="btn-logout-cancel" onClick={() => onNavigate('profile')} disabled={loading}>
          Batal
        </button>
      </div>
    </div>
  );
};

export default LogoutPage;