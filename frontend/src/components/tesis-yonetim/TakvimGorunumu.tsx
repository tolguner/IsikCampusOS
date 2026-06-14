import React from 'react';
import { CalendarClock, Lock, X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Tesis, TesisKaynagi } from '../../depolar/tesisDeposu';
import type { Rezervasyon } from '../../depolar/rezervasyonDeposu';
import { panelStyle, inputClass, BookingStatusBadge } from './ortak';

interface TakvimGorunumuProps {
  facilities: Tesis[];
  calendarFacilityId: string;
  setCalendarFacilityId: React.Dispatch<React.SetStateAction<string>>;
  calendarWeekStart: Date;
  setCalendarWeekStart: React.Dispatch<React.SetStateAction<Date>>;
  calendarResource: TesisKaynagi | null;
  calendarBookings: Rezervasyon[];
  dynamicCalendarHoursList: number[];
  selectedBookingForModal: Rezervasyon | null;
  setSelectedBookingForModal: React.Dispatch<React.SetStateAction<Rezervasyon | null>>;
  quickBlockModalOpen: boolean;
  setQuickBlockModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  quickBlockDate: string;
  setQuickBlockDate: React.Dispatch<React.SetStateAction<string>>;
  quickBlockStart: string;
  setQuickBlockStart: React.Dispatch<React.SetStateAction<string>>;
  quickBlockEnd: string;
  setQuickBlockEnd: React.Dispatch<React.SetStateAction<string>>;
  quickBlockPurpose: string;
  setQuickBlockPurpose: React.Dispatch<React.SetStateAction<string>>;
  quickBlockRecurrence: 'NONE' | 'WEEKLY' | 'MONTHLY';
  setQuickBlockRecurrence: React.Dispatch<React.SetStateAction<'NONE' | 'WEEKLY' | 'MONTHLY'>>;
  quickBlockRecurrenceCount: number;
  setQuickBlockRecurrenceCount: React.Dispatch<React.SetStateAction<number>>;
  handleQuickAddBlockSlot: (e: React.FormEvent) => void;
  handleUpdateBookingStatus: (bookingId: string, status: string) => void;
  formatDateTime: (isoStr: string) => { date: string; time: string };
  isBookingLoading: boolean;
}

