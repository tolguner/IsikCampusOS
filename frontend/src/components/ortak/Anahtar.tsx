interface AnahtarProps {
  acik: boolean;
  onChange: (acik: boolean) => void;
  baslik: string;
  aciklama?: string;
  /** Aktif renk tonu (varsayılan cyan) */
  ton?: 'cyan' | 'emerald' | 'purple';
}

const TON: Record<NonNullable<AnahtarProps['ton']>, string> = {
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
};

/** Modern aç/kapa anahtarı: solda başlık (+açıklama), sağda kayan toggle. */
export const Anahtar = ({ acik, onChange, baslik, aciklama, ton = 'cyan' }: AnahtarProps) => (
  <button
    type="button"
    onClick={() => onChange(!acik)}
    className="flex w-full items-center justify-between gap-3 text-left cursor-pointer"
  >
    <span className="min-w-0">
      <span className="block text-sm font-bold text-white/85">{baslik}</span>
      {aciklama && <span className="mt-0.5 block text-xs font-medium text-white/40">{aciklama}</span>}
    </span>
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${acik ? TON[ton] : 'bg-white/15'}`}
    >
      <span
        className={`pointer-events-none mt-0.5 ml-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${acik ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </span>
  </button>
);
