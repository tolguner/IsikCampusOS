import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { UygulamaDuzeni } from './components/duzen/UygulamaDuzeni';
import { GirisSayfasi } from './pages/GirisSayfasi';
import { EpostaDogrulama } from './pages/EpostaDogrulama';
import { SifreDegistir } from './pages/SifreDegistir';
import { OgrenciIsleriPaneli } from './pages/OgrenciIsleriPaneli';
import { SksPaneli } from './pages/SksPaneli';
import { ProfilSayfasi } from './pages/ProfilSayfasi';
import { AyarlarSayfasi } from './pages/AyarlarSayfasi';
import { KuluplerSayfasi } from './pages/KuluplerSayfasi';
import { KulupDetaySayfasi } from './pages/KulupDetaySayfasi';
import { BildirimlerSayfasi } from './pages/BildirimlerSayfasi';
import { OgrenciPaneli } from './pages/OgrenciPaneli';
import { KulupBaskaniPaneli } from './pages/KulupBaskaniPaneli';
import { KulupEtkinlikYonetimSayfasi } from './pages/KulupEtkinlikYonetimSayfasi';
import { SertifikaDogrulamaSayfasi } from './pages/SertifikaDogrulamaSayfasi';
import { TesisYonetimPaneli } from './pages/TesisYonetimPaneli';
import { TesisRezervasyonSayfasi } from './pages/TesisRezervasyonSayfasi';
import { RezervasyonlarimSayfasi } from './pages/RezervasyonlarimSayfasi';
import { YonetimPaneli } from './pages/YonetimPaneli';
import { DuyuruSayfasi } from './pages/DuyuruSayfasi';
import { useKimlikDeposu } from './depolar/kimlikDeposu';
import { useBildirimDeposu } from './depolar/bildirimDeposu';
import { useKulupDeposu } from './depolar/kulupDeposu';
import { OtomatikMesajTemizleyici } from './components/OtomatikMesajTemizleyici';
import { yetkilerdenBiriVarMi, YETKI_GRUPLARI } from './yardimcilar/yetkiler';
import { YOLLAR } from './yardimcilar/yollar';

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
  const user = useKimlikDeposu(state => state.user);
  const isAuthenticated = useKimlikDeposu(state => state.isAuthenticated);

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
  const user = useKimlikDeposu(state => state.user);
  const isStudent = yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.ogrenci);

  // Sistem yöneticisi kendi paneline yönlenir (SKS'ten ayrı)
  if (yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.sistemYonetimi)) {
    return <YonetimPaneli />;
  }

  if (yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.sksYonetimi)) {
    return <SksPaneli />;
  }

  if (yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.ogrenciIsleri)) {
    return <OgrenciIsleriPaneli />;
  }

  if (yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.tesisYonetimi)) {
    return <TesisYonetimPaneli />;
  }

  if (isStudent) {
    return <OgrenciPaneli />;
  }

  return <OgrenciPaneli />;
};

