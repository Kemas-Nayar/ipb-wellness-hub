import { useState, useEffect, useRef, useCallback, lazy, Suspense, Component } from "react";
import { supabase } from "./supabase";
import LoadingScreen from "./components/LoadingScreen";
import { ToastProvider } from "./components/Toast";
import "./styles/App.css";

// Error Boundary
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e, i) { console.error('ErrorBoundary:', e, i); }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:20, textAlign:'center' }}>
        <h2 style={{ marginBottom:8 }}>Terjadi kesalahan</h2>
        <p style={{ color:'#888', marginBottom:16 }}>Mohon refresh halaman</p>
        <button onClick={() => window.location.reload()}
          style={{ padding:'12px 24px', background:'#C8102E', color:'white',
            border:'none', borderRadius:8, cursor:'pointer', fontWeight:600 }}>
          Refresh Halaman
        </button>
      </div>
    );
    return this.props.children;
  }
}

// Lazy imports
const LandingPage          = lazy(() => import("./components/LandingPage"));
const LoginPage            = lazy(() => import("./components/LoginPage"));
const SignupPage           = lazy(() => import("./components/SignupPage"));
const ForgotPasswordPage   = lazy(() => import("./components/ForgotPasswordPage"));
const ResetPasswordPage    = lazy(() => import("./components/ResetPasswordPage"));
const HomePage             = lazy(() => import("./components/HomePage"));
const BiodataPage          = lazy(() => import("./components/BiodataPage"));
const ConfirmPage          = lazy(() => import("./components/ConfirmPage"));
const NotificationsPage    = lazy(() => import("./components/NotificationsPage"));
const ProfilePage          = lazy(() => import("./components/ProfilePage"));
const PersonalInfoPage     = lazy(() => import("./components/PersonalInfoPage"));
const RiwayatReservasiPage = lazy(() => import("./components/RiwayatReservasiPage"));
const FAQPage              = lazy(() => import("./components/FAQPage"));
const PengaturanPage       = lazy(() => import("./components/PengaturanPage"));
const GantiAkunPage        = lazy(() => import("./components/GantiAkunPage"));
const LogoutPage           = lazy(() => import("./components/LogoutPage"));
const HealthAssistantPage  = lazy(() => import("./components/Healthassistantpage"));
const HealthModulePage     = lazy(() => import("./components/Healthmodulepage"));
const GymReservationPage   = lazy(() => import("./components/Gymreservationpage"));
const QRScanPage           = lazy(() => import("./components/Qrscanpage"));
const AdminDashboard       = lazy(() => import("./components/AdminDashboard"));

const PUBLIC_PAGES = ['landing', 'login', 'signup', 'forgot', 'reset-password'];

const PageLoader = () => (
  <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
    justifyContent:'center', background:'#f5f5f5' }}>
    <style>{`@keyframes _spin { to { transform:rotate(360deg); } }`}</style>
    <div style={{ width:32, height:32, border:'3px solid #eee',
      borderTopColor:'#C8102E', borderRadius:'50%', animation:'_spin 0.8s linear infinite' }}/>
  </div>
);

// Parse Supabase auth URL tokens
const _parseAuthUrl = () => {
  try {
    const raw = window.location.hash.substring(1) || window.location.search.substring(1);
    const p   = new URLSearchParams(raw);
    return {
      type:         p.get('type'),
      accessToken:  p.get('access_token'),
      refreshToken: p.get('refresh_token'),
      errorCode:    p.get('error'),
      errorDesc:    p.get('error_description'),
    };
  } catch { return {}; }
};

const AUTH_URL         = _parseAuthUrl();
const IS_AUTH_CALLBACK = !!(AUTH_URL.accessToken && AUTH_URL.type);


