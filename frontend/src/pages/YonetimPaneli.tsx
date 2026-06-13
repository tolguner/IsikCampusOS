import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Users, ScrollText, Plus, RefreshCw, KeyRound, Trash2, Pencil, X, Search, Store } from 'lucide-react';
import {
  useYonetimDeposu,
  type YonetimKullanicisi,
  type KullaniciOlusturmaFormu,
} from '../depolar/yonetimDeposu';
import { DuyuruButonu } from '../components/DuyuruButonu';
import { SaticilarSekmesi } from '../components/yonetim/SaticilarSekmesi';
import { ROL_ETIKETLERI, rolEtiketle } from '../yardimcilar/yetkiler';

type Sekme = 'kullanicilar' | 'loglar' | 'saticilar';

// Buradan oluşturulabilir roller (R12): öğrenci→Öğrenci İşleri, işletme personeli→İşletme Yöneticisi,
// işletme yöneticisi→İşletme Yönetimi sekmesi. Bu yüzden create listesinde yer almazlar.
const OLUSTURULABILIR_ROLLER = ['ROLE_ADMIN', 'ROLE_SKS_ADMIN', 'ROLE_FACILITY_ADMIN', 'ROLE_REGISTRAR'];
// Filtrede mevcut işletme yöneticileri de görünür (listede yer alırlar).
const FILTRE_ROLLERI = [...OLUSTURULABILIR_ROLLER, 'ROLE_VENDOR_ADMIN'];
const KAN_GRUPLARI = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];

// Personel durumu yalnızca AKTIF/PASIF; MEZUN/ILISIGI_KESILMIS öğrencilere özgüdür.
const PERSONEL_DURUMLARI: Record<string, string> = {
  AKTIF: 'Aktif',
  PASIF: 'Pasif',
};
const DURUM_ETIKETLERI: Record<string, string> = {
  ...PERSONEL_DURUMLARI,
  MEZUN: 'Mezun',
  ILISIGI_KESILMIS: 'İlişiği Kesilmiş',
};

const inputClass =
  'w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60';

