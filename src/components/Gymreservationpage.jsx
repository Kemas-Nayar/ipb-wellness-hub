import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import '../styles/GymReservationPage.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDay = (year, month) => new Date(year, month, 1).getDay();

const GymReservationPage = ({ onNavigate, user }) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  // State baru untuk Sesi dari database
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const prevDays = getDaysInMonth(year, month - 1);

  const formatDateLabel = (d) => {
    if (!d) return '';
    const date = new Date(year, month, d);
    const dayName = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][date.getDay()];
    return `${dayName}, ${d} ${MONTHS_ID[month]} ${year}`;
  };

  const toDateStr = (d) => `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  // Ambil sesi gym dari view "v_kuota_sesi" ketika tanggal dipilih
  useEffect(() => {
    if (!selectedDate) {
      setSessions([]);
      return;
    }

    const fetchSessions = async () => {
      setLoadingSessions(true);
      const targetDate = toDateStr(selectedDate);

      const { data, error } = await supabase
        .from('v_kuota_sesi')
        .select('*')
        .eq('tanggal', targetDate)
        .order('jam_mulai', { ascending: true });

      if (!error && data) {
        setSessions(data);
      }
      setLoadingSessions(false);
    };

    fetchSessions();
  }, [selectedDate, month, year]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDate(null); setSelectedSession(null); setErrorMessage('');
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDate(null); setSelectedSession(null); setErrorMessage('');
  };

  const handleReserve = async () => {
    if (!selectedDate || !selectedSession) return;
    setLoading(true);
    setErrorMessage('');

    try {
      // Sesuai skema: Insert ke tabel "reservasi" dengan pengguna_id dan sesi_id
      const { error: insertError } = await supabase.from('reservations') // Ganti menjadi 'reservasi' sesuai skema
        .insert({
          pengguna_id: user.id, // Pastikan user.id ini terdaftar di tabel pengguna
          sesi_id: selectedSession.sesi_id,
          status: 'menunggu' // Status awal sesuai schema
        });

      if (insertError) {
        // Menangkap error dari UNIQUE constraint (uq_reservasi_pengguna_sesi)
        if (insertError.code === '23505') {
          throw new Error('Kamu sudah mendaftar untuk sesi ini.');
        }
        throw insertError;
      }

      setShowConfirm(false); 
      setShowSuccess(true);

    } catch (err) {
      console.error("Error reservation:", err);
      setErrorMessage(err.message || 'Terjadi kesalahan sistem. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  // Layar Sukses
  if (showSuccess) {
    return (
      <div className="res-success-page">
        <div className="res-success-icon">
          <div className="res-confetti">🎊</div>
          <div className="res-check-circle">✓</div>
        </div>
        <h2 className="res-success-title">Reservasi Berhasil!</h2>
        <p className="res-success-desc">
          Sesi <strong>{selectedSession?.nama_sesi}</strong> pada <strong>{formatDateLabel(selectedDate)}</strong> menunggu konfirmasi admin.
        </p>
        <button className="res-btn-yellow" onClick={() => onNavigate('home')}>
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // Modal Konfirmasi
  if (showConfirm) {
    return (
      <div className="res-confirm-page">
        <div className="res-header">
          <button className="res-back-btn" onClick={() => {setShowConfirm(false); setErrorMessage('');}}>←</button>
          <span className="res-header-title">Kembali ke jadwal</span>
        </div>
        <div className="res-confirm-body">
          <div className="res-confirm-card">
            <div className="res-confirm-top">
              <span className="res-confirm-cal-icon">📅</span>
              <div>
                <h3 className="res-confirm-title">Konfirmasi<br />Reservasi</h3>
              </div>
            </div>

            {errorMessage && (
              <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '15px' }}>
                {errorMessage}
              </div>
            )}

            <p className="res-confirm-label">Anda akan reservasi pada:</p>
            <div className="res-confirm-date-row">
              <span className="res-confirm-cal-sm">🗓️</span>
              <div>
                <p className="res-confirm-date">{formatDateLabel(selectedDate)}</p>
                <p className="res-confirm-time">
                  {selectedSession?.jam_mulai.slice(0, 5)} - {selectedSession?.jam_selesai.slice(0, 5)}
                </p>
                <p style={{fontSize: '11px', color: '#666', margin: '2px 0 0 0'}}>
                  {selectedSession?.nama_sesi}
                </p>
              </div>
            </div>
            <div className="res-confirm-divider" />
            <div className="res-confirm-actions">
              <button className="res-btn-cancel" onClick={() => {setShowConfirm(false); setErrorMessage('');}}>Cancel</button>
              <button className="res-btn-confirm" onClick={handleReserve} disabled={loading}>
                {loading ? 'Memproses...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, curr: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, curr: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, curr: false });

  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isPast = (d) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="res-page">
      <div className="res-header">
        <button className="res-back-btn" onClick={() => onNavigate('home')}>←</button>
        <span className="res-header-title">Reservasi Gym</span>
      </div>

      <div className="res-body">
        <div className="res-calendar-card">
          <div className="res-cal-nav">
            <button className="res-cal-arrow" onClick={prevMonth}>‹</button>
            <span className="res-cal-month">{MONTHS[month]}</span>
            <span className="res-cal-year">∨ {year}</span>
            <button className="res-cal-arrow" onClick={nextMonth}>›</button>
          </div>

          <div className="res-cal-grid">
            {DAYS.map(d => (
              <div key={d} className="res-cal-dayname">{d}</div>
            ))}
            {cells.map((cell, i) => (
              <button
                key={i}
                className={`res-cal-day
                  ${!cell.curr ? 'res-cal-other' : ''}
                  ${cell.curr && isToday(cell.day) ? 'res-cal-today' : ''}
                  ${cell.curr && selectedDate === cell.day ? 'res-cal-selected' : ''}
                  ${cell.curr && isPast(cell.day) ? 'res-cal-past' : ''}
                `}
                onClick={() => {
                  if (cell.curr && !isPast(cell.day)) {
                    setSelectedDate(cell.day);
                    setSelectedSession(null);
                    setErrorMessage('');
                  }
                }}
                disabled={!cell.curr || isPast(cell.day)}
              >
                {cell.day}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Slot List from Database */}
        <div className="res-slots-card" style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!selectedDate ? (
            <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', margin: 'auto' }}>
              Pilih tanggal pada kalender terlebih dahulu
            </p>
          ) : loadingSessions ? (
            <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', margin: 'auto' }}>
              Memuat jadwal sesi...
            </p>
          ) : sessions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', margin: 'auto' }}>
              Tidak ada jadwal Gym pada tanggal ini.
            </p>
          ) : (
            sessions.map((sesi) => (
              <button
                key={sesi.sesi_id}
                className={`res-slot-btn ${selectedSession?.sesi_id === sesi.sesi_id ? 'res-slot-selected' : ''}`}
                style={{ opacity: sesi.penuh ? 0.5 : 1, display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}
                onClick={() => { setSelectedSession(sesi); setErrorMessage(''); }}
                disabled={sesi.penuh}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>{sesi.jam_mulai.slice(0, 5)} - {sesi.jam_selesai.slice(0, 5)}</div>
                  <div style={{ fontSize: '10px', color: selectedSession?.sesi_id === sesi.sesi_id ? '#fff' : '#666' }}>
                    {sesi.nama_sesi}
                  </div>
                </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {sesi.penuh ? (
                <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '12px' }}>KOUTA PENUH</span>
              ) : (
                <>
                  {/* Menampilkan jumlah terisi / kapasitas maksimal */}
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>
                    👤 {sesi.terisi} / {sesi.kapasitas_max} Terisi
                  </span>
                  {/* Menampilkan sisa slot di bawahnya */}
                  <span style={{ fontSize: '10px', color: '#2e7d32', marginTop: '2px' }}>
                    Sisa {sesi.sisa_kuota} slot
                  </span>
                </>
              )}
            </div>

              </button>
            ))
          )}
        </div>

        <button
          className="res-btn-yellow"
          onClick={() => selectedDate && selectedSession && setShowConfirm(true)}
          disabled={!selectedDate || !selectedSession}
        >
          Lanjut Reservasi
        </button>
      </div>
    </div>
  );
};

export default GymReservationPage;
