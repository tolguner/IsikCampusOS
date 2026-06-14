import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Clock3, Calendar, User, FileText, Lock, Repeat, ChevronDown } from 'lucide-react';
import type { Rezervasyon } from '../../depolar/rezervasyonDeposu';
import { panelStyle, inputClass, BookingStatusBadge } from './ortak';

interface RezervasyonGorunumuProps {
  handleAddBlockSlot: (e: React.FormEvent) => void;
  blockResourceId: string;
  setBlockResourceId: React.Dispatch<React.SetStateAction<string>>;
  flatResources: { id: string; ad: string }[];
  blockDate: string;
  setBlockDate: React.Dispatch<React.SetStateAction<string>>;
  recurrence: 'NONE' | 'WEEKLY' | 'MONTHLY';
  setRecurrence: React.Dispatch<React.SetStateAction<'NONE' | 'WEEKLY' | 'MONTHLY'>>;
  recurrenceCount: number;
  setRecurrenceCount: React.Dispatch<React.SetStateAction<number>>;
  blockStart: string;
  setBlockStart: React.Dispatch<React.SetStateAction<string>>;
  blockEnd: string;
  setBlockEnd: React.Dispatch<React.SetStateAction<string>>;
  blockPurpose: string;
  setBlockPurpose: React.Dispatch<React.SetStateAction<string>>;
  isBookingLoading: boolean;
  allBookings: Rezervasyon[];
  formatDateTime: (isoStr: string) => { date: string; time: string };
  handleUpdateBookingStatus: (bookingId: string, status: string) => void;
}

