import { create } from 'zustand';
import { api } from '../lib/api';
import type { Satici } from './yemekDeposu';

/** Satıcı yöneticisi olarak atanabilecek kullanıcı (ROLE_VENDOR_ADMIN). */
export interface VendorAdminKullanici {
  id: string;
  eposta: string;
  ad?: string;
  soyad?: string;
}

export interface SaticiOlusturmaFormu {
  ad: string;
  yoneticiKullaniciId: string;
  konumMetni?: string;
  aciklama?: string;
  logoUrl?: string;
}

export interface SaticiGuncellemeFormu {
  ad?: string;
  konumMetni?: string;
  aciklama?: string;
  logoUrl?: string;
  durum?: 'AKTIF' | 'PASIF';
}

/** İşletme + sahibini tek adımda oluşturma. */
export interface SaticiVeSahipFormu {
  ad: string;            // işletme adı
  konumMetni?: string;
  aciklama?: string;
  logoUrl?: string;
  sahipAd: string;
  sahipSoyad: string;
  sahipEposta: string;
  sahipTc: string;       // 11 hane — varsayılan şifre
}

interface AdminSaticiState {
  saticilar: Satici[];
  vendorAdminler: VendorAdminKullanici[];
  isLoading: boolean;
  hata: string | null;
  basariMesaji: string | null;

  temizleMesajlar: () => void;
  saticilariGetir: () => Promise<void>;
  vendorAdminleriGetir: () => Promise<void>;
  saticiOlustur: (form: SaticiOlusturmaFormu) => Promise<boolean>;
  saticiVeSahipOlustur: (form: SaticiVeSahipFormu) => Promise<boolean>;
  saticiGuncelle: (id: string, form: SaticiGuncellemeFormu) => Promise<boolean>;
  saticiSil: (id: string) => Promise<boolean>;
  yoneticiDegistir: (id: string, sahip: { ad: string; soyad: string; eposta: string; tc: string }) => Promise<boolean>;
}

const hataMesaji = (err: any, varsayilan: string) =>
  err?.response?.data?.message || err?.response?.data?.mesaj || err?.message || varsayilan;

export const useAdminSaticiDeposu = create<AdminSaticiState>((set, get) => ({
  saticilar: [],
  vendorAdminler: [],
  isLoading: false,
  hata: null,
  basariMesaji: null,

  temizleMesajlar: () => set({ hata: null, basariMesaji: null }),

  saticilariGetir: async () => {
    set({ isLoading: true, hata: null });
    try {
      const res = await api.get<Satici[]>('/yonetim/saticilar');
      set({ saticilar: res.data, isLoading: false });
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Satıcılar yüklenemedi.'), isLoading: false });
    }
  },

  vendorAdminleriGetir: async () => {
    try {
      const res = await api.get<any>('/yonetim/kullanicilar', {
        params: { sayfa: 0, boyut: 100, rol: 'ROLE_VENDOR_ADMIN' },
      });
      const liste: VendorAdminKullanici[] = (res.data.content || []).map((k: any) => ({
        id: k.id, eposta: k.eposta, ad: k.ad, soyad: k.soyad,
      }));
      set({ vendorAdminler: liste });
    } catch {
      // sessiz — dropdown boş kalır
    }
  },

  saticiOlustur: async (form) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      await api.post('/yonetim/saticilar', form);
      set({ basariMesaji: 'Satıcı oluşturuldu.', isLoading: false });
      await get().saticilariGetir();
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Satıcı oluşturulamadı.'), isLoading: false });
      return false;
    }
  },

  saticiVeSahipOlustur: async (form) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      // 1) İşletme sahibi hesabı (ROLE_VENDOR_ADMIN) — varsayılan şifre = TC
      const userRes = await api.post<{ id: string }>('/yonetim/kullanicilar', {
        ad: form.sahipAd, soyad: form.sahipSoyad, roller: 'ROLE_VENDOR_ADMIN',
        eposta: form.sahipEposta, tcKimlikNo: form.sahipTc,
      });
      const yoneticiKullaniciId = userRes.data.id;
      // 2) İşletme — yeni sahibe bağlı
      await api.post('/yonetim/saticilar', {
        ad: form.ad, yoneticiKullaniciId,
        konumMetni: form.konumMetni, aciklama: form.aciklama, logoUrl: form.logoUrl,
      });
      set({ basariMesaji: 'İşletme ve sahibi oluşturuldu. Sahip e-posta + TC ile giriş yapar (ilk girişte şifre değiştirilir).', isLoading: false });
      await get().saticilariGetir();
      await get().vendorAdminleriGetir();
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'İşletme/sahip oluşturulamadı.'), isLoading: false });
      return false;
    }
  },

  saticiGuncelle: async (id, form) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      await api.put(`/yonetim/saticilar/${id}`, form);
      set({ basariMesaji: 'İşletme güncellendi.', isLoading: false });
      await get().saticilariGetir();
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'İşletme güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  saticiSil: async (id) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      // 1) İşletme + bağlı food kayıtları + personel hesapları silinir; sahip id'si döner.
      const res = await api.delete<{ yoneticiKullaniciId: string }>(`/yonetim/saticilar/${id}`);
      // 2) Sahip hesabı denetim için silinmez, PASIF'e alınır.
      const sahipId = res.data?.yoneticiKullaniciId;
      if (sahipId) {
        try { await api.put(`/yonetim/kullanicilar/${sahipId}`, { durum: 'PASIF' }); } catch { /* sahip zaten yoksa yok say */ }
      }
      set({ basariMesaji: 'İşletme silindi; eski yönetici hesabı askıya alındı (PASIF).', isLoading: false });
      await get().saticilariGetir();
      await get().vendorAdminleriGetir();
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'İşletme silinemedi.'), isLoading: false });
      return false;
    }
  },

  yoneticiDegistir: async (id, sahip) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      // 1) Yeni işletme yöneticisi hesabı
      const userRes = await api.post<{ id: string }>('/yonetim/kullanicilar', {
        ad: sahip.ad, soyad: sahip.soyad, roller: 'ROLE_VENDOR_ADMIN', eposta: sahip.eposta, tcKimlikNo: sahip.tc,
      });
      const yeniYoneticiId = userRes.data.id;
      // 2) İşletmeye ata; eski yönetici id'si döner
      const res = await api.put<{ eskiYoneticiId: string }>(`/yonetim/saticilar/${id}/yonetici`, { yeniYoneticiId });
      // 3) Eski yönetici PASIF (denetim için silinmez)
      const eskiId = res.data?.eskiYoneticiId;
      if (eskiId) {
        try { await api.put(`/yonetim/kullanicilar/${eskiId}`, { durum: 'PASIF' }); } catch { /* yok say */ }
      }
      set({ basariMesaji: 'Yönetici değiştirildi; eski yönetici askıya alındı (PASIF).', isLoading: false });
      await get().saticilariGetir();
      await get().vendorAdminleriGetir();
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Yönetici değiştirilemedi.'), isLoading: false });
      return false;
    }
  },
}));
