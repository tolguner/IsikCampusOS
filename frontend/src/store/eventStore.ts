import { create } from 'zustand';
import { api } from '../lib/api';

export interface Club {
  id: string;
  name: string;
  adminUserId: string;
}

export interface Event {
  id: string;
  club: Club;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  hasCapacityLimit: boolean;
  capacity: number;
  hasWaitlistLimit: boolean;
  waitlistCapacity: number;
  currentRsvpCount: number;
  currentWaitlistCount: number;
  status: 'DRAFT' | 'PENDING_SKS_APPROVAL' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
}

export interface Rsvp {
  id: string;
  eventId: string;
  userId: string;
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'ATTENDED';
  createdAt: string;
}

interface EventState {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  clearMessages: () => void;
  fetchPublishedEvents: () => Promise<void>;
  createEventDraft: (data: any) => Promise<boolean>;
  submitForApproval: (eventId: string) => Promise<boolean>;
  approveEvent: (eventId: string) => Promise<boolean>;
  createRsvp: (eventId: string) => Promise<boolean>;
  cancelRsvp: (eventId: string) => Promise<boolean>;
  checkInUser: (eventId: string, targetUserId: string) => Promise<boolean>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  fetchPublishedEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Event[]>('/events');
      set({ events: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlikler yüklenirken hata oluştu.', isLoading: false });
    }
  },

  createEventDraft: async (data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post('/events/draft', data);
      set({ successMessage: 'Etkinlik taslağı başarıyla oluşturuldu.', isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlik oluşturulurken hata oluştu.', isLoading: false });
      return false;
    }
  },

  submitForApproval: async (eventId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/submit`);
      set({ successMessage: 'Etkinlik onaya gönderildi.', isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'İşlem başarısız.', isLoading: false });
      return false;
    }
  },

  approveEvent: async (eventId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/approve`);
      set({ successMessage: 'Etkinlik onaylandı ve yayınlandı.', isLoading: false });
      get().fetchPublishedEvents();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlik onaylanırken yetkisiz erişim veya hata.', isLoading: false });
      return false;
    }
  },

  createRsvp: async (eventId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/rsvp`);
      set({ successMessage: 'Etkinliğe katılım kaydınız alındı.', isLoading: false });
      get().fetchPublishedEvents();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Kayıt işlemi başarısız.', isLoading: false });
      return false;
    }
  },

  cancelRsvp: async (eventId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/rsvp/cancel`);
      set({ successMessage: 'Katılımınız iptal edildi.', isLoading: false });
      get().fetchPublishedEvents();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'İptal işlemi başarısız.', isLoading: false });
      return false;
    }
  },

  checkInUser: async (eventId, targetUserId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/checkin/${targetUserId}`);
      set({ successMessage: 'Öğrenci yoklaması alındı.', isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Yoklama alma işlemi başarısız.', isLoading: false });
      return false;
    }
  }
}));
