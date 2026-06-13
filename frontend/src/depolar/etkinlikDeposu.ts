import { create } from 'zustand';
import { api } from '../lib/api';

/** Etkinlik yanıtı içindeki kulüp özeti. */
export interface EtkinlikKulupOzeti {
  id: string;
  ad: string;
  yoneticiKullaniciId: string;
  aciklama?: string;
}

export type EtkinlikDurumu =
  | 'TASLAK'
  | 'SKS_ONAYI_BEKLIYOR'
  | 'REVIZYON_TALEP_EDILDI'
  | 'YAYINLANDI'
  | 'REDDEDILDI'
  | 'IPTAL_EDILDI'
  | 'TAMAMLANDI';

export type KatilimDurumu =
  | 'ODEME_BEKLIYOR'
  | 'ONAYLANDI'
  | 'YEDEKTE'
  | 'IPTAL_EDILDI'
  | 'KATILDI'
  | 'GELMEDI';

/** Backend (club-service) etkinlik yanıtı ile birebir — çeviri (mapper) yoktur. */
export interface Etkinlik {
  id: string;
  kulup: EtkinlikKulupOzeti;
  baslik: string;
  aciklama: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  konum: string;
  etkinlikTuru?: 'CEVRIMICI' | 'YUZ_YUZE';
  cevrimiciPlatform?: string;
  cevrimiciToplantiUrl?: string;
  konumAdi?: string;
  konumDetayi?: string;
  enlem?: number;
  boylam?: number;
  afisResmiUrl?: string;
  kontenjanSiniriVar: boolean;
  kontenjanSinirli?: boolean;
  kontenjan: number;
  yedekListesiSiniriVar: boolean;
  yedekListesiKontenjani: number;
  mevcutRsvpSayisi: number;
  mevcutYedekSayisi: number;
  qrGirisEtkin: boolean;
  sertifikaEtkin: boolean;
  sertifikaBasligi?: string;
  sertifikalarinOlusturulmaTarihi?: string;
  ucretli?: boolean;
  ucretTutari?: number;
  iban?: string;
  odemeTalimatlari?: string;
  hatirlaticiEtkin?: boolean;
  hatirlatmaZamanlariDakika?: string;
  gonderilenHatirlatmaZamanlariDakika?: string;
  durum: EtkinlikDurumu;
  redNedeni?: string;
  guncellenmeTarihi?: string;
}

export interface Katilim {
  id: string;
  etkinlikId: string;
  kullaniciId: string;
  yoklamaBelirteci?: string;
  durum: KatilimDurumu;
  olusturulmaTarihi: string;
}

export interface EtkinlikKatilimci {
  katilimId: string;
  etkinlikId: string;
  kullaniciId: string;
  adSoyad?: string;
  ogrenciNumarasi?: string;
  eposta?: string;
  bolum?: string;
  durum: KatilimDurumu;
  kayitTarihi: string;
  yoklamaTarihi?: string;
  yoklamayiYapan?: string;
  odemeBekliyor: boolean;
  odemeOnaylandi: boolean;
  odemeIncelemeTarihi?: string;
  odemeyiInceleyen?: string;
  odemeRedNedeni?: string;
  sertifikaGonderildi: boolean;
  sertifikaGonderilmeTarihi?: string;
}

export interface DenetimGunlugu {
  id: string;
  varlikTuru: 'KULUP' | 'ETKINLIK';
  varlikId: string;
  islem: string;
  islemYapanId: string;
  islemYapanRol?: string;
  mesaj: string;
  metaVeri?: string;
  olusturulmaTarihi: string;
}

// API (club-service) yanıtları artık tiplerle birebir; çeviri yapılmaz (ince passthrough'lar).
export const mapEventResponse = (data: any): Etkinlik => data;
const mapRsvpResponse = (data: any): Katilim => data;
const mapParticipantResponse = (data: any): EtkinlikKatilimci => data;
const mapAuditLogResponse = (data: any): DenetimGunlugu => data;

const mapEventCreatePayload = (data: any) => ({
  kulupId: data.clubId,
  baslik: data.title,
  aciklama: data.description,
  baslangicTarihi: data.startTime,
  bitisTarihi: data.endTime,
  konum: data.location,
  etkinlikTuru: data.eventMode || undefined,
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
  events: Etkinlik[];
  managedEvents: Etkinlik[];
  participantsByEvent: Record<string, EtkinlikKatilimci[]>;
  myRsvpsByEvent: Record<string, Katilim>;
  reviewQueue: Etkinlik[];
  auditLogsByEvent: Record<string, DenetimGunlugu[]>;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  clearMessages: () => void;
  fetchPublishedEvents: () => Promise<void>;
  fetchManagedEvents: () => Promise<void>;
  fetchMyRsvps: () => Promise<void>;
  fetchReviewQueue: () => Promise<void>;
  createEventDraft: (data: any) => Promise<Etkinlik | null>;
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

export const useEtkinlikDeposu = create<EventState>((set, get) => ({
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
        myRsvpsByEvent: rsvps.reduce<Record<string, Katilim>>((acc, rsvp) => {
          acc[rsvp.etkinlikId] = rsvp;
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
      const userIds = [...new Set(participants.map(participant => participant.kullaniciId).filter(Boolean))];
      if (userIds.length > 0) {
        try {
          const profileRes = await api.post('/kullanicilar/toplu', { kullaniciIdleri: userIds });
          const profileMap = new Map<string, any>();
          (profileRes.data || []).forEach((profile: any) => profileMap.set(profile.id, profile));
          participants = participants.map(participant => {
            const profile = profileMap.get(participant.kullaniciId);
            return {
              ...participant,
              adSoyad: profile?.tamAd || participant.adSoyad || participant.kullaniciId,
              ogrenciNumarasi: profile?.ogrenciNumarasi || participant.ogrenciNumarasi || participant.kullaniciId,
              eposta: profile?.eposta || participant.eposta || '',
              bolum: profile?.bolum || participant.bolum || '',
            };
          });
        } catch {
          participants = participants.map(participant => ({
            ...participant,
            adSoyad: participant.adSoyad || participant.kullaniciId,
            ogrenciNumarasi: participant.ogrenciNumarasi || participant.kullaniciId,
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
