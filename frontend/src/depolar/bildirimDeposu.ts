import { create } from 'zustand';
import { api } from '../lib/api';

export type BildirimTuru =
  | 'DUYURU'
  | 'ETKINLIK_REVIZYON_TALEBI'
  | 'ETKINLIK_ONAY_TALEBI'
  | 'PROFIL_ONAY_TALEBI'
  | 'SERTIFIKA';

export type HedefKitle = 'KULLANICI' | 'TUM_OGRENCILER' | 'KULUP_BASKANLARI' | 'SKS_YONETICILERI';

/** Backend (notification-service) BildirimYaniti ile birebir aynı alanlar — çeviri (mapper) yoktur. */
export interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  baglantiUrl?: string;
  baglantiEtiketi?: string;
  resimUrl?: string;
  tur: BildirimTuru;
  hedefKitle: HedefKitle;
  ilgiliEtkinlikId?: string;
  olusturan?: string;
  olusturanAdi?: string;
  okundu: boolean;
  olusturulmaTarihi: string;
}

interface BildirimState {
  bildirimler: Bildirim[];
  okunmamisSayisi: number;
  yukleniyor: boolean;
  hata: string | null;
  hatayiTemizle: () => void;
  bildirimleriGetir: () => Promise<void>;
  okunduIsaretle: (bildirimId: string) => Promise<void>;
  duyuruOlustur: (veri: {
    baslik: string;
    mesaj: string;
    baglantiUrl?: string;
    baglantiEtiketi?: string;
    resimUrl?: string;
    olusturanAdi?: string;
    hedefKitle: 'TUM_OGRENCILER' | 'KULUP_BASKANLARI';
  }) => Promise<boolean>;
}

const okunmamisSay = (bildirimler: Bildirim[]) =>
  bildirimler.filter(bildirim => !bildirim.okundu).length;

export const useBildirimDeposu = create<BildirimState>((set, get) => ({
  bildirimler: [],
  okunmamisSayisi: 0,
  yukleniyor: false,
  hata: null,

  hatayiTemizle: () => set({ hata: null }),

  bildirimleriGetir: async () => {
    set({ yukleniyor: true, hata: null });
    try {
      const res = await api.get<Bildirim[]>('/bildirimler');
      set({ bildirimler: res.data, okunmamisSayisi: okunmamisSay(res.data), yukleniyor: false });
    } catch (err: any) {
      set({ hata: err.response?.data?.message || 'Bildirimler yüklenirken hata oluştu.', yukleniyor: false });
    }
  },

  okunduIsaretle: async (bildirimId) => {
    const mevcut = get().bildirimler;
    const hedef = mevcut.find(bildirim => bildirim.id === bildirimId);
    if (!hedef || hedef.okundu) return;

    const iyimser = mevcut.map(bildirim =>
      bildirim.id === bildirimId ? { ...bildirim, okundu: true } : bildirim
    );
    set({ bildirimler: iyimser, okunmamisSayisi: okunmamisSay(iyimser) });

    try {
      const res = await api.patch<Bildirim>(`/bildirimler/${bildirimId}/oku`);
      const onayli = get().bildirimler.map(bildirim =>
        bildirim.id === bildirimId ? res.data : bildirim
      );
      set({ bildirimler: onayli, okunmamisSayisi: okunmamisSay(onayli) });
    } catch (err: any) {
      set({
        bildirimler: mevcut,
        okunmamisSayisi: okunmamisSay(mevcut),
        hata: err.response?.data?.message || 'Bildirim okundu olarak işaretlenemedi.',
      });
    }
  },

  duyuruOlustur: async (veri) => {
    set({ yukleniyor: true, hata: null });
    try {
      await api.post('/bildirimler/duyurular', veri);
      await get().bildirimleriGetir();
      set({ yukleniyor: false });
      return true;
    } catch (err: any) {
      set({ hata: err.response?.data?.message || 'Duyuru gönderilemedi.', yukleniyor: false });
      return false;
    }
  },
}));
