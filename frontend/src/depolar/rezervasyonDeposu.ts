import { create } from 'zustand';
import { api } from '../lib/api';

export type RezervasyonDurumu =
  | 'TASLAK' | 'BEKLEMEDE' | 'ONAYLANDI' | 'IPTAL_EDILDI' | 'TAMAMLANDI' | 'GELMEDI' | 'BLOKE';

/** Backend (facility-service) yanıtları ile birebir — çeviri (mapper) yoktur. */
export interface Rezervasyon {
  id: string;
  kaynakId: string;
  kaynakAd: string;
  tesisId: string;
  tesisAd: string;
  rezervasyonYapanKullaniciId: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  amac?: string;
  katilimciSayisi: number;
  durum: RezervasyonDurumu;
  iptalEdilmeTarihi?: string;
  iptalNedeni?: string;
  gelmemeTarihi?: string;
  tekrarGrupId?: string | null;
}

type RezervasyonFormu = {
  kaynakId: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  amac?: string;
  katilimciSayisi: number;
  tekrarGrupId?: string;
};

interface BookingState {
  myBookings: Rezervasyon[];
  allBookings: Rezervasyon[];
  calendarBookings: Rezervasyon[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
  fetchMyBookings: () => Promise<void>;
  fetchAllBookings: () => Promise<void>;
  fetchCalendarBookings: (resourceId: string, start: string, end: string) => Promise<void>;
  createBooking: (data: RezervasyonFormu) => Promise<boolean>;
  createBlockedSlot: (data: RezervasyonFormu) => Promise<boolean>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<boolean>;
  updateBookingStatus: (bookingId: string, status: string) => Promise<boolean>;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

// API (facility-service) yanıtları artık tiplerle birebir; çeviri yapılmaz (ince passthrough).
const mapBooking = (data: any): Rezervasyon => data;

export const useRezervasyonDeposu = create<BookingState>((set, get) => ({
  myBookings: [],
  allBookings: [],
  calendarBookings: [],
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  fetchMyBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/tesisler/rezervasyonlar/benim');
      set({ myBookings: res.data.map(mapBooking), isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Rezervasyonlarınız yüklenemedi.'), isLoading: false });
    }
  },

  fetchAllBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/tesisler/rezervasyonlar');
      set({ allBookings: res.data.map(mapBooking), isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Tüm rezervasyonlar yüklenemedi.'), isLoading: false });
    }
  },

  fetchCalendarBookings: async (resourceId, start, end) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>(`/tesisler/rezervasyonlar/takvim?kaynakId=${resourceId}&baslangic=${encodeURIComponent(start)}&bitis=${encodeURIComponent(end)}`);
      set({ calendarBookings: res.data.map(mapBooking), isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Takvim verisi yüklenemedi.'), isLoading: false });
    }
  },

  createBooking: async (data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = data;
      const res = await api.post<any>('/tesisler/rezervasyonlar', payload);
      const onayBekliyor = res.data?.durum === 'BEKLEMEDE';
      set({
        successMessage: onayBekliyor
          ? 'Talebiniz onaya gönderildi. Spor Müdürlüğü onayladığında bilgilendirileceksiniz.'
          : 'Rezervasyonunuz başarıyla oluşturuldu.',
        isLoading: false,
      });
      await get().fetchMyBookings();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Rezervasyon oluşturulamadı.'), isLoading: false });
      return false;
    }
  },

  createBlockedSlot: async (data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = data;
      await api.post('/tesisler/rezervasyonlar/bloke', payload);
      set({ successMessage: 'Zaman aralığı başarıyla bloke edildi / antrenman tanımlandı.', isLoading: false });
      await get().fetchAllBookings().catch(() => {});
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Bloke saat tanımlanamadı.'), isLoading: false });
      return false;
    }
  },

  cancelBooking: async (bookingId, reason) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const url = `/tesisler/rezervasyonlar/${bookingId}/iptal` + (reason ? `?neden=${encodeURIComponent(reason)}` : '');
      await api.post(url);
      set({ successMessage: 'Rezervasyon başarıyla iptal edildi.', isLoading: false });
      await get().fetchMyBookings();
      await get().fetchAllBookings().catch(() => {});
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Rezervasyon iptal edilemedi.'), isLoading: false });
      return false;
    }
  },

  updateBookingStatus: async (bookingId, status) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.patch(`/tesisler/rezervasyonlar/${bookingId}/durum?durum=${status}`);
      set({ successMessage: 'Rezervasyon durumu güncellendi.', isLoading: false });
      await get().fetchAllBookings();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Rezervasyon durumu güncellenemedi.'), isLoading: false });
      return false;
    }
  },
}));
