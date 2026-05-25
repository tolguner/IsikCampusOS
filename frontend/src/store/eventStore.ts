import { create } from 'zustand';
import { api } from '../lib/api';

export interface Club {
  id: string;
  name: string;
  adminUserId: string;
  description?: string;
}

export interface Event {
  id: string;
  club: Club;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  eventMode?: 'ONLINE' | 'IN_PERSON';
  onlinePlatform?: string;
  onlineMeetingUrl?: string;
  locationName?: string;
  locationDetail?: string;
  latitude?: number;
  longitude?: number;
  posterImageUrl?: string;
  hasCapacityLimit: boolean;
  capacityLimited?: boolean;
  capacity: number;
  hasWaitlistLimit: boolean;
  waitlistCapacity: number;
  currentRsvpCount: number;
  currentWaitlistCount: number;
  qrCheckInEnabled: boolean;
  certificateEnabled: boolean;
  certificateTitle?: string;
  certificatesIssuedAt?: string;
  paid?: boolean;
  feeAmount?: number;
  iban?: string;
  paymentInstructions?: string;
  reminderEnabled?: boolean;
  reminderOffsetsMinutes?: string;
  sentReminderOffsetsMinutes?: string;
  status: 'DRAFT' | 'PENDING_SKS_APPROVAL' | 'REVISION_REQUESTED' | 'PUBLISHED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  rejectionReason?: string;
  updatedAt?: string;
}

export interface Rsvp {
  id: string;
  eventId: string;
  userId: string;
  checkInToken?: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
  createdAt: string;
}

export interface EventParticipant {
  rsvpId: string;
  eventId: string;
  userId: string;
  fullName?: string;
  studentNumber?: string;
  email?: string;
  department?: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
  registeredAt: string;
  checkedInAt?: string;
  checkedInBy?: string;
  paymentPending: boolean;
  paymentConfirmed: boolean;
  paymentReviewedAt?: string;
  paymentReviewedBy?: string;
  paymentRejectionReason?: string;
  certificateSent: boolean;
  certificateSentAt?: string;
}

export interface AuditLog {
  id: string;
  entityType: 'CLUB' | 'EVENT';
  entityId: string;
  action: string;
  actorId: string;
  actorRole?: string;
  message: string;
  metadata?: string;
  createdAt: string;
}

interface EventState {
  events: Event[];
  managedEvents: Event[];
  participantsByEvent: Record<string, EventParticipant[]>;
  myRsvpsByEvent: Record<string, Rsvp>;
  reviewQueue: Event[];
  auditLogsByEvent: Record<string, AuditLog[]>;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  clearMessages: () => void;
  fetchPublishedEvents: () => Promise<void>;
  fetchManagedEvents: () => Promise<void>;
  fetchMyRsvps: () => Promise<void>;
  fetchReviewQueue: () => Promise<void>;
  createEventDraft: (data: any) => Promise<Event | null>;
  updateEvent: (eventId: string, data: any) => Promise<boolean>;
  submitForApproval: (eventId: string) => Promise<boolean>;
  approveEvent: (eventId: string) => Promise<boolean>;
  requestRevision: (eventId: string, feedback: string) => Promise<boolean>;
  cancelEvent: (eventId: string, reason: string) => Promise<boolean>;
  createRsvp: (eventId: string) => Promise<boolean>;
  cancelRsvp: (eventId: string) => Promise<boolean>;
  checkInUser: (eventId: string, targetUserId: string) => Promise<boolean>;
  checkInWithQr: (eventId: string, token: string) => Promise<boolean>;
  fetchParticipants: (eventId: string) => Promise<void>;
  approvePayment: (eventId: string, rsvpId: string) => Promise<boolean>;
  rejectPayment: (eventId: string, rsvpId: string) => Promise<boolean>;
  issueCertificates: (eventId: string) => Promise<boolean>;
  fetchEventAuditLogs: (eventId: string, filters?: { action?: string; actorId?: string; from?: string; to?: string; search?: string }) => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  managedEvents: [],
  participantsByEvent: {},
  myRsvpsByEvent: {},
  reviewQueue: [],
  auditLogsByEvent: {},
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

  fetchReviewQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Event[]>('/events/review-queue');
      set({ reviewQueue: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlik talepleri yüklenirken hata oluştu.', isLoading: false });
    }
  },

  fetchManagedEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Event[]>('/events/managed');
      set({ managedEvents: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Yönetilen etkinlikler yüklenirken hata oluştu.', isLoading: false });
    }
  },

  fetchMyRsvps: async () => {
    set({ error: null });
    try {
      const res = await api.get<Rsvp[]>('/events/my-rsvps');
      set({
        myRsvpsByEvent: res.data.reduce<Record<string, Rsvp>>((acc, rsvp) => {
          acc[rsvp.eventId] = rsvp;
          return acc;
        }, {}),
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlik kayıtlarınız yüklenirken hata oluştu.' });
    }
  },

  createEventDraft: async (data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await api.post<Event>('/events/draft', data);
      set({ successMessage: 'Etkinlik taslağı başarıyla oluşturuldu.', isLoading: false });
      await get().fetchManagedEvents();
      return res.data;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlik oluşturulurken hata oluştu.', isLoading: false });
      return null;
    }
  },

  updateEvent: async (eventId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.put(`/events/${eventId}`, data);
      set({ successMessage: 'Etkinlik güncelleme kaydı alındı.', isLoading: false });
      await get().fetchManagedEvents();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlik güncellenemedi.', isLoading: false });
      return false;
    }
  },

