import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import '../styles/QRScanPage.css';

const QRScanPage = ({ onNavigate, user, params }) => {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Kamera tidak bisa diakses. Coba izinkan akses kamera.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  // Simulate QR scan success after 3 seconds (for demo)
  useEffect(() => {
    if (!scanning) return;
    const timer = setTimeout(() => handleScanSuccess(), 3000);
    return () => clearTimeout(timer);
  }, [scanning]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleScanSuccess = async () => {
    stopCamera();
    // Mark reservation as checked_in
    if (params?.reservationId) {
      await supabase
        .from('reservations')
        .update({ checked_in: true })
        .eq('id', params.reservationId);
    }
    setScanned(true);
  };

  // Success screen
  if (scanned) {
    return (
      <div className="qr-success-page">
        <div className="qr-success-icon">🏋️</div>
        <h2 className="qr-success-title">Selamat ngegym!</h2>
        <p className="qr-success-desc">
          Semangat dan sehat selalu! Yuk kita kejar target bersama-sama ya!
        </p>
        <button
          className="qr-btn-yellow"
          onClick={() => onNavigate('home')}
        >
          Kembali ke dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="qr-page">
      <div className="qr-header">
        <button className="qr-back-btn" onClick={() => { stopCamera(); onNavigate('riwayat-reservasi'); }}>←</button>
        <h2 className="qr-title">Scan QR</h2>
      </div>

      <div className="qr-body">
        {!scanning ? (
          <div className="qr-idle">
            <div className="qr-placeholder">
              <div className="qr-frame">
                <span className="qr-corner tl"/><span className="qr-corner tr"/>
                <span className="qr-corner bl"/><span className="qr-corner br"/>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
                  <rect x="19" y="14" width="2" height="2"/><rect x="14" y="19" width="2" height="2"/>
                  <rect x="18" y="18" width="3" height="3"/>
                </svg>
              </div>
            </div>
            <p className="qr-desc">Arahkan kamera ke QR code di pintu masuk gym</p>
            {error && <p className="qr-error">{error}</p>}
            <button className="qr-btn-yellow" onClick={startCamera}>Buka Kamera</button>
          </div>
        ) : (
          <div className="qr-scanner">
            <div className="qr-video-wrap">
              <video ref={videoRef} autoPlay playsInline className="qr-video" />
              <div className="qr-overlay">
                <div className="qr-scan-frame">
                  <span className="qr-corner tl"/><span className="qr-corner tr"/>
                  <span className="qr-corner bl"/><span className="qr-corner br"/>
                  <div className="qr-scan-line" />
                </div>
              </div>
            </div>
            <p className="qr-scanning-text">Mendeteksi QR code...</p>
            <button className="qr-btn-outline" onClick={() => { stopCamera(); }}>Batalkan</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanPage;