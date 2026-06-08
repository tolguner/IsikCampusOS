import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed, MapPin, ShoppingBag, Plus, Minus, Trash2,
  ArrowLeft, Store, ClipboardList, X, Wallet, CreditCard,
} from 'lucide-react';
import { useYemekDeposu, type MenuOgesi, type OdemeYontemi, type Satici } from '../depolar/yemekDeposu';
import { YOLLAR } from '../yardimcilar/yollar';

const paraBicimle = (tutar: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tutar);

export const YemekSayfasi = () => {
  const {
    saticilar, seciliSatici, menu, sepet, sepetSaticiId,
    isLoading, error, successMessage,
    saticilariGetir, menuGetir, seciliSaticiyiTemizle,
    sepeteEkle, adetDegistir, sepettenCikar, sepetiTemizle, sepetToplami,
    siparisVer, clearMessages,
  } = useYemekDeposu();

  const [odemeAcik, setOdemeAcik] = useState(false);

  useEffect(() => { saticilariGetir(); }, [saticilariGetir]);
  useEffect(() => () => { clearMessages(); }, [clearMessages]);

  const toplam = sepetToplami();
  const sepetAdet = useMemo(() => sepet.reduce((t, k) => t + k.adet, 0), [sepet]);

  // Menüyü kategoriye göre grupla
  const kategoriler = useMemo(() => {
    const harita = new Map<string, MenuOgesi[]>();
    menu.filter(o => o.mevcut).forEach(o => {
      const k = o.kategori || 'Diğer';
      if (!harita.has(k)) harita.set(k, []);
      harita.get(k)!.push(o);
    });
    return Array.from(harita.entries());
  }, [menu]);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/30 to-pink-500/20 border border-white/10 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-orange-200" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">UniEats</h1>
            <p className="text-sm text-white/40">Kampüsten online yemek siparişi</p>
          </div>
        </div>
        <Link
          to={YOLLAR.yemekSiparislerim}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-cyan-100 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/20 transition-colors"
        >
          <ClipboardList className="w-4 h-4" /> Siparişlerim
        </Link>
      </div>

      {(error || successMessage) && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold border ${error ? 'text-red-200 bg-red-500/10 border-red-400/20' : 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20'}`}>
          {error || successMessage}
        </div>
      )}

      {!seciliSatici ? (
        /* ---------- SATICI LİSTESİ ---------- */
        <div>
          {isLoading && saticilar.length === 0 && (
            <p className="text-sm text-white/40">Satıcılar yükleniyor...</p>
          )}
          {!isLoading && saticilar.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/50 font-semibold">Şu anda açık satıcı bulunmuyor.</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saticilar.map(satici => (
              <SaticiKarti key={satici.id} satici={satici} onSec={() => menuGetir(satici)} />
            ))}
          </div>
        </div>
      ) : (
        /* ---------- MENÜ + SEPET ---------- */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menü */}
          <div className="lg:col-span-2 space-y-5">
            <button
              onClick={seciliSaticiyiTemizle}
              className="inline-flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Tüm satıcılar
            </button>

            <div className="rounded-2xl p-5 border border-white/10 bg-white/[0.03]">
              <h2 className="text-xl font-extrabold text-white">{seciliSatici.ad}</h2>
              {seciliSatici.aciklama && <p className="text-sm text-white/50 mt-1">{seciliSatici.aciklama}</p>}
              {seciliSatici.konumMetni && (
                <p className="inline-flex items-center gap-1.5 text-xs text-white/40 mt-2">
                  <MapPin className="w-3.5 h-3.5" /> {seciliSatici.konumMetni}
                </p>
              )}
            </div>

            {isLoading && menu.length === 0 && <p className="text-sm text-white/40">Menü yükleniyor...</p>}
            {!isLoading && kategoriler.length === 0 && (
              <p className="text-sm text-white/40">Bu satıcının şu anda sunulan ürünü yok.</p>
            )}

            {kategoriler.map(([kategori, ogeler]) => (
              <div key={kategori} className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-white/35 px-1">{kategori}</h3>
                <div className="space-y-2">
                  {ogeler.map(oge => (
                    <div key={oge.id} className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{oge.ad}</p>
                        {oge.aciklama && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{oge.aciklama}</p>}
                        <p className="text-sm font-extrabold text-orange-200 mt-1">{paraBicimle(oge.fiyat)}</p>
                      </div>
                      <button
                        onClick={() => sepeteEkle(seciliSatici, oge)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-white gradient-btn shadow-lg shadow-orange-500/10"
                      >
                        <Plus className="w-4 h-4" /> Ekle
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sepet */}
          <div className="lg:col-span-1">
            <div className="sticky top-5 rounded-2xl p-5 border border-white/10 bg-white/[0.04]">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-orange-200" />
                <h3 className="text-base font-extrabold text-white">Sepet</h3>
                {sepetAdet > 0 && (
                  <span className="ml-auto text-xs font-black text-white/50">{sepetAdet} ürün</span>
                )}
              </div>

              {sepet.length === 0 ? (
                <p className="text-sm text-white/40 py-6 text-center">Sepetiniz boş. Menüden ürün ekleyin.</p>
              ) : (
                <>
                  {sepetSaticiId && sepetSaticiId !== seciliSatici.id && (
                    <p className="text-[11px] text-amber-200/80 mb-3">Sepetinizde başka bir satıcının ürünleri var.</p>
                  )}
                  <div className="space-y-2 mb-4">
                    {sepet.map(k => (
                      <div key={k.menuOgesiId} className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{k.ad}</p>
                          <p className="text-[11px] text-white/40">{paraBicimle(k.birimFiyat)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => adetDegistir(k.menuOgesiId, k.adet - 1)} className="w-6 h-6 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/70">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-white">{k.adet}</span>
                          <button onClick={() => adetDegistir(k.menuOgesiId, k.adet + 1)} className="w-6 h-6 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/70">
                            <Plus className="w-3 h-3" />
                          </button>
                          <button onClick={() => sepettenCikar(k.menuOgesiId)} className="w-6 h-6 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-red-300/70 hover:text-red-300">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-3 mb-4">
                    <span className="text-sm font-bold text-white/60">Toplam</span>
                    <span className="text-lg font-extrabold text-orange-200">{paraBicimle(toplam)}</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={sepetiTemizle} className="px-3 py-2.5 rounded-xl text-sm font-bold text-white/60 bg-white/5 hover:bg-white/10 transition-colors">
                      Temizle
                    </button>
                    <button
                      onClick={() => setOdemeAcik(true)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white gradient-btn shadow-lg shadow-orange-500/15"
                    >
                      Sipariş Ver
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {odemeAcik && seciliSatici && (
        <OdemeModali
          satici={seciliSatici}
          toplam={toplam}
          isLoading={isLoading}
          onKapat={() => setOdemeAcik(false)}
          onOnayla={async (talep) => {
            const ok = await siparisVer(seciliSatici.id, talep);
            if (ok) setOdemeAcik(false);
          }}
        />
      )}
    </div>
  );
};

const SaticiKarti = ({ satici, onSec }: { satici: Satici; onSec: () => void }) => (
  <motion.button
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onSec}
    className="text-left rounded-2xl p-5 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all group"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-pink-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
        {satici.logoUrl ? (
          <img src={satici.logoUrl} alt={satici.ad} className="w-full h-full object-cover" />
        ) : (
          <Store className="w-5 h-5 text-orange-200" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-base font-extrabold text-white truncate group-hover:text-orange-100">{satici.ad}</p>
        <span className={`text-[11px] font-bold ${satici.acik ? 'text-emerald-300' : 'text-white/40'}`}>
          {satici.acik ? '● Açık' : '○ Kapalı'}
        </span>
      </div>
    </div>
    {satici.aciklama && <p className="text-xs text-white/45 line-clamp-2">{satici.aciklama}</p>}
    {satici.konumMetni && (
      <p className="inline-flex items-center gap-1.5 text-[11px] text-white/35 mt-2">
        <MapPin className="w-3 h-3" /> {satici.konumMetni}
      </p>
    )}
  </motion.button>
);

const OdemeModali = ({
  satici, toplam, isLoading, onKapat, onOnayla,
}: {
  satici: Satici;
  toplam: number;
  isLoading: boolean;
  onKapat: () => void;
  onOnayla: (talep: { teslimAdresi: string; odemeYontemi: OdemeYontemi; telefon?: string; musteriNotu?: string }) => void;
}) => {
  const [teslimAdresi, setTeslimAdresi] = useState('');
  const [telefon, setTelefon] = useState('');
  const [musteriNotu, setMusteriNotu] = useState('');
  const [odemeYontemi, setOdemeYontemi] = useState<OdemeYontemi>('NAKIT');
  const gecerli = teslimAdresi.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onKapat}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl p-6 border border-white/10"
        style={{ background: 'rgba(14,14,28,0.98)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-white">Siparişi Tamamla</h2>
          <button onClick={onKapat} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-xs text-white/40 mb-4">Satıcı: <span className="text-white/70 font-bold">{satici.ad}</span></p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/60 mb-1.5">Teslim Adresi *</label>
            <textarea
              value={teslimAdresi}
              onChange={e => setTeslimAdresi(e.target.value)}
              placeholder="Örn. Erkek Yurdu B Blok, Oda 204"
              rows={2}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/60 mb-1.5">Telefon</label>
            <input
              value={telefon}
              onChange={e => setTelefon(e.target.value)}
              placeholder="05XX XXX XX XX"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/60 mb-1.5">Ödeme Yöntemi</label>
            <div className="grid grid-cols-2 gap-2">
              {([['NAKIT', 'Nakit', Wallet], ['KREDI_KARTI', 'Kredi Kartı', CreditCard]] as const).map(([deger, etiket, Icon]) => (
                <button
                  key={deger}
                  onClick={() => setOdemeYontemi(deger)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-colors ${odemeYontemi === deger ? 'text-orange-100 bg-orange-500/20 border-orange-400/40' : 'text-white/55 bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <Icon className="w-4 h-4" /> {etiket}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/30 mt-1.5">Ödeme teslimatta alınır; bu seçim bilgi amaçlıdır.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/60 mb-1.5">Sipariş Notu</label>
            <input
              value={musteriNotu}
              onChange={e => setMusteriNotu(e.target.value)}
              placeholder="Örn. Az acılı olsun"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-5">
          <span className="text-sm font-bold text-white/60">Toplam</span>
          <span className="text-xl font-extrabold text-orange-200">{paraBicimle(toplam)}</span>
        </div>

        <button
          disabled={!gecerli || isLoading}
          onClick={() => onOnayla({ teslimAdresi: teslimAdresi.trim(), odemeYontemi, telefon: telefon.trim() || undefined, musteriNotu: musteriNotu.trim() || undefined })}
          className="w-full mt-4 px-4 py-3 rounded-xl text-sm font-extrabold text-white gradient-btn shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Gönderiliyor...' : 'Siparişi Onayla'}
        </button>
      </motion.div>
    </div>
  );
};
