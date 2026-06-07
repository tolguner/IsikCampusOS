import { useState } from 'react';
import { Megaphone, X, Send } from 'lucide-react';
import { useBildirimDeposu } from '../depolar/bildirimDeposu';

const inputClass =
  'w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-pink-400/60';

/**
 * İdari rollerin (Öğrenci İşleri / Spor Müdürlüğü / Sistem Yönetimi) tüm öğrencilere
 * kurumsal toplu duyuru göndermesi için paylaşılan buton + modal.
 * Gönderenin kurumsal kimliği backend'te JWT rolünden çözülür ve öğrenciye gösterilir.
 */
export const OgrenciDuyuruButonu = () => {
  const ogrencilereDuyuruGonder = useBildirimDeposu(s => s.ogrencilereDuyuruGonder);
  const [acik, setAcik] = useState(false);
  const [form, setForm] = useState({ baslik: '', mesaj: '', baglantiUrl: '', baglantiEtiketi: '' });
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [basari, setBasari] = useState(false);

  const gecerli = form.baslik.trim().length > 0 && form.mesaj.trim().length > 0;

  const kapat = () => {
    setAcik(false);
    setBasari(false);
    setForm({ baslik: '', mesaj: '', baglantiUrl: '', baglantiEtiketi: '' });
  };

  const gonder = async () => {
    setGonderiliyor(true);
    const ok = await ogrencilereDuyuruGonder({
      baslik: form.baslik,
      mesaj: form.mesaj,
      baglantiUrl: form.baglantiUrl || undefined,
      baglantiEtiketi: form.baglantiEtiketi || undefined,
    });
    setGonderiliyor(false);
    if (ok) setBasari(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik(true)}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-pink-400/25 bg-pink-500/10 px-4 py-3 text-sm font-bold text-pink-100 transition hover:bg-pink-500/20 cursor-pointer"
      >
        <Megaphone className="h-4 w-4" />
        Öğrencilere Duyuru
      </button>

      {acik && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl p-6 space-y-5 relative text-white bg-[#0f0f1c] border border-white/10 shadow-2xl">
            <button type="button" onClick={kapat} className="absolute top-4 right-4 text-white/40 hover:text-white/70 cursor-pointer"><X className="h-5 w-5" /></button>

            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-pink-300/25 bg-pink-500/10 text-pink-200">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black">Öğrencilere Toplu Duyuru</h3>
                <p className="text-xs text-white/40">Tüm öğrencilere kurumsal kimliğinizle iletilir.</p>
              </div>
            </div>

            {basari ? (
              <div className="rounded-2xl border border-emerald-300/25 bg-emerald-500/12 px-4 py-6 text-center text-sm font-semibold text-emerald-100">
                Duyuru tüm öğrencilere gönderildi. ✓
                <div className="mt-4">
                  <button onClick={kapat} className="rounded-2xl bg-white/10 hover:bg-white/15 px-5 py-2.5 text-sm font-bold text-white cursor-pointer">Kapat</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input className={inputClass} maxLength={140} placeholder="Duyuru başlığı" value={form.baslik} onChange={e => setForm(p => ({ ...p, baslik: e.target.value }))} />
                <textarea className={`${inputClass} min-h-32 resize-none`} maxLength={3000} placeholder="Duyuru metni" value={form.mesaj} onChange={e => setForm(p => ({ ...p, mesaj: e.target.value }))} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className={inputClass} type="url" placeholder="Bağlantı URL'si (ops.)" value={form.baglantiUrl} onChange={e => setForm(p => ({ ...p, baglantiUrl: e.target.value }))} />
                  <input className={inputClass} placeholder="Bağlantı etiketi (ops.)" value={form.baglantiEtiketi} onChange={e => setForm(p => ({ ...p, baglantiEtiketi: e.target.value }))} />
                </div>
                <p className="text-xs text-white/35">Bu duyuru <b className="text-white/60">tüm öğrencilere</b> bildirim olarak iletilecektir.</p>
                <button
                  type="button"
                  disabled={!gecerli || gonderiliyor}
                  onClick={gonder}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-pink-500 hover:bg-pink-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 text-sm font-black text-white cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  {gonderiliyor ? 'Gönderiliyor...' : 'Duyuruyu Gönder'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
