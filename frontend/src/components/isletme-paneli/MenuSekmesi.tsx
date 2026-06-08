import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, X, EyeOff, Eye, Star } from 'lucide-react';
import { useIsletmeDeposu, type MenuOgesiFormu } from '../../depolar/isletmeDeposu';
import type { MenuOgesi } from '../../depolar/yemekDeposu';

const paraBicimle = (t: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);

const BOS_FORM: MenuOgesiFormu = { ad: '', aciklama: '', kategori: '', fiyat: 0, gorselUrl: '', mevcut: true };

export const MenuSekmesi = () => {
  const { menu, isLoading, menumGetir, menuEkle, menuGuncelle, menuSil } = useIsletmeDeposu();
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<MenuOgesi | null>(null);

  useEffect(() => { menumGetir(); }, [menumGetir]);

  const formuAc = (oge?: MenuOgesi) => { setDuzenlenen(oge ?? null); setFormAcik(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white/40">{menu.length} ürün</p>
        <button
          onClick={() => formuAc()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white gradient-btn shadow-lg shadow-orange-500/15"
        >
          <Plus className="w-4 h-4" /> Yeni Ürün
        </button>
      </div>

      {menu.length === 0 && !isLoading && (
        <p className="text-sm text-white/40 py-12 text-center">Henüz ürün eklemediniz.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {menu.map(oge => (
          <motion.div key={oge.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 border border-white/10 bg-white/[0.03] flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white truncate">{oge.ad}</p>
                {!oge.mevcut && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-200 bg-amber-500/15 border border-amber-400/20 px-1.5 py-0.5 rounded"><EyeOff className="w-3 h-3" /> Pasif</span>}
              </div>
              {oge.kategori && <p className="text-[11px] text-white/35 mt-0.5">{oge.kategori}</p>}
              {oge.aciklama && <p className="text-xs text-white/40 mt-1 line-clamp-2">{oge.aciklama}</p>}
              <p className="text-sm font-extrabold text-orange-200 mt-1.5">{paraBicimle(oge.fiyat)}</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button onClick={() => formuAc(oge)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white" title="Düzenle">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => menuSil(oge.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-300/70 hover:text-red-300" title="Menüden kaldır">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {formAcik && (
        <MenuFormModali
          baslangic={duzenlenen}
          isLoading={isLoading}
          onKapat={() => setFormAcik(false)}
          onKaydet={async (form) => {
            const ok = duzenlenen ? await menuGuncelle(duzenlenen.id, form) : await menuEkle(form);
            if (ok) setFormAcik(false);
          }}
        />
      )}
    </div>
  );
};

const MenuFormModali = ({ baslangic, isLoading, onKapat, onKaydet }: {
  baslangic: MenuOgesi | null;
  isLoading: boolean;
  onKapat: () => void;
  onKaydet: (form: MenuOgesiFormu) => void;
}) => {
  const [form, setForm] = useState<MenuOgesiFormu>(baslangic ? {
    ad: baslangic.ad, aciklama: baslangic.aciklama ?? '', kategori: baslangic.kategori ?? '',
    fiyat: baslangic.fiyat, gorselUrl: baslangic.gorselUrl ?? '', mevcut: baslangic.mevcut,
    oneCikan: baslangic.oneCikan ?? false,
    secenekGruplari: (baslangic.secenekGruplari ?? []).map(g => ({
      ad: g.ad, tur: g.tur, zorunlu: g.zorunlu, siralama: g.siralama,
      secenekler: g.secenekler.map(s => ({ ad: s.ad, ekFiyat: s.ekFiyat, siralama: s.siralama })),
    })),
  } : { ...BOS_FORM, oneCikan: false, secenekGruplari: [] });

  const gecerli = form.ad.trim().length >= 2 && form.fiyat > 0;
  const guncelle = (k: Partial<MenuOgesiFormu>) => setForm(f => ({ ...f, ...k }));

  const gruplar = form.secenekGruplari ?? [];
  const grupEkle = () => guncelle({ secenekGruplari: [...gruplar, { ad: '', tur: 'TEK_SECIM', zorunlu: false, secenekler: [] }] });
  const grupSil = (gi: number) => guncelle({ secenekGruplari: gruplar.filter((_, i) => i !== gi) });
  const grupGuncelle = (gi: number, k: Partial<typeof gruplar[number]>) =>
    guncelle({ secenekGruplari: gruplar.map((g, i) => i === gi ? { ...g, ...k } : g) });
  const secenekEkle = (gi: number) => grupGuncelle(gi, { secenekler: [...gruplar[gi].secenekler, { ad: '', ekFiyat: 0 }] });
  const secenekSil = (gi: number, si: number) => grupGuncelle(gi, { secenekler: gruplar[gi].secenekler.filter((_, i) => i !== si) });
  const secenekGuncelle = (gi: number, si: number, k: Partial<{ ad: string; ekFiyat: number }>) =>
    grupGuncelle(gi, { secenekler: gruplar[gi].secenekler.map((s, i) => i === si ? { ...s, ...k } : s) });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onKapat}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl p-6 border border-white/10 max-h-[88vh] overflow-y-auto" style={{ background: 'rgba(14,14,28,0.98)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-white">{baslangic ? 'Ürünü Düzenle' : 'Yeni Ürün'}</h2>
          <button onClick={onKapat} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <Alan etiket="Ürün Adı *">
            <input value={form.ad} onChange={e => guncelle({ ad: e.target.value })} className={girisSinifi} placeholder="Örn. Tavuklu Sandviç" />
          </Alan>
          <div className="grid grid-cols-2 gap-3">
            <Alan etiket="Kategori">
              <input value={form.kategori} onChange={e => guncelle({ kategori: e.target.value })} className={girisSinifi} placeholder="Sandviç" />
            </Alan>
            <Alan etiket="Fiyat (₺) *">
              <input type="number" min={0} step="0.01" value={form.fiyat || ''} onChange={e => guncelle({ fiyat: parseFloat(e.target.value) || 0 })} className={girisSinifi} placeholder="65.00" />
            </Alan>
          </div>
          <Alan etiket="Açıklama">
            <input value={form.aciklama} onChange={e => guncelle({ aciklama: e.target.value })} className={girisSinifi} placeholder="İzgara tavuk, marul, domates" />
          </Alan>
          <Alan etiket="Görsel URL">
            <input value={form.gorselUrl} onChange={e => guncelle({ gorselUrl: e.target.value })} className={girisSinifi} placeholder="https://..." />
          </Alan>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => guncelle({ mevcut: !form.mevcut })}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${form.mevcut ? 'text-emerald-200 bg-emerald-500/15 border-emerald-400/20' : 'text-white/50 bg-white/5 border-white/10'}`}
            >
              {form.mevcut ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {form.mevcut ? 'Satışta' : 'Satış dışı'}
            </button>
            <button
              onClick={() => guncelle({ oneCikan: !form.oneCikan })}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${form.oneCikan ? 'text-amber-200 bg-amber-500/15 border-amber-400/20' : 'text-white/50 bg-white/5 border-white/10'}`}
            >
              <Star className={`w-4 h-4 ${form.oneCikan ? 'fill-amber-300 text-amber-300' : ''}`} /> Öne çıkan
            </button>
          </div>

          {/* Seçenek grupları */}
          <div className="border-t border-white/8 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-white/60">Seçenek Grupları (boy, ekstra...)</p>
              <button onClick={grupEkle} className="inline-flex items-center gap-1 text-xs font-bold text-orange-200 hover:text-orange-100">
                <Plus className="w-3.5 h-3.5" /> Grup
              </button>
            </div>
            <div className="space-y-3">
              {gruplar.map((g, gi) => (
                <div key={gi} className="rounded-xl p-3 border border-white/10 bg-white/[0.02] space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={g.ad} onChange={e => grupGuncelle(gi, { ad: e.target.value })} placeholder="Grup adı (örn. Boy)" className={`${girisSinifi} flex-1`} />
                    <button onClick={() => grupSil(gi)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-300/70"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={g.tur} onChange={e => grupGuncelle(gi, { tur: e.target.value as 'TEK_SECIM' | 'COKLU_SECIM' })} className={girisSinifi}>
                      <option value="TEK_SECIM">Tek seçim</option>
                      <option value="COKLU_SECIM">Çoklu seçim</option>
                    </select>
                    <button onClick={() => grupGuncelle(gi, { zorunlu: !g.zorunlu })}
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border ${g.zorunlu ? 'text-amber-200 bg-amber-500/15 border-amber-400/20' : 'text-white/50 bg-white/5 border-white/10'}`}>
                      {g.zorunlu ? 'Zorunlu' : 'İsteğe bağlı'}
                    </button>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    {g.secenekler.map((s, si) => (
                      <div key={si} className="flex items-center gap-2">
                        <input value={s.ad} onChange={e => secenekGuncelle(gi, si, { ad: e.target.value })} placeholder="Seçenek (örn. Büyük)" className={`${girisSinifi} flex-1`} />
                        <div className="relative w-24 shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-white/30">+₺</span>
                          <input type="number" min={0} step="0.5" value={s.ekFiyat || ''} onChange={e => secenekGuncelle(gi, si, { ekFiyat: parseFloat(e.target.value) || 0 })} className={`${girisSinifi} pl-7`} placeholder="0" />
                        </div>
                        <button onClick={() => secenekSil(gi, si)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300/60"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    <button onClick={() => secenekEkle(gi)} className="inline-flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-white/80">
                      <Plus className="w-3 h-3" /> Seçenek ekle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          disabled={!gecerli || isLoading}
          onClick={() => onKaydet({ ...form, ad: form.ad.trim() })}
          className="w-full mt-5 px-4 py-3 rounded-xl text-sm font-extrabold text-white gradient-btn shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </motion.div>
    </div>
  );
};

const girisSinifi = 'w-full rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none';

const Alan = ({ etiket, children }: { etiket: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-white/60 mb-1.5">{etiket}</label>
    {children}
  </div>
);
