import { Fragment, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, X, Store, MapPin, UserCog, Trash2, ChevronRight, ChevronDown, UserCheck, Users, Bike } from 'lucide-react';
import {
  useAdminSaticiDeposu,
  type SaticiVeSahipFormu,
  type SaticiGuncellemeFormu,
} from '../../depolar/adminSaticiDeposu';
import type { Satici } from '../../depolar/yemekDeposu';
import { KonumSecici } from '../kulup-paneli/KonumSecici';
import { GorselYukleyici } from '../ortak/GorselYukleyici';

const inputClass =
  'w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60';

// Harita varsayılan merkezi — İşık Üniversitesi Şile Kampüsü.
const VARSAYILAN_KONUM = { enlem: 41.1762, boylam: 29.6128 };

export const SaticilarSekmesi = () => {
  const {
    saticilar, vendorAdminler, personelMap, isLoading,
    saticilariGetir, vendorAdminleriGetir, personelGetir, saticiVeSahipOlustur, saticiGuncelle, saticiSil, yoneticiDegistir,
  } = useAdminSaticiDeposu();

  const [olusturModal, setOlusturModal] = useState(false);
  const [duzenle, setDuzenle] = useState<Satici | null>(null);
  const [yoneticiModal, setYoneticiModal] = useState<Satici | null>(null);
  const [genisleyen, setGenisleyen] = useState<Set<string>>(new Set());

  useEffect(() => { saticilariGetir(); vendorAdminleriGetir(); }, [saticilariGetir, vendorAdminleriGetir]);

  const yoneticiBilgi = useMemo(() => {
    const m = new Map<string, { eposta: string; ad?: string }>();
    vendorAdminler.forEach(v => m.set(v.id, { eposta: v.eposta, ad: [v.ad, v.soyad].filter(Boolean).join(' ') }));
    return m;
  }, [vendorAdminler]);

  const genislet = (s: Satici) => {
    setGenisleyen(prev => {
      const next = new Set(prev);
      if (next.has(s.id)) { next.delete(s.id); return next; }
      next.add(s.id);
      if (!personelMap[s.id]) personelGetir(s.id);
      return next;
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white/45">{saticilar.length} işletme kayıtlı</p>
        <button onClick={() => setOlusturModal(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-500 hover:bg-purple-400 px-5 py-3 text-sm font-black text-white transition cursor-pointer">
          <Plus className="h-4 w-4" /> Yeni İşletme
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.025]">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-white/35 bg-white/[0.025] border-b border-white/10">
              <th className="px-5 py-4 font-bold">Satıcı</th>
              <th className="px-5 py-4 font-bold">Yönetici</th>
              <th className="px-5 py-4 font-bold">Durum</th>
              <th className="px-5 py-4 font-bold">Sipariş</th>
              <th className="px-5 py-4 font-bold text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {saticilar.map(s => {
              const acik = genisleyen.has(s.id);
              const yonetici = s.yoneticiKullaniciId ? yoneticiBilgi.get(s.yoneticiKullaniciId) : undefined;
              const personeller = personelMap[s.id];
              return (
              <Fragment key={s.id}>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => genislet(s)} title={acik ? 'Daralt' : 'Yönetici ve personelleri göster'} className="p-1 rounded-lg text-white/40 hover:bg-white/10 hover:text-white cursor-pointer">
                      {acik ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-500/15 border border-orange-400/20 text-orange-200 overflow-hidden">
                      {s.logoUrl ? <img src={s.logoUrl} alt={s.ad} className="h-full w-full object-cover" /> : <Store className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{s.ad}</div>
                      {s.konumMetni && <div className="inline-flex items-center gap-1 text-xs text-white/40"><MapPin className="h-3 w-3" /> {s.konumMetni}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-white/55">{yonetici?.ad || yonetici?.eposta || (s.yoneticiKullaniciId ? s.yoneticiKullaniciId.slice(0, 8) : '—')}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${s.durum === 'AKTIF' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-white/5 text-white/50 border-white/10'}`}>
                    {s.durum === 'AKTIF' ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-bold ${s.acik ? 'text-emerald-300' : 'text-white/40'}`}>{s.acik ? '● Açık' : '○ Kapalı'}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setDuzenle(s)} title="Düzenle" className="p-2 rounded-xl text-blue-300 hover:bg-white/5 cursor-pointer"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setYoneticiModal(s)} title="Yöneticiyi Değiştir" className="p-2 rounded-xl text-amber-300 hover:bg-white/5 cursor-pointer"><UserCog className="h-4 w-4" /></button>
                    <button onClick={() => { if (window.confirm(`"${s.ad}" işletmesi ve tüm menü/sipariş/personel kayıtları kalıcı silinecek; mevcut yönetici PASIF'e alınacak. Emin misiniz?`)) saticiSil(s.id); }} title="Sil" className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
              {acik && (
                <tr className="bg-white/[0.015]">
                  <td colSpan={5} className="px-5 py-4">
                    <div className="ml-7 space-y-3 border-l-2 border-white/10 pl-5">
                      {/* Yönetici */}
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4 text-amber-300 shrink-0" />
                        <span className="font-bold text-white/80">Yönetici:</span>
                        {yonetici ? (
                          <span className="text-white/60">{yonetici.ad || '—'} <span className="text-white/35">· {yonetici.eposta}</span></span>
                        ) : <span className="text-white/35">Atanmamış</span>}
                      </div>
                      {/* Personeller */}
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-cyan-300 shrink-0" />
                          <span className="font-bold text-white/80">Personeller</span>
                          <span className="text-white/35">({personeller?.length ?? 0})</span>
                        </div>
                        <div className="mt-2 ml-6 space-y-1.5">
                          {personeller === undefined && <p className="text-xs text-white/35">Yükleniyor…</p>}
                          {personeller && personeller.length === 0 && <p className="text-xs text-white/35">Bu işletmeye bağlı personel yok.</p>}
                          {personeller?.map(p => (
                            <div key={p.id} className="flex flex-wrap items-center gap-2 text-xs">
                              {p.rol === 'KURYE' ? <Bike className="h-3.5 w-3.5 text-purple-300" /> : <Users className="h-3.5 w-3.5 text-white/40" />}
                              <span className="font-semibold text-white/75">{p.ad || '—'}</span>
                              <span className="text-white/35">{p.eposta}</span>
                              <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/45">{p.rol === 'KURYE' ? 'Kurye' : 'Personel'}</span>
                              <span className={`rounded px-1.5 py-0.5 text-[10px] ${p.durum === 'AKTIF' ? 'text-emerald-300' : 'text-white/40'}`}>{p.durum === 'AKTIF' ? 'Aktif' : 'Pasif'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
              );
            })}
            {saticilar.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-white/35">Henüz satıcı kaydı yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {olusturModal && (
        <SaticiOlusturModal
          isLoading={isLoading}
          onKapat={() => setOlusturModal(false)}
          onKaydet={async (form) => { const ok = await saticiVeSahipOlustur(form); if (ok) setOlusturModal(false); }}
        />
      )}

      {duzenle && (
        <SaticiDuzenleModal
          satici={duzenle}
          isLoading={isLoading}
          onKapat={() => setDuzenle(null)}
          onKaydet={async (form) => { const ok = await saticiGuncelle(duzenle.id, form); if (ok) setDuzenle(null); }}
        />
      )}

      {yoneticiModal && (
        <YoneticiDegistirModal
          satici={yoneticiModal}
          isLoading={isLoading}
          onKapat={() => setYoneticiModal(null)}
          onKaydet={async (sahip) => { const ok = await yoneticiDegistir(yoneticiModal.id, sahip); if (ok) setYoneticiModal(null); }}
        />
      )}
    </section>
  );
};

const YoneticiDegistirModal = ({ satici, isLoading, onKapat, onKaydet }: {
  satici: Satici;
  isLoading: boolean;
  onKapat: () => void;
  onKaydet: (sahip: { ad: string; soyad: string; eposta: string; tc: string }) => void;
}) => {
  const [form, setForm] = useState({ ad: '', soyad: '', eposta: '', tc: '' });
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));
  const gecerli = form.ad.trim() && form.eposta.includes('@') && /^\d{11}$/.test(form.tc);
  return (
    <ModalKabuk baslik={`Yönetici Değiştir — ${satici.ad}`} onKapat={onKapat}>
      <div className="space-y-3">
        <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100">
          Yeni yönetici oluşturulup işletmeye atanır. <b>Mevcut yönetici PASIF'e alınır</b> (denetim için silinmez).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Ad" value={form.ad} onChange={e => set('ad', e.target.value)} />
          <input className={inputClass} placeholder="Soyad" value={form.soyad} onChange={e => set('soyad', e.target.value)} />
        </div>
        <input className={inputClass} type="email" placeholder="E-posta (giriş için)" value={form.eposta} onChange={e => set('eposta', e.target.value)} />
        <input className={inputClass} inputMode="numeric" maxLength={11} placeholder="TC Kimlik No (11 hane)" value={form.tc} onChange={e => set('tc', e.target.value.replace(/\D/g, '').slice(0, 11))} />
        <p className="text-[11px] text-white/35">Yeni yönetici e-posta + TC ile giriş yapar; varsayılan şifre TC'dir.</p>
        <button disabled={!gecerli || isLoading} onClick={() => onKaydet({ ...form, eposta: form.eposta.trim() })} className="w-full rounded-2xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 text-sm font-black text-white cursor-pointer">
          {isLoading ? 'İşleniyor...' : 'Yöneticiyi Değiştir'}
        </button>
      </div>
    </ModalKabuk>
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

const SaticiOlusturModal = ({ isLoading, onKapat, onKaydet }: {
  isLoading: boolean;
  onKapat: () => void;
  onKaydet: (f: SaticiVeSahipFormu) => void;
}) => {
  const [form, setForm] = useState<SaticiVeSahipFormu>({
    ad: '', konumMetni: '', aciklama: '', logoUrl: '',
    sahipAd: '', sahipSoyad: '', sahipEposta: '', sahipTc: '',
  });
  const set = (k: keyof SaticiVeSahipFormu, v: string) => setForm(p => ({ ...p, [k]: v }));
  const gecerli = form.ad.trim().length >= 2 && form.sahipAd.trim() && form.sahipEposta.trim() && /^\d{11}$/.test(form.sahipTc);

  return (
    <ModalKabuk baslik="Yeni İşletme" onKapat={onKapat}>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <p className="text-xs font-bold uppercase tracking-wider text-white/35">İşletme</p>
        <input className={inputClass} placeholder="İşletme adı (örn. Kampüs Kantini)" value={form.ad} onChange={e => set('ad', e.target.value)} />
        <input className={inputClass} placeholder="Konum etiketi (örn. A Blok zemin kat)" value={form.konumMetni} onChange={e => set('konumMetni', e.target.value)} />
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-white/40">İşletme konumunu haritadan seçin</p>
          <KonumSecici
            latitude={form.enlem ?? VARSAYILAN_KONUM.enlem}
            longitude={form.boylam ?? VARSAYILAN_KONUM.boylam}
            onChange={(lat, lng) => setForm(p => ({ ...p, enlem: lat, boylam: lng }))}
            onLocationSelect={(ad) => setForm(p => ({ ...p, konumMetni: p.konumMetni || ad }))}
          />
          {form.enlem != null && <p className="mt-1 text-[10px] text-white/30">Seçilen: {form.enlem.toFixed(5)}, {form.boylam?.toFixed(5)}</p>}
        </div>
        <input className={inputClass} placeholder="Açıklama (ops.)" value={form.aciklama} onChange={e => set('aciklama', e.target.value)} />
        <GorselYukleyici etiket="İşletme logosu (ops.)" value={form.logoUrl} onChange={u => set('logoUrl', u)} oranSinifi="aspect-square" maksKenar={400} />

        <p className="text-xs font-bold uppercase tracking-wider text-white/35 pt-1">İşletme Sahibi</p>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} placeholder="Ad" value={form.sahipAd} onChange={e => set('sahipAd', e.target.value)} />
          <input className={inputClass} placeholder="Soyad" value={form.sahipSoyad} onChange={e => set('sahipSoyad', e.target.value)} />
        </div>
        <input className={inputClass} type="email" placeholder="E-posta (giriş için)" value={form.sahipEposta} onChange={e => set('sahipEposta', e.target.value)} />
        <input className={inputClass} placeholder="TC Kimlik No (11 hane)" inputMode="numeric" maxLength={11} value={form.sahipTc} onChange={e => set('sahipTc', e.target.value.replace(/\D/g, ''))} />
        <p className="text-[11px] text-white/35">Sahip e-posta + TC ile giriş yapar; varsayılan şifre TC'dir, ilk girişte değiştirmesi istenir.</p>

        <button disabled={!gecerli || isLoading} onClick={() => onKaydet({ ...form, ad: form.ad.trim(), sahipEposta: form.sahipEposta.trim() })} className="w-full rounded-2xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 text-sm font-black text-white cursor-pointer">
          {isLoading ? 'Oluşturuluyor...' : 'İşletme + Sahip Oluştur'}
        </button>
      </div>
    </ModalKabuk>
  );
};

const SaticiDuzenleModal = ({ satici, isLoading, onKapat, onKaydet }: {
  satici: Satici;
  isLoading: boolean;
  onKapat: () => void;
  onKaydet: (f: SaticiGuncellemeFormu) => void;
}) => {
  const [form, setForm] = useState<SaticiGuncellemeFormu>({
    ad: satici.ad, konumMetni: satici.konumMetni ?? '', aciklama: satici.aciklama ?? '',
    enlem: satici.enlem ?? undefined, boylam: satici.boylam ?? undefined,
    logoUrl: satici.logoUrl ?? '', durum: satici.durum,
  });

  return (
    <ModalKabuk baslik={`Düzenle — ${satici.ad}`} onKapat={onKapat}>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <input className={inputClass} placeholder="Satıcı adı" value={form.ad} onChange={e => setForm(p => ({ ...p, ad: e.target.value }))} />
        <input className={inputClass} placeholder="Konum etiketi" value={form.konumMetni} onChange={e => setForm(p => ({ ...p, konumMetni: e.target.value }))} />
        <div>
          <p className="mb-1.5 text-[11px] font-bold text-white/40">İşletme konumunu haritadan seçin</p>
          <KonumSecici
            latitude={form.enlem ?? VARSAYILAN_KONUM.enlem}
            longitude={form.boylam ?? VARSAYILAN_KONUM.boylam}
            onChange={(lat, lng) => setForm(p => ({ ...p, enlem: lat, boylam: lng }))}
            onLocationSelect={(ad) => setForm(p => ({ ...p, konumMetni: p.konumMetni || ad }))}
          />
          {form.enlem != null && <p className="mt-1 text-[10px] text-white/30">Seçilen: {form.enlem.toFixed(5)}, {form.boylam?.toFixed(5)}</p>}
        </div>
        <input className={inputClass} placeholder="Açıklama" value={form.aciklama} onChange={e => setForm(p => ({ ...p, aciklama: e.target.value }))} />
        <GorselYukleyici etiket="İşletme logosu" value={form.logoUrl} onChange={u => setForm(p => ({ ...p, logoUrl: u }))} oranSinifi="aspect-square" maksKenar={400} />
        <label className="block text-xs font-bold uppercase tracking-wider text-white/35">Durum</label>
        <select className={inputClass} value={form.durum} onChange={e => setForm(p => ({ ...p, durum: e.target.value as 'AKTIF' | 'PASIF' }))}>
          <option value="AKTIF">Aktif</option>
          <option value="PASIF">Pasif</option>
        </select>
        <p className="text-xs text-white/35">Pasif satıcılar öğrencilere listelenmez. "Siparişe açık/kapalı" durumunu işletme kendi panelinden yönetir.</p>
        <button disabled={isLoading} onClick={() => onKaydet(form)} className="w-full rounded-2xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 px-5 py-3 text-sm font-black text-white cursor-pointer">
          {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </ModalKabuk>
  );
};
