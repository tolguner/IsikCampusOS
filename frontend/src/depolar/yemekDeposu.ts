import { create } from 'zustand';
import { api } from '../lib/api';

export type SaticiDurumu = 'AKTIF' | 'PASIF';
export type MenuDurumu = 'AKTIF' | 'ARSIVLENDI';
export type OdemeYontemi = 'NAKIT' | 'KREDI_KARTI';
export type SiparisDurumu =
  | 'BEKLEMEDE' | 'KABUL_EDILDI' | 'HAZIRLANIYOR' | 'HAZIR'
  | 'YOLDA' | 'TESLIM_EDILDI' | 'REDDEDILDI' | 'IPTAL_EDILDI';

/** Bir günün çalışma saati (1=Pazartesi … 7=Pazar). */
export interface CalismaSaati {
  id?: string;
  saticiId?: string;
  gun: number;
  acilis?: string | null;   // "HH:mm:ss" veya "HH:mm"
  kapanis?: string | null;
  kapali: boolean;
}

/** Backend (food-service) yanıtları ile birebir — çeviri (mapper) yoktur. */
export interface Satici {
  id: string;
  ad: string;
  aciklama?: string;
  konumMetni?: string;
  logoUrl?: string;
  yoneticiKullaniciId?: string;
  mutfakTuru?: string;
  kapakGorselUrl?: string;
  teslimatUcreti?: number;
  minimumSepetTutari?: number;
  tahminiTeslimatDakika?: number | null;
  acik: boolean;
  durum: SaticiDurumu;
  // /saticilar ve /saticilar/{id} yanıtında hesaplanmış alanlar:
  suAnAcik?: boolean;
  sonrakiAcilis?: string | null;
  yogunlukEkDakika?: number;     // >0 ise işletme yoğun, tahmini süreye eklenmiş
  calismaSaatleri?: CalismaSaati[];
  olusturulmaTarihi?: string;
  guncellenmeTarihi?: string;
}

export type SecenekTuru = 'TEK_SECIM' | 'COKLU_SECIM';

export interface MenuSecenegi {
  id: string;
  ad: string;
  ekFiyat: number;
  siralama?: number;
}

export interface MenuSecenekGrubu {
  id: string;
  ad: string;
  tur: SecenekTuru;
  zorunlu: boolean;
  siralama?: number;
  secenekler: MenuSecenegi[];
}

export interface MenuOgesi {
  id: string;
  saticiId: string;
  ad: string;
  aciklama?: string;
  kategori?: string;
  fiyat: number;
  gorselUrl?: string;
  etiketler?: string | null;    // allerjen/içerik CSV (örn. "VEGAN,ACILI")
  mevcut: boolean;
  oneCikan?: boolean;
  durum: MenuDurumu;
  secenekGruplari?: MenuSecenekGrubu[];
}

export interface SiparisKalemi {
  id: string;
  menuOgesiId: string;
  urunAdi: string;
  birimFiyat: number;
  adet: number;
  araToplam: number;
  secimlerOzeti?: string;
}

export type KampanyaTuru = 'YUZDE' | 'TUTAR' | 'UCRETSIZ_TESLIMAT';

export interface Kampanya {
  id: string;
  saticiId: string;
  ad: string;
  tur: KampanyaTuru;
  deger: number;
  minSepetTutari: number;
  aktif: boolean;
}

export interface Siparis {
  id: string;
  saticiId: string;
  musteriKullaniciId: string;
  durum: SiparisDurumu;
  araToplam?: number;
  teslimatUcreti?: number;
  indirimTutari?: number;
  kampanyaId?: string;
  toplamTutar: number;
  teslimAdresi: string;
  odemeYontemi: OdemeYontemi;
  tahsilEdilenOdeme?: OdemeYontemi;
  musteriNotu?: string;
  telefon?: string;
  redNedeni?: string;
  tahminiHazirDakika?: number;
  olusturulmaTarihi: string;
  kabulTarihi?: string;
  hazirTarihi?: string;
  yolaCikisTarihi?: string;
  teslimTarihi?: string;
  iptalTarihi?: string;
  isleyenKullaniciId?: string | null;
  isleyenAdi?: string | null;
  teslimatTuru?: TeslimatTuru;
  kuryeKullaniciId?: string | null;
  kalemler: SiparisKalemi[];
}

/** Sepet kalemi (yalnızca istemci tarafı). */
export interface SepetKalemi {
  sepetId: string;            // istemci tarafı benzersiz satır kimliği
  menuOgesiId: string;
  ad: string;
  birimFiyat: number;         // ürün fiyatı + seçilen opsiyon ek fiyatları
  adet: number;
  secilenSecenekIdleri?: string[];
  secimlerOzeti?: string;     // "Büyük, Ekstra peynir"
}

export type TeslimatTuru = 'ADRESE_TESLIMAT' | 'GEL_AL';

