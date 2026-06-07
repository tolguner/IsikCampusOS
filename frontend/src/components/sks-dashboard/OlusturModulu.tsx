import React from 'react';
import { GraduationCap, RefreshCw, Search, UserCog } from 'lucide-react';
import type { Student } from '../../store/ogrenciDeposu';
import type { AcademicAdvisor } from '../../store/akademikKadroDeposu';
import {
  panelStyle,
  inputClass,
  fieldLimitText,
  SHORT_DESCRIPTION_MIN_LENGTH,
  SHORT_DESCRIPTION_MAX_LENGTH,
  VISION_MIN_LENGTH,
  VISION_MAX_LENGTH,
  type KulupOlusturFormu,
  type LogoDragStart,
} from './ortak';

interface OlusturModuluProps {
  handleCreateClub: (e: React.FormEvent) => void;
  clubForm: KulupOlusturFormu;
  setClubForm: React.Dispatch<React.SetStateAction<KulupOlusturFormu>>;
  logoSource: string;
  logoCropScale: number;
  logoCropX: number;
  logoCropY: number;
  setLogoCropScale: React.Dispatch<React.SetStateAction<number>>;
  setLogoDragStart: React.Dispatch<React.SetStateAction<LogoDragStart | null>>;
  handleLogoDragStart: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleLogoDragMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleLogoWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  handleLogoFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  cropLogoToSquare: () => void;
  syncAdvisors: () => void;
  advisorsLoading: boolean;
  advisors: AcademicAdvisor[];
  assignedAdvisorIds: Set<string>;
  handleAdvisorSelect: (advisor: AcademicAdvisor) => void;
  selectedAdvisorDisplayName: string;
  selectedAdvisorUnavailable: boolean;
  handlePresidentSearch: () => void;
  students: Student[];
  studentsLoading: boolean;
  assignedPresidentIds: Set<string>;
  selectedPresident: Student | null | undefined;
  selectedPresidentUnavailable: boolean;
  clubsLoading: boolean;
}

