import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Tag, Power } from 'lucide-react';
import { useIsletmeDeposu, type KampanyaFormu } from '../../depolar/isletmeDeposu';
import type { Kampanya, KampanyaTuru } from '../../depolar/yemekDeposu';

const paraBicimle = (t: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);

const TUR_ETIKET: Record<KampanyaTuru, string> = {
  YUZDE: 'Yüzde indirim',
  TUTAR: 'Tutar indirim',
  UCRETSIZ_TESLIMAT: 'Ücretsiz teslimat',
};

const girisSinifi = 'w-full rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none';

const ozet = (k: Kampanya) => {
  if (k.tur === 'YUZDE') return `%${k.deger} indirim`;
  if (k.tur === 'TUTAR') return `${paraBicimle(k.deger)} indirim`;
  return 'Ücretsiz teslimat';
};

export const KampanyalarSekmesi = () => {
  const { kampanyalar, isLoading, kampanyalariGetir, kampanyaEkle, kampanyaGuncelle, kampanyaSil } = useIsletmeDeposu();
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<Kampanya | null>(null);

  useEffect(() => { kampanyalariGetir(); }, [kampanyalariGetir]);

  const formuAc = (k?: Kampanya) => { setDuzenlenen(k ?? null); setFormAcik(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white/40">{kampanyalar.length} kampanya</p>
        <button onClick={() => formuAc()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white gradient-btn shadow-lg shadow-orange-500/15">
          <Plus className="w-4 h-4" /> Yeni Kampanya
        </button>
      </div>

      {kampanyalar.length === 0 && !isLoading && (
        <p className="text-sm text-white/40 py-12 text-center">Henüz kampanya tanımlamadınız.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {kampanyalar.map(k => (
          <motion.div key={k.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 border border-white/10 bg-white/[0.03] flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-200 shrink-0" />
                <p className="text-sm font-bold text-white truncate">{k.ad}</p>
                {!k.aktif && <span className="text-[10px] font-bold text-amber-200 bg-amber-500/15 border border-amber-400/20 px-1.5 py-0.5 rounded">Pasif</span>}
              </div>
              <p className="text-xs text-orange-200/80 mt-1 font-bold">{ozet(k)}</p>
              <p className="text-[11px] text-white/40 mt-0.5">
                {TUR_ETIKET[k.tur]}{k.minSepetTutari > 0 ? ` · Min. ${paraBicimle(k.minSepetTutari)}` : ''}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button onClick={() => formuAc(k)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white" title="Düzenle">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => kampanyaGuncelle(k.id, { ad: k.ad, tur: k.tur, deger: k.deger, minSepetTutari: k.minSepetTutari, aktif: !k.aktif })}
                className={`p-2 rounded-lg hover:bg-white/10 ${k.aktif ? 'text-emerald-300' : 'text-white/40'}`} title={k.aktif ? 'Pasifleştir' : 'Aktifleştir'}>
                <Power className="w-4 h-4" />
              </button>
              <button onClick={() => kampanyaSil(k.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-300/70 hover:text-red-300" title="Sil">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {formAcik && (
        <KampanyaFormModali
          baslangic={duzenlenen}
          isLoading={isLoading}
          onKapat={() => setFormAcik(false)}
          onKaydet={async (form) => {
            const ok = duzenlenen ? await kampanyaGuncelle(duzenlenen.id, form) : await kampanyaEkle(form);
            if (ok) setFormAcik(false);
          }}
        />
      )}
    </div>
  );
};

const KampanyaFormModali = ({ baslangic, isLoading, onKapat, onKaydet }: {
  baslangic: Kampanya | null;
  isLoading: boolean;
  onKapat: () => void;
  onKaydet: (form: KampanyaFormu) => void;
}) => {
  const [form, setForm] = useState<KampanyaFormu>(baslangic
    ? { ad: baslangic.ad, tur: baslangic.tur, deger: baslangic.deger, minSepetTutari: baslangic.minSepetTutari, aktif: baslangic.aktif }
    : { ad: '', tur: 'YUZDE', deger: 10, minSepetTutari: 0, aktif: true });

  const degerGerekli = form.tur !== 'UCRETSIZ_TESLIMAT';
  const gecerli = form.ad.trim().length >= 2 && (!degerGerekli || (form.deger ?? 0) > 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onKapat}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl p-6 border border-white/10" style={{ background: 'rgba(14,14,28,0.98)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-white">{baslangic ? 'Kampanyayı Düzenle' : 'Yeni Kampanya'}</h2>
          <button onClick={onKapat} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-white/60 mb-1.5">Kampanya Adı *</label>
            <input className={girisSinifi} value={form.ad} onChange={e => setForm(f => ({ ...f, ad: e.target.value }))} placeholder="örn. Öğrenciye özel %15" />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/60 mb-1.5">Tür</label>
            <select className={girisSinifi} value={form.tur} onChange={e => setForm(f => ({ ...f, tur: e.target.value as KampanyaTuru }))}>
              <option value="YUZDE">Yüzde indirim (%)</option>
              <option value="TUTAR">Tutar indirim (₺)</option>
              <option value="UCRETSIZ_TESLIMAT">Ücretsiz teslimat</option>
            </select>
          </div>
          {degerGerekli && (
            <div>
              <label className="block text-xs font-bold text-white/60 mb-1.5">{form.tur === 'YUZDE' ? 'Yüzde (%)' : 'Tutar (₺)'}</label>
              <input type="number" min={0} step={form.tur === 'YUZDE' ? 1 : 0.5} className={girisSinifi} value={form.deger ?? 0}
                onChange={e => setForm(f => ({ ...f, deger: parseFloat(e.target.value) || 0 }))} />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-white/60 mb-1.5">Minimum Sepet Tutarı (₺)</label>
            <input type="number" min={0} step="0.5" className={girisSinifi} value={form.minSepetTutari ?? 0}
              onChange={e => setForm(f => ({ ...f, minSepetTutari: parseFloat(e.target.value) || 0 }))} />
          </div>
          <button onClick={() => setForm(f => ({ ...f, aktif: !f.aktif }))}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${form.aktif ? 'text-emerald-200 bg-emerald-500/15 border-emerald-400/20' : 'text-white/50 bg-white/5 border-white/10'}`}>
            <Power className="w-4 h-4" /> {form.aktif ? 'Aktif' : 'Pasif'}
          </button>
        </div>

        <button disabled={!gecerli || isLoading} onClick={() => onKaydet({ ...form, ad: form.ad.trim() })}
          className="w-full mt-5 px-4 py-3 rounded-xl text-sm font-extrabold text-white gradient-btn shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
          {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </motion.div>
    </div>
  );
};
