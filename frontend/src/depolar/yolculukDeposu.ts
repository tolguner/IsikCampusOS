import { create } from 'zustand';
import { api } from '../lib/api';

export type IlanDurumu = 'AKTIF' | 'DOLU' | 'IPTAL' | 'TAMAMLANDI';
export type UcretTipi = 'UCRETSIZ' | 'UCRETLI';
export type OdemeYontemi = 'YOK' | 'NAKIT' | 'IBAN' | 'NAKIT_VEYA_IBAN';
export type TalepDurumu = 'BEKLEMEDE' | 'KABUL_EDILDI' | 'REDDEDILDI' | 'IPTAL' | 'TAMAMLANDI';
export type DogrulamaDurumu = 'BEKLEMEDE' | 'ONAYLANDI' | 'REDDEDILDI' | 'ASKIYA_ALINDI';
export type SikayetDurumu = 'ACIK' | 'INCELEMEDE' | 'COZULDU' | 'REDDEDILDI' | 'YAPTIRIM_UYGULANDI';

export interface Nokta {
  ad: string;
  enlem: number;
  boylam: number;
}

export interface RotaDuragi extends Nokta {
  id?: string;
  sira?: number;
  tahminiDakika: number;
}

/** Haritada gösterilen bir rota seçeneği (OSRM alternatifi). İlk sıradaki en iyi/ana rotadır. */
export interface RotaSecenek {
  polyline: string;
  toplamDakika: number;
  mesafeKm: number;
  osrmKullanildi: boolean;
}

export interface YolculukIlani {
  id: string;
  surucuKullaniciId: string;
  baslangicBasligi: string;
  baslangicEnlem: number;
  baslangicBoylam: number;
  varisBasligi: string;
  varisEnlem: number;
  varisBoylam: number;
  kalkisZamani: string;
  koltukSayisi: number;
  kabulEdilenKoltukSayisi: number;
  durum: IlanDurumu;
  ucretTipi: UcretTipi;
  odemeYontemi: OdemeYontemi;
  kisiBasiUcret?: number;
  iban?: string;
  aciklama?: string;
  araDurakKabulEdilir: boolean;
  tahminiToplamDakika?: number;
  tahminiMesafeKm?: number;
  uygunlukSkoru?: number;
  aracId?: string;
  duraklar?: RotaDuragi[];
}

export interface YolculukTalebi {
  id: string;
  ilanId: string;
  yolcuKullaniciId: string;
  binisBasligi: string;
  inisBasligi: string;
  koltukSayisi: number;
  tahminiBinisDakika?: number;
  tahminiInisDakika?: number;
  mesaj?: string;
  redNedeni?: string;
  durum: TalepDurumu;
  olusturulmaTarihi: string;
}

/** Başvuran kimliği — yönetim panelinde gösterilir (auth-service'ten çözülür). */
export interface BasvuranBilgi {
  basvuranAdSoyad?: string;
  basvuranOgrenciNo?: string;
  basvuranTelefon?: string;
  basvuranEposta?: string;
}

export interface SurucuDogrulama extends BasvuranBilgi {
  id: string;
  kullaniciId: string;
  ehliyetSinifi: string;
  ehliyetNo?: string;
  ehliyetSahibiAdSoyad?: string;
  verilisTarihi?: string;
  gecerlilikTarihi?: string;
  belgeUrl?: string;
  durum: DogrulamaDurumu;
  adminNotu?: string;
}

export type AracDurumu = 'BEKLEMEDE' | 'ONAYLANDI' | 'REDDEDILDI' | 'PASIF';

export interface Arac extends BasvuranBilgi {
  id: string;
  kullaniciId: string;
  marka?: string;
  model?: string;
  aracTipi?: string;
  modelYili?: number;
  markaModel: string;
  plaka: string;
  renk?: string;
  koltukKapasitesi?: number;
  gorselUrl: string;
  durum: AracDurumu;
  adminNotu?: string;
  olusturulmaTarihi?: string;
}

export interface AracFormu {
  marka?: string;
  model?: string;
  aracTipi?: string;
  modelYili?: number;
  markaModel?: string;
  plaka: string;
  renk?: string;
  koltukKapasitesi?: number;
  gorselUrl: string;
}

