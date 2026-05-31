import { useState, useEffect, useRef, useCallback, lazy, Suspense, Component } from "react";
import { supabase } from "./supabase";
import LoadingScreen from "./components/LoadingScreen";
import { ToastProvider } from "./components/Toast";
import "./styles/App.css";

// ─────────────────────────────────────────────
// ERROR BOUNDARY
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// LAZY IMPORTS
// ─────────────────────────────────────────────
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
const AdminDashboard       = lazy(() => import("./components/AdminDashboard"));

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const PUBLIC_PAGES    = ['landing', 'login', 'signup', 'forgot', 'reset-password'];

// Halaman transient: tidak disimpan ke localStorage karena tidak masuk akal
// untuk di-restore setelah reload.
const TRANSIENT_PAGES = [];

const PageLoader = () => (
  <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
    justifyContent:'center', background:'#f5f5f5' }}>
    <style>{`@keyframes _spin { to { transform:rotate(360deg); } }`}</style>
    <div style={{ width:32, height:32, border:'3px solid #eee',
      borderTopColor:'#C8102E', borderRadius:'50%', animation:'_spin 0.8s linear infinite' }}/>
  </div>
);

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

// Key untuk localStorage
const STORAGE_KEY = 'nutrigym_currentPage';

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
export default function App() {
  const [animDone, setAnimDone] = useState(IS_AUTH_CALLBACK);
  const [appReady, setAppReady] = useState(IS_AUTH_CALLBACK);

  const [user,        setUser]        = useState(null);
  const [profile,     setProfile]     = useState(null);
  const [pageParams,  setPageParams]  = useState({});
  const [biodataTemp, setBiodataTemp] = useState(null);
  const [refreshKey,        setRefreshKey]        = useState(0);
  const [checkinRefreshKey, setCheckinRefreshKey] = useState(0);

  const [page, setPage] = useState(() => {
    if (IS_AUTH_CALLBACK && AUTH_URL.type === 'recovery') return 'reset-password';
    return 'landing';
  });

  // initDone: true setelah init() selesai — mencegah onAuthStateChange
  // SIGNED_IN mengoverride navigasi yang sudah dilakukan init()
  const initDone             = useRef(false);
  // restoredFromStorage: true jika init() me-restore halaman dari localStorage.
  // Dipakai oleh handler SIGNED_IN agar tidak mengoverride halaman yang sudah
  // di-restore (misal: health-module, riwayat-reservasi, dsb).
  const restoredFromStorage  = useRef(false);
  const isMountedRef         = useRef(true);

  // ── FALLBACK: paksa appReady setelah 5 detik ────────────────────────────
  useEffect(() => {
    if (IS_AUTH_CALLBACK) return;
    const t = setTimeout(() => {
      if (isMountedRef.current) {
        console.warn('[App] appReady fallback triggered');
        setAppReady(true);
      }
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  // ── NAVIGATE ─────────────────────────────────────────────────────────────
  const handleNavigate = useCallback((target, data = {}) => {
    if (!isMountedRef.current) return;
    if (target === 'confirm' && data && Object.keys(data).length > 0) setBiodataTemp(data);
    if (target === 'home') setBiodataTemp(null);
    setPage(target);
    setPageParams({ fromPage: page, ...data });
    // Jangan simpan halaman public atau transient (qr-scan dll) ke localStorage
    if (!PUBLIC_PAGES.includes(target) && !TRANSIENT_PAGES.includes(target)) {
      localStorage.setItem(STORAGE_KEY, target);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [page]);

  // ── BOOKING & CHECKIN ────────────────────────────────────────────────────
  const handleBookingSuccess = useCallback(() => {
    setRefreshKey(k => k + 1);
    handleNavigate('home');
  }, [handleNavigate]);

  const handleCheckinSuccess = useCallback(() => {
    setCheckinRefreshKey(k => k + 1);
  }, []);

  // ── PROFILE ──────────────────────────────────────────────────────────────
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
      if (isMountedRef.current) setProfile(data ?? null);
      return !!(data?.nama_lengkap);
    } catch (err) {
      console.warn('[App] fetchProfile failed:', err.message);
      if (isMountedRef.current) setProfile(null);
      return false;
    }
  };

  // ── NAVIGATE AFTER AUTH ──────────────────────────────────────────────────
  const navigateAfterAuth = useCallback(async (userId, allowSavedPage = false) => {
    if (!isMountedRef.current) return;
    const hasBiodata = await fetchAndSetProfile(userId);
    if (!isMountedRef.current) return;

    let targetPage = hasBiodata ? 'home' : 'biodata';

    if (allowSavedPage && hasBiodata) {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Hanya pakai saved page kalau valid, bukan public page, dan bukan transient page
      if (saved && !PUBLIC_PAGES.includes(saved) && !TRANSIENT_PAGES.includes(saved)) {
        targetPage = saved;
        // Tandai bahwa halaman ini di-restore dari localStorage, bukan fresh login.
        // Handler SIGNED_IN akan skip navigasi kalau flag ini true.
        restoredFromStorage.current = true;
      }
    }

    setPage(targetPage);
    if (!PUBLIC_PAGES.includes(targetPage) && !TRANSIENT_PAGES.includes(targetPage)) {
      localStorage.setItem(STORAGE_KEY, targetPage);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── SWITCH ACCOUNT ───────────────────────────────────────────────────────
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
      // Switch account selalu ke home, tidak restore saved page
      restoredFromStorage.current = false;
      localStorage.removeItem(STORAGE_KEY);
      await navigateAfterAuth(data.user.id, false);
    } catch (err) {
      console.error('[App] handleSwitchAccount error:', err);
      handleNavigate('login');
    }
  }, [handleNavigate, navigateAfterAuth]);

  // ── INIT ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current      = true;
    initDone.current          = false;
    restoredFromStorage.current = false;

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
            await navigateAfterAuth(data.user.id, false);
          } else {
            setPage('login');
          }
          return;
        }

        // Normal load: cek session yang ada
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!isMountedRef.current) return;
        if (sessionError) console.warn('[App] getSession error:', sessionError.message);

        if (session?.user) {
          setUser(session.user);
          // allowSavedPage = true: restore halaman terakhir dari localStorage
          await navigateAfterAuth(session.user.id, true);
        } else {
          setProfile(null);
          setPage('landing');
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error('[App] init failed:', err);
        if (isMountedRef.current) {
          setPage('landing');
          setProfile(null);
        }
      } finally {
        // KRITIS: selalu set initDone dan appReady di finally
        // supaya tidak ada state macet apapun yang terjadi di atas
        if (isMountedRef.current) {
          initDone.current = true;
          if (!IS_AUTH_CALLBACK) setAppReady(true);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedRef.current) return;

        switch (event) {
          case 'SIGNED_IN':
            setUser(session?.user ?? null);
            // KRITIS: kalau init() belum selesai, JANGAN override navigasi.
            // init() sudah handle navigasi dengan benar (allowSavedPage = true).
            if (!initDone.current) return;
            // Kalau halaman di-restore dari localStorage oleh init(), JANGAN
            // override. Contoh: user reload di halaman health-module atau
            // riwayat-reservasi — tidak boleh diarahkan ke home.
            // Konsumsi flag-nya (reset ke false) agar login berikutnya tetap normal.
            if (restoredFromStorage.current) {
              restoredFromStorage.current = false;
              return;
            }
            // Login fresh (bukan restore): arahkan ke home, jangan restore saved page.
            if (session?.user) await navigateAfterAuth(session.user.id, false);
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setProfile(null);
            setBiodataTemp(null);
            setRefreshKey(0);
            setCheckinRefreshKey(0);
            restoredFromStorage.current = false;
            setPage('landing');
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('hm_progress');
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
      subscription?.unsubscribe();
    };
  }, [navigateAfterAuth]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  const showLoading = !animDone || !appReady;

  if (showLoading) return (
    <LoadingScreen onFinish={() => setAnimDone(true)} />
  );

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
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

            {page === 'admin'             && <AdminDashboard       onNavigate={handleNavigate} user={user}/>}
          </div>
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  );
}
