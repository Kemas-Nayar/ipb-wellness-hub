import React, { useEffect, useRef } from 'react';
import '../styles/LandingPage.css';
import iwhLogo      from '../assets/logo_iwh.png';
import headerImg    from '../assets/header.png';
import iconAI       from '../assets/icon_ai.png';
import iconTraining from '../assets/icon_training.png';
import iconProgress from '../assets/icon_progress.png';
import iconGizi        from '../assets/icon_gizi.png';
import iconKonsultasi  from '../assets/icon_konsultasi.png';
import iconMonitoring  from '../assets/icon_monitoring.png';

/*  Sub-components  */

const IcStar = ({ fill = '#E6A800', stroke = '#E6A800' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 2}}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

/*  Data  */

const BADGES = [
  { icon: iconAI,       label: 'AI-Based Program' },
  { icon: iconTraining, label: 'Personal Training' },
  { icon: iconProgress, label: 'Progress Tracking' },
];

const STATS = [
  { number: '200+', label: 'Member Aktif' },
  { number: <><span style={{marginRight: 4}}>4.9</span><IcStar fill="#E6A800" /></>, label: 'Rating Pengguna' },
  { number: '4 mgg',  label: 'Rata-rata Hasil' },
];

const FEATURES = [
  {
    icon: iconGizi,
    name: 'Tracking Gizi',
    desc: 'Pantau kalori & nutrisi harian secara otomatis',
  },
  {
    icon: iconKonsultasi,
    name: 'Konsultasi Kesehatan',
    desc: 'Rekomendasi program latihan via AI',
  },
  {
    icon: iconMonitoring,
    name: 'Monitoring Progress',
    desc: 'Dashboard perkembangan real-time',
  },
];

const STEPS = [
  { num: 1, label: 'Buat Akun' },
  { num: 2, label: 'Isi data diri & komposisi tubuh' },
  { num: 3, label: 'Dapatkan program personal' },
  { num: 4, label: 'Lakukan konsultasi dengan AI' },
  { num: 5, label: 'Pantau progress dan raih tujuanmu' },
];

const TESTIMONIALS = [
  {
    name: 'Anisa Nur Rohmah',
    role: 'Mahasiswa IPB',
    text: 'Dalam 3 bulan berat badan turun 8 kg. Program AI-nya benar-benar personal!',
    stars: 5,
  },
  {
    name: 'Lazarus Prima',
    role: 'Dosen IPB',
    text: 'Konsultasi gizi via AI sangat membantu pola makan saya jadi lebih sehat.',
    stars: 5,
  },
  {
    name: 'Isyana Ajeng',
    role: 'Staff IPB',
    text: 'Progress tracking-nya mudah dipakai dan motivasi saya naik setiap hari.',
    stars: 5,
  },
];

const FAQ = [
  {
    q: 'Apakah pendaftaran gratis?',
    a: 'Ya, pendaftaran dan seluruh akses fitur IPB Wellness Hub sepenuhnya gratis tanpa biaya berlangganan.',
  },
  {
    q: 'Apakah harus sivitas IPB untuk mendaftar?',
    a: 'Tidak. NutriGym IPB terbuka untuk umum, baik sivitas akademika IPB maupun masyarakat sekitar Bogor.',
  },
  {
    q: 'Bagaimana cara kerja konsultasi AI?',
    a: 'AI kami menganalisis data tubuh, aktivitas, dan tujuanmu untuk memberikan rekomendasi latihan dan gizi yang dipersonalisasi.',
  },
  {
    q: 'Berapa lama biasanya melihat hasil?',
    a: 'Rata-rata anggota mulai melihat perubahan nyata dalam 4–6 minggu dengan mengikuti program secara konsisten.',
  },
];

const StarRating = ({ count }) => (
  <span className="lp-stars" aria-label={`${count} dari 5 bintang`} style={{ display: 'flex', alignItems: 'center' }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <IcStar key={i} fill={i < count ? '#E6A800' : 'none'} stroke={i < count ? '#E6A800' : '#ddd'} />
    ))}
  </span>
);

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={`lp-faq-item${open ? ' lp-faq-item--open' : ''}`}>
      <button
        type="button"
        className="lp-faq-q"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {q}
        <span className="lp-faq-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="lp-faq-a">{a}</p>}
    </div>
  );
};

/* Main Component  */

