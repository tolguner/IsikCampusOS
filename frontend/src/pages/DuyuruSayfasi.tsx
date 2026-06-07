import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ImagePlus, Link as LinkIcon, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useBildirimDeposu } from '../depolar/bildirimDeposu';
import { useKimlikDeposu } from '../depolar/kimlikDeposu';
import { rolleriAyir } from '../yardimcilar/yetkiler';

const inputClass =
  'w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-pink-400/60';

const KURUMSAL_AD: Record<string, string> = {
  ROLE_ADMIN: 'Sistem Yönetimi',
  ROLE_REGISTRAR: 'Öğrenci İşleri Daire Başkanlığı',
  ROLE_FACILITY_ADMIN: 'Spor Müdürlüğü',
  ROLE_SKS_ADMIN: 'Sağlık Kültür ve Spor Müdürlüğü',
};

export const DuyuruSayfasi = () => {
  const navigate = useNavigate();
  const user = useKimlikDeposu(s => s.user);
  const topluDuyuruGonder = useBildirimDeposu(s => s.topluDuyuruGonder);
  const yukleniyor = useBildirimDeposu(s => s.yukleniyor);
  const hata = useBildirimDeposu(s => s.hata);

  const roller = rolleriAyir(user?.roller);
  const sistemYoneticisiMi = roller.includes('ROLE_ADMIN');
  const gonderenAdi = useMemo(() => {
    const rol = roller.find(r => KURUMSAL_AD[r]);
    return rol ? KURUMSAL_AD[rol] : 'Kampüs Yönetimi';
  }, [roller]);

  const [form, setForm] = useState({
    baslik: '',
    mesaj: '',
    baglantiUrl: '',
    baglantiEtiketi: '',
    resimUrl: '',
    hedefKitle: 'TUM_OGRENCILER' as 'TUM_OGRENCILER' | 'TUM_KULLANICILAR',
  });
  const [basari, setBasari] = useState(false);

  const gecerli = form.baslik.trim().length > 0 && form.mesaj.trim().length > 0;

  const gorselSec = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !['image/png', 'image/jpeg'].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, resimUrl: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const gonder = async () => {
    const ok = await topluDuyuruGonder({
      baslik: form.baslik,
      mesaj: form.mesaj,
      baglantiUrl: form.baglantiUrl || undefined,
      baglantiEtiketi: form.baglantiEtiketi || undefined,
      resimUrl: form.resimUrl || undefined,
      hedefKitle: sistemYoneticisiMi ? form.hedefKitle : 'TUM_OGRENCILER',
    });
    if (ok) setBasari(true);
  };

  const yeniDuyuru = () => {
    setBasari(false);
    setForm({ baslik: '', mesaj: '', baglantiUrl: '', baglantiEtiketi: '', resimUrl: '', hedefKitle: 'TUM_OGRENCILER' });
  };

  const hedefEtiketi = sistemYoneticisiMi && form.hedefKitle === 'TUM_KULLANICILAR' ? 'Tüm kullanıcılar' : 'Tüm öğrenciler';

  return (
    <div className="space-y-6 text-white pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-pink-300/25 bg-pink-500/10 text-pink-200">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-normal text-white">Duyuru Oluştur</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/45">
              {gonderenAdi} adına kurumsal bir duyuru hazırlayın. Duyuru, seçilen hedef kitleye bildirim olarak iletilir.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </button>
      </div>

      {hata && (
        <div className="rounded-2xl px-4 py-3 text-sm font-semibold border border-red-400/25 bg-red-500/12 text-red-100">{hata}</div>
      )}

      {basari ? (
        <div className="rounded-3xl border border-emerald-300/25 bg-emerald-500/[0.07] p-10 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
          <div className="text-lg font-black text-white">Duyuru {hedefEtiketi.toLocaleLowerCase('tr-TR')}'a gönderildi.</div>
          <div className="flex justify-center gap-3">
            <button onClick={yeniDuyuru} className="rounded-2xl bg-pink-500 hover:bg-pink-400 px-5 py-2.5 text-sm font-bold text-white cursor-pointer">Yeni Duyuru</button>
            <button onClick={() => navigate(-1)} className="rounded-2xl bg-white/10 hover:bg-white/15 px-5 py-2.5 text-sm font-bold text-white cursor-pointer">Panele Dön</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
          {/* Form */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 space-y-5">
            {sistemYoneticisiMi && (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/35">Hedef Kitle</label>
                <select className={inputClass} value={form.hedefKitle} onChange={e => setForm(p => ({ ...p, hedefKitle: e.target.value as 'TUM_OGRENCILER' | 'TUM_KULLANICILAR' }))}>
                  <option value="TUM_OGRENCILER">Tüm öğrenciler</option>
                  <option value="TUM_KULLANICILAR">Tüm kullanıcılar (öğrenciler + personel)</option>
                </select>
              </div>
            )}
            {!sistemYoneticisiMi && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-white/55">
                Hedef kitle: <span className="text-white/80">Tüm öğrenciler</span>
              </div>
            )}

            <input className={inputClass} maxLength={140} placeholder="Duyuru başlığı" value={form.baslik} onChange={e => setForm(p => ({ ...p, baslik: e.target.value }))} />
            <textarea className={`${inputClass} min-h-44 resize-none`} maxLength={3000} placeholder="Duyuru metni" value={form.mesaj} onChange={e => setForm(p => ({ ...p, mesaj: e.target.value }))} />
            <p className="-mt-3 text-xs text-white/35">{form.mesaj.trim().length}/3000 karakter</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input className={`${inputClass} pl-11`} type="url" placeholder="Bağlantı URL'si (ops.)" value={form.baglantiUrl} onChange={e => setForm(p => ({ ...p, baglantiUrl: e.target.value }))} />
              </div>
              <input className={inputClass} placeholder="Bağlantı etiketi (örn. Başvuru formu)" value={form.baglantiEtiketi} onChange={e => setForm(p => ({ ...p, baglantiEtiketi: e.target.value }))} />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border border-white/10 bg-[#111123] overflow-hidden flex items-center justify-center shrink-0">
                  {form.resimUrl ? <img src={form.resimUrl} alt="Duyuru görseli" className="w-full h-full object-cover" /> : <ImagePlus className="w-7 h-7 text-white/35" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">Görsel içerik</div>
                  <p className="text-xs text-white/40 mt-1">PNG veya JPG eklenebilir; bildirim önizlemesinde gösterilir.</p>
                  <input type="file" accept="image/png,image/jpeg" onChange={gorselSec} className="mt-3 block w-full text-sm text-white/65 file:mr-4 file:rounded-xl file:border-0 file:bg-pink-500/20 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-pink-100 hover:file:bg-pink-500/30" />
                </div>
                {form.resimUrl && (
                  <button type="button" onClick={() => setForm(p => ({ ...p, resimUrl: '' }))} className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 cursor-pointer">Görseli kaldır</button>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!gecerli || yukleniyor}
              onClick={gonder}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-500 hover:bg-pink-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-black text-white cursor-pointer"
            >
              <Send className="h-4 w-4" />
              {yukleniyor ? 'Gönderiliyor...' : `Duyuruyu Gönder (${hedefEtiketi})`}
            </button>
          </section>

          {/* Canlı önizleme */}
          <aside className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 h-fit">
            <div className="flex items-center gap-2 text-sm font-black text-white mb-4">
              <Megaphone className="w-4 h-4 text-pink-300" />
              Canlı Önizleme
            </div>
            <article className="rounded-3xl border border-white/10 bg-[#111123] overflow-hidden">
              {form.resimUrl && <img src={form.resimUrl} alt="Duyuru önizleme" className="w-full max-h-56 object-cover" />}
              <div className="p-5 space-y-3">
                <span className="rounded-full px-3 py-1 text-xs font-bold text-pink-100 bg-pink-500/15 border border-pink-400/20">{hedefEtiketi}</span>
                <h3 className="text-2xl font-black text-white leading-tight">{form.baslik || 'Duyuru başlığı'}</h3>
                <p className="text-xs font-semibold text-white/35">Gönderen: <span className="text-white/60">{gonderenAdi}</span></p>
                <p className="text-sm text-white/50 whitespace-pre-line leading-relaxed">{form.mesaj || 'Duyuru metni burada önizlenir.'}</p>
                {form.baglantiUrl && (
                  <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-cyan-100 bg-cyan-500/10 border border-cyan-400/20">
                    <LinkIcon className="w-4 h-4" />
                    {form.baglantiEtiketi || form.baglantiUrl}
                  </div>
                )}
              </div>
            </article>
          </aside>
        </div>
      )}
    </div>
  );
};
