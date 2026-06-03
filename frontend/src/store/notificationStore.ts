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

const mapType = (type: string): Notification['type'] => {
  switch (type) {
    case 'DUYURU': return 'ANNOUNCEMENT';
    case 'ETKINLIK_REVIZYON_TALEBI': return 'EVENT_REVISION_REQUEST';
    case 'ETKINLIK_ONAY_TALEBI': return 'EVENT_APPROVAL_REQUEST';
    case 'PROFIL_ONAY_TALEBI': return 'PROFILE_APPROVAL_REQUEST';
    case 'SERTIFIKA': return 'CERTIFICATE';
    default: return type as any;
  }
};

const mapReverseAudience = (aud: string): string => {
  switch (aud) {
    case 'ALL_STUDENTS': return 'TUM_OGRENCILER';
    case 'CLUB_PRESIDENTS': return 'KULUP_BASKANLARI';
    default: return aud;
  }
};

const mapAudience = (aud: string): Notification['targetAudience'] => {
  switch (aud) {
    case 'KULLANICI': return 'USER';
    case 'TUM_OGRENCILER': return 'ALL_STUDENTS';
    case 'KULUP_BASKANLARI': return 'CLUB_PRESIDENTS';
    case 'SKS_YONETICILERI': return 'SKS_ADMINS';
    default: return aud as any;
  }
};

const mapNotification = (data: any): Notification => ({
  id: data.id,
  title: data.baslik,
  message: data.mesaj,
  linkUrl: data.baglantiUrl,
  linkLabel: data.baglantiEtiketi,
  imageUrl: data.resimUrl,
  type: mapType(data.tur),
  targetAudience: mapAudience(data.hedefKitle),
  relatedEventId: data.ilgiliEtkinlikId,
  createdBy: data.olusturan,
  createdByName: data.olusturanAdi,
  read: data.okundu,
  createdAt: data.olusturulmaTarihi
});

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/bildirimler');
      const mapped = res.data.map(mapNotification);
      set({ notifications: mapped, unreadCount: countUnread(mapped), isLoading: false });
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
      const res = await api.patch<any>(`/bildirimler/${notificationId}/oku`);
      const confirmedNotifications = get().notifications.map(notification =>
        notification.id === notificationId ? mapNotification(res.data) : notification
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
      const payload = {
        baslik: data.title,
        mesaj: data.message,
        baglantiUrl: data.linkUrl,
        baglantiEtiketi: data.linkLabel,
        resimUrl: data.imageUrl,
        olusturanAdi: data.createdByName,
        hedefKitle: mapReverseAudience(data.targetAudience)
      };
      await api.post('/bildirimler/duyurular', payload);
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
