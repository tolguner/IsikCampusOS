import { create } from 'zustand';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { api } from '../lib/api';

export interface Mesaj {
  id: string;
  konusmaId: string;
  gondericiKullaniciId: string;
  icerik: string;
  olusturulmaTarihi: string;
  gondericiAdSoyad?: string;
}

export interface Konusma {
  id: string;
  modul: string;
  baglamId: string;
  baslik?: string;
  durum: 'ACIK' | 'KAPALI';
  katilimcilar: string[];
  karsiTarafAdSoyad?: string;
  sonMesajOzeti?: string;
  okunmamisSayisi?: number;
  sonMesajTarihi?: string;
}

interface MesajState {
  konusmalar: Konusma[];
  mesajlar: Record<string, Mesaj[]>;   // konusmaId → mesajlar
  okunmamisToplam: number;
  konusmalariGetir: () => Promise<void>;
  baglamdanGetir: (modul: string, baglamId: string) => Promise<Konusma | null>;
  mesajlariGetir: (konusmaId: string) => Promise<void>;
  gonder: (konusmaId: string, icerik: string) => Promise<boolean>;
  okunmamisGetir: () => Promise<void>;
  akisBaslat: () => void;
  akisDurdur: () => void;
}

let akisKontrolcusu: AbortController | null = null;

export const useMesajDeposu = create<MesajState>((set, get) => ({
  konusmalar: [],
  mesajlar: {},
  okunmamisToplam: 0,

  konusmalariGetir: async () => {
    try {
      const res = await api.get<Konusma[]>('/mesajlar/konusmalar');
      set({ konusmalar: res.data });
    } catch { /* sessiz */ }
  },

  baglamdanGetir: async (modul, baglamId) => {
    try {
      const res = await api.get<Konusma>(`/mesajlar/baglam/${modul}/${encodeURIComponent(baglamId)}`);
      return res.data;
    } catch {
      return null;
    }
  },

  mesajlariGetir: async (konusmaId) => {
    try {
      const res = await api.get<Mesaj[]>(`/mesajlar/konusmalar/${konusmaId}`);
      set(s => ({ mesajlar: { ...s.mesajlar, [konusmaId]: res.data } }));
      await get().okunmamisGetir();
    } catch { /* sessiz */ }
  },

  gonder: async (konusmaId, icerik) => {
    try {
      const res = await api.post<Mesaj>(`/mesajlar/konusmalar/${konusmaId}`, { icerik });
      set(s => {
        const mevcut = s.mesajlar[konusmaId] ?? [];
        if (mevcut.some(m => m.id === res.data.id)) return s;
        return { mesajlar: { ...s.mesajlar, [konusmaId]: [...mevcut, res.data] } };
      });
      return true;
    } catch {
      return false;
    }
  },

  okunmamisGetir: async () => {
    try {
      const res = await api.get<{ sayi: number }>('/mesajlar/okunmamis-sayisi');
      set({ okunmamisToplam: res.data?.sayi ?? 0 });
    } catch { /* sessiz */ }
  },

  akisBaslat: () => {
    const token = localStorage.getItem('token');
    if (!token || akisKontrolcusu) return;
    akisKontrolcusu = new AbortController();
    get().okunmamisGetir();
    fetchEventSource('/api/v1/mesajlar/akis', {
      headers: { Authorization: `Bearer ${token}` },
      signal: akisKontrolcusu.signal,
      openWhenHidden: true,
      onopen: async (res) => {
        if (res.status === 401 || res.status === 403) throw new Error('unauthorized');
      },
      onmessage: (ev) => {
        if (ev.event !== 'mesaj' || !ev.data) return;
        try {
          const yeni: Mesaj = JSON.parse(ev.data);
          set(s => {
            const mevcut = s.mesajlar[yeni.konusmaId] ?? [];
            const eklenmis = mevcut.some(m => m.id === yeni.id) ? mevcut : [...mevcut, yeni];
            return {
              mesajlar: { ...s.mesajlar, [yeni.konusmaId]: eklenmis },
              okunmamisToplam: s.okunmamisToplam + 1,
            };
          });
          get().konusmalariGetir();
        } catch { /* bozuk payload */ }
      },
      onerror: (err) => {
        if (err instanceof Error && err.message === 'unauthorized') throw err;
      },
    }).catch(() => { akisKontrolcusu = null; });
  },

  akisDurdur: () => {
    akisKontrolcusu?.abort();
    akisKontrolcusu = null;
  },
}));
