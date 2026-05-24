import { useState } from 'react';
import type { FormEvent } from 'react';
import { Bell, ImagePlus, Megaphone } from 'lucide-react';
import type { Club } from '../../store/clubStore';
import { useClubStore } from '../../store/clubStore';
import { inputClass, textareaClass, emptyAnnouncementForm } from './constants';

interface AnnouncementsTabProps {
  selectedClub: Club;
}

export const AnnouncementsTab = ({ selectedClub }: AnnouncementsTabProps) => {
  const { isLoading, createClubAnnouncement } = useClubStore();
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncementForm);

  const handleAnnouncementImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !['image/png', 'image/jpeg'].includes(file.type)) return;
    try {
      const reader = new FileReader();
      reader.onload = () => setAnnouncementForm(prev => ({ ...prev, imageUrl: String(reader.result || '') }));
      reader.readAsDataURL(file);
    } catch {
      // ignore
    }
  };

  const submitAnnouncement = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await createClubAnnouncement(selectedClub.id, {
      title: announcementForm.title,
      message: announcementForm.message,
      linkUrl: announcementForm.linkUrl || undefined,
      linkLabel: announcementForm.linkLabel || undefined,
      imageUrl: announcementForm.imageUrl || undefined,
    });
    if (ok) setAnnouncementForm(emptyAnnouncementForm);
  };

  return (
    <form onSubmit={submitAnnouncement} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 space-y-4">
      <div className="flex items-center gap-4">
        <span className="w-12 h-12 rounded-2xl border border-purple-300/25 bg-purple-500/15 flex items-center justify-center">
          <Bell className="w-5 h-5 text-purple-100" />
        </span>
        <div>
          <h2 className="text-2xl font-black text-white">Kulüp Duyurusu</h2>
          <p className="text-sm text-white/40 mt-1">Duyurular {selectedClub.name} üyelerinin bildirim merkezine düşer.</p>
        </div>
      </div>
      <input value={announcementForm.title} onChange={e => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))} className={inputClass} placeholder="Duyuru başlığı" />
      <textarea value={announcementForm.message} onChange={e => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))} className={`${textareaClass} min-h-44`} placeholder="Duyuru metni" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <input value={announcementForm.linkUrl} onChange={e => setAnnouncementForm(prev => ({ ...prev, linkUrl: e.target.value }))} className={inputClass} placeholder="Bağlantı URL" />
        <input value={announcementForm.linkLabel} onChange={e => setAnnouncementForm(prev => ({ ...prev, linkLabel: e.target.value }))} className={inputClass} placeholder="Bağlantı etiketi" />
      </div>
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-black text-white">
          <ImagePlus className="w-4 h-4 text-purple-200" />
          Duyuru görseli
        </div>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleAnnouncementImageSelect}
          className="block w-full text-sm text-white/65 file:mr-4 file:rounded-xl file:border-0 file:bg-purple-500/20 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-purple-100 hover:file:bg-purple-500/30"
        />
        {announcementForm.imageUrl && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
            <img src={announcementForm.imageUrl} alt="Duyuru görseli önizleme" className="max-h-72 w-full object-cover" />
            <button
              type="button"
              onClick={() => setAnnouncementForm(prev => ({ ...prev, imageUrl: '' }))}
              className="m-3 rounded-xl px-3 py-2 text-xs font-bold text-white/70 bg-white/[0.06] hover:bg-white/[0.1]"
            >
              Görseli Kaldır
            </button>
          </div>
        )}
      </section>
      <button disabled={isLoading} type="submit" className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 gradient-btn font-bold disabled:opacity-45">
        <Megaphone className="w-4 h-4" />
        Üyelere Gönder
      </button>
    </form>
  );
};
