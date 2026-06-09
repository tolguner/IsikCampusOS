import { create } from 'zustand';
import { api } from '../lib/api';

export interface Personel {
  kullaniciId: string;
  ad: string;
  eposta: string;
  durum: string;
}

export interface PersonelFormu {
  ad: string;
  soyad: string;
  eposta: string;
  tcKimlikNo: string;
}

interface PersonelState {
  personeller: Personel[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  personelleriGetir: () => Promise<void>;
  personelEkle: (form: PersonelFormu) => Promise<boolean>;
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
