import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CalendarClock, CarFront, Check, Clock, CreditCard, Flag,
  MapPin, Plus, Search, Settings, Star, Users, X,
} from 'lucide-react';
import {
  TALEP_ETIKETLERI,
  useYolculukDeposu,
  type Nokta,
  type OdemeYontemi,
  type RotaDuragi,
  type RotaSecenek,
  type UcretTipi,
  type YolculukIlani,
} from '../depolar/yolculukDeposu';
import { MesajBildirimi } from '../components/ortak/MesajBildirimi';
import { Anahtar } from '../components/ortak/Anahtar';
import { KonumSecici } from '../components/kulup-paneli/KonumSecici';
import { polylineCoz } from '../lib/rota';

const KAMPUS: Nokta = { ad: 'Işık Üniversitesi Şile Kampüsü', enlem: 41.1688, boylam: 29.5605 };
const VARSAYILAN_VARIS: Nokta = { ad: 'Üsküdar', enlem: 41.0275, boylam: 29.0153 };

// İki nokta arası kuş-uçuşu mesafe (km) — ilan açma için min 1 km kuralında kullanılır.
const haversineKm = (a: Nokta, b: Nokta) => {
  const R = 6371;
  const dLat = ((b.enlem - a.enlem) * Math.PI) / 180;
  const dLon = ((b.boylam - a.boylam) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.enlem * Math.PI) / 180) * Math.cos((b.enlem * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const bugun = () => new Date().toISOString().slice(0, 10);
const tarihSaatVarsayilan = () => `${bugun()}T08:30`;
const para = (tutar?: number) => !tutar ? 'Ücretsiz' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tutar);

export const CampusRideSayfasi = () => {
  const {
    ilanlar, benimIlanlarim, taleplerim, surucuTalepleri, dogrulama, populerNoktalar, araclar,
    isLoading, hata, basariMesaji,
    ilanAra, ilanOlustur, ilanIptal, benimVerilerimiGetir, populerNoktalariGetir, araclarimGetir, rotaOnizle,
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
    odemeYontemi: 'NAKIT' as OdemeYontemi,
    kisiBasiUcret: 80,
    aciklama: '',
    araDurakKabulEdilir: true,
  });
  const [araDuraklar, setAraDuraklar] = useState<RotaDuragi[]>([]);
  const [yeniDurak, setYeniDurak] = useState<Nokta | null>(null);
  const [seciliAracId, setSeciliAracId] = useState('');

  const onayliAraclar = useMemo(() => araclar.filter(a => a.durum === 'ONAYLANDI'), [araclar]);

  useEffect(() => {
    benimVerilerimiGetir();
    populerNoktalariGetir();
    araclarimGetir();
  }, [benimVerilerimiGetir, populerNoktalariGetir, araclarimGetir]);

  // İlk onaylı aracı varsayılan seç.
  useEffect(() => {
    if (!seciliAracId && onayliAraclar.length > 0) setSeciliAracId(onayliAraclar[0].id);
  }, [onayliAraclar, seciliAracId]);

  // Sayfa açılışında arama yapılmadan tüm gelecek ilanlar tarihsel yakınlığa göre listelenir.
  // Filtreli arama yalnızca "Ara" butonuna basınca çalışır.
  useEffect(() => { ilanAra({}); }, [ilanAra]);

  useEffect(() => () => temizleMesajlar(), [temizleMesajlar]);

  const dogrulandi = dogrulama?.durum === 'ONAYLANDI';
  const anaMesafeKm = useMemo(() => haversineKm(ilanBaslangic, ilanVaris), [ilanBaslangic, ilanVaris]);
  const mesafeYeterli = anaMesafeKm >= 1;
  const ilanAcabilir = dogrulandi && !!seciliAracId && mesafeYeterli;
  const rotaNoktalari = useMemo(() => [
    ilanBaslangic,
    ...araDuraklar,
    ilanVaris,
  ], [araDuraklar, ilanBaslangic, ilanVaris]);

  // Form haritası: noktalar değişince OSRM alternatif rotalarını çek; sürücü birini "ana rota" seçer.
  const [rotaSecenekler, setRotaSecenekler] = useState<RotaSecenek[]>([]);
  const [seciliRota, setSeciliRota] = useState(0);
  useEffect(() => {
    const zaman = setTimeout(async () => {
      const secenekler = await rotaOnizle(rotaNoktalari.map(n => ({ enlem: n.enlem, boylam: n.boylam })));
      setRotaSecenekler(secenekler);
      setSeciliRota(0);
    }, 500);
    return () => clearTimeout(zaman);
  }, [rotaNoktalari, rotaOnizle]);

  const anaRota = rotaSecenekler[seciliRota];

  // Kalkış zamanı + rotanın tahmini süresinden varış saatini hesapla.
  const tahminiVaris = useMemo(() => {
    if (!form.kalkisZamani || !anaRota?.toplamDakika) return null;
    const t = new Date(form.kalkisZamani);
    if (isNaN(t.getTime())) return null;
    t.setMinutes(t.getMinutes() + Math.round(anaRota.toplamDakika));
    return t.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }, [form.kalkisZamani, anaRota]);

  const ilanKaydet = async () => {
    const ok = await ilanOlustur({
      aracId: seciliAracId,
      baslangic: ilanBaslangic,
      varis: ilanVaris,
      kalkisZamani: form.kalkisZamani,
      koltukSayisi: form.koltukSayisi,
      ucretTipi: form.ucretTipi,
      odemeYontemi: form.ucretTipi === 'UCRETSIZ' ? 'YOK' : form.odemeYontemi,
      kisiBasiUcret: form.ucretTipi === 'UCRETSIZ' ? 0 : form.kisiBasiUcret,
      aciklama: form.aciklama,
      araDurakKabulEdilir: form.araDurakKabulEdilir,
      // Sürücünün haritadan seçtiği rota ANA rota olur (yoksa backend OSRM'in en iyisini kullanır).
      rotaPolyline: anaRota?.polyline,
      tahminiToplamDakika: anaRota?.toplamDakika,
      tahminiMesafeKm: anaRota?.mesafeKm,
      duraklar: araDuraklar,
    });
    if (ok) setAraDuraklar([]);
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

      <MesajBildirimi hata={hata} basari={basariMesaji} onKapat={temizleMesajlar} />

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
                Şu an uygun ilan bulunamadı. Farklı tarih/rota için arama yapabilirsiniz.
              </div>
            )}
          </div>
        </section>
      )}

      {aktifSekme === 'surucu' && (
        <section className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-4 lg:order-2">
            <PanelBaslik ikon={<CarFront className="h-5 w-5" />} baslik="Sürücü Durumu" />
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <DurumSatiri
                etiket="Ehliyet doğrulaması"
                tamam={dogrulandi}
                bekliyor={dogrulama?.durum === 'BEKLEMEDE'}
                metin={dogrulandi ? `Onaylı (${dogrulama?.ehliyetSinifi} sınıfı)` : dogrulama?.durum === 'BEKLEMEDE' ? 'İnceleniyor' : 'Doğrulanmadı'}
              />
              <DurumSatiri
                etiket="Onaylı araç"
                tamam={onayliAraclar.length > 0}
                bekliyor={araclar.length > 0 && onayliAraclar.length === 0}
                metin={onayliAraclar.length > 0 ? `${onayliAraclar.length} onaylı araç` : araclar.length > 0 ? 'Araç(lar) onay bekliyor' : 'Araç eklenmedi'}
              />
              <Link
                to="/ayarlar"
                className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-500/20"
              >
                <Settings className="h-4 w-4" /> Ehliyet & Araç Yönetimi (Ayarlar)
              </Link>
              <p className="text-[11px] leading-relaxed text-white/35">
                Ehliyet belgenizi ve araçlarınızı Ayarlar &gt; Sürücü &amp; Araçlar bölümünden yönetin. İlan açmak için
                ehliyetiniz onaylı ve en az bir aracınız onaylı olmalıdır.
              </p>
            </div>

            {/* Yolculuk özeti — seçilen rota, saat ve ücret bilgilerinin derli toplu görünümü */}
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-500/[0.06] p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-black text-cyan-100">
                <CarFront className="h-4 w-4" /> Yolculuk Özeti
              </p>
              <div className="space-y-2.5 text-sm">
                <OzetSatir icon={<MapPin className="h-3.5 w-3.5" />} label="Güzergah" value={`${ilanBaslangic.ad} → ${ilanVaris.ad}`} />
                <OzetSatir icon={<Users className="h-3.5 w-3.5" />} label="Boş koltuk" value={`${form.koltukSayisi} koltuk`} />
                <OzetSatir icon={<CreditCard className="h-3.5 w-3.5" />} label="Ücret"
                  value={form.ucretTipi === 'UCRETSIZ' ? 'Ücretsiz' : `${form.kisiBasiUcret} ₺ / kişi`} />
                <OzetSatir icon={<CalendarClock className="h-3.5 w-3.5" />} label="Kalkış"
                  value={form.kalkisZamani ? new Date(form.kalkisZamani).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'} />
                <OzetSatir icon={<Clock className="h-3.5 w-3.5" />} label="Tahmini varış" value={tahminiVaris ?? 'Rota hesaplanıyor…'} />
                <OzetSatir icon={<Flag className="h-3.5 w-3.5" />} label="Süre / mesafe"
                  value={anaRota ? `${anaRota.toplamDakika} dk · ${anaRota.mesafeKm} km` : '—'} />
              </div>
              <button disabled={!ilanAcabilir || isLoading} onClick={ilanKaydet} className="mt-5 w-full rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                İlanı Yayınla
              </button>
              {dogrulandi && onayliAraclar.length > 0 && !mesafeYeterli && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-amber-200/80">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Başlangıç ve varış arasında en az 1 km olmalı (şu an ~{anaMesafeKm.toFixed(1)} km). Farklı noktalar seçin.
                </p>
              )}
              {(!dogrulandi || onayliAraclar.length === 0) && (
                <p className="mt-2 text-[11px] text-white/35">
                  {!dogrulandi ? 'Ehliyetiniz onaylanmadan ilan açamazsınız. ' : ''}
                  {onayliAraclar.length === 0 ? 'Onaylı bir aracınız olmalı. ' : ''}
                  Ayarlar &gt; Sürücü &amp; Araçlar bölümünü kullanın.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:order-1">
            <PanelBaslik ikon={<Plus className="h-5 w-5" />} baslik="Yolculuk İlanı Oluştur" />
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-4">
                <label className="mb-1 block text-xs font-bold text-white/45">Araç</label>
                {onayliAraclar.length > 0 ? (
                  <select className="ride-input" value={seciliAracId} onChange={e => setSeciliAracId(e.target.value)}>
                    {onayliAraclar.map(a => (
                      <option key={a.id} value={a.id}>{a.markaModel} · {a.plaka}{a.koltukKapasitesi ? ` · ${a.koltukKapasitesi} koltuk` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <Link to="/ayarlar" className="flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-500/10 px-3 py-2.5 text-sm font-semibold text-amber-100">
                    <AlertTriangle className="h-4 w-4" /> İlan açmak için Ayarlar'dan onaylı bir araç ekleyin.
                  </Link>
                )}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <NoktaSecici label="Başlangıç" value={ilanBaslangic} onChange={setIlanBaslangic} populer={populerNoktalar} />
                <NoktaSecici label="Varış" value={ilanVaris} onChange={setIlanVaris} populer={populerNoktalar} />
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Kalkış tarihi & saati</span>
                  <input className="ride-input" type="datetime-local" value={form.kalkisZamani} onChange={e => setForm(f => ({ ...f, kalkisZamani: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Boş koltuk sayısı</span>
                  <input className="ride-input" type="number" min={1} max={8} value={form.koltukSayisi} onChange={e => setForm(f => ({ ...f, koltukSayisi: Number(e.target.value) }))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Ücret tipi</span>
                  <select className="ride-input" value={form.ucretTipi} onChange={e => setForm(f => ({ ...f, ucretTipi: e.target.value as UcretTipi }))}>
                    <option value="UCRETSIZ">Ücretsiz</option>
                    <option value="UCRETLI">Ücretli (kişi başı)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Kişi başı ücret (₺)</span>
                  {form.ucretTipi === 'UCRETSIZ' ? (
                    <input className="ride-input" type="text" value="Ücretsiz" disabled readOnly />
                  ) : (
                    <input className="ride-input" type="number" min={0} value={form.kisiBasiUcret} onChange={e => setForm(f => ({ ...f, kisiBasiUcret: Number(e.target.value) }))} placeholder="Örn. 80" />
                  )}
                </label>
              </div>
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-bold text-white/45">Yolculuk detayları</span>
                <textarea className="ride-input min-h-20" value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} placeholder="Rota, buluşma noktası, bagaj, evcil hayvan vb. detaylar" />
              </label>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="space-y-2">
                  <RotaHaritasi noktalar={rotaNoktalari} secenekler={rotaSecenekler} seciliIndex={seciliRota} onSelect={setSeciliRota} />
                  {rotaSecenekler.length > 1 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-black uppercase tracking-wide text-white/35">Rota seçenekleri</p>
                      {rotaSecenekler.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => setSeciliRota(i)}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                            i === seciliRota ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-50' : 'border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.06]'}`}
                        >
                          <span className="flex items-center gap-2 font-bold">
                            {i === seciliRota ? <Check className="h-3.5 w-3.5 text-cyan-300" /> : <span className="h-2.5 w-2.5 rounded-full border border-white/30" />}
                            {i === 0 ? 'Önerilen rota' : `Alternatif ${i}`}
                          </span>
                          <span className="text-xs text-white/45">{r.toplamDakika} dk · {r.mesafeKm} km</span>
                        </button>
                      ))}
                      <p className="text-[10px] text-white/30">Seçtiğiniz rota ilanın ana rotası olur; diğerleri öneridir.</p>
                    </div>
                  )}
                </div>
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
              <div className="mt-4">
                <Anahtar
                  acik={form.araDurakKabulEdilir}
                  onChange={v => setForm(f => ({ ...f, araDurakKabulEdilir: v }))}
                  baslik="Yolcular rota üzerindeki ek biniş/iniş noktalarını önerebilir"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {aktifSekme === 'benim' && (() => {
        const ilanAktif = (d: string) => d === 'AKTIF' || d === 'DOLU';
        const talepAktif = (d: string) => d === 'BEKLEMEDE' || d === 'KABUL_EDILDI';
        return (
          <div className="space-y-8">
            <section className="grid gap-5 lg:grid-cols-3">
              <ListePanel baslik="İlanlarım" bos="Aktif ilanınız yok.">
                {benimIlanlarim.filter(i => ilanAktif(i.durum)).map(i => <IlanKarti key={i.id} ilan={i} kompakt onIptal={() => ilanIptal(i.id)} />)}
              </ListePanel>
              <ListePanel baslik="Başvurularım" bos="Aktif başvurunuz yok.">
                {taleplerim.filter(t => talepAktif(t.durum)).map(t => (
                  <TalepSatiri key={t.id} talep={t} onIptal={() => talepIptal(t.id)} onTamamla={() => talepTamamla(t.id)} onPuanla={() => puanla(t.id, 5, 'Güvenli ve zamanında.')} onSikayet={() => sikayetEt(t.id, 'DIGER', 'İnceleme rica ederim.')} />
                ))}
              </ListePanel>
              <ListePanel baslik="Sürücü Talepleri" bos="İlanlarınıza gelen aktif talep yok.">
                {surucuTalepleri.filter(t => talepAktif(t.durum)).map(t => (
                  <TalepSatiri key={t.id} talep={t} onKabul={() => talepKabul(t.id)} onRed={() => talepRed(t.id, 'Sürücü tarafından uygun bulunmadı.')} onTamamla={() => talepTamamla(t.id)} />
                ))}
              </ListePanel>
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white/40">
                <Clock className="h-4 w-4" /> Geçmiş
              </h2>
              <div className="grid gap-5 lg:grid-cols-3">
                <ListePanel baslik="Geçmiş İlanlarım" bos="Geçmiş ilan yok.">
                  {benimIlanlarim.filter(i => !ilanAktif(i.durum)).map(i => <IlanKarti key={i.id} ilan={i} kompakt />)}
                </ListePanel>
                <ListePanel baslik="Geçmiş Başvurularım" bos="Geçmiş başvuru yok.">
                  {taleplerim.filter(t => !talepAktif(t.durum)).map(t => (
                    <TalepSatiri key={t.id} talep={t} onPuanla={() => puanla(t.id, 5, 'Güvenli ve zamanında.')} onSikayet={() => sikayetEt(t.id, 'DIGER', 'İnceleme rica ederim.')} />
                  ))}
                </ListePanel>
                <ListePanel baslik="Geçmiş Sürücü Talepleri" bos="Geçmiş talep yok.">
                  {surucuTalepleri.filter(t => !talepAktif(t.durum)).map(t => (
                    <TalepSatiri key={t.id} talep={t} />
                  ))}
                </ListePanel>
              </div>
            </section>
          </div>
        );
      })()}
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

// Alternatif OSRM rotalarını çizer: seçilen (ana) rota parlak+kalın, diğerleri soluk+kesikli
// ve tıklanınca seçilir. Hiç rota yoksa düz çizgiye düşer.
const RotaHaritasi = ({ noktalar, secenekler, seciliIndex, onSelect }: {
  noktalar: Nokta[];
  secenekler: RotaSecenek[];
  seciliIndex: number;
  onSelect: (i: number) => void;
}) => {
  const duraklar = noktalar.map(n => [n.enlem, n.boylam] as [number, number]);
  const cizgiler = useMemo(() => secenekler.map(s => polylineCoz(s.polyline)), [secenekler]);
  const varRota = cizgiler.some(c => c.length > 1);
  return (
    <div className="relative h-72 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <MapContainer key={duraklar.map(p => p.join(',')).join(';')} center={duraklar[0]} zoom={10} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {/* Önce seçilmeyenleri (altta), sonra seçileni (üstte) çiz. */}
        {cizgiler.map((c, i) => i !== seciliIndex && c.length > 1 && (
          <Polyline key={`alt-${i}`} positions={c} pathOptions={{ color: '#94a3b8', weight: 4, opacity: 0.5, dashArray: '6 8' }}
            eventHandlers={{ click: () => onSelect(i) }} />
        ))}
        {cizgiler[seciliIndex] && cizgiler[seciliIndex].length > 1 && (
          <Polyline positions={cizgiler[seciliIndex]} pathOptions={{ color: '#06b6d4', weight: 6 }} />
        )}
        {!varRota && <Polyline positions={duraklar} pathOptions={{ color: '#06b6d4', weight: 5, dashArray: '6 8' }} />}
        {duraklar.map((p, i) => <Marker key={i} position={p} />)}
      </MapContainer>
      {!varRota && (
        <span className="absolute bottom-2 left-2 z-[400] rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold text-white/70">
          Rota hesaplanıyor… (geçici düz çizgi)
        </span>
      )}
    </div>
  );
};

const DurumSatiri = ({ etiket, tamam, bekliyor, metin }: { etiket: string; tamam: boolean; bekliyor?: boolean; metin: string }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm font-semibold text-white/70">{etiket}</span>
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
      tamam ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
        : bekliyor ? 'border-amber-300/30 bg-amber-500/10 text-amber-200'
        : 'border-white/15 bg-white/5 text-white/50'}`}>
      {tamam ? <Check className="h-3.5 w-3.5" /> : bekliyor ? <Clock className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {metin}
    </span>
  </div>
);

const ILAN_DURUM: Record<string, { etiket: string; sinif: string }> = {
  AKTIF: { etiket: 'Aktif', sinif: 'border-emerald-300/25 bg-emerald-500/10 text-emerald-200' },
  DOLU: { etiket: 'Dolu', sinif: 'border-amber-300/25 bg-amber-500/10 text-amber-200' },
  IPTAL: { etiket: 'İptal edildi', sinif: 'border-red-300/25 bg-red-500/10 text-red-200' },
  TAMAMLANDI: { etiket: 'Tamamlandı', sinif: 'border-white/15 bg-white/5 text-white/50' },
};

const IlanKarti = ({ ilan, onBasvur, onIptal, kompakt }: { ilan: YolculukIlani; onBasvur?: () => void; onIptal?: () => void; kompakt?: boolean }) => {
  const duraklar = ilan.duraklar ?? [];
  const bos = ilan.koltukSayisi - ilan.kabulEdilenKoltukSayisi;
  const iptalEdilebilir = ilan.durum === 'AKTIF' || ilan.durum === 'DOLU';
  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white">{ilan.baslangicBasligi} → {ilan.varisBasligi}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45"><CalendarClock className="h-3.5 w-3.5" /> {new Date(ilan.kalkisZamani).toLocaleString('tr-TR')}</p>
        </div>
        {kompakt
          ? <span className={`rounded-xl border px-2.5 py-1 text-xs font-black ${ILAN_DURUM[ilan.durum]?.sinif ?? 'border-white/15 bg-white/5 text-white/50'}`}>{ILAN_DURUM[ilan.durum]?.etiket ?? ilan.durum}</span>
          : <span className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-black text-cyan-100">{ilan.uygunlukSkoru ?? 0} skor</span>}
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
      {onIptal && iptalEdilebilir && (
        <button
          onClick={() => { if (window.confirm('İlanı iptal etmek istediğinize emin misiniz? Kabul edilen yolculara bildirim gönderilecek.')) onIptal(); }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-200 hover:bg-red-500/20"
        >
          <X className="h-4 w-4" /> İlanı İptal Et
        </button>
      )}
    </motion.article>
  );
};

const Bilgi = ({ icon, text }: { icon: ReactNode; text: string }) => (
  <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-bold text-white/55">{icon}{text}</span>
);

const OzetSatir = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-cyan-500/15 text-cyan-200">{icon}</span>
    <span className="text-white/45">{label}:</span>
    <span className="min-w-0 truncate font-bold text-white/85">{value}</span>
  </div>
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
