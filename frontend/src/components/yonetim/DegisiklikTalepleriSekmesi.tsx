import { useEffect, useMemo } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useAdminSaticiDeposu, type SaticiDegisiklikTalebi } from '../../depolar/adminSaticiDeposu';

const ALAN_ETIKET: Record<string, string> = {
  ad: 'İşletme Adı', aciklama: 'Açıklama', konumMetni: 'Konum', logoUrl: 'Logo', kapakGorselUrl: 'Kapak Görseli', mutfakTuru: 'Mutfak Türü',
};
const gorselAlan = (a: string) => a === 'logoUrl' || a === 'kapakGorselUrl';

/** İşletmelerin genel bilgi değişikliği talepleri — grup (tek gönderim) bazında onay/revize. */
export const DegisiklikTalepleriSekmesi = () => {
  const { talepler, talepleriGetir, talepGrupOnayla, talepGrupRevize, talepOnayla, talepRevize } = useAdminSaticiDeposu();

  useEffect(() => { talepleriGetir(); }, [talepleriGetir]);

  const talepGruplari = useMemo(() => {
    const harita = new Map<string, { grupId?: string; saticiAdi: string; kalemler: SaticiDegisiklikTalebi[] }>();
    talepler.forEach(t => {
      const anahtar = t.grupId || t.id;
      if (!harita.has(anahtar)) harita.set(anahtar, { grupId: t.grupId, saticiAdi: t.saticiAdi, kalemler: [] });
      harita.get(anahtar)!.kalemler.push(t);
    });
    return Array.from(harita.values());
  }, [talepler]);

  const grupOnayla = (g: { grupId?: string; kalemler: SaticiDegisiklikTalebi[] }) =>
    g.grupId ? talepGrupOnayla(g.grupId) : talepOnayla(g.kalemler[0].id);
  const grupRevize = (g: { grupId?: string; kalemler: SaticiDegisiklikTalebi[] }, geri: string) =>
    g.grupId ? talepGrupRevize(g.grupId, geri) : talepRevize(g.kalemler[0].id, geri);

  if (talepGruplari.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center">
        <ClipboardCheck className="mx-auto h-8 w-8 text-white/20" />
        <p className="mt-3 text-sm text-white/40">Bekleyen bilgi değişikliği talebi yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/45">{talepGruplari.length} bekleyen talep</p>
      {talepGruplari.map((grup, gi) => (
        <div key={grup.grupId || grup.kalemler[0].id || gi} className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-4 flex flex-wrap items-start gap-3 justify-between">
          <div className="min-w-0 text-sm space-y-1.5">
            <p className="font-bold text-white">{grup.saticiAdi} <span className="text-white/40 font-normal">· {grup.kalemler.length} alan</span></p>
            {grup.kalemler.map(t => (
              <div key={t.id} className="text-xs text-white/45">
                <span className="font-semibold text-white/60">{ALAN_ETIKET[t.alanAdi] || t.alanAdi}:</span>{' '}
                {gorselAlan(t.alanAdi) ? (
                  <span className="inline-flex items-center gap-2 align-middle">
                    {t.mevcutDeger ? <img src={t.mevcutDeger} className="h-8 w-8 rounded object-cover border border-white/10" /> : '—'}
                    <span>→</span><img src={t.talepEdilenDeger} className="h-8 w-8 rounded object-cover border border-emerald-400/30" />
                  </span>
                ) : (
                  <span><span className="text-white/35 line-through">{t.mevcutDeger || '—'}</span> → <span className="text-emerald-200">{t.talepEdilenDeger || '—'}</span></span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => grupOnayla(grup)} className="px-3 py-2 rounded-xl text-xs font-black text-white bg-emerald-500/80 hover:bg-emerald-500 cursor-pointer">Tümünü Onayla</button>
            <button onClick={() => { const g = window.prompt('Revize gerekçesi (işletmeye iletilecek):'); if (g != null) grupRevize(grup, g); }} className="px-3 py-2 rounded-xl text-xs font-black text-amber-100 bg-amber-500/15 border border-amber-400/25 hover:bg-amber-500/25 cursor-pointer">Revize İste</button>
          </div>
        </div>
      ))}
    </div>
  );
};
