import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, BadgeCheck, Plus, Pencil, Trash2, X, ShieldCheck, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import {
  useYolculukDeposu,
  DOGRULAMA_ETIKETLERI,
  ARAC_ETIKETLERI,
  type Arac,
  type AracDurumu,
  type DogrulamaDurumu,
} from '../../depolar/yolculukDeposu';
import { GorselYukleyici } from '../ortak/GorselYukleyici';

const durumRengi = (durum: AracDurumu | DogrulamaDurumu) =>
  durum === 'ONAYLANDI' ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-200'
    : durum === 'REDDEDILDI' ? 'border-red-300/30 bg-red-500/10 text-red-200'
    : durum === 'PASIF' || durum === 'ASKIYA_ALINDI' ? 'border-white/15 bg-white/5 text-white/50'
    : 'border-amber-300/30 bg-amber-500/10 text-amber-200';

// Türkiye standart ehliyet sınıfları (2918 sayılı KTK).
const EHLIYET_SINIFLARI: { kod: string; aciklama: string }[] = [
  { kod: 'M', aciklama: 'Moped' }, { kod: 'A1', aciklama: 'Hafif motosiklet' },
  { kod: 'A2', aciklama: 'Motosiklet (orta)' }, { kod: 'A', aciklama: 'Motosiklet' },
  { kod: 'B1', aciklama: 'Dört tekerlekli motosiklet' }, { kod: 'B', aciklama: 'Otomobil' },
  { kod: 'BE', aciklama: 'Otomobil + römork' }, { kod: 'C1', aciklama: 'Kamyonet' },
  { kod: 'C1E', aciklama: 'Kamyonet + römork' }, { kod: 'C', aciklama: 'Kamyon' },
  { kod: 'CE', aciklama: 'Kamyon + römork' }, { kod: 'D1', aciklama: 'Minibüs' },
  { kod: 'D1E', aciklama: 'Minibüs + römork' }, { kod: 'D', aciklama: 'Otobüs' },
  { kod: 'DE', aciklama: 'Otobüs + römork' }, { kod: 'F', aciklama: 'Traktör' },
  { kod: 'G', aciklama: 'İş makinesi' },
];

const ARAC_TIPLERI = ['Sedan', 'Hatchback', 'SUV', 'Station Wagon', 'Coupe', 'MPV / Minivan', 'Pickup', 'Cabrio', 'Motosiklet', 'Diğer'];
const SIMDIKI_YIL = new Date().getFullYear();
const YILLAR = Array.from({ length: SIMDIKI_YIL + 1 - 1990 + 1 }, (_, i) => SIMDIKI_YIL + 1 - i);

const girisClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50';
const bosArac = { marka: '', model: '', aracTipi: '', modelYili: undefined as number | undefined, plaka: '', renk: '', koltukKapasitesi: 4, gorselUrl: '' };

