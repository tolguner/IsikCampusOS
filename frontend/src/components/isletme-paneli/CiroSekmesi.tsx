import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, CreditCard, ShoppingBag, ListChecks, Clock, User, UserCog } from 'lucide-react';
import { useIsletmeDeposu, type CiroKaydi } from '../../depolar/isletmeDeposu';
import { SIPARIS_DURUM_BILGISI, type SiparisDurumu } from '../../depolar/yemekDeposu';

const paraBicimle = (t: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);
const tarihBicimle = (t?: string) => t ? new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

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

      {ciro && (
        <>
          {/* İkincil sayımlar */}
          <div className="grid grid-cols-3 gap-3">
            <MiniIstatistik etiket="Toplam Sipariş" deger={ciro.toplamSiparis} renk="notr" />
            <MiniIstatistik etiket="Müşteri İptali" deger={ciro.iptalSayisi} renk="amber" />
            <MiniIstatistik etiket="Reddedilen" deger={ciro.redSayisi} renk="red" />
          </div>

          {/* Sipariş hareketleri (aktivite günlüğü) */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-white/50" />
              <p className="text-sm font-bold text-white/80">Sipariş Hareketleri</p>
              <span className="text-xs text-white/35">({ciro.kayitlar.length})</span>
            </div>
            {ciro.kayitlar.length === 0 ? (
              <p className="text-sm text-white/40 px-4 py-8 text-center">Bu aralıkta sipariş hareketi yok.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {ciro.kayitlar.map(k => <KayitSatiri key={k.siparisId} kayit={k} />)}
              </div>
            )}
          </div>
        </>
      )}

      <p className="text-[11px] text-white/30">
        Ciro yalnızca <span className="text-white/50 font-semibold">teslim edilen</span> online siparişlerden hesaplanır; tahsilat,
        kuryenin teslimde işaretlediği gerçek ödeme yöntemine göre ayrılır. Hareketler sipariş oluşturulma tarihine göre listelenir.
      </p>
    </div>
  );
};

const MiniIstatistik = ({ etiket, deger, renk }: { etiket: string; deger: number; renk: 'notr' | 'amber' | 'red' }) => {
  const renkSinifi = renk === 'amber' ? 'text-amber-200' : renk === 'red' ? 'text-red-200' : 'text-white';
  return (
    <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.03]">
      <p className="text-xs font-bold text-white/45">{etiket}</p>
      <p className={`text-xl font-extrabold mt-1 ${renkSinifi}`}>{deger}</p>
    </div>
  );
};

const KayitSatiri = ({ kayit }: { kayit: CiroKaydi }) => {
  const bilgi = SIPARIS_DURUM_BILGISI[kayit.durum as SiparisDurumu];
  const teslim = kayit.durum === 'TESLIM_EDILDI';
  const odeme = kayit.odemeYontemi === 'NAKIT' ? 'Nakit' : kayit.odemeYontemi === 'KREDI_KARTI' ? 'Kart' : '';
  return (
    <div className="flex items-center gap-x-3 gap-y-1 px-4 py-3 flex-wrap">
      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${bilgi?.renk ?? 'text-white/50 border-white/15'}`}>
        {bilgi?.etiket ?? kayit.durum}
      </span>
      <span className="text-[11px] text-white/35 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {tarihBicimle(kayit.tarih)}</span>
      <span className="text-[11px] text-white/30">#{kayit.siparisId.slice(0, 8)}</span>
      {kayit.musteriAdi && (
        <span className="text-[11px] text-white/55 inline-flex items-center gap-1" title="Siparişi veren">
          <User className="w-3 h-3" /> {kayit.musteriAdi}
        </span>
      )}
      {kayit.isleyenAdi && (
        <span className="text-[11px] text-cyan-200/70 inline-flex items-center gap-1" title="Kabul/red eden personel">
          <UserCog className="w-3 h-3" /> {kayit.isleyenAdi}
        </span>
      )}
      {odeme && (
        <span className="text-[11px] text-white/40">
          {odeme}{kayit.tahsilEdilenOdeme ? ' · tahsil edildi' : ''}
        </span>
      )}
      {kayit.redNedeni && <span className="text-[11px] text-red-300/70 italic">{kayit.redNedeni}</span>}
      <div className="ml-auto text-right">
        <p className="text-[11px] text-white/40">{paraBicimle(kayit.tutar)}</p>
        <p className={`text-sm font-extrabold ${teslim ? 'text-emerald-300' : 'text-white/25'}`}>
          {teslim ? '+' + paraBicimle(kayit.kazanc) : '—'}
        </p>
      </div>
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
