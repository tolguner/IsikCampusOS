import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, BadgeCheck, Plus, Pencil, Trash2, X, ShieldCheck, AlertTriangle } from 'lucide-react';
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

// Türkiye standart ehliyet sınıfları (2918 sayılı KTK) — açılır menüde seçilir.
const EHLIYET_SINIFLARI: { kod: string; aciklama: string }[] = [
  { kod: 'M', aciklama: 'Moped' },
  { kod: 'A1', aciklama: 'Hafif motosiklet' },
  { kod: 'A2', aciklama: 'Motosiklet (orta)' },
  { kod: 'A', aciklama: 'Motosiklet' },
  { kod: 'B1', aciklama: 'Dört tekerlekli motosiklet' },
  { kod: 'B', aciklama: 'Otomobil' },
  { kod: 'BE', aciklama: 'Otomobil + römork' },
  { kod: 'C1', aciklama: 'Kamyonet' },
  { kod: 'C1E', aciklama: 'Kamyonet + römork' },
  { kod: 'C', aciklama: 'Kamyon' },
  { kod: 'CE', aciklama: 'Kamyon + römork' },
  { kod: 'D1', aciklama: 'Minibüs' },
  { kod: 'D1E', aciklama: 'Minibüs + römork' },
  { kod: 'D', aciklama: 'Otobüs' },
  { kod: 'DE', aciklama: 'Otobüs + römork' },
  { kod: 'F', aciklama: 'Traktör' },
  { kod: 'G', aciklama: 'İş makinesi' },
];

const bosArac = { markaModel: '', plaka: '', renk: '', koltukKapasitesi: 4, gorselUrl: '' };

export const SurucuAyarlari = () => {
  const {
    dogrulama, araclar, isLoading,
    benimVerilerimiGetir, araclarimGetir, dogrulamaBasvur, aracEkle, aracGuncelle, aracSil,
  } = useYolculukDeposu();

  const [ehliyetSinifi, setEhliyetSinifi] = useState('B');
  const [belgeUrl, setBelgeUrl] = useState('');
  const [aracForm, setAracForm] = useState<typeof bosArac>(bosArac);
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [formAcik, setFormAcik] = useState(false);

  useEffect(() => { benimVerilerimiGetir(); araclarimGetir(); }, [benimVerilerimiGetir, araclarimGetir]);

  const onayli = dogrulama?.durum === 'ONAYLANDI';

  const ehliyetGonder = async () => {
    if (!belgeUrl) return;
    const ok = await dogrulamaBasvur({ ehliyetSinifi, belgeUrl });
    if (ok) setBelgeUrl('');
  };

  const formuAc = (arac?: Arac) => {
    if (arac) {
      setDuzenlenenId(arac.id);
      setAracForm({ markaModel: arac.markaModel, plaka: arac.plaka, renk: arac.renk ?? '', koltukKapasitesi: arac.koltukKapasitesi ?? 4, gorselUrl: arac.gorselUrl });
    } else {
      setDuzenlenenId(null);
      setAracForm(bosArac);
    }
    setFormAcik(true);
  };

  const aracKaydet = async () => {
    if (!aracForm.markaModel.trim() || !aracForm.plaka.trim() || !aracForm.gorselUrl) return;
    const ok = duzenlenenId ? await aracGuncelle(duzenlenenId, aracForm) : await aracEkle(aracForm);
    if (ok) { setFormAcik(false); setDuzenlenenId(null); setAracForm(bosArac); }
  };

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
            <BadgeCheck className="w-4 h-4" /> Ehliyetiniz onaylı ({dogrulama?.ehliyetSinifi} sınıfı).
          </p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-[140px_1fr]">
            <div>
              <label className="mb-1 block text-xs font-bold text-white/45">Ehliyet sınıfı</label>
              <select value={ehliyetSinifi} onChange={e => setEhliyetSinifi(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111123] px-3 py-2.5 text-sm text-white outline-none">
                {EHLIYET_SINIFLARI.map(s => (
                  <option key={s.kod} value={s.kod}>{s.kod} — {s.aciklama}</option>
                ))}
              </select>
            </div>
            <div>
              <GorselYukleyici etiket="Ehliyet belgesi fotoğrafı (zorunlu)" value={belgeUrl} onChange={setBelgeUrl}
                oranSinifi="aspect-[16/9]" />
            </div>
            <div className="md:col-span-2">
              <button onClick={ehliyetGonder} disabled={!belgeUrl || isLoading}
                className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40">
                {dogrulama ? 'Yeniden Doğrulamaya Gönder' : 'Doğrulamaya Gönder'}
              </button>
              {!belgeUrl && <span className="ml-3 text-[11px] text-white/35">Ehliyet fotoğrafı yüklemeden gönderilemez.</span>}
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
                {arac.gorselUrl && <img src={arac.gorselUrl} alt={arac.markaModel} className="h-full w-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{arac.markaModel}</p>
                    <p className="text-xs text-white/45">{arac.plaka}{arac.renk ? ` · ${arac.renk}` : ''}{arac.koltukKapasitesi ? ` · ${arac.koltukKapasitesi} koltuk` : ''}</p>
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
              <button onClick={() => { setFormAcik(false); setDuzenlenenId(null); setAracForm(bosArac); }} className="text-white/45 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={aracForm.markaModel} onChange={e => setAracForm(f => ({ ...f, markaModel: e.target.value }))} placeholder="Marka / Model (örn. VW Golf)"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none" />
              <input value={aracForm.plaka} onChange={e => setAracForm(f => ({ ...f, plaka: e.target.value.toUpperCase() }))} placeholder="Plaka"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none" />
              <input value={aracForm.renk} onChange={e => setAracForm(f => ({ ...f, renk: e.target.value }))} placeholder="Renk (opsiyonel)"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none" />
              <input type="number" min={1} max={8} value={aracForm.koltukKapasitesi} onChange={e => setAracForm(f => ({ ...f, koltukKapasitesi: Number(e.target.value) }))} placeholder="Koltuk kapasitesi"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none" />
            </div>
            <GorselYukleyici etiket="Araç fotoğrafı (zorunlu)" value={aracForm.gorselUrl} onChange={u => setAracForm(f => ({ ...f, gorselUrl: u }))} />
            <div className="flex items-center gap-3">
              <button onClick={aracKaydet} disabled={!aracForm.markaModel.trim() || !aracForm.plaka.trim() || !aracForm.gorselUrl || isLoading}
                className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-white disabled:opacity-40">
                {duzenlenenId ? 'Güncelle' : 'Ekle'}
              </button>
              {!aracForm.gorselUrl && <span className="text-[11px] text-white/35">Araç fotoğrafı zorunlu.</span>}
            </div>
            <p className="text-[11px] text-white/35">Eklenen/güncellenen araç yönetici onayından sonra ilan açmakta kullanılabilir.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
