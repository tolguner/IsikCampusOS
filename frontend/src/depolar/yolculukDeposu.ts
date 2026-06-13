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

export interface SurucuDogrulama {
  id: string;
  kullaniciId: string;
  ehliyetSinifi: string;
  aracMarkaModel: string;
  plaka: string;
  aracRengi?: string;
  koltukKapasitesi?: number;
  belgeUrl?: string;
  durum: DogrulamaDurumu;
  adminNotu?: string;
}

export interface Sikayet {
  id: string;
  talepId: string;
  sikayetciKullaniciId: string;
  hedefKullaniciId: string;
  neden: string;
  aciklama: string;
  durum: SikayetDurumu;
  adminNotu?: string;
  olusturulmaTarihi: string;
}

export interface YolculukIlaniFormu {
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
  isLoading: boolean;
  hata: string | null;
  basariMesaji: string | null;

  temizleMesajlar: () => void;
  populerNoktalariGetir: () => Promise<void>;
  ilanAra: (params: Record<string, string | number | boolean | undefined>) => Promise<void>;
  ilanOlustur: (form: YolculukIlaniFormu) => Promise<boolean>;
  benimVerilerimiGetir: () => Promise<void>;
  dogrulamaBasvur: (form: Partial<SurucuDogrulama>) => Promise<boolean>;
  ilanaKatil: (ilanId: string, binis: Nokta, inis: Nokta, mesaj?: string) => Promise<boolean>;
  talepKabul: (talepId: string) => Promise<void>;
  talepRed: (talepId: string, neden?: string) => Promise<void>;
  talepIptal: (talepId: string) => Promise<void>;
  talepTamamla: (talepId: string) => Promise<void>;
  puanla: (talepId: string, puan: number, yorum?: string) => Promise<void>;
  sikayetEt: (talepId: string, neden: string, aciklama: string) => Promise<void>;
  adminVerileriniGetir: () => Promise<void>;
  dogrulamaIncele: (id: string, durum: DogrulamaDurumu, not?: string) => Promise<void>;
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
      set({ dogrulama: res.data, isLoading: false, basariMesaji: 'Sürücü doğrulama başvurusu gönderildi.' });
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Doğrulama başvurusu gönderilemedi.'), isLoading: false });
      return false;
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
    set({ basariMesaji: 'Şikayet RideKampüs adminine iletildi.' });
  },

  adminVerileriniGetir: async () => {
    set({ isLoading: true, hata: null });
    try {
      const [dogrulamalar, sikayetler] = await Promise.all([
        api.get<SurucuDogrulama[]>('/yolculuk-yonetim/surucu-dogrulamalari/bekleyen'),
        api.get<Sikayet[]>('/yolculuk-yonetim/sikayetler'),
      ]);
      set({ adminDogrulamalar: dogrulamalar.data, sikayetler: sikayetler.data, isLoading: false });
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'RideKampüs yönetim verileri yüklenemedi.'), isLoading: false });
    }
  },

  dogrulamaIncele: async (id, durum, not) => {
    await api.post(`/yolculuk-yonetim/surucu-dogrulamalari/${id}/incele`, { durum, not });
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
