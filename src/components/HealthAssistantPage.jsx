import React, { useState, useRef, useEffect } from 'react';
import doctorAvatar from '../assets/doctor_avatar.png';
import '../styles/HealthAssistantPage.css';

const HealthAssistantPage = ({ onNavigate, user }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Tentu! Aku disini untuk membantumu! Apa yang mau kau tanyakan tentang kesehatanmu?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (!text.trim()) return;
    const userMsg = { role: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'Kamu adalah Health Assistant bernama Nuri dari IPB Wellness Hub. Jawab pertanyaan seputar kesehatan, gizi, olahraga, dan gaya hidup sehat dalam Bahasa Indonesia. Jawab dengan ramah, singkat, dan informatif.',
          messages: newMessages.map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Maaf, aku tidak bisa menjawab saat ini.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Maaf, terjadi kesalahan. Coba lagi ya!' }]);
    } finally {
      setLoading(false);
    }
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

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`ha-msg-row ${msg.role === 'user' ? 'ha-msg-user' : 'ha-msg-ai'}`}>
              {msg.role === 'assistant' && (
                <img src={doctorAvatar} className="ha-avatar" alt="AI" />
              )}
              <div className={`ha-bubble ${msg.role === 'assistant' ? 'ha-bubble-ai' : 'ha-bubble-user'}`}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
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
            <button key={i} className="ha-topic-btn" onClick={() => sendMessage(t.prompt)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="ha-input-bar">
        <input
          className="ha-input"
          placeholder="Tulis pertanyaanmu..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
        />
        <button className="ha-send-btn" onClick={() => sendMessage(input)}>→</button>
      </div>
    </div>
  );
};

export default HealthAssistantPage;