export const SurucuAyarlari = () => {
  const {
    dogrulama, araclar, isLoading,
    benimVerilerimiGetir, araclarimGetir, dogrulamaBasvur, aracEkle, aracGuncelle, aracSil,
    aracMarkalariGetir, aracModelleriGetir,
  } = useYolculukDeposu();

  const [ehliyetSinifi, setEhliyetSinifi] = useState('B');
  const [ehliyetNo, setEhliyetNo] = useState('');
  const [verilisTarihi, setVerilisTarihi] = useState('');
  const [gecerlilikTarihi, setGecerlilikTarihi] = useState('');
  const [belgeUrl, setBelgeUrl] = useState('');

  const [aracForm, setAracForm] = useState<typeof bosArac>(bosArac);
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [formAcik, setFormAcik] = useState(false);
  const [markalar, setMarkalar] = useState<string[]>([]);
  const [modeller, setModeller] = useState<string[]>([]);

  useEffect(() => { benimVerilerimiGetir(); araclarimGetir(); }, [benimVerilerimiGetir, araclarimGetir]);
  useEffect(() => { aracMarkalariGetir().then(setMarkalar); }, [aracMarkalariGetir]);

  const onayli = dogrulama?.durum === 'ONAYLANDI';
  const beklemede = dogrulama?.durum === 'BEKLEMEDE';

  const markaSec = async (marka: string) => {
    setAracForm(f => ({ ...f, marka, model: '' }));
    setModeller([]);
    if (marka.trim()) setModeller(await aracModelleriGetir(marka));
  };

  const belgeYuklendi = (url: string) => {
    setBelgeUrl(url);
  };

  const gonderilebilir = !!belgeUrl && !!ehliyetSinifi && !!ehliyetNo && !!verilisTarihi && !!gecerlilikTarihi;

  const ehliyetGonder = async () => {
    if (!gonderilebilir) return;
    const ok = await dogrulamaBasvur({
      ehliyetSinifi, ehliyetNo: ehliyetNo.trim() || undefined,
      verilisTarihi: verilisTarihi || undefined, gecerlilikTarihi: gecerlilikTarihi || undefined, belgeUrl,
    });
    if (ok) { setBelgeUrl(''); }
  };

  const formuAc = async (arac?: Arac) => {
    if (arac) {
      setDuzenlenenId(arac.id);
      setAracForm({
        marka: arac.marka ?? '', model: arac.model ?? '', aracTipi: arac.aracTipi ?? '', modelYili: arac.modelYili,
        plaka: arac.plaka, renk: arac.renk ?? '', koltukKapasitesi: arac.koltukKapasitesi ?? 4, gorselUrl: arac.gorselUrl,
      });
      if (arac.marka) setModeller(await aracModelleriGetir(arac.marka));
    } else {
      setDuzenlenenId(null); setAracForm(bosArac); setModeller([]);
    }
    setFormAcik(true);
  };

  const aracGecerli = !!(aracForm.marka.trim() && aracForm.plaka.trim() && aracForm.gorselUrl);

  const aracKaydet = async () => {
    if (!aracGecerli) return;
    const ok = duzenlenenId ? await aracGuncelle(duzenlenenId, aracForm) : await aracEkle(aracForm);
    if (ok) { setFormAcik(false); setDuzenlenenId(null); setAracForm(bosArac); setModeller([]); }
  };

  const aracBaslik = (a: Arac) => [a.marka, a.model].filter(Boolean).join(' ') || a.markaModel;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-6"
    >
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Car className="w-5 h-5 text-cyan-400" /> Sürücü & Araçlarım
        </h2>
        <p className="text-xs text-white/40 mt-1">
          CampusRide'da ilan açabilmek için ehliyetinizi doğrulatın ve en az bir aracınızı onaylatın.
        </p>
      </div>

      {/* Ehliyet doğrulama */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-300" /> Ehliyet Doğrulama
          </h3>
          {dogrulama && (
            <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${durumRengi(dogrulama.durum)}`}>
              {DOGRULAMA_ETIKETLERI[dogrulama.durum]}
            </span>
          )}
        </div>

        {dogrulama?.adminNotu && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-200/80">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {dogrulama.adminNotu}
          </p>
        )}

        {onayli ? (
          <p className="mt-3 text-sm text-emerald-200 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4" /> Ehliyetiniz onaylı ({dogrulama?.ehliyetSinifi} sınıfı). Artık araç ekleyip sürücü modunu kullanabilirsiniz.
          </p>
        ) : beklemede ? (
          <div className="mt-3 space-y-2">
             <p className="text-sm text-cyan-200 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Ehliyetiniz inceleme aşamasındadır.
             </p>
             <p className="text-xs text-white/60">
                Belgeniz "Yapı, Lojistik ve Ulaşım Hizmetleri Müdürlüğü" tarafından kontrol edildikten sonra onaylanacaktır. Onaylandıktan sonra araç ekleyip sürücü modunu kullanabilirsiniz.
             </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="flex items-center gap-1.5 text-[11px] text-cyan-200/70">
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> Ehliyet fotoğrafını yükleyip aşağıdaki bilgileri eksiksiz doldurun. Başvurunuz Yapı, Lojistik ve Ulaşım Hizmetleri Müdürlüğü onayı sonrasında geçerli olacaktır.
            </p>
            <div className="grid gap-4 md:grid-cols-[minmax(0,240px)_1fr] md:items-start">
              <GorselYukleyici etiket="Ehliyet belgesi fotoğrafı (zorunlu)" value={belgeUrl} onChange={belgeYuklendi} oranSinifi="aspect-[16/10]" />

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Ehliyet sınıfı</span>
                  <select value={ehliyetSinifi} onChange={e => setEhliyetSinifi(e.target.value)} className={girisClass}>
                    {EHLIYET_SINIFLARI.map(s => <option key={s.kod} value={s.kod}>{s.kod} — {s.aciklama}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Ehliyet no</span>
                  <input value={ehliyetNo} onChange={e => setEhliyetNo(e.target.value)} placeholder="Ehliyet numarası" className={girisClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Veriliş tarihi</span>
                  <input type="date" value={verilisTarihi} onChange={e => setVerilisTarihi(e.target.value)} className={`${girisClass} [color-scheme:dark]`} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Geçerlilik (son kullanma) tarihi</span>
                  <input type="date" value={gecerlilikTarihi} onChange={e => setGecerlilikTarihi(e.target.value)} className={`${girisClass} [color-scheme:dark]`} />
                </label>
              </div>
            </div>
            <div>
              <button onClick={ehliyetGonder} disabled={!gonderilebilir || isLoading}
                className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40">
                {dogrulama ? 'Yeniden Doğrulamaya Gönder' : 'Doğrulamaya Gönder'}
              </button>
              {!gonderilebilir && <span className="ml-3 text-[11px] text-white/35">Tüm alanları doldurup fotoğraf yüklemeniz gerekmektedir.</span>}
            </div>
          </div>
        )}
      </div>

      {/* Araçlar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-cyan-300" /> Araçlarım
          </h3>
          {!formAcik && (
            <button onClick={() => formuAc()} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15">
              <Plus className="w-3.5 h-3.5" /> Araç Ekle
            </button>
          )}
        </div>

        {araclar.length === 0 && !formAcik && (
          <p className="mt-3 text-xs text-white/35">Henüz aracınız yok. İlan açabilmek için bir araç ekleyip onaylatın.</p>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {araclar.map(arac => (
            <div key={arac.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="aspect-video w-full overflow-hidden bg-black/30">
                {arac.gorselUrl && <img src={arac.gorselUrl} alt={aracBaslik(arac)} className="h-full w-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{aracBaslik(arac)}{arac.modelYili ? ` (${arac.modelYili})` : ''}</p>
                    <p className="text-xs text-white/45">
                      {arac.plaka}{arac.aracTipi ? ` · ${arac.aracTipi}` : ''}{arac.renk ? ` · ${arac.renk}` : ''}{arac.koltukKapasitesi ? ` · ${arac.koltukKapasitesi} koltuk` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${durumRengi(arac.durum)}`}>
                    {ARAC_ETIKETLERI[arac.durum]}
                  </span>
                </div>
                {arac.adminNotu && <p className="mt-2 text-[11px] text-amber-200/70">{arac.adminNotu}</p>}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => formuAc(arac)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white/65 hover:bg-white/10">
                    <Pencil className="w-3.5 h-3.5" /> Düzenle
                  </button>
                  <button onClick={() => aracSil(arac.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/20">
                    <Trash2 className="w-3.5 h-3.5" /> Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {formAcik && (
          <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/[0.04] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-white">{duzenlenenId ? 'Aracı Düzenle' : 'Yeni Araç'}</p>
              <button onClick={() => { setFormAcik(false); setDuzenlenenId(null); setAracForm(bosArac); setModeller([]); }} className="text-white/45 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <datalist id="arac-markalari">{markalar.map(m => <option key={m} value={m} />)}</datalist>
            <datalist id="arac-modelleri">{modeller.map(m => <option key={m} value={m} />)}</datalist>
            <div className="grid gap-4 md:grid-cols-[1fr_minmax(0,240px)] md:items-start">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Marka</span>
                  <input list="arac-markalari" value={aracForm.marka} onChange={e => markaSec(e.target.value)} placeholder="Marka (örn. Volkswagen)" className={girisClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Model</span>
                  <input list="arac-modelleri" value={aracForm.model} onChange={e => setAracForm(f => ({ ...f, model: e.target.value }))} placeholder="Model (örn. Golf)" className={girisClass} disabled={!aracForm.marka.trim()} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Araç tipi</span>
                  <select value={aracForm.aracTipi} onChange={e => setAracForm(f => ({ ...f, aracTipi: e.target.value }))} className={girisClass}>
                    <option value="">Seçiniz</option>
                    {ARAC_TIPLERI.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Model yılı</span>
                  <select value={aracForm.modelYili ?? ''} onChange={e => setAracForm(f => ({ ...f, modelYili: e.target.value ? Number(e.target.value) : undefined }))} className={girisClass}>
                    <option value="">Seçiniz</option>
                    {YILLAR.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Plaka</span>
                  <input value={aracForm.plaka} onChange={e => setAracForm(f => ({ ...f, plaka: e.target.value.toUpperCase() }))} placeholder="34 ABC 123" className={girisClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Renk (opsiyonel)</span>
                  <input value={aracForm.renk} onChange={e => setAracForm(f => ({ ...f, renk: e.target.value }))} placeholder="Renk" className={girisClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-white/45">Koltuk kapasitesi</span>
                  <input type="number" min={1} max={8} value={aracForm.koltukKapasitesi} onChange={e => setAracForm(f => ({ ...f, koltukKapasitesi: Number(e.target.value) }))} className={girisClass} />
                </label>
              </div>
              <GorselYukleyici etiket="Araç fotoğrafı (zorunlu)" value={aracForm.gorselUrl} onChange={u => setAracForm(f => ({ ...f, gorselUrl: u }))} oranSinifi="aspect-[16/10]" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={aracKaydet} disabled={!aracGecerli || isLoading}
                className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40">
                {duzenlenenId ? 'Güncelle' : 'Ekle'}
              </button>
              {!aracForm.gorselUrl && <span className="text-[11px] text-white/35">Araç fotoğrafı zorunlu.</span>}
            </div>
            <p className="text-[11px] text-white/35">Marka/model listesi dış araç veritabanından gelir; listede yoksa serbest yazabilirsiniz. Onay sonrası ilan açmakta kullanılır.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
