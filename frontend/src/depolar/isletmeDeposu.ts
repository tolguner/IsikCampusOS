import { create } from 'zustand';
import { api } from '../lib/api';
import type { Satici, MenuOgesi, Siparis, OdemeYontemi, CalismaSaati, Kampanya, KampanyaTuru } from './yemekDeposu';

export interface KampanyaFormu {
  ad: string;
  tur: KampanyaTuru;
  deger?: number;
  minSepetTutari?: number;
  aktif?: boolean;
}

export interface SecenekFormu {
  ad: string;
  ekFiyat: number;
  siralama?: number;
}
export interface SecenekGrubuFormu {
  ad: string;
  tur: 'TEK_SECIM' | 'COKLU_SECIM';
  zorunlu: boolean;
  siralama?: number;
  secenekler: SecenekFormu[];
}

export interface MenuOgesiFormu {
  ad: string;
  aciklama?: string;
  kategori?: string;
  fiyat: number;
  gorselUrl?: string;
  mevcut?: boolean;
  oneCikan?: boolean;
  secenekGruplari?: SecenekGrubuFormu[];
}

export interface SaticiAyarFormu {
  ad?: string;
  aciklama?: string;
  konumMetni?: string;
  logoUrl?: string;
  acik?: boolean;
  mutfakTuru?: string;
  kapakGorselUrl?: string;
  teslimatUcreti?: number;
  minimumSepetTutari?: number;
  tahminiTeslimatDakika?: number;
}

/** Haftalık çalışma saati kaydı talebi (gün: 1=Pzt … 7=Paz, saat "HH:mm"). */
export interface CalismaSaatiGun {
  gun: number;
  acilis?: string;
  kapanis?: string;
  kapali: boolean;
}

export interface CiroRaporu {
  siparisSayisi: number;
  toplamCiro: number;
  nakitToplam: number;
  krediKartiToplam: number;
}

interface IsletmeState {
  satici: Satici | null;
  menu: MenuOgesi[];
  siparisler: Siparis[];
  ciro: CiroRaporu | null;
  calismaSaatleri: CalismaSaati[];
  kampanyalar: Kampanya[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  clearMessages: () => void;
  saticimiGetir: () => Promise<void>;
  saticiGuncelle: (form: SaticiAyarFormu) => Promise<boolean>;
  calismaSaatleriGetir: () => Promise<void>;
  calismaSaatleriKaydet: (gunler: CalismaSaatiGun[]) => Promise<boolean>;
  kampanyalariGetir: () => Promise<void>;
  kampanyaEkle: (form: KampanyaFormu) => Promise<boolean>;
  kampanyaGuncelle: (id: string, form: KampanyaFormu) => Promise<boolean>;
  kampanyaSil: (id: string) => Promise<boolean>;

  menumGetir: () => Promise<void>;
  menuEkle: (form: MenuOgesiFormu) => Promise<boolean>;
  menuGuncelle: (id: string, form: MenuOgesiFormu) => Promise<boolean>;
  menuSil: (id: string) => Promise<boolean>;

  siparisleriGetir: () => Promise<void>;
  siparisGecis: (id: string, eylem: 'kabul' | 'hazirla' | 'hazir' | 'yolda') => Promise<boolean>;
  siparisReddet: (id: string, neden: string) => Promise<boolean>;
  siparisTeslim: (id: string, tahsilEdilenOdeme: OdemeYontemi) => Promise<boolean>;

  ciroGetir: (baslangic?: string, bitis?: string) => Promise<void>;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const useIsletmeDeposu = create<IsletmeState>((set, get) => ({
  satici: null,
  menu: [],
  siparisler: [],
  ciro: null,
  calismaSaatleri: [],
  kampanyalar: [],
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  kampanyalariGetir: async () => {
    try {
      const res = await api.get<Kampanya[]>('/satici/kampanyalar');
      set({ kampanyalar: res.data });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kampanyalar yüklenemedi.') });
    }
  },

  kampanyaEkle: async (form) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post('/satici/kampanyalar', form);
      set({ successMessage: 'Kampanya eklendi.', isLoading: false });
      await get().kampanyalariGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kampanya eklenemedi.'), isLoading: false });
      return false;
    }
  },

  kampanyaGuncelle: async (id, form) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.put(`/satici/kampanyalar/${id}`, form);
      set({ successMessage: 'Kampanya güncellendi.', isLoading: false });
      await get().kampanyalariGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kampanya güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  kampanyaSil: async (id) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.delete(`/satici/kampanyalar/${id}`);
      set({ successMessage: 'Kampanya silindi.', isLoading: false });
      await get().kampanyalariGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kampanya silinemedi.'), isLoading: false });
      return false;
    }
  },

