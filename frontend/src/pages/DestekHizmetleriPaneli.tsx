import { Store, X } from 'lucide-react';
import { SaticilarSekmesi } from '../components/yonetim/SaticilarSekmesi';
import { useAdminSaticiDeposu } from '../depolar/adminSaticiDeposu';

/**
 * Destek Hizmetleri Müdürlüğü paneli — UniEats işletme yönetimi (işletme/sahip/personel
 * oluşturma, silme, yönetici değiştirme, bilgi-değişikliği onayı). Mevcut SaticilarSekmesi
 * bileşenini yeniden kullanır; yetki backend'de ROLE_SUPPORT_SERVICES_ADMIN'e devredilmiştir.
 */
export const DestekHizmetleriPaneli = () => {
  const { hata, basariMesaji, temizleMesajlar } = useAdminSaticiDeposu();

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
            taleplerini onaylayın.
          </p>
        </div>
      </div>

      {(hata || basariMesaji) && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-between ${hata ? 'border border-red-400/25 bg-red-500/12 text-red-100' : 'border border-emerald-300/25 bg-emerald-500/12 text-emerald-100'}`}>
          <span>{hata || basariMesaji}</span>
          <button onClick={temizleMesajlar} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      )}

      <SaticilarSekmesi />
    </div>
  );
};