const ClubManagementRoute = () => {
  const managedClubs = useKulupDeposu(state => state.managedClubs);
  const fetchManagedClubs = useKulupDeposu(state => state.fetchManagedClubs);
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

  return <KulupBaskaniPaneli />;
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
  const isAuthenticated = useKimlikDeposu(state => state.isAuthenticated);
  const user = useKimlikDeposu(state => state.user);
  const hasSession = isAuthenticated && !!user;
  const akisBaslat = useBildirimDeposu(state => state.akisBaslat);
  const akisDurdur = useBildirimDeposu(state => state.akisDurdur);

  // Oturum açıkken anlık bildirim akışını (SSE) başlat; çıkışta durdur.
  React.useEffect(() => {
    if (hasSession) {
      akisBaslat();
      return () => akisDurdur();
    }
  }, [hasSession, akisBaslat, akisDurdur]);

  return (
    <BrowserRouter>
      <OtomatikMesajTemizleyici />
      <Routes>
        {/* Auth — giriş sayfası */}
        <Route path={YOLLAR.giris} element={!hasSession ? <GirisSayfasi /> : <Navigate to={YOLLAR.anaSayfa} />} />
        <Route path="/login" element={<EskiYolYonlendirme yeniYol={YOLLAR.giris} />} />
        <Route path={YOLLAR.sertifikaDogrula} element={<SertifikaDogrulamaSayfasi />} />
        <Route path="/certificates/verify" element={<EskiYolYonlendirme yeniYol={YOLLAR.sertifikaDogrula} />} />

        {/* E-posta doğrulama — giriş yapmış ama doğrulanmamış */}
        <Route path={YOLLAR.epostaDogrula} element={
          hasSession && !user.epostaDogrulandi
            ? <EpostaDogrulama />
            : <Navigate to={hasSession ? YOLLAR.anaSayfa : YOLLAR.giris} />
        } />
        <Route path="/verify-email" element={<EskiYolYonlendirme yeniYol={YOLLAR.epostaDogrula} />} />

        {/* Şifre değiştirme — giriş yapmış ama ilk şifre değişikliği bekliyor */}
        <Route path={YOLLAR.sifreDegistir} element={
          hasSession && user.sifreDegistirmeli
            ? <SifreDegistir />
            : <Navigate to={hasSession ? YOLLAR.anaSayfa : YOLLAR.giris} />
        } />
        <Route path="/change-password" element={<EskiYolYonlendirme yeniYol={YOLLAR.sifreDegistir} />} />

        {/* Dashboard and other protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <UygulamaDuzeni>
              <DashboardRoute />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />

        <Route path={YOLLAR.yonetim} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.sistemYonetimi}>
            <UygulamaDuzeni>
              <YonetimPaneli />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />

        {/* Duyuru sayfası tüm kimliği doğrulanmış kullanıcılara açıktır; gönderim seçenekleri
            role/yönetilen-kulüplere göre belirlenir ve backend her uçta yetkiyi denetler. */}
        <Route path={YOLLAR.duyuru} element={
          <ProtectedRoute>
            <UygulamaDuzeni>
              <DuyuruSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />

        <Route path={YOLLAR.profil} element={
          <ProtectedRoute>
            <UygulamaDuzeni>
              <ProfilSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={<EskiYolYonlendirme yeniYol={YOLLAR.profil} />} />

        <Route path={YOLLAR.ayarlar} element={
          <ProtectedRoute>
            <UygulamaDuzeni>
              <AyarlarSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={<EskiYolYonlendirme yeniYol={YOLLAR.ayarlar} />} />

        <Route path={YOLLAR.kulupler} element={
          <ProtectedRoute>
            <UygulamaDuzeni>
              <KuluplerSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path="/clubs" element={<EskiYolYonlendirme yeniYol={YOLLAR.kulupler} />} />

        <Route path={YOLLAR.kulupDetay(':clubId')} element={
          <ProtectedRoute>
            <UygulamaDuzeni>
              <KulupDetaySayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path="/clubs/:clubId" element={<EskiKulupDetayYonlendirme />} />

        <Route path={YOLLAR.bildirimler} element={
          <ProtectedRoute>
            <UygulamaDuzeni>
              <BildirimlerSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={<EskiYolYonlendirme yeniYol={YOLLAR.bildirimler} />} />

        <Route path={YOLLAR.kulupYonetimi} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <UygulamaDuzeni>
              <ClubManagementRoute />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path="/club-management" element={<EskiYolYonlendirme yeniYol={YOLLAR.kulupYonetimi} />} />

        <Route path={YOLLAR.kulupEtkinlikYonetimi(':eventId')} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <UygulamaDuzeni>
              <KulupEtkinlikYonetimSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path="/club-management/events/:eventId" element={<EskiKulupEtkinlikYonlendirme />} />

        <Route path={YOLLAR.tesisYonetimi} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.tesisYonetimi}>
            <UygulamaDuzeni>
              <TesisYonetimPaneli />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path="/facility-management" element={<EskiYolYonlendirme yeniYol={YOLLAR.tesisYonetimi} />} />

        <Route path={YOLLAR.tesisRezervasyon} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <UygulamaDuzeni>
              <TesisRezervasyonSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={<EskiYolYonlendirme yeniYol={YOLLAR.tesisRezervasyon} />} />

        <Route path={YOLLAR.rezervasyonlarim} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <UygulamaDuzeni>
              <RezervasyonlarimSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path="/my-bookings" element={<EskiYolYonlendirme yeniYol={YOLLAR.rezervasyonlarim} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
