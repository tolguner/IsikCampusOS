import React from 'react';
import { Clock3, MapPin, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import type { Tesis } from '../../depolar/tesisDeposu';
import { KonumSecici } from '../kulup-paneli/KonumSecici';
import {
  panelStyle,
  inputClass,
  compactInputClass,
  dayLabels,
  VARSAYILAN_KONUM,
  type WeeklyHourDay,
  type TesisFormState,
  type PolitikaFormState,
  SectionTitle,
  StatusBadge,
  NumberField,
} from './ortak';

interface YapilandirmaGorunumuProps {
  facilities: Tesis[];
  selectedFacilityId: string | null;
  selectFacility: (facilityId: string | null) => void;
  resetForm: () => void;
  selectedFacility: Tesis | null;
  facilityForm: TesisFormState;
  setFacilityForm: React.Dispatch<React.SetStateAction<TesisFormState>>;
  policyForm: PolitikaFormState;
  setPolicyForm: React.Dispatch<React.SetStateAction<PolitikaFormState>>;
  weeklyHours: WeeklyHourDay[];
  setWeeklyHours: React.Dispatch<React.SetStateAction<WeeklyHourDay[]>>;
  handleSave: (event: React.FormEvent) => void;
  handleDeleteFacility: () => void;
  isLoading: boolean;
}

export const YapilandirmaGorunumu = ({
  facilities,
  selectedFacilityId,
  selectFacility,
  resetForm,
  selectedFacility,
  facilityForm,
  setFacilityForm,
  policyForm,
  setPolicyForm,
  weeklyHours,
  setWeeklyHours,
  handleSave,
  handleDeleteFacility,
  isLoading,
}: YapilandirmaGorunumuProps) => {
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      {/* Sol: tesis listesi */}
      <section className="rounded-3xl p-4 self-start" style={panelStyle}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Spor Tesisleri</h2>
            <p className="text-xs font-semibold text-white/35">Yönetilecek spor alanları</p>
          </div>
          <button
            type="button"
            onClick={() => { selectFacility(null); resetForm(); }}
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

      {/* Sağ: tek form (tanım + politika + çalışma saatleri) */}
      <form className="space-y-6" onSubmit={handleSave}>
        {/* Tanım */}
        <section className="rounded-3xl p-5" style={panelStyle}>
          <SectionTitle icon={Plus} title="Tesis Tanımı" subtitle={selectedFacility ? 'Seçili tesisi düzenleyin.' : 'Yeni spor tesisi oluşturun.'} />
          <div className="mt-5 space-y-4">
            <input className={inputClass} placeholder="Tesis adı" value={facilityForm.ad} onChange={e => setFacilityForm(prev => ({ ...prev, ad: e.target.value }))} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">Kapasite</span>
                <input className={inputClass} type="number" min={1} value={facilityForm.kapasite} onChange={e => setFacilityForm(prev => ({ ...prev, kapasite: Number(e.target.value) }))} required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">Durum</span>
                <select className={inputClass} value={facilityForm.durum} onChange={e => setFacilityForm(prev => ({ ...prev, durum: e.target.value as Tesis['durum'] }))}>
                  <option value="AKTIF">Aktif</option>
                  <option value="DURDURULMUS">Durduruldu</option>
                </select>
              </label>
            </div>
            <textarea className={`${inputClass} min-h-24 resize-none`} placeholder="Açıklama" value={facilityForm.aciklama} onChange={e => setFacilityForm(prev => ({ ...prev, aciklama: e.target.value }))} required />

            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">
                <MapPin className="h-3.5 w-3.5" /> Konum (haritadan seçin)
              </span>
              <KonumSecici
                latitude={facilityForm.enlem ?? VARSAYILAN_KONUM.enlem}
                longitude={facilityForm.boylam ?? VARSAYILAN_KONUM.boylam}
                onChange={(lat, lng) => setFacilityForm(prev => ({ ...prev, enlem: lat, boylam: lng }))}
                onLocationSelect={(name) => setFacilityForm(prev => ({ ...prev, konumMetni: name }))}
              />
              <input
                className={`${inputClass} mt-3`}
                placeholder="Konum açıklaması (örn. Şile Kampüsü Spor Tesisleri)"
                value={facilityForm.konumMetni}
                onChange={e => setFacilityForm(prev => ({ ...prev, konumMetni: e.target.value }))}
                required
              />
            </div>
          </div>
        </section>

        {/* Politika */}
        <section className="rounded-3xl p-5" style={panelStyle}>
          <SectionTitle icon={Settings2} title="Rezervasyon Kuralları" subtitle="Öğrenci rezervasyonlarında uygulanacak kurallar." />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <NumberField label="İleri rezervasyon (gün)" value={policyForm.rezervasyonPenceresiGun} onChange={value => setPolicyForm(prev => ({ ...prev, rezervasyonPenceresiGun: value }))} />
            <NumberField label="Maks. süre (saat)" value={policyForm.maksimumRezervasyonSureSaat} onChange={value => setPolicyForm(prev => ({ ...prev, maksimumRezervasyonSureSaat: value }))} />
            <NumberField label="İptal limiti (saat)" value={policyForm.iptalLimitSaat} onChange={value => setPolicyForm(prev => ({ ...prev, iptalLimitSaat: value }))} />
          </div>
          <label className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111123] px-4 py-3.5 text-sm font-bold text-white/80 font-sans cursor-pointer">
            <input type="checkbox" checked={policyForm.onayGerekli} onChange={e => setPolicyForm(prev => ({ ...prev, onayGerekli: e.target.checked }))} />
            <span>
              Onay mekanizması
              <span className="ml-2 font-semibold text-white/40">
                {policyForm.onayGerekli ? 'Açık — talepler Spor Müdürlüğü onayı bekler.' : 'Kapalı — rezervasyonlar anında onaylanır.'}
              </span>
            </span>
          </label>
        </section>

        {/* Çalışma saatleri */}
        <section className="rounded-3xl p-5" style={panelStyle}>
          <SectionTitle icon={Clock3} title="Çalışma Saatleri" subtitle="Haftalık açık/kapalı günler ve saat aralıkları." />
          <div className="mt-5 space-y-4">
            <div className="hidden sm:grid grid-cols-[160px_140px_1fr_1fr] gap-4 px-4 text-xs font-black uppercase tracking-wider text-white/35 pb-2 border-b border-white/5">
              <span>Gün</span>
              <span>Durum</span>
              <span>Başlangıç</span>
              <span>Bitiş</span>
            </div>
            <div className="space-y-2.5">
              {weeklyHours.map((day) => (
                <div
                  key={day.haftaninGunu}
                  className={`grid grid-cols-1 sm:grid-cols-[160px_140px_1fr_1fr] items-center gap-3 p-3.5 rounded-2xl border transition-all ${day.isOpen ? 'bg-white/[0.02] border-white/10' : 'bg-red-500/[0.01] border-red-500/10 opacity-70'}`}
                >
                  <span className="text-sm font-black text-white">{dayLabels[day.haftaninGunu]}</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setWeeklyHours(prev => prev.map(w => w.haftaninGunu === day.haftaninGunu ? { ...w, isOpen: !w.isOpen } : w))}
                      className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:outline-none ${day.isOpen ? 'bg-emerald-500' : 'bg-white/10'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${day.isOpen ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <span className={`ml-3 text-xs font-black tracking-wide ${day.isOpen ? 'text-emerald-400' : 'text-white/30'}`}>
                      {day.isOpen ? 'AÇIK' : 'KAPALI'}
                    </span>
                  </div>
                  <input
                    type="time"
                    disabled={!day.isOpen}
                    value={day.baslangicSaati}
                    onChange={e => setWeeklyHours(prev => prev.map(w => w.haftaninGunu === day.haftaninGunu ? { ...w, baslangicSaati: e.target.value } : w))}
                    className={`${compactInputClass} text-center font-mono font-bold tracking-wider ${!day.isOpen ? 'opacity-30 cursor-not-allowed bg-transparent border-white/5' : (day.baslangicSaati >= day.bitisSaati ? 'border-red-400/60' : '')}`}
                  />
                  <input
                    type="time"
                    disabled={!day.isOpen}
                    value={day.bitisSaati}
                    onChange={e => setWeeklyHours(prev => prev.map(w => w.haftaninGunu === day.haftaninGunu ? { ...w, bitisSaati: e.target.value } : w))}
                    className={`${compactInputClass} text-center font-mono font-bold tracking-wider ${!day.isOpen ? 'opacity-30 cursor-not-allowed bg-transparent border-white/5' : (day.baslangicSaati >= day.bitisSaati ? 'border-red-400/60' : '')}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tek kaydet butonu */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3.5 text-sm font-black text-[#071018] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-lg shadow-cyan-300/10"
          >
            <Save className="h-4 w-4" />
            {selectedFacility ? 'Tesisi Kaydet' : 'Tesis Oluştur'}
          </button>
          {selectedFacility && (
            <button
              type="button"
              onClick={handleDeleteFacility}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3.5 text-sm font-bold text-red-200 hover:bg-red-500/20 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Tesisi Sil
            </button>
          )}
          <span className="text-xs font-semibold text-white/35">Tanım, kurallar ve çalışma saatleri birlikte kaydedilir.</span>
        </div>
      </form>
    </div>
  );
};
