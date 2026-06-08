import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, CreditCard, ShoppingBag } from 'lucide-react';
import { useIsletmeDeposu } from '../../depolar/isletmeDeposu';

const paraBicimle = (t: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);

const bugun = () => new Date().toISOString().slice(0, 10);
const gunOnce = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

export const CiroSekmesi = () => {
  const { ciro, isLoading, ciroGetir } = useIsletmeDeposu();
  const [baslangic, setBaslangic] = useState(gunOnce(30));
  const [bitis, setBitis] = useState(bugun());

  useEffect(() => { ciroGetir(baslangic, bitis); }, [ciroGetir]); // eslint-disable-line react-hooks/exhaustive-deps

  const hizliAralik = (gun: number) => {
    const b = gunOnce(gun); const s = bugun();
    setBaslangic(b); setBitis(s); ciroGetir(b, s);
  };

  return (
    <div className="space-y-5">
      {/* Tarih aralığı */}
      <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.03] flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-bold text-white/60 mb-1.5">Başlangıç</label>
          <input type="date" value={baslangic} onChange={e => setBaslangic(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none [color-scheme:dark]" />
        </div>
        <div>
          <label className="block text-xs font-bold text-white/60 mb-1.5">Bitiş</label>
          <input type="date" value={bitis} onChange={e => setBitis(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none [color-scheme:dark]" />
        </div>
        <button onClick={() => ciroGetir(baslangic, bitis)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white gradient-btn shadow-lg shadow-orange-500/15">
          Raporla
        </button>
        <div className="flex gap-1.5 ml-auto">
          {[['Bugün', 0], ['7 gün', 7], ['30 gün', 30]].map(([etiket, gun]) => (
            <button key={etiket as string} onClick={() => hizliAralik(gun as number)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
              {etiket}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !ciro && <p className="text-sm text-white/40">Rapor yükleniyor...</p>}

      {ciro && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KartIstatistik ikon={<TrendingUp className="w-5 h-5" />} etiket="Toplam Ciro" deger={paraBicimle(ciro.toplamCiro)} vurgu />
          <KartIstatistik ikon={<ShoppingBag className="w-5 h-5" />} etiket="Teslim Edilen Sipariş" deger={String(ciro.siparisSayisi)} />
          <KartIstatistik ikon={<Wallet className="w-5 h-5" />} etiket="Nakit Tahsilat" deger={paraBicimle(ciro.nakitToplam)} />
          <KartIstatistik ikon={<CreditCard className="w-5 h-5" />} etiket="Kredi Kartı Tahsilat" deger={paraBicimle(ciro.krediKartiToplam)} />
        </div>
      )}

      <p className="text-[11px] text-white/30">
        Ciro yalnızca <span className="text-white/50 font-semibold">teslim edilen</span> online siparişlerden hesaplanır; tahsilat,
        kuryenin teslimde işaretlediği gerçek ödeme yöntemine göre ayrılır.
      </p>
    </div>
  );
};

const KartIstatistik = ({ ikon, etiket, deger, vurgu }: {
  ikon: React.ReactNode; etiket: string; deger: string; vurgu?: boolean;
}) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl p-5 border ${vurgu ? 'border-orange-400/25 bg-gradient-to-br from-orange-500/15 to-pink-500/10' : 'border-white/10 bg-white/[0.03]'}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${vurgu ? 'bg-orange-500/25 text-orange-100' : 'bg-white/8 text-white/60'}`}>
      {ikon}
    </div>
    <p className="text-xs font-bold text-white/45">{etiket}</p>
    <p className={`text-2xl font-extrabold mt-1 ${vurgu ? 'text-orange-100' : 'text-white'}`}>{deger}</p>
  </motion.div>
);