export const YonetimPaneli = () => {
  const {
    kullanicilar, toplamKullanici, loglar, isLoading, hata, basariMesaji,
    temizleMesajlar, kullanicilariGetir, kullaniciOlustur, kullaniciGuncelle,
    sifreSifirla, kullaniciSil, loglariGetir,
  } = useYonetimDeposu();

  const [sekme, setSekme] = useState<Sekme>('kullanicilar');
  const [arama, setArama] = useState('');
  const [rolFiltre, setRolFiltre] = useState('');
  const [logVarlik, setLogVarlik] = useState('');
  const [logArama, setLogArama] = useState('');

  const [olusturModal, setOlusturModal] = useState(false);
  const [duzenle, setDuzenle] = useState<YonetimKullanicisi | null>(null);

  useEffect(() => {
    if (sekme === 'kullanicilar') {
      const t = setTimeout(() => kullanicilariGetir(0, 20, arama, '', rolFiltre), 250);
      return () => clearTimeout(t);
    }
  }, [sekme, arama, rolFiltre, kullanicilariGetir]);

  useEffect(() => {
    if (sekme === 'loglar') loglariGetir();
  }, [sekme, loglariGetir]);

  const filtrelenmisLoglar = useMemo(() => {
    const q = logArama.trim().toLowerCase();
    return loglar.filter(l =>
      (!logVarlik || l.varlikTuru === logVarlik) &&
      (!q || l.islem.toLowerCase().includes(q) || l.mesaj.toLowerCase().includes(q) || (l.islemYapanId || '').toLowerCase().includes(q))
    );
  }, [loglar, logVarlik, logArama]);

  return (
    <div className="space-y-6 text-white pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-purple-300/25 bg-purple-500/10 text-purple-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-normal text-white">Sistem Yönetim Paneli</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/45">
              Tüm kullanıcı ve rolleri yönetin, sistem denetim kayıtlarını inceleyin.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DuyuruButonu />
          <button
            type="button"
            onClick={() => (sekme === 'kullanicilar' ? kullanicilariGetir(0, 20, arama, '', rolFiltre) : loglariGetir())}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/5 pb-px">
        <button onClick={() => setSekme('kullanicilar')}
          className={`inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition cursor-pointer ${sekme === 'kullanicilar' ? 'border-purple-300 text-purple-200' : 'border-transparent text-white/40 hover:text-white/60'}`}>
          <Users className="h-4 w-4" /> Kullanıcı & Rol Yönetimi ({toplamKullanici})
        </button>
        <button onClick={() => setSekme('saticilar')}
          className={`inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition cursor-pointer ${sekme === 'saticilar' ? 'border-purple-300 text-purple-200' : 'border-transparent text-white/40 hover:text-white/60'}`}>
          <Store className="h-4 w-4" /> İşletme Yönetimi
        </button>
        <button onClick={() => setSekme('loglar')}
          className={`inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition cursor-pointer ${sekme === 'loglar' ? 'border-purple-300 text-purple-200' : 'border-transparent text-white/40 hover:text-white/60'}`}>
          <ScrollText className="h-4 w-4" /> Sistem Logları
        </button>
      </div>

      {(hata || basariMesaji) && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-between ${hata ? 'border border-red-400/25 bg-red-500/12 text-red-100' : 'border border-emerald-300/25 bg-emerald-500/12 text-emerald-100'}`}>
          <span>{hata || basariMesaji}</span>
          <button onClick={temizleMesajlar} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      )}

      {sekme === 'saticilar' && <SaticilarSekmesi />}

      {sekme === 'kullanicilar' && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Ad, e-posta veya öğrenci no ara" className={`${inputClass} pl-11`} />
            </div>
            <select value={rolFiltre} onChange={e => setRolFiltre(e.target.value)} className="rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-400/60">
              <option value="">Tüm roller</option>
              {FILTRE_ROLLERI.map(r => <option key={r} value={r}>{ROL_ETIKETLERI[r]}</option>)}
            </select>
            <button onClick={() => setOlusturModal(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-500 hover:bg-purple-400 px-5 py-3 text-sm font-black text-white transition cursor-pointer">
              <Plus className="h-4 w-4" /> Yeni Kullanıcı
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.025]">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-white/35 bg-white/[0.025] border-b border-white/10">
                  <th className="px-5 py-4 font-bold">Kullanıcı</th>
                  <th className="px-5 py-4 font-bold">Rol</th>
                  <th className="px-5 py-4 font-bold">Durum</th>
                  <th className="px-5 py-4 font-bold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {kullanicilar.map(k => (
                  <tr key={k.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{[k.ad, k.soyad].filter(Boolean).join(' ') || '—'}</div>
                      <div className="text-xs text-white/40">{k.eposta}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full px-3 py-1 text-xs font-bold text-purple-100 bg-purple-500/15 border border-purple-400/20">{rolEtiketle(k.roller)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${k.durum === 'AKTIF' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-white/5 text-white/50 border-white/10'}`}>
                        {DURUM_ETIKETLERI[k.durum] || k.durum}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setDuzenle(k)} title="Düzenle" className="p-2 rounded-xl text-blue-300 hover:bg-white/5 cursor-pointer"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => { const tc = window.prompt(`${k.eposta} kullanıcısının şifresi, gireceğiniz TC Kimlik numarasına sıfırlanacaktır.\nTC Kimlik No (11 hane):`); if (tc && tc.trim()) sifreSifirla(k.id, tc.trim()); }} title="Şifre Sıfırla (TC'ye)" className="p-2 rounded-xl text-amber-300 hover:bg-white/5 cursor-pointer"><KeyRound className="h-4 w-4" /></button>
                        <button onClick={() => { if (window.confirm(`${k.eposta} kullanıcısını kalıcı olarak silmek istediğinize emin misiniz?`)) kullaniciSil(k.id); }} title="Sil" className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {kullanicilar.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-white/35">Kayıt bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {sekme === 'loglar' && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={logArama} onChange={e => setLogArama(e.target.value)} placeholder="İşlem, mesaj veya kullanıcı ara" className={`${inputClass} pl-11`} />
            </div>
            <select value={logVarlik} onChange={e => setLogVarlik(e.target.value)} className="rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-400/60">
              <option value="">Tüm varlıklar</option>
              <option value="KULLANICI">Kullanıcı</option>
              <option value="KULUP">Kulüp</option>
              <option value="ETKINLIK">Etkinlik</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.025]">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-white/35 bg-white/[0.025] border-b border-white/10">
                  <th className="px-5 py-4 font-bold">Tarih</th>
                  <th className="px-5 py-4 font-bold">İşlem</th>
                  <th className="px-5 py-4 font-bold">Varlık</th>
                  <th className="px-5 py-4 font-bold">Yapan</th>
                  <th className="px-5 py-4 font-bold">Mesaj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtrelenmisLoglar.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.02] align-top">
                    <td className="px-5 py-4 text-xs text-white/50 whitespace-nowrap">{new Date(l.olusturulmaTarihi).toLocaleString('tr-TR')}</td>
                    <td className="px-5 py-4"><span className="rounded-lg px-2 py-0.5 text-xs font-bold text-cyan-200 bg-cyan-500/10 border border-cyan-400/20">{l.islem}</span></td>
                    <td className="px-5 py-4 text-xs text-white/60">{l.varlikTuru}</td>
                    <td className="px-5 py-4 text-xs text-white/50">{l.islemYapanRol || '—'}</td>
                    <td className="px-5 py-4 text-sm text-white/70">{l.mesaj}</td>
                  </tr>
                ))}
                {filtrelenmisLoglar.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-white/35">Log kaydı bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {olusturModal && (
        <KullaniciOlusturModal
          onKapat={() => setOlusturModal(false)}
          onKaydet={async (form) => { const olusan = await kullaniciOlustur(form); if (olusan) setOlusturModal(false); }}
        />
      )}

      {duzenle && (
        <KullaniciDuzenleModal
          kullanici={duzenle}
          onKapat={() => setDuzenle(null)}
          onKaydet={async (form) => { const ok = await kullaniciGuncelle(duzenle.id, form); if (ok) setDuzenle(null); }}
        />
      )}
    </div>
  );
};

