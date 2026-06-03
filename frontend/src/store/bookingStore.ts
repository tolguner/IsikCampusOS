import { create } from 'zustand';
import { api } from '../lib/api';

export interface BookingCheckin {
  id: string;
  bookingId: string;
  userId: string;
  checkedInAt: string;
  method: 'QR' | 'MANUAL';
  proofAssetId?: string;
  status: 'PENDING' | 'CHECKED_IN' | 'FAILED';
}

export interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  facilityId: string;
  facilityName: string;
  bookedByUserId: string;
  startAt: string;
  endAt: string;
  purpose?: string;
  participantCount: number;
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'BLOCKED';
  cancelledAt?: string;
  cancelReason?: string;
  noShowAt?: string;
  checkin?: BookingCheckin;
}

type BookingForm = {
  resourceId: string;
  startAt: string;
  endAt: string;
  purpose?: string;
  participantCount: number;
};

interface BookingState {
  myBookings: Booking[];
  allBookings: Booking[];
  calendarBookings: Booking[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
  fetchMyBookings: () => Promise<void>;
  fetchAllBookings: () => Promise<void>;
  fetchCalendarBookings: (resourceId: string, start: string, end: string) => Promise<void>;
  createBooking: (data: BookingForm) => Promise<boolean>;
  createBlockedSlot: (data: BookingForm) => Promise<boolean>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<boolean>;
  checkin: (bookingId: string, method: 'QR' | 'MANUAL', proofAssetId?: string) => Promise<boolean>;
  updateBookingStatus: (bookingId: string, status: string) => Promise<boolean>;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

const mapBookingStatus = (status: string): Booking['status'] => {
  switch (status) {
    case 'TASLAK': return 'DRAFT';
    case 'BEKLEMEDE': return 'PENDING';
    case 'ONAYLANDI': return 'CONFIRMED';
    case 'IPTAL_EDILDI': return 'CANCELLED';
    case 'TAMAMLANDI': return 'COMPLETED';
    case 'GELMEDI': return 'NO_SHOW';
    case 'BLOKE': return 'BLOCKED';
    default: return status as any;
  }
};

const mapReverseBookingStatus = (status: Booking['status']): string => {
  switch (status) {
    case 'DRAFT': return 'TASLAK';
    case 'PENDING': return 'BEKLEMEDE';
    case 'CONFIRMED': return 'ONAYLANDI';
    case 'CANCELLED': return 'IPTAL_EDILDI';
    case 'COMPLETED': return 'TAMAMLANDI';
    case 'NO_SHOW': return 'GELMEDI';
    case 'BLOCKED': return 'BLOKE';
    default: return status;
  }
};

const mapCheckinStatus = (status: string): BookingCheckin['status'] => {
  switch (status) {
    case 'BEKLEMEDE': return 'PENDING';
    case 'GIRIS_YAPILDI': return 'CHECKED_IN';
    case 'BASARISIZ': return 'FAILED';
    default: return status as any;
  }
};

const mapCheckin = (data: any): BookingCheckin | undefined => {
  if (!data) return undefined;
  return {
    id: data.id,
    bookingId: data.rezervasyonId,
    userId: data.kullaniciId,
    checkedInAt: data.yoklamaTarihi,
    method: data.yontem,
    proofAssetId: data.kanitDosyaId,
    status: mapCheckinStatus(data.durum)
  };
};

const mapBooking = (data: any): Booking => ({
  id: data.id,
  resourceId: data.kaynakId,
  resourceName: data.kaynakAd,
  facilityId: data.tesisId,
  facilityName: data.tesisAd,
  bookedByUserId: data.rezervasyonYapanKullaniciId,
  startAt: data.baslangicTarihi,
  endAt: data.bitisTarihi,
  purpose: data.amac,
  participantCount: data.katilimciSayisi,
  status: mapBookingStatus(data.durum),
  cancelledAt: data.iptalEdilmeTarihi,
  cancelReason: data.iptalNedeni,
  noShowAt: data.gelmemeTarihi,
  checkin: mapCheckin(data.yoklama)
});

export const useBookingStore = create<BookingState>((set, get) => ({
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
      const payload = {
        kaynakId: data.resourceId,
        baslangicTarihi: data.startAt,
        bitisTarihi: data.endAt,
        amac: data.purpose,
        katilimciSayisi: data.participantCount
      };
      await api.post('/tesisler/rezervasyonlar', payload);
      set({ successMessage: 'Rezervasyonunuz başarıyla oluşturuldu.', isLoading: false });
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
      const payload = {
        kaynakId: data.resourceId,
        baslangicTarihi: data.startAt,
        bitisTarihi: data.endAt,
        amac: data.purpose,
        katilimciSayisi: data.participantCount
      };
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

  checkin: async (bookingId, method, proofAssetId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        yontem: method,
        kanitDosyaId: proofAssetId
      };
      await api.post(`/tesisler/rezervasyonlar/${bookingId}/yoklama`, payload);
      set({ successMessage: 'Check-in işleminiz başarıyla tamamlandı.', isLoading: false });
      await get().fetchMyBookings();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Check-in yapılamadı.'), isLoading: false });
      return false;
    }
  },

  updateBookingStatus: async (bookingId, status) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const dbStatus = mapReverseBookingStatus(status as any);
      await api.patch(`/tesisler/rezervasyonlar/${bookingId}/durum?durum=${dbStatus}`);
      set({ successMessage: 'Rezervasyon durumu güncellendi.', isLoading: false });
      await get().fetchAllBookings();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Rezervasyon durumu güncellenemedi.'), isLoading: false });
      return false;
    }
  },
}));