export default function App() {
  const [showLoading, setShowLoading] = useState(!IS_AUTH_CALLBACK);
  const [appReady,    setAppReady]    = useState(IS_AUTH_CALLBACK);
  const [user,        setUser]        = useState(null);
  const [profile,     setProfile]     = useState(null);
  const [pageParams,  setPageParams]  = useState({});
  const [biodataTemp, setBiodataTemp] = useState(null);

  const [refreshKey,       setRefreshKey]       = useState(0);
  const [checkinRefreshKey, setCheckinRefreshKey] = useState(0);

  const [page, setPage] = useState(() => {
    if (IS_AUTH_CALLBACK && AUTH_URL.type === 'recovery') return 'reset-password';
    return 'landing';
  });

  const intervalRef    = useRef(null);
  const sessionHandled = useRef(false);
  const isMountedRef   = useRef(true);

  // Navigate
  const handleNavigate = useCallback((target, data = {}) => {
    if (!isMountedRef.current) return;
    if (target === page && Object.keys(data).length === 0) return;

    if (target === 'confirm' && data && Object.keys(data).length > 0) {
      setBiodataTemp(data);
    }
    if (target === 'home') setBiodataTemp(null);

    const enrichedData = { fromPage: page, ...data };

    setPage(target);
    setPageParams(enrichedData);

    if (!PUBLIC_PAGES.includes(target)) {
      sessionStorage.setItem('currentPage', target);
    } else {
      sessionStorage.removeItem('currentPage');
    }
  }, [page]);

  // Booking & checkin
  const handleBookingSuccess = useCallback(() => {
    setRefreshKey(k => k + 1);
    handleNavigate('home');
  }, [handleNavigate]);

  const handleCheckinSuccess = useCallback(() => {
    setCheckinRefreshKey(k => k + 1);
  }, []);

  // Loading finish
  const handleLoadingFinish = () => {
    if (!isMountedRef.current) return;
    if (appReady) { setShowLoading(false); return; }

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) { clearInterval(intervalRef.current); return; }
      setAppReady(ready => {
        if (ready) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setShowLoading(false);
        }
        return ready;
      });
    }, 80);
  };

  // Profile
  const fetchAndSetProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nama_lengkap, email')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('[App] fetchProfile error:', error.message);
      }
      if (data && isMountedRef.current) setProfile(data);
      return !!(data?.nama_lengkap);
    } catch (err) {
      console.warn('[App] fetchProfile failed:', err.message);
      return false;
    }
  };

  const navigateAfterAuth = async (userId, allowSavedPage = false) => {
    if (!isMountedRef.current) return;
    const hasBiodata = await fetchAndSetProfile(userId);
    if (!isMountedRef.current) return;

    let targetPage = hasBiodata ? 'home' : 'biodata';

    if (allowSavedPage && hasBiodata) {
      const saved = sessionStorage.getItem('currentPage');
      if (saved && !PUBLIC_PAGES.includes(saved)) targetPage = saved;
    }

    setPage(targetPage);
    if (!PUBLIC_PAGES.includes(targetPage)) {
      sessionStorage.setItem('currentPage', targetPage);
    }
  };

  // Switch akun
  const handleSwitchAccount = useCallback(async (account) => {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token:  account.access_token,
        refresh_token: account.refresh_token,
      });

      if (error || !data?.user) {

        console.warn('[App] setSession gagal:', error?.message);
        handleNavigate('login');
        return;
      }


      setUser(data.user);
      await navigateAfterAuth(data.user.id, false);

    } catch (err) {
      console.error('[App] handleSwitchAccount error:', err);
      handleNavigate('login');
    }
  }, [handleNavigate]); // eslint-disable-line

  // Init
  useEffect(() => {
    isMountedRef.current = true;

    const init = async () => {
      try {
        const { type, accessToken, refreshToken, errorCode, errorDesc } = AUTH_URL;

        if (IS_AUTH_CALLBACK) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        if (errorCode || errorDesc) {
          console.warn('[App] Auth URL error:', errorCode, errorDesc);
          if (isMountedRef.current) setPage('login');
          return;
        }

        if (type === 'recovery' && accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (!isMountedRef.current) return;
          if (error) { console.error('[App] Recovery setSession:', error.message); setPage('login'); }
          return;
        }

        if ((type === 'signup' || type === 'magiclink') && accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (!isMountedRef.current) return;
          if (!error && data?.user) {
            setUser(data.user);
            sessionHandled.current = true;
            await navigateAfterAuth(data.user.id, false);
          } else {
            setPage('login');
          }
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!isMountedRef.current) return;

        if (sessionError) console.warn('[App] getSession error:', sessionError.message);

        if (session?.user) {
          setUser(session.user);
          sessionHandled.current = true;
          await navigateAfterAuth(session.user.id, true);
        } else {
          setProfile(null);
          setPage('landing');
          sessionStorage.removeItem('currentPage');
        }
      } catch (err) {
        console.error('[App] init failed:', err);
        if (isMountedRef.current) setPage('landing');
      } finally {
        if (isMountedRef.current && !IS_AUTH_CALLBACK) setAppReady(true);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedRef.current) return;
        setUser(session?.user ?? null);

        switch (event) {
          case 'SIGNED_IN':
            if (sessionHandled.current) { sessionHandled.current = false; return; }
            if (session?.user) await navigateAfterAuth(session.user.id, false);
            break;
          case 'SIGNED_OUT':
            setProfile(null);
            setBiodataTemp(null);
            setRefreshKey(0);
            setCheckinRefreshKey(0);
            setPage('landing');
            sessionStorage.removeItem('currentPage');
            break;
          case 'TOKEN_REFRESHED':
            if (session?.user) setUser(session.user);
            break;
          default:
            break;
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      subscription?.unsubscribe();
    };
  }, []); // eslint-disable-line

  // Render
  if (showLoading) return <LoadingScreen onFinish={handleLoadingFinish}/>;

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Suspense fallback={<PageLoader/>}>
          <div className="main-content">
            {page === 'landing'           && <LandingPage          onNavigate={handleNavigate}/>}
            {page === 'login'             && <LoginPage            onNavigate={handleNavigate}/>}
            {page === 'signup'            && <SignupPage           onNavigate={handleNavigate}/>}
            {page === 'forgot'            && <ForgotPasswordPage   onNavigate={handleNavigate}/>}
            {page === 'reset-password'    && <ResetPasswordPage    onNavigate={handleNavigate}/>}

            {page === 'home'              && <HomePage             onNavigate={handleNavigate} user={user} refreshKey={refreshKey}/>}

            {page === 'biodata'           && <BiodataPage          onNavigate={handleNavigate} user={user} initialData={biodataTemp}/>}
            {page === 'confirm'           && <ConfirmPage          onNavigate={handleNavigate} biodata={biodataTemp}/>}
            {page === 'notifications'     && <NotificationsPage    onNavigate={handleNavigate}/>}
            {page === 'profile'           && <ProfilePage          onNavigate={handleNavigate} user={user}/>}
            {page === 'personal-info'     && <PersonalInfoPage     onNavigate={handleNavigate} user={user}/>}

            {page === 'riwayat-reservasi' && <RiwayatReservasiPage onNavigate={handleNavigate} user={user} refreshTrigger={checkinRefreshKey} fromPage={pageParams.fromPage ?? 'profile'}/>}

            {page === 'faq'               && <FAQPage              onNavigate={handleNavigate}/>}
            {page === 'pengaturan'        && <PengaturanPage       onNavigate={handleNavigate}/>}


            {page === 'ganti-akun'        && (
              <GantiAkunPage
                onNavigate={handleNavigate}
                user={user}
                profile={profile}
                onSwitchAccount={handleSwitchAccount}
              />
            )}

            {page === 'logout'            && <LogoutPage           onNavigate={handleNavigate}/>}
            {page === 'health-assistant'  && <HealthAssistantPage  onNavigate={handleNavigate} user={user}/>}
            {page === 'health-module'     && <HealthModulePage     onNavigate={handleNavigate} user={user}/>}

            {page === 'gym-reservation'   && <GymReservationPage   onNavigate={handleNavigate} user={user} onBookingSuccess={handleBookingSuccess}/>}

            {page === 'qr-scan'           && <QRScanPage           onNavigate={handleNavigate} user={user} params={pageParams} onCheckinSuccess={handleCheckinSuccess}/>}
            {page === 'admin'             && <AdminDashboard       onNavigate={handleNavigate} user={user}/>}
          </div>
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  );
}