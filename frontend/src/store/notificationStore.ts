import { create } from 'zustand';
import { api } from '../lib/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  linkUrl?: string;
  linkLabel?: string;
  imageUrl?: string;
  type: 'ANNOUNCEMENT' | 'EVENT_REVISION_REQUEST' | 'EVENT_APPROVAL_REQUEST' | 'PROFILE_APPROVAL_REQUEST' | 'CERTIFICATE';
  targetAudience: 'USER' | 'ALL_STUDENTS' | 'CLUB_PRESIDENTS' | 'SKS_ADMINS';
  relatedEventId?: string;
  createdBy?: string;
  createdByName?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  createAnnouncement: (data: {
    title: string;
    message: string;
    linkUrl?: string;
    linkLabel?: string;
    imageUrl?: string;
    createdByName?: string;
    targetAudience: 'ALL_STUDENTS' | 'CLUB_PRESIDENTS';
  }) => Promise<boolean>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Notification[]>('/notifications');
      set({ notifications: res.data, unreadCount: countUnread(res.data), isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Bildirimler yüklenirken hata oluştu.', isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    const currentNotifications = get().notifications;
    const target = currentNotifications.find(notification => notification.id === notificationId);

    if (!target || target.read) return;

    const optimisticNotifications = currentNotifications.map(notification =>
      notification.id === notificationId ? { ...notification, read: true } : notification
    );

    set({ notifications: optimisticNotifications, unreadCount: countUnread(optimisticNotifications) });

    try {
      const res = await api.patch<Notification>(`/notifications/${notificationId}/read`);
      const confirmedNotifications = get().notifications.map(notification =>
        notification.id === notificationId ? res.data : notification
      );
      set({ notifications: confirmedNotifications, unreadCount: countUnread(confirmedNotifications) });
    } catch (err: any) {
      set({
        notifications: currentNotifications,
        unreadCount: countUnread(currentNotifications),
        error: err.response?.data?.message || 'Bildirim okundu olarak işaretlenemedi.',
      });
    }
  },

  createAnnouncement: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/notifications/announcements', data);
      await get().fetchNotifications();
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Duyuru gönderilemedi.', isLoading: false });
      return false;
    }
  },
}));

const countUnread = (notifications: Notification[]) =>
  notifications.filter(notification => !notification.read).length;
