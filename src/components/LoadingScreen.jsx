import { useEffect, useState, useRef } from "react";
import logoNutrigym from "../assets/logo_nutrigym.png";
import "../styles/LoadingScreen.css";

// Durasi total loading screen:
// - Progress bar: ~3 detik natural
// - Fade out mulai: 2500ms (dipercepat dari 3000ms)
// - Komponen hilang: 3500ms
// - onFinish dipanggil: 3500ms + sedikit buffer
//
// FIX: onFinish HARUS selalu terpanggil — tidak boleh macet karena
// state transition yang gagal (misalnya animasi di-interrupt saat refresh).
// Solusi: finishCalledRef + cleanup yang memanggil onFinish kalau belum dipanggil.

export default function LoadingScreen({ onFinish }) {
  const [fading,   setFading]   = useState(false);
  const [visible,  setVisible]  = useState(true); // ganti 'loading' → 'visible' lebih jelas
  const [progress, setProgress] = useState(0);

  const finishCalledRef = useRef(false);
  const onFinishRef     = useRef(onFinish); // simpan ref supaya cleanup bisa akses versi terbaru

  // Sync ref kalau onFinish prop berubah (seharusnya tidak, tapi aman)
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  // FIX UTAMA: Pastikan onFinish PASTI dipanggil saat komponen unmount,
  // bahkan kalau semua timer di-cancel karena parent re-render / hard refresh.
  useEffect(() => {
    return () => {
      if (!finishCalledRef.current) {
        finishCalledRef.current = true;
        onFinishRef.current?.();
      }
    };
  }, []);

  useEffect(() => {
    // Progress bar — simulasi loading yang terasa natural
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        const increment = prev < 60 ? 2 : prev < 85 ? 1 : 0.5;
        return Math.min(prev + increment, 100);
      });
    }, 20);

    // Mulai fade out sedikit lebih cepat (2500ms bukan 3000ms)
    // supaya total waktu lebih singkat dan tidak terasa lambat
    const fadeTimer = setTimeout(() => setFading(true), 2500);

    // Sembunyikan komponen setelah fade selesai
    const hideTimer = setTimeout(() => setVisible(false), 3500);

    // Panggil onFinish — ini trigger utama
    // Dipanggil bersamaan dengan hide supaya tidak ada gap blank
    const finishTimer = setTimeout(() => {
      if (!finishCalledRef.current) {
        finishCalledRef.current = true;
        onFinishRef.current?.();
      }
    }, 3500);

    // Fallback keras: kalau semua timer di atas entah kenapa tidak jalan
    // (tab background throttling, browser freeze sesaat, dll),
    // paksa onFinish setelah 6 detik
    const fallbackTimer = setTimeout(() => {
      if (!finishCalledRef.current) {
        finishCalledRef.current = true;
        console.warn('[LoadingScreen] fallback onFinish triggered');
        onFinishRef.current?.();
      }
    }, 6000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      clearTimeout(finishTimer);
      clearTimeout(fallbackTimer);
      // Cleanup effect di atas (unmount guard) akan handle onFinish
      // kalau komponen unmount sebelum finishTimer jalan
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <div className={`ls-screen ${fading ? "ls-fade-out" : ""}`}>

      <div className="ls-orb ls-orb-1" />
      <div className="ls-orb ls-orb-2" />
      <div className="ls-orb ls-orb-3" />

      {[...Array(12)].map((_, i) => (
        <div key={i} className={`ls-particle ls-particle-${i + 1}`} />
      ))}

      {/* Glass container */}
      <div className="ls-glass">
        <div className="ls-glow" />
        <div className="ls-ring-outer">
          <div className="ls-ring-inner" />
        </div>
        <div className="ls-logo-wrap">
          <img
            src={logoNutrigym}
            alt="NutriGym Club"
            className="ls-logo"
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="ls-progress-wrap">
        <div
          className="ls-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="ls-tagline">Preparing your experience</p>
      <p className="ls-brand">IPB Wellness Hub</p>

    </div>
  );
}