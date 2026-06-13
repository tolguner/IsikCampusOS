import React from 'react';
import type { Tesis, TesisKaynagi, TesisPolitikasi } from '../../depolar/tesisDeposu';
import type { Rezervasyon } from '../../depolar/rezervasyonDeposu';

export const panelStyle = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
};

export const inputClass = 'w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60 transition-all';
export const compactInputClass = 'w-full rounded-xl bg-[#111123] border border-white/10 px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60 transition-all';

export const facilityTypes = [
  { value: 'SPORTS_AREA', label: 'Spor Alanı / Salon' },
  { value: 'STUDY_ROOM', label: 'Etüt / Çalışma Alanı' },
  { value: 'MEETING_ROOM', label: 'Toplantı Odası' },
  { value: 'LAB', label: 'Laboratuvar' },
  { value: 'OTHER', label: 'Diğer' },
];

export const dayLabels: Record<number, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar',
};

export const blankFacilityForm = {
  ad: '',
  tesisTuru: 'SPORTS_AREA',
  aciklama: '',
  konumMetni: '',
  kapasite: 10,
  durum: 'AKTIF' as Tesis['durum'],
};

export type TesisFormState = typeof blankFacilityForm;

export const defaultPolicy: TesisPolitikasi = {
  rezervasyonPenceresiGun: 14,
  minimumBildirimDakika: 120,
  iptalLimitDakika: 60,
  yoklamaZorunlu: true,
  otomatikGelmemeDakika: 15,
  maksimumRezervasyonSureDakika: 120,
};

export interface WeeklyHourDay {
  haftaninGunu: number;
  isOpen: boolean;
  baslangicSaati: string;
  bitisSaati: string;
}

export const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3">
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-white/38">{subtitle}</p>
    </div>
  </div>
);

export const StatusBadge = ({ durum }: { durum: Tesis['durum'] | TesisKaynagi['durum'] }) => {
  const active = durum === 'AKTIF';
  return (
    <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black bg-emerald-400/15 text-emerald-100">
      {active ? 'Aktif' : 'Pasif'}
    </span>
  );
};

export const BookingStatusBadge = ({ durum }: { durum: Rezervasyon['durum'] }) => {
  const colors: Record<Rezervasyon['durum'], string> = {
    TASLAK: 'bg-white/5 text-white/50 border border-white/10',
    BEKLEMEDE: 'bg-amber-400/10 text-amber-200 border border-amber-400/20',
    ONAYLANDI: 'bg-cyan-400/10 text-cyan-200 border border-cyan-400/20',
    IPTAL_EDILDI: 'bg-red-500/10 text-red-200 border border-red-500/20',
    TAMAMLANDI: 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20',
    GELMEDI: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    BLOKE: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
  };

  const labels: Record<Rezervasyon['durum'], string> = {
    TASLAK: 'Taslak',
    BEKLEMEDE: 'Onay Bekliyor',
    ONAYLANDI: 'Onaylandı',
    IPTAL_EDILDI: 'İptal Edildi',
    TAMAMLANDI: 'Kullanıldı',
    GELMEDI: 'Gelmedi',
    BLOKE: 'Takım Antrenmanı',
  };

  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${colors[durum]}`}>
      {labels[durum]}
    </span>
  );
};

export const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <label className="block font-sans">
    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">{label}</span>
    <input className="w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60 transition-all" type="number" min={0} value={value} onChange={event => onChange(Number(event.target.value))} />
  </label>
);
