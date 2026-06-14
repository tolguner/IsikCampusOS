import { useEffect, useState } from 'react';
import { Store, ClipboardList, UtensilsCrossed, TrendingUp, Power, MapPin, Settings, Tag, Users } from 'lucide-react';
import { useIsletmeDeposu } from '../depolar/isletmeDeposu';
import { useKimlikDeposu } from '../depolar/kimlikDeposu';
import { rolleriAyir, YETKILER } from '../yardimcilar/yetkiler';
import { SiparislerSekmesi } from '../components/isletme-paneli/SiparislerSekmesi';
import { MenuSekmesi } from '../components/isletme-paneli/MenuSekmesi';
import { CiroSekmesi } from '../components/isletme-paneli/CiroSekmesi';
import { AyarlarSekmesi } from '../components/isletme-paneli/AyarlarSekmesi';
import { KampanyalarSekmesi } from '../components/isletme-paneli/KampanyalarSekmesi';
import { PersonelSekmesi } from '../components/isletme-paneli/PersonelSekmesi';
import { MesajBildirimi } from '../components/ortak/MesajBildirimi';

type Sekme = 'siparisler' | 'menu' | 'kampanyalar' | 'ciro' | 'ayarlar' | 'personel';

export const IsletmePaneli = () => {
  const { satici, error, successMessage, saticimiGetir, saticiGuncelle, clearMessages } = useIsletmeDeposu();
  const user = useKimlikDeposu(state => state.user);
  const sahipMi = rolleriAyir(user?.roller).includes(YETKILER.ISLETME_YONETICISI);
  const [sekme, setSekme] = useState<Sekme>('siparisler');

  useEffect(() => { saticimiGetir(); }, [saticimiGetir]);
  useEffect(() => () => clearMessages(), [clearMessages]);

  const acikDurumDegistir = () => {
    if (satici) saticiGuncelle({ acik: !satici.acik });
  };

  // Personel yalnızca siparişleri görür; sahip tüm sekmeleri + personel yönetimini görür.
  const sekmeler: { id: Sekme; etiket: string; ikon: React.ReactNode }[] = sahipMi
    ? [
        { id: 'siparisler', etiket: 'Siparişler', ikon: <ClipboardList className="w-4 h-4" /> },
        { id: 'menu', etiket: 'Menü', ikon: <UtensilsCrossed className="w-4 h-4" /> },
        { id: 'kampanyalar', etiket: 'Kampanyalar', ikon: <Tag className="w-4 h-4" /> },
        { id: 'personel', etiket: 'Personel', ikon: <Users className="w-4 h-4" /> },
        { id: 'ciro', etiket: 'Ciro', ikon: <TrendingUp className="w-4 h-4" /> },
        { id: 'ayarlar', etiket: 'Ayarlar', ikon: <Settings className="w-4 h-4" /> },
      ]
    : [
        { id: 'siparisler', etiket: 'Siparişler', ikon: <ClipboardList className="w-4 h-4" /> },
      ];

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/30 to-pink-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
            {satici?.logoUrl ? <img src={satici.logoUrl} alt={satici.ad} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-orange-200" />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{satici?.ad ?? 'İşletme Paneli'}</h1>
            {satici?.konumMetni && (
              <p className="inline-flex items-center gap-1.5 text-sm text-white/40"><MapPin className="w-3.5 h-3.5" /> {satici.konumMetni}</p>
            )}
          </div>
        </div>

        {satici && sahipMi && (
          <button
            onClick={acikDurumDegistir}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${satici.acik ? 'text-emerald-200 bg-emerald-500/15 border-emerald-400/25 hover:bg-emerald-500/25' : 'text-white/50 bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <Power className="w-4 h-4" /> {satici.acik ? 'Siparişe Açık' : 'Siparişe Kapalı'}
          </button>
        )}
      </div>

      <MesajBildirimi hata={error} basari={successMessage} onKapat={clearMessages} />

      {/* Sekmeler */}
      <div className="flex gap-2 border-b border-white/8 pb-px">
        {sekmeler.map(s => (
          <button
            key={s.id}
            onClick={() => setSekme(s.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-colors border-b-2 ${sekme === s.id ? 'text-white border-orange-400' : 'text-white/45 border-transparent hover:text-white/70'}`}
          >
            {s.ikon} {s.etiket}
          </button>
        ))}
      </div>

      {/* İçerik */}
      <div>
        {sekme === 'siparisler' && <SiparislerSekmesi />}
        {sahipMi && sekme === 'menu' && <MenuSekmesi />}
        {sahipMi && sekme === 'kampanyalar' && <KampanyalarSekmesi />}
        {sahipMi && sekme === 'personel' && <PersonelSekmesi />}
        {sahipMi && sekme === 'ciro' && <CiroSekmesi />}
        {sahipMi && sekme === 'ayarlar' && <AyarlarSekmesi />}
      </div>
    </div>
  );
};
