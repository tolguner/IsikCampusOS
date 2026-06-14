import { create } from 'zustand';
import { api } from '../lib/api';
import { type Etkinlik, mapEventResponse } from './etkinlikDeposu';

/** Backend (event-service) KulupYaniti ile birebir — çeviri (mapper) yoktur. */
export interface Kulup {
  id: string;
  ad: string;
  kisaAciklama?: string;
  vizyon?: string;
  aciklama: string;
  yoneticiKullaniciId: string;
  baskanAdSoyad?: string;
  baskanEposta?: string;
  logoUrl?: string;
  danismanAkademikKadroId?: string;
  danismanUnvani?: string;
  danismanAdSoyad?: string;
  danismanEposta?: string;
  danismanBolumu?: string;
  aktif: boolean;
  uyeSayisi: number;
  etkinlikSayisi: number;
  mevcutKullaniciUyeMi: boolean;
  mevcutKullaniciRol: 'YONETICI' | 'UYE' | null;
  mevcutKullaniciDurum: 'AKTIF' | 'REDDEDILDI' | null;
  onayGerektirir?: boolean;
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

export interface KulupSaglik {
  kulupId: string;
  kulupAdi: string;
  aktif: boolean;
  uyeSayisi: number;
  aktifEtkinlikSayisi: number;
  gelecekEtkinlikSayisi: number;
  onayBekleyenEtkinlikSayisi: number;
  onayBekleyenProfilTalebiSayisi: number;
  sonEtkinlikTarihi?: string;
  sonDuyuruTarihi?: string;
  katilimOrtalamasi: number;
  saglikDurumu: 'Sağlıklı' | 'Takip Edilmeli' | 'Riskli' | 'Pasifleşmeye Aday';
  gozetimAltinda: boolean;
  sonNot?: string;
  sonNotuYazan?: string;
  sonNotTarihi?: string;
}

export interface KulupDuyurusu {
  id: string;
  kulupId: string;
  kulupAdi: string;
  baslik: string;
  mesaj: string;
  baglantiUrl?: string;
  baglantiEtiketi?: string;
  resimUrl?: string;
  olusturanKullaniciId: string;
  olusturulmaTarihi: string;
}

export interface KulupUyesi {
  id: string;
  kulupId: string;
  kullaniciId: string;
  adSoyad: string;
  ogrenciNumarasi?: string;
  bolum?: string;
  rol: 'YONETICI' | 'UYE' | string;
  durum: string;
  katilmaTarihi: string;
}

export interface KulupProfilDegisiklikIstegi {
  id: string;
  kulup: Kulup;
  talepEden: string;
  ad: string;
  kisaAciklama: string;
  vizyon: string;
  logoUrl?: string;
  durum: 'BEKLEMEDE' | 'ONAYLANDI' | 'REVIZYON_TALEP_EDILDI' | 'REDDEDILDI';
  geriBildirim?: string;
  inceleyen?: string;
  incelemeTarihi?: string;
  olusturulmaTarihi: string;
  guncellenmeTarihi: string;
}

type KulupProfilGuncelleme = Pick<Kulup, 'ad' | 'kisaAciklama' | 'vizyon' | 'aciklama' | 'logoUrl' | 'danismanAkademikKadroId' | 'danismanUnvani' | 'danismanAdSoyad' | 'danismanEposta' | 'danismanBolumu' | 'onayGerektirir'> & {
  yoneticiKullaniciId?: string;
  baskanAdSoyad?: string;
  baskanEposta?: string;
};
type KulupProfilGuncellemeTalebi = Pick<Kulup, 'ad' | 'kisaAciklama' | 'vizyon' | 'aciklama' | 'logoUrl'>;

interface ClubState {
  clubs: Kulup[];
  managedClubs: Kulup[];
  selectedClub: Kulup | null;
  clubEvents: Etkinlik[];
  clubMembers: KulupUyesi[];
  clubAnnouncements: KulupDuyurusu[];
  profileChangeRequests: KulupProfilDegisiklikIstegi[];
  clubHealth: KulupSaglik[];
  clubAuditLogsByClub: Record<string, DenetimGunlugu[]>;
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
  createClub: (data: Partial<Kulup> & { yoneticiKullaniciId: string; kisaAciklama: string; vizyon: string; danismanAkademikKadroId?: string; danismanUnvani?: string; danismanAdSoyad: string; danismanEposta: string; danismanBolumu: string }) => Promise<boolean>;
  updateClubProfile: (clubId: string, data: KulupProfilGuncelleme) => Promise<boolean>;
  requestClubProfileUpdate: (clubId: string, data: KulupProfilGuncellemeTalebi) => Promise<boolean>;
  fetchProfileChangeRequests: () => Promise<void>;
  approveProfileChangeRequest: (requestId: string) => Promise<boolean>;
  requestProfileChangeRevision: (requestId: string, feedback: string) => Promise<boolean>;
  rejectProfileChangeRequest: (requestId: string, feedback: string) => Promise<boolean>;
  createClubAnnouncement: (clubId: string, data: { baslik: string; mesaj: string; baglantiUrl?: string; baglantiEtiketi?: string; resimUrl?: string }) => Promise<boolean>;
  changeClubStatus: (clubId: string, active: boolean) => Promise<boolean>;
  assignPresident: (clubId: string, data: { ogrenciId: string; adSoyad: string; eposta: string }) => Promise<boolean>;
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
    return err?.response?.data?.message || 'Bu işlem için yetkiniz yok. Akademik, Sosyal ve Kültürel Gelişim Koordinatörlüğü hesabıyla giriş yaptığınızdan emin olun.';
  }

