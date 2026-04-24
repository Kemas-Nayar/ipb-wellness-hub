import React, { useState, useRef, useEffect } from 'react';
import doctorAvatar from '../assets/doctor_avatar.png';
import '../styles/HealthAssistantPage.css';

const WELCOME = {
  id: 'welcome-message',
  role: 'assistant',
  content: 'Tentu! Aku disini untuk membantumu! Apa yang mau kau tanyakan tentang kesehatanmu?',
};

const SYSTEM_PROMPT = `Kamu adalah Health Assistant bernama Nuri dari IPB Wellness Hub. 
Kamu membantu pengguna dengan pertanyaan seputar kesehatan, gizi, olahraga, dan gaya hidup sehat. 
Jawab dalam Bahasa Indonesia, ramah, dan informatif. Jangan memberikan diagnosis medis.`;

const HealthAssistantPage = ({ onNavigate, user }) => {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  const quickTopics = [
    { label: '🍒 Tips Diet', prompt: 'Berikan tips diet sehat untuk saya' },
    { label: '💪 Latihan', prompt: 'Berikan rekomendasi latihan olahraga yang baik' },
    { label: '💤 Tidur', prompt: 'Bagaimana cara meningkatkan kualitas tidur saya?' },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Format history untuk Gemini (role: user/model, bukan assistant)
    // Gemini tidak support system prompt di sini, jadi kita inject ke pesan pertama
    const history = updatedMessages
      .filter(m => m.id !== 'welcome-message')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Inject system prompt sebagai context di awal
    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Baik, saya mengerti. Saya siap membantu!' }] },
      ...history,
    ];

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log('API KEY:', apiKey);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      );

      const data = await response.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        'Maaf, aku tidak bisa menjawab saat ini.';

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + '-ai', role: 'assistant', content: reply },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + '-err', role: 'assistant', content: 'Maaf, terjadi kesalahan. Coba lagi ya!' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="ha-page">
      {/* Header */}
      <div className="ha-header">
        <button className="ha-back-btn" onClick={() => onNavigate('home')}>←</button>
        <div className="ha-header-text">
          <h2 className="ha-title">Health Assistant</h2>
          <p className="ha-subtitle">Tanyakan aku pertanyaan tentang kesehatanmu!</p>
        </div>
        <button className="ha-help-btn">?</button>
      </div>

      {/* Chat Area */}
      <div className="ha-body">
        <div className="ha-chat-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`ha-msg-row ${msg.role === 'user' ? 'ha-msg-user' : 'ha-msg-ai'}`}>
              {msg.role === 'assistant' && (
                <img src={doctorAvatar} className="ha-avatar" alt="AI" />
              )}
              <div className={`ha-bubble ${msg.role === 'assistant' ? 'ha-bubble-ai' : 'ha-bubble-user'}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="ha-msg-row ha-msg-ai">
              <img src={doctorAvatar} className="ha-avatar" alt="AI" />
              <div className="ha-bubble ha-bubble-ai ha-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick Topics */}
        <div className="ha-quick-topics">
          {quickTopics.map((t, i) => (
            <button key={i} className="ha-topic-btn" onClick={() => sendMessage(t.prompt)} disabled={isLoading}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <form className="ha-input-bar" onSubmit={handleSubmit}>
        <input
          className="ha-input"
          placeholder="Tulis pertanyaanmu..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="ha-send-btn" disabled={!input.trim() || isLoading}>
          →
        </button>
      </form>
    </div>
  );
};

export default HealthAssistantPage;
