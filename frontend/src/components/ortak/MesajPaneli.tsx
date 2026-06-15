import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { useMesajDeposu, type Konusma } from '../../depolar/mesajDeposu';
import { useKimlikDeposu } from '../../depolar/kimlikDeposu';

/**
 * Yeniden kullanılabilir mesajlaşma paneli. Modül + bağlam (ör. RIDE + talepId, FOOD + siparisId)
 * verilir; konuşma message-service'ten çözülür, mesajlar SSE ile anlık akar.
 */
export const MesajPaneli = ({ modul, baglamId }: { modul: string; baglamId: string }) => {
  const benimId = useKimlikDeposu(s => s.user?.id);
  const { mesajlar, baglamdanGetir, mesajlariGetir, gonder, akisBaslat } = useMesajDeposu();
  const [konusma, setKonusma] = useState<Konusma | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [metin, setMetin] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const altRef = useRef<HTMLDivElement>(null);

  const liste = konusma ? (mesajlar[konusma.id] ?? []) : [];

  useEffect(() => {
    akisBaslat();
    let iptal = false;
    (async () => {
      setYukleniyor(true);
      const k = await baglamdanGetir(modul, baglamId);
      if (iptal) return;
      setKonusma(k);
      if (k) await mesajlariGetir(k.id);
      setYukleniyor(false);
    })();
    return () => { iptal = true; };
  }, [modul, baglamId, baglamdanGetir, mesajlariGetir, akisBaslat]);

  useEffect(() => { altRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [liste.length]);

  const gonderHandle = async () => {
    if (!konusma || !metin.trim()) return;
    setGonderiliyor(true);
    const ok = await gonder(konusma.id, metin.trim());
    if (ok) setMetin('');
    setGonderiliyor(false);
  };

  if (yukleniyor) {
    return <div className="flex items-center gap-2 p-4 text-xs text-white/40"><Loader2 className="h-4 w-4 animate-spin" /> Konuşma yükleniyor…</div>;
  }
  if (!konusma) {
    return <div className="p-4 text-xs text-white/40">Bu kayıt için henüz bir konuşma açılmadı.</div>;
  }

  const kapali = konusma.durum === 'KAPALI';

  return (
    <div className="flex h-80 flex-col rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs font-black text-white/70">
        <MessageCircle className="h-4 w-4 text-cyan-300" />
        {konusma.karsiTarafAdSoyad || konusma.baslik || 'Mesajlar'}
        {kapali && <span className="ml-auto rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/40">Kapalı</span>}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {liste.length === 0 && <p className="py-8 text-center text-xs text-white/30">Henüz mesaj yok. İlk mesajı siz yazın.</p>}
        {liste.map(m => {
          const benim = m.gondericiKullaniciId === benimId;
          return (
            <div key={m.id} className={`flex ${benim ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${benim ? 'bg-cyan-500/25 text-cyan-50' : 'bg-white/[0.06] text-white/80'}`}>
                {!benim && <p className="mb-0.5 text-[10px] font-bold text-white/40">{m.gondericiAdSoyad || 'Kullanıcı'}</p>}
                <p className="leading-snug whitespace-pre-wrap break-words">{m.icerik}</p>
                <p className="mt-1 text-[9px] text-white/35">{new Date(m.olusturulmaTarihi).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          );
        })}
        <div ref={altRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 p-2">
        <input
          value={metin}
          onChange={e => setMetin(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); gonderHandle(); } }}
          disabled={kapali}
          placeholder={kapali ? 'Konuşma kapandı' : 'Mesaj yazın…'}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/50 disabled:opacity-50"
        />
        <button
          onClick={gonderHandle}
          disabled={kapali || gonderiliyor || !metin.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-500 text-white disabled:opacity-40"
        >
          {gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};
