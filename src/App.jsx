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
import HealthAssistantPage from './components/HealthAssistantPage';
import GymReservationPage from './components/GymReservationPage';
import HealthModulePage from './components/Healthmodulepage';
import QRScanPage from './components/QRScanPage';
import "./styles/App.css";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(null); // Ubah dari 'landing' ke null untuk cegah auto-logout
  const [pageParams, setPageParams] = useState(null);
  const [user, setUser] = useState(null);

  const checkBiodata = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nama_lengkap')
        .eq('id', userId)
        .single();
      
      if (error || !data || !data.nama_lengkap) return false;
      return true;
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // 1. Cek session yang ada di localStorage saat refresh
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const hasBiodata = await checkBiodata(currentUser.id);
        setPage(hasBiodata ? 'home' : 'biodata');
      } else {
        setPage('landing');
      }
      
      // Matikan loading HANYA setelah kita tahu status user
      setLoading(false);
    };

    initAuth();

    // 2. Listen perubahan auth (login, logout, dsb)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === 'SIGNED_IN' && currentUser) {
          const hasBiodata = await checkBiodata(currentUser.id);
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

  // Selama loading atau page belum ditentukan, tampilkan loading screen
  // if (loading || page === null) {
  //   return <LoadingScreen onFinish={() => setLoading(false)} />;
  // }
  
  if (loading) return <div style={{color: 'white', padding: '20px'}}>SABAR... LAGI CEK AUTH...</div>;
  if (page === null) return <div style={{color: 'white', padding: '20px'}}>PAGE MASIH NULL...</div>;

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
