import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import LoadingScreen from "./components/LoadingScreen";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import HomePage from "./components/HomePage";
import BiodataPage from "./components/BiodataPage";
import NotificationsPage from "./components/NotificationsPage";
import ProfilePage from "./components/ProfilePage";
import PersonalInfoPage from "./components/PersonalInfoPage";
import RiwayatReservasiPage from "./components/RiwayatReservasiPage";
import FAQPage from "./components/FAQPage";
import PengaturanPage from "./components/PengaturanPage";
import GantiAkunPage from "./components/GantiAkunPage";
import LogoutPage from "./components/LogoutPage";
import HealthAssistantPage from './components/Healthassistantpage';
import GymReservationPage from './components/Gymreservationpage';
import HealthModulePage from './components/Healthmodulepage';
import QRScanPage from './components/QRScanPage';
import "./styles/App.css";

export default function App() {
  const [showLoading, setShowLoading] = useState(true);
  const [page, setPage] = useState('landing');
  const [pageParams, setPageParams] = useState(null);
  const [user, setUser] = useState(null);

  // Pakai ref untuk track kedua kondisi tanpa trigger re-render ganda
  const authReady = useRef(false);
  const animDone = useRef(false);

  const tryHideLoading = () => {
    if (authReady.current && animDone.current) {
      setShowLoading(false);
    }
  };

  const checkBiodata = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('nama_lengkap')
      .eq('id', userId)
      .single();
    if (error || !data || !data.nama_lengkap) return false;
    return true;
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const hasBiodata = await checkBiodata(session.user.id);
        setPage(hasBiodata ? 'home' : 'biodata');
      } else {
        setPage('landing');
      }
      authReady.current = true;
      tryHideLoading();
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          const hasBiodata = await checkBiodata(session.user.id);
          setPage(hasBiodata ? 'home' : 'biodata');
        } else if (event === 'SIGNED_OUT') {
          setPage('landing');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAnimDone = () => {
    animDone.current = true;
    tryHideLoading();
  };

  const handleNavigate = (target, params = null) => {
    setPage(target);
    setPageParams(params);
  };

  return (
    <div className="main-content">
      {showLoading && <LoadingScreen onFinish={handleAnimDone} />}
      {!showLoading && page === 'landing'           && <LandingPage onNavigate={handleNavigate} />}
      {!showLoading && page === 'login'             && <LoginPage onNavigate={handleNavigate} />}
      {!showLoading && page === 'signup'            && <SignupPage onNavigate={handleNavigate} />}
      {!showLoading && page === 'forgot'            && <ForgotPasswordPage onNavigate={handleNavigate} />}
      {!showLoading && page === 'home'              && <HomePage onNavigate={handleNavigate} user={user} />}
      {!showLoading && page === 'biodata'           && <BiodataPage onNavigate={handleNavigate} user={user} />}
      {!showLoading && page === 'notifications'     && <NotificationsPage onNavigate={handleNavigate} />}
      {!showLoading && page === 'profile'           && <ProfilePage onNavigate={handleNavigate} user={user} />}
      {!showLoading && page === 'personal-info'     && <PersonalInfoPage onNavigate={handleNavigate} user={user} />}
      {!showLoading && page === 'riwayat-reservasi' && <RiwayatReservasiPage onNavigate={handleNavigate} user={user} />}
      {!showLoading && page === 'faq'               && <FAQPage onNavigate={handleNavigate} />}
      {!showLoading && page === 'pengaturan'        && <PengaturanPage onNavigate={handleNavigate} />}
      {!showLoading && page === 'ganti-akun'        && <GantiAkunPage onNavigate={handleNavigate} user={user} />}
      {!showLoading && page === 'logout'            && <LogoutPage onNavigate={handleNavigate} />}
      {!showLoading && page === 'health-assistant'  && <HealthAssistantPage onNavigate={handleNavigate} user={user} />}
      {!showLoading && page === 'gym-reservation'   && <GymReservationPage onNavigate={handleNavigate} user={user} />}
      {!showLoading && page === 'health-module'     && <HealthModulePage onNavigate={handleNavigate} user={user} />}
      {!showLoading && page === 'qr-scan'           && <QRScanPage onNavigate={handleNavigate} user={user} params={pageParams} />}
    </div>
  );
}
