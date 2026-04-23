import React, { useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import doctorAvatar from '../assets/doctor_avatar.png';
import '../styles/HealthAssistantPage.css';

const HealthAssistantPage = ({ onNavigate, user }) => {
  // useChat menggantikan useState manual untuk messages, input, dan loading
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat', // Endpoint backend Vercel kita
    initialMessages: [
      {
        id: 'welcome-message',
        role: 'assistant',
        content: 'Tentu! Aku disini untuk membantumu! Apa yang mau kau tanyakan tentang kesehatanmu?',
      },
    ],
  });

  const bottomRef = useRef(null);

  const quickTopics = [
    { label: '🍒 Tips Diet', prompt: 'Berikan tips diet sehat untuk saya' },
    { label: '💪 Latihan', prompt: 'Berikan rekomendasi latihan olahraga yang baik' },
    { label: '💤 Tidur', prompt: 'Bagaimana cara meningkatkan kualitas tidur saya?' },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fungsi khusus untuk tombol Quick Topic agar langsung terkirim
  const handleQuickTopic = (prompt) => {
    append({
      role: 'user',
      content: prompt,
    });
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
          {messages.map((msg) => (
            <div key={msg.id} className={`ha-msg-row ${msg.role === 'user' ? 'ha-msg-user' : 'ha-msg-ai'}`}>
              {msg.role === 'assistant' && (
                <img src={doctorAvatar} className="ha-avatar" alt="AI" />
              )}
              <div className={`ha-bubble ${msg.role === 'assistant' ? 'ha-bubble-ai' : 'ha-bubble-user'}`}>
                {/* Vercel AI SDK menggunakan 'content', bukan 'text' */}
                {msg.content} 
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
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
            <button key={i} className="ha-topic-btn" onClick={() => handleQuickTopic(t.prompt)} disabled={isLoading}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar - Diubah menjadi <form> agar handleSubmit berjalan native */}
      <form className="ha-input-bar" onSubmit={handleSubmit}>
        <input
          className="ha-input"
          placeholder="Tulis pertanyaanmu..."
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
        />
      <button 
        type="submit" 
        className="ha-send-btn" 
        disabled={!input?.trim() || isLoading}
      >
        →
      </button>
      </form>
    </div>
  );
};

export default HealthAssistantPage;
