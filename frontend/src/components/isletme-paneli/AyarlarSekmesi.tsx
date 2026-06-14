import { useEffect, useState } from 'react';
import { Clock, Store as StoreIcon, Save, ShieldCheck, Send } from 'lucide-react';
import { useIsletmeDeposu, type SaticiAyarFormu, type CalismaSaatiGun } from '../../depolar/isletmeDeposu';
import { GorselYukleyici } from '../ortak/GorselYukleyici';

export const MUTFAK_TURLERI = [
  'Fast Food', 'Kafe', 'Tatlı & Pastane', 'Ev Yemekleri', 'Pizza & Burger',
  'İçecek', 'Kahvaltı', 'Dünya Mutfağı', 'Atıştırmalık',
];

const GUN_ADLARI = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// Onaya tabi genel/kimlik alanları (tek talep grubu olarak gönderilir).
type GenelAlan = 'ad' | 'mutfakTuru' | 'aciklama' | 'konumMetni' | 'logoUrl' | 'kapakGorselUrl';
const GENEL_ALANLAR: GenelAlan[] = ['ad', 'mutfakTuru', 'aciklama', 'konumMetni', 'logoUrl', 'kapakGorselUrl'];
const ALAN_ETIKET: Record<GenelAlan, string> = {
  ad: 'İşletme Adı', mutfakTuru: 'Mutfak Türü', aciklama: 'Açıklama',
  konumMetni: 'Konum', logoUrl: 'Logo', kapakGorselUrl: 'Kapak Görseli',
};

// "HH:mm:ss" veya "HH:mm" → "HH:mm"
const saatKisalt = (s?: string | null) => (s ? s.slice(0, 5) : '');

const girisSinifi = 'w-full rounded-xl px-3.5 py-2.5 text-sm text-white bg-white/5 border border-white/10 focus:border-orange-400/40 focus:outline-none';

