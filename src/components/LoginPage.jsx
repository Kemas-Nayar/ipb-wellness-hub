import React, { useState } from 'react';
import { supabase } from '../supabase';
import iwhLogo from '../assets/logo_iwh.png';
import '../styles/AuthPage.css';

const LoginPage = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Email atau password salah');
    else onNavigate('home');
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError('Login Google gagal');
  };

  return (
    <div className="auth-page">
      <div className="auth-logos">
        <img src={iwhLogo} alt="IPB Wellness Hub" className="auth-logo-iwh" />
      </div>

      <div className="auth-body">
        <h1 className="auth-title">Welcome back,</h1>
        <p className="auth-subtitle">We happy to see you here again. Please enter your email address and password</p>

        {error && <p className="auth-error">{error}</p>}

        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn-yellow-full" onClick={handleLogin}>Log In</button>

        <p className="auth-forgot" onClick={() => onNavigate('forgot')}>Forgot Password?</p>

        <div className="auth-divider"><span>or</span></div>

        <button className="btn-red-full" onClick={() => onNavigate('signup')}>Create an Account</button>
      </div>
    </div>
  );
};

export default LoginPage;