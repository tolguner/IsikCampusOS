import { create } from 'zustand';
import { api } from '../lib/api';

export interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  studentNumber: string;
  faculty: string;
  department: string;
  departmentCode: string;
  enrollmentYear: number;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'EXPELLED';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface PageData {
  content: Student[];
  totalElements: number;
  totalPages: number;
  number: number;
}

interface StudentState {
  students: Student[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  fetchStudents: (page?: number, size?: number, search?: string, status?: string) => Promise<void>;
  createStudent: (data: any) => Promise<boolean>;
  updateStudent: (id: string, data: any) => Promise<boolean>;
  changeStatus: (id: string, status: string) => Promise<boolean>;
  resetPassword: (id: string, tcKimlikNo: string) => Promise<boolean>;
  clearMessages: () => void;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  fetchStudents: async (page = 0, size = 10, search = '', status = '') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<PageData>('/students', {
        params: { page, size, search, status }
      });
      set({ 
        students: res.data.content, 
        totalElements: res.data.totalElements,
        totalPages: res.data.totalPages,
        currentPage: res.data.number,
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Öğrenciler yüklenirken hata oluştu.', isLoading: false });
    }
  },

  createStudent: async (data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post('/students', data);
      set({ successMessage: 'Öğrenci başarıyla eklendi.', isLoading: false });
      get().fetchStudents(get().currentPage);
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Öğrenci eklenirken hata oluştu.', isLoading: false });
      return false;
    }
  },

  updateStudent: async (id, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.put(`/students/${id}`, data);
      set({ successMessage: 'Öğrenci bilgileri güncellendi.', isLoading: false });
      get().fetchStudents(get().currentPage);
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Güncelleme başarısız.', isLoading: false });
      return false;
    }
  },

  changeStatus: async (id, status) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.patch(`/students/${id}/status`, { newStatus: status });
      set({ successMessage: 'Öğrenci durumu güncellendi.', isLoading: false });
      get().fetchStudents(get().currentPage);
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Durum değiştirilemedi.', isLoading: false });
      return false;
    }
  },

  resetPassword: async (id, tcKimlikNo) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/students/${id}/reset-password`, { tcKimlikNo });
      set({ successMessage: 'Öğrencinin şifresi başarıyla TC Kimlik Numarasına sıfırlandı.', isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Şifre sıfırlama başarısız.', isLoading: false });
      return false;
    }
  }
}));
