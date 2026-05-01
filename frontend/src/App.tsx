import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { EmailVerification } from './pages/EmailVerification';
import { ChangePassword } from './pages/ChangePassword';
import { RegistrarDashboard } from './pages/RegistrarDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuthStore } from './store/authStore';

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

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth — giriş sayfası */}
        <Route path="/login" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />

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
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-6 mt-20">
                  <h1 className="text-5xl font-extrabold gradient-text">
                    Kontrol Paneli
                  </h1>
                  <p className="text-xl text-white/40 text-center max-w-2xl leading-relaxed">
                    Hoş geldin{user?.fullName ? `, ${user.fullName}` : ''}! Kampüs hayatını yönetmek için hazırsın.
                    Etkinlikleri keşfet, tesisleri rezerve et ve daha fazlasını yap.
                  </p>
                  <div className="flex gap-4 mt-8">
                    <button className="px-8 py-3 rounded-2xl gradient-btn shadow-lg shadow-indigo-500/20 cursor-pointer">
                      Etkinlikleri Keşfet
                    </button>
                    <button className="px-8 py-3 rounded-2xl font-semibold text-white cursor-pointer transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Tesis Rezerve Et
                    </button>
                  </div>
                </div>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