export interface SiparisTalebi {
  teslimAdresi: string;
  odemeYontemi: OdemeYontemi;
  teslimatTuru?: TeslimatTuru;
  telefon?: string;
  musteriNotu?: string;
}

export interface SaticiFiltre {
  ara?: string;
  mutfak?: string;
  sirala?: string;
}

interface YemekState {
  saticilar: Satici[];
  mutfakTurleri: string[];
  favoriIdleri: string[];
  seciliSatici: Satici | null;
  menu: MenuOgesi[];
  siparisler: Siparis[];
  sepet: SepetKalemi[];
  sepetSaticiId: string | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  clearMessages: () => void;
  saticilariGetir: (filtre?: SaticiFiltre) => Promise<void>;
  mutfakTurleriGetir: () => Promise<void>;
  favorileriGetir: () => Promise<void>;
  favoriToggle: (saticiId: string) => Promise<void>;
  menuGetir: (satici: Satici) => Promise<void>;
  seciliSaticiyiTemizle: () => void;

  // Sepet (istemci tarafı)
  sepeteEkle: (satici: Satici, oge: MenuOgesi, secilenSecenekIdleri?: string[], secimlerOzeti?: string, birimFiyat?: number) => void;
  adetDegistir: (sepetId: string, adet: number) => void;
  sepettenCikar: (sepetId: string) => void;
  sepetiTemizle: () => void;
  sepetToplami: () => number;

  // Sipariş
  siparisVer: (saticiId: string, talep: SiparisTalebi) => Promise<boolean>;
  siparisOnizle: (saticiId: string, teslimatTuru?: TeslimatTuru) => Promise<SiparisOnizleme | null>;
  siparislerimGetir: () => Promise<void>;
  siparisIptal: (siparisId: string) => Promise<boolean>;
}

