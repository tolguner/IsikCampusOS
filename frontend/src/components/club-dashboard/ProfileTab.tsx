import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { GraduationCap, ImagePlus, Send } from 'lucide-react';
import type { Club } from '../../store/clubStore';
import { useClubStore } from '../../store/clubStore';
import { inputClass, textareaClass, squareImageFile } from './constants';

interface ProfileTabProps {
  selectedClub: Club;
}

export const ProfileTab = ({ selectedClub }: ProfileTabProps) => {
  const { isLoading, requestClubProfileUpdate } = useClubStore();

  const [profileForm, setProfileForm] = useState({
    name: '',
    shortDescription: '',
    vision: '',
    logoUrl: '',
  });

  useEffect(() => {
    setProfileForm({
      name: selectedClub.name || '',
      shortDescription: selectedClub.shortDescription || '',
      vision: selectedClub.vision || selectedClub.description || '',
      logoUrl: selectedClub.logoUrl || '',
    });
  }, [selectedClub]);

  const handleEditLogoFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const logoUrl = await squareImageFile(file);
      setProfileForm(prev => ({ ...prev, logoUrl }));
    } catch {
      // ignore
    }
  };

  const submitProfileRequest = async (event: FormEvent) => {
    event.preventDefault();
    await requestClubProfileUpdate(selectedClub.id, {
      ...profileForm,
      description: profileForm.vision,
    });
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.4fr] gap-5">
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black shadow-lg shrink-0">
            {selectedClub.logoUrl ? <img src={selectedClub.logoUrl} alt={selectedClub.name} className="w-full h-full object-cover" /> : <span className="text-2xl">{selectedClub.name.slice(0, 2).toLocaleUpperCase('tr-TR')}</span>}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">{selectedClub.name}</h2>
            <p className="text-sm text-white/40">{selectedClub.shortDescription}</p>
          </div>
        </div>
        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-white/35">Üye sayısı</dt><dd className="font-bold text-white">{selectedClub.memberCount}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-white/35">Etkinlik sayısı</dt><dd className="font-bold text-white">{selectedClub.eventCount}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-white/35">Danışman</dt><dd className="font-bold text-white text-right">{selectedClub.advisorFullName || 'Bilgi bekleniyor'}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-white/35">Durum</dt><dd className="font-bold text-white">{selectedClub.active ? 'Aktif' : 'Pasif'}</dd></div>
        </dl>
      </div>

      <form onSubmit={submitProfileRequest} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-black text-white">Profil Güncelleme Talebi</h2>
          <p className="text-sm text-white/40 mt-1">Bu form kulübü doğrudan değiştirmez; SKS yönetimine değerlendirme bildirimi gönderir.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center">
          <input value={profileForm.name} onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))} className={inputClass} placeholder="Kulüp adı" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
              {profileForm.logoUrl ? (
                <img src={profileForm.logoUrl} alt="Yeni Logo" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-5 h-5 text-white/50" />
              )}
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleEditLogoFileSelect}
              className="block w-full text-xs text-white/65 file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-xs file:font-bold file:text-indigo-100 hover:file:bg-indigo-500/30"
            />
          </div>
        </div>
        <textarea value={profileForm.shortDescription} onChange={e => setProfileForm(prev => ({ ...prev, shortDescription: e.target.value }))} className={textareaClass} placeholder="Kısa açıklama" />
        <textarea value={profileForm.vision} onChange={e => setProfileForm(prev => ({ ...prev, vision: e.target.value }))} className={`${textareaClass} min-h-40`} placeholder="Vizyon" />

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-2 mt-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <GraduationCap className="w-4 h-4 text-cyan-300" />
            Danışman Akademisyen
          </div>
          <p className="text-sm font-bold text-white">
            {[selectedClub.advisorTitle, selectedClub.advisorFullName].filter(Boolean).join(' ') || 'Bilgi bekleniyor'}
          </p>
          <p className="text-xs text-white/40">
            Danışman değişikliği yalnızca SKS yöneticileri tarafından yapılır.
          </p>
        </section>
        <button disabled={isLoading} type="submit" className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 gradient-btn font-bold disabled:opacity-45">
          <Send className="w-4 h-4" />
          SKS Onayına Gönder
        </button>
      </form>
    </section>
  );
};
