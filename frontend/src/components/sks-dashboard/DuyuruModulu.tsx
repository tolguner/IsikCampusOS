import React from 'react';
import { Bell, ImagePlus, Link as LinkIcon, Megaphone } from 'lucide-react';
import { panelStyle, inputClass, type DuyuruFormu } from './ortak';

interface AnnouncementsModuleProps {
  announcement: DuyuruFormu;
  setAnnouncement: React.Dispatch<React.SetStateAction<DuyuruFormu>>;
  handleAnnouncement: (e: React.FormEvent) => void;
  handleAnnouncementImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  announcementSenderName: string;
}

export const DuyuruModulu = ({
  announcement,
  setAnnouncement,
  handleAnnouncement,
  handleAnnouncementImageSelect,
  announcementSenderName,
}: AnnouncementsModuleProps) => (
  <form onSubmit={handleAnnouncement} className="rounded-3xl p-6 space-y-6" style={panelStyle}>
    <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
      <section className="space-y-5">
        <select value={announcement.targetAudience} onChange={e => setAnnouncement(prev => ({ ...prev, targetAudience: e.target.value as 'ALL_STUDENTS' | 'CLUB_PRESIDENTS' }))} className={inputClass}>
          <option value="ALL_STUDENTS">Tüm öğrenciler</option>
          <option value="CLUB_PRESIDENTS">Kulüp başkanları</option>
        </select>
        <input value={announcement.title} onChange={e => setAnnouncement(prev => ({ ...prev, title: e.target.value }))} required maxLength={140} placeholder="Duyuru başlığı" className={inputClass} />
        <textarea value={announcement.message} onChange={e => setAnnouncement(prev => ({ ...prev, message: e.target.value }))} required maxLength={3000} placeholder="Duyuru metni" rows={12} className={`${inputClass} resize-none`} />
        <p className="-mt-3 text-xs text-white/35">{announcement.message.trim().length}/3000 karakter</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={announcement.linkUrl} onChange={e => setAnnouncement(prev => ({ ...prev, linkUrl: e.target.value }))} type="url" placeholder="Bağlantı URL'si" className={`${inputClass} pl-11`} />
          </div>
          <input value={announcement.linkLabel} onChange={e => setAnnouncement(prev => ({ ...prev, linkLabel: e.target.value }))} placeholder="Bağlantı etiketi (örn. Başvuru formu)" className={inputClass} />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl border border-white/10 bg-[#111123] overflow-hidden flex items-center justify-center shrink-0">
              {announcement.imageUrl ? (
                <img src={announcement.imageUrl} alt="Duyuru görseli" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-7 h-7 text-white/35" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Görsel içerik</div>
              <p className="text-xs text-white/40 mt-1">PNG veya JPG eklenebilir. Bildirim önizlemesinde ve kullanıcı bildirimlerinde gösterilir.</p>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleAnnouncementImageSelect}
                className="mt-3 block w-full text-sm text-white/65 file:mr-4 file:rounded-xl file:border-0 file:bg-purple-500/20 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-purple-100 hover:file:bg-purple-500/30"
              />
            </div>
            {announcement.imageUrl && (
              <button type="button" onClick={() => setAnnouncement(prev => ({ ...prev, imageUrl: '' }))} className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10">
                Görseli kaldır
              </button>
            )}
          </div>
        </div>
      </section>

      <aside className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 h-fit">
        <div className="flex items-center gap-2 text-sm font-black text-white mb-4">
          <Megaphone className="w-4 h-4 text-pink-300" />
          Canlı Önizleme
        </div>
        <article className="rounded-3xl border border-white/10 bg-[#111123] overflow-hidden">
          {announcement.imageUrl && <img src={announcement.imageUrl} alt="Duyuru önizleme" className="w-full max-h-56 object-cover" />}
          <div className="p-5 space-y-3">
            <span className="rounded-full px-3 py-1 text-xs font-bold text-pink-100 bg-pink-500/15 border border-pink-400/20">
              {announcement.targetAudience === 'ALL_STUDENTS' ? 'Tüm öğrenciler' : 'Kulüp başkanları'}
            </span>
            <h3 className="text-2xl font-black text-white leading-tight">{announcement.title || 'Duyuru başlığı'}</h3>
            <p className="text-xs font-semibold text-white/35">
              Gönderen: <span className="text-white/60">{announcementSenderName}</span>
            </p>
            <p className="text-sm text-white/50 whitespace-pre-line leading-relaxed">{announcement.message || 'Duyuru metni burada önizlenir.'}</p>
            {announcement.linkUrl && (
              <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-cyan-100 bg-cyan-500/10 border border-cyan-400/20">
                <LinkIcon className="w-4 h-4" />
                {announcement.linkLabel || announcement.linkUrl}
              </div>
            )}
          </div>
        </article>
      </aside>
    </div>

    <div className="flex justify-end">
      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-3 gradient-btn font-bold">
        <Bell className="w-4 h-4" />
        Duyuruyu Gönder
      </button>
    </div>
  </form>
);
