import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Car, Check, ShieldCheck, X, User, Phone, Mail, IdCard, CalendarDays } from 'lucide-react';
import { useYolculukDeposu, DOGRULAMA_ETIKETLERI, ARAC_ETIKETLERI, type SikayetDurumu, type SurucuDogrulama, type Arac } from '../depolar/yolculukDeposu';
import { ModulSekmeleri } from '../components/yonetim/ModulSekmeleri';

const tarihFmt = (t?: string) => (t ? new Date(t).toLocaleDateString('tr-TR') : '—');

/** Başvuran kimlik şeridi — kim başvurdu (ad-soyad · öğrenci no · iletişim). */
const Basvuran = ({ b }: { b: { basvuranAdSoyad?: string; basvuranOgrenciNo?: string; basvuranTelefon?: string; basvuranEposta?: string } }) => (
  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/70">
    <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-cyan-300/70" /> {b.basvuranAdSoyad || 'Bilinmiyor'}</span>
    {b.basvuranOgrenciNo && <span className="inline-flex items-center gap-1.5 text-white/45"><IdCard className="h-3.5 w-3.5" /> {b.basvuranOgrenciNo}</span>}
    {b.basvuranTelefon && <span className="inline-flex items-center gap-1.5 text-white/45"><Phone className="h-3.5 w-3.5" /> {b.basvuranTelefon}</span>}
    {b.basvuranEposta && <span className="inline-flex items-center gap-1.5 text-white/45"><Mail className="h-3.5 w-3.5" /> {b.basvuranEposta}</span>}
  </div>
);

