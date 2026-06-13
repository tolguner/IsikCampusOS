import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed, MapPin, ShoppingBag, Plus, Minus, Trash2,
  ArrowLeft, Store, ClipboardList, X, Wallet, CreditCard, Clock, Truck, Timer, Search, Star, Heart,
} from 'lucide-react';
import { useYemekDeposu, type MenuOgesi, type OdemeYontemi, type Satici, type SiparisOnizleme, type TeslimatTuru } from '../depolar/yemekDeposu';
import { etiketleriAyir, etiketEtiketi } from '../yardimcilar/menuEtiketleri';
import { useProfilDeposu } from '../depolar/profilDeposu';
import { YOLLAR } from '../yardimcilar/yollar';

const paraBicimle = (tutar: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tutar);

const GUN_ADLARI = ['', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const saatKisalt = (s?: string | null) => (s ? s.slice(0, 5) : '');

/** Satıcının açık/kapalı rozeti + kapalıysa sonraki açılış. */
const AcikKapaliRozet = ({ satici, buyuk }: { satici: Satici; buyuk?: boolean }) => {
  const acik = !!satici.suAnAcik;
  const boyut = buyuk ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg font-black border ${boyut} ${acik ? 'text-emerald-200 bg-emerald-500/15 border-emerald-400/25' : 'text-white/50 bg-white/5 border-white/10'}`}>
      <Clock className="w-3 h-3" />
      {acik ? 'Açık' : (satici.sonrakiAcilis ? `${satici.sonrakiAcilis}'da açılır` : 'Kapalı')}
    </span>
  );
};

/** Teslimat ücreti / süre / min. sepet özeti (değer varsa gösterir). */
const TeslimatOzet = ({ satici }: { satici: Satici }) => {
  const parcalar: React.ReactNode[] = [];
  if (satici.tahminiTeslimatDakika) parcalar.push(<span key="s" className="inline-flex items-center gap-1"><Timer className="w-3 h-3" /> ~{satici.tahminiTeslimatDakika} dk</span>);
  // Yoğunlukta tahmini süre dinamik artar; öğrenciye şeffaf gösterilir.
  if ((satici.yogunlukEkDakika ?? 0) > 0) parcalar.push(<span key="y" className="inline-flex items-center gap-1 text-amber-300/90 font-bold">🔥 Yoğun (+{satici.yogunlukEkDakika} dk)</span>);
  if (satici.teslimatUcreti != null) parcalar.push(<span key="u" className="inline-flex items-center gap-1"><Truck className="w-3 h-3" /> {satici.teslimatUcreti > 0 ? paraBicimle(satici.teslimatUcreti) : 'Ücretsiz'}</span>);
  if (satici.minimumSepetTutari && satici.minimumSepetTutari > 0) parcalar.push(<span key="m">Min. {paraBicimle(satici.minimumSepetTutari)}</span>);
  if (parcalar.length === 0) return null;
  return <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/45">{parcalar}</div>;
};

