import React, { useState } from 'react';
import { supabase } from '../supabase';
import '../styles/GymReservationPage.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const TIME_SLOTS = [
  { label: '16.30 - 17.30', start: '16:30', end: '17:30' },
  { label: '17.30 - 19.00', start: '17:30', end: '19:00' },
];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDay = (year, month) => new Date(year, month, 1).getDay();

const GymReservationPage = ({ onNavigate, user }) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDate(null); setSelectedSlot(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDate(null); setSelectedSlot(null);
  };

  const handleReserve = async () => {
    if (!selectedDate || !selectedSlot) return;
    setLoading(true);
    const { error } = await supabase.from('reservations').insert({
      user_id: user.id,
      date: toDateStr(selectedDate),
      start_time: selectedSlot.start,
      end_time: selectedSlot.end,
    });
    setLoading(false);
    if (!error) { setShowConfirm(false); setShowSuccess(true); }
  };

  // Success screen
  if (showSuccess) {
    return (
      <div className="res-success-page">
        <div className="res-success-icon">
          <div className="res-confetti">🎊</div>
          <div className="res-check-circle">✓</div>
        </div>
        <h2 className="res-success-title">Reservasi Berhasil!</h2>
        <p className="res-success-desc">
          Selamat! Reservasi kamu untuk{' '}
          <strong>{formatDateLabel(selectedDate)}</strong> telah berhasil dilakukan.
        </p>
        <button className="res-btn-yellow" onClick={() => onNavigate('home')}>
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // Confirm modal
  if (showConfirm) {
    return (
      <div className="res-confirm-page">
        <div className="res-header">
          <button className="res-back-btn" onClick={() => setShowConfirm(false)}>←</button>
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
            <p className="res-confirm-label">Anda akan reservasi pada:</p>
            <div className="res-confirm-date-row">
              <span className="res-confirm-cal-sm">🗓️</span>
              <div>
                <p className="res-confirm-date">{formatDateLabel(selectedDate)}</p>
                <p className="res-confirm-time">{selectedSlot?.label.replace(' - ', ' - ')}</p>
              </div>
            </div>
            <div className="res-confirm-divider" />
            <div className="res-confirm-actions">
              <button className="res-btn-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="res-btn-confirm" onClick={handleReserve} disabled={loading}>
                {loading ? '...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calendar cells
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, curr: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, curr: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, curr: false });

  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isPast = (d) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="res-page">
      {/* Header */}
      <div className="res-header">
        <button className="res-back-btn" onClick={() => onNavigate('home')}>←</button>
        <span className="res-header-title">Reservasi</span>
        <button className="res-help-btn">?</button>
      </div>

      <div className="res-body">
        {/* Calendar Card */}
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
                onClick={() => cell.curr && !isPast(cell.day) && setSelectedDate(cell.day)}
                disabled={!cell.curr || isPast(cell.day)}
              >
                {cell.day}
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="res-slots-card">
          {TIME_SLOTS.map((slot, i) => (
            <button
              key={i}
              className={`res-slot-btn ${selectedSlot?.label === slot.label ? 'res-slot-selected' : ''}`}
              onClick={() => setSelectedSlot(slot)}
            >
              {slot.label}
            </button>
          ))}
        </div>

        {/* Reserve Button */}
        <button
          className="res-btn-yellow"
          onClick={() => selectedDate && selectedSlot && setShowConfirm(true)}
          disabled={!selectedDate || !selectedSlot}
        >
          Reserve
        </button>
      </div>
    </div>
  );
};

export default GymReservationPage;