const LandingPage = ({ onNavigate }) => {
  const observerRef = useRef(null);
  const navbarRef   = useRef(null);

  /* Scroll-reveal */
  useEffect(() => {
    const targets = document.querySelectorAll('.lp-animate');
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-visible');
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
    );
    targets.forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  /* Navbar shadow */
  useEffect(() => {
    const navbar = navbarRef.current;
    if (!navbar) return;
    const handleScroll = () =>
      navbar.classList.toggle('lp-navbar--scrolled', window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /*  Render  */
  return (
    <div className="lp-page">

      {/* Skip link for keyboard users */}
      <a href="#main-content" className="lp-skip-link">
        Lewati ke konten utama
      </a>

      {/* NAVBAR  */}
      <header ref={navbarRef} className="lp-navbar" role="banner">
        <img
          src={iwhLogo}
          className="lp-navbar-logo"
          alt="IPB Wellness Hub"
          width="120"
          height="34"
        />

        <nav className="lp-navbar-links" aria-label="Navigasi utama">
          <a href="#fitur"   className="lp-navbar-link">Fitur</a>
          <a href="#langkah" className="lp-navbar-link">Cara Mulai</a>
          <a href="#faq"     className="lp-navbar-link">FAQ</a>
        </nav>

        <div className="lp-navbar-actions">
          <button
            type="button"
            className="lp-btn-ghost"
            onClick={() => onNavigate('login')}
          >
            Masuk
          </button>
          <button
            type="button"
            className="lp-navbar-cta"
            onClick={() => onNavigate('signup')}
          >
            Daftar Gratis
          </button>
        </div>
      </header>

      {/*HERO  */}
      <main id="main-content">
        <section className="lp-hero" aria-labelledby="hero-title">

          <div className="lp-hero-bg" role="img" aria-label="Atlet berlari di gym">
            <img
              src={headerImg}
              className="lp-hero-img"
              alt=""
              aria-hidden="true"
              width="1200"
              height="900"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="lp-hero-scrim" aria-hidden="true" />
            <div className="lp-hero-accent" aria-hidden="true" />
          </div>

          <div className="lp-hero-content">
            <span className="lp-hero-eyebrow">
              <span className="lp-hero-eyebrow-dot" aria-hidden="true" />
              IPB University · Bogor
            </span>

            <h1 id="hero-title" className="lp-hero-title">
              Wujudkan Target<br />
              Kebugaranmu dengan <br />
              <span className="lp-hero-title-accent">Panduan AI Personal</span>
            </h1>

            <p className="lp-hero-desc">
              Mulai dari tracking gizi hingga program latihan spesifik.
              IPB Wellness Hub merancang pola hidup sehat yang disesuaikan secara presisi dengan tubuh Anda.
            </p>

            <div className="lp-hero-actions">
              <button
                type="button"
                className="lp-btn-primary"
                onClick={() => onNavigate('signup')}
              >
                Mulai Sekarang
              </button>
              <button
                type="button"
                className="lp-btn-outline"
                onClick={() => onNavigate('login')}
              >
                Masuk Akun
              </button>
            </div>
          </div>

          {/* Feature badges strip */}
          <div className="lp-badges" role="list" aria-label="Fitur unggulan">
            {BADGES.map((badge, i) => (
              <React.Fragment key={badge.label}>
                {i > 0 && <div className="lp-badge-divider" aria-hidden="true" />}
                <div className="lp-badge" role="listitem">
                  <img
                    src={badge.icon}
                    className="lp-badge-icon"
                    alt=""
                    aria-hidden="true"
                    width="28"
                    height="28"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className="lp-badge-text">{badge.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* STATS  */}
        <section className="lp-stats" aria-label="Statistik IPB Wellness Hub">
          <div className="lp-stats-grid lp-animate">
            {STATS.map((stat) => (
              <div key={stat.label} className="lp-stat-item">
                <span className="lp-stat-number">{stat.number}</span>
                <span className="lp-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/*  FEATURES */}
        <section id="fitur" className="lp-features" aria-labelledby="features-heading">
          <div className="lp-section-header lp-animate">
            <span className="lp-section-tag" aria-hidden="true">Fitur Unggulan</span>
            <h2 id="features-heading" className="lp-section-title">
              Fitur Utama Nutrigym IPB
            </h2>
            <p className="lp-section-subtitle">
              Fasilitas kebugaran terintegrasi dengan ilmu gizi
              untuk membantumu mencapai gaya hidup sehat.
            </p>
          </div>

          <div className="lp-features-grid" role="list">
            {FEATURES.map((f, i) => (
              <article
                key={f.name}
                className="lp-feature-card lp-animate"
                style={{ '--delay': `${i * 80}ms` }}
                role="listitem"
                aria-label={f.name}
              >
                <div className="lp-feature-icon-wrap" aria-hidden="true">
                  <img
                    src={f.icon}
                    className="lp-feature-icon"
                    alt=""
                    width="22"
                    height="22"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <p className="lp-feature-name">{f.name}</p>
                <p className="lp-feature-desc">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS  */}
        <section className="lp-testimonials" aria-labelledby="testi-heading">
          <div className="lp-section-header lp-animate">
            <span className="lp-section-tag" aria-hidden="true">Testimoni</span>
            <h2 id="testi-heading" className="lp-section-title">
              Kata Mereka
            </h2>
          </div>

          <div className="lp-testi-grid" role="list">
            {TESTIMONIALS.map((t, i) => (
              <figure
                key={t.name}
                className="lp-testi-card lp-animate"
                style={{ '--delay': `${i * 80}ms` }}
                role="listitem"
              >
                <StarRating count={t.stars} />
                <blockquote className="lp-testi-text">"{t.text}"</blockquote>
                <figcaption className="lp-testi-author">
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/*STEPS  */}
        <section id="langkah" className="lp-steps" aria-labelledby="steps-heading">
          <div className="lp-section-header lp-animate">
            <span className="lp-section-tag" aria-hidden="true">Cara Mulai</span>
            <h2 id="steps-heading" className="lp-section-title">
              Mulai di IPB Wellness Hub
            </h2>
            <p className="lp-section-subtitle">
              Lima langkah mudah menuju tubuh lebih sehat dan hidup lebih berkualitas.
            </p>
          </div>

          <ol className="lp-steps-list" aria-label="Langkah-langkah memulai">
            {STEPS.map((step, index) => (
              <li
                key={step.num}
                className="lp-step lp-animate"
                style={{ '--delay': `${index * 60}ms` }}
              >
                <div className="lp-step-left" aria-hidden="true">
                  <div className="lp-step-num">{step.num}</div>
                  {index < STEPS.length - 1 && <div className="lp-step-line" />}
                </div>
                <div className="lp-step-body">
                  <div className="lp-step-label">{step.label}</div>
                </div>
              </li>
            ))}
          </ol>

          {/* Mid-page CTA */}
          <div
            className="lp-mid-cta lp-animate"
            role="complementary"
            aria-label="Ajakan daftar"
          >
            <div className="lp-mid-cta-group">
              <p className="lp-mid-cta-eyebrow">Bergabung sekarang</p>
              <p className="lp-mid-cta-text">
                Siap memulai<br />perjalananmu?
              </p>
              <p className="lp-mid-cta-sub">Pendaftaran gratis. Mulai kapan saja.</p>
            </div>
            <button
              type="button"
              className="lp-btn-primary"
              onClick={() => onNavigate('signup')}
            >
              Daftar Gratis →
            </button>
          </div>
        </section>

        {/*  FAQ */}
        <section id="faq" className="lp-faq" aria-labelledby="faq-heading">
          <div className="lp-section-header lp-animate">
            <span className="lp-section-tag" aria-hidden="true">FAQ</span>
            <h2 id="faq-heading" className="lp-section-title">
              Pertanyaan Umum
            </h2>
          </div>

          <div className="lp-faq-list lp-animate">
            {FAQ.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER*/}
      <footer className="lp-footer" role="contentinfo">
        <div className="lp-footer-grid">
          <div className="lp-footer-col">
            <p className="lp-footer-heading">Tentang Kami</p>
            <p className="lp-footer-text">
              NutriGym IPB adalah fasilitas kebugaran terintegrasi
              milik IPB University, dibuka untuk umum sejak 2024.
            </p>
          </div>
          <div className="lp-footer-col">
            <p className="lp-footer-heading">Alamat</p>
            <p className="lp-footer-text">
              Jl. Raya Dramaga, Kampus IPB Dramaga,<br />
              Kabupaten Bogor, Jawa Barat.
            </p>
          </div>
          <div className="lp-footer-col">
            <p className="lp-footer-heading">Kontak</p>
            <p className="lp-footer-text">
              <a href="mailto:nutrigym@apps.ipb.ac.id" className="lp-footer-link">
                nutrigym@apps.ipb.ac.id
              </a>
            </p>
            <p className="lp-footer-text">
              <a
                href="https://instagram.com/nutrigymipb"
                className="lp-footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram: @nutrigymipb
              </a>
            </p>
            <p className="lp-footer-text">
              <a
                href="https://tiktok.com/@nutrigymipb"
                className="lp-footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                TikTok: @nutrigymipb
              </a>
            </p>
          </div>
        </div>

        <div className="lp-footer-bottom">
          © 2025 NutriGym Gizi – IPB University. Hak cipta dilindungi.
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;