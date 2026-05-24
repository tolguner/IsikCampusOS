import { useEffect } from 'react';
import { UsersRound, XCircle, ShieldCheck } from 'lucide-react';
import type { Club } from '../../store/clubStore';
import { useClubStore } from '../../store/clubStore';

interface MembersTabProps {
  selectedClub: Club;
}

export const MembersTab = ({ selectedClub }: MembersTabProps) => {
  const {
    clubMembers,
    fetchClubMembers,
    updateMemberRole,
    updateMemberStatus,
    removeClubMember,
  } = useClubStore();

  useEffect(() => {
    fetchClubMembers(selectedClub.id);
  }, [selectedClub.id, fetchClubMembers]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="flex items-center gap-4 mb-6">
        <span className="w-12 h-12 rounded-2xl border border-yellow-300/25 bg-yellow-500/15 flex items-center justify-center">
          <UsersRound className="w-5 h-5 text-yellow-100" />
        </span>
        <div>
          <h2 className="text-2xl font-black text-white">Üye Yönetimi</h2>
          <p className="text-sm text-white/50">Kulüp üyelerini ve onay bekleyenleri yönetin.</p>
        </div>
      </div>
      <div className="space-y-4">
        {clubMembers.length === 0 ? (
          <div className="py-12 text-center border border-white/5 bg-white/5 rounded-2xl">
            <UsersRound className="w-10 h-10 text-white/25 mx-auto mb-3" />
            <p className="text-white/60">Henüz hiç üye yok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="lowercase tracking-wider border-b border-white/10 text-white/50">
                <tr>
                  <th className="pb-3 px-4 font-medium">Ad Soyad</th>
                  <th className="pb-3 px-4 font-medium">Öğrenci No</th>
                  <th className="pb-3 px-4 font-medium">Bölüm</th>
                  <th className="pb-3 px-4 font-medium">Rol</th>
                  <th className="pb-3 px-4 font-medium">Durum</th>
                  <th className="pb-3 px-4 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {clubMembers.map(m => {
                  const isAdmin = m.role === 'ADMIN';
                  return (
                    <tr key={m.userId} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">
                        <span className="flex items-center gap-2">
                          {m.fullName || 'Bilinmiyor'}
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-300 bg-yellow-500/15 border border-yellow-400/20 rounded-full px-2 py-0.5">
                              <ShieldCheck className="w-3 h-3" /> Başkan
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">{m.studentId || m.userId}</td>
                      <td className="py-3 px-4">{m.department || '-'}</td>
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <span className="text-xs text-yellow-300/80 font-semibold">Yönetici</span>
                        ) : (
                          <select
                            value={m.role}
                            onChange={(e) => updateMemberRole(selectedClub.id, m.userId, e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-purple-400"
                          >
                            <option value="MEMBER">Üye</option>
                            <option value="ADMIN">Yönetici</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <span className="text-xs text-green-400/80 font-semibold">Aktif</span>
                        ) : (
                          <select
                            value={m.status}
                            onChange={(e) => updateMemberStatus(selectedClub.id, m.userId, e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:border-purple-400"
                          >
                            <option value="PENDING">Onay Bekliyor</option>
                            <option value="ACTIVE">Aktif Üye</option>
                            <option value="REJECTED">Reddedildi</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <span className="text-xs text-white/30">—</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeClubMember(selectedClub.id, m.userId)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Üyeyi Çıkar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
