import { create } from 'zustand';
import { api } from '../lib/api';

/** Backend (profile-service) ProfilDetayi ile birebir — çeviri (mapper) yoktur. */
export interface Profil {
  id: string;
  kullaniciId: string;
  eposta?: string;
  ad?: string;
  soyad?: string;
  bolum?: string;
  telefonNumarasi?: string;
  ikametAdresi?: string;
  kanGrubu?: string;
  tcKimlikMaskeli?: string;
  profilResmiUrl?: string;
  hakkinda?: string;
  yetenekler?: string;
  guvenSkoru?: number;
}

type ProfilGuncelleme = Partial<Pick<Profil, 'ad' | 'soyad' | 'bolum' | 'profilResmiUrl' | 'hakkinda' | 'yetenekler'>>;

export interface ProfilDegisiklikIstegi {
  id: string;
  kullaniciId: string;
  alanAdi: string;
  mevcutDeger?: string;
  talepEdilenDeger: string;
  durum: 'BEKLEMEDE' | 'ONAYLANDI' | 'REDDEDILDI';
  geriBildirim?: string;
  olusturulmaTarihi: string;
}

interface ProfileState {
  profile: Profil | null;
  changeRequests: ProfilDegisiklikIstegi[];
  pendingChangeRequests: ProfilDegisiklikIstegi[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchMyProfile: () => Promise<void>;
  fetchMyChangeRequests: () => Promise<void>;
  fetchPendingChangeRequests: () => Promise<void>;
  updateMyProfile: (data: ProfilGuncelleme, successMessage?: string) => Promise<boolean>;
  requestProfileChange: (fieldName: string, requestedValue: string) => Promise<boolean>;
  approveChangeRequest: (requestId: string) => Promise<boolean>;
  rejectChangeRequest: (requestId: string, feedback?: string) => Promise<boolean>;
  clearMessages: () => void;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const useProfilDeposu = create<ProfileState>((set, get) => ({
  profile: null,
  changeRequests: [],
  pendingChangeRequests: [],
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  fetchMyProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Profil>('/profiller/benim');
      set({ profile: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil bilgileri yüklenemedi.'), isLoading: false });
    }
  },

  fetchMyChangeRequests: async () => {
    try {
      const res = await api.get<ProfilDegisiklikIstegi[]>('/profiller/benim/degisiklik-talepleri');
      set({ changeRequests: res.data });
    } catch {
      set({ changeRequests: [] });
    }
  },

  fetchPendingChangeRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<ProfilDegisiklikIstegi[]>('/profiller/degisiklik-talepleri/bekleyen');
      set({ pendingChangeRequests: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil değişiklik talepleri yüklenemedi.'), isLoading: false });
    }
  },

  updateMyProfile: async (data, successMessage = 'Profil bilgileri güncellendi.') => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await api.patch<Profil>('/profiller/benim', data);
      set({ profile: res.data, isLoading: false, successMessage });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil bilgileri güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  requestProfileChange: async (fieldName, requestedValue) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        alanAdi: fieldName,
        talepEdilenDeger: requestedValue
      };
      await api.post('/profiller/benim/degisiklik-talepleri', payload);
      set({ isLoading: false, successMessage: 'Değişiklik talebin onaya gönderildi.' });
      await get().fetchMyChangeRequests();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Değişiklik talebi gönderilemedi.'), isLoading: false });
      return false;
    }
  },

  approveChangeRequest: async (requestId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/profiller/degisiklik-talepleri/${requestId}/onayla`);
      set({ isLoading: false, successMessage: 'Profil değişiklik talebi onaylandı.' });
      await get().fetchPendingChangeRequests();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil değişiklik talebi onaylanamadı.'), isLoading: false });
      return false;
    }
  },

  rejectChangeRequest: async (requestId, feedback) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/profiller/degisiklik-talepleri/${requestId}/reddet`, { geriBildirim: feedback });
      set({ isLoading: false, successMessage: 'Profil değişiklik talebi reddedildi.' });
      await get().fetchPendingChangeRequests();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil değişiklik talebi reddedilemedi.'), isLoading: false });
      return false;
    }
  },
}));