export const TakvimGorunumu = ({
  facilities,
  calendarFacilityId,
  setCalendarFacilityId,
  calendarWeekStart,
  setCalendarWeekStart,
  calendarResource,
  calendarBookings,
  dynamicCalendarHoursList,
  selectedBookingForModal,
  setSelectedBookingForModal,
  quickBlockModalOpen,
  setQuickBlockModalOpen,
  quickBlockDate,
  setQuickBlockDate,
  quickBlockStart,
  setQuickBlockStart,
  quickBlockEnd,
  setQuickBlockEnd,
  quickBlockPurpose,
  setQuickBlockPurpose,
  quickBlockRecurrence,
  setQuickBlockRecurrence,
  quickBlockRecurrenceCount,
  setQuickBlockRecurrenceCount,
  handleQuickAddBlockSlot,
  handleUpdateBookingStatus,
  formatDateTime,
  isBookingLoading,
}: TakvimGorunumuProps) => {
  const calendarWeekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(calendarWeekStart);
    d.setDate(d.getDate() + i);
    calendarWeekDays.push(d);
  }
  const calendarHoursList = dynamicCalendarHoursList;

  const isDayClosed = (day: Date) => {
    if (!calendarResource || !calendarResource.kullanimKurallari) return false;
    let dayNum = day.getDay();
    if (dayNum === 0) dayNum = 7;
    const hasActiveRule = calendarResource.kullanimKurallari.some(
      r => r.haftaninGunu === dayNum && r.durum === 'AKTIF'
    );
    return !hasActiveRule;
  };

  const getCalendarBookingForSlot = (day: Date, hour: number) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return calendarBookings.find((b) => {
      const bStart = new Date(b.baslangicTarihi);
      const bEnd = new Date(b.bitisTarihi);
      return bStart < slotEnd && bEnd > slotStart;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top selection bar */}
      <section className="rounded-3xl p-6 space-y-6" style={panelStyle}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black text-white">Genel Rezervasyon Takvimi</h2>
              <p className="text-xs font-semibold text-white/35">Tesis bazlı görsel haftalık takvimi inceleyin ve rezervasyonları yönetin</p>
            </div>
          </div>

          {/* Facility Selection */}
          <div className="w-full md:w-64">
            <select
              className={inputClass}
              value={calendarFacilityId}
              onChange={(e) => setCalendarFacilityId(e.target.value)}
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.ad}
                </option>
              ))}
              {facilities.length === 0 && (
                <option value="">Kayıtlı spor tesisi bulunmuyor</option>
              )}
            </select>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-2 bg-[#111123] rounded-2xl p-1.5 border border-white/5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setCalendarWeekStart(prev => {
                  const d = new Date(prev);
                  d.setDate(d.getDate() - 7);
                  return d;
                });
              }}
              className="p-2 hover:bg-white/5 rounded-xl text-white/70 transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-black px-2 tracking-wide whitespace-nowrap">
              {calendarWeekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {new Date(new Date(calendarWeekStart).setDate(calendarWeekStart.getDate() + 6)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => {
                setCalendarWeekStart(prev => {
                  const d = new Date(prev);
                  d.setDate(d.getDate() + 7);
                  return d;
                });
              }}
              className="p-2 hover:bg-white/5 rounded-xl text-white/70 transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Weekly calendar visual grid */}
      <section className="rounded-3xl p-6 space-y-6" style={panelStyle}>
        {/* Color Legend */}
        <div className="flex flex-wrap gap-4 text-xs font-bold text-white/60">
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#0a0a14] border border-white/10" />
            Boş Saat (Bloke Edilebilir)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-amber-500/10 border border-amber-400/20" />
            Öğrenci Rezervasyonu (Aktif)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-purple-500/10 border border-purple-400/20" />
            Takım Antrenmanı / Bloke Slot
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-400/20 text-emerald-300" />
            Kullanıldı
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-amber-600/10 border border-amber-500/20 text-amber-300" />
            Gelmedi
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-red-500/10 border border-red-400/20 text-red-300" />
            İptal Edildi
          </span>
        </div>

        {/* Grid calendar */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px] border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a14]">
            {/* Header: Days */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-white/[0.02] border-b border-white/10 text-center py-3">
              <span className="text-xs font-black text-white/30 self-center">SAAT</span>
              {calendarWeekDays.map((day, idx) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={idx} className={`flex flex-col py-1 ${isToday ? 'text-cyan-300' : 'text-white'}`}>
                    <span className="text-[11px] font-black uppercase tracking-wider opacity-60">
                      {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </span>
                    <span className="text-sm font-black mt-0.5">
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Body: Hours & slots */}
            <div className="divide-y divide-white/5">
              {calendarHoursList.map((hour) => (
                <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] items-stretch">
                  {/* Hour label */}
                  <div className="text-center py-4 text-xs font-bold text-white/40 self-center bg-white/[0.01] border-r border-white/5 flex flex-col justify-center">
                    {hour.toString().padStart(2, '0')}:00
                  </div>

                  {/* Day slots */}
                  {calendarWeekDays.map((day, dayIdx) => {
                    const booking = getCalendarBookingForSlot(day, hour);

                    if (booking) {
                      const isBlocked = booking.durum === 'BLOKE';
                      const isCompleted = booking.durum === 'TAMAMLANDI';
                      const isNoShow = booking.durum === 'GELMEDI';
                      const isCancelled = booking.durum === 'IPTAL_EDILDI';

                      let bgStyle = 'bg-amber-500/10 border-amber-400/20 hover:bg-amber-500/20 text-amber-200';
                      if (isBlocked) bgStyle = 'bg-purple-500/10 border-purple-400/20 hover:bg-purple-500/20 text-purple-200';
                      else if (isCompleted) bgStyle = 'bg-emerald-500/10 border-emerald-400/20 hover:bg-emerald-500/20 text-emerald-300';
                      else if (isNoShow) bgStyle = 'bg-amber-600/10 border-amber-500/20 hover:bg-amber-600/20 text-amber-300';
                      else if (isCancelled) bgStyle = 'bg-red-500/10 border-red-400/20 hover:bg-red-500/20 text-red-300';

                      return (
                        <button
                          key={dayIdx}
                          type="button"
                          onClick={() => setSelectedBookingForModal(booking)}
                          className={`m-1 p-2 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer overflow-hidden ${bgStyle} min-h-14`}
                          title={`${booking.amac || 'Rezervasyon'} (${booking.rezervasyonYapanKullaniciId})`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1 w-full">
                            <span className="text-[10px] font-black tracking-wide truncate max-w-[80px]">
                              {isBlocked ? 'SPOR MÜDÜRÜ' : booking.rezervasyonYapanKullaniciId}
                            </span>
                            {isBlocked && <Lock className="h-3 w-3 shrink-0 opacity-60" />}
                          </div>
                          <span className="text-[9px] font-bold opacity-60 mt-1 truncate block w-full">
                            {booking.amac || 'Serbest Çalışma'}
                          </span>
                        </button>
                      );
                    }

                    const isClosed = isDayClosed(day);
                    if (isClosed) {
                      return (
                        <div
                          key={dayIdx}
                          className="m-1 rounded-xl border border-red-500/5 bg-red-500/[0.01] transition flex items-center justify-center text-[10px] font-black text-white/20 min-h-14 opacity-40 cursor-not-allowed"
                        >
                          KAPALI
                        </div>
                      );
                    }

                    // Free slot (clickable for quick block)
                    return (
                      <button
                        key={dayIdx}
                        type="button"
                        onClick={() => {
                          const dateStr = day.toISOString().split('T')[0];
                          const startStr = `${hour.toString().padStart(2, '0')}:00`;
                          const endStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
                          setQuickBlockDate(dateStr);
                          setQuickBlockStart(startStr);
                          setQuickBlockEnd(endStr);
                          setQuickBlockModalOpen(true);
                        }}
                        className="m-1 rounded-xl border border-dashed border-white/5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.02] transition cursor-pointer flex items-center justify-center text-[10px] font-black text-white/0 hover:text-cyan-300/40 min-h-14"
                      >
                        + BLOKE ET
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODALS */}
      {/* 1. Booking Details Pop-up Modal */}
      {selectedBookingForModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl p-6 space-y-6 relative text-white bg-[#0f0f1c] border border-white/10 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedBookingForModal(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black">Rezervasyon / Bloke Detayları</h3>
                <p className="text-xs text-white/40">Tesis kullanım kaydını inceleyin ve durumunu yönetin</p>
              </div>
            </div>

            <div className="divide-y divide-white/5 text-sm font-semibold">
              <div className="py-2.5 flex justify-between gap-3">
                <span className="text-white/40">Spor Tesisi:</span>
                <span className="font-black text-white">{selectedBookingForModal.tesisAd}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <span className="text-white/40">Kullanıcı / Görevli:</span>
                <span className="font-black text-white">{selectedBookingForModal.durum === 'BLOKE' ? 'Spor Müdürlüğü (Bloke)' : selectedBookingForModal.rezervasyonYapanKullaniciId}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <span className="text-white/40">Tarih:</span>
                <span className="font-black text-cyan-300">{formatDateTime(selectedBookingForModal.baslangicTarihi).date}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <span className="text-white/40">Saat:</span>
                <span className="font-black text-cyan-300">{formatDateTime(selectedBookingForModal.baslangicTarihi).time} - {formatDateTime(selectedBookingForModal.bitisTarihi).time}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <span className="text-white/40">Açıklama / Amaç:</span>
                <span className="text-white/70">{selectedBookingForModal.amac || 'Girilmedi'}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <span className="text-white/40">Katılımcı Sayısı:</span>
                <span className="font-black text-white">{selectedBookingForModal.katilimciSayisi} kişi</span>
              </div>
              <div className="py-2.5 flex justify-between gap-3 items-center">
                <span className="text-white/40">Durum:</span>
                <BookingStatusBadge durum={selectedBookingForModal.durum} />
              </div>
            </div>

            {/* Quick Actions inside Modal */}
            <div className="pt-2 flex flex-wrap gap-2.5 justify-end">
              {selectedBookingForModal.durum === 'BEKLEMEDE' && (
                <button
                  type="button"
                  onClick={() => handleUpdateBookingStatus(selectedBookingForModal.id, 'ONAYLANDI')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition border border-emerald-500/20 cursor-pointer"
                >
                  Onayla
                </button>
              )}
              {['BEKLEMEDE', 'ONAYLANDI', 'BLOKE'].includes(selectedBookingForModal.durum) && (
                <button
                  type="button"
                  onClick={() => handleUpdateBookingStatus(selectedBookingForModal.id, 'IPTAL_EDILDI')}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition border border-red-500/20 cursor-pointer"
                >
                  {selectedBookingForModal.durum === 'BLOKE' ? 'Blokajı Kaldır' : (selectedBookingForModal.durum === 'BEKLEMEDE' ? 'Reddet' : 'İptal Et')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Quick Block Pop-up Modal */}
      {quickBlockModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl p-6 space-y-6 relative text-white bg-[#0f0f1c] border border-white/10 shadow-2xl">
            <button
              type="button"
              onClick={() => setQuickBlockModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-purple-300/25 bg-purple-500/10 text-purple-200">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black">Hızlı Bloke Ekle</h3>
                <p className="text-xs text-white/40">Seçili gün ve saate özel antrenman programı bloke edin</p>
              </div>
            </div>

            <form onSubmit={handleQuickAddBlockSlot} className="space-y-4 pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/35">
                    Tarih
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    min={new Date().toISOString().split('T')[0]}
                    value={quickBlockDate}
                    onChange={(e) => setQuickBlockDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/35">
                    Antrenman İsmi
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Voleybol Takımı"
                    className={inputClass}
                    value={quickBlockPurpose}
                    onChange={(e) => setQuickBlockPurpose(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/35">
                    Başlangıç
                  </label>
                  <input
                    type="time"
                    className={inputClass}
                    value={quickBlockStart}
                    onChange={(e) => setQuickBlockStart(e.target.value)}
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
                    value={quickBlockEnd}
                    onChange={(e) => setQuickBlockEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-white/35">
                  Tekrarlanma Sıklığı
                </label>
                <select
                  className={inputClass}
                  value={quickBlockRecurrence}
                  onChange={(e) => {
                    const val = e.target.value as 'NONE' | 'WEEKLY' | 'MONTHLY';
                    setQuickBlockRecurrence(val);
                    if (val === 'WEEKLY') {
                      setQuickBlockRecurrenceCount(12);
                    } else if (val === 'MONTHLY') {
                      setQuickBlockRecurrenceCount(6);
                    }
                  }}
                >
                  <option value="NONE">Hiçbir zaman</option>
                  <option value="WEEKLY">Haftalık (haftanın seçilen günü)</option>
                  <option value="MONTHLY">Aylık (ayın seçilen günü)</option>
                </select>
              </div>

              {quickBlockRecurrence !== 'NONE' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/35">
                    {quickBlockRecurrence === 'WEEKLY' ? 'Tekrarlanma Sayısı (Hafta)' : 'Tekrarlanma Sayısı (Ay)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={quickBlockRecurrenceCount}
                    onChange={(e) => setQuickBlockRecurrenceCount(Math.max(1, Number(e.target.value)))}
                    required
                  />
                  {quickBlockRecurrence === 'WEEKLY' && quickBlockDate && (
                    <p className="text-[10px] font-bold text-purple-300 bg-purple-500/5 p-2.5 rounded-lg border border-purple-500/10 leading-relaxed">
                      * Her {new Date(quickBlockDate).toLocaleDateString('tr-TR', { weekday: 'long' })} günü olmak üzere {quickBlockRecurrenceCount} hafta boyunca tekrarlanır.
                    </p>
                  )}
                  {quickBlockRecurrence === 'MONTHLY' && quickBlockDate && (
                    <p className="text-[10px] font-bold text-purple-300 bg-purple-500/5 p-2.5 rounded-lg border border-purple-500/10 leading-relaxed">
                      * Her ayın {new Date(quickBlockDate).getDate()}'inde olmak üzere {quickBlockRecurrenceCount} ay boyunca tekrarlanır.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isBookingLoading}
                className="w-full px-5 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-sm transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/10 cursor-pointer"
              >
                {isBookingLoading ? 'Bloke Ediliyor...' : 'Antrenman Saati Bloke Et'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
