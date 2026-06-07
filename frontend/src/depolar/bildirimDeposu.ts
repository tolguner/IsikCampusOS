import { create } from 'zustand';
import { fetchEventSource } from '@microsoft/fetch-event-source';
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
  /** Anlık bildirim akışını (SSE) başlatır — yeni bildirimler push ile gelir. */
  akisBaslat: () => void;
  akisDurdur: () => void;
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
  /** İdari roller → öğrencilere veya (yalnızca sistem yöneticisi) tüm kullanıcılara kurumsal duyuru. */
  topluDuyuruGonder: (veri: {
    baslik: string;
    mesaj: string;
    baglantiUrl?: string;
    baglantiEtiketi?: string;
    resimUrl?: string;
    hedefKitle?: 'TUM_OGRENCILER' | 'TUM_KULLANICILAR';
  }) => Promise<boolean>;
}

const okunmamisSay = (bildirimler: Bildirim[]) =>
  bildirimler.filter(bildirim => !bildirim.okundu).length;

// SSE bağlantısı (zustand state dışında — gereksiz render önlenir)
let akisKontrolcusu: AbortController | null = null;

export const useBildirimDeposu = create<BildirimState>((set, get) => ({
  bildirimler: [],
  okunmamisSayisi: 0,
  yukleniyor: false,
  hata: null,

  hatayiTemizle: () => set({ hata: null }),

  akisBaslat: () => {
    const token = localStorage.getItem('token');
    if (!token || akisKontrolcusu) return;
    akisKontrolcusu = new AbortController();
    fetchEventSource('/api/v1/bildirimler/akis', {
      headers: { Authorization: `Bearer ${token}` },
      signal: akisKontrolcusu.signal,
      openWhenHidden: true,
      onopen: async (res) => {
        if (res.status === 401 || res.status === 403) {
          throw new Error('unauthorized'); // yeniden denemeyi durdur
        }
      },
      onmessage: (ev) => {
        if (ev.event !== 'bildirim' || !ev.data) return;
        try {
          const yeni: Bildirim = JSON.parse(ev.data);
          const mevcut = get().bildirimler;
          if (mevcut.some(b => b.id === yeni.id)) return;
          const guncel = [yeni, ...mevcut];
          set({ bildirimler: guncel, okunmamisSayisi: okunmamisSay(guncel) });
        } catch {
          // bozuk payload — atla
        }
      },
      onerror: (err) => {
        // Geçici hatalarda kütüphane yeniden bağlanır; fatal hatada (onopen throw) durur.
        if (err instanceof Error && err.message === 'unauthorized') throw err;
      },
    }).catch(() => {
      akisKontrolcusu = null;
    });
  },

  akisDurdur: () => {
    akisKontrolcusu?.abort();
    akisKontrolcusu = null;
  },

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

  topluDuyuruGonder: async (veri) => {
    set({ yukleniyor: true, hata: null });
    try {
      await api.post('/bildirimler/toplu-duyuru', veri);
      set({ yukleniyor: false });
      return true;
    } catch (err: any) {
      set({ hata: err.response?.data?.message || 'Duyuru gönderilemedi.', yukleniyor: false });
      return false;
    }
  },
}));