  submitForApproval: async (eventId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/submit`);
      set({ successMessage: 'Etkinlik onaya gönderildi.', isLoading: false });
      await get().fetchManagedEvents();
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
      get().fetchReviewQueue();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlik onaylanırken yetkisiz erişim veya hata.', isLoading: false });
      return false;
    }
  },

  requestRevision: async (eventId, feedback) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/revision-request`, { feedback });
      set({ successMessage: 'Düzenleme talebi kulüp başkanına iletildi.', isLoading: false });
      get().fetchReviewQueue();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Düzenleme talebi gönderilemedi.', isLoading: false });
      return false;
    }
  },

  cancelEvent: async (eventId, reason) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/cancel`, { reason });
      set({ successMessage: 'Etkinlik iptal edildi ve iptal duyurusu gönderildi.', isLoading: false });
      await get().fetchManagedEvents();
      await get().fetchPublishedEvents();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlik iptal edilemedi.', isLoading: false });
      return false;
    }
  },

  createRsvp: async (eventId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/rsvp`);
      set({ successMessage: 'Etkinliğe katılım kaydınız alındı.', isLoading: false });
      await get().fetchMyRsvps();
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
      await get().fetchMyRsvps();
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
      await get().fetchParticipants(eventId);
      await get().fetchManagedEvents();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Yoklama alma işlemi başarısız.', isLoading: false });
      return false;
    }
  },

  checkInWithQr: async (eventId, token) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/checkin/qr`, { token });
      set({ successMessage: 'QR doğrulandı, katılım kaydı alındı.', isLoading: false });
      await get().fetchParticipants(eventId);
      await get().fetchManagedEvents();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'QR doğrulama başarısız.', isLoading: false });
      return false;
    }
  },

  fetchParticipants: async (eventId) => {
    set({ error: null });
    try {
      const res = await api.get<EventParticipant[]>(`/events/${eventId}/participants`);
      let participants = res.data;
      const userIds = [...new Set(participants.map(participant => participant.userId).filter(Boolean))];
      if (userIds.length > 0) {
        try {
          const profileRes = await api.post('/users/batch', { userIds });
          const profileMap = new Map<string, any>();
          (profileRes.data || []).forEach((profile: any) => profileMap.set(profile.id, profile));
          participants = participants.map(participant => {
            const profile = profileMap.get(participant.userId);
            return {
              ...participant,
              fullName: profile?.fullName || participant.fullName || participant.userId,
              studentNumber: profile?.studentNumber || participant.studentNumber || participant.userId,
              email: profile?.email || participant.email || '',
              department: profile?.department || participant.department || '',
            };
          });
        } catch {
          participants = participants.map(participant => ({
            ...participant,
            fullName: participant.fullName || participant.userId,
            studentNumber: participant.studentNumber || participant.userId,
          }));
        }
      }
      set(state => ({
        participantsByEvent: {
          ...state.participantsByEvent,
          [eventId]: participants,
        },
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Katılımcılar yüklenirken hata oluştu.' });
    }
  },

  approvePayment: async (eventId, rsvpId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/rsvps/${rsvpId}/payment/approve`);
      set({ successMessage: 'Ödeme onaylandı, kayıt kesinleştirildi.', isLoading: false });
      await get().fetchParticipants(eventId);
      await get().fetchManagedEvents();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Ödeme onaylanamadı.', isLoading: false });
      return false;
    }
  },

  rejectPayment: async (eventId, rsvpId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/events/${eventId}/rsvps/${rsvpId}/payment/reject`);
      set({ successMessage: 'Ödeme reddedildi, kontenjan geri açıldı.', isLoading: false });
      await get().fetchParticipants(eventId);
      await get().fetchManagedEvents();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Ödeme reddedilemedi.', isLoading: false });
      return false;
    }
  },

  issueCertificates: async (eventId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await api.post<{ eligibleParticipantCount: number; issuedCertificateCount: number }>(`/events/${eventId}/certificates/issue`);
      set({
        successMessage: `${res.data.issuedCertificateCount} sertifika oluşturuldu. Toplam uygun katılımcı: ${res.data.eligibleParticipantCount}.`,
        isLoading: false,
      });
      await get().fetchParticipants(eventId);
      await get().fetchManagedEvents();
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Sertifikalar oluşturulamadı.', isLoading: false });
      return false;
    }
  },

  fetchEventAuditLogs: async (eventId, filters = {}) => {
    set({ error: null });
    try {
      const res = await api.get<AuditLog[]>(`/events/${eventId}/audit-logs`, { params: filters });
      set(state => ({
        auditLogsByEvent: {
          ...state.auditLogsByEvent,
          [eventId]: res.data,
        },
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'İşlem geçmişi yüklenirken hata oluştu.' });
    }
  }
}));
