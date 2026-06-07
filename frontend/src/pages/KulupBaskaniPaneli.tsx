import { useEffect, useState, useMemo } from 'react';
import { CalendarDays, FilePenLine, Megaphone, UsersRound } from 'lucide-react';
import { useKulupDeposu } from '../store/kulupDeposu';
import { useEtkinlikDeposu } from '../store/etkinlikDeposu';

import type { PanelTab } from '../components/club-dashboard/sabitler';
import { ProfilSekmesi } from '../components/club-dashboard/ProfilSekmesi';
import { EtkinliklerSekmesi } from '../components/club-dashboard/EtkinliklerSekmesi';
import { DuyurularSekmesi } from '../components/club-dashboard/DuyurularSekmesi';
import { UyelerSekmesi } from '../components/club-dashboard/UyelerSekmesi';

export const KulupBaskaniPaneli = () => {
  const {
    managedClubs,
    isLoading: clubsLoading,
    error: clubError,
    successMessage: clubSuccess,
    fetchManagedClubs,
  } = useKulupDeposu();
  
  const {
    error: eventError,
    successMessage: eventSuccess,
    fetchManagedEvents,
  } = useEtkinlikDeposu();

  const [activeTab, setActiveTab] = useState<PanelTab>('profile');
  const [selectedClubId, setSelectedClubId] = useState('');

  useEffect(() => {
    fetchManagedClubs();
    fetchManagedEvents();
  }, [fetchManagedClubs, fetchManagedEvents]);

  useEffect(() => {
    if (!selectedClubId && managedClubs.length > 0) {
      setSelectedClubId(managedClubs[0].id);
    }
  }, [managedClubs, selectedClubId]);

  const selectedClub = useMemo(
    () => managedClubs.find(club => club.id === selectedClubId) || managedClubs[0] || null,
    [managedClubs, selectedClubId]
  );

  const tabs = [
    { key: 'profile' as const, label: 'Kulüp Bilgileri', description: 'SKS onayına profil güncelleme talebi', icon: FilePenLine },
    { key: 'events' as const, label: 'Etkinlik Yönetimi', description: 'Taslak oluştur, revize et ve onaya gönder', icon: CalendarDays },
    { key: 'announcements' as const, label: 'Duyurular', description: 'Kulüp üyelerine bilgilendirme gönder', icon: Megaphone },
    { key: 'members' as const, label: 'Üyeler', description: 'Kulüp üyelerini yönet', icon: UsersRound },
  ];

  if (!selectedClub) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center">
        {clubsLoading ? (
          <p className="text-sm font-semibold text-white/45">Yükleniyor...</p>
        ) : (
          <p className="text-sm font-semibold text-white/45">Yönetilebilir kulüp bulunamadı.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div>
          <p className="text-sm font-bold text-purple-300">Kulüp Başkanlığı</p>
          <h1 className="text-4xl font-black gradient-text mt-2">Kulüp Yönetim Paneli</h1>
          <p className="text-white/45 mt-3">
            {selectedClub.ad} operasyonlarını buradan yönet. Profil değişiklikleri SKS onayına gider; etkinlikler yayınlanmadan önce SKS tarafından incelenir.
          </p>
        </div>
      </header>

          <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-3xl border p-5 text-left transition-colors ${active ? 'border-purple-300/35 bg-purple-500/20' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.055]'}`}
            >
              <div className="flex items-center gap-4">
                <span className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white/75" />
                </span>
                <span>
                  <span className="block text-base font-black text-white">{tab.label}</span>
                  <span className="block text-xs font-semibold text-white/40 mt-1">{tab.description}</span>
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {(clubError || eventError || clubSuccess || eventSuccess) && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-sm font-semibold">
          {(clubError || eventError) && <p className="text-red-200">{clubError || eventError}</p>}
          {(clubSuccess || eventSuccess) && <p className="text-emerald-200">{clubSuccess || eventSuccess}</p>}
        </div>
      )}

      {activeTab === 'profile' && <ProfilSekmesi selectedClub={selectedClub} />}
      {activeTab === 'events' && <EtkinliklerSekmesi selectedClub={selectedClub} />}
      {activeTab === 'announcements' && <DuyurularSekmesi selectedClub={selectedClub} />}
      {activeTab === 'members' && <UyelerSekmesi selectedClub={selectedClub} />}
    </div>
  );
};
