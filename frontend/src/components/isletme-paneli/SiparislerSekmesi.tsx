import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Wallet, CreditCard, Clock, RefreshCw, Check, Ban, UserCheck, Lock } from 'lucide-react';
import { useIsletmeDeposu } from '../../depolar/isletmeDeposu';
import { useKimlikDeposu } from '../../depolar/kimlikDeposu';
import { rolleriAyir, YETKILER } from '../../yardimcilar/yetkiler';
import { SIPARIS_DURUM_BILGISI, type Siparis, type SiparisDurumu } from '../../depolar/yemekDeposu';

const paraBicimle = (t: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);
const tarihBicimle = (t?: string) => t ? new Date(t).toLocaleString('tr-TR') : '';
const saatBicimle = (t?: string) => t ? new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';

// Aktif (işlem bekleyen) ve tamamlanmış siparişleri ayır
const AKTIF_DURUMLAR = ['BEKLEMEDE', 'KABUL_EDILDI', 'HAZIRLANIYOR', 'HAZIR', 'YOLDA'];

// Sipariş sürecinin normal akışı (zaman çizelgesi için)
const AKIS: SiparisDurumu[] = ['BEKLEMEDE', 'KABUL_EDILDI', 'HAZIRLANIYOR', 'HAZIR', 'YOLDA', 'TESLIM_EDILDI'];
// Her aşamanın gerçekleştiği zaman damgası (varsa)
const asamaZamani = (s: Siparis, durum: SiparisDurumu): string | undefined => ({
  BEKLEMEDE: s.olusturulmaTarihi,
  KABUL_EDILDI: s.kabulTarihi,
  HAZIRLANIYOR: undefined,
  HAZIR: s.hazirTarihi,
  YOLDA: s.yolaCikisTarihi,
  TESLIM_EDILDI: s.teslimTarihi,
  REDDEDILDI: undefined,
  IPTAL_EDILDI: undefined,
}[durum]);

