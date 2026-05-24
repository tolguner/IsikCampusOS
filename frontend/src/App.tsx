import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { CertificateVerificationPage } from './pages/CertificateVerificationPage';
import { useAuthStore } from './store/authStore';
import { useClubStore } from './store/clubStore';
import { AutoClearMessages } from './components/AutoClearMessages';

// Giriş sonrası yönlendirme mantığı:
// 1. emailVerified === false → E-posta doğrulama
// 2. mustChangePassword === true → Şifre değiştirme
// 3. Her ikisi de OK → Dashboard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // İlk girişte e-posta doğrulama zorunlu
  if (user && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // İlk girişte şifre değiştirme zorunlu
  if (user && user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
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
    return <Navigate to="/clubs" replace />;
  }

  return <ClubPresidentDashboard />;
};

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);

  return (
    <BrowserRouter>
      <AutoClearMessages />
      <Routes>
        {/* Auth — giriş sayfası */}
        <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/certificates/verify" element={<CertificateVerificationPage />} />

        {/* E-posta doğrulama — giriş yapmış ama doğrulanmamış */}
        <Route path="/verify-email" element={
          isAuthenticated && user && !user.emailVerified
            ? <EmailVerification />
            : <Navigate to={isAuthenticated ? "/" : "/login"} />
        } />

        {/* Şifre değiştirme — giriş yapmış ama ilk şifre değişikliği bekliyor */}
        <Route path="/change-password" element={
          isAuthenticated && user && user.mustChangePassword
            ? <ChangePassword />
            : <Navigate to={isAuthenticated ? "/" : "/login"} />
        } />

        {/* Dashboard and other protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout>
              {user?.roles.includes('ROLE_REGISTRAR') ? (
                <RegistrarDashboard />
              ) : user?.roles.includes('ROLE_SKS_ADMIN') ? (
                <SksDashboard />
              ) : (
                <StudentDashboard />
              )}
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/clubs" element={
          <ProtectedRoute>
            <AppLayout>
              <ClubsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/clubs/:clubId" element={
          <ProtectedRoute>
            <AppLayout>
              <ClubDetailPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <AppLayout>
              <NotificationsPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/club-management" element={
          <ProtectedRoute>
            <AppLayout>
              <ClubManagementRoute />
            </AppLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
