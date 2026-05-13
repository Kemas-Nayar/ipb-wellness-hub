import React, { useRef, useEffect, useCallback } from 'react';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

const PickerColumn = ({ items, selectedIndex, onSelect }) => {
  const columnRef = useRef(null);
  const scrollTimer = useRef(null);
  const currentIndex = useRef(selectedIndex);

  useEffect(() => {
    const el = columnRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = selectedIndex * ITEM_HEIGHT;
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = columnRef.current;
    if (!el) return;

    if (scrollTimer.current) clearTimeout(scrollTimer.current);

    scrollTimer.current = setTimeout(() => {
      const rawIndex = el.scrollTop / ITEM_HEIGHT;
      const snapped = Math.round(rawIndex);
      const clamped = Math.max(0, Math.min(snapped, items.length - 1));

      if (clamped !== currentIndex.current) {
        currentIndex.current = clamped;
        onSelect(clamped);
      }

      el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: 'smooth' });
    }, 80);
  }, [items, onSelect]);

  const handleItemClick = (index) => {
    const el = columnRef.current;
    if (!el) return;
    currentIndex.current = index;
    onSelect(index);
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
  };

  return (
    <div className="picker-column-wrap">
      <div className="picker-fade picker-fade-top" />
      <div className="picker-highlight" />

      <div
        ref={columnRef}
        className="picker-column"
        onScroll={handleScroll}
      >
        <div style={{ height: PADDING, flexShrink: 0 }} />

        {items.map((item, index) => (
          <div
            key={index}
            className="picker-item"
            onClick={() => handleItemClick(index)}
          >
            {item}
          </div>
        ))}

        {/* Spacer bawah */}
        <div style={{ height: PADDING, flexShrink: 0 }} />
      </div>

      <div className="picker-fade picker-fade-bottom" />
    </div>
  );
};

const DatePicker = ({ value, onCancel, onDone }) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const days  = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const years = Array.from({ length: 56 }, (_, i) => String(1970 + i));

  const defaultDate  = value instanceof Date && !isNaN(value) ? value : new Date(2000, 0, 1);
  const initDay      = defaultDate.getDate() - 1;
  const initMonth    = defaultDate.getMonth();
  const initYearIdx  = years.indexOf(String(defaultDate.getFullYear()));
  const initYear     = initYearIdx >= 0 ? initYearIdx : years.indexOf('2000');

  const selectedDay   = useRef(initDay);
  const selectedMonth = useRef(initMonth);
  const selectedYear  = useRef(initYear);

  const handleDone = () => {
    const day   = selectedDay.current + 1;
    const month = selectedMonth.current;
    const year  = parseInt(years[selectedYear.current]);

    const maxDay  = new Date(year, month + 1, 0).getDate();
    const safeDay = Math.min(day, maxDay);

    onDone(new Date(year, month, safeDay));
  };

  return (
    <div className="datepicker-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="datepicker-modal">

        <div className="datepicker-header">
          <button className="datepicker-cancel" onClick={onCancel}>Cancel</button>
          <span className="datepicker-title">Tanggal Lahir</span>
          <button className="datepicker-done" onClick={handleDone}>Done</button>
        </div>

        <div className="datepicker-body">
          <PickerColumn
            items={days}
            selectedIndex={initDay}
            onSelect={(i) => { selectedDay.current = i; }}
          />
          <PickerColumn
            items={months}
            selectedIndex={initMonth}
            onSelect={(i) => { selectedMonth.current = i; }}
          />
          <PickerColumn
            items={years}
            selectedIndex={initYear}
            onSelect={(i) => { selectedYear.current = i; }}
          />
        </div>

      </div>
    </div>
  );
};

export default DatePicker;