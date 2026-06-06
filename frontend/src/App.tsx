import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { EmailVerification } from './pages/EmailVerification';
import { ChangePassword } from './pages/ChangePassword';
import { RegistrarDashboard } from './pages/RegistrarDashboard';
import { SksDashboard } from './pages/SksDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ClubsPage } from './pages/ClubsPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ClubPresidentDashboard } from './pages/ClubPresidentDashboard';
import { ClubEventManagementPage } from './pages/ClubEventManagementPage';
import { CertificateVerificationPage } from './pages/CertificateVerificationPage';
import { FacilityAdminDashboard } from './pages/FacilityAdminDashboard';
import { FacilityBookingPage } from './pages/FacilityBookingPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { useAuthStore } from './store/authStore';
import { useClubStore } from './store/clubStore';
import { AutoClearMessages } from './components/AutoClearMessages';
import { yetkilerdenBiriVarMi, YETKI_GRUPLARI } from './utils/roles';
import { YOLLAR } from './utils/paths';

// Giriş sonrası yönlendirme mantığı:
// 1. emailVerified === false → E-posta doğrulama
// 2. mustChangePassword === true → Şifre değiştirme
// 3. Her ikisi de OK → Dashboard
const ProtectedRoute = ({
  children,
  izinliYetkiler,
}: {
  children: React.ReactNode;
  izinliYetkiler?: readonly string[];
}) => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated || !user) return <Navigate to={YOLLAR.giris} replace />;

  // İlk girişte e-posta doğrulama zorunlu
  if (!user.epostaDogrulandi) {
    return <Navigate to={YOLLAR.epostaDogrula} replace />;
  }

  // İlk girişte şifre değiştirme zorunlu
  if (user.sifreDegistirmeli) {
    return <Navigate to={YOLLAR.sifreDegistir} replace />;
  }

  if (izinliYetkiler && !yetkilerdenBiriVarMi(user.roller, izinliYetkiler)) {
    return <Navigate to={YOLLAR.anaSayfa} replace />;
  }

  return <>{children}</>;
};

const DashboardRoute = () => {
  const user = useAuthStore(state => state.user);
  const isStudent = yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.ogrenci);

  if (yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.sksYonetimi)) {
    return <SksDashboard />;
  }

  if (yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.ogrenciIsleri)) {
    return <RegistrarDashboard />;
  }

  if (yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.tesisYonetimi)) {
    return <FacilityAdminDashboard />;
  }

  if (isStudent) {
    return <StudentDashboard />;
  }

  return <StudentDashboard />;
};

const ClubManagementRoute = () => {
  const managedClubs = useClubStore(state => state.managedClubs);
  const fetchManagedClubs = useClubStore(state => state.fetchManagedClubs);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetchManagedClubs().finally(() => {
      if (active) setChecked(true);
    });
    return () => {
      active = false;
    };
  }, [fetchManagedClubs]);

  if (!checked) {
    return <div className="text-sm font-semibold text-white/45">Yükleniyor...</div>;
  }

  if (managedClubs.length === 0) {
    return <Navigate to={YOLLAR.kulupler} replace />;
  }

  return <ClubPresidentDashboard />;
};

const EskiYolYonlendirme = ({ yeniYol }: { yeniYol: string }) => {
  const location = useLocation();
  return <Navigate to={`${yeniYol}${location.search}`} replace />;
};

const EskiKulupDetayYonlendirme = () => {
  const { clubId } = useParams();
  return <Navigate to={YOLLAR.kulupDetay(clubId ?? '')} replace />;
};

const EskiKulupEtkinlikYonlendirme = () => {
  const { eventId } = useParams();
  return <Navigate to={YOLLAR.kulupEtkinlikYonetimi(eventId ?? '')} replace />;
};

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const hasSession = isAuthenticated && !!user;

  return (
    <BrowserRouter>
      <AutoClearMessages />
      <Routes>
        {/* Auth — giriş sayfası */}
        <Route path={YOLLAR.giris} element={!hasSession ? <AuthPage /> : <Navigate to={YOLLAR.anaSayfa} />} />
        <Route path="/login" element={<EskiYolYonlendirme yeniYol={YOLLAR.giris} />} />
        <Route path={YOLLAR.sertifikaDogrula} element={<CertificateVerificationPage />} />
        <Route path="/certificates/verify" element={<EskiYolYonlendirme yeniYol={YOLLAR.sertifikaDogrula} />} />

        {/* E-posta doğrulama — giriş yapmış ama doğrulanmamış */}
        <Route path={YOLLAR.epostaDogrula} element={
          hasSession && !user.epostaDogrulandi
            ? <EmailVerification />
            : <Navigate to={hasSession ? YOLLAR.anaSayfa : YOLLAR.giris} />
        } />
        <Route path="/verify-email" element={<EskiYolYonlendirme yeniYol={YOLLAR.epostaDogrula} />} />

        {/* Şifre değiştirme — giriş yapmış ama ilk şifre değişikliği bekliyor */}
        <Route path={YOLLAR.sifreDegistir} element={
          hasSession && user.sifreDegistirmeli
            ? <ChangePassword />
            : <Navigate to={hasSession ? YOLLAR.anaSayfa : YOLLAR.giris} />
        } />
        <Route path="/change-password" element={<EskiYolYonlendirme yeniYol={YOLLAR.sifreDegistir} />} />

        {/* Dashboard and other protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardRoute />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path={YOLLAR.profil} element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={<EskiYolYonlendirme yeniYol={YOLLAR.profil} />} />

        <Route path={YOLLAR.ayarlar} element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={<EskiYolYonlendirme yeniYol={YOLLAR.ayarlar} />} />

        <Route path={YOLLAR.kulupler} element={
          <ProtectedRoute>
            <AppLayout>
              <ClubsPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/clubs" element={<EskiYolYonlendirme yeniYol={YOLLAR.kulupler} />} />

        <Route path={YOLLAR.kulupDetay(':clubId')} element={
          <ProtectedRoute>
            <AppLayout>
              <ClubDetailPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/clubs/:clubId" element={<EskiKulupDetayYonlendirme />} />

        <Route path={YOLLAR.bildirimler} element={
          <ProtectedRoute>
            <AppLayout>
              <NotificationsPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={<EskiYolYonlendirme yeniYol={YOLLAR.bildirimler} />} />

        <Route path={YOLLAR.kulupYonetimi} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <AppLayout>
              <ClubManagementRoute />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/club-management" element={<EskiYolYonlendirme yeniYol={YOLLAR.kulupYonetimi} />} />

        <Route path={YOLLAR.kulupEtkinlikYonetimi(':eventId')} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <AppLayout>
              <ClubEventManagementPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/club-management/events/:eventId" element={<EskiKulupEtkinlikYonlendirme />} />

        <Route path={YOLLAR.tesisYonetimi} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.tesisYonetimi}>
            <AppLayout>
              <FacilityAdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/facility-management" element={<EskiYolYonlendirme yeniYol={YOLLAR.tesisYonetimi} />} />

        <Route path={YOLLAR.tesisRezervasyon} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <AppLayout>
              <FacilityBookingPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={<EskiYolYonlendirme yeniYol={YOLLAR.tesisRezervasyon} />} />

        <Route path={YOLLAR.rezervasyonlarim} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <AppLayout>
              <MyBookingsPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/my-bookings" element={<EskiYolYonlendirme yeniYol={YOLLAR.rezervasyonlarim} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
