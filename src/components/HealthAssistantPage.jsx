// src/components/HealthAssistantPage.jsx
import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import doctorAvatar from '../assets/doctor_avatar.png';
import '../styles/HealthAssistantPage.css';

const HealthAssistantPage = ({ onNavigate, user }) => {
  const [error, setError] = useState(null);

  // Mengambil fungsi bawaan (native) dari Vercel AI SDK
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome-message',
        role: 'assistant',
        content: 'Tentu! Aku disini untuk membantumu! Apa yang mau kau tanyakan tentang kesehatanmu?',
      },
    ],
    onError: (err) => {
      setError('Gagal mengirim pesan. Silakan coba lagi.');
      console.error('Chat error:', err);
    },
  });

  const bottomRef = useRef(null);

  // Otomatis scroll ke bawah setiap ada chat baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fungsi khusus untuk Quick Topics (memakai append karena inputnya dari luar state text)
  const handleQuickTopic = (prompt) => {
    if (isLoading) return;
    setError(null);
    append({
      role: 'user',
      content: prompt,
    });
  };

  const quickTopics = [
    { label: '🍒 Tips Diet', prompt: 'Berikan tips diet sehat untuk saya' },
    { label: '💪 Latihan', prompt: 'Berikan rekomendasi latihan olahraga yang baik' },
    { label: '💤 Tidur', prompt: 'Bagaimana cara meningkatkan kualitas tidur saya?' },
  ];

  return (
    <div className="ha-page">
      <div className="ha-header">
        <button className="ha-back-btn" onClick={() => onNavigate('home')}>←</button>
        <div className="ha-header-text">
          <h2 className="ha-title">Health Assistant</h2>
          <p className="ha-subtitle">Tanyakan aku pertanyaan tentang kesehatanmu!</p>
        </div>
        <button className="ha-help-btn">?</button>
      </div>

      <div className="ha-body">
        <div className="ha-chat-area">
          {/* Menampilkan pesan error jika internet/API bermasalah */}
          {error && (
            <div className="ha-error-msg">
              {error}
            </div>
          )}

          {/* Menampilkan Balon Chat */}
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

          {/* Indikator Animasi Loading */}
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

        {/* Tombol Topik Instan */}
        <div className="ha-quick-topics">
          {quickTopics.map((t, i) => (
            <button 
              key={i} 
              className="ha-topic-btn" 
              onClick={() => handleQuickTopic(t.prompt)} 
              disabled={isLoading}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form yang Super Aman 
        - handleSubmit bawaan Vercel otomatis mereset input kotak teks
        - <form> memastikan tombol Enter bekerja tanpa bentrok
      */}
      <form 
        className="ha-input-bar" 
        onSubmit={(e) => {
          e.preventDefault(); 
          if (!input?.trim() || isLoading) return; 
          handleSubmit(e); 
        }}
      >
        <input
          className="ha-input"
          placeholder="Tulis pertanyaanmu..."
          value={input}
          onChange={(e) => {
            handleInputChange(e);
            setError(null);
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="ha-send-btn"
          disabled={!input?.trim() || isLoading}
          title={isLoading ? 'Menunggu respons...' : 'Kirim pesan'}
        >
          →
        </button>
      </form>
    </div>
  );
};

export default HealthAssistantPage;
