import { create } from 'zustand';
import { api } from '../lib/api';
import { type Event, mapEventResponse } from './eventStore';

export interface Club {
  id: string;
  name: string;
  shortDescription?: string;
  vision?: string;
  description: string;
  adminUserId: string;
  presidentFullName?: string;
  presidentEmail?: string;
  logoUrl?: string;
  advisorAcademicStaffId?: string;
  advisorTitle?: string;
  advisorFullName?: string;
  advisorEmail?: string;
  advisorDepartment?: string;
  active: boolean;
  memberCount: number;
  eventCount: number;
  currentUserMember: boolean;
  currentUserRole: 'MEMBER' | 'ADMIN' | null;
  currentUserStatus: 'ACTIVE' | 'REJECTED' | null;
  requiresApproval?: boolean;
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

export interface ClubHealth {
  clubId: string;
  clubName: string;
  active: boolean;
  memberCount: number;
  activeEventCount: number;
  upcomingEventCount: number;
  pendingEventCount: number;
  pendingProfileRequestCount: number;
  lastEventAt?: string;
  lastAnnouncementAt?: string;
  attendanceAverage: number;
  healthStatus: 'Sağlıklı' | 'Takip Edilmeli' | 'Riskli' | 'Pasifleşmeye Aday';
  watchlisted: boolean;
  latestNote?: string;
  latestNoteBy?: string;
  latestNoteAt?: string;
}

export interface ClubAnnouncement {
  id: string;
  clubId: string;
  clubName: string;
  title: string;
  message: string;
  linkUrl?: string;
  linkLabel?: string;
  imageUrl?: string;
  createdByUserId: string;
  createdAt: string;
}

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  studentId?: string;
  fullName: string;
  department?: string;
  role: string;
  status: string;
  joinedAt: string;
}

