import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, X, UserRound, Mail, PauseCircle, PlayCircle } from 'lucide-react';
import { useIsletmePersonelDeposu, type PersonelFormu } from '../../depolar/isletmePersonelDeposu';

const girisSinifi = 'w-full rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none';

const bosForm: PersonelFormu = { ad: '', soyad: '', eposta: '', tcKimlikNo: '', rol: 'PERSONEL' };

export const PersonelSekmesi = () => {
  const { personeller, isLoading, error, successMessage, personelleriGetir, personelEkle, personelDurum, personelCikar, clearMessages } =
    useIsletmePersonelDeposu();
  const [formAcik, setFormAcik] = useState(false);
  const [form, setForm] = useState<PersonelFormu>(bosForm);

  useEffect(() => { personelleriGetir(); }, [personelleriGetir]);
  useEffect(() => () => clearMessages(), [clearMessages]);

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await personelEkle(form);
    if (ok) { setForm(bosForm); setFormAcik(false); }
  };

  const cikar = (kullaniciId: string, ad: string) => {
    if (window.confirm(`${ad || 'Personel'} işletmeden çıkarılsın mı? Giriş hesabı silinecek.`)) {
      personelCikar(kullaniciId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white/40">{personeller.length} personel</p>
        <button onClick={() => { setForm(bosForm); setFormAcik(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white gradient-btn shadow-lg shadow-orange-500/15">
          <Plus className="w-4 h-4" /> Yeni Personel
        </button>
      </div>

      {(error || successMessage) && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold border ${error ? 'text-red-200 bg-red-500/10 border-red-400/20' : 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20'}`}>
          {error || successMessage}
        </div>
      )}

      {formAcik && (
        <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={kaydet}
          className="rounded-2xl p-4 border border-white/10 bg-white/[0.03] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Yeni Personel</p>
            <button type="button" onClick={() => setFormAcik(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className={girisSinifi} placeholder="Ad" value={form.ad}
              onChange={e => setForm({ ...form, ad: e.target.value })} required />
            <input className={girisSinifi} placeholder="Soyad" value={form.soyad}
              onChange={e => setForm({ ...form, soyad: e.target.value })} />
            <input className={girisSinifi} type="email" placeholder="E-posta (giriş için)" value={form.eposta}
              onChange={e => setForm({ ...form, eposta: e.target.value })} required />
            <input className={girisSinifi} placeholder="TC Kimlik No (11 hane)" value={form.tcKimlikNo}
              inputMode="numeric" maxLength={11}
              onChange={e => setForm({ ...form, tcKimlikNo: e.target.value.replace(/\D/g, '') })} required />
          </div>
          <div>
            <p className="text-xs font-bold text-white/50 mb-1.5">Görev</p>
            <div className="flex gap-2">
              {([['PERSONEL', '👨‍🍳 Personel — sipariş kabul/hazırlık'], ['KURYE', '🛵 Kurye — yalnız teslimat']] as const).map(([deger, etiket]) => (
                <button key={deger} type="button" onClick={() => setForm({ ...form, rol: deger })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${form.rol === deger ? 'text-orange-100 bg-orange-500/20 border-orange-400/40' : 'text-white/55 bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  {etiket}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-white/40">
            Personel kendi e-posta/şifresiyle giriş yapar. Varsayılan şifre = TC Kimlik No; ilk girişte değiştirmesi istenir.
            Personel sipariş sürecini yürütür; kurye yalnızca "yola çıkar / teslim et" aşamalarını görür.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFormAcik(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-white/60 bg-white/5 border border-white/10">İptal</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-xl text-sm font-bold text-white gradient-btn disabled:opacity-50">Kaydet</button>
          </div>
        </motion.form>
      )}

      {personeller.length === 0 && !isLoading && (
        <p className="text-sm text-white/40 py-12 text-center">Henüz personel eklemediniz.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {personeller.map(p => (
          <motion.div key={p.kullaniciId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 border border-white/10 bg-white/[0.03] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/30 to-pink-500/20 border border-white/10 flex items-center justify-center shrink-0">
                <UserRound className="w-4 h-4 text-orange-200" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {p.ad || 'Personel'}
                  {p.rol === 'KURYE' && (
                    <span className="ml-2 text-[10px] font-bold text-cyan-200 bg-cyan-500/15 border border-cyan-400/20 px-1.5 py-0.5 rounded">🛵 Kurye</span>
                  )}
                  {p.durum === 'PASIF' && (
                    <span className="ml-2 text-[10px] font-bold text-amber-200 bg-amber-500/15 border border-amber-400/20 px-1.5 py-0.5 rounded">Askıda</span>
                  )}
                </p>
                <p className="inline-flex items-center gap-1 text-[11px] text-white/40 truncate"><Mail className="w-3 h-3" /> {p.eposta}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {p.durum === 'PASIF' ? (
                <button onClick={() => personelDurum(p.kullaniciId, 'AKTIF')} title="Aktifleştir"
                  className="p-2 rounded-lg text-emerald-200/70 hover:text-emerald-200 hover:bg-emerald-500/10 transition-colors">
                  <PlayCircle className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => personelDurum(p.kullaniciId, 'PASIF')} title="Askıya al (giriş kalır, işletme erişimi kapanır)"
                  className="p-2 rounded-lg text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10 transition-colors">
                  <PauseCircle className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => cikar(p.kullaniciId, p.ad)} title="İşletmeden çıkar"
                className="p-2 rounded-lg text-red-200/70 hover:text-red-200 hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
