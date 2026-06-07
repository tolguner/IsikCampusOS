export const YETKILER = {
  SISTEM_YONETICISI: 'ROLE_ADMIN',
  OGRENCI: 'ROLE_STUDENT',
  OGRENCI_ISLERI: 'ROLE_REGISTRAR',
  SKS_YONETICISI: 'ROLE_SKS_ADMIN',
  TESIS_YONETICISI: 'ROLE_FACILITY_ADMIN',
} as const;

export const YETKI_GRUPLARI = {
  ogrenci: [YETKILER.OGRENCI],
  ogrenciIsleri: [YETKILER.OGRENCI_ISLERI],
  sksYonetimi: [YETKILER.SKS_YONETICISI, YETKILER.SISTEM_YONETICISI],
  tesisYonetimi: [YETKILER.TESIS_YONETICISI, YETKILER.SISTEM_YONETICISI],
  sistemYonetimi: [YETKILER.SISTEM_YONETICISI],
  // Öğrencilere/kullanıcılara toplu duyuru gönderebilen idari roller (öğrenci hariç).
  duyuruYetkilileri: [
    YETKILER.SISTEM_YONETICISI,
    YETKILER.OGRENCI_ISLERI,
    YETKILER.TESIS_YONETICISI,
    YETKILER.SKS_YONETICISI,
  ],
} as const;

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