export const OlusturModulu = ({
  handleCreateClub,
  clubForm,
  setClubForm,
  logoSource,
  logoCropScale,
  logoCropX,
  logoCropY,
  setLogoCropScale,
  setLogoDragStart,
  handleLogoDragStart,
  handleLogoDragMove,
  handleLogoWheel,
  handleLogoFileSelect,
  cropLogoToSquare,
  syncAdvisors,
  advisorsLoading,
  advisors,
  assignedAdvisorIds,
  handleAdvisorSelect,
  selectedAdvisorDisplayName,
  selectedAdvisorUnavailable,
  handlePresidentSearch,
  students,
  studentsLoading,
  assignedPresidentIds,
  selectedPresident,
  selectedPresidentUnavailable,
  clubsLoading,
}: OlusturModuluProps) => (
  <form onSubmit={handleCreateClub} className="grid grid-cols-1 2xl:grid-cols-[1.15fr_0.85fr] gap-5">
    <section className="rounded-3xl p-6 space-y-5" style={panelStyle}>
      <div>
        <h2 className="text-xl font-black text-white">Kulüp Kimliği</h2>
        <p className="text-sm text-white/40 mt-1">Öğrencilerin göreceği isim, kısa açıklama, vizyon ve logo bilgileri.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <input value={clubForm.ad} onChange={e => setClubForm(prev => ({ ...prev, name: e.target.value }))} required placeholder="Kulüp adı" className={inputClass} />
        <div className="lg:col-span-2">
          <input
            value={clubForm.kisaAciklama}
            onChange={e => setClubForm(prev => ({ ...prev, shortDescription: e.target.value }))}
            required
            minLength={SHORT_DESCRIPTION_MIN_LENGTH}
            maxLength={SHORT_DESCRIPTION_MAX_LENGTH}
            placeholder="Kısa açıklama"
            className={inputClass}
          />
          <p className="mt-2 text-xs text-white/35">{fieldLimitText(clubForm.kisaAciklama, SHORT_DESCRIPTION_MIN_LENGTH, SHORT_DESCRIPTION_MAX_LENGTH)}</p>
        </div>
        <div className="lg:col-span-2">
          <textarea
            value={clubForm.vizyon}
            onChange={e => setClubForm(prev => ({ ...prev, vision: e.target.value }))}
            required
            minLength={VISION_MIN_LENGTH}
            maxLength={VISION_MAX_LENGTH}
            placeholder="Vizyon"
            rows={9}
            className={`${inputClass} resize-none`}
          />
                        <p className="mt-2 text-xs text-white/35">{fieldLimitText(clubForm.vizyon, VISION_MIN_LENGTH, VISION_MAX_LENGTH)}</p>
          </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div
            onMouseDown={handleLogoDragStart}
            onMouseMove={handleLogoDragMove}
            onMouseUp={() => setLogoDragStart(null)}
            onMouseLeave={() => setLogoDragStart(null)}
            onWheel={handleLogoWheel}
            className={`relative w-36 h-36 rounded-3xl border border-white/10 bg-[#111123] overflow-hidden flex items-center justify-center shrink-0 select-none ${logoSource && !clubForm.logoUrl ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {clubForm.logoUrl ? (
              <img src={clubForm.logoUrl} alt="Kırpılmış kulüp logosu" className="w-full h-full object-cover" />
            ) : logoSource ? (
              <img
                src={logoSource}
                alt="Logo kırpma önizlemesi"
                draggable={false}
                className="w-full h-full object-cover pointer-events-none"
                style={{ transform: `scale(${logoCropScale}) translate(${logoCropX / 4}px, ${logoCropY / 4}px)` }}
              />
            ) : (
              <span className="text-xs text-white/35 text-center px-4">Kare logo önizlemesi</span>
            )}
            {logoSource && !clubForm.logoUrl && (
              <div className="absolute inset-0 border-2 border-white/20 rounded-3xl pointer-events-none" />
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Kulüp Logosu</h3>
              <p className="text-xs text-white/40 mt-1">PNG veya JPG yükle. Görseli kare alanda mouse ile sürükle, tekerlekle yakınlaştır, sonra uygula.</p>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoFileSelect}
              className="block w-full text-sm text-white/65 file:mr-4 file:rounded-xl file:border-0 file:bg-purple-500/20 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-purple-100 hover:file:bg-purple-500/30"
            />
            {logoSource && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                <label className="space-y-2 text-xs font-bold text-white/50">
                  Yakınlaştırma
                  <input type="range" min="1" max="2.4" step="0.05" value={logoCropScale} onChange={e => setLogoCropScale(Number(e.target.value))} className="w-full" />
                </label>
                <button type="button" onClick={cropLogoToSquare} className="rounded-2xl px-5 py-3 text-sm font-bold text-white bg-white/[0.07] border border-white/10 hover:bg-white/[0.11]">
                  Kare Logoyu Uygula
                </button>
              </div>
            )}
            {clubForm.logoUrl && <p className="text-xs font-bold text-emerald-200">Logo kare olarak hazır.</p>}
          </div>
        </div>
      </div>
    </section>

    <aside className="space-y-5">
      <section className="rounded-3xl p-5 space-y-3" style={panelStyle}>
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
            value={clubForm.advisorSearch}
            onChange={e => setClubForm(prev => ({
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
        <div className="max-h-72 overflow-y-auto space-y-2">
          {advisors.map(advisor => {
            const alreadyAssigned = assignedAdvisorIds.has(advisor.id);
            return (
              <button
                key={advisor.id}
                type="button"
                onClick={() => handleAdvisorSelect(advisor)}
                disabled={alreadyAssigned}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed ${clubForm.danismanAkademikKadroId === advisor.id ? 'border-cyan-400/50 bg-cyan-500/15' : alreadyAssigned ? 'border-amber-400/20 bg-amber-500/[0.06] opacity-60' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06]'}`}
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
          {!advisorsLoading && advisors.length === 0 && !clubForm.danismanAkademikKadroId && (
            <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-xs text-white/35">
              Sonuç bulunamadı. Listeyi güncelleyip tekrar arayabilirsin.
            </p>
          )}
        </div>
        {clubForm.danismanAkademikKadroId && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-3 text-sm text-emerald-100">
            Seçilen danışman: <span className="font-bold">{selectedAdvisorDisplayName}</span>
            <div className="mt-1 text-xs text-emerald-100/75">{clubForm.danismanEposta} · {clubForm.danismanBolumu}</div>
          </div>
        )}
        {selectedAdvisorUnavailable && (
          <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-100">
            Bu akademisyen halihazırda başka bir kulüpte danışman.
          </p>
        )}
      </section>

      <section className="rounded-3xl p-5 space-y-3" style={panelStyle}>
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <UserCog className="w-4 h-4 text-purple-300" />
          Kulüp Başkanı
        </div>
        <div className="flex gap-2">
          <input
            value={clubForm.presidentSearch}
            onChange={e => setClubForm(prev => ({ ...prev, presidentSearch: e.target.value }))}
            placeholder="Öğrenci adı, e-posta veya numara"
            className={inputClass}
          />
          <button type="button" onClick={handlePresidentSearch} className="rounded-2xl px-4 gradient-btn">
            <Search className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-56 overflow-y-auto space-y-2">
          {students.map(student => {
            const alreadyPresident = assignedPresidentIds.has(student.id);
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  if (alreadyPresident) return;
                  setClubForm(prev => ({ ...prev, presidentId: student.id, presidentSearch: student.tamAd }));
                }}
                disabled={alreadyPresident}
                className={`w-full rounded-2xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${clubForm.presidentId === student.id ? 'border-purple-400/50 bg-purple-500/15' : alreadyPresident ? 'border-amber-400/20 bg-amber-500/[0.06] opacity-60' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06]'}`}
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
        {selectedPresident && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-3 text-sm text-emerald-100">
            Seçilen başkan: <span className="font-bold">{selectedPresident.tamAd}</span>
          </div>
        )}
        {selectedPresidentUnavailable && (
          <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-100">
            Bu öğrenci halihazırda başka bir kulüpte başkan.
          </p>
        )}
      </section>

      <section className="rounded-3xl p-5 space-y-4" style={panelStyle}>
        <div>
          <h3 className="text-sm font-bold text-white">Kayıt Özeti</h3>
          <p className="text-xs text-white/40 mt-1">Kulüp aktif oluşturulur ve seçilen başkan kulüp yöneticisi yapılır.</p>
        </div>
        <div className="space-y-2 text-sm text-white/60">
          <div className="flex justify-between gap-4"><span>Kulüp</span><strong className="text-white text-right">{clubForm.ad || 'Bekleniyor'}</strong></div>
          <div className="flex justify-between gap-4"><span>Danışman</span><strong className="text-white text-right">{selectedAdvisorDisplayName || 'Seçilmedi'}</strong></div>
          <div className="flex justify-between gap-4"><span>Başkan</span><strong className="text-white text-right">{selectedPresident?.tamAd || 'Seçilmedi'}</strong></div>
        </div>
        <button type="submit" disabled={!selectedPresident || !clubForm.danismanAkademikKadroId || selectedPresidentUnavailable || selectedAdvisorUnavailable || clubsLoading} className="w-full rounded-2xl px-8 py-3 gradient-btn font-bold disabled:opacity-45 disabled:cursor-not-allowed">
          Kulübü Oluştur
        </button>
      </section>
    </aside>
  </form>
);