const ModalKabuk = ({ baslik, onKapat, children }: { baslik: string; onKapat: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
    <div className="w-full max-w-md rounded-3xl p-6 space-y-5 relative text-white bg-[#0f0f1c] border border-white/10 shadow-2xl">
      <button type="button" onClick={onKapat} className="absolute top-4 right-4 text-white/40 hover:text-white/70 cursor-pointer"><X className="h-5 w-5" /></button>
      <h3 className="text-lg font-black">{baslik}</h3>
      {children}
    </div>
  </div>
);

const KullaniciOlusturModal = ({ onKapat, onKaydet }: { onKapat: () => void; onKaydet: (f: KullaniciOlusturmaFormu) => void }) => {
  const [form, setForm] = useState<KullaniciOlusturmaFormu>({ eposta: '', roller: 'ROLE_SKS_ADMIN', ad: '', soyad: '', birim: '', telefon: '', ikametAdresi: '', kanGrubu: '', tcKimlikNo: '' });
  const upd = (k: keyof KullaniciOlusturmaFormu, v: string) => setForm(p => ({ ...p, [k]: v }));
  const tcGecerli = /^\d{11}$/.test(form.tcKimlikNo);
  const gecerli = form.eposta.includes('@') && !!form.ad?.trim() && !!form.roller && tcGecerli;
  return (
    <ModalKabuk baslik="Yeni Personel Kullanıcısı" onKapat={onKapat}>
      <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Ad" value={form.ad} onChange={e => upd('ad', e.target.value)} />
          <input className={inputClass} placeholder="Soyad" value={form.soyad} onChange={e => upd('soyad', e.target.value)} />
        </div>
        <input className={inputClass} placeholder="E-posta" value={form.eposta} onChange={e => upd('eposta', e.target.value)} />
        <select className={inputClass} value={form.roller} onChange={e => upd('roller', e.target.value)}>
          {OLUSTURULABILIR_ROLLER.map(r => <option key={r} value={r}>{ROL_ETIKETLERI[r]}</option>)}
        </select>
        <input className={inputClass} placeholder="Birim (örn. Spor Müdürlüğü)" value={form.birim} onChange={e => upd('birim', e.target.value)} />
        <input className={inputClass} inputMode="numeric" maxLength={11} placeholder="TC Kimlik No (11 hane) — zorunlu" value={form.tcKimlikNo} onChange={e => upd('tcKimlikNo', e.target.value.replace(/\D/g, '').slice(0, 11))} />
        {!tcGecerli && form.tcKimlikNo.length > 0 && <p className="-mt-1 text-xs text-red-300">TC Kimlik No 11 haneli olmalıdır.</p>}
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Telefon" value={form.telefon} onChange={e => upd('telefon', e.target.value)} />
          <select className={inputClass} value={form.kanGrubu} onChange={e => upd('kanGrubu', e.target.value)}>
            <option value="">Kan grubu</option>
            {KAN_GRUPLARI.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <input className={inputClass} placeholder="İkametgah adresi" value={form.ikametAdresi} onChange={e => upd('ikametAdresi', e.target.value)} />
        <p className="text-xs text-white/35">Başlangıç şifresi TC Kimlik numarasıdır; kullanıcı ilk girişte değiştirir.</p>
        <button disabled={!gecerli} onClick={() => onKaydet(form)} className="w-full rounded-2xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 text-sm font-black text-white cursor-pointer">Oluştur</button>
      </div>
    </ModalKabuk>
  );
};

const KullaniciDuzenleModal = ({ kullanici, onKapat, onKaydet }: { kullanici: YonetimKullanicisi; onKapat: () => void; onKaydet: (f: any) => void }) => {
  const [form, setForm] = useState({
    ad: kullanici.ad || '', soyad: kullanici.soyad || '', eposta: kullanici.eposta || '',
    birim: kullanici.birim || '', telefon: kullanici.telefon || '',
    ikametAdresi: kullanici.ikametAdresi || '', kanGrubu: kullanici.kanGrubu || '',
    durum: kullanici.durum,
  });
  const upd = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));
  return (
    <ModalKabuk baslik={`Düzenle — ${rolEtiketle(kullanici.roller)}`} onKapat={onKapat}>
      <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Ad" value={form.ad} onChange={e => upd('ad', e.target.value)} />
          <input className={inputClass} placeholder="Soyad" value={form.soyad} onChange={e => upd('soyad', e.target.value)} />
        </div>
        <input className={inputClass} placeholder="E-posta" value={form.eposta} onChange={e => upd('eposta', e.target.value)} />
        <input className={inputClass} placeholder="Birim" value={form.birim} onChange={e => upd('birim', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Telefon" value={form.telefon} onChange={e => upd('telefon', e.target.value)} />
          <select className={inputClass} value={form.kanGrubu} onChange={e => upd('kanGrubu', e.target.value)}>
            <option value="">Kan grubu</option>
            {KAN_GRUPLARI.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <input className={inputClass} placeholder="İkametgah adresi" value={form.ikametAdresi} onChange={e => upd('ikametAdresi', e.target.value)} />
        <label className="block text-xs font-bold uppercase tracking-wider text-white/35">Durum</label>
        <select className={inputClass} value={form.durum} onChange={e => upd('durum', e.target.value)}>
          {Object.keys(PERSONEL_DURUMLARI).map(d => <option key={d} value={d}>{PERSONEL_DURUMLARI[d]}</option>)}
        </select>
        <p className="text-[11px] text-white/30">TC Kimlik No ve rol değiştirilemez.</p>
        <button onClick={() => onKaydet(form)} className="w-full rounded-2xl bg-purple-500 hover:bg-purple-400 px-5 py-3 text-sm font-black text-white cursor-pointer">Kaydet</button>
      </div>
    </ModalKabuk>
  );
};
