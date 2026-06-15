import { CalendarClock, Clock3, User, FileText, Users, ClipboardCheck, Check, X } from 'lucide-react';
import type { Rezervasyon } from '../../depolar/rezervasyonDeposu';
import { panelStyle } from './ortak';

interface RezervasyonTalepleriGorunumuProps {
  talepler: Rezervasyon[];
  formatDateTime: (isoStr: string) => { date: string; time: string };
  handleUpdateBookingStatus: (bookingId: string, status: string) => void;
}

/** Onay bekleyen (BEKLEMEDE) öğrenci rezervasyon taleplerini onaylama/reddetme görünümü. */
export const RezervasyonTalepleriGorunumu = ({
  talepler,
  formatDateTime,
  handleUpdateBookingStatus,
}: RezervasyonTalepleriGorunumuProps) => {
  return (
    <section className="rounded-3xl p-6 space-y-6" style={panelStyle}>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-200">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">Rezervasyon Talepleri</h2>
          <p className="text-xs font-semibold text-white/35">Onay mekanizması açık tesisler için onay bekleyen öğrenci talepleri.</p>
        </div>
      </div>

      <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
        {talepler.map((t) => {
          const start = formatDateTime(t.baslangicTarihi);
          const end = formatDateTime(t.bitisTarihi);
          return (
            <div
              key={t.id}
              className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.03] p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-black">{t.tesisAd}</span>
                  <span className="rounded-full bg-amber-400/10 text-amber-200 border border-amber-400/20 px-2 py-0.5 text-[9px] font-black">
                    Onay Bekliyor
                  </span>
                </div>
                <div className="grid gap-x-6 gap-y-1.5 grid-cols-2 md:grid-cols-3 text-xs text-white/50 pt-1 font-bold">
                  <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-cyan-300/60" /> {t.rezervasyonYapanKullaniciId}</span>
                  <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-cyan-300/60" /> {start.date}</span>
                  <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-cyan-300/60" /> {start.time} - {end.time}</span>
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-cyan-300/60" /> {t.katilimciSayisi} katılımcı</span>
                  {t.amac && (
                    <span className="col-span-2 md:col-span-3 flex items-center gap-1.5 mt-1 font-normal text-white/40">
                      <FileText className="h-3.5 w-3.5 shrink-0" /> {t.amac}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpdateBookingStatus(t.id, 'ONAYLANDI')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-xs font-bold transition border border-emerald-500/25 cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Onayla
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateBookingStatus(t.id, 'IPTAL_EDILDI')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition border border-red-500/20 cursor-pointer"
                >
                  <X className="h-4 w-4" /> Reddet
                </button>
              </div>
            </div>
          );
        })}

        {talepler.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <ClipboardCheck className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/35 font-semibold">Onay bekleyen rezervasyon talebi yok.</p>
          </div>
        )}
      </div>
    </section>
  );
};
