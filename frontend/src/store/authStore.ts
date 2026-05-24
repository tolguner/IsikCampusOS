import { create } from 'zustand';
import { api, authApi } from '../lib/api';

export interface User {
  id: string;
  email: string;
  roles: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  faculty?: string;
  department?: string;
  enrollmentYear?: number;
  studentNumber: string | null;
  nationalIdMasked?: string;
  mustChangePassword: boolean;
  emailVerified: boolean;
  status: string;
}

interface AuthState {
  user: User | null;
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
  updateUser: (updates: Partial<User>) => void;
}

const readStoredUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const persistAuth = (token: string, user: User) => {
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

      const res = await authApi.post('/auth/login', {
        email: normalizedEmail,
        password: normalizedPassword,
      });

      const {
        token,
        userId,
        roles,
        fullName,
        firstName,
        lastName,
        faculty,
        department,
        enrollmentYear,
        studentNumber,
        nationalIdMasked,
        mustChangePassword,
        emailVerified,
        status,
      } = res.data;

      const user: User = {
        id: userId,
        email: normalizedEmail,
        roles,
        fullName,
        firstName,
        lastName,
        faculty,
        department,
        enrollmentYear,
        studentNumber,
        nationalIdMasked,
        mustChangePassword,
        emailVerified,
        status,
      };

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      persistAuth(token, user);
      return true;
    } catch (err: any) {
      console.error('Login failed:', err);
      set({
        error: getErrorMessage(err, 'Giris basarisiz. Bilgilerinizi kontrol edin.'),
        isLoading: false,
      });
      return false;
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      const user = get().user;
      if (user) {
        const updated = { ...user, mustChangePassword: false };
        localStorage.setItem('user', JSON.stringify(updated));
        set({ user: updated, isLoading: false, successMessage: 'Sifreniz basariyla degistirildi.' });
      }
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Sifre degistirme basarisiz.'), isLoading: false });
      return false;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await authApi.post('/auth/forgot-password', { email: email.trim() });
      set({ isLoading: false, successMessage: 'Sifre sifirlama kodu e-posta adresinize gonderildi.' });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Islem basarisiz.'), isLoading: false });
      return false;
    }
  },

  resetPassword: async (email, code, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.post('/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword: newPassword.trim(),
      });
      set({ isLoading: false, successMessage: 'Sifreniz basariyla sifirlandi. Giris yapabilirsiniz.' });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Sifre sifirlama basarisiz.'), isLoading: false });
      return false;
    }
  },

  verifyEmail: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.post('/auth/verify-email', {
        email: email.trim(),
        code: code.trim(),
      });
      const user = get().user;
      if (user) {
        const updated = { ...user, emailVerified: true };
        localStorage.setItem('user', JSON.stringify(updated));
        set({ user: updated, isLoading: false, successMessage: 'E-posta adresiniz dogrulandi.' });
      }
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Dogrulama basarisiz.'), isLoading: false });
      return false;
    }
  },

  resendVerification: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/resend-verification');
      set({ isLoading: false, successMessage: 'Dogrulama kodu tekrar gonderildi.' });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kod gonderilemedi.'), isLoading: false });
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
