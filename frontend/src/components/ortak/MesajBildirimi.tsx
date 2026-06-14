import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Panellerde pozitif/negatif geri bildirim bandı.
 * 5 sn sonra otomatik kapanır; sağda çarpı ile elle de kapatılabilir.
 */
interface MesajBildirimiProps {
  hata?: string | null;
  basari?: string | null;
  onKapat: () => void;
  /** Otomatik kapanma süresi (ms). Varsayılan 5000. */
  sure?: number;
}

export const MesajBildirimi = ({ hata, basari, onKapat, sure = 5000 }: MesajBildirimiProps) => {
  const mesaj = hata || basari;

  // onKapat'ı ref'te tut: inline arrow geçilse bile sayaç her render'da sıfırlanmasın
  const onKapatRef = useRef(onKapat);
  onKapatRef.current = onKapat;

  useEffect(() => {
    if (!mesaj) return;
    const zamanlayici = setTimeout(() => onKapatRef.current(), sure);
    return () => clearTimeout(zamanlayici);
  }, [mesaj, sure]);

  if (!mesaj) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
        hata
          ? 'border border-red-400/25 bg-red-500/12 text-red-100'
          : 'border border-emerald-300/25 bg-emerald-500/12 text-emerald-100'
      }`}
    >
      <span>{mesaj}</span>
      <button type="button" onClick={onKapat} className="shrink-0 text-white/50 hover:text-white transition-colors cursor-pointer">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
