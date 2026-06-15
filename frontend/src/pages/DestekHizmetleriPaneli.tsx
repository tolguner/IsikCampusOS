import { useEffect, useMemo, useState } from 'react';
import { Store, ScrollText, ClipboardCheck } from 'lucide-react';
import { SaticilarSekmesi } from '../components/yonetim/SaticilarSekmesi';
import { DegisiklikTalepleriSekmesi } from '../components/yonetim/DegisiklikTalepleriSekmesi';
import { useAdminSaticiDeposu } from '../depolar/adminSaticiDeposu';
import { ModulSekmeleri } from '../components/yonetim/ModulSekmeleri';
import { MesajBildirimi } from '../components/ortak/MesajBildirimi';
import { DuyuruButonu } from '../components/DuyuruButonu';

type Sekme = 'isletmeler' | 'talepler' | 'loglar';

const VARLIK_ETIKET: Record<string, string> = {
  ISLETME: 'İşletme', PERSONEL: 'Personel', SIPARIS: 'Sipariş', DEGISIKLIK_TALEBI: 'Değişiklik Talebi',
};

/**
 * Destek Hizmetleri Müdürlüğü paneli — UniEats işletme yönetimi (işletme/sahip/personel
 * oluşturma, silme, yönetici değiştirme, bilgi-değişikliği onayı) + işletme denetim logları.
 */
export const DestekHizmetleriPaneli = () => {
  const { hata, basariMesaji, temizleMesajlar, denetimKayitlari, denetimGetir, talepler, talepleriGetir } = useAdminSaticiDeposu();
  const [sekme, setSekme] = useState<Sekme>('isletmeler');

  // Sekme rozetindeki bekleyen talep sayısı için mount'ta talepleri çek.
  useEffect(() => { talepleriGetir(); }, [talepleriGetir]);
  useEffect(() => { if (sekme === 'loglar') denetimGetir(); }, [sekme, denetimGetir]);

  // Bekleyen talep grubu sayısı (rozet).
  const bekleyenGrupSayisi = useMemo(() => {
    const gruplar = new Set(talepler.map(t => t.grupId || t.id));
    return gruplar.size;
  }, [talepler]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-purple-300/25 bg-purple-500/10 text-purple-200">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Destek Hizmetleri Müdürlüğü</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/45">
              İşletmeleri, işletme yöneticilerini ve personel hesaplarını yönetin; bilgi-değişikliği
              taleplerini onaylayın.
            </p>
          </div>
        </div>
        <DuyuruButonu />
      </div>

      <ModulSekmeleri
        aktif={sekme}
        onSecim={setSekme}
        sekmeler={[
          { anahtar: 'isletmeler', baslik: 'İşletmeler', aciklama: 'İşletme listesi, sahip ve personel yönetimi', ikon: Store },
          { anahtar: 'talepler', baslik: 'Bilgi Değişikliği Talepleri', aciklama: 'Bekleyen bilgi-değişikliği onayları', ikon: ClipboardCheck, rozet: bekleyenGrupSayisi },
          { anahtar: 'loglar', baslik: 'İşletme Logları', aciklama: 'İşletme işlem denetim kayıtları', ikon: ScrollText },
        ]}
      />

      <MesajBildirimi hata={hata} basari={basariMesaji} onKapat={temizleMesajlar} />

      {sekme === 'isletmeler' && <SaticilarSekmesi />}

      {sekme === 'talepler' && <DegisiklikTalepleriSekmesi />}

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
