import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import doctorAvatar from '../assets/doctor_avatar.png';
import '../styles/Healthassistantpage.css';

const WELCOME = {
  id: 'welcome-message',
  role: 'assistant',
  content: 'Halo! Aku Nuri, Health Assistant dari IPB Wellness Hub\nApa yang mau kamu tanyakan tentang kesehatan, gizi, atau olahraga hari ini?',
};

// ─── Weight intent detection ──────────────────────────────────────────────────
// Converts Indonesian number words to numeric values
const parseWeightWord = (str) => {
  const words = {
    'setengah': 0.5, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4,
    'lima': 5, 'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
  };
  const s = str.trim().toLowerCase();
  if (words[s] !== undefined) return words[s];
  return parseFloat(s.replace(',', '.'));
};

// Weight amount pattern: matches both digits and common Indonesian number words
const W = '(\\d+(?:[.,]\\d+)?|setengah|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)';

// Returns { newWeight: number, type: 'absolute'|'increase'|'decrease' } or null
const detectWeightIntent = (text, currentWeightKg) => {
  const t = text.toLowerCase();

  // Absolute: "berat badanku 72 kg" / "berat badan saya sekarang 68 kg"
  const absRe = new RegExp(`berat\\s*badan\\w*\\s+(?:sekarang\\s+|jadi\\s+|sudah\\s+)?${W}\\s*kg`);
  const absMatch = t.match(absRe);
  if (absMatch) {
    return { newWeight: parseWeightWord(absMatch[1]), type: 'absolute' };
  }

  // Increase: "naik 3 kg" / "naik setengah kg" / "bertambah 5 kg"
  const upRe = new RegExp(`(?:naik|bertambah|tambah)\\s+${W}\\s*(?:kilo(?:gram)?|kg)`);
  const upMatch = t.match(upRe);
  if (upMatch && currentWeightKg) {
    return { newWeight: parseFloat(currentWeightKg) + parseWeightWord(upMatch[1]), type: 'increase' };
  }

  // Decrease: "turun 2 kg" / "turun setengah kilogram" / "berkurang 3 kg"
  const downRe = new RegExp(`(?:turun|berkurang|kurang|susut)\\s+${W}\\s*(?:kilo(?:gram)?|kg)`);
  const downMatch = t.match(downRe);
  if (downMatch && currentWeightKg) {
    return { newWeight: parseFloat(currentWeightKg) - parseWeightWord(downMatch[1]), type: 'decrease' };
  }

  return null;
};

// ─── System prompt builder ────────────────────────────────────────────────────
const buildSystemPrompt = (userData) => {
  let userContext = '';

  if (userData) {
    const { nama, bmi, bmiLabel, beratKg, tinggiCm, gender } = userData;
    const parts = [];
    if (nama)    parts.push(`Nama pengguna: ${nama}`);
    if (gender)  parts.push(`Jenis kelamin: ${gender === 'laki-laki' ? 'Laki-laki' : 'Perempuan'}`);
    if (beratKg) parts.push(`Berat badan: ${beratKg} kg`);
    if (tinggiCm) parts.push(`Tinggi badan: ${tinggiCm} cm`);
    if (bmi)     parts.push(`BMI: ${bmi} (${bmiLabel})`);

    if (parts.length > 0) {
      userContext = `\n\nData pengguna yang sedang kamu bantu:\n${parts.join('\n')}\n\nGunakan data ini untuk memberikan saran yang lebih personal dan relevan. Sapa pengguna dengan namanya di awal percakapan jika perlu.`;
    }
  }

  return `Kamu adalah Health Assistant bernama Nuri dari IPB Wellness Hub.
Tugasmu adalah menjawab pertanyaan seputar kesehatan, gizi, dan olahraga secara super ringkas, padat, dan cepat dibaca.

ATURAN FORMAT WAJIB (BATASAN KETAT):
1. TOTAL PANJANG JAWABAN: Maksimal 120-150 kata saja. Jangan pernah membuat jawaban panjang.
2. STRUKTUR JAWABAN: Maksimal terdiri dari 1 paragraf pembuka (maks 2 kalimat) + Maksimal 3 poin list pendek + 1 kalimat penutup.
3. DILARANG menggunakan sub-poin atau anak poin. Cukup satu level bullet point saja.
4. KEPADATAN TEKS: Setiap poin list hanya boleh berisi maksimal 1-2 kalimat langsung ke inti tipsnya.
5. Sifat: Ramah, santai, gunakan Bahasa Indonesia.
6. Jika ada yang meminta detail, jawab secara ringkas dan padat (maksimal 2-3 kalimat), tidak wajib memberi 3 poin agar ada variasi.

Batasan jawaban:
- WAJIB Jangan gunakan bold dan "*" (asterisk) dalam jawaban.
- Jangan memberikan diagnosis medis.
- Jika pertanyaan tidak berhubungan dengan kesehatan atau fitur IPB Wellness Hub, tolak dengan sopan dan arahkan kembali ke topik utama.
- PENTING: Kamu TIDAK BISA mengubah data pengguna (berat badan, tinggi, dsb.) secara langsung. Jika pengguna menyebut perubahan berat badan, cukup balas: "Oke! Nanti sistem akan meminta konfirmasimu untuk update berat badan ya." Jangan pernah berpura-pura sudah mengupdate data.${userContext}`;
};