/** Siparişin hangi aşamada olduğunu adım adım gösteren süreç çizelgesi (gel-al'da YOLDA atlanır). */
const SurecCizelgesi = ({ siparis }: { siparis: Siparis }) => {
  const sonlandi = siparis.durum === 'REDDEDILDI' || siparis.durum === 'IPTAL_EDILDI';
  const akis = siparis.teslimatTuru === 'GEL_AL' ? AKIS.filter(d => d !== 'YOLDA') : AKIS;

  if (sonlandi) {
    const bilgi = SIPARIS_DURUM_BILGISI[siparis.durum];
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 border border-red-400/20 bg-red-500/10">
        <Ban className="w-4 h-4 text-red-300 shrink-0" />
        <span className="text-xs font-bold text-red-200">{bilgi.etiket}</span>
        {siparis.redNedeni && <span className="text-xs text-red-300/70">· {siparis.redNedeni}</span>}
      </div>
    );
  }

  const aktifIndex = akis.indexOf(siparis.durum);
  return (
    <div className="mt-4">
      <div className="flex items-start">
        {akis.map((adim, i) => {
          const tamamlandi = i < aktifIndex;
          const suanki = i === aktifIndex;
          const zaman = asamaZamani(siparis, adim);
          return (
            <div key={adim} className="flex-1 flex flex-col items-center relative">
              {/* Bağlayıcı çizgi (ilk adım hariç) */}
              {i > 0 && (
                <div className={`absolute top-3 right-1/2 left-[-50%] h-0.5 ${i <= aktifIndex ? 'bg-orange-400/70' : 'bg-white/10'}`} />
              )}
              <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors
                ${tamamlandi ? 'bg-orange-400 border-orange-400 text-black'
                  : suanki ? 'border-orange-400 text-orange-300 bg-[#1a1014] ring-4 ring-orange-400/15'
                  : 'border-white/15 text-white/30 bg-white/[0.03]'}`}>
                {tamamlandi ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] font-black">{i + 1}</span>}
              </div>
              <p className={`mt-1.5 text-[9px] font-bold text-center leading-tight ${i <= aktifIndex ? 'text-white/70' : 'text-white/30'}`}>
                {SIPARIS_DURUM_BILGISI[adim].etiket}
              </p>
              {zaman && <p className="text-[9px] text-white/30 mt-0.5">{saatBicimle(zaman)}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SiparislerSekmesi = () => {
  const { siparisler, isLoading, siparisleriGetir } = useIsletmeDeposu();
  const [sekme, setSekme] = useState<'aktif' | 'gecmis'>('aktif');

  // İlk yükleme + 20 sn'de bir otomatik yenileme (yeni sipariş beklemede kalmasın)
  useEffect(() => {
    siparisleriGetir();
    const zamanlayici = setInterval(() => siparisleriGetir(), 20_000);
    return () => clearInterval(zamanlayici);
  }, [siparisleriGetir]);

  const aktif = siparisler.filter(s => AKTIF_DURUMLAR.includes(s.durum));
  const gecmis = siparisler.filter(s => !AKTIF_DURUMLAR.includes(s.durum));
  const liste = sekme === 'aktif' ? aktif : gecmis;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setSekme('aktif')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${sekme === 'aktif' ? 'text-white bg-white/10 border border-white/15' : 'text-white/50 hover:text-white/80'}`}
          >
            Aktif ({aktif.length})
          </button>
          <button
            onClick={() => setSekme('gecmis')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${sekme === 'gecmis' ? 'text-white bg-white/10 border border-white/15' : 'text-white/50 hover:text-white/80'}`}
          >
            Geçmiş ({gecmis.length})
          </button>
        </div>
        <button
          onClick={() => siparisleriGetir()}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Yenile
        </button>
      </div>

      {liste.length === 0 && (
        <p className="text-sm text-white/40 py-12 text-center">
          {sekme === 'aktif' ? 'Şu anda işlem bekleyen sipariş yok.' : 'Geçmiş sipariş yok.'}
        </p>
      )}

      <div className="space-y-3">
        {liste.map(s => <SiparisKarti key={s.id} siparis={s} />)}
      </div>
    </div>
  );
};

const SiparisKarti = ({ siparis }: { siparis: Siparis }) => {
  const { siparisGecis, siparisReddet, siparisTeslim } = useIsletmeDeposu();
  const durumBilgi = SIPARIS_DURUM_BILGISI[siparis.durum];
  const user = useKimlikDeposu(s => s.user);
  const benimRol = useIsletmeDeposu(s => s.benimRol);
  const sahipMi = rolleriAyir(user?.roller).includes(YETKILER.ISLETME_YONETICISI);
  const kurye = benimRol === 'KURYE';
  const gelAl = siparis.teslimatTuru === 'GEL_AL';
  // Üstlenme kuralı: personelde sipariş, kuryede teslimat üzerinden kilitlenir; sahip her zaman serbest.
  const islemYapabilir = sahipMi || (kurye
    ? (!siparis.kuryeKullaniciId || siparis.kuryeKullaniciId === user?.id)
    : (!siparis.isleyenKullaniciId || siparis.isleyenKullaniciId === user?.id));
  const [redAcik, setRedAcik] = useState(false);
  const [redNedeni, setRedNedeni] = useState('');
  const [teslimAcik, setTeslimAcik] = useState(false);
  const [kabulAcik, setKabulAcik] = useState(false);
  const [mesgul, setMesgul] = useState(false);

  const eylem = async (fn: () => Promise<boolean>) => {
    setMesgul(true);
    await fn();
    setMesgul(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 border border-white/10 bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${durumBilgi.renk}`}>{durumBilgi.etiket}</span>
            {gelAl && (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-purple-200 bg-purple-500/15 border border-purple-400/20">🏃 Gel-Al</span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-white/35"><Clock className="w-3 h-3" /> {tarihBicimle(siparis.olusturulmaTarihi)}</span>
          </div>
          <p className="text-[11px] text-white/30 mt-1.5">Sipariş #{siparis.id.slice(0, 8)}</p>
          {siparis.isleyenAdi && (
            <p className="text-[11px] text-cyan-200/70 inline-flex items-center gap-1 mt-0.5">
              <UserCheck className="w-3 h-3" /> Üstlenen: {siparis.isleyenAdi}
            </p>
          )}
        </div>
        <p className="text-lg font-extrabold text-orange-200">{paraBicimle(siparis.toplamTutar)}</p>
      </div>

      {/* Süreç çizelgesi */}
      <SurecCizelgesi siparis={siparis} />

      {/* Kalemler */}
      <div className="mt-3 space-y-1.5 border-t border-white/8 pt-3">
        {siparis.kalemler.map(k => (
          <div key={k.id} className="flex items-center justify-between text-sm">
            <span className="text-white/70"><span className="font-bold text-white/90">{k.adet}×</span> {k.urunAdi}</span>
            <span className="text-white/50">{paraBicimle(k.araToplam)}</span>
          </div>
        ))}
      </div>

      {/* Teslim bilgileri */}
      <div className="mt-3 pt-3 border-t border-white/8 flex flex-wrap gap-x-5 gap-y-1.5">
        <p className="inline-flex items-center gap-1.5 text-xs text-white/50"><MapPin className="w-3.5 h-3.5" /> {siparis.teslimAdresi}</p>
        {siparis.telefon && <p className="inline-flex items-center gap-1.5 text-xs text-white/50"><Phone className="w-3.5 h-3.5" /> {siparis.telefon}</p>}
        <p className="inline-flex items-center gap-1.5 text-xs text-white/50">
          {siparis.odemeYontemi === 'NAKIT' ? <Wallet className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
          {siparis.odemeYontemi === 'NAKIT' ? 'Nakit (beyan)' : 'Kredi Kartı (beyan)'}
        </p>
        {siparis.tahsilEdilenOdeme && (
          <p className="text-xs text-emerald-300/80">Tahsil: {siparis.tahsilEdilenOdeme === 'NAKIT' ? 'Nakit' : 'Kredi Kartı'}</p>
        )}
      </div>
      {siparis.musteriNotu && <p className="text-xs text-white/40 italic mt-2">Not: "{siparis.musteriNotu}"</p>}
      {siparis.durum === 'REDDEDILDI' && siparis.redNedeni && (
        <p className="text-xs text-red-300/80 mt-2">Red nedeni: {siparis.redNedeni}</p>
      )}

      {/* Eylemler — yalnız üstlenen personel veya işletme sahibi */}
      {!islemYapabilir && (
        <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-white/40">
          <Lock className="w-3 h-3" /> Bu siparişi <span className="text-white/60 font-semibold">{siparis.isleyenAdi ?? 'başka bir personel'}</span> üstlendi.
        </div>
      )}
      <div className={`mt-4 flex-wrap gap-2 ${islemYapabilir ? 'flex' : 'hidden'}`}>
        {/* Kurye yalnız teslimat aşamalarını görür (yola çıkar / teslim et) */}
        {!kurye && siparis.durum === 'BEKLEMEDE' && (
          <>
            <Buton renk="onay" mesgul={mesgul} onClick={() => setKabulAcik(v => !v)}>Onayla</Buton>
            <Buton renk="red" mesgul={mesgul} onClick={() => setRedAcik(v => !v)}>Reddet</Buton>
          </>
        )}
        {!kurye && siparis.durum === 'KABUL_EDILDI' && (
          <>
            <Buton renk="onay" mesgul={mesgul} onClick={() => eylem(() => siparisGecis(siparis.id, 'hazirla'))}>Hazırlamaya Başla</Buton>
            <Buton renk="red" mesgul={mesgul} onClick={() => setRedAcik(v => !v)}>Reddet</Buton>
          </>
        )}
        {!kurye && siparis.durum === 'HAZIRLANIYOR' && (
          <Buton renk="onay" mesgul={mesgul} onClick={() => eylem(() => siparisGecis(siparis.id, 'hazir'))}>Hazır</Buton>
        )}
        {siparis.durum === 'HAZIR' && (
          gelAl
            ? (!teslimAcik && <Buton renk="onay" mesgul={mesgul} onClick={() => setTeslimAcik(true)}>Teslim Et (Gel-Al)</Buton>)
            : <Buton renk="onay" mesgul={mesgul} onClick={() => eylem(() => siparisGecis(siparis.id, 'yolda'))}>Yola Çıkar</Buton>
        )}
        {siparis.durum === 'YOLDA' && !teslimAcik && (
          <Buton renk="onay" mesgul={mesgul} onClick={() => setTeslimAcik(true)}>Teslim Et</Buton>
        )}
      </div>

      {/* Kabul: tahmini hazırlık süresi seçimi (öğrenciye "~X dk" olarak bildirilir) */}
      {kabulAcik && siparis.durum === 'BEKLEMEDE' && (
        <div className="mt-3 rounded-xl p-3 border border-white/10 bg-white/[0.02]">
          <p className="text-xs font-bold text-white/60 mb-2">Tahmini hazırlık süresi?</p>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30, 45].map(dk => (
              <Buton key={dk} renk="onay" mesgul={mesgul}
                onClick={() => eylem(async () => { const ok = await siparisGecis(siparis.id, 'kabul', { tahminiHazirDakika: dk }); if (ok) setKabulAcik(false); return ok; })}>
                ~{dk} dk
              </Buton>
            ))}
            <Buton renk="notr" mesgul={mesgul}
              onClick={() => eylem(async () => { const ok = await siparisGecis(siparis.id, 'kabul'); if (ok) setKabulAcik(false); return ok; })}>
              Süre belirtmeden onayla
            </Buton>
          </div>
        </div>
      )}

      {/* Teslim: tahsil edilen ödeme seçimi (gel-al'da HAZIR'dan doğrudan teslim) */}
      {teslimAcik && (siparis.durum === 'YOLDA' || (gelAl && siparis.durum === 'HAZIR')) && (
        <div className="mt-3 rounded-xl p-3 border border-white/10 bg-white/[0.02]">
          <p className="text-xs font-bold text-white/60 mb-2">Ödeme nasıl tahsil edildi?</p>
          <div className="flex gap-2">
            <Buton renk="onay" mesgul={mesgul} onClick={() => eylem(async () => { const ok = await siparisTeslim(siparis.id, 'NAKIT'); if (ok) setTeslimAcik(false); return ok; })}>
              <Wallet className="w-4 h-4" /> Nakit Alındı
            </Buton>
            <Buton renk="onay" mesgul={mesgul} onClick={() => eylem(async () => { const ok = await siparisTeslim(siparis.id, 'KREDI_KARTI'); if (ok) setTeslimAcik(false); return ok; })}>
              <CreditCard className="w-4 h-4" /> Kart ile Alındı
            </Buton>
            <Buton renk="notr" mesgul={mesgul} onClick={() => setTeslimAcik(false)}>Vazgeç</Buton>
          </div>
        </div>
      )}

      {/* Reddet: neden */}
      {redAcik && (
        <div className="mt-3 rounded-xl p-3 border border-white/10 bg-white/[0.02]">
          <input
            value={redNedeni}
            onChange={e => setRedNedeni(e.target.value)}
            placeholder="Red nedeni (örn. Ürün tükendi)"
            className="w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-red-400/40 focus:outline-none mb-2"
          />
          <div className="flex gap-2">
            <Buton renk="red" mesgul={mesgul} onClick={() => eylem(async () => { const ok = await siparisReddet(siparis.id, redNedeni.trim()); if (ok) { setRedAcik(false); setRedNedeni(''); } return ok; })}>
              Reddet
            </Buton>
            <Buton renk="notr" mesgul={mesgul} onClick={() => setRedAcik(false)}>Vazgeç</Buton>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const Buton = ({ children, renk, mesgul, onClick }: {
  children: React.ReactNode; renk: 'onay' | 'red' | 'notr'; mesgul: boolean; onClick: () => void;
}) => {
  const renkSinifi =
    renk === 'onay' ? 'text-white gradient-btn shadow-lg shadow-orange-500/10'
    : renk === 'red' ? 'text-red-200 bg-red-500/15 hover:bg-red-500/25 border border-red-400/20'
    : 'text-white/60 bg-white/5 hover:bg-white/10 border border-white/10';
  return (
    <button
      onClick={onClick}
      disabled={mesgul}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 ${renkSinifi}`}
    >
      {children}
    </button>
  );
};
