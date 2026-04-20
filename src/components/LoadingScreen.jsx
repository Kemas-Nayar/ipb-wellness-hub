import { useEffect, useState } from "react";
import logoNutrigym from "../assets/logo_nutrigym.png";
import "../styles/LoadingScreen.css";

export default function LoadingScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2000);
    const finishTimer = setTimeout(() => onFinish(), 2800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`loading-screen ${fading ? "fade-out" : ""}`}>
      <div className="loading-logo">
        <img
          src={logoNutrigym}
          alt="NutriGym Club"
          className="logo-circle-img"
        />
      </div>
    </div>
  );
}