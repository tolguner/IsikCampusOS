import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle, CalendarClock, CarFront, Check, Clock, CreditCard, Flag,
  MapPin, Plus, Search, ShieldCheck, Star, Users, X,
} from 'lucide-react';
import {
  DOGRULAMA_ETIKETLERI,
  TALEP_ETIKETLERI,
  useYolculukDeposu,
  type Nokta,
  type OdemeYontemi,
  type RotaDuragi,
  type UcretTipi,
  type YolculukIlani,
} from '../depolar/yolculukDeposu';

const NOKTALAR: Nokta[] = [
  { ad: 'Şile Kampüs', enlem: 41.1762, boylam: 29.6128 },
  { ad: 'Çekmeköy Metro', enlem: 41.0331, boylam: 29.1767 },
  { ad: 'Üsküdar', enlem: 41.0275, boylam: 29.0153 },
  { ad: 'Kadıköy', enlem: 40.9909, boylam: 29.0254 },
  { ad: 'Ataşehir', enlem: 40.9929, boylam: 29.1244 },
  { ad: 'Maslak', enlem: 41.1122, boylam: 29.0219 },
];

const bugun = () => new Date().toISOString().slice(0, 10);
const tarihSaatVarsayilan = () => `${bugun()}T08:30`;
const para = (tutar?: number) => !tutar ? 'Ücretsiz' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tutar);
const noktaBul = (ad: string) => NOKTALAR.find(n => n.ad === ad) ?? NOKTALAR[0];

