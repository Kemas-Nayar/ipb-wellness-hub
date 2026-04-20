import React from 'react';
import '../styles/LandingPage.css';
import iwhLogo from '../assets/logo_iwh.png';
import headerImg from '../assets/header.png';
import iconAI from '../assets/icon_ai.png';
import iconTraining from '../assets/icon_training.png';
import iconProgress from '../assets/icon_progress.png';
import iconGizi from '../assets/icon_gizi.png';
import iconKonsultasi from '../assets/icon_konsultasi.png';
import iconMonitoring from '../assets/icon_monitoring.png';

const LandingPage = ({ onNavigate }) => {
  return (
    <div className="landing-page">

      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-logos">
          <img src={iwhLogo} className="logo iwh-logo" alt="IPB Wellness Hub" />
        </div>
        <button className="navbar-register-btn" onClick={() => onNavigate('signup')}>Daftar</button>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-wrapper">
          <img src={headerImg} className="hero-image" alt="Hero" />
          <div className="hero-text">
            <h1 className="hero-title">
              Be Healthy,<br />
              Get Wealthy with<br />
              IPB Wellness Hub
            </h1>
            <p className="hero-desc">
              Program latihan dan gizi<br />
              terintegrasi dengan Artificial<br />
              Intelligence (AI) dan teknologi
            </p>
            </div>
          <div className="hero-buttons-wrapper">
            <div className="hero-buttons">
              <button className="btn-mulai" onClick={() => onNavigate('signup')}>Mulai Sekarang</button>
              <button className="btn-masuk" onClick={() => onNavigate('login')}>Masuk Akun</button>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="hero-badges">
          <div className="badge-item">
            <img src={iconAI} className="badge-icon" alt="AI" />
            <span>Program berbasis<br />Artificial Intelligence</span>
          </div>
          <div className="badge-divider" />
          <div className="badge-item">
            <img src={iconTraining} className="badge-icon" alt="Training" />
            <span>Personal<br />Training</span>
          </div>
          <div className="badge-divider" />
          <div className="badge-item">
            <img src={iconProgress} className="badge-icon" alt="Progress" />
            <span>Progress<br />Tracking</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="features-title">Fitur Utama Nutrigym IPB</h2>
        <p className="features-subtitle">
          Fasilitas kebugaran terintergrasi dengan ilmu gizi<br />
          untuk membantumu mencapai gaya hidup sehat
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <img src={iconGizi} className="feature-icon" alt="Tracking Gizi" />
            <p className="feature-name">Tracking Gizi</p>
            <p className="feature-desc">Pantau kalori &amp; nutrisi harian</p>
          </div>
          <div className="feature-card">
            <img src={iconKonsultasi} className="feature-icon" alt="Konsultasi Kesehatan" />
            <p className="feature-name">Konsultasi Kesehatan</p>
            <p className="feature-desc">Rekomendasi latihan via AI</p>
          </div>
          <div className="feature-card">
            <img src={iconMonitoring} className="feature-icon" alt="Monitoring Progress" />
            <p className="feature-name">Monitoring Progress</p>
            <p className="feature-desc">Dashboard perkembangan real-time</p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps-section">
        <h2 className="steps-title">Cara Mulai di IPB Wellness Hub</h2>
        <div className="steps-list">
          {[
            { num: 1, label: 'Buat Akun' },
            { num: 2, label: 'Isi data diri & tubuh' },
            { num: 3, label: 'Dapatkan program personal' },
            { num: 4, label: 'Lakukan konsultasi' },
            { num: 5, label: 'Pantau Progress' },
          ].map((step, index, arr) => (
            <div key={step.num} className="step-item">
              <div className="step-connector">
                <div className="step-number">{step.num}</div>
                {index < arr.length - 1 && <div className="step-line" />}
              </div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-section-title">Tentang Kami</p>
        <p className="footer-text">
          NutriGym IPB (Gym Gizi IPB University) adalah fasilitas
          kebugaran yang awalnya merupakan laboratorium olahraga
          yang mulai dibuka untuk umum pada tahun 2024.
        </p>
        <p className="footer-section-title">Alamat</p>
        <p className="footer-text">
          Jl. Raya Darmaga, Kampus IPB Dramaga, Kabupaten Bogor, Jawa Barat.
        </p>
        <p className="footer-section-title">Kontak</p>
        <p className="footer-text">Email: gymgizi@gmail.com</p>
        <p className="footer-text">Instagram: @nutrigymipb</p>
        <p className="footer-text">Tiktok: @nutrigymipb</p>
        <div className="footer-copyright">
          © 2025 NutriGym Gizi – IPB University. Hak cipta dilindungi.
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;