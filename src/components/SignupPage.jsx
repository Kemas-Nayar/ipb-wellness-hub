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

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Spinner = () => (
  <svg className="auth-spinner" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
  </svg>
);

const CountdownRedirect = ({ onNavigate }) => {
  const [count, setCount]  = useState(3);
  const mountedRef         = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onNavigate('login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [onNavigate]);

  return <strong>{count} detik...</strong>;
};

const SignupPage = ({ onNavigate }) => {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

 const validate = () => {
  if (!email.trim())    return 'Masukkan alamat email kamu';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Format email tidak valid';

  const allowedDomains = ['gmail.com', 'apps.ipb.ac.id'];
  const emailDomain = email.trim().split('@')[1]?.toLowerCase();
  if (!allowedDomains.includes(emailDomain)) {
    return 'Email harus menggunakan akun Gmail atau email IPB (@apps.ipb.ac.id)';
  }

  if (!password)        return 'Masukkan password kamu';
  if (password.length < 8)  return 'Password minimal 8 karakter';
  if (password !== confirm) return 'Konfirmasi password tidak sama';
  return null;
};

  const handleSignup = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signupError) {
        const msg = signupError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists')) {
          setError('Email sudah terdaftar. Silakan login.');
        } else if (msg.includes('weak password') || msg.includes('password')) {
          setError('Password terlalu lemah. Gunakan kombinasi huruf dan angka.');
        } else if (msg.includes('network') || msg.includes('fetch')) {
          setError('Koneksi gagal. Periksa internet kamu.');
        } else {
          setError(signupError.message);
        }
        return;
      }


      if (data?.user?.identities?.length === 0) {
        setError('Email sudah terdaftar. Silakan login.');
        return;
      }


      setSuccess(true);

    } catch (err) {
      console.error('[Signup] Unexpected error:', err);
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        setError('Login Google gagal: ' + error.message);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[Signup] Google error:', err);
      setError('Terjadi kesalahan pada Google login.');
      setIsLoading(false);
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
          <div className="signup-success-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none"
              stroke="#27AE60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <h1 className="auth-title" style={{ textAlign: 'center' }}>
            Akun Berhasil Dibuat!
          </h1>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>
            Akun kamu dengan email <strong>{email}</strong> telah berhasil dibuat.
            Silakan login untuk melanjutkan.
          </p>
          <button className="btn-primary" onClick={() => onNavigate('login')}>
            Login Sekarang
          </button>
          <p className="auth-footer-text" style={{ textAlign: 'center', marginTop: 12 }}>
            Diarahkan otomatis dalam <CountdownRedirect onNavigate={onNavigate}/>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-header">
        <button
          className="auth-back-btn"
          onClick={() => !isLoading && onNavigate('landing')}
          aria-label="Kembali ke beranda"
          disabled={isLoading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Kembali
        </button>
        <img src={iwhLogo} alt="IPB Wellness Hub" className="auth-logo-iwh"/>
      </div>

      <div className="auth-body">
        <div className="auth-heading-group">
          <h1 className="auth-title">Buat Akun Baru</h1>
          <p className="auth-subtitle">
            Buat akunmu dan nikmati personalisasi fitur gym!
          </p>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <div className="auth-fields">
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
          />
          <div className="auth-password-wrapper">
            <input
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min. 6 karakter)"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn"
              onClick={() => setShowPassword(p => !p)}
              aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}>
              <EyeIcon open={showPassword}/>
            </button>
          </div>
          <div className="auth-password-wrapper">
            <input
              className="auth-input"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Konfirmasi Password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn"
              onClick={() => setShowConfirm(p => !p)}
              aria-label={showConfirm ? 'Sembunyikan' : 'Tampilkan'}>
              <EyeIcon open={showConfirm}/>
            </button>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSignup} disabled={isLoading}>
          {isLoading ? <><Spinner/> Memproses...</> : 'Buat Akun'}
        </button>

        <div className="auth-divider"><span>atau</span></div>

        <button className="btn-google" onClick={handleGoogle} disabled={isLoading}>
          <GoogleIcon/>
          Daftar dengan Google
        </button>

        <p className="auth-footer-text">
          Sudah punya akun?{' '}
          <span className="auth-link" onClick={() => !isLoading && onNavigate('login')}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;