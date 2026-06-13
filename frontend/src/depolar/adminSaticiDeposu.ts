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
      set({ basariMesaji: 'Satıcı güncellendi.', isLoading: false });
      await get().saticilariGetir();
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Satıcı güncellenemedi.'), isLoading: false });
      return false;
    }
  },
}));
