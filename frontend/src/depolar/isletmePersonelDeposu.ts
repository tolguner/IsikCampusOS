import { create } from 'zustand';
import { api } from '../lib/api';

export type PersonelRolu = 'PERSONEL' | 'KURYE';

export interface Personel {
  kullaniciId: string;
  ad: string;
  eposta: string;
  durum: string;
  rol?: PersonelRolu;
}

export interface PersonelFormu {
  ad: string;
  soyad: string;
  eposta: string;
  tcKimlikNo: string;
  rol: PersonelRolu;
}

interface PersonelState {
  personeller: Personel[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  personelleriGetir: () => Promise<void>;
  personelEkle: (form: PersonelFormu) => Promise<boolean>;
  personelDurum: (kullaniciId: string, durum: 'AKTIF' | 'PASIF') => Promise<void>;
  personelCikar: (kullaniciId: string) => Promise<void>;
  clearMessages: () => void;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const useIsletmePersonelDeposu = create<PersonelState>((set, get) => ({
  personeller: [],
  isLoading: false,
  error: null,
  successMessage: null,

  personelleriGetir: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<Personel[]>('/satici/personel');
      set({ personeller: data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Personeller yüklenemedi.'), isLoading: false });
    }
  },

  personelEkle: async (form) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post('/satici/personel', form);
      set({ successMessage: 'Personel eklendi. Giriş şifresi: TC Kimlik No (ilk girişte değiştirilecek).', isLoading: false });
      await get().personelleriGetir();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Personel eklenemedi.'), isLoading: false });
      return false;
    }
  },

  personelDurum: async (kullaniciId, durum) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.put(`/satici/personel/${kullaniciId}/durum`, { durum });
      set({ successMessage: durum === 'PASIF' ? 'Personel askıya alındı.' : 'Personel aktifleştirildi.', isLoading: false });
      await get().personelleriGetir();
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Personel durumu değiştirilemedi.'), isLoading: false });
    }
  },

  personelCikar: async (kullaniciId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.delete(`/satici/personel/${kullaniciId}`);
      set({ successMessage: 'Personel işletmeden çıkarıldı.', isLoading: false });
      await get().personelleriGetir();
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Personel çıkarılamadı.'), isLoading: false });
    }
  },

  clearMessages: () => set({ error: null, successMessage: null }),
}));
