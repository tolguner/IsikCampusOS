import { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, Link as LinkIcon, Search, X } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';

type NotificationFilter = 'all' | 'announcements' | 'events';

const filterLabels: Record<NotificationFilter, string> = {
  all: 'Tümü',
  announcements: 'Duyurular',
  events: 'Etkinlik bildirimleri',
};

const targetAudienceLabel = (value: string) => {
  if (value === 'ALL_STUDENTS') return 'Tüm öğrenciler';
  if (value === 'CLUB_PRESIDENTS') return 'Kulüp başkanları';
  if (value === 'SKS_ADMINS') return 'SKS yönetimi';
  return 'Kişisel bildirim';
};

export const NotificationsPage = () => {
  const { notifications, unreadCount, fetchNotifications, markAsRead, isLoading, error } = useNotificationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    const normalized = searchTerm.trim().toLocaleLowerCase('tr-TR');

    return notifications.filter(notification => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'announcements' && notification.type === 'ANNOUNCEMENT') ||
        (filter === 'events' && ['EVENT_REVISION_REQUEST', 'EVENT_APPROVAL_REQUEST', 'PROFILE_APPROVAL_REQUEST', 'CERTIFICATE'].includes(notification.type));

      const matchesSearch = !normalized ||
        notification.title.toLocaleLowerCase('tr-TR').includes(normalized) ||
        notification.message.toLocaleLowerCase('tr-TR').includes(normalized) ||
        notification.createdByName?.toLocaleLowerCase('tr-TR').includes(normalized);

      return matchesFilter && matchesSearch;
    });
  }, [filter, notifications, searchTerm]);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-purple-300">İletişim merkezi</p>
          <h1 className="text-4xl font-extrabold text-white mt-2">Bildirimler</h1>
          <p className="text-white/45 mt-3 max-w-3xl">
            SKS duyuruları, kulüp bilgilendirmeleri ve etkinlik geri bildirimlerini tek ekranda takip et.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-4 min-w-40">
          <div className="text-3xl font-black text-white">{notifications.length}</div>
          <div className="text-sm text-white/40">Toplam bildirim</div>
        </div>
        <div className="rounded-3xl border border-purple-300/20 bg-purple-500/[0.08] px-5 py-4 min-w-40">
          <div className="text-3xl font-black text-white">{unreadCount}</div>
          <div className="text-sm text-purple-100/60">Okunmamış</div>
        </div>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Başlık, metin veya gönderen ara"
            className="w-full rounded-2xl bg-[#111123] border border-white/10 pl-11 pr-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(filterLabels) as NotificationFilter[]).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-2xl px-4 py-3 text-xs font-bold border transition-colors ${filter === key ? 'bg-purple-500/20 border-purple-300/35 text-white' : 'bg-white/[0.03] border-white/10 text-white/45 hover:text-white'}`}
            >
              {filterLabels[key]}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-200">
          {error}
        </div>
      )}

      <section className="space-y-4">
        {filteredNotifications.map(notification => (
          <article
            key={notification.id}
            onClick={() => markAsRead(notification.id)}
            className={`relative rounded-3xl border overflow-hidden cursor-pointer transition-colors ${notification.read ? 'border-white/10 bg-white/[0.03]' : 'border-purple-300/30 bg-purple-500/[0.055]'}`}
          >
            {!notification.read && (
              <span className="absolute right-5 top-5 rounded-full px-3 py-1 text-[11px] font-black text-purple-50 bg-purple-500/30 border border-purple-300/30 z-10">
                Okunmadı
              </span>
            )}
            <div className="p-5 sm:p-6 flex flex-col lg:flex-row gap-5">
              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full px-3 py-1 text-xs font-bold text-purple-100 bg-purple-500/15 border border-purple-400/20">
                    {notification.type === 'ANNOUNCEMENT' ? 'Duyuru' : notification.type === 'CERTIFICATE' ? 'Sertifika' : notification.type === 'PROFILE_APPROVAL_REQUEST' ? 'Profil Talebi' : 'Etkinlik'}
                  </span>
                  <span className="rounded-full px-3 py-1 text-xs font-bold text-cyan-100 bg-cyan-500/10 border border-cyan-400/20">
                    {targetAudienceLabel(notification.targetAudience)}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white leading-tight">{notification.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/40">
                    <span>Gönderen: <strong className="text-white/65">{notification.createdByName || (notification.type === 'ANNOUNCEMENT' ? 'SKS Yönetimi' : 'Sistem')}</strong></span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(notification.createdAt).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-white/55 leading-relaxed whitespace-pre-line">{notification.message}</p>

                {notification.linkUrl && (
                  <a
                    href={notification.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => markAsRead(notification.id)}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-cyan-100 bg-cyan-500/10 border border-cyan-400/20 hover:bg-cyan-500/15"
                  >
                    <LinkIcon className="w-4 h-4" />
                    {notification.linkLabel || 'Bağlantıyı aç'}
                  </a>
                )}
              </div>

              {notification.imageUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewImage({ src: notification.imageUrl!, title: notification.title })}
                  className="group lg:w-64 xl:w-72 h-40 lg:h-44 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.025] shrink-0 relative"
                  title="Görseli büyüt"
                >
                  <img src={notification.imageUrl} alt={notification.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 px-3 py-2 text-xs font-bold text-white bg-black/55 backdrop-blur-sm">
                    Büyütmek için tıkla
                  </span>
                </button>
              )}
            </div>
          </article>
        ))}

        {!isLoading && filteredNotifications.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center">
            <Bell className="w-8 h-8 text-white/25 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white/45">Bu filtrede bildirim bulunamadı.</p>
          </div>
        )}

        {isLoading && (
          <p className="text-sm text-white/40">Bildirimler yükleniyor...</p>
        )}
      </section>

      {previewImage && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl max-h-[88vh] w-full" onClick={event => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 rounded-2xl p-2 text-white/70 hover:text-white hover:bg-white/10"
              title="Kapat"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={previewImage.src} alt={previewImage.title} className="w-full max-h-[88vh] object-contain rounded-3xl border border-white/10 bg-white" />
          </div>
        </div>
      )}
    </div>
  );
};
