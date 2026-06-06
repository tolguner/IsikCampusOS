import { create } from 'zustand';
import { api, authApi } from '../lib/api';

/** Backend (auth-service) alanlarıyla birebir — çeviri (mapper) yoktur. */
export interface Kullanici {
  id: string;
  eposta: string;
  roller: string;
  tamAd: string;
  ad?: string;
  soyad?: string;
  fakulte?: string;
  bolum?: string;
  kayitYili?: number;
  ogrenciNumarasi: string | null;
  tcKimlikMaskeli?: string;
  sifreDegistirmeli: boolean;
  epostaDogrulandi: boolean;
  durum: string;
}

interface AuthState {
  user: Kullanici | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  clearSuccess: () => void;
  updateUser: (updates: Partial<Kullanici>) => void;
}

const readStoredUser = (): Kullanici | null => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const persistAuth = (token: string, user: Kullanici) => {
  try {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.warn('Login succeeded, but auth state could not be persisted.', error);
  }
};

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: readStoredUser(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  successMessage: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const normalizedEmail = email.trim();
      const normalizedPassword = password.trim();

      const res = await authApi.post('/kimlik/giris', {
        eposta: normalizedEmail,
        sifre: normalizedPassword,
      });

      const { token, kullaniciId, eposta } = res.data;

      const user: Kullanici = {
        id: kullaniciId,
        eposta: eposta || normalizedEmail,
        roller: res.data.roller,
        tamAd: res.data.tamAd,
        ad: res.data.ad,
        soyad: res.data.soyad,
        fakulte: res.data.fakulte,
        bolum: res.data.bolum,
        kayitYili: res.data.kayitYili,
        ogrenciNumarasi: res.data.ogrenciNumarasi,
        tcKimlikMaskeli: res.data.tcKimlikMaskeli,
        sifreDegistirmeli: res.data.sifreDegistirmeli,
        epostaDogrulandi: res.data.epostaDogrulandi,
        durum: res.data.durum,
      };

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      persistAuth(token, user);
      return true;
    } catch (err: any) {
      console.error('Login failed:', err);
      set({
        error: getErrorMessage(err, 'Giriş başarısız. Bilgilerinizi kontrol edin.'),
        isLoading: false,
      });
      return false;
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/kimlik/sifre-degistir', {
        eskiSifre: oldPassword,
        yeniSifre: newPassword,
      });
      const user = get().user;
      if (user) {
        const updated = { ...user, sifreDegistirmeli: false };
        localStorage.setItem('user', JSON.stringify(updated));
        set({ user: updated, isLoading: false, successMessage: 'Şifreniz başarıyla değiştirildi.' });
      }
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Şifre değiştirme başarısız.'), isLoading: false });
      return false;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await authApi.post('/kimlik/sifremi-unuttum', { eposta: email.trim() });
      set({ isLoading: false, successMessage: 'Şifre sıfırlama kodu e-posta adresinize gönderildi.' });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'İşlem başarısız.'), isLoading: false });
      return false;
    }
  },

  resetPassword: async (email, code, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.post('/kimlik/sifre-sifirla', {
        eposta: email.trim(),
        kod: code.trim(),
        yeniSifre: newPassword.trim(),
      });
      set({ isLoading: false, successMessage: 'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.' });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Şifre sıfırlama başarısız.'), isLoading: false });
      return false;
    }
  },

  verifyEmail: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.post('/kimlik/eposta-dogrula', {
        eposta: email.trim(),
        kod: code.trim(),
      });
      const user = get().user;
      if (user) {
        const updated = { ...user, epostaDogrulandi: true };
        localStorage.setItem('user', JSON.stringify(updated));
        set({ user: updated, isLoading: false, successMessage: 'E-posta adresiniz doğrulandı.' });
      }
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Doğrulama başarısız.'), isLoading: false });
      return false;
    }
  },

  resendVerification: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/kimlik/dogrulama-kodu-gonder');
      set({ isLoading: false, successMessage: 'Doğrulama kodu tekrar gönderildi.' });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kod gönderilemedi.'), isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
  clearSuccess: () => set({ successMessage: null }),
  updateUser: (updates) => {
    const user = get().user;
    if (user) {
      const updated = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));