export interface ClubProfileChangeRequest {
  id: string;
  club: Club;
  requestedBy: string;
  name: string;
  shortDescription: string;
  vision: string;
  logoUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

type ClubProfileUpdate = Pick<Club, 'name' | 'shortDescription' | 'vision' | 'description' | 'logoUrl' | 'advisorAcademicStaffId' | 'advisorTitle' | 'advisorFullName' | 'advisorEmail' | 'advisorDepartment' | 'requiresApproval'> & {
  adminUserId?: string;
  presidentFullName?: string;
  presidentEmail?: string;
};
type ClubProfileUpdateRequest = Pick<Club, 'name' | 'shortDescription' | 'vision' | 'description' | 'logoUrl'>;

interface ClubState {
  clubs: Club[];
  managedClubs: Club[];
  selectedClub: Club | null;
  clubEvents: Event[];
  clubMembers: ClubMember[];
  clubAnnouncements: ClubAnnouncement[];
  profileChangeRequests: ClubProfileChangeRequest[];
  clubHealth: ClubHealth[];
  clubAuditLogsByClub: Record<string, AuditLog[]>;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
  fetchClubs: () => Promise<void>;
  fetchClub: (clubId: string) => Promise<void>;
  fetchClubEvents: (clubId: string) => Promise<void>;
  joinClub: (clubId: string) => Promise<boolean>;
  leaveClub: (clubId: string) => Promise<boolean>;
  fetchAdminClubs: () => Promise<void>;
  fetchManagedClubs: () => Promise<void>;
  createClub: (data: Partial<Club> & { adminUserId: string; shortDescription: string; vision: string; advisorAcademicStaffId?: string; advisorTitle?: string; advisorFullName: string; advisorEmail: string; advisorDepartment: string }) => Promise<boolean>;
  updateClubProfile: (clubId: string, data: ClubProfileUpdate) => Promise<boolean>;
  requestClubProfileUpdate: (clubId: string, data: ClubProfileUpdateRequest) => Promise<boolean>;
  fetchProfileChangeRequests: () => Promise<void>;
  approveProfileChangeRequest: (requestId: string) => Promise<boolean>;
  requestProfileChangeRevision: (requestId: string, feedback: string) => Promise<boolean>;
  rejectProfileChangeRequest: (requestId: string, feedback: string) => Promise<boolean>;
  createClubAnnouncement: (clubId: string, data: { title: string; message: string; linkUrl?: string; linkLabel?: string; imageUrl?: string }) => Promise<boolean>;
  changeClubStatus: (clubId: string, active: boolean) => Promise<boolean>;
  assignPresident: (clubId: string, data: { studentId: string; fullName: string; email: string }) => Promise<boolean>;
  deleteClub: (clubId: string) => Promise<boolean>;
  fetchClubMembers: (clubId: string) => Promise<void>;
  updateMemberRole: (clubId: string, userId: string, role: string) => Promise<boolean>;
  updateMemberStatus: (clubId: string, userId: string, status: string) => Promise<boolean>;
  removeClubMember: (clubId: string, userId: string) => Promise<boolean>;
  fetchClubAnnouncements: (clubId: string) => Promise<void>;
  fetchClubHealth: () => Promise<void>;
  addClubHealthNote: (clubId: string, message: string) => Promise<boolean>;
  watchlistClub: (clubId: string, message: string) => Promise<boolean>;
  requestClubHealthAction: (clubId: string, message: string) => Promise<boolean>;
  fetchClubAuditLogs: (clubId: string, filters?: { action?: string; actorId?: string; from?: string; to?: string; search?: string }) => Promise<void>;
}

const getErrorMessage = (err: any, fallback: string) => {
  if (err?.response?.status === 403) {
    return err?.response?.data?.message || 'Bu işlem için yetkiniz yok. SKS hesabıyla giriş yaptığınızdan emin olun.';
  }

  return err?.response?.data?.message || err?.message || fallback;
};

const mapClubResponse = (data: any): Club => {
  return {
    id: data.id,
    name: data.ad,
    shortDescription: data.kisaAciklama,
    vision: data.vizyon,
    description: data.aciklama,
    adminUserId: data.yoneticiKullaniciId,
    presidentFullName: data.baskanAdSoyad,
    presidentEmail: data.baskanEposta,
    logoUrl: data.logoUrl,
    advisorAcademicStaffId: data.danismanAkademikKadroId,
    advisorTitle: data.danismanUnvani,
    advisorFullName: data.danismanAdSoyad,
    advisorEmail: data.danismanEposta,
    advisorDepartment: data.danismanBolumu,
    active: data.aktif,
    requiresApproval: data.onayGerektirir,
    memberCount: Number(data.uyeSayisi || 0),
    eventCount: Number(data.etkinlikSayisi || 0),
    currentUserMember: data.mevcutKullaniciUyeMi,
    currentUserRole: data.mevcutKullaniciRol === 'YONETICI' ? 'ADMIN' : (data.mevcutKullaniciRol === 'UYE' ? 'MEMBER' : data.mevcutKullaniciRol),
    currentUserStatus: data.mevcutKullaniciDurum === 'AKTIF' ? 'ACTIVE' : (data.mevcutKullaniciDurum === 'REDDEDILDI' ? 'REJECTED' : data.mevcutKullaniciDurum)
  };
};

const mapClubProfileChangeRequestResponse = (data: any): ClubProfileChangeRequest => {
  return {
    id: data.id,
    club: mapClubResponse(data.kulup),
    requestedBy: data.talepEden,
    name: data.ad,
    shortDescription: data.kisaAciklama,
    vision: data.vizyon,
    logoUrl: data.logoUrl,
    status: data.durum,
    feedback: data.geriBildirim,
    reviewedBy: data.inceleyen,
    reviewedAt: data.incelemeTarihi,
    createdAt: data.olusturulmaTarihi,
    updatedAt: data.guncellenmeTarihi
  };
};

const mapClubMemberResponse = (data: any): ClubMember => {
  return {
    id: data.id,
    clubId: data.kulupId,
    userId: data.kullaniciId,
    fullName: data.adSoyad,
    role: data.rol === 'YONETICI' ? 'ADMIN' : (data.rol === 'UYE' ? 'MEMBER' : data.rol),
    status: data.durum,
    joinedAt: data.katilmaTarihi
  };
};

const mapClubHealthResponse = (data: any): ClubHealth => {
  return {
    clubId: data.kulupId,
    clubName: data.kulupAdi,
    active: data.aktif,
    memberCount: Number(data.uyeSayisi || 0),
    activeEventCount: Number(data.aktifEtkinlikSayisi || 0),
    upcomingEventCount: Number(data.gelecekEtkinlikSayisi || 0),
    pendingEventCount: Number(data.onayBekleyenEtkinlikSayisi || 0),
    pendingProfileRequestCount: Number(data.onayBekleyenProfilTalebiSayisi || 0),
    lastEventAt: data.sonEtkinlikTarihi,
    lastAnnouncementAt: data.sonDuyuruTarihi,
    attendanceAverage: Number(data.katilimOrtalamasi || 0),
    healthStatus: data.saglikDurumu,
    watchlisted: data.gozetimAltinda,
    latestNote: data.sonNot,
    latestNoteBy: data.sonNotuYazan,
    latestNoteAt: data.sonNotTarihi
  };
};

const mapClubAnnouncementResponse = (data: any): ClubAnnouncement => {
  return {
    id: data.id,
    clubId: data.kulupId,
    clubName: data.kulupAdi,
    title: data.baslik,
    message: data.mesaj,
    linkUrl: data.baglantiUrl,
    linkLabel: data.baglantiEtiketi,
    imageUrl: data.resimUrl,
    createdByUserId: data.olusturanKullaniciId,
    createdAt: data.olusturulmaTarihi
  };
};

const mapAuditLogResponse = (data: any): AuditLog => {
  let entityType: 'CLUB' | 'EVENT' = 'CLUB';
  if (data.varlikTuru === 'ETKINLIK') entityType = 'EVENT';
  return {
    id: data.id,
    entityType,
    entityId: data.varlikId,
    action: data.islem,
    actorId: data.islemYapanId,
    actorRole: data.islemYapanRol,
    message: data.mesaj,
    metadata: data.metaVeri,
    createdAt: data.olusturulmaTarihi
  };
};

export const useClubStore = create<ClubState>((set, get) => ({
  clubs: [],
  managedClubs: [],
  selectedClub: null,
  clubEvents: [],
  clubMembers: [],
  clubAnnouncements: [],
  profileChangeRequests: [],
  clubHealth: [],
  clubAuditLogsByClub: {},
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  fetchClubs: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/kulupler');
      set({ clubs: res.data.map(mapClubResponse), isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulüpler yüklenirken hata oluştu.'), isLoading: false });
    }
  },

  fetchClub: async (clubId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any>(`/kulupler/${clubId}`);
      set({ selectedClub: mapClubResponse(res.data), isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulüp detayı yüklenirken hata oluştu.'), isLoading: false });
    }
  },

  fetchClubEvents: async (clubId) => {
    set({ error: null });
    try {
      const res = await api.get<any[]>(`/kulupler/${clubId}/etkinlikler`);
      set({ clubEvents: res.data.map(mapEventResponse) });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulüp etkinlikleri yüklenirken hata oluştu.') });
    }
  },

  joinClub: async (clubId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/kulupler/${clubId}/katil`);
      set({ successMessage: 'Kulübe katılımın alındı.', isLoading: false });
      await get().fetchClubs();
      await get().fetchClub(clubId);
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulübe katılım başarısız.'), isLoading: false });
      return false;
    }
  },

  leaveClub: async (clubId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.delete(`/kulupler/${clubId}/uyelik`);
      set({ successMessage: 'Kulüp üyeliğin sonlandırıldı.', isLoading: false });
      await get().fetchClubs();
      await get().fetchClub(clubId);
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulüp üyeliğinden çıkma işlemi başarısız.'), isLoading: false });
      return false;
    }
  },

  fetchAdminClubs: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/kulupler/admin');
      set({ clubs: res.data.map(mapClubResponse), isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulüp yönetim listesi yüklenirken hata oluştu.'), isLoading: false });
    }
  },

  fetchManagedClubs: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/kulupler/yonetilen');
      set({ managedClubs: res.data.map(mapClubResponse), isLoading: false });
    } catch (err: any) {
      set({ managedClubs: [] });
      set({ error: getErrorMessage(err, 'Yönettiğiniz kulüpler yüklenirken hata oluştu.'), isLoading: false });
    }
  },

  createClub: async (data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        ad: data.name,
        kisaAciklama: data.shortDescription,
        vizyon: data.vision,
        aciklama: data.description,
        yoneticiKullaniciId: data.adminUserId,
        baskanAdSoyad: data.presidentFullName,
        baskanEposta: data.presidentEmail,
        logoUrl: data.logoUrl,
        danismanAkademikKadroId: data.advisorAcademicStaffId,
        danismanUnvani: data.advisorTitle,
        danismanAdSoyad: data.advisorFullName,
        danismanEposta: data.advisorEmail,
        danismanBolumu: data.advisorDepartment,
        onayGerektirir: data.requiresApproval
      };
      await api.post('/kulupler', payload);
      set({ successMessage: 'Kulüp oluşturuldu.', isLoading: false });
      await get().fetchAdminClubs();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulüp oluşturulamadı.'), isLoading: false });
      return false;
    }
  },

  updateClubProfile: async (clubId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        ad: data.name,
        kisaAciklama: data.shortDescription,
        vizyon: data.vision,
        aciklama: data.description,
        logoUrl: data.logoUrl,
        yoneticiKullaniciId: data.adminUserId,
        baskanAdSoyad: data.presidentFullName,
        baskanEposta: data.presidentEmail,
        danismanAkademikKadroId: data.advisorAcademicStaffId,
        danismanUnvani: data.advisorTitle,
        danismanAdSoyad: data.advisorFullName,
        danismanEposta: data.advisorEmail,
        danismanBolumu: data.advisorDepartment,
        onayGerektirir: data.requiresApproval
      };
      await api.patch(`/kulupler/${clubId}/profil`, payload);
      set({ successMessage: 'Kulüp profil bilgileri güncellendi.', isLoading: false });
      await get().fetchAdminClubs();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulüp profil bilgileri güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  requestClubProfileUpdate: async (clubId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        ad: data.name,
        kisaAciklama: data.shortDescription,
        vizyon: data.vision,
        aciklama: data.description,
        logoUrl: data.logoUrl
      };
      await api.post(`/kulupler/${clubId}/profil-guncelleme-talepleri`, payload);
      set({ successMessage: 'Profil güncelleme talebi SKS yönetimine iletildi.', isLoading: false });
      await get().fetchManagedClubs();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil güncelleme talebi gönderilemedi.'), isLoading: false });
      return false;
    }
  },

  fetchProfileChangeRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/kulupler/profil-guncelleme-talepleri');
      set({ profileChangeRequests: res.data.map(mapClubProfileChangeRequestResponse), isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil güncelleme talepleri yüklenemedi.'), isLoading: false });
    }
  },

  approveProfileChangeRequest: async (requestId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/kulupler/profil-guncelleme-talepleri/${requestId}/onayla`);
      set({ successMessage: 'Profil güncelleme talebi onaylandı.', isLoading: false });
      await get().fetchProfileChangeRequests();
      await get().fetchAdminClubs();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil güncelleme talebi onaylanamadı.'), isLoading: false });
      return false;
    }
  },

  requestProfileChangeRevision: async (requestId, feedback) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/kulupler/profil-guncelleme-talepleri/${requestId}/revizyon-talebi`, { geriBildirim: feedback });
      set({ successMessage: 'Revizyon talebi kulüp başkanına iletildi.', isLoading: false });
      await get().fetchProfileChangeRequests();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Revizyon talebi gönderilemedi.'), isLoading: false });
      return false;
    }
  },

  rejectProfileChangeRequest: async (requestId, feedback) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/kulupler/profil-guncelleme-talepleri/${requestId}/reddet`, { geriBildirim: feedback });
      set({ successMessage: 'Profil güncelleme talebi reddedildi.', isLoading: false });
      await get().fetchProfileChangeRequests();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil güncelleme talebi reddedilemedi.'), isLoading: false });
      return false;
    }
  },

  createClubAnnouncement: async (clubId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        baslik: data.title,
        mesaj: data.message,
        baglantiUrl: data.linkUrl,
        baglantiEtiketi: data.linkLabel,
        resimUrl: data.imageUrl
      };
      await api.post(`/kulupler/${clubId}/duyurular`, payload);
      set({ successMessage: 'Duyuru kulüp üyelerine gönderildi.', isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulüp duyurusu gönderilemedi.'), isLoading: false });
      return false;
    }
  },

  changeClubStatus: async (clubId, active) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.patch(`/kulupler/${clubId}/durum`, { aktif: active });
      set({ successMessage: active ? 'Kulüp aktif hale getirildi.' : 'Kulüp pasif hale getirildi.', isLoading: false });
      await get().fetchAdminClubs();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulüp durumu güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  assignPresident: async (clubId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        ogrenciId: data.studentId,
        adSoyad: data.fullName,
        eposta: data.email
      };
      await api.patch(`/kulupler/${clubId}/baskan`, payload);
      set({ successMessage: 'Kulüp başkanı güncellendi.', isLoading: false });
      await get().fetchAdminClubs();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kulüp başkanı atanamadı.'), isLoading: false });
      return false;
    }
  },

  deleteClub: async (clubId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/kulupler/${clubId}`);
      const { clubs } = get();
      set({ clubs: clubs.filter(c => c.id !== clubId), isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Kulüp silinemedi'), isLoading: false });
      return false;
    }
  },

  fetchClubMembers: async (clubId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/kulupler/${clubId}/uyeler`);
      const members: ClubMember[] = response.data.map(mapClubMemberResponse);

      // Toplu kullanıcı bilgisi çek (ad, öğrenci no, bölüm)
      if (members.length > 0) {
        try {
          const userIds = members.map(m => m.userId);
          const profileRes = await api.post('/kullanicilar/toplu', { kullaniciIdleri: userIds });
          const profileMap = new Map<string, any>();
          (profileRes.data || []).forEach((p: any) => profileMap.set(p.id, p));

          const enriched = members.map(m => {
            const profile = profileMap.get(m.userId);
            return {
              ...m,
              fullName: profile?.tamAd || m.fullName || 'Bilinmiyor',
              studentId: profile?.ogrenciNumarasi || m.studentId || m.userId,
              department: profile?.bolum || m.department || '',
            };
          });
          set({ clubMembers: enriched, isLoading: false });
        } catch {
          // Profil servisi çalışmıyorsa ham veriyle devam et
          set({ clubMembers: members, isLoading: false });
        }
      } else {
        set({ clubMembers: members, isLoading: false });
      }
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Üyeler yüklenemedi'), isLoading: false });
    }
  },

  updateMemberRole: async (clubId: string, userId: string, role: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/kulupler/${clubId}/uyeler/${userId}/rol`, { rol: role });
      const { clubMembers } = get();
      set({ clubMembers: clubMembers.map(m => m.userId === userId ? { ...m, role } : m), isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Rol güncellenemedi'), isLoading: false });
      return false;
    }
  },

  updateMemberStatus: async (clubId: string, userId: string, status: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/kulupler/${clubId}/uyeler/${userId}/durum`, { durum: status });
      const { clubMembers } = get();
      set({ clubMembers: clubMembers.map(m => m.userId === userId ? { ...m, status } : m), isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Durum güncellenemedi'), isLoading: false });
      return false;
    }
  },

  removeClubMember: async (clubId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/kulupler/${clubId}/uyeler/${userId}`);
      const { clubMembers } = get();
      set({ clubMembers: clubMembers.filter(m => m.userId !== userId), isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Üye silinemedi'), isLoading: false });
      return false;
    }
  },

  fetchClubAnnouncements: async (clubId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/kulupler/${clubId}/duyurular`);
      set({ clubAnnouncements: response.data.map(mapClubAnnouncementResponse), isLoading: false });
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Duyurular yüklenemedi'), isLoading: false });
    }
  },

  fetchClubHealth: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<any[]>('/yonetim/kulupler/saglik');
      set({ clubHealth: response.data.map(mapClubHealthResponse), isLoading: false });
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Kulüp sağlık görünümü yüklenemedi'), isLoading: false });
    }
  },

  addClubHealthNote: async (clubId, message) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/yonetim/kulupler/${clubId}/saglik-notlari`, { mesaj: message });
      set({ successMessage: 'Gözlem notu eklendi.', isLoading: false });
      await get().fetchClubHealth();
      await get().fetchClubAuditLogs(clubId);
      return true;
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Gözlem notu eklenemedi'), isLoading: false });
      return false;
    }
  },

  watchlistClub: async (clubId, message) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/yonetim/kulupler/${clubId}/takip-listesi`, { mesaj: message });
      set({ successMessage: 'Kulüp takip listesine alındı.', isLoading: false });
      await get().fetchClubHealth();
      await get().fetchClubAuditLogs(clubId);
      return true;
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Kulüp takip listesine alınamadı'), isLoading: false });
      return false;
    }
  },

  requestClubHealthAction: async (clubId, message) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/yonetim/kulupler/${clubId}/aksiyon-talebi`, { mesaj: message });
      set({ successMessage: 'Aksiyon bildirimi kulüp yöneticisine gönderildi.', isLoading: false });
      await get().fetchClubAuditLogs(clubId);
      return true;
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Aksiyon bildirimi gönderilemedi'), isLoading: false });
      return false;
    }
  },

  fetchClubAuditLogs: async (clubId, filters = {}) => {
    set({ error: null });
    try {
      const response = await api.get<any[]>(`/kulupler/${clubId}/denetim-gunlukleri`, { params: filters });
      set(state => ({
        clubAuditLogsByClub: {
          ...state.clubAuditLogsByClub,
          [clubId]: response.data.map(mapAuditLogResponse),
        },
      }));
    } catch (error: any) {
      set({ error: getErrorMessage(error, 'Kulüp işlem geçmişi yüklenemedi') });
    }
  },
}));
