import { useEffect, useMemo, useRef, useState } from 'react';
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
import { KonumSecici } from '../components/kulup-paneli/KonumSecici';

const KAMPUS: Nokta = { ad: 'İşık Üniversitesi Şile Kampüsü', enlem: 41.1762, boylam: 29.6128 };
const VARSAYILAN_VARIS: Nokta = { ad: 'Kadıköy', enlem: 40.9909, boylam: 29.0254 };

const bugun = () => new Date().toISOString().slice(0, 10);
const tarihSaatVarsayilan = () => `${bugun()}T08:30`;
const para = (tutar?: number) => !tutar ? 'Ücretsiz' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tutar);

export const CampusRideSayfasi = () => {
  const {
    ilanlar, benimIlanlarim, taleplerim, surucuTalepleri, dogrulama, populerNoktalar,
    isLoading, hata, basariMesaji,
    ilanAra, ilanOlustur, benimVerilerimiGetir, dogrulamaBasvur, populerNoktalariGetir,
    ilanaKatil, talepKabul, talepRed, talepIptal, talepTamamla, puanla, sikayetEt, temizleMesajlar,
  } = useYolculukDeposu();

  const [tarih, setTarih] = useState(bugun());
  const [baslangic, setBaslangic] = useState<Nokta>(KAMPUS);
  const [varis, setVaris] = useState<Nokta>(VARSAYILAN_VARIS);
  const [aktifSekme, setAktifSekme] = useState<'ara' | 'surucu' | 'benim'>('ara');
  const [ilanBaslangic, setIlanBaslangic] = useState<Nokta>(KAMPUS);
  const [ilanVaris, setIlanVaris] = useState<Nokta>(VARSAYILAN_VARIS);
  const [form, setForm] = useState({
    kalkisZamani: tarihSaatVarsayilan(),
    koltukSayisi: 3,
    ucretTipi: 'UCRETLI' as UcretTipi,
    odemeYontemi: 'NAKIT_VEYA_IBAN' as OdemeYontemi,
    kisiBasiUcret: 80,
    iban: '',
    aciklama: '',
    araDurakKabulEdilir: true,
  });
  const [araDuraklar, setAraDuraklar] = useState<RotaDuragi[]>([]);
  const [yeniDurak, setYeniDurak] = useState<Nokta | null>(null);
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
    populerNoktalariGetir();
  }, [benimVerilerimiGetir, populerNoktalariGetir]);

  useEffect(() => {
    ilanAra({
      tarih,
      baslangic: baslangic.ad,
      baslangicEnlem: baslangic.enlem,
      baslangicBoylam: baslangic.boylam,
      varis: varis.ad,
      varisEnlem: varis.enlem,
      varisBoylam: varis.boylam,
    });
  }, [baslangic, ilanAra, tarih, varis]);

  useEffect(() => () => temizleMesajlar(), [temizleMesajlar]);

  const dogrulandi = dogrulama?.durum === 'ONAYLANDI';
  const rotaNoktalari = useMemo(() => [
    ilanBaslangic,
    ...araDuraklar,
    ilanVaris,
  ], [araDuraklar, ilanBaslangic, ilanVaris]);

  const ilanKaydet = async () => {
    await ilanOlustur({
      baslangic: ilanBaslangic,
      varis: ilanVaris,
      kalkisZamani: form.kalkisZamani,
      koltukSayisi: form.koltukSayisi,
      ucretTipi: form.ucretTipi,
      odemeYontemi: form.ucretTipi === 'UCRETSIZ' ? 'YOK' : form.odemeYontemi,
      kisiBasiUcret: form.ucretTipi === 'UCRETSIZ' ? 0 : form.kisiBasiUcret,
      iban: form.iban,
      aciklama: form.aciklama,
      araDurakKabulEdilir: form.araDurakKabulEdilir,
      // Rota/süre/mesafe artık backend'de OSRM ile hesaplanıyor.
      tahminiToplamDakika: undefined,
      tahminiMesafeKm: undefined,
      duraklar: araDuraklar,
    });
  };

  // Yolcu varsayılan biniş/iniş = arama noktaları (haritadan değiştirilebilir).
  const basvur = async (ilan: YolculukIlani) => {
    await ilanaKatil(ilan.id, baslangic, varis, `${baslangic.ad} → ${varis.ad} arası katılmak istiyorum.`);
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
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2">
            <NoktaSecici label="Nereden?" value={baslangic} onChange={setBaslangic} populer={populerNoktalar} />
            <NoktaSecici label="Nereye?" value={varis} onChange={setVaris} populer={populerNoktalar} />
            <div>
              <label className="mb-1 block text-xs font-bold text-white/45">Tarih</label>
              <input value={tarih} onChange={e => setTarih(e.target.value)} type="date" className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark]" />
            </div>
            <button onClick={() => ilanAra({ tarih, baslangic: baslangic.ad, baslangicEnlem: baslangic.enlem, baslangicBoylam: baslangic.boylam, varis: varis.ad, varisEnlem: varis.enlem, varisBoylam: varis.boylam })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-white self-end">
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
                <NoktaSecici label="Başlangıç" value={ilanBaslangic} onChange={setIlanBaslangic} populer={populerNoktalar} />
                <NoktaSecici label="Varış" value={ilanVaris} onChange={setIlanVaris} populer={populerNoktalar} />
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
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white/75">{d.ad}</span>
                      <button onClick={() => setAraDuraklar(a => a.filter((_, i) => i !== idx))} className="text-red-300"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {araDuraklar.length === 0 && <p className="text-[11px] text-white/30">Henüz ara durak yok — yolcuların binebileceği rota üstü noktalar ekleyebilirsiniz.</p>}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2 space-y-2">
                    <NoktaSecici label="Ara durak (haritadan)" value={yeniDurak ?? KAMPUS} onChange={setYeniDurak} populer={populerNoktalar} />
                    <button
                      disabled={!yeniDurak}
                      onClick={() => { if (yeniDurak) { setAraDuraklar(a => [...a, { ...yeniDurak, tahminiDakika: 0 }]); setYeniDurak(null); } }}
                      className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-40"
                    >
                      Durağı Ekle
                    </button>
                  </div>
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

// Haritadan serbest nokta seçimi + popüler kısa-yol önerileri.
// Sabit konum listesi YOK: kullanıcı haritaya tıklayarak ya da adres arayarak
// herhangi bir noktayı seçer; popüler noktalar yalnızca hızlı erişim kısayoludur.
const NoktaSecici = ({ label, value, onChange, populer }: {
  label: string;
  value: Nokta;
  onChange: (n: Nokta) => void;
  populer: Nokta[];
}) => {
  const [acik, setAcik] = useState(false);
  const sonKonum = useRef({ enlem: value.enlem, boylam: value.boylam });

  const haritadanSec = (lat: number, lng: number) => {
    sonKonum.current = { enlem: lat, boylam: lng };
    onChange({ ad: `Harita konumu (${lat.toFixed(4)}, ${lng.toFixed(4)})`, enlem: lat, boylam: lng });
  };
  const adlandir = (ad: string) => onChange({ ad, enlem: sonKonum.current.enlem, boylam: sonKonum.current.boylam });
  const populerSec = (n: Nokta) => {
    sonKonum.current = { enlem: n.enlem, boylam: n.boylam };
    onChange(n);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-white/45">{label}</label>
      <button
        type="button"
        onClick={() => setAcik(a => !a)}
        className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-[#111123] px-3 py-2.5 text-left text-sm text-white outline-none hover:border-cyan-300/30"
      >
        <MapPin className="h-4 w-4 shrink-0 text-cyan-200" />
        <span className="min-w-0 flex-1 truncate font-semibold">{value.ad}</span>
        <span className="text-xs text-cyan-200/70">{acik ? 'Kapat' : 'Haritadan seç'}</span>
      </button>

      {populer.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {populer.slice(0, 6).map(n => (
            <button
              key={n.ad}
              type="button"
              onClick={() => populerSec(n)}
              className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition ${value.ad === n.ad ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'}`}
            >
              {n.ad}
            </button>
          ))}
        </div>
      )}

      {acik && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2">
          <KonumSecici
            latitude={value.enlem}
            longitude={value.boylam}
            onChange={haritadanSec}
            onLocationSelect={adlandir}
          />
        </div>
      )}
    </div>
  );
};

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
