import { create } from 'zustand';
import { api } from '../lib/api';

export interface Profile {
  id: string;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  phoneNumber?: string;
  residenceAddress?: string;
  bloodType?: string;
  nationalIdMasked?: string;
  profilePictureUrl?: string;
  bio?: string;
  skills?: string;
  trustScore?: number;
}

type ProfileUpdate = Partial<Pick<Profile, 'firstName' | 'lastName' | 'department' | 'profilePictureUrl' | 'bio' | 'skills'>>;

export interface ProfileChangeRequest {
  id: string;
  userId: string;
  fieldName: string;
  currentValue?: string;
  requestedValue: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback?: string;
  createdAt: string;
}

interface ProfileState {
  profile: Profile | null;
  changeRequests: ProfileChangeRequest[];
  pendingChangeRequests: ProfileChangeRequest[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchMyProfile: () => Promise<void>;
  fetchMyChangeRequests: () => Promise<void>;
  fetchPendingChangeRequests: () => Promise<void>;
  updateMyProfile: (data: ProfileUpdate, successMessage?: string) => Promise<boolean>;
  requestProfileChange: (fieldName: string, requestedValue: string) => Promise<boolean>;
  approveChangeRequest: (requestId: string) => Promise<boolean>;
  rejectChangeRequest: (requestId: string, feedback?: string) => Promise<boolean>;
  clearMessages: () => void;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  changeRequests: [],
  pendingChangeRequests: [],
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),

  fetchMyProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Profile>('/profiles/me');
      set({ profile: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil bilgileri yüklenemedi.'), isLoading: false });
    }
  },

  fetchMyChangeRequests: async () => {
    try {
      const res = await api.get<ProfileChangeRequest[]>('/profiles/me/change-requests');
      set({ changeRequests: res.data });
    } catch {
      set({ changeRequests: [] });
    }
  },

  fetchPendingChangeRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<ProfileChangeRequest[]>('/profiles/change-requests/pending');
      set({ pendingChangeRequests: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil değişiklik talepleri yüklenemedi.'), isLoading: false });
    }
  },

  updateMyProfile: async (data, successMessage = 'Profil bilgileri güncellendi.') => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const res = await api.patch<Profile>('/profiles/me', data);
      set({ profile: res.data, isLoading: false, successMessage });
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil bilgileri güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  requestProfileChange: async (fieldName, requestedValue) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post('/profiles/me/change-requests', { fieldName, requestedValue });
      set({ isLoading: false, successMessage: 'Değişiklik talebin onaya gönderildi.' });
      await get().fetchMyChangeRequests();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Değişiklik talebi gönderilemedi.'), isLoading: false });
      return false;
    }
  },

  approveChangeRequest: async (requestId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/profiles/change-requests/${requestId}/approve`);
      set({ isLoading: false, successMessage: 'Profil değişiklik talebi onaylandı.' });
      await get().fetchPendingChangeRequests();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil değişiklik talebi onaylanamadı.'), isLoading: false });
      return false;
    }
  },

  rejectChangeRequest: async (requestId, feedback) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.post(`/profiles/change-requests/${requestId}/reject`, { feedback });
      set({ isLoading: false, successMessage: 'Profil değişiklik talebi reddedildi.' });
      await get().fetchPendingChangeRequests();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Profil değişiklik talebi reddedilemedi.'), isLoading: false });
      return false;
    }
  },
}));
