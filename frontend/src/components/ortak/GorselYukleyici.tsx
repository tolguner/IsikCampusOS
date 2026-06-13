import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface GorselYukleyiciProps {
  /** Mevcut görsel (data URL veya http URL). */
  value?: string | null;
  /** Yeni görsel seçilince base64 data URL döner; kaldırılınca boş string. */
  onChange: (dataUrl: string) => void;
  /** Önizleme oranı sınıfı (örn. "aspect-square", "aspect-[3/1]"). */
  oranSinifi?: string;
  etiket?: string;
  /** Maksimum kenar (px) — büyük görseller bu boyuta küçültülür. */
  maksKenar?: number;
}

const MAKS_DOSYA_BAYT = 5 * 1024 * 1024; // 5 MB ham dosya sınırı

/**
 * Tıkla-seç + sürükle-bırak görsel yükleme. Görseli istemci tarafında küçültüp JPEG
 * base64 data URL'e çevirir; mevcut TEXT alanlarına (gorselUrl/logoUrl/kapakGorselUrl)
 * doğrudan yazılır — backend değişikliği gerektirmez (profil avatarı ile aynı kalıp).
 */
export const GorselYukleyici = ({
  value, onChange, oranSinifi = 'aspect-video', etiket, maksKenar = 900,
}: GorselYukleyiciProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [surukleniyor, setSurukleniyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const dosyaIsle = (dosya?: File | null) => {
    setHata(null);
    if (!dosya) return;
    if (!dosya.type.startsWith('image/')) { setHata('Lütfen bir görsel dosyası seçin.'); return; }
    if (dosya.size > MAKS_DOSYA_BAYT) { setHata('Dosya çok büyük (en fazla 5 MB).'); return; }

    setYukleniyor(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const olcek = Math.min(1, maksKenar / Math.max(img.width, img.height));
          const w = Math.round(img.width * olcek);
          const h = Math.round(img.height * olcek);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('canvas');
          ctx.drawImage(img, 0, 0, w, h);
          // Şeffaflık içerebilecek PNG'leri korumak için png, gerisini jpeg olarak küçült.
          const png = dosya.type === 'image/png';
          const dataUrl = canvas.toDataURL(png ? 'image/png' : 'image/jpeg', 0.82);
          onChange(dataUrl);
        } catch {
          // Küçültme başarısızsa ham data URL'i kullan.
          onChange(reader.result as string);
        } finally {
          setYukleniyor(false);
        }
      };
      img.onerror = () => { onChange(reader.result as string); setYukleniyor(false); };
      img.src = reader.result as string;
    };
    reader.onerror = () => { setHata('Dosya okunamadı.'); setYukleniyor(false); };
    reader.readAsDataURL(dosya);
  };

  return (
    <div>
      {etiket && <p className="text-xs font-bold text-white/50 mb-1.5">{etiket}</p>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setSurukleniyor(true); }}
        onDragLeave={() => setSurukleniyor(false)}
        onDrop={e => { e.preventDefault(); setSurukleniyor(false); dosyaIsle(e.dataTransfer.files?.[0]); }}
        className={`relative ${oranSinifi} w-full rounded-xl overflow-hidden cursor-pointer border-2 border-dashed transition-colors flex items-center justify-center text-center
          ${surukleniyor ? 'border-orange-400/70 bg-orange-500/10' : 'border-white/15 bg-white/[0.03] hover:border-white/30'}`}
      >
        {value ? (
          <>
            <img src={value} alt="Önizleme" className="absolute inset-0 w-full h-full object-cover" />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(''); setHata(null); }}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 text-white/90 hover:bg-black/70"
              title="Görseli kaldır"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="px-4 py-6 text-white/45">
            {yukleniyor ? <Loader2 className="w-6 h-6 mx-auto animate-spin" /> : <ImagePlus className="w-6 h-6 mx-auto mb-1.5" />}
            <p className="text-xs font-semibold">{yukleniyor ? 'İşleniyor...' : 'Görsel sürükleyin ya da seçmek için tıklayın'}</p>
            <p className="text-[10px] text-white/30 mt-0.5">PNG/JPG · en fazla 5 MB</p>
          </div>
        )}
      </div>
      {hata && <p className="text-[11px] text-red-300/80 mt-1.5">{hata}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { dosyaIsle(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
};
