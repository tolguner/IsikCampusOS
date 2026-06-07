import React from 'react';
import { GraduationCap, Pencil, RefreshCw, Save, Search, UserCog, X } from 'lucide-react';
import type { Kulup } from '../../depolar/kulupDeposu';
import type { Student } from '../../depolar/ogrenciDeposu';
import type { AcademicAdvisor } from '../../depolar/akademikKadroDeposu';
import {
  inputClass,
  fieldLimitText,
  SHORT_DESCRIPTION_MIN_LENGTH,
  SHORT_DESCRIPTION_MAX_LENGTH,
  VISION_MIN_LENGTH,
  VISION_MAX_LENGTH,
  type KulupDuzenleFormu,
} from './ortak';

interface KulupModuluProps {
  filteredClubs: Kulup[];
  clubsLoading: boolean;
  editingClubId: string | null;
  setEditingClubId: React.Dispatch<React.SetStateAction<string | null>>;
  startEditingClub: (club: Kulup) => void;
  changeClubStatus: (clubId: string, aktif: boolean) => void;
  deleteClub: (clubId: string) => void;
  handleUpdateClubProfile: (event: React.FormEvent) => void;
  clubEditForm: KulupDuzenleFormu;
  setClubEditForm: React.Dispatch<React.SetStateAction<KulupDuzenleFormu>>;
  handleEditLogoFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditPresidentSearch: () => void;
  students: Student[];
  studentsLoading: boolean;
  isPresidentAssignedToAnotherClub: (studentId: string, clubId: string) => boolean;
  handleEditPresidentSelect: (club: Kulup, student: Student) => void;
  selectedEditPresidentName: string;
  syncAdvisors: () => void;
  advisorsLoading: boolean;
  advisors: AcademicAdvisor[];
  isAdvisorAssignedToAnotherClub: (advisorId: string, clubId: string) => boolean;
  handleEditAdvisorSelect: (club: Kulup, advisor: AcademicAdvisor) => void;
  selectedEditAdvisorDisplayName: string;
}