export const RideYonetimPaneli = () => {
  const {
    adminDogrulamalar, bekleyenAraclar, sikayetler, isLoading, hata,
    adminVerileriniGetir, dogrulamaIncele, aracIncele, sikayetIncele,
  } = useYolculukDeposu();

  const [sekme, setSekme] = useState<'ehliyet' | 'arac' | 'sikayet'>('ehliyet');

  useEffect(() => { adminVerileriniGetir(); }, [adminVerileriniGetir]);

  const acikSikayet = useMemo(() => sikayetler.filter(s => s.durum === 'ACIK' || s.durum === 'INCELEMEDE').length, [sikayetler]);
  const aracBaslik = (a: Arac) => [a.marka, a.model].filter(Boolean).join(' ') || a.markaModel;

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-500/10 text-cyan-200">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black">Yapı, Destek ve Ulaşım Hizmetleri Müdürlüğü</h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/45">
            Ehliyet doğrulamalarını, araç onaylarını ve yolculuk şikayetlerini inceleyin.
          </p>
        </div>
      </div>

      <ModulSekmeleri
        aktif={sekme}
        onSecim={setSekme}
        sekmeler={[
          { anahtar: 'ehliyet', baslik: 'Ehliyet Doğrulamaları', aciklama: 'Onay bekleyen sürücü ehliyetleri', ikon: ShieldCheck, rozet: adminDogrulamalar.length },
          { anahtar: 'arac', baslik: 'Araç Onayları', aciklama: 'Onay bekleyen araç başvuruları', ikon: Car, rozet: bekleyenAraclar.length },
          { anahtar: 'sikayet', baslik: 'Şikayetler', aciklama: 'Yolculuk şikayet kayıtları', ikon: AlertTriangle, rozet: acikSikayet },
        ]}
      />

      {hata && <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">{hata}</div>}

      {/* Ehliyet doğrulamaları */}
      {sekme === 'ehliyet' && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          {isLoading && <span className="text-xs text-white/35">Yükleniyor...</span>}
          {(adminDogrulamalar as SurucuDogrulama[]).map(d => (
            <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <Basvuran b={d} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-black text-white">Ehliyet sınıfı: {d.ehliyetSinifi}{d.ehliyetNo ? ` · No: ${d.ehliyetNo}` : ''}</p>
                  {d.ehliyetSahibiAdSoyad && <p className="text-xs text-white/55">Sahip: {d.ehliyetSahibiAdSoyad}</p>}
                  <p className="text-xs text-white/45 inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Veriliş: {tarihFmt(d.verilisTarihi)} · Geçerlilik: {tarihFmt(d.gecerlilikTarihi)}</p>
                  <p className="text-[11px] text-white/35">{DOGRULAMA_ETIKETLERI[d.durum]}</p>
                  {d.belgeUrl
                    ? <a href={d.belgeUrl} target="_blank" rel="noreferrer"><img src={d.belgeUrl} alt="Ehliyet belgesi" className="mt-2 h-28 w-44 rounded-xl border border-white/10 object-cover" /></a>
                    : <p className="mt-2 text-xs text-amber-200/70">Belge fotoğrafı yok</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => dogrulamaIncele(d.id, 'ONAYLANDI', 'Ehliyet onaylandı.')} className="rounded-xl bg-emerald-500/20 p-2 text-emerald-200 hover:bg-emerald-500/30" title="Onayla"><Check className="h-4 w-4" /></button>
                  <button onClick={() => dogrulamaIncele(d.id, 'REDDEDILDI', window.prompt('Red nedeni') || 'Eksik/uygunsuz belge.')} className="rounded-xl bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30" title="Reddet"><X className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {adminDogrulamalar.length === 0 && <p className="py-10 text-center text-sm text-white/35">Bekleyen ehliyet doğrulaması yok.</p>}
        </section>
      )}

      {/* Araç onayları */}
      {sekme === 'arac' && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          {bekleyenAraclar.map(a => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <Basvuran b={a} />
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  {a.gorselUrl && <a href={a.gorselUrl} target="_blank" rel="noreferrer"><img src={a.gorselUrl} alt={aracBaslik(a)} className="h-24 w-32 shrink-0 rounded-xl border border-white/10 object-cover" /></a>}
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-black text-white">{aracBaslik(a)}{a.modelYili ? ` (${a.modelYili})` : ''}</p>
                    <p className="text-xs text-white/55">{a.plaka}{a.aracTipi ? ` · ${a.aracTipi}` : ''}{a.renk ? ` · ${a.renk}` : ''}{a.koltukKapasitesi ? ` · ${a.koltukKapasitesi} koltuk` : ''}</p>
                    <p className="text-[11px] text-white/35">{ARAC_ETIKETLERI[a.durum]}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => aracIncele(a.id, 'ONAYLANDI', 'Araç onaylandı.')} className="rounded-xl bg-emerald-500/20 p-2 text-emerald-200 hover:bg-emerald-500/30" title="Onayla"><Check className="h-4 w-4" /></button>
                  <button onClick={() => aracIncele(a.id, 'REDDEDILDI', window.prompt('Red nedeni') || 'Eksik/uygunsuz araç bilgisi.')} className="rounded-xl bg-red-500/20 p-2 text-red-200 hover:bg-red-500/30" title="Reddet"><X className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {bekleyenAraclar.length === 0 && <p className="py-10 text-center text-sm text-white/35">Bekleyen araç onayı yok.</p>}
        </section>
      )}

      {/* Şikayetler */}
      {sekme === 'sikayet' && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          {sikayetler.map(s => (
            <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">{s.neden}</p>
                  <p className="mt-1 text-xs font-bold text-white/55">
                    Şikayetçi: {s.sikayetciAdSoyad || s.sikayetciKullaniciId}{s.sikayetciOgrenciNo ? ` (${s.sikayetciOgrenciNo})` : ''}
                    {' → '}Hedef: {s.hedefAdSoyad || s.hedefKullaniciId}
                  </p>
                  <p className="mt-1 text-xs text-white/40">{new Date(s.olusturulmaTarihi).toLocaleString('tr-TR')} · {s.durum}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{s.aciklama}</p>
                  {s.adminNotu && <p className="mt-2 text-xs text-cyan-200/80">{s.adminNotu}</p>}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {(['INCELEMEDE', 'COZULDU', 'YAPTIRIM_UYGULANDI', 'REDDEDILDI'] as SikayetDurumu[]).map(durum => (
                    <button key={durum} onClick={() => sikayetIncele(s.id, durum, window.prompt('Admin notu') || durum)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-white/60 hover:bg-white/10">{durum}</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {sikayetler.length === 0 && <p className="py-10 text-center text-sm text-white/35">Şikayet yok.</p>}
        </section>
      )}
    </div>
  );
};
