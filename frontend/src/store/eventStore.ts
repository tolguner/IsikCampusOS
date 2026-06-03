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

// --- Status mapping helpers ---
const statusTrToEn: Record<string, Event['status']> = {
  TASLAK: 'DRAFT',
  SKS_ONAYI_BEKLIYOR: 'PENDING_SKS_APPROVAL',
  REVIZYON_TALEP_EDILDI: 'REVISION_REQUESTED',
  YAYINLANDI: 'PUBLISHED',
  REDDEDILDI: 'REJECTED',
  IPTAL_EDILDI: 'CANCELLED',
  TAMAMLANDI: 'COMPLETED',
};

const rsvpStatusTrToEn: Record<string, Rsvp['status']> = {
  ODEME_BEKLIYOR: 'PENDING_PAYMENT',
  ONAYLANDI: 'CONFIRMED',
  YEDEKTE: 'WAITLISTED',
  IPTAL_EDILDI: 'CANCELLED',
  KATILDI: 'ATTENDED',
  GELMEDI: 'NO_SHOW',
};

const eventModeTrToEn: Record<string, 'ONLINE' | 'IN_PERSON'> = {
  CEVRIMICI: 'ONLINE',
  YUZ_YUZE: 'IN_PERSON',
};

const eventModeEnToTr: Record<string, string> = {
  ONLINE: 'CEVRIMICI',
  IN_PERSON: 'YUZ_YUZE',
};

const mapClubFromApi = (data: any): Club => {
  if (!data) return { id: '', name: '', adminUserId: '' };
  return {
    id: data.id,
    name: data.ad ?? data.name ?? '',
    adminUserId: data.yoneticiKullaniciId ?? data.adminUserId ?? '',
    description: data.aciklama ?? data.description,
  };
};

export const mapEventResponse = (data: any): Event => {
  return {
    id: data.id,
    club: mapClubFromApi(data.kulup ?? data.club),
    title: data.baslik,
    description: data.aciklama,
    startTime: data.baslangicTarihi,
    endTime: data.bitisTarihi,
    location: data.konum,
    eventMode: data.etkinlikTuru ? eventModeTrToEn[data.etkinlikTuru] : undefined,
    onlinePlatform: data.cevrimiciPlatform,
    onlineMeetingUrl: data.cevrimiciToplantiUrl,
    locationName: data.konumAdi,
    locationDetail: data.konumDetayi,
    latitude: data.enlem,
    longitude: data.boylam,
    posterImageUrl: data.afisResmiUrl,
    hasCapacityLimit: data.kontenjanSiniriVar,
    capacityLimited: data.kontenjanSinirli,
    capacity: data.kontenjan,
    hasWaitlistLimit: data.yedekListesiSiniriVar,
    waitlistCapacity: data.yedekListesiKontenjani,
    currentRsvpCount: data.mevcutRsvpSayisi,
    currentWaitlistCount: data.mevcutYedekSayisi,
    qrCheckInEnabled: data.qrGirisEtkin,
    certificateEnabled: data.sertifikaEtkin,
    certificateTitle: data.sertifikaBasligi,
    certificatesIssuedAt: data.sertifikalarinOlusturulmaTarihi,
    paid: data.ucretli,
    feeAmount: data.ucretTutari,
    iban: data.iban,
    paymentInstructions: data.odemeTalimatlari,
    reminderEnabled: data.hatirlaticiEtkin,
    reminderOffsetsMinutes: data.hatirlatmaZamanlariDakika,
    sentReminderOffsetsMinutes: data.gonderilenHatirlatmaZamanlariDakika,
    status: statusTrToEn[data.durum] || data.durum,
    rejectionReason: data.redNedeni,
    updatedAt: data.guncellenmeTarihi,
  };
};

const mapRsvpResponse = (data: any): Rsvp => {
  return {
    id: data.id,
    eventId: data.etkinlikId,
    userId: data.kullaniciId,
    checkInToken: data.yoklamaBelirteci,
    status: rsvpStatusTrToEn[data.durum] || data.durum,
    createdAt: data.olusturulmaTarihi,
  };
};

const mapParticipantResponse = (data: any): EventParticipant => {
  return {
    rsvpId: data.katilimId,
    eventId: data.etkinlikId,
    userId: data.kullaniciId,
    status: rsvpStatusTrToEn[data.durum] || data.durum,
    registeredAt: data.kayitTarihi,
    checkedInAt: data.yoklamaTarihi,
    checkedInBy: data.yoklamayiYapan,
    paymentPending: data.odemeBekliyor,
    paymentConfirmed: data.odemeOnaylandi,
    paymentReviewedAt: data.odemeIncelemeTarihi,
    paymentReviewedBy: data.odemeyiInceleyen,
    paymentRejectionReason: data.odemeRedNedeni,
    certificateSent: data.sertifikaGonderildi,
    certificateSentAt: data.sertifikaGonderilmeTarihi,
  };
};

const mapAuditLogResponse = (data: any): AuditLog => {
  let entityType: 'CLUB' | 'EVENT' = 'EVENT';
  if (data.varlikTuru === 'KULUP') entityType = 'CLUB';
  return {
    id: data.id,
    entityType,
    entityId: data.varlikId,
    action: data.islem,
    actorId: data.islemYapanId,
    actorRole: data.islemYapanRol,
    message: data.mesaj,
    metadata: data.metaVeri,
    createdAt: data.olusturulmaTarihi,
  };
};

