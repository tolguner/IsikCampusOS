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
  content: any[];
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
  deleteStudent: (id: string) => Promise<boolean>;
  clearMessages: () => void;
}

const mapStatusToEnglish = (status: string): 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'EXPELLED' => {
  if (status === 'AKTIF') return 'ACTIVE';
  if (status === 'PASIF') return 'INACTIVE';
  if (status === 'MEZUN') return 'GRADUATED';
  if (status === 'ILISIGI_KESILMIS') return 'EXPELLED';
  return 'ACTIVE';
};

const mapStatusToTurkish = (status: string): string => {
  if (status === 'ACTIVE') return 'AKTIF';
  if (status === 'INACTIVE') return 'PASIF';
  if (status === 'GRADUATED') return 'MEZUN';
  if (status === 'EXPELLED') return 'ILISIGI_KESILMIS';
  return '';
};

const mapStudentResponse = (data: any): Student => {
  return {
    id: data.id,
    email: data.eposta,
    firstName: data.ad,
    lastName: data.soyad,
    fullName: data.tamAd,
    studentNumber: data.ogrenciNumarasi,
    faculty: data.fakulte,
    department: data.bolum,
    departmentCode: data.bolumKodu || '',
    enrollmentYear: data.kayitYili,
    status: mapStatusToEnglish(data.durum),
    emailVerified: data.epostaDogrulandi,
    createdAt: data.olusturulmaTarihi,
    lastLoginAt: data.sonGirisTarihi,
  };
};

const getDepartmentCode = (studentNumber: string): string => {
  const match = studentNumber.match(/\d+([a-zA-Z]+)\d+/);
  return match ? match[1].toLowerCase() : '';
};

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
      const apiStatus = mapStatusToTurkish(status);
      const res = await api.get<PageData>('/ogrenciler', {
        params: {
          sayfa: page,
          boyut: size,
          arama: search,
          durum: apiStatus || undefined,
        }
      });
      set({ 
        students: res.data.content.map(mapStudentResponse), 
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
      const payload = {
        ad: data.firstName,
        soyad: data.lastName,
        ogrenciNumarasi: data.studentNumber,
        tcKimlikNo: data.tcKimlikNo,
        fakulte: data.faculty,
        bolum: data.department,
        bolumKodu: getDepartmentCode(data.studentNumber),
        kayitYili: data.enrollmentYear,
        telefonNumarasi: data.phoneNumber || '',
        ikametAdresi: data.residenceAddress || '',
        kanGrubu: data.bloodType || 'A Rh+'
      };
      await api.post('/ogrenciler', payload);
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
      const payload = {
        ad: data.firstName,
        soyad: data.lastName,
        fakulte: data.faculty,
        bolum: data.department,
      };
      await api.put(`/ogrenciler/${id}`, payload);
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
      const apiStatus = mapStatusToTurkish(status);
      await api.patch(`/ogrenciler/${id}/durum`, {
        yeniDurum: apiStatus,
        neden: 'Durum güncellemesi',
      });
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
      await api.post(`/ogrenciler/${id}/sifre-sifirla`, { tcKimlikNo });
      set({ successMessage: 'Öğrencinin şifresi başarıyla TC Kimlik Numarasına sıfırlandı.', isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Şifre sıfırlama başarısız.', isLoading: false });
      return false;
    }
  },
 
  deleteStudent: async (id) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.delete(`/ogrenciler/${id}`);
      set({ successMessage: 'Öğrenci başarıyla silindi.', isLoading: false });
      get().fetchStudents(get().currentPage);
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Öğrenci silinemedi.', isLoading: false });
      return false;
    }
  }
}));