export const KulupModulu = ({
  filteredClubs,
  clubsLoading,
  editingClubId,
  setEditingClubId,
  startEditingClub,
  changeClubStatus,
  deleteClub,
  handleUpdateClubProfile,
  clubEditForm,
  setClubEditForm,
  handleEditLogoFileSelect,
  handleEditPresidentSearch,
  students,
  studentsLoading,
  isPresidentAssignedToAnotherClub,
  handleEditPresidentSelect,
  selectedEditPresidentName,
  syncAdvisors,
  advisorsLoading,
  advisors,
  isAdvisorAssignedToAnotherClub,
  handleEditAdvisorSelect,
  selectedEditAdvisorDisplayName,
}: KulupModuluProps) => (
  <section className="space-y-5">
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.025]">
      <table className="w-full min-w-[1120px] border-separate border-spacing-0">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-white/35 bg-white/[0.025]">
            <th className="px-5 py-4 font-bold">Kulüp</th>
            <th className="px-5 py-4 font-bold">Başkan</th>
            <th className="px-5 py-4 font-bold">Danışman</th>
            <th className="px-5 py-4 font-bold">Durum</th>
            <th className="px-5 py-4 font-bold">Operasyon</th>
            <th className="px-5 py-4 font-bold text-right">Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          {filteredClubs.map(club => (
            <React.Fragment key={club.id}>
            <tr className="border-t border-white/10 text-sm text-white/70 hover:bg-white/[0.025]">
              <td className="px-5 py-4 border-t border-white/5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {club.logoUrl ? (
                      <img src={club.logoUrl} alt={`${club.ad} logosu`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-white">{club.ad.slice(0, 2).toLocaleUpperCase('tr-TR')}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-white truncate">{club.ad}</div>
                    <div className="text-xs text-white/40 max-w-xs truncate">{club.kisaAciklama || 'Kısa açıklama bekleniyor.'}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 border-t border-white/5">
                <div className="font-bold text-white">{club.baskanAdSoyad || 'Atanmadı'}</div>
                <div className="text-xs text-white/35 break-all">{club.baskanEposta || 'E-posta yok'}</div>
              </td>
              <td className="px-5 py-4 border-t border-white/5">
                <div className="font-bold text-white">{[club.danismanUnvani, club.danismanAdSoyad].filter(Boolean).join(' ') || 'Bilgi yok'}</div>
                <div className="text-xs text-white/35">{club.danismanBolumu || 'Birim yok'}</div>
              </td>
              <td className="px-5 py-4 border-t border-white/5">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${club.aktif ? 'text-emerald-200 bg-emerald-500/10' : 'text-zinc-300 bg-white/10'}`}>
                  {club.aktif ? 'Aktif' : 'Pasif'}
                </span>
              </td>
              <td className="px-5 py-4 border-t border-white/5">
                <div className="flex gap-3">
                  <div><span className="font-black text-white">{club.uyeSayisi}</span><span className="text-xs text-white/35 ml-1">üye</span></div>
                  <div><span className="font-black text-white">{club.etkinlikSayisi}</span><span className="text-xs text-white/35 ml-1">etkinlik</span></div>
                </div>
              </td>
              <td className="px-5 py-4 border-t border-white/5">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => editingClubId === club.id ? setEditingClubId(null) : startEditingClub(club)}
                    className="rounded-2xl px-3 py-2 text-xs font-bold text-indigo-100 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/20 transition-colors"
                  >
                    {editingClubId === club.id ? 'Kapat' : 'Düzenle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => changeClubStatus(club.id, !club.aktif)}
                    className={`rounded-2xl px-3 py-2 text-xs font-bold transition-colors ${club.aktif ? 'text-red-200 bg-red-500/10 hover:bg-red-500/20' : 'text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20'}`}
                  >
                    {club.aktif ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>

                    <button
                      type="button"
                      onClick={() => {
                        if(window.confirm('Bu kulübü ve tüm verilerini tamamen silmek istediğinize emin misiniz?')) {
                          deleteClub(club.id);
                        }
                      }}
                      className="rounded-2xl px-3 py-2 text-xs font-bold transition-colors bg-red-900/40 text-red-200 hover:bg-red-700/60 ml-2"
                    >
                      Sil
                    </button>
                </div>
              </td>
            </tr>
            {editingClubId === club.id && (
              <tr className="bg-white/[0.018]">
                <td colSpan={6} className="px-5 py-5 border-t border-white/5">
                  <form onSubmit={handleUpdateClubProfile} className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5 rounded-3xl border border-white/10 bg-[#0d0d1a]/70 p-5">
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-black text-white">
                        <Pencil className="w-4 h-4 text-indigo-300" />
                        Kulüp Profil Bilgileri
                      </div>
                      <input value={clubEditForm.ad} onChange={e => setClubEditForm(prev => ({ ...prev, name: e.target.value }))} required placeholder="Kulüp adı" className={inputClass} />
                      <div>
                        <input
                          value={clubEditForm.kisaAciklama}
                          onChange={e => setClubEditForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                          required
                          minLength={SHORT_DESCRIPTION_MIN_LENGTH}
                          maxLength={SHORT_DESCRIPTION_MAX_LENGTH}
                          placeholder="Kısa açıklama"
                          className={inputClass}
                        />
                        <p className="mt-2 text-xs text-white/35">{fieldLimitText(clubEditForm.kisaAciklama, SHORT_DESCRIPTION_MIN_LENGTH, SHORT_DESCRIPTION_MAX_LENGTH)}</p>
                      </div>
                      <textarea
                        value={clubEditForm.vizyon}
                        onChange={e => setClubEditForm(prev => ({ ...prev, vision: e.target.value, description: e.target.value }))}
                        required
                        minLength={VISION_MIN_LENGTH}
                        maxLength={VISION_MAX_LENGTH}
                        rows={5}
                        placeholder="Vizyon"
                        className={`${inputClass} resize-none`}
                      />
                                                <p className="-mt-2 text-xs text-white/35">{fieldLimitText(clubEditForm.vizyon, VISION_MIN_LENGTH, VISION_MAX_LENGTH)}</p>
                    </section>

                    <aside className="space-y-4">
                      <div className="grid grid-cols-[72px_1fr] gap-4 items-center">
                        <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 border border-white/10 overflow-hidden flex items-center justify-center">
                          {clubEditForm.logoUrl ? (
                            <img src={clubEditForm.logoUrl} alt="Kulüp logosu" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-black text-white">{clubEditForm.ad.slice(0, 2).toLocaleUpperCase('tr-TR') || 'KL'}</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white mb-2">Logo</label>
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={handleEditLogoFileSelect}
                            className="block w-full text-xs text-white/65 file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-xs file:font-bold file:text-indigo-100 hover:file:bg-indigo-500/30"
                          />
                        </div>
                      </div>
                      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                          <UserCog className="w-4 h-4 text-purple-300" />
                          Kulüp Başkanı
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={clubEditForm.presidentSearch}
                            onChange={e => setClubEditForm(prev => ({
                              ...prev,
                              presidentSearch: e.target.value,
                              presidentId: '',
                              presidentFullName: '',
                              presidentEmail: '',
                            }))}
                            placeholder="Öğrenci adı, e-posta veya numara"
                            className={inputClass}
                          />
                          <button type="button" onClick={handleEditPresidentSearch} className="rounded-2xl px-4 gradient-btn">
                            <Search className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {students.map(student => {
                            const alreadyPresident = isPresidentAssignedToAnotherClub(student.id, club.id);
                            return (
                              <button
                                key={student.id}
                                type="button"
                                onClick={() => handleEditPresidentSelect(club, student)}
                                disabled={alreadyPresident}
                                className={`w-full rounded-2xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${clubEditForm.presidentId === student.id ? 'border-purple-400/50 bg-purple-500/15' : alreadyPresident ? 'border-amber-400/20 bg-amber-500/[0.06] opacity-60' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06]'}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="text-sm font-bold text-white">{student.tamAd}</div>
                                  {alreadyPresident && <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">Başkan</span>}
                                </div>
                                <div className="text-xs text-white/35">{student.ogrenciNumarasi} - {student.eposta}</div>
                              </button>
                            );
                          })}
                          {studentsLoading && <p className="text-xs text-white/35">Öğrenciler aranıyor...</p>}
                        </div>
                        {clubEditForm.presidentId && (
                          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-3 text-sm text-emerald-100">
                            Seçilen başkan: <span className="font-bold">{selectedEditPresidentName}</span>
                            <div className="mt-1 text-xs text-emerald-100/75 break-all">{clubEditForm.baskanEposta}</div>
                          </div>
                        )}
                        {clubEditForm.presidentId && isPresidentAssignedToAnotherClub(clubEditForm.presidentId, club.id) && (
                          <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-100">
                            Bu öğrenci halihazırda başka bir kulüpte başkan.
                          </p>
                        )}
                      </section>
                      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <GraduationCap className="w-4 h-4 text-cyan-300" />
                            Danışman Akademisyen
                          </div>
                          <button
                            type="button"
                            onClick={syncAdvisors}
                            disabled={advisorsLoading}
                            className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-cyan-100 bg-cyan-500/10 border border-cyan-400/20 hover:bg-cyan-500/20 disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${advisorsLoading ? 'animate-spin' : ''}`} />
                            Güncelle
                          </button>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input
                            value={clubEditForm.advisorSearch}
                            onChange={e => setClubEditForm(prev => ({
                              ...prev,
                              advisorSearch: e.target.value,
                              advisorAcademicStaffId: '',
                              advisorTitle: '',
                              advisorFullName: '',
                              advisorEmail: '',
                              advisorDepartment: '',
                            }))}
                            placeholder="Akademisyen adı, e-posta veya bölüm"
                            className={`${inputClass} pl-11`}
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-2">
                          {advisors.map(advisor => {
                            const alreadyAssigned = isAdvisorAssignedToAnotherClub(advisor.id, club.id);
                            return (
                              <button
                                key={advisor.id}
                                type="button"
                                onClick={() => handleEditAdvisorSelect(club, advisor)}
                                disabled={alreadyAssigned}
                                className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed ${clubEditForm.danismanAkademikKadroId === advisor.id ? 'border-cyan-400/50 bg-cyan-500/15' : alreadyAssigned ? 'border-amber-400/20 bg-amber-500/[0.06] opacity-60' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06]'}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="text-sm font-bold text-white">{advisor.displayName}</div>
                                  {alreadyAssigned && <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">Atanmış</span>}
                                </div>
                                <div className="mt-1 text-xs text-white/40 break-all">{advisor.email || 'E-posta yok'}</div>
                                <div className="mt-1 text-xs text-white/35">{advisor.department || advisor.facultyOrUnit || 'Bölüm bilgisi yok'}</div>
                              </button>
                            );
                          })}
                          {advisorsLoading && <p className="text-xs text-white/35">Akademik kadro aranıyor...</p>}
                          {!advisorsLoading && advisors.length === 0 && !clubEditForm.danismanAkademikKadroId && (
                            <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-xs text-white/35">
                              Sonuç bulunamadı. Listeyi güncelleyip tekrar arayabilirsin.
                            </p>
                          )}
                        </div>
                        {clubEditForm.danismanAkademikKadroId && (
                          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-3 text-sm text-emerald-100">
                            Seçilen danışman: <span className="font-bold">{selectedEditAdvisorDisplayName}</span>
                            <div className="mt-1 text-xs text-emerald-100/75 break-all">{clubEditForm.danismanEposta} · {clubEditForm.danismanBolumu}</div>
                          </div>
                        )}
                        {clubEditForm.danismanAkademikKadroId && isAdvisorAssignedToAnotherClub(clubEditForm.danismanAkademikKadroId, club.id) && (
                          <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-100">
                            Bu akademisyen halihazırda başka bir kulüpte danışman.
                          </p>
                        )}
                      </section>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingClubId(null)} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white/70 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10">
                          <X className="w-4 h-4" />
                          Vazgeç
                        </button>
                        <button
                          type="submit"
                          disabled={
                            clubsLoading ||
                            !clubEditForm.presidentId ||
                            !clubEditForm.danismanAkademikKadroId ||
                            isPresidentAssignedToAnotherClub(clubEditForm.presidentId, club.id) ||
                            isAdvisorAssignedToAnotherClub(clubEditForm.danismanAkademikKadroId, club.id)
                          }
                          className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold gradient-btn disabled:opacity-45"
                        >
                          <Save className="w-4 h-4" />
                          Kaydet
                        </button>
                      </div>
                    </aside>
                  </form>
                </td>
              </tr>
            )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
    {!clubsLoading && filteredClubs.length === 0 && (
      <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center text-white/35">
        Bu filtrelere uygun kulüp bulunamadı.
      </div>
    )}
    {clubsLoading && <p className="text-sm text-white/40">Kulüpler yükleniyor...</p>}
  </section>
);