  return err?.response?.data?.message || err?.message || fallback;
};

// API (event-service) yanıtları artık tiplerle birebir aynı; çeviri yapılmaz.
// Bu ince passthrough'lar yalnızca res.data'ya doğru tipi verir.
const mapClubResponse = (data: any): Kulup => data;
const mapClubProfileChangeRequestResponse = (data: any): KulupProfilDegisiklikIstegi => data;
const mapClubMemberResponse = (data: any): KulupUyesi => data;
const mapClubHealthResponse = (data: any): KulupSaglik => data;
const mapClubAnnouncementResponse = (data: any): KulupDuyurusu => data;
const mapAuditLogResponse = (data: any): DenetimGunlugu => data;

export const useKulupDeposu = create<ClubState>((set, get) => ({
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
      await api.post('/kulupler', data);
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
      await api.patch(`/kulupler/${clubId}/profil`, data);
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
      await api.post(`/kulupler/${clubId}/profil-guncelleme-talepleri`, data);
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
      await api.post(`/kulupler/${clubId}/duyurular`, data);
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
      await api.patch(`/kulupler/${clubId}/baskan`, data);
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
      const members: KulupUyesi[] = response.data.map(mapClubMemberResponse);

      // Toplu kullanıcı bilgisi çek (ad, öğrenci no, bölüm)
      if (members.length > 0) {
        try {
          const userIds = members.map(m => m.kullaniciId);
          const profileRes = await api.post('/kullanicilar/toplu', { kullaniciIdleri: userIds });
          const profileMap = new Map<string, any>();
          (profileRes.data || []).forEach((p: any) => profileMap.set(p.id, p));

          const enriched = members.map(m => {
            const profile = profileMap.get(m.kullaniciId);
            return {
              ...m,
              adSoyad: profile?.tamAd || m.adSoyad || 'Bilinmiyor',
              ogrenciNumarasi: profile?.ogrenciNumarasi || m.ogrenciNumarasi || m.kullaniciId,
              bolum: profile?.bolum || m.bolum || '',
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
      set({ clubMembers: clubMembers.map(m => m.kullaniciId === userId ? { ...m, rol: role } : m), isLoading: false });
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
      set({ clubMembers: clubMembers.map(m => m.kullaniciId === userId ? { ...m, durum: status } : m), isLoading: false });
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
      set({ clubMembers: clubMembers.filter(m => m.kullaniciId !== userId), isLoading: false });
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