  calismaSaatleriGetir: async () => {
    try {
      const res = await api.get<CalismaSaati[]>('/satici/calisma-saatleri');
      set({ calismaSaatleri: res.data });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Çalışma saatleri yüklenemedi.') });
    }
  },

  calismaSaatleriKaydet: async (gunler) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await api.put<CalismaSaati[]>('/satici/calisma-saatleri', { gunler });
      set({ calismaSaatleri: res.data, successMessage: 'Çalışma saatleri kaydedildi.', isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Çalışma saatleri kaydedilemedi.'), isLoading: false });
      return false;
    }
  },

  saticimiGetir: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Satici>('/satici');
      set({ satici: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Satıcı bilgisi yüklenemedi.'), isLoading: false });
    }
  },

  saticiGuncelle: async (form) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await api.put<Satici>('/satici', form);
      set({ satici: res.data, successMessage: 'Satıcı bilgileri güncellendi.', isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Satıcı güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  menumGetir: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<MenuOgesi[]>('/satici/menu');
      set({ menu: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Menü yüklenemedi.'), isLoading: false });
    }
  },

  menuEkle: async (form) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post('/satici/menu', form);
      set({ successMessage: 'Ürün menüye eklendi.', isLoading: false });
      await get().menumGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Ürün eklenemedi.'), isLoading: false });
      return false;
    }
  },

  menuGuncelle: async (id, form) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.put(`/satici/menu/${id}`, form);
      set({ successMessage: 'Ürün güncellendi.', isLoading: false });
      await get().menumGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Ürün güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  menuSil: async (id) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.delete(`/satici/menu/${id}`);
      set({ successMessage: 'Ürün menüden kaldırıldı.', isLoading: false });
      await get().menumGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Ürün kaldırılamadı.'), isLoading: false });
      return false;
    }
  },

  siparisleriGetir: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Siparis[]>('/satici/siparisler');
      set({ siparisler: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Siparişler yüklenemedi.'), isLoading: false });
    }
  },

  siparisGecis: async (id, eylem) => {
    set({ error: null, successMessage: null });
    try {
      await api.post(`/satici/siparisler/${id}/${eylem}`);
      await get().siparisleriGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Sipariş durumu güncellenemedi.') });
      return false;
    }
  },

  siparisReddet: async (id, neden) => {
    set({ error: null, successMessage: null });
    try {
      await api.post(`/satici/siparisler/${id}/reddet`, { neden });
      set({ successMessage: 'Sipariş reddedildi.' });
      await get().siparisleriGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Sipariş reddedilemedi.') });
      return false;
    }
  },

  siparisTeslim: async (id, tahsilEdilenOdeme) => {
    set({ error: null, successMessage: null });
    try {
      await api.post(`/satici/siparisler/${id}/teslim`, { tahsilEdilenOdeme });
      set({ successMessage: 'Sipariş teslim edildi.' });
      await get().siparisleriGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Teslim işaretlenemedi.') });
      return false;
    }
  },

  ciroGetir: async (baslangic, bitis) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (baslangic) params.append('baslangic', baslangic);
      if (bitis) params.append('bitis', bitis);
      const qs = params.toString();
      const res = await api.get<CiroRaporu>(`/satici/ciro${qs ? `?${qs}` : ''}`);
      set({ ciro: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Ciro raporu yüklenemedi.'), isLoading: false });
    }
  },
}));
