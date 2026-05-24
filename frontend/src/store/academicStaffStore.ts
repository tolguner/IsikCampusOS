import { create } from 'zustand';
import { api } from '../lib/api';

export interface AcademicAdvisor {
  id: string;
  academicTitle?: string;
  fullName: string;
  displayName: string;
  email?: string;
  facultyOrUnit?: string;
  department?: string;
  role?: string;
  profileUrl?: string;
  lastSyncedAt?: string;
}

interface AcademicStaffState {
  advisors: AcademicAdvisor[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  searchAdvisors: (query: string) => Promise<void>;
  syncAdvisors: () => Promise<boolean>;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const useAcademicStaffStore = create<AcademicStaffState>((set, get) => ({
  advisors: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  searchAdvisors: async (query) => {
    const normalized = query.trim();
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<AcademicAdvisor[]>('/academic-staff/advisors', {
        params: { query: normalized, limit: 12 },
      });
      set({ advisors: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Akademik danışmanlar yüklenemedi.'), isLoading: false });
    }
  },

  syncAdvisors: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/academic-staff/sync');
      set({ isLoading: false });
      await get().searchAdvisors('');
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Akademik kadro güncellenemedi.'), isLoading: false });
      return false;
    }
  },
}));
