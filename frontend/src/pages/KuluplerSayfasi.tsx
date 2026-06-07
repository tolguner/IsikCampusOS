import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, Loader2, Search, Sparkles, Users, X } from 'lucide-react';
import { useKulupDeposu } from '../store/kulupDeposu';
import { useKimlikDeposu } from '../store/kimlikDeposu';
import { yetkilerdenBiriVarMi, YETKI_GRUPLARI } from '../utils/roles';
import { YOLLAR } from '../utils/paths';

export const KuluplerSayfasi = () => {
  const { clubs, fetchClubs, joinClub, leaveClub, isLoading, error, successMessage, clearMessages } = useKulupDeposu();
  const user = useKimlikDeposu(state => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [leaveTarget, setLeaveTarget] = useState<{ id: string; name: string } | null>(null);
  const isStudent = yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.ogrenci);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const filteredClubs = useMemo(() => {
    const normalized = searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!normalized) return clubs;
    return clubs.filter(club =>
      club.ad.toLocaleLowerCase('tr-TR').includes(normalized) ||
      club.kisaAciklama?.toLocaleLowerCase('tr-TR').includes(normalized) ||
      club.vizyon?.toLocaleLowerCase('tr-TR').includes(normalized) ||
      club.aciklama?.toLocaleLowerCase('tr-TR').includes(normalized)
    );
  }, [clubs, searchTerm]);

  const managedClubs = useMemo(() => clubs.filter(club => club.mevcutKullaniciRol === 'YONETICI'), [clubs]);
  const managedClubNames = managedClubs.map(club => club.ad).join(', ');

  const membershipBadge = (club: typeof clubs[number]) => {
    if (club.mevcutKullaniciRol === 'YONETICI') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold text-amber-200 bg-amber-500/10 border border-amber-500/20">Yönetici</span>;
    }
    if (club.mevcutKullaniciDurum === 'AKTIF') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold text-emerald-200 bg-emerald-500/10 border border-emerald-500/20">Üyesin</span>;
    }
    if (club.mevcutKullaniciDurum === 'REDDEDILDI') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold text-red-200 bg-red-500/10 border border-red-500/20">Reddedildi</span>;
    }
    return null;
  };

  const membershipButtonLabel = (club: typeof clubs[number]) => {
    if (club.mevcutKullaniciRol === 'YONETICI') return 'Yöneticisisin';
    if (club.mevcutKullaniciDurum === 'AKTIF') return 'Üyesiniz';
    if (club.mevcutKullaniciDurum === 'REDDEDILDI') return 'Tekrar başvur';
    return 'Üye ol';
  };

  const clubInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toLocaleUpperCase('tr-TR');

  const handleMembershipClick = async (clubId: string, clubName: string, isMember: boolean) => {
    if (!isMember) {
      await joinClub(clubId);
      return;
    }

    setLeaveTarget({ id: clubId, name: clubName });
  };

  const confirmLeaveClub = async () => {
    if (!leaveTarget) return;
    const ok = await leaveClub(leaveTarget.id);
    if (ok) setLeaveTarget(null);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in w-full py-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-3">Kulüpler</h1>
          <p className="text-sm sm:text-base text-white/45 max-w-3xl leading-relaxed">
            Kulüpleri keşfet, topluluklara katıl ve etkinlik akışlarını tek yerden takip et.
          </p>
        </div>

        <div className={`grid ${managedClubs.length > 0 ? 'grid-cols-3 sm:min-w-[420px]' : 'grid-cols-2 sm:min-w-[280px]'} gap-3 min-w-full`}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-2xl font-black text-white">{clubs.length}</div>
            <div className="text-xs text-white/40">Aktif kulüp</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-2xl font-black text-white">{clubs.filter(c => c.mevcutKullaniciUyeMi).length}</div>
            <div className="text-xs text-white/40">Üyelik</div>
          </div>
          {managedClubs.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 min-w-0">
              <div className="text-sm font-black text-white truncate" title={managedClubNames}>{managedClubNames}</div>
              <div className="text-xs text-white/40">Yönetim</div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-2xl flex items-center justify-between bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-400" /><p className="text-sm text-red-300 font-medium">{error}</p></div>
            <button onClick={clearMessages} className="text-red-300 hover:text-white"><X className="w-4 h-4"/></button>
          </motion.div>
        )}
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-2xl flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><p className="text-sm text-emerald-300 font-medium">{successMessage}</p></div>
            <button onClick={clearMessages} className="text-emerald-300 hover:text-white"><X className="w-4 h-4"/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Kulüp adı veya açıklama ile ara..."
          className="w-full rounded-2xl bg-white/[0.03] border border-white/10 pl-11 pr-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-indigo-400/40"
        />
      </div>

      {isLoading && clubs.length === 0 ? (
        <div className="min-h-[360px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClubs.map((club, index) => (
            <motion.article
              key={club.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-5 min-h-[280px]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden">
                    {club.logoUrl ? (
                      <img src={club.logoUrl} alt={`${club.ad} logosu`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-white">{clubInitials(club.ad) || <Sparkles className="w-6 h-6 text-white" />}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold text-white leading-tight line-clamp-2">{club.ad}</h2>
                  </div>
                </div>
                {membershipBadge(club)}
              </div>

              <div className="space-y-3 flex-1">
                <p className="text-sm text-white/45 leading-relaxed line-clamp-4">{club.kisaAciklama || 'Kısa açıklama bekleniyor.'}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-white/45">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-300" />
                  <span>{club.uyeSayisi} üye</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-cyan-300" />
                  <span>{club.etkinlikSayisi} etkinlik</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link to={YOLLAR.kulupDetay(club.id)} className="px-4 py-2.5 rounded-xl text-center text-sm font-bold text-white bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] transition-colors">
                  Detay
                </Link>
                {isStudent ? (
                  <button
                    disabled={isLoading || club.mevcutKullaniciRol === 'YONETICI'}
                    onClick={() => handleMembershipClick(club.id, club.ad, club.mevcutKullaniciDurum === 'AKTIF')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-45 disabled:cursor-not-allowed group ${
                      club.mevcutKullaniciRol === 'YONETICI'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                        : club.mevcutKullaniciDurum === 'AKTIF'
                          ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 hover:bg-red-500/15 hover:border-red-500/25 hover:text-red-100'
                          : 'gradient-btn'
                    }`}
                  >
                    {club.mevcutKullaniciDurum === 'AKTIF' ? (
                      <>
                        <span className="group-hover:hidden">Üyesiniz</span>
                        <span className="hidden group-hover:inline">Üyelikten çık</span>
                      </>
                    ) : (
                      membershipButtonLabel(club)
                    )}
                  </button>
                ) : (
                  <span className="px-4 py-2.5 rounded-xl text-center text-xs font-bold text-white/35 bg-white/[0.03] border border-white/10">
                    Öğrencilere açık
                  </span>
                )}
              </div>

              <AnimatePresence>
                {leaveTarget?.id === club.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
                  >
                    <p className="text-sm font-bold text-white mb-1">Üyelikten çıkılsın mı?</p>
                    <p className="text-xs text-white/45 leading-relaxed mb-3">
                      {club.ad} üyeliğin sonlandırılacak.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLeaveTarget(null)}
                        disabled={isLoading}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-white/70 bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] disabled:opacity-40"
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        onClick={confirmLeaveClub}
                        disabled={isLoading}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-red-500/75 border border-red-400/30 hover:bg-red-500 disabled:opacity-50"
                      >
                        {isLoading ? 'İşleniyor...' : 'Çık'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          ))}
        </div>
      )}

      {filteredClubs.length === 0 && !isLoading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-12 text-center text-white/35">
          Aramana uygun kulüp bulunamadı.
        </div>
      )}
    </div>
  );
};
