import React, { useState } from 'react';
import '../styles/FAQPage.css';


const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5">
    <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
  </svg>
);

// 💡 Lightbulb — "Memulai"
const IconLightbulb = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21h6" />
    <path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V17a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-2.8C7.21 13.16 6 11.22 6 9a6 6 0 0 1 6-6z" />
  </svg>
);

// ✅ Check-circle — "Reservasi"
const IconCheckCircle = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);

// 👤 User — "Akun"
const IconUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
  </svg>
);

// 💬 Chat bubble — footer
const IconChat = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);


const FAQ_DATA = {
  1: [
    {
      q: 'Apa itu IPB Wellness Hub?',
      a: 'IPB Wellness Hub adalah fasilitas kebugaran terintegrasi milik IPB University yang menggabungkan program latihan, gizi, dan teknologi AI.',
    },
    {
      q: 'Bagaimana cara mendaftar?',
      a: 'Klik tombol "Daftar" di halaman utama, isi data email dan password, lalu lengkapi biodata kamu.',
    },
    {
      q: 'Apakah ada biaya pendaftaran?',
      a: 'Silakan hubungi admin kami di gymgizi@gmail.com atau Instagram @nutrigymipb untuk informasi biaya terkini.',
    },
  ],
  2: [
    {
      q: 'Bagaimana cara membuat reservasi gym?',
      a: 'Masuk ke menu "Gym Reservation", pilih tanggal dan sesi yang tersedia, lalu konfirmasi reservasi kamu.',
    },
    {
      q: 'Apakah reservasi bisa dibatalkan?',
      a: 'Untuk pembatalan reservasi, silakan hubungi admin kami minimal 1 jam sebelum jadwal.',
    },
    {
      q: 'Berapa kapasitas tiap sesi?',
      a: 'Kapasitas setiap sesi gym ditampilkan secara real-time saat kamu memilih jadwal.',
    },
  ],
  3: [
    {
      q: 'Bagaimana cara mengubah data pribadi?',
      a: 'Pergi ke Profile → Informasi Pribadi, lalu klik tombol Edit di pojok kanan atas.',
    },
    {
      q: 'Lupa password?',
      a: 'Klik "Forgot Password?" di halaman Login, masukkan email kamu, dan kami akan kirimkan link reset.',
    },
    {
      q: 'Bagaimana cara mengganti email?',
      a: 'Untuk mengganti email akun, silakan hubungi admin kami karena perubahan email memerlukan verifikasi.',
    },
  ],
};

const FAQ_CATEGORIES = [
  {
    id: 1,
    Icon: IconLightbulb,
    bgColor: '#FEF3C7',
    label: 'Memulai IPB Wellness Hub',
  },
  {
    id: 2,
    Icon: IconCheckCircle,
    bgColor: '#DBEAFE',
    label: 'Reservasi & Pembayaran',
  },
  {
    id: 3,
    Icon: IconUser,
    bgColor: '#FCE7E7',
    label: 'Akun & Pengaturan',
  },
];


const FAQPage = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);

  const filtered = FAQ_CATEGORIES.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCat = (id) => {
    setOpenCategory((prev) => (prev === id ? null : id));
    setOpenQuestion(null);
  };

  const toggleQ = (key) =>
    setOpenQuestion((prev) => (prev === key ? null : key));

  return (
    <div className="faq-page">

      {/* Header */}
      <div className="faq-header">
        <button className="faq-back-btn" onClick={() => onNavigate?.('profile')}>
          <IconBack />
        </button>
      </div>

      {/* Hero */}
      <div className="faq-hero">
        <p className="faq-hero-eyebrow">Bantuan</p>
        <h1 className="faq-hero-title">FAQ &amp; Help Center</h1>
        <p className="faq-hero-sub">
          Cari jawaban cepat atau pilih topik yang kamu butuhkan di bawah ini.
        </p>

        {/* Search */}
        <div className="faq-search-wrap">
          <IconSearch />
          <input
            className="faq-search-input"
            placeholder="Cari pertanyaan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpenCategory(null);
            }}
          />
          {search && (
            <button className="faq-search-clear" onClick={() => setSearch('')}>
              ×
            </button>
          )}
        </div>

        {/* Section label */}
        <p className="faq-section-label">Topik Bantuan</p>

        {/* Category list */}
        <div className="faq-cat-list">
          {filtered.length === 0 && (
            <p className="faq-empty">Tidak ada topik yang cocok.</p>
          )}

          {filtered.map((f) => {
            const isOpen = openCategory === f.id;
            return (
              <div key={f.id} className={`faq-cat-card${isOpen ? ' open' : ''}`}>

                {/* Category button */}
                <button className="faq-cat-btn" onClick={() => toggleCat(f.id)}>
                  <span
                    className="faq-cat-icon-wrap"
                    style={{ background: f.bgColor }}
                  >
                    <f.Icon />
                  </span>
                  <span className="faq-cat-label">{f.label}</span>
                  <svg
                    className={`faq-cat-chevron${isOpen ? ' open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>

                {/* Q&A accordion */}
                {isOpen && (
                  <div className="faq-qa-list">
                    {FAQ_DATA[f.id].map((item, idx) => {
                      const key = `${f.id}-${idx}`;
                      const qOpen = openQuestion === key;
                      return (
                        <div key={idx}>
                          {idx > 0 && <div className="faq-qa-divider" />}
                          <button className="faq-qa-btn" onClick={() => toggleQ(key)}>
                            <span className="faq-qa-q">{item.q}</span>
                            <span className={`faq-qa-icon${qOpen ? ' open' : ''}`}>
                              {qOpen ? '−' : '+'}
                            </span>
                          </button>
                          {qOpen && <p className="faq-qa-a">{item.a}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="faq-footer">
          <div className="faq-footer-card">
            <div className="faq-footer-icon">
              <IconChat />
            </div>
            <p className="faq-footer-title">Tidak menemukan jawaban?</p>
            <p className="faq-footer-desc">Tim kami siap membantu kamu setiap saat.</p>
            <a href="mailto:gymgizi@gmail.com" className="faq-footer-btn">
              Hubungi Kami
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FAQPage;