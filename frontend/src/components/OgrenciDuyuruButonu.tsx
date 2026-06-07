import { Link } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { YOLLAR } from '../yardimcilar/yollar';

/**
 * İdari panellerin başlığında "Öğrencilere Duyuru" eylem butonu.
 * Tıklayınca ayrı bir duyuru sayfasına (form + canlı önizleme + görsel) yönlendirir.
 */
export const OgrenciDuyuruButonu = () => (
  <Link
    to={YOLLAR.duyuru}
    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-pink-400/25 bg-pink-500/10 px-4 py-3 text-sm font-bold text-pink-100 transition hover:bg-pink-500/20 cursor-pointer"
  >
    <Megaphone className="h-4 w-4" />
    Öğrencilere Duyuru
  </Link>
);
