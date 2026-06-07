import { create } from 'zustand';
import { api } from '../lib/api';

export type KullaniciRol =
  | 'ROLE_ADMIN' | 'ROLE_SKS_ADMIN' | 'ROLE_FACILITY_ADMIN' | 'ROLE_REGISTRAR' | 'ROLE_STUDENT';

/** Backend (auth-service /yonetim) yanıtları ile birebir. */
export interface YonetimKullanicisi {
  id: string;
  eposta: string;
  roller: string;
  ad?: string;
  soyad?: string;
  ogrenciNumarasi?: string;
  fakulte?: string;
  bolum?: string;
  kayitYili?: number;
  durum: string;
  epostaDogrulandi: boolean;
  sifreDegistirmeli: boolean;
  sonGirisTarihi?: string;
  olusturulmaTarihi?: string;
  guncellenmeTarihi?: string;
  geciciSifre?: string;
}

export interface DenetimKaydi {
  id: string;
  varlikTuru: string;
  varlikId: string;
  islem: string;
  islemYapanId: string;
  islemYapanRol?: string;
  mesaj: string;
  metaVeri?: string;
  olusturulmaTarihi: string;
}

export interface KullaniciOlusturmaFormu {
  eposta: string;
  roller: string;
  ad?: string;
  soyad?: string;
  fakulte?: string;
  bolum?: string;
  geciciSifre?: string;
}

export interface KullaniciGuncellemeFormu {
  ad?: string;
  soyad?: string;
  roller?: string;
  fakulte?: string;
  bolum?: string;
  durum?: string;
}

interface YonetimState {
  kullanicilar: YonetimKullanicisi[];
  toplamKullanici: number;
  toplamSayfa: number;
  mevcutSayfa: number;
  loglar: DenetimKaydi[];
  isLoading: boolean;
  hata: string | null;
  basariMesaji: string | null;
  temizleMesajlar: () => void;
  kullanicilariGetir: (sayfa?: number, boyut?: number, arama?: string, durum?: string, rol?: string) => Promise<void>;
  kullaniciOlustur: (form: KullaniciOlusturmaFormu) => Promise<YonetimKullanicisi | null>;
  kullaniciGuncelle: (id: string, form: KullaniciGuncellemeFormu) => Promise<boolean>;
  sifreSifirla: (id: string) => Promise<string | null>;
  kullaniciSil: (id: string) => Promise<boolean>;
  loglariGetir: (varlikTuru?: string, arama?: string) => Promise<void>;
}

const hataMesaji = (err: any, varsayilan: string) =>
  err?.response?.data?.message || err?.response?.data?.mesaj || err?.message || varsayilan;

export const useYonetimDeposu = create<YonetimState>((set, get) => ({
  kullanicilar: [],
  toplamKullanici: 0,
  toplamSayfa: 0,
  mevcutSayfa: 0,
  loglar: [],
  isLoading: false,
  hata: null,
  basariMesaji: null,

  temizleMesajlar: () => set({ hata: null, basariMesaji: null }),

  kullanicilariGetir: async (sayfa = 0, boyut = 20, arama = '', durum = '', rol = '') => {
    set({ isLoading: true, hata: null });
    try {
      const res = await api.get<any>('/yonetim/kullanicilar', {
        params: { sayfa, boyut, arama: arama || undefined, durum: durum || undefined, rol: rol || undefined },
      });
      set({
        kullanicilar: res.data.content,
        toplamKullanici: res.data.totalElements,
        toplamSayfa: res.data.totalPages,
        mevcutSayfa: res.data.number,
        isLoading: false,
      });
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Kullanıcılar yüklenemedi.'), isLoading: false });
    }
  },

  kullaniciOlustur: async (form) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      const res = await api.post<YonetimKullanicisi>('/yonetim/kullanicilar', form);
      set({ basariMesaji: 'Kullanıcı oluşturuldu.', isLoading: false });
      await get().kullanicilariGetir(get().mevcutSayfa);
      return res.data;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Kullanıcı oluşturulamadı.'), isLoading: false });
      return null;
    }
  },

  kullaniciGuncelle: async (id, form) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      await api.put(`/yonetim/kullanicilar/${id}`, form);
      set({ basariMesaji: 'Kullanıcı güncellendi.', isLoading: false });
      await get().kullanicilariGetir(get().mevcutSayfa);
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Kullanıcı güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  sifreSifirla: async (id) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      const res = await api.post<{ geciciSifre: string }>(`/yonetim/kullanicilar/${id}/sifre-sifirla`);
      set({ basariMesaji: 'Şifre sıfırlandı.', isLoading: false });
      return res.data.geciciSifre;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Şifre sıfırlanamadı.'), isLoading: false });
      return null;
    }
  },

  kullaniciSil: async (id) => {
    set({ isLoading: true, hata: null, basariMesaji: null });
    try {
      await api.delete(`/yonetim/kullanicilar/${id}`);
      set({ basariMesaji: 'Kullanıcı silindi.', isLoading: false });
      await get().kullanicilariGetir(get().mevcutSayfa);
      return true;
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Kullanıcı silinemedi.'), isLoading: false });
      return false;
    }
  },

  loglariGetir: async (varlikTuru = '', arama = '') => {
    set({ isLoading: true, hata: null });
    try {
      const res = await api.get<DenetimKaydi[]>('/denetim-gunlukleri', {
        params: { varlikTuru: varlikTuru || undefined, arama: arama || undefined },
      });
      set({ loglar: res.data, isLoading: false });
    } catch (err: any) {
      set({ hata: hataMesaji(err, 'Sistem logları yüklenemedi.'), isLoading: false });
    }
  },
}));
