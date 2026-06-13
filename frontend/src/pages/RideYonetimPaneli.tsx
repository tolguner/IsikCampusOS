import { useEffect } from 'react';
import { AlertTriangle, CarFront, Check, ShieldCheck, X } from 'lucide-react';
import { useYolculukDeposu, DOGRULAMA_ETIKETLERI, type SikayetDurumu } from '../depolar/yolculukDeposu';

export const RideYonetimPaneli = () => {
  const {
    adminDogrulamalar, sikayetler, isLoading, hata,
    adminVerileriniGetir, dogrulamaIncele, sikayetIncele,
  } = useYolculukDeposu();

  useEffect(() => {
    adminVerileriniGetir();
  }, [adminVerileriniGetir]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-500/10 text-cyan-200">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black">RideKampüs Yönetimi</h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/45">
            Sürücü/araç doğrulamalarını ve yolculuk şikayetlerini inceleyin.
          </p>
        </div>
      </div>

      {hata && <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">{hata}</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-lg font-black"><CarFront className="h-5 w-5 text-cyan-200" /> Bekleyen Doğrulamalar</h2>
            {isLoading && <span className="text-xs text-white/35">Yükleniyor...</span>}
          </div>
          <div className="space-y-3">
            {adminDogrulamalar.map(d => (
              <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{d.aracMarkaModel} · {d.plaka}</p>
                    <p className="mt-1 text-xs text-white/45">Ehliyet {d.ehliyetSinifi} · {d.aracRengi || 'renk yok'} · {DOGRULAMA_ETIKETLERI[d.durum]}</p>
                    {d.belgeUrl && <a href={d.belgeUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-cyan-200">Belgeyi aç</a>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => dogrulamaIncele(d.id, 'ONAYLANDI', 'Doğrulama onaylandı.')} className="rounded-xl bg-emerald-500/20 p-2 text-emerald-200 hover:bg-emerald-500/30" title="Onayla">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => dogrulamaIncele(d.id, 'REDDEDILDI', window.prompt('Red nedeni') || 'Eksik/uygunsuz bilgi.')} className="rounded-xl bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30" title="Reddet">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {adminDogrulamalar.length === 0 && <p className="py-10 text-center text-sm text-white/35">Bekleyen doğrulama yok.</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-lg font-black"><AlertTriangle className="h-5 w-5 text-amber-200" /> Şikayetler</h2>
          </div>
          <div className="space-y-3">
            {sikayetler.map(s => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{s.neden}</p>
                    <p className="mt-1 text-xs text-white/45">{new Date(s.olusturulmaTarihi).toLocaleString('tr-TR')} · {s.durum}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{s.aciklama}</p>
                    {s.adminNotu && <p className="mt-2 text-xs text-cyan-200/80">{s.adminNotu}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    {(['INCELEMEDE', 'COZULDU', 'YAPTIRIM_UYGULANDI', 'REDDEDILDI'] as SikayetDurumu[]).map(durum => (
                      <button key={durum} onClick={() => sikayetIncele(s.id, durum, window.prompt('Admin notu') || durum)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-white/60 hover:bg-white/10">
                        {durum}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {sikayetler.length === 0 && <p className="py-10 text-center text-sm text-white/35">Şikayet yok.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};