export const RezervasyonGorunumu = ({
  handleAddBlockSlot,
  blockResourceId,
  setBlockResourceId,
  flatResources,
  blockDate,
  setBlockDate,
  recurrence,
  setRecurrence,
  recurrenceCount,
  setRecurrenceCount,
  blockStart,
  setBlockStart,
  blockEnd,
  setBlockEnd,
  blockPurpose,
  setBlockPurpose,
  isBookingLoading,
  allBookings,
  formatDateTime,
  handleUpdateBookingStatus,
}: RezervasyonGorunumuProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Tekrarlanan antrenman/blokeleri (tekrarGrupId) tek bir öğeye topla; gerisini tekil bırak.
  const items = useMemo(() => {
    const seen = new Set<string>();
    const result: ({ type: 'single'; booking: Rezervasyon } | { type: 'group'; grupId: string; bookings: Rezervasyon[] })[] = [];
    for (const b of allBookings) {
      if (b.durum === 'BLOKE' && b.tekrarGrupId) {
        if (seen.has(b.tekrarGrupId)) continue;
        seen.add(b.tekrarGrupId);
        const members = allBookings
          .filter(x => x.tekrarGrupId === b.tekrarGrupId)
          .sort((a, c) => new Date(a.baslangicTarihi).getTime() - new Date(c.baslangicTarihi).getTime());
        if (members.length > 1) {
          result.push({ type: 'group', grupId: b.tekrarGrupId, bookings: members });
          continue;
        }
      }
      result.push({ type: 'single', booking: b });
    }
    return result;
  }, [allBookings]);

  const tekrarSikligi = (members: Rezervasyon[]): string => {
    if (members.length < 2) return 'Tekrarlı';
    const gunFarki = Math.round(
      (new Date(members[1].baslangicTarihi).getTime() - new Date(members[0].baslangicTarihi).getTime()) / 86400000
    );
    if (gunFarki >= 6 && gunFarki <= 8) return 'Haftalık';
    if (gunFarki >= 25 && gunFarki <= 32) return 'Aylık';
    return 'Tekrarlı';
  };

  const renderBookingCard = (booking: Rezervasyon, compact = false) => {
    const start = formatDateTime(booking.baslangicTarihi);
    const end = formatDateTime(booking.bitisTarihi);
    const isBlocked = booking.durum === 'BLOKE';
    return (
      <div
        key={booking.id}
        className={`rounded-2xl border p-4 transition flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${
          isBlocked
            ? 'border-purple-500/20 bg-purple-500/[0.02] hover:bg-purple-500/[0.04]'
            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
        }`}
      >
        <div className="space-y-2">
          {!compact && (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-base font-black">{booking.tesisAd}</span>
              <BookingStatusBadge durum={booking.durum} />
            </div>
          )}
          <div className="grid gap-x-6 gap-y-1.5 grid-cols-2 md:grid-cols-3 text-xs text-white/50 pt-1 font-bold">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-cyan-300/60" />
              {isBlocked ? 'Spor Müdürlüğü' : booking.rezervasyonYapanKullaniciId}
            </span>
            <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-cyan-300/60" /> {start.date}</span>
            <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-cyan-300/60" /> {start.time} - {end.time}</span>
            {!compact && booking.amac && (
              <span className="col-span-2 md:col-span-3 flex items-center gap-1.5 mt-1 font-normal text-white/40">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                {booking.amac}
              </span>
            )}
          </div>
        </div>

        {['ONAYLANDI', 'BEKLEMEDE', 'BLOKE'].includes(booking.durum) && (
          <div className="flex gap-2 self-start sm:self-center shrink-0">
            {booking.durum === 'BEKLEMEDE' && (
              <button
                type="button"
                onClick={() => handleUpdateBookingStatus(booking.id, 'ONAYLANDI')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition border border-emerald-500/20 cursor-pointer"
              >
                Onayla
              </button>
            )}
            <button
              type="button"
              onClick={() => handleUpdateBookingStatus(booking.id, 'IPTAL_EDILDI')}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition border border-red-500/20 cursor-pointer"
            >
              {isBlocked ? 'Blokajı Kaldır' : (booking.durum === 'BEKLEMEDE' ? 'Reddet' : 'İptal Et')}
            </button>
          </div>
        )}

        {booking.durum === 'IPTAL_EDILDI' && booking.iptalNedeni && (
          <span className="text-xs font-semibold text-red-200/50 bg-red-500/5 px-3 py-1.5 rounded-lg border border-red-500/10 shrink-0 self-start sm:self-center">
            İptal: {booking.iptalNedeni}
          </span>
        )}
      </div>
    );
  };

  const renderGroupCard = (grupId: string, members: Rezervasyon[]) => {
    const first = members[0];
    const last = members[members.length - 1];
    const aktif = members.filter(m => m.durum === 'BLOKE');
    const expanded = !!expandedGroups[grupId];
    const startTime = formatDateTime(first.baslangicTarihi).time;
    const endTime = formatDateTime(first.bitisTarihi).time;
    return (
      <div key={grupId} className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.03] overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedGroups(prev => ({ ...prev, [grupId]: !prev[grupId] }))}
          className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-purple-500/[0.05] transition cursor-pointer"
        >
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-base font-black truncate">{first.tesisAd}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-400/25 px-2.5 py-0.5 text-[10px] font-black text-purple-200">
                <Repeat className="h-3 w-3" /> {tekrarSikligi(members)} · {members.length} antrenman
              </span>
            </div>
            <div className="grid gap-x-6 gap-y-1.5 grid-cols-2 md:grid-cols-3 text-xs text-white/50 pt-1 font-bold">
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-cyan-300/60" /> Spor Müdürlüğü</span>
              <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-cyan-300/60" /> {startTime} - {endTime}</span>
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-cyan-300/60" />
                {formatDateTime(first.baslangicTarihi).date} → {formatDateTime(last.baslangicTarihi).date}
              </span>
              {first.amac && (
                <span className="col-span-2 md:col-span-3 flex items-center gap-1.5 mt-1 font-normal text-white/40">
                  <FileText className="h-3.5 w-3.5 shrink-0" /> {first.amac}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {aktif.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); aktif.forEach(m => handleUpdateBookingStatus(m.id, 'IPTAL_EDILDI')); }}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition border border-red-500/20 cursor-pointer"
              >
                Tümünü Kaldır
              </span>
            )}
            <ChevronDown className={`h-5 w-5 text-white/50 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2.5 border-t border-purple-500/15 pt-3">
                {members.map((m, idx) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    {renderBookingCard(m, true)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      {/* Column 1: Add Block / Team Training slot Form */}
      <section className="rounded-3xl p-5 space-y-6" style={panelStyle}>
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-purple-300/25 bg-purple-500/10 text-purple-200">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Antrenman / Bloke Ekle</h2>
            <p className="text-xs font-semibold text-white/38">Spor takımları için planlı antrenman saatlerini bloke edin</p>
          </div>
        </div>

        <form onSubmit={handleAddBlockSlot} className="space-y-4 pt-2">
          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/35">
              SAHA / KORT SEÇİN
            </label>
            <select
              className={inputClass}
              value={blockResourceId}
              onChange={(e) => setBlockResourceId(e.target.value)}
              required
            >
              {flatResources.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.ad}
                </option>
              ))}
              {flatResources.length === 0 && (
                <option value="">Kayıtlı saha bulunmuyor</option>
              )}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/35">
                Tarih
              </label>
              <input
                type="date"
                className={inputClass}
                min={new Date().toISOString().split('T')[0]}
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/35">
                Tekrarlanma Sıklığı
              </label>
              <select
                className={inputClass}
                value={recurrence}
                onChange={(e) => {
                  const val = e.target.value as 'NONE' | 'WEEKLY' | 'MONTHLY';
                  setRecurrence(val);
                  if (val === 'WEEKLY') {
                    setRecurrenceCount(12);
                  } else if (val === 'MONTHLY') {
                    setRecurrenceCount(6);
                  }
                }}
              >
                <option value="NONE">Hiçbir zaman</option>
                <option value="WEEKLY">Haftalık (haftanın seçilen günü)</option>
                <option value="MONTHLY">Aylık (ayın seçilen günü)</option>
              </select>
            </div>
          </div>

          {recurrence !== 'NONE' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/35">
                {recurrence === 'WEEKLY' ? 'Tekrarlanma Sayısı (Hafta)' : 'Tekrarlanma Sayısı (Ay)'}
              </label>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={recurrenceCount}
                onChange={(e) => setRecurrenceCount(Math.max(1, Number(e.target.value)))}
                required
              />
              {recurrence === 'WEEKLY' && blockDate && (
                <p className="text-[10px] font-bold text-purple-300 bg-purple-500/5 p-2.5 rounded-lg border border-purple-500/10 leading-relaxed">
                  * Her {new Date(blockDate).toLocaleDateString('tr-TR', { weekday: 'long' })} günü olmak üzere {recurrenceCount} hafta boyunca tekrarlanır.
                </p>
              )}
              {recurrence === 'MONTHLY' && blockDate && (
                <p className="text-[10px] font-bold text-purple-300 bg-purple-500/5 p-2.5 rounded-lg border border-purple-500/10 leading-relaxed">
                  * Her ayın {new Date(blockDate).getDate()}'inde olmak üzere {recurrenceCount} ay boyunca tekrarlanır.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/35">
                Başlangıç
              </label>
              <input
                type="time"
                className={inputClass}
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/35">
                Bitiş
              </label>
              <input
                type="time"
                className={inputClass}
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/35">
              Antrenman / Takım İsmi
            </label>
            <div className="relative flex items-center">
              <FileText className="absolute left-4 text-white/30 h-4 w-4" />
              <input
                type="text"
                placeholder="Örn: Kadın Voleybol Takımı"
                className={`${inputClass} pl-11`}
                value={blockPurpose}
                onChange={(e) => setBlockPurpose(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isBookingLoading || !blockResourceId}
            className="w-full px-5 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-sm transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/10 cursor-pointer"
          >
            {isBookingLoading ? 'Bloke Ediliyor...' : 'Antrenman Saati Bloke Et'}
          </button>
        </form>
      </section>

      {/* Column 2: Booking list */}
      <section className="rounded-3xl p-6 space-y-6" style={panelStyle}>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Tüm Tesis Rezervasyonları ve Antrenmanlar</h2>
            <p className="text-xs font-semibold text-white/35">Kampüs genelinde yapılmış tüm rezervasyonları ve antrenman programlarını izleyin.</p>
          </div>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {items.map((item) =>
            item.type === 'group'
              ? renderGroupCard(item.grupId, item.bookings)
              : renderBookingCard(item.booking)
          )}

          {allBookings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/35 font-semibold">
              Henüz kayıtlı bir rezervasyon veya antrenman bulunmuyor.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
