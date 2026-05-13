import React, { useState } from 'react';
import { supabase } from '../supabase';
import iwhLogo from '../assets/logo_iwh.png';
import sentemail from '../assets/sentemail.png';
import '../styles/AuthPage.css';

const Spinner = () => (
  <svg className="auth-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
  </svg>
);

const ForgotPasswordPage = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) { setError('Masukkan alamat email kamu'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Format email tidak valid'); return; }

    setIsLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    setIsLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-header">
          <div />
          <img src={iwhLogo} alt="IPB Wellness Hub" className="auth-logo-iwh" />
        </div>
        <div className="auth-body sent-body">
          <div className="sent-icon">
            <img src={sentemail} alt="Email Sent" className="sent" />
          </div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>Email Terkirim!</h1>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>
            Kami mengirim link reset password ke <strong>{email}</strong>.
            Cek inbox atau folder spam kamu.
          </p>
          <button className="btn-primary" onClick={() => onNavigate('login')}>
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-header">
        <button className="auth-back-btn" onClick={() => onNavigate('login')} aria-label="Kembali ke login">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Kembali ke Login
        </button>
        <img src={iwhLogo} alt="IPB Wellness Hub" className="auth-logo-iwh" />
      </div>

      <div className="auth-body">
        <div className="auth-heading-group">
          <h1 className="auth-title">Lupa Password?</h1>
          <p className="auth-subtitle">
            Masukkan email yang terdaftar. Kami akan mengirimkan link untuk reset password kamu.
          </p>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <div className="auth-fields">
          <input
            className="auth-input"
            type="email"
            placeholder="Email kamu"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <button className="btn-primary" onClick={handleSend} disabled={isLoading}>
          {isLoading ? <><Spinner /> Mengirim...</> : 'Kirim Link Reset'}
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;