import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import LoadingScreen from "./components/LoadingScreen";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import "./styles/App.css";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Cek session awal
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();

    // Listen untuk perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN') {
          setPage('home'); // atau halaman setelah login
        } else if (event === 'SIGNED_OUT') {
          setPage('landing');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (target) => setPage(target);

  if (loading) return <LoadingScreen onFinish={() => setLoading(false)} />;

  // Jika user sudah login, redirect ke home
  if (user && page === 'landing') {
    setPage('home');
  }

  return (
    <div className="main-content">
      {page === 'landing' && <LandingPage onNavigate={handleNavigate} />}
      {page === 'login' && <LoginPage onNavigate={handleNavigate} />}
      {page === 'signup' && <SignupPage onNavigate={handleNavigate} />}
      {page === 'forgot' && <ForgotPasswordPage onNavigate={handleNavigate} />}
      {/* Tambah halaman home jika perlu */}
    </div>
  );
}