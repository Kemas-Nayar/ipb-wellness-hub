import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import '../styles/QRScannerModal.css';

const IconClose = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSuccess = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconError = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const VALID_QR_PAYLOAD = "NUTRIGYM_CHECKIN";

const QRScannerModal = ({ reservationId, fromReservasi = false, onClose, onSuccess }) => {
  const [scanState, setScanState] = useState('scanning'); // 'scanning', 'success', 'error', 'processing'
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef(null);

  const handleQRCodeScan = async (decodedText) => {
    setScanState('processing');
    
    // Validate payload
    if (decodedText !== VALID_QR_PAYLOAD) {
      setErrorMsg("QR Code tidak valid atau bukan milik NutriGym.");
      setScanState('error');
      return;
    }

    try {
      const now = new Date().toISOString();

      if (fromReservasi) {
        // Reservasi modern — update tabel reservasi (singular)
        const { error } = await supabase
          .from('reservasi')
          .update({ status: 'hadir' })
          .eq('id', reservationId);
        if (error) throw error;
      } else {
        // Reservasi legacy — update tabel reservations (plural)
        const { error } = await supabase
          .from('reservations')
          .update({
            status:        'checked-in',
            checked_in_at: now,
            updated_at:    now,
          })
          .eq('id', reservationId);
        if (error) throw error;
      }

      setScanState('success');
    } catch (err) {
      setErrorMsg("Gagal memproses check-in. " + err.message);
      setScanState('error');
    }
  };

  useEffect(() => {
    let html5QrCode;
    
    if (scanState === 'scanning') {
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        html5QrCode = new Html5Qrcode("qr-reader");
        let isProcessed = false;
        
        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // Success Callback
            if (isProcessed) return;
            isProcessed = true;
            
            html5QrCode.stop().then(() => {
              handleQRCodeScan(decodedText);
            }).catch((err) => {
              console.warn("Failed to stop scanner cleanly, processing anyway", err);
              handleQRCodeScan(decodedText);
            });
          },
          (errorMessage) => {
            // Ignore parse errors (happens every frame without a QR code)
          }
        ).catch((err) => {
          console.error("Camera access failed", err);
          setErrorMsg("Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera.");
          setScanState('error');
        });
        
        scannerRef.current = html5QrCode;
      });
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [scanState]); // Re-run if we go back to 'scanning'

  const handleRetry = () => {
    setErrorMsg('');
    setScanState('scanning');
  };

  const handleCloseAndRefresh = () => {
    onClose();
    if (scanState === 'success') {
      onSuccess();
    }
  };

  return (
    <div className="qr-modal-overlay">
      <div className="qr-modal-content">
        <div className="qr-modal-header">
          <h3 className="qr-modal-title">QR Check-In</h3>
          <button className="qr-modal-close" onClick={onClose}>
            <IconClose />
          </button>
        </div>
        
        <div className="qr-modal-body">
          {scanState === 'scanning' && (
            <>
              <div className="qr-scanner-container">
                <div id="qr-reader"></div>
              </div>
              <p className="qr-scan-guidance">
                Arahkan kamera ke QR Code<br/>yang ada di meja resepsionis NutriGym.
              </p>
            </>
          )}

          {scanState === 'processing' && (
            <div className="qr-state-box">
              <p style={{fontFamily:'Poppins', fontWeight:600}}>Memproses Check-in...</p>
            </div>
          )}

          {scanState === 'success' && (
            <div className="qr-state-box">
              <div className="qr-icon-success"><IconSuccess /></div>
              <h4 className="qr-state-title">Check-in Berhasil!</h4>
              <p className="qr-state-desc">Selamat berlatih. Jangan lupa pemanasan!</p>
              <button className="qr-state-btn" onClick={handleCloseAndRefresh}>Tutup & Segarkan</button>
            </div>
          )}

          {scanState === 'error' && (
            <div className="qr-state-box">
              <div className="qr-icon-error"><IconError /></div>
              <h4 className="qr-state-title">Gagal Memindai</h4>
              <p className="qr-state-desc">{errorMsg}</p>
              <button className="qr-state-btn" onClick={handleRetry} style={{marginBottom: 8}}>Coba Lagi</button>
              <button className="qr-state-btn secondary" onClick={onClose}>Batal</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
