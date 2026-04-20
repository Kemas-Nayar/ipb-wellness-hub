import React, { useState } from 'react';
import { supabase } from '../supabase';
import iwhLogo from '../assets/logo_iwh.png';
import '../styles/AuthPage.css';

const ForgotPasswordPage = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setSent(true);
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-logos">
          <img src={iwhLogo} alt="IPB Wellness Hub" className="auth-logo-iwh" />
        </div>
        <div className="auth-body sent-body">
          <h1 className="auth-title" style={{ textAlign: 'center' }}>Email has sent!</h1>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>Kindly check it in a few minutes!</p>
          <div className="sent-icon">✉️</div>
          <button className="btn-yellow-full" onClick={() => onNavigate('login')}>Okay!</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-logos">
        <img src={iwhLogo} alt="IPB Wellness Hub" className="auth-logo-iwh" />
      </div>

      <div className="auth-body">
        <p className="auth-back" onClick={() => onNavigate('login')}>← Back to Login</p>

        <h1 className="auth-title">Forgot Password?</h1>
        <p className="auth-subtitle">Don't worry, we'll help you reset it. Enter your email address and we'll send you a reset link</p>

        {error && <p className="auth-error">{error}</p>}

        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className="btn-yellow-full" onClick={handleSend}>Send Reset Link</button>

        <p className="auth-link" style={{ textAlign: 'center', marginTop: '16px' }}
          onClick={() => onNavigate('login')}>Back to Login</p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;