export const AyarlarSekmesi = () => {
  const {
    satici, calismaSaatleri, isLoading, degisiklikTalepleri,
    saticimiGetir, saticiGuncelle, calismaSaatleriGetir, calismaSaatleriKaydet,
    taleplerimGetir, genelBilgiTalepEt,
  } = useIsletmeDeposu();

  const [profil, setProfil] = useState<SaticiAyarFormu>({});
  // Genel/kimlik bilgileri (onaya tabi) — tek formda düzenlenir, tek talep gönderilir.
  const [genel, setGenel] = useState<Record<GenelAlan, string>>({
    ad: '', mutfakTuru: '', aciklama: '', konumMetni: '', logoUrl: '', kapakGorselUrl: '',
  });
  const [gunler, setGunler] = useState<CalismaSaatiGun[]>(
    Array.from({ length: 7 }, (_, i) => ({ gun: i + 1, acilis: '09:00', kapanis: '22:00', kapali: false }))
  );

  useEffect(() => { saticimiGetir(); calismaSaatleriGetir(); taleplerimGetir(); }, [saticimiGetir, calismaSaatleriGetir, taleplerimGetir]);

  // Satıcı yüklenince profil formunu doldur
  useEffect(() => {
    if (satici) {
      setProfil({
        ad: satici.ad, aciklama: satici.aciklama ?? '', konumMetni: satici.konumMetni ?? '',
        logoUrl: satici.logoUrl ?? '', mutfakTuru: satici.mutfakTuru ?? '',
        kapakGorselUrl: satici.kapakGorselUrl ?? '',
        teslimatUcreti: satici.teslimatUcreti ?? 0,
        minimumSepetTutari: satici.minimumSepetTutari ?? 0,
        tahminiTeslimatDakika: satici.tahminiTeslimatDakika ?? undefined,
      });
    }
  }, [satici]);

  // Genel bilgi formunu satıcıdan doldur
  useEffect(() => {
    if (satici) {
      setGenel({
        ad: satici.ad ?? '', mutfakTuru: satici.mutfakTuru ?? '', aciklama: satici.aciklama ?? '',
        konumMetni: satici.konumMetni ?? '', logoUrl: satici.logoUrl ?? '', kapakGorselUrl: satici.kapakGorselUrl ?? '',
      });
    }
  }, [satici]);

  // Mevcut saatleri editöre yansıt
  useEffect(() => {
    if (calismaSaatleri.length > 0) {
      setGunler(Array.from({ length: 7 }, (_, i) => {
        const mevcut = calismaSaatleri.find(c => c.gun === i + 1);
        return mevcut
          ? { gun: i + 1, acilis: saatKisalt(mevcut.acilis) || '09:00', kapanis: saatKisalt(mevcut.kapanis) || '22:00', kapali: mevcut.kapali }
          : { gun: i + 1, acilis: '09:00', kapanis: '22:00', kapali: true };
      }));
    }
  }, [calismaSaatleri]);

  const gunGuncelle = (idx: number, k: Partial<CalismaSaatiGun>) =>
    setGunler(g => g.map((x, i) => (i === idx ? { ...x, ...k } : x)));

  // Genel bilgi talep durumu + değişen alanlar
  const bekleyenler = degisiklikTalepleri.filter(t => t.durum === 'BEKLEMEDE');
  const bekleyenGrupVar = bekleyenler.length > 0;
  const revizeTalep = !bekleyenGrupVar ? degisiklikTalepleri.find(t => t.durum === 'REVIZE_TALEP') : undefined;
  const genelMevcut = (alan: GenelAlan) => (satici?.[alan] ?? '') as string;
  const degisenAlanlar = GENEL_ALANLAR.filter(a => genel[a] !== genelMevcut(a));
  const genelTalepGonder = async () => {
    const diff: Record<string, string> = {};
    degisenAlanlar.forEach(a => { diff[a] = genel[a]; });
    if (Object.keys(diff).length > 0) await genelBilgiTalepEt(diff);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Operasyonel ayarlar (doğrudan düzenlenir) */}
      <div className="rounded-2xl p-5 border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <StoreIcon className="w-5 h-5 text-orange-200" />
          <h3 className="text-base font-extrabold text-white">Operasyonel Ayarlar</h3>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Alan etiket="Teslimat Ücreti (₺)">
              <input type="number" min={0} step="0.5" className={girisSinifi} value={profil.teslimatUcreti ?? 0} onChange={e => setProfil(p => ({ ...p, teslimatUcreti: parseFloat(e.target.value) || 0 }))} />
            </Alan>
            <Alan etiket="Min. Sepet (₺)">
              <input type="number" min={0} step="0.5" className={girisSinifi} value={profil.minimumSepetTutari ?? 0} onChange={e => setProfil(p => ({ ...p, minimumSepetTutari: parseFloat(e.target.value) || 0 }))} />
            </Alan>
          </div>
          <Alan etiket="Tahmini Teslimat (dakika)">
            <input type="number" min={0} className={girisSinifi} value={profil.tahminiTeslimatDakika ?? ''} onChange={e => setProfil(p => ({ ...p, tahminiTeslimatDakika: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="örn. 30" />
          </Alan>
          <button
            disabled={isLoading}
            onClick={() => saticiGuncelle(profil)}
            className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold text-white gradient-btn shadow-lg shadow-orange-500/15 disabled:opacity-40"
          >
            <Save className="w-4 h-4" /> Kaydet
          </button>
        </div>

        {/* Genel/kimlik bilgileri — değişiklik talebi (admin onayına gider) */}
        <div className="flex items-center gap-2 mt-6 mb-3 pt-4 border-t border-white/8">
          <ShieldCheck className="w-5 h-5 text-amber-200" />
          <h3 className="text-base font-extrabold text-white">Genel Bilgiler <span className="text-[11px] font-bold text-amber-200/80">(onaya tabi)</span></h3>
        </div>
        <p className="text-[11px] text-white/40 mb-3">Bu bilgilerin değişikliği onaydan geçer. İstediğiniz alanları düzenleyip <b>tek seferde</b> "Değişiklik Talep Et" deyin.</p>

        {bekleyenGrupVar && (
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 mb-3 text-xs text-amber-100">
            <p className="font-bold">⏳ Değişiklik talebiniz onay bekliyor</p>
            <p className="mt-1 text-amber-100/75">{bekleyenler.map(t => ALAN_ETIKET[t.alanAdi as GenelAlan] || t.alanAdi).join(', ')}</p>
          </div>
        )}
        {revizeTalep && (
          <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 mb-3 text-xs text-red-200">
            ↩ Revize istendi{revizeTalep.geriBildirim ? `: ${revizeTalep.geriBildirim}` : ''}. Düzenleyip tekrar gönderebilirsiniz.
          </div>
        )}

        <div className="space-y-3">
          <Alan etiket="İşletme Adı">
            <input className={girisSinifi} value={genel.ad} disabled={bekleyenGrupVar} onChange={e => setGenel(g => ({ ...g, ad: e.target.value }))} />
          </Alan>
          <Alan etiket="Mutfak Türü">
            <select className={girisSinifi} value={genel.mutfakTuru} disabled={bekleyenGrupVar} onChange={e => setGenel(g => ({ ...g, mutfakTuru: e.target.value }))}>
              <option value="">Seçiniz</option>
              {MUTFAK_TURLERI.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Alan>
          <Alan etiket="Açıklama">
            <input className={girisSinifi} value={genel.aciklama} disabled={bekleyenGrupVar} onChange={e => setGenel(g => ({ ...g, aciklama: e.target.value }))} />
          </Alan>
          <Alan etiket="Konum">
            <input className={girisSinifi} value={genel.konumMetni} disabled={bekleyenGrupVar} onChange={e => setGenel(g => ({ ...g, konumMetni: e.target.value }))} />
          </Alan>
          <div className="grid grid-cols-2 gap-3">
            <Alan etiket="Logo">
              <GorselYukleyici value={genel.logoUrl} onChange={url => !bekleyenGrupVar && setGenel(g => ({ ...g, logoUrl: url }))} oranSinifi="aspect-square" maksKenar={400} />
            </Alan>
            <Alan etiket="Kapak Görseli">
              <GorselYukleyici value={genel.kapakGorselUrl} onChange={url => !bekleyenGrupVar && setGenel(g => ({ ...g, kapakGorselUrl: url }))} oranSinifi="aspect-square" maksKenar={1200} />
            </Alan>
          </div>
          <button
            type="button"
            disabled={bekleyenGrupVar || isLoading || degisenAlanlar.length === 0}
            onClick={genelTalepGonder}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold text-amber-100 bg-amber-500/15 border border-amber-400/25 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Değişiklik Talep Et{degisenAlanlar.length > 0 ? ` (${degisenAlanlar.length} alan)` : ''}
          </button>
        </div>
      </div>

      {/* Çalışma saatleri */}
      <div className="rounded-2xl p-5 border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-orange-200" />
          <h3 className="text-base font-extrabold text-white">Çalışma Saatleri</h3>
        </div>
        <div className="space-y-2">
          {gunler.map((g, i) => (
            <div key={g.gun} className="flex items-center gap-2 rounded-xl px-3 py-2 border border-white/8 bg-white/[0.02]">
              <span className="w-20 text-sm font-bold text-white/80">{GUN_ADLARI[g.gun]}</span>
              <label className="flex items-center gap-1.5 text-xs text-white/55 cursor-pointer select-none">
                <input type="checkbox" checked={!g.kapali} onChange={e => gunGuncelle(i, { kapali: !e.target.checked })} className="accent-orange-500" />
                Açık
              </label>
              {!g.kapali ? (
                <div className="flex items-center gap-1.5 ml-auto">
                  <input type="time" value={g.acilis} onChange={e => gunGuncelle(i, { acilis: e.target.value })} className="rounded-lg px-2 py-1 text-sm text-white bg-white/5 border border-white/10 [color-scheme:dark]" />
                  <span className="text-white/40">–</span>
                  <input type="time" value={g.kapanis} onChange={e => gunGuncelle(i, { kapanis: e.target.value })} className="rounded-lg px-2 py-1 text-sm text-white bg-white/5 border border-white/10 [color-scheme:dark]" />
                </div>
              ) : (
                <span className="ml-auto text-sm text-white/35">Kapalı</span>
              )}
            </div>
          ))}
        </div>
        <button
          disabled={isLoading}
          onClick={() => calismaSaatleriKaydet(gunler)}
          className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold text-white gradient-btn shadow-lg shadow-orange-500/15 disabled:opacity-40"
        >
          <Save className="w-4 h-4" /> Saatleri Kaydet
        </button>
        <p className="text-[11px] text-white/30 mt-2">
          Öğrenciler bu saatleri görür; sipariş yalnızca açık saatlerde verilebilir. "Siparişe Açık/Kapalı"
          ana anahtarı yoğunlukta saatlerden bağımsız olarak işletmeyi kapatır.
        </p>
      </div>
    </div>
  );
};

const Alan = ({ etiket, children }: { etiket: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-white/60 mb-1.5">{etiket}</label>
    {children}
  </div>
);