export interface DogrulamaFormu {
  ehliyetSinifi: string;
  ehliyetNo?: string;
  verilisTarihi?: string;
  gecerlilikTarihi?: string;
  belgeUrl: string;
}

export interface EhliyetAnalizSonucu {
  ehliyet: boolean;
  sinif?: string | null;
  ehliyetNo?: string | null;
  verilisTarihi?: string | null;
  gecerlilikTarihi?: string | null;
  analizYapildi: boolean;
  mesaj?: string;
}

export interface Sikayet {
  id: string;
  talepId: string;
  sikayetciKullaniciId: string;
  hedefKullaniciId: string;
  sikayetciAdSoyad?: string;
  sikayetciOgrenciNo?: string;
  hedefAdSoyad?: string;
  neden: string;
  aciklama: string;
  durum: SikayetDurumu;
  adminNotu?: string;
  olusturulmaTarihi: string;
}

export interface YolculukIlaniFormu {
  aracId: string;
  baslangic: Nokta;
  varis: Nokta;
  kalkisZamani: string;
  koltukSayisi: number;
  ucretTipi: UcretTipi;
  odemeYontemi: OdemeYontemi;
  kisiBasiUcret?: number;
  iban?: string;
  aciklama?: string;
  araDurakKabulEdilir: boolean;
  rotaPolyline?: string;
  tahminiToplamDakika?: number;
  tahminiMesafeKm?: number;
  duraklar: RotaDuragi[];
}

interface YolculukState {
  ilanlar: YolculukIlani[];
  benimIlanlarim: YolculukIlani[];
  taleplerim: YolculukTalebi[];
  surucuTalepleri: YolculukTalebi[];
  dogrulama: SurucuDogrulama | null;
  adminDogrulamalar: SurucuDogrulama[];
  sikayetler: Sikayet[];
  populerNoktalar: Nokta[];
  araclar: Arac[];
  bekleyenAraclar: Arac[];
  isLoading: boolean;
  hata: string | null;
  basariMesaji: string | null;

  temizleMesajlar: () => void;
  populerNoktalariGetir: () => Promise<void>;
  ilanAra: (params: Record<string, string | number | boolean | undefined>) => Promise<void>;
  ilanOlustur: (form: YolculukIlaniFormu) => Promise<boolean>;
  benimVerilerimiGetir: () => Promise<void>;
  dogrulamaBasvur: (form: DogrulamaFormu) => Promise<boolean>;
  ehliyetAnaliz: (gorsel: string) => Promise<EhliyetAnalizSonucu>;
  araclarimGetir: () => Promise<void>;
  aracMarkalariGetir: () => Promise<string[]>;
  aracModelleriGetir: (marka: string) => Promise<string[]>;
  aracEkle: (form: AracFormu) => Promise<boolean>;
  aracGuncelle: (id: string, form: AracFormu) => Promise<boolean>;
  aracSil: (id: string) => Promise<void>;
  rotaOnizle: (noktalar: { enlem: number; boylam: number }[]) => Promise<RotaSecenek[]>;
  ilanaKatil: (ilanId: string, binis: Nokta, inis: Nokta, mesaj?: string) => Promise<boolean>;
  talepKabul: (talepId: string) => Promise<void>;
  talepRed: (talepId: string, neden?: string) => Promise<void>;
  talepIptal: (talepId: string) => Promise<void>;
  talepTamamla: (talepId: string) => Promise<void>;
  puanla: (talepId: string, puan: number, yorum?: string) => Promise<void>;
  sikayetEt: (talepId: string, neden: string, aciklama: string) => Promise<void>;
  adminVerileriniGetir: () => Promise<void>;
  dogrulamaIncele: (id: string, durum: DogrulamaDurumu, not?: string) => Promise<void>;
  aracIncele: (id: string, durum: AracDurumu, not?: string) => Promise<void>;
  sikayetIncele: (id: string, durum: SikayetDurumu, not?: string) => Promise<void>;
}