const mapEventCreatePayload = (data: any) => ({
  kulupId: data.clubId,
  baslik: data.title,
  aciklama: data.description,
  baslangicTarihi: data.startTime,
  bitisTarihi: data.endTime,
  konum: data.location,
  etkinlikTuru: data.eventMode ? eventModeEnToTr[data.eventMode] : undefined,
  cevrimiciPlatform: data.onlinePlatform,
  cevrimiciToplantiUrl: data.onlineMeetingUrl,
  konumAdi: data.locationName,
  konumDetayi: data.locationDetail,
  enlem: data.latitude,
  boylam: data.longitude,
  afisResmiUrl: data.posterImageUrl,
  kontenjanSiniriVar: data.hasCapacityLimit,
  kontenjanSinirli: data.capacityLimited,
  kontenjan: data.capacity,
  yedekListesiSiniriVar: data.hasWaitlistLimit,
  yedekListesiKontenjani: data.waitlistCapacity,
  qrGirisEtkin: data.qrCheckInEnabled,
  sertifikaEtkin: data.certificateEnabled,
  sertifikaBasligi: data.certificateTitle,
  ucretli: data.paid,
  ucretTutari: data.feeAmount,
  iban: data.iban,
  odemeTalimatlari: data.paymentInstructions,
  hatirlaticiEtkin: data.reminderEnabled,
  hatirlatmaZamanlariDakika: data.reminderOffsetsMinutes,
});

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
      const res = await api.get<any[]>('/etkinlikler');
      set({ events: res.data.map(mapEventResponse), isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlikler yüklenirken hata oluştu.', isLoading: false });
    }
  },

  fetchReviewQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/etkinlikler/onay-bekleyenler');
      set({ reviewQueue: res.data.map(mapEventResponse), isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlik talepleri yüklenirken hata oluştu.', isLoading: false });
    }
  },

  fetchManagedEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/etkinlikler/yonetilen');
      set({ managedEvents: res.data.map(mapEventResponse), isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Yönetilen etkinlikler yüklenirken hata oluştu.', isLoading: false });
    }
  },

  fetchMyRsvps: async () => {
    set({ error: null });
    try {
      const res = await api.get<any[]>('/etkinlikler/katilimlarim');
      const rsvps = res.data.map(mapRsvpResponse);
      set({
        myRsvpsByEvent: rsvps.reduce<Record<string, Rsvp>>((acc, rsvp) => {
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
      const payload = mapEventCreatePayload(data);
      const res = await api.post<any>('/etkinlikler/taslak', payload);
      const event = mapEventResponse(res.data);
      set({ successMessage: 'Etkinlik taslağı başarıyla oluşturuldu.', isLoading: false });
      await get().fetchManagedEvents();
      return event;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Etkinlik oluşturulurken hata oluştu.', isLoading: false });
      return null;
    }
  },

  updateEvent: async (eventId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = mapEventCreatePayload(data);
      await api.put(`/etkinlikler/${eventId}`, payload);
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
      await api.post(`/etkinlikler/${eventId}/onaya-sun`);
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
      await api.post(`/etkinlikler/${eventId}/onayla`);
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
      await api.post(`/etkinlikler/${eventId}/revizyon-talebi`, { geriBildirim: feedback });
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
      await api.post(`/etkinlikler/${eventId}/iptal`, { neden: reason });
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
      await api.post(`/etkinlikler/${eventId}/katilim`);
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
      await api.post(`/etkinlikler/${eventId}/katilim/iptal`);
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
      await api.post(`/etkinlikler/${eventId}/yoklama/${targetUserId}`);
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
      await api.post(`/etkinlikler/${eventId}/yoklama/karekod`, { belirtec: token });
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
      const res = await api.get<any[]>(`/etkinlikler/${eventId}/katilimcilar`);
      let participants = res.data.map(mapParticipantResponse);
      const userIds = [...new Set(participants.map(participant => participant.userId).filter(Boolean))];
      if (userIds.length > 0) {
        try {
          const profileRes = await api.post('/kullanicilar/toplu', { kullaniciIdleri: userIds });
          const profileMap = new Map<string, any>();
          (profileRes.data || []).forEach((profile: any) => profileMap.set(profile.id, profile));
          participants = participants.map(participant => {
            const profile = profileMap.get(participant.userId);
            return {
              ...participant,
              fullName: profile?.tamAd || participant.fullName || participant.userId,
              studentNumber: profile?.ogrenciNumarasi || participant.studentNumber || participant.userId,
              email: profile?.eposta || participant.email || '',
              department: profile?.bolum || participant.department || '',
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
      await api.post(`/etkinlikler/${eventId}/yoklamalar/${rsvpId}/odeme/onayla`);
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
      await api.post(`/etkinlikler/${eventId}/yoklamalar/${rsvpId}/odeme/reddet`);
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
      const res = await api.post<any>(`/etkinlikler/${eventId}/sertifikalar/dagit`);
      const data = res.data;
      const issued = data.verilenSertifikaSayisi ?? data.issuedCertificateCount ?? 0;
      const eligible = data.uygunKatilimciSayisi ?? data.eligibleParticipantCount ?? 0;
      set({
        successMessage: `${issued} sertifika oluşturuldu. Toplam uygun katılımcı: ${eligible}.`,
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
      const res = await api.get<any[]>(`/etkinlikler/${eventId}/denetim-gunlukleri`, { params: filters });
      set(state => ({
        auditLogsByEvent: {
          ...state.auditLogsByEvent,
          [eventId]: res.data.map(mapAuditLogResponse),
        },
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'İşlem geçmişi yüklenirken hata oluştu.' });
    }
  }
}));
