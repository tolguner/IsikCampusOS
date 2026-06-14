import type { ElementType } from 'react';
import { motion } from 'framer-motion';

/**
 * Yönetim panellerinde ortak kullanılan modül/sekme seçici.
 * Kart-buton ızgarası: ikon + başlık + açıklama (+ opsiyonel sayaç rozeti).
 * Tüm rol panellerinde aynı arayüz ve düzeni sağlamak için tek kaynak.
 */
export interface ModulSekmesi<K extends string> {
  anahtar: K;
  baslik: string;
  aciklama: string;
  ikon: ElementType;
  /** > 0 ise sağ üstte kırmızı sayaç rozeti gösterilir */
  rozet?: number;
}

interface ModulSekmeleriProps<K extends string> {
  sekmeler: ModulSekmesi<K>[];
  aktif: K;
  onSecim: (anahtar: K) => void;
  /** lg kırılımındaki kolon sayısı; varsayılan sekme sayısı (en çok 6) */
  kolon?: number;
}

const LG_KOLON: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

export function ModulSekmeleri<K extends string>({ sekmeler, aktif, onSecim, kolon }: ModulSekmeleriProps<K>) {
  const kolonSayisi = Math.min(kolon ?? sekmeler.length, 6);
  const lgClass = LG_KOLON[kolonSayisi] ?? 'lg:grid-cols-5';
  return (
    <nav className={`grid grid-cols-2 sm:grid-cols-3 ${lgClass} gap-3 pb-1`}>
      {sekmeler.map(sekme => {
        const Ikon = sekme.ikon;
        const secili = aktif === sekme.anahtar;
        return (
          <button
            key={sekme.anahtar}
            type="button"
            onClick={() => onSecim(sekme.anahtar)}
            className={`relative h-20 rounded-3xl p-3.5 text-left border transition-colors overflow-hidden ${secili ? 'bg-purple-500/15 border-purple-400/35' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${secili ? 'bg-purple-500/20 border-purple-300/30 text-purple-100' : 'bg-white/[0.04] border-white/10 text-white/55'}`}>
                <Ikon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-white truncate">{sekme.baslik}</div>
                <div className="text-xs text-white/40 mt-1 leading-snug line-clamp-2">{sekme.aciklama}</div>
              </div>
            </div>

            {sekme.rozet != null && sekme.rozet > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute top-2 right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white border border-red-400/25 shadow-lg shadow-red-500/35"
              >
                {sekme.rozet}
              </motion.span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
