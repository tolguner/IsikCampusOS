import React from 'react';
import { CheckCircle2, Clock3, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import type { Tesis, TesisPolitikasi } from '../../depolar/tesisDeposu';
import {
  panelStyle,
  inputClass,
  compactInputClass,
  facilityTypes,
  dayLabels,
  type WeeklyHourDay,
  type TesisFormState,
  SectionTitle,
  StatusBadge,
  NumberField,
} from './ortak';

interface YapilandirmaGorunumuProps {
  facilities: Tesis[];
  selectedFacilityId: string | null;
  selectFacility: (facilityId: string | null) => void;
  resetFacilityForm: () => void;
  selectedFacility: Tesis | null;
  facilityForm: TesisFormState;
  setFacilityForm: React.Dispatch<React.SetStateAction<TesisFormState>>;
  handleCreateFacility: (event: React.FormEvent) => void;
  handleUpdateFacility: (event: React.FormEvent) => void;
  handleDeleteFacility: () => void;
  policyForm: TesisPolitikasi;
  setPolicyForm: React.Dispatch<React.SetStateAction<TesisPolitikasi>>;
  handleUpdatePolicy: (event: React.FormEvent) => void;
  weeklyHours: WeeklyHourDay[];
  setWeeklyHours: React.Dispatch<React.SetStateAction<WeeklyHourDay[]>>;
  handleSaveRules: () => void;
}

export const YapilandirmaGorunumu = ({
  facilities,
  selectedFacilityId,
  selectFacility,
  resetFacilityForm,
  selectedFacility,
  facilityForm,
  setFacilityForm,
  handleCreateFacility,
  handleUpdateFacility,
  handleDeleteFacility,
  policyForm,
  setPolicyForm,
  handleUpdatePolicy,
  weeklyHours,
  setWeeklyHours,
  handleSaveRules,
}: YapilandirmaGorunumuProps) => {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-3xl p-4" style={panelStyle}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Spor Tesisleri</h2>
              <p className="text-xs font-semibold text-white/35">Yönetilecek ana alanlar</p>
            </div>
            <button
              type="button"
              onClick={() => { selectFacility(null); resetFacilityForm(); }}
              className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 transition cursor-pointer"
              title="Yeni Tesis Ekle"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {facilities.map(facility => (
              <button
                key={facility.id}
                type="button"
                onClick={() => selectFacility(facility.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${facility.id === selectedFacilityId ? 'border-cyan-300/40 bg-cyan-400/10' : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06]'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{facility.ad}</p>
                    <p className="mt-1 text-xs font-semibold text-white/38">{facility.konumMetni || 'Konum girilmedi'}</p>
                  </div>
                  <StatusBadge durum={facility.durum} />
                </div>
                <div className="mt-3 flex gap-2 text-[11px] font-bold text-white/45">
                  <span>Kapasite: {facility.kapasite}</span>
                  <span>{facility.kaynaklar.length} kaynak</span>
                </div>
              </button>
            ))}
            {facilities.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/38">
                Henüz tesis tanımı yok.
              </p>
            )}
          </div>
        </section>

        <div className="grid gap-6 2xl:grid-cols-2">
          <section className="rounded-3xl p-5" style={panelStyle}>
            <SectionTitle icon={Plus} title="Tesis Tanımı" subtitle={selectedFacility ? 'Seçili tesisi güncelleyin veya yeni tesis oluşturun.' : 'İlk tesis kaydını oluşturun.'} />
            <form className="mt-5 space-y-4" onSubmit={selectedFacility ? handleUpdateFacility : handleCreateFacility}>
              <input className={inputClass} placeholder="Tesis adı" value={facilityForm.ad} onChange={e => setFacilityForm(prev => ({ ...prev, ad: e.target.value }))} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className={inputClass} value={facilityForm.tesisTuru} onChange={e => setFacilityForm(prev => ({ ...prev, tesisTuru: e.target.value }))}>
                  {facilityTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
                <input className={inputClass} type="number" min={1} value={facilityForm.kapasite} onChange={e => setFacilityForm(prev => ({ ...prev, kapasite: Number(e.target.value) }))} required />
              </div>
              <input className={inputClass} placeholder="Konum" value={facilityForm.konumMetni} onChange={e => setFacilityForm(prev => ({ ...prev, konumMetni: e.target.value }))} />
              <textarea className={`${inputClass} min-h-28 resize-none`} placeholder="Açıklama" value={facilityForm.aciklama} onChange={e => setFacilityForm(prev => ({ ...prev, aciklama: e.target.value }))} />
              <div className="flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#071018] transition hover:bg-cyan-200 cursor-pointer" type="submit">
                  <Save className="h-4 w-4" />
                  {selectedFacility ? 'Tesisi Güncelle' : 'Tesis Oluştur'}
                </button>
                {selectedFacility && (
                  <button
                    type="button"
                    onClick={handleDeleteFacility}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 hover:bg-red-500/20 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Tesisi Sil
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-3xl p-5" style={panelStyle}>
            <SectionTitle icon={Settings2} title="Tesis Politikaları ve Kriterleri" subtitle="Öğrenci rezervasyon fazında uygulanacak tesis kuralları." />
            <form className="mt-5 space-y-4" onSubmit={handleUpdatePolicy}>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="İleri rezervasyon günü" value={policyForm.rezervasyonPenceresiGun} onChange={value => setPolicyForm(prev => ({ ...prev, rezervasyonPenceresiGun: value }))} />
                <NumberField label="Minimum ön süre (dk)" value={policyForm.minimumBildirimDakika} onChange={value => setPolicyForm(prev => ({ ...prev, minimumBildirimDakika: value }))} />
                <NumberField label="İptal son süre (dk)" value={policyForm.iptalLimitDakika} onChange={value => setPolicyForm(prev => ({ ...prev, iptalLimitDakika: value }))} />
                <NumberField label="Maks. rezervasyon (dk)" value={policyForm.maksimumRezervasyonSureDakika} onChange={value => setPolicyForm(prev => ({ ...prev, maksimumRezervasyonSureDakika: value }))} />
                <NumberField label="No-show toleransı (dk)" value={policyForm.otomatikGelmemeDakika} onChange={value => setPolicyForm(prev => ({ ...prev, otomatikGelmemeDakika: value }))} />
                <label className="flex min-h-[62px] items-center gap-3 rounded-2xl border border-white/10 bg-[#111123] px-4 py-3 text-sm font-bold text-white/70 font-sans cursor-pointer">
                  <input type="checkbox" checked={policyForm.yoklamaZorunlu} onChange={e => setPolicyForm(prev => ({ ...prev, yoklamaZorunlu: e.target.checked }))} />
                  Check-in zorunlu
                </label>
              </div>
              <button disabled={!selectedFacility} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#071018] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer" type="submit">
                <Save className="h-4 w-4" />
                Kriterleri Kaydet
              </button>
            </form>
          </section>

          <section className="rounded-3xl p-5 2xl:col-span-2" style={panelStyle}>
            <SectionTitle icon={Clock3} title="Tesis Çalışma Saatleri" subtitle={selectedFacility ? `${selectedFacility.ad} için haftalık çalışma saatlerini ve kapalı günleri belirleyin` : 'Önce sol taraftan bir tesis seçin.'} />

            {selectedFacility ? (
              <div className="mt-5 space-y-4">
                <div className="hidden sm:grid grid-cols-[160px_140px_1fr_1fr] gap-4 px-4 text-xs font-black uppercase tracking-wider text-white/35 pb-2 border-b border-white/5">
                  <span>Gün</span>
                  <span>Durum</span>
                  <span>Başlangıç Saati</span>
                  <span>Bitiş Saati</span>
                </div>

                <div className="space-y-2.5">
                  {weeklyHours.map((day) => (
                    <div
                      key={day.haftaninGunu}
                      className={`grid grid-cols-1 sm:grid-cols-[160px_140px_1fr_1fr] items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                        day.isOpen
                          ? 'bg-white/[0.02] border-white/10'
                          : 'bg-red-500/[0.01] border-red-500/10 opacity-70'
                      }`}
                    >
                      {/* Day Label */}
                      <span className="text-sm font-black text-white">{dayLabels[day.haftaninGunu]}</span>

                      {/* Toggle Switch */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setWeeklyHours(prev =>
                              prev.map(w =>
                                w.haftaninGunu === day.haftaninGunu ? { ...w, isOpen: !w.isOpen } : w
                              )
                            );
                          }}
                          className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:outline-none ${
                            day.isOpen ? 'bg-emerald-500' : 'bg-white/10'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              day.isOpen ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`ml-3 text-xs font-black tracking-wide ${
                            day.isOpen ? 'text-emerald-400' : 'text-white/30'
                          }`}
                        >
                          {day.isOpen ? 'AÇIK' : 'KAPALI'}
                        </span>
                      </div>

                      {/* Start Time */}
                      <div>
                        <input
                          type="time"
                          disabled={!day.isOpen}
                          value={day.baslangicSaati}
                          onChange={e => {
                            setWeeklyHours(prev =>
                              prev.map(w =>
                                w.haftaninGunu === day.haftaninGunu ? { ...w, baslangicSaati: e.target.value } : w
                              )
                            );
                          }}
                          className={`${compactInputClass} text-center font-mono font-bold tracking-wider ${
                            !day.isOpen ? 'opacity-30 cursor-not-allowed bg-transparent border-white/5' : ''
                          }`}
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <input
                          type="time"
                          disabled={!day.isOpen}
                          value={day.bitisSaati}
                          onChange={e => {
                            setWeeklyHours(prev =>
                              prev.map(w =>
                                w.haftaninGunu === day.haftaninGunu ? { ...w, bitisSaati: e.target.value } : w
                              )
                            );
                          }}
                          className={`${compactInputClass} text-center font-mono font-bold tracking-wider ${
                            !day.isOpen ? 'opacity-30 cursor-not-allowed bg-transparent border-white/5' : ''
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveRules}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3.5 text-sm font-black text-[#071018] transition hover:bg-cyan-200 shadow-lg shadow-cyan-300/10 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    Çalışma Saatlerini Kaydet
                  </button>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/35 font-semibold mt-4">
                Çalışma saatlerini yapılandırmak için sol taraftan bir tesis seçmelisiniz.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
};
