import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { UygulamaDuzeni } from './components/duzen/UygulamaDuzeni';
import { TemaUygulayici } from './components/duzen/TemaUygulayici';
import { useKimlikDeposu } from './depolar/kimlikDeposu';
import { useBildirimDeposu } from './depolar/bildirimDeposu';
import { useKulupDeposu } from './depolar/kulupDeposu';
import { OtomatikMesajTemizleyici } from './components/OtomatikMesajTemizleyici';
import { yetkilerdenBiriVarMi, YETKI_GRUPLARI } from './yardimcilar/yetkiler';
import { YOLLAR } from './yardimcilar/yollar';

// Sayfalar tembel (lazy) yüklenir: her sayfa kendi chunk'ına ayrılır ve yalnızca
// o rotaya girildiğinde indirilir. Böylece ilk açılışta tek parça dev bir bundle
// yerine sadece çekirdek + ilgili sayfa iner. Sayfalar named export verdiği için
// dinamik import sonucu `default` alanına eşlenir.
const GirisSayfasi = React.lazy(() => import('./pages/GirisSayfasi').then(m => ({ default: m.GirisSayfasi })));
const TanitimSayfasi = React.lazy(() => import('./pages/TanitimSayfasi').then(m => ({ default: m.TanitimSayfasi })));
const EpostaDogrulama = React.lazy(() => import('./pages/EpostaDogrulama').then(m => ({ default: m.EpostaDogrulama })));
const SifreDegistir = React.lazy(() => import('./pages/SifreDegistir').then(m => ({ default: m.SifreDegistir })));
const OgrenciIsleriPaneli = React.lazy(() => import('./pages/OgrenciIsleriPaneli').then(m => ({ default: m.OgrenciIsleriPaneli })));
const SksPaneli = React.lazy(() => import('./pages/SksPaneli').then(m => ({ default: m.SksPaneli })));
const ProfilSayfasi = React.lazy(() => import('./pages/ProfilSayfasi').then(m => ({ default: m.ProfilSayfasi })));
const AyarlarSayfasi = React.lazy(() => import('./pages/AyarlarSayfasi').then(m => ({ default: m.AyarlarSayfasi })));
const MesajlarSayfasi = React.lazy(() => import('./pages/MesajlarSayfasi').then(m => ({ default: m.MesajlarSayfasi })));
const KuluplerSayfasi = React.lazy(() => import('./pages/KuluplerSayfasi').then(m => ({ default: m.KuluplerSayfasi })));
const KulupDetaySayfasi = React.lazy(() => import('./pages/KulupDetaySayfasi').then(m => ({ default: m.KulupDetaySayfasi })));
const BildirimlerSayfasi = React.lazy(() => import('./pages/BildirimlerSayfasi').then(m => ({ default: m.BildirimlerSayfasi })));
const OgrenciPaneli = React.lazy(() => import('./pages/OgrenciPaneli').then(m => ({ default: m.OgrenciPaneli })));
const KulupBaskaniPaneli = React.lazy(() => import('./pages/KulupBaskaniPaneli').then(m => ({ default: m.KulupBaskaniPaneli })));
const KulupEtkinlikYonetimSayfasi = React.lazy(() => import('./pages/KulupEtkinlikYonetimSayfasi').then(m => ({ default: m.KulupEtkinlikYonetimSayfasi })));
const SertifikaDogrulamaSayfasi = React.lazy(() => import('./pages/SertifikaDogrulamaSayfasi').then(m => ({ default: m.SertifikaDogrulamaSayfasi })));
const TesisYonetimPaneli = React.lazy(() => import('./pages/TesisYonetimPaneli').then(m => ({ default: m.TesisYonetimPaneli })));
const TesisRezervasyonSayfasi = React.lazy(() => import('./pages/TesisRezervasyonSayfasi').then(m => ({ default: m.TesisRezervasyonSayfasi })));
const RezervasyonlarimSayfasi = React.lazy(() => import('./pages/RezervasyonlarimSayfasi').then(m => ({ default: m.RezervasyonlarimSayfasi })));
const YonetimPaneli = React.lazy(() => import('./pages/YonetimPaneli').then(m => ({ default: m.YonetimPaneli })));
const DuyuruSayfasi = React.lazy(() => import('./pages/DuyuruSayfasi').then(m => ({ default: m.DuyuruSayfasi })));
const YemekSayfasi = React.lazy(() => import('./pages/YemekSayfasi').then(m => ({ default: m.YemekSayfasi })));
const YemekSiparislerimSayfasi = React.lazy(() => import('./pages/YemekSiparislerimSayfasi').then(m => ({ default: m.YemekSiparislerimSayfasi })));
const IsletmePaneli = React.lazy(() => import('./pages/IsletmePaneli').then(m => ({ default: m.IsletmePaneli })));
const CampusRideSayfasi = React.lazy(() => import('./pages/CampusRideSayfasi').then(m => ({ default: m.CampusRideSayfasi })));
const RideYonetimPaneli = React.lazy(() => import('./pages/RideYonetimPaneli').then(m => ({ default: m.RideYonetimPaneli })));
const DestekHizmetleriPaneli = React.lazy(() => import('./pages/DestekHizmetleriPaneli').then(m => ({ default: m.DestekHizmetleriPaneli })));

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

  if (yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.isletmePaneli)) {
    return <IsletmePaneli />;
  }

  if (yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.isletmeYonetimiPaneli)) {
    return <DestekHizmetleriPaneli />;
  }

  if (yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.rideYonetimi)) {
    return <RideYonetimPaneli />;
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
      <TemaUygulayici />
      <OtomatikMesajTemizleyici />
      <Routes>
        {/* Auth — giriş sayfası */}
        <Route path={YOLLAR.tanitim} element={<TanitimSayfasi />} />
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

        <Route path={YOLLAR.mesajlar} element={
          <ProtectedRoute>
            <UygulamaDuzeni>
              <MesajlarSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />

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

        <Route path={YOLLAR.yemek} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <UygulamaDuzeni>
              <YemekSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
        <Route path={YOLLAR.yemekSiparislerim} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <UygulamaDuzeni>
              <YemekSiparislerimSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />

        <Route path={YOLLAR.campusRide} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.ogrenci}>
            <UygulamaDuzeni>
              <CampusRideSayfasi />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />

        <Route path={YOLLAR.rideYonetimi} element={
          <ProtectedRoute izinliYetkiler={YETKI_GRUPLARI.rideYonetimi}>
            <UygulamaDuzeni>
              <RideYonetimPaneli />
            </UygulamaDuzeni>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
