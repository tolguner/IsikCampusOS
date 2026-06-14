import { useEffect } from 'react';
import { AlertTriangle, Car, Check, ShieldCheck, X } from 'lucide-react';
import { useYolculukDeposu, DOGRULAMA_ETIKETLERI, ARAC_ETIKETLERI, type SikayetDurumu } from '../depolar/yolculukDeposu';

export const RideYonetimPaneli = () => {
  const {
    adminDogrulamalar, bekleyenAraclar, sikayetler, isLoading, hata,
    adminVerileriniGetir, dogrulamaIncele, aracIncele, sikayetIncele,
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
            Ehliyet doğrulamalarını, araç onaylarını ve yolculuk şikayetlerini inceleyin.
          </p>
        </div>
      </div>

      {hata && <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">{hata}</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Ehliyet doğrulamaları */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-lg font-black"><ShieldCheck className="h-5 w-5 text-cyan-200" /> Bekleyen Ehliyetler</h2>
            {isLoading && <span className="text-xs text-white/35">Yükleniyor...</span>}
          </div>
          <div className="space-y-3">
            {adminDogrulamalar.map(d => (
              <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">Ehliyet sınıfı: {d.ehliyetSinifi}</p>
                    <p className="mt-1 text-xs text-white/45">{DOGRULAMA_ETIKETLERI[d.durum]}</p>
                    {d.belgeUrl
                      ? <a href={d.belgeUrl} target="_blank" rel="noreferrer"><img src={d.belgeUrl} alt="Ehliyet belgesi" className="mt-2 h-28 w-44 rounded-xl border border-white/10 object-cover" /></a>
                      : <p className="mt-2 text-xs text-amber-200/70">Belge fotoğrafı yok</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => dogrulamaIncele(d.id, 'ONAYLANDI', 'Ehliyet onaylandı.')} className="rounded-xl bg-emerald-500/20 p-2 text-emerald-200 hover:bg-emerald-500/30" title="Onayla">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => dogrulamaIncele(d.id, 'REDDEDILDI', window.prompt('Red nedeni') || 'Eksik/uygunsuz belge.')} className="rounded-xl bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30" title="Reddet">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {adminDogrulamalar.length === 0 && <p className="py-10 text-center text-sm text-white/35">Bekleyen ehliyet doğrulaması yok.</p>}
          </div>
        </section>

        {/* Araç onayları */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-lg font-black"><Car className="h-5 w-5 text-cyan-200" /> Bekleyen Araçlar</h2>
          </div>
          <div className="space-y-3">
            {bekleyenAraclar.map(a => (
              <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    {a.gorselUrl && <a href={a.gorselUrl} target="_blank" rel="noreferrer"><img src={a.gorselUrl} alt={a.markaModel} className="h-20 w-28 shrink-0 rounded-xl border border-white/10 object-cover" /></a>}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{a.markaModel}</p>
                      <p className="mt-1 text-xs text-white/45">{a.plaka}{a.renk ? ` · ${a.renk}` : ''}{a.koltukKapasitesi ? ` · ${a.koltukKapasitesi} koltuk` : ''}</p>
                      <p className="mt-1 text-[11px] text-white/35">{ARAC_ETIKETLERI[a.durum]}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => aracIncele(a.id, 'ONAYLANDI', 'Araç onaylandı.')} className="rounded-xl bg-emerald-500/20 p-2 text-emerald-200 hover:bg-emerald-500/30" title="Onayla">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => aracIncele(a.id, 'REDDEDILDI', window.prompt('Red nedeni') || 'Eksik/uygunsuz araç bilgisi.')} className="rounded-xl bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30" title="Reddet">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {bekleyenAraclar.length === 0 && <p className="py-10 text-center text-sm text-white/35">Bekleyen araç onayı yok.</p>}
          </div>
        </section>

        {/* Şikayetler */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
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
