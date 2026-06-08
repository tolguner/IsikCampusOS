import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList, ArrowLeft, MapPin, Wallet, CreditCard, XCircle, Clock,
} from 'lucide-react';
import {
  useYemekDeposu, SIPARIS_DURUM_BILGISI,
  type Siparis, type SiparisDurumu,
} from '../depolar/yemekDeposu';
import { YOLLAR } from '../yardimcilar/yollar';

const paraBicimle = (tutar: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tutar);

const tarihBicimle = (t?: string) => t ? new Date(t).toLocaleString('tr-TR') : '';

// Normal akış sırası (zaman çizelgesi için)
const AKIS: SiparisDurumu[] = ['BEKLEMEDE', 'KABUL_EDILDI', 'HAZIRLANIYOR', 'HAZIR', 'YOLDA', 'TESLIM_EDILDI'];

export const YemekSiparislerimSayfasi = () => {
  const { siparisler, isLoading, error, successMessage, siparislerimGetir, siparisIptal, clearMessages } = useYemekDeposu();

  useEffect(() => { siparislerimGetir(); }, [siparislerimGetir]);
  useEffect(() => () => { clearMessages(); }, [clearMessages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-indigo-500/20 border border-white/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Siparişlerim</h1>
            <p className="text-sm text-white/40">Geçmiş ve aktif siparişleriniz</p>
          </div>
        </div>
        <Link
          to={YOLLAR.yemek}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Yeni Sipariş
        </Link>
      </div>

      {(error || successMessage) && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold border ${error ? 'text-red-200 bg-red-500/10 border-red-400/20' : 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20'}`}>
          {error || successMessage}
        </div>
      )}

      {isLoading && siparisler.length === 0 && <p className="text-sm text-white/40">Siparişler yükleniyor...</p>}
      {!isLoading && siparisler.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/50 font-semibold mb-4">Henüz siparişiniz yok.</p>
          <Link to={YOLLAR.yemek} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white gradient-btn">İlk siparişini ver</Link>
        </div>
      )}

      <div className="space-y-4">
        {siparisler.map(siparis => (
          <SiparisKarti key={siparis.id} siparis={siparis} onIptal={() => siparisIptal(siparis.id)} iptalEdiliyor={isLoading} />
        ))}
      </div>
    </div>
  );
};

const SiparisKarti = ({ siparis, onIptal, iptalEdiliyor }: { siparis: Siparis; onIptal: () => void; iptalEdiliyor: boolean }) => {
  const durumBilgi = SIPARIS_DURUM_BILGISI[siparis.durum];
  const iptalEdilebilir = siparis.durum === 'BEKLEMEDE';
  const sonlandi = siparis.durum === 'REDDEDILDI' || siparis.durum === 'IPTAL_EDILDI';
  const aktifIndex = AKIS.indexOf(siparis.durum);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 border border-white/10 bg-white/[0.03]"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${durumBilgi.renk}`}>{durumBilgi.etiket}</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-white/35"><Clock className="w-3 h-3" /> {tarihBicimle(siparis.olusturulmaTarihi)}</span>
          </div>
          <p className="text-[11px] text-white/30 mt-1.5">Sipariş #{siparis.id.slice(0, 8)}</p>
        </div>
        <p className="text-lg font-extrabold text-orange-200">{paraBicimle(siparis.toplamTutar)}</p>
      </div>

      {/* Zaman çizelgesi (yalnızca aktif/normal akış) */}
      {!sonlandi && (
        <div className="flex items-center gap-1 mt-4">
          {AKIS.map((adim, i) => (
            <div key={adim} className="flex-1 flex items-center gap-1">
              <div className={`h-1.5 flex-1 rounded-full ${i <= aktifIndex ? 'bg-gradient-to-r from-orange-400 to-pink-400' : 'bg-white/10'}`} />
            </div>
          ))}
        </div>
      )}
      {!sonlandi && (
        <div className="flex justify-between mt-1.5">
          {AKIS.map((adim, i) => (
            <span key={adim} className={`text-[9px] font-bold ${i <= aktifIndex ? 'text-white/55' : 'text-white/25'}`}>
              {SIPARIS_DURUM_BILGISI[adim].etiket}
            </span>
          ))}
        </div>
      )}

      {siparis.durum === 'REDDEDILDI' && siparis.redNedeni && (
        <p className="text-xs text-red-300/80 mt-3">Red nedeni: {siparis.redNedeni}</p>
      )}

      {/* Kalemler */}
      <div className="mt-4 space-y-1.5 border-t border-white/8 pt-3">
        {siparis.kalemler.map(k => (
          <div key={k.id} className="flex items-center justify-between text-sm">
            <span className="text-white/70"><span className="font-bold text-white/90">{k.adet}×</span> {k.urunAdi}</span>
            <span className="text-white/50">{paraBicimle(k.araToplam)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mt-4 pt-3 border-t border-white/8">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-1.5 text-xs text-white/45"><MapPin className="w-3.5 h-3.5" /> {siparis.teslimAdresi}</p>
          <p className="inline-flex items-center gap-1.5 text-xs text-white/45">
            {siparis.odemeYontemi === 'NAKIT' ? <Wallet className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
            {siparis.odemeYontemi === 'NAKIT' ? 'Nakit' : 'Kredi Kartı'}
            {siparis.tahsilEdilenOdeme && <span className="text-emerald-300/70">· tahsil edildi</span>}
          </p>
          {siparis.musteriNotu && <p className="text-xs text-white/35 italic">"{siparis.musteriNotu}"</p>}
        </div>
        {iptalEdilebilir && (
          <button
            onClick={onIptal}
            disabled={iptalEdiliyor}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-red-200 bg-red-500/15 hover:bg-red-500/25 border border-red-400/20 transition-colors disabled:opacity-40"
          >
            <XCircle className="w-4 h-4" /> İptal Et
          </button>
        )}
      </div>
    </motion.div>
  );
};
