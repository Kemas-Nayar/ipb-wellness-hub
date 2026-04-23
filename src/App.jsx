import { useState, useEffect } from "react";
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
  // BUG FIX: authReady memisahkan "session sudah dicek" dari "loading animation selesai"
  // Dulu: loading=false bisa dipicu oleh LoadingScreen (onFinish) SEBELUM getSession() selesai
  // Akibatnya di mobile yang lambat, page masih 'landing' saat render pertama → keliatan logout
  const [authReady, setAuthReady] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const [page, setPage] = useState(null); // null = belum tahu, hindari flash 'landing'
  const [pageParams, setPageParams] = useState(null);
  const [user, setUser] = useState(null);

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

      // Auth sudah dicek — boleh render sekarang (kalau animasi juga sudah selesai)
      setAuthReady(true);
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

  const handleNavigate = (target, params = null) => {
    setPage(target);
    setPageParams(params);
  };

  // Tampilkan LoadingScreen sampai KEDUANYA selesai: auth dicek + animasi selesai
  const showLoading = !authReady || !animDone;
  if (showLoading) {
    return <LoadingScreen onFinish={() => setAnimDone(true)} />;
  }

  return (
    <div className="main-content">
      {page === 'landing'           && <LandingPage onNavigate={handleNavigate} />}
      {page === 'login'             && <LoginPage onNavigate={handleNavigate} />}
      {page === 'signup'            && <SignupPage onNavigate={handleNavigate} />}
      {page === 'forgot'            && <ForgotPasswordPage onNavigate={handleNavigate} />}
      {page === 'home'              && <HomePage onNavigate={handleNavigate} user={user} />}
      {page === 'biodata'           && <BiodataPage onNavigate={handleNavigate} user={user} />}
      {page === 'notifications'     && <NotificationsPage onNavigate={handleNavigate} />}
      {page === 'profile'           && <ProfilePage onNavigate={handleNavigate} user={user} />}
      {page === 'personal-info'     && <PersonalInfoPage onNavigate={handleNavigate} user={user} />}
      {page === 'riwayat-reservasi' && <RiwayatReservasiPage onNavigate={handleNavigate} user={user} />}
      {page === 'faq'               && <FAQPage onNavigate={handleNavigate} />}
      {page === 'pengaturan'        && <PengaturanPage onNavigate={handleNavigate} />}
      {page === 'ganti-akun'        && <GantiAkunPage onNavigate={handleNavigate} user={user} />}
      {page === 'logout'            && <LogoutPage onNavigate={handleNavigate} />}
      {page === 'health-assistant'  && <HealthAssistantPage onNavigate={handleNavigate} user={user} />}
      {page === 'gym-reservation'   && <GymReservationPage onNavigate={handleNavigate} user={user} />}
      {page === 'health-module'     && <HealthModulePage onNavigate={handleNavigate} user={user} />}
      {page === 'qr-scan'           && <QRScanPage onNavigate={handleNavigate} user={user} params={pageParams} />}
    </div>
  );
}