const hataMesaji = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const useYolculukDeposu = create<YolculukState>((set, get) => ({
  ilanlar: [],
  benimIlanlarim: [],
  taleplerim: [],
  surucuTalepleri: [],
  dogrulama: null,
  adminDogrulamalar: [],
  sikayetler: [],
  populerNoktalar: [],
  araclar: [],
  bekleyenAraclar: [],
  isLoading: false,
  hata: null,
  basariMesaji: null,

  temizleMesajlar: () => set({ hata: null, basariMesaji: null }),

  populerNoktalariGetir: async () => {
    try {
      const res = await api.get<{ ad: string; enlem: number; boylam: number }[]>('/yolculuklar/populer-noktalar');
      set({ populerNoktalar: res.data.map(p => ({ ad: p.ad, enlem: p.enlem, boylam: p.boylam })) });
    } catch { /* sessiz */ }
  },

  ilanAra: async (params) => {
    set({ isLoading: true, hata: null });
    try {
      const res = await api.get<YolculukIlani[]>('/yolculuklar/ilanlar', { params });
      set({ ilanlar: res.data, isLoading: false });
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Yolculuk ilanları yüklenemedi.'), isLoading: false });
    }
  },

  ilanOlustur: async (form) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      await api.post('/yolculuklar/ilanlar', form);
      set({ isLoading: false, basariMesaji: 'Yolculuk ilanı oluşturuldu.' });
      await get().benimVerilerimiGetir();
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Yolculuk ilanı oluşturulamadı.'), isLoading: false });
      return false;
    }
  },

  benimVerilerimiGetir: async () => {
    set({ isLoading: true, hata: null });
    try {
      const [ilanlar, talepler, surucuTalepleri, dogrulama] = await Promise.all([
        api.get<YolculukIlani[]>('/yolculuklar/ilanlar/benim'),
        api.get<YolculukTalebi[]>('/yolculuklar/talepler/benim'),
        api.get<YolculukTalebi[]>('/yolculuklar/surucu/talepler'),
        api.get<SurucuDogrulama | null>('/yolculuklar/surucu-dogrulama').catch(() => ({ data: null })),
      ]);
      set({
        benimIlanlarim: ilanlar.data,
        taleplerim: talepler.data,
        surucuTalepleri: surucuTalepleri.data,
        dogrulama: dogrulama.data,
        isLoading: false,
      });
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Yolculuk verileriniz yüklenemedi.'), isLoading: false });
    }
  },

  dogrulamaBasvur: async (form) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      const res = await api.post<SurucuDogrulama>('/yolculuklar/surucu-dogrulama', form);
      const otomatik = res.data?.durum === 'ONAYLANDI';
      set({
        dogrulama: res.data, isLoading: false,
        basariMesaji: otomatik
          ? 'Kimlik bilgileri eşleşti; ehliyetiniz otomatik onaylandı.'
          : 'Sürücü doğrulama başvurusu gönderildi; yönetici onayı bekleniyor.',
      });
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Doğrulama başvurusu gönderilemedi.'), isLoading: false });
      return false;
    }
  },

  araclarimGetir: async () => {
    try {
      const res = await api.get<Arac[]>('/yolculuklar/araclar');
      set({ araclar: res.data });
    } catch { /* sessiz */ }
  },

  ehliyetAnaliz: async (gorsel) => {
    try {
      const res = await api.post<EhliyetAnalizSonucu>('/yolculuklar/ehliyet-analiz', { gorsel });
      return res.data;
    } catch {
      return { ehliyet: false, analizYapildi: false, mesaj: 'Analiz yapılamadı; alanları elle girebilirsiniz.' };
    }
  },

  aracMarkalariGetir: async () => {
    try {
      const res = await api.get<string[]>('/yolculuklar/arac-veri/markalar');
      return res.data || [];
    } catch { return []; }
  },

  aracModelleriGetir: async (marka) => {
    try {
      const res = await api.get<string[]>(`/yolculuklar/arac-veri/modeller?marka=${encodeURIComponent(marka)}`);
      return res.data || [];
    } catch { return []; }
  },

  aracEkle: async (form) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      await api.post('/yolculuklar/araclar', form);
      set({ isLoading: false, basariMesaji: 'Araç eklendi; yönetici onayına gönderildi.' });
      await get().araclarimGetir();
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Araç eklenemedi.'), isLoading: false });
      return false;
    }
  },

  aracGuncelle: async (id, form) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      await api.put(`/yolculuklar/araclar/${id}`, form);
      set({ isLoading: false, basariMesaji: 'Araç güncellendi; yeniden onaya gönderildi.' });
      await get().araclarimGetir();
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Araç güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  aracSil: async (id) => {
    try {
      await api.delete(`/yolculuklar/araclar/${id}`);
      set({ basariMesaji: 'Araç silindi.' });
      await get().araclarimGetir();
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Araç silinemedi.') });
    }
  },

  rotaOnizle: async (noktalar) => {
    try {
      const res = await api.post<RotaSecenek[]>('/yolculuklar/rota-onizleme', { noktalar });
      return (res.data ?? []).filter(r => !!r.polyline);
    } catch {
      return [];
    }
  },

  ilanaKatil: async (ilanId, binis, inis, mesaj) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      await api.post(`/yolculuklar/ilanlar/${ilanId}/katil`, { binis, inis, koltukSayisi: 1, mesaj });
      set({ isLoading: false, basariMesaji: 'Katılım isteği sürücüye gönderildi.' });
      await get().benimVerilerimiGetir();
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Katılım isteği gönderilemedi.'), isLoading: false });
      return false;
    }
  },

  talepKabul: async (talepId) => {
    await api.post(`/yolculuklar/talepler/${talepId}/kabul`);
    await get().benimVerilerimiGetir();
  },

  talepRed: async (talepId, neden) => {
    await api.post(`/yolculuklar/talepler/${talepId}/red`, { not: neden });
    await get().benimVerilerimiGetir();
  },

  talepIptal: async (talepId) => {
    await api.post(`/yolculuklar/talepler/${talepId}/iptal`);
    await get().benimVerilerimiGetir();
  },

  talepTamamla: async (talepId) => {
    await api.post(`/yolculuklar/talepler/${talepId}/tamamla`);
    await get().benimVerilerimiGetir();
  },

  puanla: async (talepId, puan, yorum) => {
    await api.post(`/yolculuklar/talepler/${talepId}/puanla`, { puan, yorum });
    set({ basariMesaji: 'Puanlama kaydedildi.' });
  },

  sikayetEt: async (talepId, neden, aciklama) => {
    await api.post(`/yolculuklar/talepler/${talepId}/sikayet`, { neden, aciklama });
    set({ basariMesaji: 'Şikayet ilgili müdürlüğe iletildi.' });
  },

  adminVerileriniGetir: async () => {
    set({ isLoading: true, hata: null });
    try {
      const [dogrulamalar, araclar, sikayetler] = await Promise.all([
        api.get<SurucuDogrulama[]>('/yolculuk-yonetim/surucu-dogrulamalari/bekleyen'),
        api.get<Arac[]>('/yolculuk-yonetim/araclar/bekleyen'),
        api.get<Sikayet[]>('/yolculuk-yonetim/sikayetler'),
      ]);
      set({ adminDogrulamalar: dogrulamalar.data, bekleyenAraclar: araclar.data, sikayetler: sikayetler.data, isLoading: false });
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Yönetim verileri yüklenemedi.'), isLoading: false });
    }
  },

  dogrulamaIncele: async (id, durum, not) => {
    await api.post(`/yolculuk-yonetim/surucu-dogrulamalari/${id}/incele`, { durum, not });
    await get().adminVerileriniGetir();
  },

  aracIncele: async (id, durum, not) => {
    await api.post(`/yolculuk-yonetim/araclar/${id}/incele`, { durum, not });
    await get().adminVerileriniGetir();
  },

  sikayetIncele: async (id, durum, not) => {
    await api.post(`/yolculuk-yonetim/sikayetler/${id}/incele`, { durum, not });
    await get().adminVerileriniGetir();
  },
}));

export const DOGRULAMA_ETIKETLERI: Record<DogrulamaDurumu, string> = {
  BEKLEMEDE: 'İncelemede',
  ONAYLANDI: 'Onaylandı',
  REDDEDILDI: 'Reddedildi',
  ASKIYA_ALINDI: 'Askıya alındı',
};

export const TALEP_ETIKETLERI: Record<TalepDurumu, string> = {
  BEKLEMEDE: 'Beklemede',
  KABUL_EDILDI: 'Kabul edildi',
  REDDEDILDI: 'Reddedildi',
  IPTAL: 'İptal',
  TAMAMLANDI: 'Tamamlandı',
};

export const ARAC_ETIKETLERI: Record<AracDurumu, string> = {
  BEKLEMEDE: 'Onay bekliyor',
  ONAYLANDI: 'Onaylı',
  REDDEDILDI: 'Reddedildi',
  PASIF: 'Pasif',
};