const getBmiLabel = (bmi) => {
  const v = parseFloat(bmi);
  if (v < 18.5) return 'Kurus';
  if (v < 25)   return 'Normal';
  if (v < 30)   return 'Gemuk';
  return 'Obesitas';
};

// ─── Quick topic chips ────────────────────────────────────────────────────────
const QUICK_TOPICS = [
  {
    label: <span style={{display: 'flex', alignItems: 'center', gap: 6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Tips Diet</span>,
    prompt: 'Berikan tips diet sehat untuk saya'
  },
  {
    label: <span style={{display: 'flex', alignItems: 'center', gap: 6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M6 6v12M18 6v12M3 9v6M21 9v6"/></svg> Latihan</span>,
    prompt: 'Berikan rekomendasi latihan olahraga yang baik untuk pemula'
  },
  {
    label: <span style={{display: 'flex', alignItems: 'center', gap: 6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Tidur</span>,
    prompt: 'Bagaimana cara meningkatkan kualitas tidur saya?'
  },
  {
    label: <span style={{display: 'flex', alignItems: 'center', gap: 6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> Hidrasi</span>,
    prompt: 'Berapa banyak air yang harus saya minum setiap hari?'
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconSend = ({ disabled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={disabled ? '#bbb' : '#1a1a1a'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconWellness = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CC2222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

// ─── Chat components ──────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="ha-msg-row ha-msg-ai ha-anim-in">
    <img src={doctorAvatar} className="ha-avatar" alt="Nuri AI" />
    <div className="ha-bubble ha-bubble-ai ha-typing">
      <span /><span /><span />
    </div>
  </div>
);

// Message renders normal bubbles OR the weight-confirm action bubble
const Message = ({ msg, onConfirmWeight, onCancelWeight }) => {
  if (msg.type === 'weight-confirm') {
    return (
      <div className="ha-msg-row ha-msg-ai ha-anim-in">
        <img src={doctorAvatar} className="ha-avatar" alt="Nuri AI" />
        <div className="ha-bubble ha-bubble-ai">
          <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.55 }}>{msg.content}</p>
          <div className="ha-confirm-actions">
            <button className="ha-confirm-btn ha-confirm-yes" onClick={() => onConfirmWeight(msg.newWeight)}>
              ✅ Ya, update
            </button>
            <button className="ha-confirm-btn ha-confirm-no" onClick={onCancelWeight}>
              ❌ Tidak
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ha-msg-row ${msg.role === 'user' ? 'ha-msg-user' : 'ha-msg-ai'} ha-anim-in`}>
      {msg.role === 'assistant' && (
        <img src={doctorAvatar} className="ha-avatar" alt="Nuri AI" />
      )}
      <div className={`ha-bubble ${msg.role === 'assistant' ? 'ha-bubble-ai' : 'ha-bubble-user'}`}
        style={{ whiteSpace: 'pre-wrap' }}>
        {msg.content}
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ onSend, isLoading, onClear, userData }) => (
  <aside className="ha-sidebar">
    {/* Brand */}
    <div className="ha-sidebar-brand">
      <div className="ha-sidebar-brand-icon">
        <IconWellness />
      </div>
      <div className="ha-sidebar-brand-text">
        <h2 className="ha-sidebar-brand-title">IPB Wellness Hub</h2>
        <p className="ha-sidebar-brand-sub">Health Assistant</p>
      </div>
    </div>

    {/* User card — shown when profile is loaded */}
    {userData && (
      <div className="ha-sidebar-usercard">
        <div className="ha-sidebar-usercard-name">👤 {userData.nama || 'Pengguna'}</div>
        {userData.beratKg && (
          <div className="ha-sidebar-usercard-bmi" style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>
            ⚖️ {userData.beratKg} kg
          </div>
        )}
        {userData.bmi && (
          <div className="ha-sidebar-usercard-bmi">
            BMI: <strong>{userData.bmi}</strong>
            <span className={`ha-bmi-badge ha-bmi-${userData.bmiLabel?.toLowerCase()}`}>
              {userData.bmiLabel}
            </span>
          </div>
        )}
      </div>
    )}

    {/* Quick Topics */}
    <div className="ha-sidebar-section">
      <p className="ha-sidebar-section-title">Topik Cepat</p>
      <div className="ha-sidebar-chips">
        {QUICK_TOPICS.map((t, i) => (
          <button
            key={i}
            className="ha-sidebar-chip"
            onClick={() => onSend(t.prompt)}
            disabled={isLoading}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>

    {/* Tips */}
    <div className="ha-sidebar-tips">
      <p className="ha-sidebar-tips-text" style={{display: 'flex', gap: 8, alignItems: 'flex-start'}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E6A800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0, marginTop: 2}}><path d="M9 21h6M12 2a7 7 0 0 0-7 7c0 2 1 4 2 5v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2c1-1 2-3 2-5a7 7 0 0 0-7-7z"/></svg>
        <span><strong>Tips:</strong> Kamu bisa update berat badan lewat chat, contoh: "berat badanku naik 2 kg".</span>
      </p>
    </div>

    {/* Clear button */}
    <button className="ha-sidebar-clear-btn" onClick={onClear}>
      <IconTrash />
      <span>Hapus Percakapan</span>
    </button>
  </aside>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const HealthAssistantPage = ({ onNavigate, user }) => {
  const [messages, setMessages]       = useState([WELCOME]);
  const [input, setInput]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [userData, setUserData]       = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // ── Fetch user profile ──
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nama_lengkap, gender, berat_kg, tinggi_cm')
          .eq('id', user.id)
          .single();

        if (!mounted) return;
        if (error) { console.warn('[HealthAssistant] fetchProfile error:', error.message); return; }

        if (data) {
          const bmi = data.berat_kg && data.tinggi_cm && data.berat_kg > 0 && data.tinggi_cm > 0
            ? (data.berat_kg / Math.pow(data.tinggi_cm / 100, 2)).toFixed(1)
            : null;
          setUserData({
            nama:     data.nama_lengkap || null,
            gender:   data.gender || null,
            beratKg:  data.berat_kg || null,
            tinggiCm: data.tinggi_cm || null,
            bmi,
            bmiLabel: bmi ? getBmiLabel(bmi) : null,
          });
        }
      } catch (err) {
        console.warn('[HealthAssistant] fetchProfile failed:', err.message);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };

    fetchProfile();
    return () => { mounted = false; };
  }, [user]);

  // ── Auto-scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Confirm weight update → write to Supabase ──
  const confirmWeight = useCallback(async (newWeightKg) => {
    if (!user?.id) return;

    // Remove the confirm bubble immediately
    setMessages(prev => prev.filter(m => m.type !== 'weight-confirm'));
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ berat_kg: newWeightKg })
        .eq('id', user.id);

      if (error) throw error;

      // Recalculate BMI with new weight
      const newBmi = userData?.tinggiCm && userData.tinggiCm > 0
        ? (newWeightKg / Math.pow(userData.tinggiCm / 100, 2)).toFixed(1)
        : null;
      const newBmiLabel = newBmi ? getBmiLabel(newBmi) : null;

      // Update sidebar live
      setUserData(prev => ({ ...prev, beratKg: newWeightKg, bmi: newBmi, bmiLabel: newBmiLabel }));

      // Build Nuri's response
      let reply = `Berat badan kamu sudah diupdate jadi ${newWeightKg} kg! 🎉`;
      if (newBmi) {
        reply += `\nBMI kamu sekarang: ${newBmi} (${newBmiLabel}).`;
        if (newBmiLabel === 'Normal')   reply += '\nGood job! Pertahankan terus ya 💪';
        else if (newBmiLabel === 'Kurus') reply += '\nYuk tingkatkan asupan kalori sehat ya!';
        else reply += '\nYuk lebih aktif bergerak dan jaga pola makan ya!';
      }

      setMessages(prev => [...prev, { id: Date.now() + '-weight-ok', role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + '-weight-err',
        role: 'assistant',
        content: `Maaf, gagal update berat badan. Coba lagi ya!\n(${err.message})`,
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [user, userData]);

  // ── Cancel weight update ──
  const cancelWeight = useCallback(() => {
    setMessages(prev => [
      ...prev.filter(m => m.type !== 'weight-confirm'),
      { id: Date.now() + '-weight-cancel', role: 'assistant', content: 'Oke, tidak jadi update ya! 😊' },
    ]);
    inputRef.current?.focus();
  }, []);

  // ── Send message ──
  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');

    // ── Weight intent check (no API call needed) ──
    const intent = detectWeightIntent(trimmed, userData?.beratKg);
    if (intent && user?.id) {
      const newWeight = Math.round(intent.newWeight * 10) / 10;
      const oldWeight = userData?.beratKg;
      const confirmContent = oldWeight
        ? `Mau update berat badan kamu dari ${oldWeight} kg → ${newWeight} kg?`
        : `Mau update berat badan kamu jadi ${newWeight} kg?`;

      setMessages(prev => [...prev, {
        id: Date.now() + '-confirm',
        role: 'assistant',
        type: 'weight-confirm',
        newWeight,
        content: confirmContent,
      }]);
      return; // skip API
    }

    // ── Normal AI call ──
    setIsLoading(true);

    const systemPrompt = buildSystemPrompt(userData);
    const history = next
      .filter(m => m.id !== 'welcome-message')
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const apiMessages = [{ role: 'system', content: systemPrompt }, ...history];

    try {
      let res;

      if (import.meta.env.PROD) {
        // ── PRODUCTION: call /api/chat (Vercel serverless) ──
        // API key lives server-side only — never in the browser bundle
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, model: 'deepseek-chat', max_tokens: 800, temperature: 0.7 }),
        });
      } else {
        // ── LOCAL DEV: call DeepSeek directly ──
        // Safe because the dev server is only accessible on your own machine
        const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
        if (!apiKey) throw new Error('VITE_DEEPSEEK_API_KEY belum diset di file .env (hanya untuk dev lokal)');
        res = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'deepseek-chat', messages: apiMessages, max_tokens: 800, temperature: 0.7 }),
        });
      }

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try { const e = await res.json(); errMsg = e?.error?.message || e?.error || errMsg; } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      const data  = await res.json();
      const reply = data?.choices?.[0]?.message?.content ?? 'Maaf, aku tidak bisa menjawab saat ini.';
      setMessages(prev => [...prev, { id: Date.now() + '-ai', role: 'assistant', content: reply }]);
    } catch (err) {
      const isConfigErr = err.message.includes('VITE_DEEPSEEK') || err.message.includes('belum diset');
      const msg = isConfigErr
        ? `⚙️ ${err.message}`
        : `Maaf, terjadi kesalahan koneksi. Coba lagi ya!\n\n(${err.message})`;
      setMessages(prev => [...prev, { id: Date.now() + '-err', role: 'assistant', content: msg }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, messages, userData, user]);

  const handleSubmit  = (e) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };
  const handleClear   = () => { setMessages([WELCOME]); };

  const showChips = messages.length <= 2;

  return (
    <div className="ha-page">
      <Sidebar onSend={sendMessage} isLoading={isLoading} onClear={handleClear} userData={userData} />
      <div className="ha-main">
        <div className="ha-header">
          <button className="ha-back-btn" onClick={() => onNavigate('home')} aria-label="Kembali">
            <IconBack />
          </button>
          <div className="ha-header-avatar">
            <img src={doctorAvatar} alt="Nuri" />
            <span className="ha-online-dot" />
          </div>
          <div className="ha-header-text">
            <h2 className="ha-title">Health Assistant</h2>
            <p className="ha-subtitle">Nuri · IPB Wellness Hub</p>
          </div>
          <button className="ha-clear-btn ha-mobile-only" onClick={handleClear} aria-label="Hapus percakapan">
            <IconTrash />
          </button>
        </div>

        <div className="ha-body">
          <div className="ha-date-label">Hari ini</div>

          {profileLoading && (
            <div className="ha-profile-loading">
              <div className="ha-profile-loading-dot" />
              Memuat data profil...
            </div>
          )}

          <div className="ha-chat-area">
            {messages.map(msg => (
              <Message
                key={msg.id}
                msg={msg}
                onConfirmWeight={confirmWeight}
                onCancelWeight={cancelWeight}
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {showChips && (
            <div className="ha-quick-topics">
              {QUICK_TOPICS.map((t, i) => (
                <button
                  key={i}
                  className="ha-topic-btn"
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => sendMessage(t.prompt)}
                  disabled={isLoading}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className="ha-input-bar" onSubmit={handleSubmit}>
          <div className={`ha-input-wrap ${input ? 'ha-input-wrap--active' : ''}`}>
            <input
              ref={inputRef}
              className="ha-input"
              placeholder="Tulis pertanyaanmu..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className={`ha-send-btn ${input.trim() && !isLoading ? 'ha-send-btn--active' : ''}`}
            disabled={!input.trim() || isLoading}
            aria-label="Kirim"
          >
            <IconSend disabled={!input.trim() || isLoading} />
          </button>
        </form>

      </div>{/* end .ha-main */}
    </div>
  );
};

export default HealthAssistantPage;