export const YemekSayfasi = () => {
  const {
    saticilar, mutfakTurleri, favoriIdleri, seciliSatici, menu, sepet, sepetSaticiId,
    isLoading, error, successMessage,
    saticilariGetir, mutfakTurleriGetir, favorileriGetir, favoriToggle, menuGetir, seciliSaticiyiTemizle,
    sepeteEkle, adetDegistir, sepettenCikar, sepetiTemizle, sepetToplami,
    siparisVer, siparisOnizle, clearMessages,
  } = useYemekDeposu();

  const [odemeAcik, setOdemeAcik] = useState(false);
  const [secenekModaliOge, setSecenekModaliOge] = useState<MenuOgesi | null>(null);
  const [ara, setAra] = useState('');
  const [mutfak, setMutfak] = useState('');
  const [sirala, setSirala] = useState('');
  const [sadeceFavoriler, setSadeceFavoriler] = useState(false);

  // Seçenekli ürün → modal aç; seçeneksiz → doğrudan sepete ekle
  const urunEkle = (oge: MenuOgesi) => {
    if (oge.secenekGruplari && oge.secenekGruplari.length > 0) setSecenekModaliOge(oge);
    else if (seciliSatici) sepeteEkle(seciliSatici, oge);
  };

  useEffect(() => { mutfakTurleriGetir(); favorileriGetir(); }, [mutfakTurleriGetir, favorileriGetir]);
  useEffect(() => () => { clearMessages(); }, [clearMessages]);

  const gosterilenSaticilar = sadeceFavoriler ? saticilar.filter(s => favoriIdleri.includes(s.id)) : saticilar;

  // Arama/filtre/sıralama değişince (arama için debounce) satıcıları yeniden çek
  useEffect(() => {
    const t = setTimeout(() => saticilariGetir({ ara, mutfak, sirala }), 250);
    return () => clearTimeout(t);
  }, [ara, mutfak, sirala, saticilariGetir]);

  const toplam = sepetToplami();
  const sepetAdet = useMemo(() => sepet.reduce((t, k) => t + k.adet, 0), [sepet]);

  // Etiket filtresi (allerjen/içerik): seçiliyse yalnız o etiketi taşıyan ürünler
  const [etiketFiltre, setEtiketFiltre] = useState('');
  const menudekiEtiketler = useMemo(
    () => Array.from(new Set(menu.flatMap(o => etiketleriAyir(o.etiketler)))),
    [menu],
  );

  // Menüyü kategoriye göre grupla
  const kategoriler = useMemo(() => {
    const harita = new Map<string, MenuOgesi[]>();
    menu.filter(o => o.mevcut)
        .filter(o => !etiketFiltre || etiketleriAyir(o.etiketler).includes(etiketFiltre))
        .forEach(o => {
      const k = o.kategori || 'Diğer';
      if (!harita.has(k)) harita.set(k, []);
      harita.get(k)!.push(o);
    });
    return Array.from(harita.entries());
  }, [menu, etiketFiltre]);

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
        <div className="space-y-4">
          {/* Arama + sıralama */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={ara}
                onChange={e => setAra(e.target.value)}
                placeholder="Satıcı veya mutfak ara..."
                className="w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none"
              />
            </div>
            <select
              value={sirala}
              onChange={e => setSirala(e.target.value)}
              className="rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none"
            >
              <option value="">Önerilen (açık önce)</option>
              <option value="isim">İsme göre</option>
              <option value="sure">Teslimat süresi</option>
            </select>
          </div>

          {/* Mutfak türü + favori çipleri */}
          <div className="flex flex-wrap gap-2">
            <Cip aktif={mutfak === '' && !sadeceFavoriler} onClick={() => { setMutfak(''); setSadeceFavoriler(false); }}>Tümü</Cip>
            <Cip aktif={sadeceFavoriler} onClick={() => setSadeceFavoriler(v => !v)}>
              <span className="inline-flex items-center gap-1"><Heart className={`w-3 h-3 ${sadeceFavoriler ? 'fill-pink-300 text-pink-300' : ''}`} /> Favorilerim</span>
            </Cip>
            {mutfakTurleri.map(m => (
              <Cip key={m} aktif={mutfak === m} onClick={() => { setMutfak(mutfak === m ? '' : m); setSadeceFavoriler(false); }}>{m}</Cip>
            ))}
          </div>

          {isLoading && saticilar.length === 0 && (
            <p className="text-sm text-white/40">Satıcılar yükleniyor...</p>
          )}
          {!isLoading && gosterilenSaticilar.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/50 font-semibold">{sadeceFavoriler ? 'Henüz favori satıcınız yok.' : (ara || mutfak ? 'Aramanızla eşleşen satıcı yok.' : 'Şu anda açık satıcı bulunmuyor.')}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gosterilenSaticilar.map(satici => (
              <SaticiKarti key={satici.id} satici={satici} favori={favoriIdleri.includes(satici.id)}
                onSec={() => menuGetir(satici)} onFavori={() => favoriToggle(satici.id)} />
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

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              {seciliSatici.kapakGorselUrl && (
                <div className="h-36 w-full overflow-hidden bg-gradient-to-br from-orange-500/20 to-pink-500/10">
                  <img src={seciliSatici.kapakGorselUrl} alt={seciliSatici.ad} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-extrabold text-white">{seciliSatici.ad}</h2>
                {seciliSatici.mutfakTuru && <span className="text-[11px] font-bold text-orange-200/80 bg-orange-500/10 border border-orange-400/15 px-2 py-0.5 rounded">{seciliSatici.mutfakTuru}</span>}
                <AcikKapaliRozet satici={seciliSatici} buyuk />
              </div>
              {seciliSatici.aciklama && <p className="text-sm text-white/50 mt-1">{seciliSatici.aciklama}</p>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                {seciliSatici.konumMetni && (
                  <p className="inline-flex items-center gap-1.5 text-xs text-white/40">
                    <MapPin className="w-3.5 h-3.5" /> {seciliSatici.konumMetni}
                  </p>
                )}
                <TeslimatOzet satici={seciliSatici} />
              </div>
              {seciliSatici.calismaSaatleri && seciliSatici.calismaSaatleri.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/8">
                  <p className="text-[11px] font-bold text-white/40 mb-1.5 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Çalışma Saatleri</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
                    {[1,2,3,4,5,6,7].map(g => {
                      const cs = seciliSatici.calismaSaatleri!.find(c => c.gun === g);
                      const bugun = new Date().getDay() === 0 ? 7 : new Date().getDay();
                      return (
                        <div key={g} className={`flex justify-between text-[11px] ${g === bugun ? 'text-white/80 font-bold' : 'text-white/40'}`}>
                          <span>{GUN_ADLARI[g]}</span>
                          <span>{!cs || cs.kapali ? 'Kapalı' : `${saatKisalt(cs.acilis)}-${saatKisalt(cs.kapanis)}`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>
            </div>

            {isLoading && menu.length === 0 && <p className="text-sm text-white/40">Menü yükleniyor...</p>}
            {!isLoading && kategoriler.length === 0 && (
              <p className="text-sm text-white/40">Bu satıcının şu anda sunulan ürünü yok.</p>
            )}

            {menudekiEtiketler.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {menudekiEtiketler.map(kod => (
                  <button key={kod} onClick={() => setEtiketFiltre(etiketFiltre === kod ? '' : kod)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${etiketFiltre === kod ? 'text-orange-100 bg-orange-500/20 border-orange-400/40' : 'text-white/50 bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    {etiketEtiketi(kod)}
                  </button>
                ))}
              </div>
            )}
            {kategoriler.map(([kategori, ogeler]) => (
              <div key={kategori} className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-white/35 px-1">{kategori}</h3>
                <div className="space-y-2">
                  {ogeler.map(oge => (
                    <div key={oge.id} className="flex items-center gap-4 rounded-xl p-3 border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      {oge.gorselUrl && (
                        <img src={oge.gorselUrl} alt={oge.ad} className="w-16 h-16 shrink-0 rounded-lg object-cover border border-white/10" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-white">{oge.ad}</p>
                          {oge.oneCikan && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-200 bg-amber-500/15 border border-amber-400/20 px-1.5 py-0.5 rounded"><Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" /> Öne çıkan</span>}
                        </div>
                        {oge.aciklama && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{oge.aciklama}</p>}
                        {etiketleriAyir(oge.etiketler).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {etiketleriAyir(oge.etiketler).map(kod => (
                              <span key={kod} className="text-[10px] font-bold text-white/50 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">{etiketEtiketi(kod)}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm font-extrabold text-orange-200 mt-1">{paraBicimle(oge.fiyat)}{oge.secenekGruplari && oge.secenekGruplari.length > 0 && <span className="text-[11px] text-white/35 font-normal"> + seçenekler</span>}</p>
                      </div>
                      <button
                        onClick={() => urunEkle(oge)}
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
                      <div key={k.sepetId} className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{k.ad}</p>
                          {k.secimlerOzeti && <p className="text-[11px] text-white/45 truncate">{k.secimlerOzeti}</p>}
                          <p className="text-[11px] text-white/40">{paraBicimle(k.birimFiyat)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => adetDegistir(k.sepetId, k.adet - 1)} className="w-6 h-6 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/70">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-white">{k.adet}</span>
                          <button onClick={() => adetDegistir(k.sepetId, k.adet + 1)} className="w-6 h-6 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/70">
                            <Plus className="w-3 h-3" />
                          </button>
                          <button onClick={() => sepettenCikar(k.sepetId)} className="w-6 h-6 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-red-300/70 hover:text-red-300">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-3 mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Ara toplam</span>
                      <span className="text-white/70">{paraBicimle(toplam)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Teslimat</span>
                      <span className="text-white/70">{(seciliSatici.teslimatUcreti ?? 0) > 0 ? paraBicimle(seciliSatici.teslimatUcreti!) : 'Ücretsiz'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/8 pt-1.5">
                      <span className="text-sm font-bold text-white/60">Toplam</span>
                      <span className="text-lg font-extrabold text-orange-200">{paraBicimle(toplam + (seciliSatici.teslimatUcreti ?? 0))}</span>
                    </div>
                    {(seciliSatici.minimumSepetTutari ?? 0) > 0 && (
                      <p className="text-[11px] text-white/35">Varsa kampanya indirimi ödeme adımında uygulanır.</p>
                    )}
                  </div>

                  {!seciliSatici.suAnAcik && (
                    <p className="text-[11px] text-amber-200/80 mb-2 text-center">
                      Satıcı şu anda kapalı{seciliSatici.sonrakiAcilis ? ` — ${seciliSatici.sonrakiAcilis}'da açılır` : ''}. Sipariş verilemiyor.
                    </p>
                  )}
                  {seciliSatici.suAnAcik && toplam < (seciliSatici.minimumSepetTutari ?? 0) && (
                    <p className="text-[11px] text-amber-200/80 mb-2 text-center">
                      Minimum sepet tutarı {paraBicimle(seciliSatici.minimumSepetTutari!)}. {paraBicimle((seciliSatici.minimumSepetTutari ?? 0) - toplam)} daha ekleyin.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={sepetiTemizle} className="px-3 py-2.5 rounded-xl text-sm font-bold text-white/60 bg-white/5 hover:bg-white/10 transition-colors">
                      Temizle
                    </button>
                    <button
                      onClick={() => setOdemeAcik(true)}
                      disabled={!seciliSatici.suAnAcik || toplam < (seciliSatici.minimumSepetTutari ?? 0)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white gradient-btn shadow-lg shadow-orange-500/15 disabled:opacity-40 disabled:cursor-not-allowed"
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

      {secenekModaliOge && seciliSatici && (
        <SecenekModali
          oge={secenekModaliOge}
          onKapat={() => setSecenekModaliOge(null)}
          onEkle={(secilenIdler, ozet, birimFiyat) => {
            sepeteEkle(seciliSatici, secenekModaliOge, secilenIdler, ozet, birimFiyat);
            setSecenekModaliOge(null);
          }}
        />
      )}
    </div>
  );
};

const SecenekModali = ({ oge, onKapat, onEkle }: {
  oge: MenuOgesi;
  onKapat: () => void;
  onEkle: (secilenIdler: string[], ozet: string, birimFiyat: number) => void;
}) => {
  // grupId -> seçilen seçenek id'leri
  const [secimler, setSecimler] = useState<Record<string, string[]>>({});
  const gruplar = oge.secenekGruplari ?? [];

  const tekSecim = (grupId: string, secenekId: string) => setSecimler(s => ({ ...s, [grupId]: [secenekId] }));
  const cokluSecim = (grupId: string, secenekId: string) => setSecimler(s => {
    const mevcut = s[grupId] ?? [];
    return { ...s, [grupId]: mevcut.includes(secenekId) ? mevcut.filter(x => x !== secenekId) : [...mevcut, secenekId] };
  });

  const tumSecilenler = Object.values(secimler).flat();
  const secilenSecenekler = gruplar.flatMap(g => g.secenekler).filter(sec => tumSecilenler.includes(sec.id));
  const birimFiyat = oge.fiyat + secilenSecenekler.reduce((t, s) => t + s.ekFiyat, 0);
  const ozet = secilenSecenekler.map(s => s.ad).join(', ');
  const zorunluEksik = gruplar.some(g => g.zorunlu && (secimler[g.id]?.length ?? 0) === 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onKapat}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl p-6 border border-white/10 max-h-[85vh] overflow-y-auto" style={{ background: 'rgba(14,14,28,0.98)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-extrabold text-white">{oge.ad}</h2>
          <button onClick={onKapat} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50"><X className="w-5 h-5" /></button>
        </div>
        {oge.aciklama && <p className="text-xs text-white/45 mb-4">{oge.aciklama}</p>}

        <div className="space-y-4">
          {gruplar.map(grup => (
            <div key={grup.id}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-bold text-white/80">{grup.ad}</p>
                {grup.zorunlu && <span className="text-[10px] font-bold text-amber-200 bg-amber-500/15 border border-amber-400/20 px-1.5 py-0.5 rounded">Zorunlu</span>}
                <span className="text-[10px] text-white/35">{grup.tur === 'TEK_SECIM' ? 'tek seçim' : 'çoklu'}</span>
              </div>
              <div className="space-y-1.5">
                {grup.secenekler.map(sec => {
                  const secili = (secimler[grup.id] ?? []).includes(sec.id);
                  return (
                    <button key={sec.id}
                      onClick={() => grup.tur === 'TEK_SECIM' ? tekSecim(grup.id, sec.id) : cokluSecim(grup.id, sec.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm border transition-colors ${secili ? 'text-orange-100 bg-orange-500/15 border-orange-400/30' : 'text-white/70 bg-white/5 border-white/10 hover:bg-white/10'}`}>
                      <span className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-${grup.tur === 'TEK_SECIM' ? 'full' : 'md'} border flex items-center justify-center ${secili ? 'border-orange-400 bg-orange-400' : 'border-white/25'}`}>
                          {secili && <span className="w-1.5 h-1.5 rounded-full bg-[#0c0c18]" />}
                        </span>
                        {sec.ad}
                      </span>
                      {sec.ekFiyat > 0 && <span className="text-xs font-bold text-white/50">+{paraBicimle(sec.ekFiyat)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-5">
          <span className="text-sm font-bold text-white/60">Birim fiyat</span>
          <span className="text-lg font-extrabold text-orange-200">{paraBicimle(birimFiyat)}</span>
        </div>
        <button disabled={zorunluEksik} onClick={() => onEkle(tumSecilenler, ozet, birimFiyat)}
          className="w-full mt-4 px-4 py-3 rounded-xl text-sm font-extrabold text-white gradient-btn shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
          {zorunluEksik ? 'Zorunlu seçim yapın' : 'Sepete Ekle'}
        </button>
      </motion.div>
    </div>
  );
};

const Cip = ({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${aktif ? 'text-orange-100 bg-orange-500/20 border-orange-400/40' : 'text-white/55 bg-white/5 border-white/10 hover:bg-white/10'}`}
  >
    {children}
  </button>
);

const SaticiKarti = ({ satici, favori, onSec, onFavori }: { satici: Satici; favori?: boolean; onSec: () => void; onFavori?: () => void }) => (
  <motion.button
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onSec}
    className="text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all group overflow-hidden flex flex-col"
  >
    {/* Kapak / hero */}
    <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-orange-500/25 to-pink-500/15">
      {satici.kapakGorselUrl ? (
        <img src={satici.kapakGorselUrl} alt={satici.ad} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-white/20" /></div>
      )}
      <div className="absolute top-2 right-2"><AcikKapaliRozet satici={satici} /></div>
      {onFavori && (
        <button
          onClick={(e) => { e.stopPropagation(); onFavori(); }}
          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/65 transition-colors"
          title={favori ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Heart className={`w-4 h-4 ${favori ? 'fill-pink-400 text-pink-400' : 'text-white/70'}`} />
        </button>
      )}
      {satici.mutfakTuru && (
        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded">{satici.mutfakTuru}</span>
      )}
    </div>
    {/* Gövde */}
    <div className="p-4 flex-1 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center overflow-hidden">
          {satici.logoUrl ? <img src={satici.logoUrl} alt="" className="w-full h-full object-cover" /> : <Store className="w-4 h-4 text-orange-200" />}
        </div>
        <p className="text-base font-extrabold text-white truncate group-hover:text-orange-100">{satici.ad}</p>
      </div>
      {satici.aciklama && <p className="text-xs text-white/45 line-clamp-1">{satici.aciklama}</p>}
      <TeslimatOzet satici={satici} />
    </div>
  </motion.button>
);

const OdemeModali = ({
  satici, toplam, isLoading, onKapat, onOnayla,
}: {
  satici: Satici;
  toplam: number;
  isLoading: boolean;
  onKapat: () => void;
  onOnayla: (talep: { teslimAdresi: string; odemeYontemi: OdemeYontemi; teslimatTuru: TeslimatTuru; telefon?: string; musteriNotu?: string }) => void;
}) => {
  const [teslimAdresi, setTeslimAdresi] = useState('');
  const [telefon, setTelefon] = useState('');
  const [musteriNotu, setMusteriNotu] = useState('');
  const [odemeYontemi, setOdemeYontemi] = useState<OdemeYontemi>('NAKIT');
  const [teslimatTuru, setTeslimatTuru] = useState<TeslimatTuru>('ADRESE_TESLIMAT');
  const [onizleme, setOnizleme] = useState<SiparisOnizleme | null>(null);
  const siparisOnizle = useYemekDeposu(s => s.siparisOnizle);
  const iletisimIzni = useProfilDeposu(s => !!s.profile?.iletisimPaylasimIzni);
  // Gel-al'da adres gerekmez (işletmeden teslim alınır).
  const gecerli = teslimatTuru === 'GEL_AL' || teslimAdresi.trim().length >= 3;

  // Gerçek tutar dökümü (kampanya dahil) — teslimat türü değişince yenilenir.
  useEffect(() => {
    siparisOnizle(satici.id, teslimatTuru).then(setOnizleme);
  }, [satici.id, teslimatTuru, siparisOnizle]);

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
            <label className="block text-xs font-bold text-white/60 mb-1.5">Teslimat Türü</label>
            <div className="grid grid-cols-2 gap-2">
              {([['ADRESE_TESLIMAT', '🛵 Adrese Teslimat'], ['GEL_AL', '🏃 Gel-Al (ücretsiz)']] as const).map(([deger, etiket]) => (
                <button key={deger} onClick={() => setTeslimatTuru(deger)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-colors ${teslimatTuru === deger ? 'text-orange-100 bg-orange-500/20 border-orange-400/40' : 'text-white/55 bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  {etiket}
                </button>
              ))}
            </div>
            {teslimatTuru === 'GEL_AL' && (
              <p className="text-[11px] text-white/35 mt-1.5">
                Siparişini hazır olduğunda işletmeden kendin alırsın{satici.konumMetni ? ` (${satici.konumMetni})` : ''}; teslimat ücreti alınmaz.
              </p>
            )}
          </div>

          {teslimatTuru === 'ADRESE_TESLIMAT' && (
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
          )}

          {iletisimIzni ? (
            <div>
              <label className="block text-xs font-bold text-white/60 mb-1.5">Telefon</label>
              <input
                value={telefon}
                onChange={e => setTelefon(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none"
              />
              <p className="text-[11px] text-white/30 mt-1.5">Bir sorun olursa işletme bu numaradan sizi arayabilir.</p>
            </div>
          ) : (
            <div className="rounded-xl px-3.5 py-2.5 text-[11px] text-white/45 bg-white/[0.03] border border-white/10">
              İletişim paylaşımı <span className="text-white/70 font-semibold">kapalı</span> — telefonunuz işletmeyle paylaşılmaz.
              Açmak için <span className="text-orange-200/80 font-semibold">Ayarlar &gt; Gizlilik</span>.
            </div>
          )}

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

        <div className="border-t border-white/10 pt-4 mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Ara toplam</span>
            <span className="text-white/70">{paraBicimle(onizleme?.araToplam ?? toplam)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Teslimat{teslimatTuru === 'GEL_AL' ? ' (Gel-Al)' : ''}</span>
            <span className="text-white/70">
              {teslimatTuru === 'GEL_AL' ? 'Ücretsiz'
                : (onizleme?.teslimatUcreti ?? satici.teslimatUcreti ?? 0) > 0
                  ? paraBicimle(onizleme?.teslimatUcreti ?? satici.teslimatUcreti!) : 'Ücretsiz'}
            </span>
          </div>
          {onizleme && onizleme.indirimTutari > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-300/80">{onizleme.kampanyaAd ?? 'Kampanya indirimi'}</span>
              <span className="text-emerald-300/80">−{paraBicimle(onizleme.indirimTutari)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-white/8 pt-1.5">
            <span className="text-sm font-bold text-white/60">Toplam</span>
            <span className="text-xl font-extrabold text-orange-200">
              {paraBicimle(onizleme?.toplamTutar ?? (toplam + (teslimatTuru === 'GEL_AL' ? 0 : satici.teslimatUcreti ?? 0)))}
            </span>
          </div>
          {!onizleme && (
            <p className="text-[11px] text-white/30">Uygun kampanya indirimi sipariş sonrası toplamdan düşülür.</p>
          )}
        </div>

        <button
          disabled={!gecerli || isLoading}
          onClick={() => onOnayla({ teslimAdresi: teslimAdresi.trim(), odemeYontemi, teslimatTuru, telefon: iletisimIzni ? (telefon.trim() || undefined) : undefined, musteriNotu: musteriNotu.trim() || undefined })}
          className="w-full mt-4 px-4 py-3 rounded-xl text-sm font-extrabold text-white gradient-btn shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Gönderiliyor...' : 'Siparişi Onayla'}
        </button>
      </motion.div>
    </div>
  );
};
