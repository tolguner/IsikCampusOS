import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useMesajDeposu, type Konusma } from '../depolar/mesajDeposu';
import { MesajPaneli } from '../components/ortak/MesajPaneli';

const MODUL_ETIKET: Record<string, string> = {
  RIDE: 'CampusRide',
  FOOD: 'UniEats',
  PROJECTMATCH: 'ProjectMatch',
};

export const MesajlarSayfasi = () => {
  const { konusmalar, konusmalariGetir, akisBaslat } = useMesajDeposu();
  const [secili, setSecili] = useState<Konusma | null>(null);

  useEffect(() => {
    akisBaslat();
    konusmalariGetir();
  }, [akisBaslat, konusmalariGetir]);

  // Konuşma listesi tazelendiğinde seçili olanı güncel tut.
  useEffect(() => {
    if (secili) {
      const guncel = konusmalar.find(k => k.id === secili.id);
      if (guncel && guncel !== secili) setSecili(guncel);
    }
  }, [konusmalar, secili]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-500/10 text-cyan-200">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black">Mesajlar</h1>
          <p className="mt-1 text-sm text-white/45">CampusRide yolculukları ve UniEats siparişleriniz üzerinden gelen yazışmalar.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr] lg:items-start">
        {/* Konuşma listesi */}
        <div className="space-y-2 rounded-3xl border border-white/10 bg-white/[0.025] p-3">
          {konusmalar.length === 0 && <p className="py-10 text-center text-sm text-white/35">Henüz mesajınız yok.</p>}
          {konusmalar.map(k => {
            const aktif = secili?.id === k.id;
            return (
              <button
                key={k.id}
                onClick={() => setSecili(k)}
                className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${aktif ? 'border-cyan-300/40 bg-cyan-500/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-black text-white">{k.karsiTarafAdSoyad || k.baslik || 'Konuşma'}</span>
                  {!!k.okunmamisSayisi && k.okunmamisSayisi > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-black text-white">{k.okunmamisSayisi}</span>
                  )}
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
                  <span className="rounded bg-white/10 px-1.5 py-0.5 font-bold text-white/55">{MODUL_ETIKET[k.modul] || k.modul}</span>
                  {k.baslik && <span className="truncate">{k.baslik}</span>}
                </p>
                {k.sonMesajOzeti && <p className="mt-1 truncate text-xs text-white/50">{k.sonMesajOzeti}</p>}
              </button>
            );
          })}
        </div>

        {/* Seçili konuşma */}
        <div>
          {secili
            ? <MesajPaneli key={secili.id} modul={secili.modul} baglamId={secili.baglamId} />
            : <div className="grid h-80 place-items-center rounded-3xl border border-white/10 bg-white/[0.02] text-sm text-white/35">Görüntülemek için soldan bir konuşma seçin.</div>}
        </div>
      </div>
    </div>
  );
};
