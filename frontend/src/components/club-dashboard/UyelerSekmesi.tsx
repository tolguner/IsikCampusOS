import { useEffect } from 'react';
import { UsersRound, ShieldCheck } from 'lucide-react';
import type { Kulup } from '../../store/kulupDeposu';
import { useKulupDeposu } from '../../store/kulupDeposu';

interface UyelerSekmesiProps {
  selectedClub: Kulup;
}

export const UyelerSekmesi = ({ selectedClub }: UyelerSekmesiProps) => {
  const {
    clubMembers,
    fetchClubMembers,
  } = useKulupDeposu();

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
          <p className="text-sm text-white/50">Kulüp üyelerini görüntüle. Rol atamaları yalnızca SKS yönetimi tarafından yapılır.</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {clubMembers.map(m => {
                  const isAdmin = m.rol === 'YONETICI';
                  return (
                    <tr key={m.kullaniciId} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">
                        <span className="flex items-center gap-2">
                          {m.adSoyad || 'Bilinmiyor'}
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-300 bg-yellow-500/15 border border-yellow-400/20 rounded-full px-2 py-0.5">
                              <ShieldCheck className="w-3 h-3" /> Başkan
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">{m.ogrenciNumarasi || m.kullaniciId}</td>
                      <td className="py-3 px-4">{m.bolum || '-'}</td>
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
