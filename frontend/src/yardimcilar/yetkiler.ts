export const YETKILER = {
  SISTEM_YONETICISI: 'ROLE_ADMIN',
  OGRENCI: 'ROLE_STUDENT',
  OGRENCI_ISLERI: 'ROLE_REGISTRAR',
  SKS_YONETICISI: 'ROLE_SKS_ADMIN',
  TESIS_YONETICISI: 'ROLE_FACILITY_ADMIN',
  ISLETME_YONETICISI: 'ROLE_VENDOR_ADMIN',
  ISLETME_PERSONELI: 'ROLE_VENDOR_STAFF',
  RIDE_YONETICISI: 'ROLE_RIDE_ADMIN',
  YAPI_LOJISTIK_ULASIM: 'ROLE_BUILDING_SUPPORT_ADMIN',
  DESTEK_HIZMETLERI: 'ROLE_SUPPORT_SERVICES_ADMIN',
} as const;

export const YETKI_GRUPLARI = {
  ogrenci: [YETKILER.OGRENCI],
  ogrenciIsleri: [YETKILER.OGRENCI_ISLERI],
  // Sistem yöneticisi YALNIZ kendi paneline erişir; SKS/Tesis panellerine girmez.
  sksYonetimi: [YETKILER.SKS_YONETICISI],
  tesisYonetimi: [YETKILER.TESIS_YONETICISI],
  sistemYonetimi: [YETKILER.SISTEM_YONETICISI],
  // İşletme paneline giriş: sahip + personel (panel içi sekmeler role göre filtrelenir)
  isletmePaneli: [YETKILER.ISLETME_YONETICISI, YETKILER.ISLETME_PERSONELI],
  // CampusRide onayları: RideKampüs Yöneticisi + Yapı, Lojistik ve Ulaşım Hizmetleri Müdürlüğü
  // (Sistem yöneticisi DAHİL DEĞİL — admin yalnız kendi sistem paneline erişir.)
  rideYonetimi: [YETKILER.RIDE_YONETICISI, YETKILER.YAPI_LOJISTIK_ULASIM],
  // UniEats işletme yönetimi paneli (işletme/sahip/personel CRUD): Destek Hizmetleri Müdürlüğü
  isletmeYonetimiPaneli: [YETKILER.DESTEK_HIZMETLERI],
  // Sahip-özel işlemler (menü/ayar/kampanya/ciro/personel yönetimi)
  isletmeYonetimi: [YETKILER.ISLETME_YONETICISI],
  // Öğrencilere/kullanıcılara toplu duyuru gönderebilen idari roller (öğrenci hariç).
  duyuruYetkilileri: [
    YETKILER.SISTEM_YONETICISI,
    YETKILER.OGRENCI_ISLERI,
    YETKILER.TESIS_YONETICISI,
    YETKILER.SKS_YONETICISI,
  ],
} as const;

/** Rol kodu → Türkçe etiket (tüm panellerde ortak kullanılır). */
export const ROL_ETIKETLERI: Record<string, string> = {
  ROLE_ADMIN: 'Sistem Yöneticisi',
  ROLE_SKS_ADMIN: 'Akademik, Sosyal ve Kültürel Gelişim Koordinatörlüğü',
  ROLE_FACILITY_ADMIN: 'Spor Müdürlüğü',
  ROLE_REGISTRAR: 'Öğrenci İşleri Daire Başkanlığı',
  ROLE_VENDOR_ADMIN: 'İşletme Yöneticisi',
  ROLE_VENDOR_STAFF: 'İşletme Personeli',
  ROLE_RIDE_ADMIN: 'RideKampüs Yöneticisi',
  ROLE_BUILDING_SUPPORT_ADMIN: 'Yapı, Lojistik ve Ulaşım Hizmetleri Müdürlüğü',
  ROLE_SUPPORT_SERVICES_ADMIN: 'Destek Hizmetleri Müdürlüğü',
  ROLE_STUDENT: 'Öğrenci',
};

export const rolEtiketle = (roller?: string | null) =>
  (roller ?? '')
    .split(',')
    .map(r => ROL_ETIKETLERI[r.trim()] || r.trim())
    .filter(Boolean)
    .join(', ');

export const rolleriAyir = (roller?: string | null) =>
  (roller ?? '')
    .split(',')
    .map(rol => rol.trim())
    .filter(Boolean);

export const yetkilerdenBiriVarMi = (
  roller: string | undefined | null,
  izinliYetkiler: readonly string[],
) => {
  const atanmisYetkiler = rolleriAyir(roller);
  return izinliYetkiler.some(yetki => atanmisYetkiler.includes(yetki));
};
