import { create } from 'zustand';

export type Tema = 'dark' | 'light';

const TEMA_STORAGE_KEY = 'isik-campusos-theme';

const temaOku = (): Tema => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const kayitliTema = window.localStorage.getItem(TEMA_STORAGE_KEY);
    return kayitliTema === 'light' || kayitliTema === 'dark' ? kayitliTema : 'dark';
  } catch {
    return 'dark';
  }
};

const temaUygula = (tema: Tema) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = tema;
  document.documentElement.style.colorScheme = tema;
};

type TemaDurumu = {
  tema: Tema;
  temaAyarla: (tema: Tema) => void;
  temaDegistir: () => void;
};

export const useTemaDeposu = create<TemaDurumu>((set, get) => ({
  tema: temaOku(),
  temaAyarla: (tema) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(TEMA_STORAGE_KEY, tema);
      } catch {
        // Tema yine uygulanır; sadece kalıcı kayıt yapılamaz.
      }
    }
    temaUygula(tema);
    set({ tema });
  },
  temaDegistir: () => {
    get().temaAyarla(get().tema === 'dark' ? 'light' : 'dark');
  },
}));

temaUygula(temaOku());
