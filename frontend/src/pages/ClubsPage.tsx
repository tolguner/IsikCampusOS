import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, Loader2, Search, Sparkles, Users, X } from 'lucide-react';
import { useClubStore } from '../store/clubStore';

export const ClubsPage = () => {
  const { clubs, fetchClubs, joinClub, leaveClub, isLoading, error, successMessage, clearMessages } = useClubStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [leaveTarget, setLeaveTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const filteredClubs = useMemo(() => {
    const normalized = searchTerm.trim().toLocaleLowerCase('tr-TR');
    if (!normalized) return clubs;
    return clubs.filter(club =>
      club.name.toLocaleLowerCase('tr-TR').includes(normalized) ||
      club.shortDescription?.toLocaleLowerCase('tr-TR').includes(normalized) ||
      club.vision?.toLocaleLowerCase('tr-TR').includes(normalized) ||
      club.description?.toLocaleLowerCase('tr-TR').includes(normalized)
    );
  }, [clubs, searchTerm]);

  const membershipBadge = (club: typeof clubs[number]) => {
    if (club.currentUserRole === 'ADMIN') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold text-amber-200 bg-amber-500/10 border border-amber-500/20">Yönetici</span>;
    }
    if (club.currentUserStatus === 'ACTIVE') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold text-emerald-200 bg-emerald-500/10 border border-emerald-500/20">Üyesin</span>;
    }
    if (club.currentUserStatus === 'PENDING') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold text-cyan-200 bg-cyan-500/10 border border-cyan-500/20">Onay bekliyor</span>;
    }
    if (club.currentUserStatus === 'REJECTED') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold text-red-200 bg-red-500/10 border border-red-500/20">Reddedildi</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-bold text-white/45 bg-white/5 border border-white/10">Keşfet</span>;
  };

  const membershipButtonLabel = (club: typeof clubs[number]) => {
    if (club.currentUserStatus === 'ACTIVE') return 'Üyelikten çık';
    if (club.currentUserStatus === 'PENDING') return 'Onay bekliyor';
    if (club.currentUserStatus === 'REJECTED') return 'Tekrar başvur';
    return 'Üye ol';
  };

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
    <div className="h-full flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-indigo-300 mb-2">Kulüpler ve etkinlik operasyonları</p>
          <h1 className="text-4xl font-extrabold text-white mb-3">Kulüpler</h1>
          <p className="text-sm sm:text-base text-white/45 max-w-3xl leading-relaxed">
            Kulüpleri keşfet, topluluklara katıl ve SKS onaylı etkinlik akışlarını tek yerden takip et.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 min-w-full sm:min-w-[420px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-2xl font-black text-white">{clubs.length}</div>
            <div className="text-xs text-white/40">Aktif kulüp</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-2xl font-black text-white">{clubs.filter(c => c.currentUserMember).length}</div>
            <div className="text-xs text-white/40">Üyelik</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-2xl font-black text-white">{clubs.filter(c => c.currentUserRole === 'ADMIN').length}</div>
            <div className="text-xs text-white/40">Yönetim</div>
          </div>
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
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-5 min-h-[260px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                {membershipBadge(club)}
              </div>

              <div className="space-y-2 flex-1">
                <h2 className="text-xl font-extrabold text-white leading-tight">{club.name}</h2>
                <p className="text-sm text-white/45 leading-relaxed line-clamp-4">{club.shortDescription || 'Kısa açıklama bekleniyor.'}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-white/45">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-300" />
                  <span>{club.memberCount} üye</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-cyan-300" />
                  <span>{club.eventCount} etkinlik</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link to={`/clubs/${club.id}`} className="px-4 py-2.5 rounded-xl text-center text-sm font-bold text-white bg-white/[0.06] border border-white/10 hover:bg-white/[0.09] transition-colors">
                  Detay
                </Link>
                <button
                  disabled={isLoading || club.currentUserRole === 'ADMIN' || club.currentUserStatus === 'PENDING'}
                  onClick={() => handleMembershipClick(club.id, club.name, club.currentUserStatus === 'ACTIVE')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${club.currentUserStatus === 'ACTIVE' ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-100 hover:bg-red-500/15 hover:border-red-500/25 hover:text-red-100' : 'gradient-btn'}`}
                >
                  {membershipButtonLabel(club)}
                </button>
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
                      {club.name} üyeliğin sonlandırılacak.
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
