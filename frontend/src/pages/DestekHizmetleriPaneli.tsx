import { useEffect, useState } from 'react';
import { Store, X, ScrollText } from 'lucide-react';
import { SaticilarSekmesi } from '../components/yonetim/SaticilarSekmesi';
import { useAdminSaticiDeposu } from '../depolar/adminSaticiDeposu';

type Sekme = 'isletmeler' | 'loglar';

const VARLIK_ETIKET: Record<string, string> = {
  ISLETME: 'İşletme', PERSONEL: 'Personel', SIPARIS: 'Sipariş', DEGISIKLIK_TALEBI: 'Değişiklik Talebi',
};

/**
 * Destek Hizmetleri Müdürlüğü paneli — UniEats işletme yönetimi (işletme/sahip/personel
 * oluşturma, silme, yönetici değiştirme, bilgi-değişikliği onayı) + işletme denetim logları.
 */
export const DestekHizmetleriPaneli = () => {
  const { hata, basariMesaji, temizleMesajlar, denetimKayitlari, denetimGetir } = useAdminSaticiDeposu();
  const [sekme, setSekme] = useState<Sekme>('isletmeler');

  useEffect(() => { if (sekme === 'loglar') denetimGetir(); }, [sekme, denetimGetir]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-purple-300/25 bg-purple-500/10 text-purple-200">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black">Destek Hizmetleri Müdürlüğü</h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/45">
            İşletmeleri, işletme yöneticilerini ve personel hesaplarını yönetin; bilgi-değişikliği
            taleplerini onaylayın; işletme işlem loglarını inceleyin.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/5 pb-px">
        <button onClick={() => setSekme('isletmeler')}
          className={`inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition cursor-pointer ${sekme === 'isletmeler' ? 'border-purple-300 text-purple-200' : 'border-transparent text-white/40 hover:text-white/60'}`}>
          <Store className="h-4 w-4" /> İşletmeler
        </button>
        <button onClick={() => setSekme('loglar')}
          className={`inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-b-2 transition cursor-pointer ${sekme === 'loglar' ? 'border-purple-300 text-purple-200' : 'border-transparent text-white/40 hover:text-white/60'}`}>
          <ScrollText className="h-4 w-4" /> İşletme Logları
        </button>
      </div>

      {(hata || basariMesaji) && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-between ${hata ? 'border border-red-400/25 bg-red-500/12 text-red-100' : 'border border-emerald-300/25 bg-emerald-500/12 text-emerald-100'}`}>
          <span>{hata || basariMesaji}</span>
          <button onClick={temizleMesajlar} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      )}

      {sekme === 'isletmeler' && <SaticilarSekmesi />}

      {sekme === 'loglar' && (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.025]">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-white/35 bg-white/[0.025] border-b border-white/10">
                <th className="px-5 py-4 font-bold">Tarih</th>
                <th className="px-5 py-4 font-bold">Varlık</th>
                <th className="px-5 py-4 font-bold">İşlem</th>
                <th className="px-5 py-4 font-bold">Açıklama</th>
                <th className="px-5 py-4 font-bold">Yapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {denetimKayitlari.map(k => (
                <tr key={k.id} className="hover:bg-white/[0.02] align-top">
                  <td className="px-5 py-3 text-xs text-white/45 whitespace-nowrap">{new Date(k.olusturulmaTarihi).toLocaleString('tr-TR')}</td>
                  <td className="px-5 py-3"><span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-white/55">{VARLIK_ETIKET[k.varlikTuru] || k.varlikTuru}</span></td>
                  <td className="px-5 py-3 text-xs font-bold text-white/70">{k.islem}</td>
                  <td className="px-5 py-3 text-xs text-white/55">{k.mesaj || '—'}</td>
                  <td className="px-5 py-3 text-[11px] text-white/40">{k.yapanRol || (k.yapanId ? k.yapanId.slice(0, 8) : '—')}</td>
                </tr>
              ))}
              {denetimKayitlari.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-white/35">İşletme log kaydı yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
