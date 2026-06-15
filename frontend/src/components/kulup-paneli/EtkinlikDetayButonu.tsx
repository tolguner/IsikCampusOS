import { Link } from 'react-router-dom';
import { YOLLAR } from '../../yardimcilar/yollar';

/** Etkinlik yönetim sayfasına giden ortak "Detaylar" bağlantısı. */
export const EtkinlikDetayButonu = ({ etkinlikId, tamGenislik = false }: { etkinlikId: string; tamGenislik?: boolean }) => (
  <Link
    to={YOLLAR.kulupEtkinlikYonetimi(etkinlikId)}
    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-cyan-100 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/15 transition-colors ${tamGenislik ? 'w-full' : ''}`}
  >
    Detaylar
  </Link>
);
