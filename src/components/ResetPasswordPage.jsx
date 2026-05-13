import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import iwhLogo from '../assets/logo_iwh.png';
import '../styles/AuthPage.css';

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

const Spinner = () => (
  <svg className="auth-spinner" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
  </svg>
);

const ResetPasswordPage = ({ onNavigate }) => {
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const validate = () => {
    if (!password)           return 'Masukkan password baru kamu';
    if (password.length < 6) return 'Password minimal 6 karakter';
    if (!confirm)            return 'Konfirmasi password kamu';
    if (password !== confirm) return 'Password tidak sama';
    return null;
  };

  const handleReset = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (!mountedRef.current) return;

      if (updateError) {
        const msg = updateError.message.toLowerCase();
        if (msg.includes('same password') || msg.includes('different')) {
          setError('Password baru harus berbeda dari password lama.');
        } else if (msg.includes('expired') || msg.includes('invalid')) {
          setError('Link reset sudah kedaluwarsa. Minta reset password baru.');
        } else {
          setError('Gagal reset password: ' + updateError.message);
        }
        return;
      }

      setSuccess(true);


      const timer = setTimeout(async () => {
        if (!mountedRef.current) return;
        await supabase.auth.signOut();
        if (mountedRef.current) onNavigate('login');
      }, 2500);

      return () => clearTimeout(timer);

    } catch (err) {
      console.error('[ResetPassword] Unexpected error:', err);
      if (mountedRef.current) {
        setError('Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-header">
          <div/>
          <img src={iwhLogo} alt="IPB Wellness Hub" className="auth-logo-iwh"/>
        </div>
        <div className="auth-body sent-body">
          <div className="reset-success-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none"
              stroke="#27AE60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>
            Password Berhasil Diubah!
          </h1>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>
            Password kamu telah diperbarui. Mengarahkan ke halaman login...
          </p>
          <button className="btn-primary" onClick={async () => {
            await supabase.auth.signOut();
            onNavigate('login');
          }}>
            Login Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-header">
        <div/>
        <img src={iwhLogo} alt="IPB Wellness Hub" className="auth-logo-iwh"/>
      </div>
      <div className="auth-body">
        <div className="auth-heading-group">
          <h1 className="auth-title">Buat Password Baru</h1>
          <p className="auth-subtitle">
            Masukkan password baru kamu. Minimal 6 karakter.
          </p>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <div className="auth-fields">
          <div className="auth-password-wrapper">
            <input
              className="auth-input"
              type={showPass ? 'text' : 'password'}
              placeholder="Password baru (min. 6 karakter)"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              disabled={isLoading}
              autoComplete="new-password"
              autoFocus
            />
            <button type="button" className="auth-eye-btn"
              onClick={() => setShowPass(p => !p)}>
              <EyeIcon open={showPass}/>
            </button>
          </div>
          <div className="auth-password-wrapper">
            <input
              className="auth-input"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Konfirmasi password baru"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleReset()}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn"
              onClick={() => setShowConfirm(p => !p)}>
              <EyeIcon open={showConfirm}/>
            </button>
          </div>
        </div>

        <button className="btn-primary" onClick={handleReset} disabled={isLoading}>
          {isLoading ? <><Spinner/> Menyimpan...</> : 'Simpan Password Baru'}
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;