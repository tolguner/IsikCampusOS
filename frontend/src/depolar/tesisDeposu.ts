import { create } from 'zustand';
import { api } from '../lib/api';

export type TesisTuru = 'TOPLANTI_ODASI' | 'CALISMA_ODASI' | 'SPOR_ALANI' | 'LABORATUVAR' | 'DIGER';
export type TesisDurumu = 'AKTIF' | 'DURDURULMUS' | 'ARSIVLENMIS';
export type KuralDurumu = 'AKTIF' | 'DURDURULMUS';

/** Backend (facility-service) yanıtları ile birebir — çeviri (mapper) yoktur. */
export interface KullanimKurali {
  id?: string;
  haftaninGunu: number;
  baslangicSaati: string;
  bitisSaati: string;
  gecerlilikBaslangici?: string;
  gecerlilikBitisi?: string;
  durum?: KuralDurumu;
}

export interface TesisPolitikasi {
  id?: string;
  tesisId?: string;
  rezervasyonPenceresiGun: number;
  minimumBildirimDakika: number;
  iptalLimitDakika: number;
  yoklamaZorunlu: boolean;
  otomatikGelmemeDakika: number;
  maksimumRezervasyonSureDakika: number;
  durum?: string;
}

export interface TesisKaynagi {
  id: string;
  tesisId: string;
  kaynakKodu: string;
  ad: string;
  kaynakTuru: TesisTuru;
  kapasite: number;
  rezervasyonYapilabilir: boolean;
  durum: TesisDurumu;
  kullanimKurallari: KullanimKurali[];
}

export interface Tesis {
  id: string;
  ad: string;
  tesisTuru: TesisTuru;
  aciklama?: string;
  konumMetni?: string;
  kapasite: number;
  durum: TesisDurumu;
  politika?: TesisPolitikasi;
  kaynaklar: TesisKaynagi[];
}

type TesisFormu = {
  ad: string;
  tesisTuru: string;
  aciklama: string;
  konumMetni: string;
  kapasite: number;
  durum?: string;
};

type KaynakFormu = {
  kaynakKodu: string;
  ad: string;
  kaynakTuru: string;
  kapasite: number;
  rezervasyonYapilabilir: boolean;
  durum?: string;
};

interface FacilityState {
  facilities: Tesis[];
  selectedFacilityId: string | null;
  selectedResourceId: string | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
  selectFacility: (facilityId: string | null) => void;
  selectResource: (resourceId: string | null) => void;
  fetchFacilities: () => Promise<void>;
  createFacility: (data: TesisFormu) => Promise<boolean>;
  updateFacility: (facilityId: string, data: TesisFormu) => Promise<boolean>;
  createResource: (facilityId: string, data: KaynakFormu) => Promise<boolean>;
  updateResource: (resourceId: string, data: KaynakFormu) => Promise<boolean>;
  updatePolicy: (facilityId: string, data: TesisPolitikasi) => Promise<boolean>;
  replaceAvailabilityRules: (resourceId: string, rules: KullanimKurali[]) => Promise<boolean>;
  deleteFacility: (facilityId: string) => Promise<boolean>;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

// API (facility-service) yanıtları artık tiplerle birebir; çeviri yapılmaz (ince passthrough).
const mapFacility = (data: any): Tesis => data;

export const useTesisDeposu = create<FacilityState>((set, get) => ({
  facilities: [],
  selectedFacilityId: null,
  selectedResourceId: null,
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),
  selectFacility: (facilityId) => {
    const facility = get().facilities.find(item => item.id === facilityId);
    set({
      selectedFacilityId: facilityId,
      selectedResourceId: facility?.kaynaklar?.[0]?.id || null,
      error: null,
      successMessage: null,
    });
  },
  selectResource: (resourceId) => set({ selectedResourceId: resourceId }),

  fetchFacilities: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/tesisler');
      const facilities = res.data.map(mapFacility);
      const currentFacilityId = get().selectedFacilityId;
      const selectedFacility = facilities.find(item => item.id === currentFacilityId) || facilities[0] || null;
      const selectedResourceId = selectedFacility?.kaynaklar?.find(item => item.id === get().selectedResourceId)?.id
        || selectedFacility?.kaynaklar?.[0]?.id
        || null;
      set({
        facilities,
        selectedFacilityId: selectedFacility?.id || null,
        selectedResourceId,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Tesisler yüklenemedi.'), isLoading: false });
    }
  },

  createFacility: async (data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = { ...data, durum: data.durum || 'AKTIF' };
      const res = await api.post<any>('/tesisler', payload);
      set({ selectedFacilityId: res.data.id, successMessage: 'Tesis oluşturuldu.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Tesis oluşturulamadı.'), isLoading: false });
      return false;
    }
  },

  updateFacility: async (facilityId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = { ...data, durum: data.durum || 'AKTIF' };
      await api.patch(`/tesisler/${facilityId}`, payload);
      set({ successMessage: 'Tesis bilgileri güncellendi.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Tesis güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  createResource: async (facilityId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = { ...data, durum: data.durum || 'AKTIF' };
      const res = await api.post<any>(`/tesisler/${facilityId}/kaynaklar`, payload);
      set({ selectedResourceId: res.data.id, successMessage: 'Kaynak oluşturuldu.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kaynak oluşturulamadı.'), isLoading: false });
      return false;
    }
  },

  updateResource: async (resourceId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = { ...data, durum: data.durum || 'AKTIF' };
      await api.patch(`/tesis-kaynaklari/${resourceId}`, payload);
      set({ successMessage: 'Kaynak güncellendi.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kaynak güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  updatePolicy: async (facilityId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.put(`/tesisler/${facilityId}/politika`, data);
      set({ successMessage: 'Rezervasyon kriterleri güncellendi.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kriterler güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  replaceAvailabilityRules: async (resourceId, rules) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = rules.map(rule => ({ ...rule, durum: rule.durum || 'AKTIF' }));
      await api.put(`/tesis-kaynaklari/${resourceId}/kullanilabilirlik-kurallari`, payload);
      set({ successMessage: 'Haftalık uygunluk güncellendi.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Uygunluk kuralları güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  deleteFacility: async (facilityId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.delete(`/tesisler/${facilityId}`);
      set({ selectedFacilityId: null, selectedResourceId: null, successMessage: 'Tesis silindi.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Tesis silinemedi.'), isLoading: false });
      return false;
    }
  },
}));
