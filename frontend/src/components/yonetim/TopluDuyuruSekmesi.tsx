import { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { api } from '../../lib/api';
import { Anahtar } from '../ortak/Anahtar';
import { MesajBildirimi } from '../ortak/MesajBildirimi';

const inputClass = 'w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60';

const KITLELER: { anahtar: string; etiket: string; aciklama: string }[] = [
  { anahtar: 'TUM_OGRENCILER', etiket: 'Tüm öğrenciler', aciklama: 'Kampüsteki tüm öğrencilere iletilir.' },
  { anahtar: 'ISLETME_YONETICILERI', etiket: 'Tüm işletme yöneticileri', aciklama: 'UniEats işletme yöneticilerine iletilir.' },
  { anahtar: 'ISLETME_PERSONELLERI', etiket: 'Tüm işletme personelleri', aciklama: 'İşletme personel hesaplarına iletilir.' },
];

export const TopluDuyuruSekmesi = () => {
  const [baslik, setBaslik] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [secili, setSecili] = useState<Record<string, boolean>>({});
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);

  const kitleSec = (anahtar: string, v: boolean) => setSecili(prev => ({ ...prev, [anahtar]: v }));
  const seciliKitleler = KITLELER.filter(k => secili[k.anahtar]).map(k => k.anahtar);
  const gecerli = baslik.trim() && mesaj.trim() && seciliKitleler.length > 0;

  const gonder = async () => {
    if (!gecerli) return;
    setGonderiliyor(true); setHata(null); setBasari(null);
    try {
      const res = await api.post<{ mesaj: string }>('/bildirimler/destek-duyuru', {
        baslik: baslik.trim(),
        mesaj: mesaj.trim(),
        hedefKitleler: seciliKitleler,
      });
      setBasari(res.data?.mesaj || 'Duyuru gönderildi.');
      setBaslik(''); setMesaj(''); setSecili({});
    } catch (err: any) {
      setHata(err?.response?.data?.message || 'Duyuru gönderilemedi.');
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <MesajBildirimi hata={hata} basari={basari} onKapat={() => { setHata(null); setBasari(null); }} />

      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-purple-300/25 bg-purple-500/10 text-purple-200">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Toplu Duyuru</h2>
            <p className="text-xs font-semibold text-white/40">Birden çok hedef kitle seçerek kurumsal duyuru gönderin.</p>
          </div>
        </div>

        <input className={inputClass} placeholder="Duyuru başlığı" value={baslik} onChange={e => setBaslik(e.target.value)} />
        <textarea className={`${inputClass} min-h-32 resize-none`} placeholder="Duyuru metni" value={mesaj} onChange={e => setMesaj(e.target.value)} />

        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">Hedef kitle(ler)</p>
          {KITLELER.map(k => (
            <div key={k.anahtar} className="rounded-2xl border border-white/10 bg-[#111123] px-4 py-3.5">
              <Anahtar acik={!!secili[k.anahtar]} onChange={v => kitleSec(k.anahtar, v)} baslik={k.etiket} aciklama={k.aciklama} ton="purple" />
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={!gecerli || gonderiliyor}
          onClick={gonder}
          className="inline-flex items-center gap-2 rounded-2xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 text-sm font-black text-white cursor-pointer"
        >
          <Send className="h-4 w-4" />
          {gonderiliyor ? 'Gönderiliyor...' : `Duyuruyu Gönder${seciliKitleler.length ? ` (${seciliKitleler.length} kitle)` : ''}`}
        </button>
      </section>
    </div>
  );
};