export const CampusRideSayfasi = () => {
  const {
    ilanlar, benimIlanlarim, taleplerim, surucuTalepleri, dogrulama,
    isLoading, hata, basariMesaji,
    ilanAra, ilanOlustur, benimVerilerimiGetir, dogrulamaBasvur,
    ilanaKatil, talepKabul, talepRed, talepIptal, talepTamamla, puanla, sikayetEt, temizleMesajlar,
  } = useYolculukDeposu();

  const [tarih, setTarih] = useState(bugun());
  const [baslangic, setBaslangic] = useState('Şile Kampüs');
  const [varis, setVaris] = useState('Kadıköy');
  const [aktifSekme, setAktifSekme] = useState<'ara' | 'surucu' | 'benim'>('ara');
  const [form, setForm] = useState({
    baslangic: 'Şile Kampüs',
    varis: 'Kadıköy',
    kalkisZamani: tarihSaatVarsayilan(),
    koltukSayisi: 3,
    ucretTipi: 'UCRETLI' as UcretTipi,
    odemeYontemi: 'NAKIT_VEYA_IBAN' as OdemeYontemi,
    kisiBasiUcret: 80,
    iban: '',
    aciklama: '',
    araDurakKabulEdilir: true,
    tahminiToplamDakika: 85,
    tahminiMesafeKm: 72,
  });
  const [araDuraklar, setAraDuraklar] = useState<RotaDuragi[]>([
    { ad: 'Çekmeköy Metro', enlem: 41.0331, boylam: 29.1767, tahminiDakika: 35 },
    { ad: 'Üsküdar', enlem: 41.0275, boylam: 29.0153, tahminiDakika: 65 },
  ]);
  const [dogrulamaForm, setDogrulamaForm] = useState({
    ehliyetSinifi: 'B',
    aracMarkaModel: '',
    plaka: '',
    aracRengi: '',
    koltukKapasitesi: 4,
    belgeUrl: '',
  });

  useEffect(() => {
    benimVerilerimiGetir();
  }, [benimVerilerimiGetir]);

  useEffect(() => {
    const b = noktaBul(baslangic);
    const v = noktaBul(varis);
    ilanAra({
      tarih,
      baslangic,
      baslangicEnlem: b.enlem,
      baslangicBoylam: b.boylam,
      varis,
      varisEnlem: v.enlem,
      varisBoylam: v.boylam,
    });
  }, [baslangic, ilanAra, tarih, varis]);

  useEffect(() => () => temizleMesajlar(), [temizleMesajlar]);

  const dogrulandi = dogrulama?.durum === 'ONAYLANDI';
  const rotaNoktalari = useMemo(() => [
    noktaBul(form.baslangic),
    ...araDuraklar,
    noktaBul(form.varis),
  ], [araDuraklar, form.baslangic, form.varis]);

  const ilanKaydet = async () => {
    await ilanOlustur({
      baslangic: noktaBul(form.baslangic),
      varis: noktaBul(form.varis),
      kalkisZamani: form.kalkisZamani,
      koltukSayisi: form.koltukSayisi,
      ucretTipi: form.ucretTipi,
      odemeYontemi: form.ucretTipi === 'UCRETSIZ' ? 'YOK' : form.odemeYontemi,
      kisiBasiUcret: form.ucretTipi === 'UCRETSIZ' ? 0 : form.kisiBasiUcret,
      iban: form.iban,
      aciklama: form.aciklama,
      araDurakKabulEdilir: form.araDurakKabulEdilir,
      tahminiToplamDakika: form.tahminiToplamDakika,
      tahminiMesafeKm: form.tahminiMesafeKm,
      duraklar: araDuraklar,
    });
  };

  const basvur = async (ilan: YolculukIlani) => {
    const binis = noktaBul(baslangic);
    const inis = noktaBul(varis);
    await ilanaKatil(ilan.id, binis, inis, `${binis.ad} - ${inis.ad} arası katılmak istiyorum.`);
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-500/10 text-cyan-200">
            <CarFront className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-normal">CampusRide</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/45">
              Doğrulanmış öğrencilerle haritalı rota, ara durak ve ücret bilgisi üzerinden paylaşımlı yolculuk planlayın.
            </p>
          </div>
        </div>
        <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {[
            ['ara', 'Yolculuk Bul'],
            ['surucu', 'Sürücü Ol'],
            ['benim', 'Benim Akışım'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setAktifSekme(key as any)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${aktifSekme === key ? 'bg-cyan-500/20 text-cyan-100' : 'text-white/45 hover:text-white/75'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(hata || basariMesaji) && (
        <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold ${hata ? 'border-red-400/25 bg-red-500/10 text-red-100' : 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100'}`}>
          <span>{hata || basariMesaji}</span>
          <button onClick={temizleMesajlar} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      )}

      {aktifSekme === 'ara' && (
        <section className="space-y-5">
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_1fr_180px_auto]">
            <Secim label="Nereden?" value={baslangic} onChange={setBaslangic} />
            <Secim label="Nereye?" value={varis} onChange={setVaris} />
            <div>
              <label className="mb-1 block text-xs font-bold text-white/45">Tarih</label>
              <input value={tarih} onChange={e => setTarih(e.target.value)} type="date" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none" />
            </div>
            <button onClick={() => ilanAra({ tarih, baslangic, varis })} className="inline-flex items-end justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-white">
              <Search className="h-4 w-4" /> Ara
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {ilanlar.map(ilan => (
              <IlanKarti key={ilan.id} ilan={ilan} onBasvur={() => basvur(ilan)} />
            ))}
            {!isLoading && ilanlar.length === 0 && (
              <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center text-white/45">
                Bu tarih ve rota için uygun ilan bulunamadı.
              </div>
            )}
          </div>
        </section>
      )}

      {aktifSekme === 'surucu' && (
        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <PanelBaslik ikon={<ShieldCheck className="h-5 w-5" />} baslik="Sürücü Doğrulama" />
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              {dogrulama && (
                <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm">
                  <p className="font-black text-white">{DOGRULAMA_ETIKETLERI[dogrulama.durum]}</p>
                  <p className="mt-1 text-xs text-white/45">{dogrulama.aracMarkaModel} · {dogrulama.plaka}</p>
                  {dogrulama.adminNotu && <p className="mt-2 text-xs text-amber-200/80">{dogrulama.adminNotu}</p>}
                </div>
              )}
              {!dogrulandi && (
                <div className="space-y-3">
                  <input className="ride-input" value={dogrulamaForm.ehliyetSinifi} onChange={e => setDogrulamaForm(f => ({ ...f, ehliyetSinifi: e.target.value }))} placeholder="Ehliyet sınıfı" />
                  <input className="ride-input" value={dogrulamaForm.aracMarkaModel} onChange={e => setDogrulamaForm(f => ({ ...f, aracMarkaModel: e.target.value }))} placeholder="Araç marka/model" />
                  <input className="ride-input" value={dogrulamaForm.plaka} onChange={e => setDogrulamaForm(f => ({ ...f, plaka: e.target.value.toUpperCase() }))} placeholder="Plaka" />
                  <input className="ride-input" value={dogrulamaForm.aracRengi} onChange={e => setDogrulamaForm(f => ({ ...f, aracRengi: e.target.value }))} placeholder="Araç rengi" />
                  <button onClick={() => dogrulamaBasvur(dogrulamaForm)} className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-white">Doğrulamaya Gönder</button>
                </div>
              )}
              {dogrulandi && <p className="text-sm text-emerald-200">Doğrulaman onaylı. İlan açabilirsin.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <PanelBaslik ikon={<Plus className="h-5 w-5" />} baslik="Yolculuk İlanı Oluştur" />
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <Secim label="Başlangıç" value={form.baslangic} onChange={v => setForm(f => ({ ...f, baslangic: v }))} />
                <Secim label="Varış" value={form.varis} onChange={v => setForm(f => ({ ...f, varis: v }))} />
                <input className="ride-input" type="datetime-local" value={form.kalkisZamani} onChange={e => setForm(f => ({ ...f, kalkisZamani: e.target.value }))} />
                <input className="ride-input" type="number" min={1} max={8} value={form.koltukSayisi} onChange={e => setForm(f => ({ ...f, koltukSayisi: Number(e.target.value) }))} />
                <select className="ride-input" value={form.ucretTipi} onChange={e => setForm(f => ({ ...f, ucretTipi: e.target.value as UcretTipi }))}>
                  <option value="UCRETSIZ">Ücretsiz</option>
                  <option value="UCRETLI">Ücretli</option>
                </select>
                <select className="ride-input" value={form.odemeYontemi} onChange={e => setForm(f => ({ ...f, odemeYontemi: e.target.value as OdemeYontemi }))} disabled={form.ucretTipi === 'UCRETSIZ'}>
                  <option value="NAKIT">Nakit</option>
                  <option value="IBAN">IBAN</option>
                  <option value="NAKIT_VEYA_IBAN">Nakit veya IBAN</option>
                </select>
                <input className="ride-input" type="number" value={form.kisiBasiUcret} onChange={e => setForm(f => ({ ...f, kisiBasiUcret: Number(e.target.value) }))} disabled={form.ucretTipi === 'UCRETSIZ'} placeholder="Kişi başı ücret" />
                <input className="ride-input" value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="IBAN (opsiyonel)" />
              </div>
              <textarea className="ride-input mt-4 min-h-20" value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} placeholder="Yolculuk notu" />
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
                <RotaHaritasi noktalar={rotaNoktalari} />
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-white/35">Ara duraklar</p>
                  {araDuraklar.map((d, idx) => (
                    <div key={`${d.ad}-${idx}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                      <span className="min-w-0 flex-1 text-sm font-semibold text-white/75">{d.ad}</span>
                      <span className="text-xs text-white/35">+{d.tahminiDakika} dk</span>
                      <button onClick={() => setAraDuraklar(a => a.filter((_, i) => i !== idx))} className="text-red-300"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <select className="ride-input" onChange={e => {
                    const n = noktaBul(e.target.value);
                    if (!araDuraklar.some(d => d.ad === n.ad)) setAraDuraklar(a => [...a, { ...n, tahminiDakika: 45 + a.length * 15 }]);
                  }} value="">
                    <option value="">Ara durak ekle</option>
                    {NOKTALAR.filter(n => n.ad !== form.baslangic && n.ad !== form.varis).map(n => <option key={n.ad} value={n.ad}>{n.ad}</option>)}
                  </select>
                </div>
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/60">
                <input type="checkbox" checked={form.araDurakKabulEdilir} onChange={e => setForm(f => ({ ...f, araDurakKabulEdilir: e.target.checked }))} />
                Yolcular rota üzerindeki ek biniş/iniş noktalarını önerebilir
              </label>
              <button disabled={!dogrulandi} onClick={ilanKaydet} className="mt-5 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                İlanı Yayınla
              </button>
            </div>
          </div>
        </section>
      )}

      {aktifSekme === 'benim' && (
        <section className="grid gap-5 lg:grid-cols-3">
          <ListePanel baslik="İlanlarım" bos="Henüz ilanınız yok.">
            {benimIlanlarim.map(i => <IlanKarti key={i.id} ilan={i} kompakt />)}
          </ListePanel>
          <ListePanel baslik="Başvurularım" bos="Henüz başvurunuz yok.">
            {taleplerim.map(t => (
              <TalepSatiri key={t.id} talep={t} onIptal={() => talepIptal(t.id)} onTamamla={() => talepTamamla(t.id)} onPuanla={() => puanla(t.id, 5, 'Güvenli ve zamanında.')} onSikayet={() => sikayetEt(t.id, 'DIGER', 'İnceleme rica ederim.')} />
            ))}
          </ListePanel>
          <ListePanel baslik="Sürücü Talepleri" bos="İlanlarınıza gelen talep yok.">
            {surucuTalepleri.map(t => (
              <TalepSatiri key={t.id} talep={t} onKabul={() => talepKabul(t.id)} onRed={() => talepRed(t.id, 'Sürücü tarafından uygun bulunmadı.')} onTamamla={() => talepTamamla(t.id)} />
            ))}
          </ListePanel>
        </section>
      )}
    </div>
  );
};

const Secim = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="mb-1 block text-xs font-bold text-white/45">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#111123] px-3 py-2.5 text-sm text-white outline-none">
      {NOKTALAR.map(n => <option key={n.ad} value={n.ad}>{n.ad}</option>)}
    </select>
  </div>
);

const PanelBaslik = ({ ikon, baslik }: { ikon: ReactNode; baslik: string }) => (
  <div className="flex items-center gap-2 text-white">
    <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-cyan-200">{ikon}</div>
    <h2 className="text-lg font-black">{baslik}</h2>
  </div>
);

const RotaHaritasi = ({ noktalar }: { noktalar: Nokta[] }) => {
  const positions = noktalar.map(n => [n.enlem, n.boylam] as [number, number]);
  return (
    <div className="h-72 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <MapContainer center={positions[0]} zoom={10} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polyline positions={positions} pathOptions={{ color: '#06b6d4', weight: 5 }} />
        {positions.map((p, i) => <Marker key={i} position={p} />)}
      </MapContainer>
    </div>
  );
};

const IlanKarti = ({ ilan, onBasvur, kompakt }: { ilan: YolculukIlani; onBasvur?: () => void; kompakt?: boolean }) => {
  const duraklar = ilan.duraklar ?? [];
  const bos = ilan.koltukSayisi - ilan.kabulEdilenKoltukSayisi;
  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white">{ilan.baslangicBasligi} → {ilan.varisBasligi}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45"><CalendarClock className="h-3.5 w-3.5" /> {new Date(ilan.kalkisZamani).toLocaleString('tr-TR')}</p>
        </div>
        <span className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-black text-cyan-100">{ilan.uygunlukSkoru ?? 0} skor</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Bilgi icon={<Users className="h-3.5 w-3.5" />} text={`${bos} boş koltuk`} />
        <Bilgi icon={<CreditCard className="h-3.5 w-3.5" />} text={ilan.ucretTipi === 'UCRETSIZ' ? 'Ücretsiz' : `${para(ilan.kisiBasiUcret)} · ${ilan.odemeYontemi}`} />
        {ilan.araDurakKabulEdilir && <Bilgi icon={<Flag className="h-3.5 w-3.5" />} text="Ara durak önerilebilir" />}
      </div>
      {!kompakt && duraklar.length > 0 && (
        <div className="mt-4 space-y-2">
          {duraklar.map(d => (
            <div key={`${d.ad}-${d.tahminiDakika}`} className="flex items-center gap-2 text-xs text-white/55">
              <MapPin className="h-3.5 w-3.5 text-cyan-200" />
              <span className="font-semibold text-white/75">{d.ad}</span>
              <span className="ml-auto flex items-center gap-1 text-white/35"><Clock className="h-3 w-3" /> +{d.tahminiDakika} dk</span>
            </div>
          ))}
        </div>
      )}
      {ilan.aciklama && <p className="mt-4 text-sm leading-relaxed text-white/45">{ilan.aciklama}</p>}
      {onBasvur && (
        <button onClick={onBasvur} className="mt-5 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-white hover:bg-cyan-400">
          Katılım İsteği Gönder
        </button>
      )}
    </motion.article>
  );
};

const Bilgi = ({ icon, text }: { icon: ReactNode; text: string }) => (
  <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-bold text-white/55">{icon}{text}</span>
);

const ListePanel = ({ baslik, bos, children }: { baslik: string; bos: string; children: ReactNode }) => (
  <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.025] p-4">
    <h2 className="text-base font-black">{baslik}</h2>
    <div className="space-y-3">
      {Array.isArray(children) && children.length === 0 ? <p className="py-10 text-center text-sm text-white/35">{bos}</p> : children}
    </div>
  </div>
);

const TalepSatiri = ({ talep, onKabul, onRed, onIptal, onTamamla, onPuanla, onSikayet }: {
  talep: any;
  onKabul?: () => void;
  onRed?: () => void;
  onIptal?: () => void;
  onTamamla?: () => void;
  onPuanla?: () => void;
  onSikayet?: () => void;
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-sm font-black">{talep.binisBasligi} → {talep.inisBasligi}</p>
        <p className="mt-1 text-xs text-white/40">{TALEP_ETIKETLERI[talep.durum as keyof typeof TALEP_ETIKETLERI]} · {talep.koltukSayisi} koltuk</p>
      </div>
      <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-white/45">{talep.tahminiBinisDakika != null ? `+${talep.tahminiBinisDakika} dk` : 'Öneri'}</span>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      {onKabul && talep.durum === 'BEKLEMEDE' && <Aksiyon onClick={onKabul} icon={<Check className="h-3.5 w-3.5" />} text="Kabul" />}
      {onRed && talep.durum === 'BEKLEMEDE' && <Aksiyon onClick={onRed} icon={<X className="h-3.5 w-3.5" />} text="Red" />}
      {onIptal && ['BEKLEMEDE', 'KABUL_EDILDI'].includes(talep.durum) && <Aksiyon onClick={onIptal} icon={<X className="h-3.5 w-3.5" />} text="İptal" />}
      {onTamamla && talep.durum === 'KABUL_EDILDI' && <Aksiyon onClick={onTamamla} icon={<Flag className="h-3.5 w-3.5" />} text="Tamamla" />}
      {onPuanla && talep.durum === 'TAMAMLANDI' && <Aksiyon onClick={onPuanla} icon={<Star className="h-3.5 w-3.5" />} text="Puanla" />}
      {onSikayet && <Aksiyon onClick={onSikayet} icon={<AlertTriangle className="h-3.5 w-3.5" />} text="Şikayet" />}
    </div>
  </div>
);

const Aksiyon = ({ onClick, icon, text }: { onClick: () => void; icon: ReactNode; text: string }) => (
  <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white/65 hover:bg-white/10">
    {icon}{text}
  </button>
);