/** Sipariş öncesi gerçek tutar dökümü (backend hesaplar, kampanya dahil). */
export interface SiparisOnizleme {
  araToplam: number;
  teslimatUcreti: number;
  indirimTutari: number;
  kampanyaAd?: string | null;
  toplamTutar: number;
  minimumSepetTutari: number;
  minimumKarsilandi: boolean;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const useYemekDeposu = create<YemekState>((set, get) => ({
  saticilar: [],
  mutfakTurleri: [],
  favoriIdleri: [],
  seciliSatici: null,
  menu: [],
  siparisler: [],
  sepet: [],
  sepetSaticiId: null,
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  saticilariGetir: async (filtre) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filtre?.ara) params.append('ara', filtre.ara);
      if (filtre?.mutfak) params.append('mutfak', filtre.mutfak);
      if (filtre?.sirala) params.append('sirala', filtre.sirala);
      const qs = params.toString();
      const res = await api.get<Satici[]>(`/saticilar${qs ? `?${qs}` : ''}`);
      set({ saticilar: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Satıcılar yüklenemedi.'), isLoading: false });
    }
  },

  mutfakTurleriGetir: async () => {
    try {
      const res = await api.get<string[]>('/saticilar/mutfak-turleri');
      set({ mutfakTurleri: res.data });
    } catch {
      // sessiz
    }
  },

  favorileriGetir: async () => {
    try {
      const res = await api.get<string[]>('/favoriler');
      set({ favoriIdleri: res.data });
    } catch {
      // sessiz
    }
  },

  favoriToggle: async (saticiId) => {
    const favori = get().favoriIdleri.includes(saticiId);
    // İyimser güncelle
    set({ favoriIdleri: favori ? get().favoriIdleri.filter(id => id !== saticiId) : [...get().favoriIdleri, saticiId] });
    try {
      if (favori) await api.delete(`/favoriler/${saticiId}`);
      else await api.post(`/favoriler/${saticiId}`);
    } catch {
      // Hata olursa geri al
      get().favorileriGetir();
    }
  },

  menuGetir: async (satici) => {
    set({ isLoading: true, error: null, seciliSatici: satici, menu: [] });
    try {
      const res = await api.get<MenuOgesi[]>(`/saticilar/${satici.id}/menu`);
      set({ menu: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Menü yüklenemedi.'), isLoading: false });
    }
  },

  seciliSaticiyiTemizle: () => set({ seciliSatici: null, menu: [] }),

  sepeteEkle: (satici, oge, secilenSecenekIdleri, secimlerOzeti, birimFiyat) => {
    const fiyat = birimFiyat ?? oge.fiyat;
    const yeniKalem: SepetKalemi = {
      sepetId: `${oge.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      menuOgesiId: oge.id, ad: oge.ad, birimFiyat: fiyat, adet: 1,
      secilenSecenekIdleri, secimlerOzeti,
    };
    const { sepet, sepetSaticiId } = get();
    // Farklı satıcıdan ekleniyorsa sepeti sıfırla (tek satıcı kuralı).
    if (sepetSaticiId && sepetSaticiId !== satici.id) {
      set({ sepet: [yeniKalem], sepetSaticiId: satici.id });
      return;
    }
    // Aynı ürün + aynı seçimler → adet artır; yoksa yeni satır.
    const ayniImza = (k: SepetKalemi) =>
      k.menuOgesiId === oge.id && (k.secimlerOzeti ?? '') === (secimlerOzeti ?? '');
    const mevcut = sepet.find(ayniImza);
    if (mevcut) {
      set({ sepet: sepet.map(k => k.sepetId === mevcut.sepetId ? { ...k, adet: k.adet + 1 } : k) });
    } else {
      set({ sepet: [...sepet, yeniKalem], sepetSaticiId: satici.id });
    }
  },

  adetDegistir: (sepetId, adet) => {
    if (adet <= 0) { get().sepettenCikar(sepetId); return; }
    set({ sepet: get().sepet.map(k => k.sepetId === sepetId ? { ...k, adet } : k) });
  },

  sepettenCikar: (sepetId) => {
    const yeni = get().sepet.filter(k => k.sepetId !== sepetId);
    set({ sepet: yeni, sepetSaticiId: yeni.length ? get().sepetSaticiId : null });
  },

  sepetiTemizle: () => set({ sepet: [], sepetSaticiId: null }),

  sepetToplami: () => get().sepet.reduce((t, k) => t + k.birimFiyat * k.adet, 0),

  siparisVer: async (saticiId, talep) => {
    const { sepet } = get();
    if (!sepet.length) {
      set({ error: 'Sepetiniz boş.' });
      return false;
    }
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post('/siparisler', {
        saticiId,
        teslimAdresi: talep.teslimAdresi,
        odemeYontemi: talep.odemeYontemi,
        teslimatTuru: talep.teslimatTuru,
        telefon: talep.telefon,
        musteriNotu: talep.musteriNotu,
        kalemler: sepet.map(k => ({ menuOgesiId: k.menuOgesiId, adet: k.adet, secilenSecenekIdleri: k.secilenSecenekIdleri })),
      });
      set({ successMessage: 'Siparişiniz alındı! Durumu "Siparişlerim" sayfasından takip edebilirsiniz.', isLoading: false, sepet: [], sepetSaticiId: null });
      await get().siparislerimGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Sipariş oluşturulamadı.'), isLoading: false });
      return false;
    }
  },

  siparisOnizle: async (saticiId, teslimatTuru) => {
    const { sepet } = get();
    if (!sepet.length) return null;
    try {
      const res = await api.post<SiparisOnizleme>('/siparisler/onizleme', {
        saticiId,
        teslimatTuru,
        kalemler: sepet.map(k => ({ menuOgesiId: k.menuOgesiId, adet: k.adet, secilenSecenekIdleri: k.secilenSecenekIdleri })),
      });
      return res.data;
    } catch {
      return null; // önizleme alınamazsa modal yerel hesapla devam eder
    }
  },

  siparislerimGetir: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Siparis[]>('/siparisler/benim');
      set({ siparisler: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Siparişleriniz yüklenemedi.'), isLoading: false });
    }
  },

  siparisIptal: async (siparisId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/siparisler/${siparisId}/iptal`);
      set({ successMessage: 'Sipariş iptal edildi.', isLoading: false });
      await get().siparislerimGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Sipariş iptal edilemedi.'), isLoading: false });
      return false;
    }
  },
}));

/** Sipariş durumu için Türkçe etiket ve renk sınıfı. */
export const SIPARIS_DURUM_BILGISI: Record<SiparisDurumu, { etiket: string; renk: string }> = {
  BEKLEMEDE: { etiket: 'Onay Bekliyor', renk: 'text-amber-200 bg-amber-500/15 border-amber-400/20' },
  KABUL_EDILDI: { etiket: 'Onaylandı', renk: 'text-cyan-200 bg-cyan-500/15 border-cyan-400/20' },
  HAZIRLANIYOR: { etiket: 'Hazırlanıyor', renk: 'text-blue-200 bg-blue-500/15 border-blue-400/20' },
  HAZIR: { etiket: 'Hazır', renk: 'text-indigo-200 bg-indigo-500/15 border-indigo-400/20' },
  YOLDA: { etiket: 'Yolda', renk: 'text-purple-200 bg-purple-500/15 border-purple-400/20' },
  TESLIM_EDILDI: { etiket: 'Teslim Edildi', renk: 'text-emerald-200 bg-emerald-500/15 border-emerald-400/20' },
  REDDEDILDI: { etiket: 'Reddedildi', renk: 'text-red-300 bg-red-500/15 border-red-400/20' },
  IPTAL_EDILDI: { etiket: 'İptal Edildi', renk: 'text-white/50 bg-white/5 border-white/10' },
};
