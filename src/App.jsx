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
import GymReservationPage from './components/Gymreservationpage';
import HealthModulePage from './components/Healthmodulepage';
import QRScanPage from './components/QRScanPage';
import "./styles/App.css";


export default function App() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('landing');
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

      }

      setLoading(false);

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


  if (loading) return <LoadingScreen onFinish={() => setLoading(false)} />;


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
