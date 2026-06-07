import React, { useEffect, useState, useMemo } from 'react';
import { useFacilityStore } from '../store/facilityStore';
import { useBookingStore } from '../store/bookingStore';
import { motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  Clock,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  CalendarDays,
} from 'lucide-react';

const panelStyle = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const inputClass = 'w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60 transition-all';

export const FacilityBookingPage = () => {
  const { facilities, isLoading: isFacilitiesLoading, fetchFacilities } = useFacilityStore();
  const { createBooking, calendarBookings, fetchCalendarBookings, isLoading: isBookingLoading, error, successMessage, clearMessages } = useBookingStore();

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  
  // Calendar state: Start of the visible week (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Form fields
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [purpose, setPurpose] = useState<string>('');
  const [participantCount, setParticipantCount] = useState<number>(2);

  useEffect(() => {
    fetchFacilities();
    return () => {
      clearMessages();
    };
  }, [fetchFacilities, clearMessages]);

  const selectedFacility = useMemo(() => {
    return facilities.find(f => f.id === selectedFacilityId) || null;
  }, [facilities, selectedFacilityId]);

  const selectedResource = useMemo(() => {
    if (!selectedFacility) return null;
    return selectedFacility.kaynaklar.find(r => r.id === selectedResourceId) || null;
  }, [selectedFacility, selectedResourceId]);

  // Set default values when selections change
  useEffect(() => {
    if (facilities.length > 0 && !selectedFacilityId) {
      const firstFac = facilities[0];
      setSelectedFacilityId(firstFac.id);
      if (firstFac.kaynaklar.length > 0) {
        setSelectedResourceId(firstFac.kaynaklar[0].id);
      }
    }
  }, [facilities, selectedFacilityId]);

  useEffect(() => {
    if (selectedFacility) {
      if (selectedFacility.kaynaklar.length > 0) {
        const belongs = selectedFacility.kaynaklar.some(r => r.id === selectedResourceId);
        if (!belongs) {
          setSelectedResourceId(selectedFacility.kaynaklar[0].id);
        }
      } else {
        setSelectedResourceId('');
      }
    }
  }, [selectedFacility, selectedResourceId]);

  // Fetch calendar bookings when resource or week changes
  useEffect(() => {
    if (selectedResourceId) {
      const start = new Date(currentWeekStart);
      const end = new Date(currentWeekStart);
      end.setDate(end.getDate() + 7);
      fetchCalendarBookings(selectedResourceId, start.toISOString(), end.toISOString());
    }
  }, [selectedResourceId, currentWeekStart, fetchCalendarBookings]);

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId) return;

    const localTimeZoneOffset = () => {
      const offset = new Date().getTimezoneOffset();
      const absOffset = Math.abs(offset);
      const hours = Math.floor(absOffset / 60).toString().padStart(2, '0');
      const mins = (absOffset % 60).toString().padStart(2, '0');
      return (offset <= 0 ? '+' : '-') + hours + ':' + mins;
    };

    const offset = localTimeZoneOffset();
    const startIso = `${bookingDate}T${startTime}:00${offset}`;
    const endIso = `${bookingDate}T${endTime}:00${offset}`;

    const success = await createBooking({
      kaynakId: selectedResourceId,
      baslangicTarihi: startIso,
      bitisTarihi: endIso,
      amac: purpose,
      katilimciSayisi: participantCount,
    });

    if (success) {
      setPurpose('');
      setParticipantCount(2);
      setSelectedDate(null);
      setSelectedHours([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Refresh calendar
      const start = new Date(currentWeekStart);
      const end = new Date(currentWeekStart);
      end.setDate(end.getDate() + 7);
      fetchCalendarBookings(selectedResourceId, start.toISOString(), end.toISOString());
    }
  };

  // Generate list of days for current week
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  // Dynamic Hours list based on active working hours
  const dynamicHoursList = useMemo(() => {
    if (!selectedResource || !selectedResource.kullanimKurallari || selectedResource.kullanimKurallari.length === 0) {
      return Array.from({ length: 15 }, (_, i) => 8 + i); // Default 08:00 to 22:00
    }
    const activeRules = selectedResource.kullanimKurallari.filter(r => r.durum === 'AKTIF');
    if (activeRules.length === 0) {
      return Array.from({ length: 15 }, (_, i) => 8 + i); // Default
    }
    
    let minHour = 24;
    let maxHour = 0;
    
    activeRules.forEach(r => {
      const startHour = parseInt(r.baslangicSaati.split(':')[0], 10);
      const endHour = parseInt(r.bitisSaati.split(':')[0], 10);
      if (startHour < minHour) minHour = startHour;
      if (endHour > maxHour) maxHour = endHour;
    });
    
    if (minHour >= maxHour) {
      minHour = 8;
      maxHour = 22;
    }
    
    const length = maxHour - minHour;
    return Array.from({ length: length + 1 }, (_, i) => minHour + i);
  }, [selectedResource]);

  const isDayClosed = (day: Date) => {
    if (!selectedResource || !selectedResource.kullanimKurallari) return false;
    let dayNum = day.getDay();
    if (dayNum === 0) dayNum = 7; // Convert Sunday from 0 to 7
    
    const hasActiveRule = selectedResource.kullanimKurallari.some(
      r => r.haftaninGunu === dayNum && r.durum === 'AKTIF'
    );
    return !hasActiveRule;
  };

  const dayLabels: Record<number, string> = {
    1: 'Pazartesi',
    2: 'Salı',
    3: 'Çarşamba',
    4: 'Perşembe',
    5: 'Cuma',
    6: 'Cumartesi',
    7: 'Pazar',
  };

  // Helper to find booking overlapping with day & hour slot
  const getBookingForSlot = (day: Date, hour: number) => {
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

  const handleSlotClick = (day: Date, hour: number) => {
    const slotDateTime = new Date(day);
    slotDateTime.setHours(hour, 0, 0, 0);
    const isPast = slotDateTime < new Date();
    if (isPast) return;

    const dayStr = day.toDateString();
    
    if (!selectedDate || selectedDate.toDateString() !== dayStr) {
      // New day click or first selection
      setSelectedDate(day);
      setSelectedHours([hour]);
      
      const formattedDate = day.toISOString().split('T')[0];
      setBookingDate(formattedDate);
      setStartTime(`${hour.toString().padStart(2, '0')}:00`);
      setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
    } else {
      // Same day multi-slot toggle & range auto-fill
      let newHours = [...selectedHours];
      if (newHours.includes(hour)) {
        newHours = newHours.filter(h => h !== hour);
      } else {
        newHours.push(hour);
      }

      if (newHours.length === 0) {
        setSelectedDate(null);
        setSelectedHours([]);
        setStartTime('09:00');
        setEndTime('10:00');
      } else {
        newHours.sort((a, b) => a - b);
        const minHour = newHours[0];
        const maxHour = newHours[newHours.length - 1];
        
        const filledHours = [];
        for (let h = minHour; h <= maxHour; h++) {
          const booking = getBookingForSlot(day, h);
          if (!booking) {
            filledHours.push(h);
          }
        }
        
        if (filledHours.length === 0) {
          setSelectedDate(null);
          setSelectedHours([]);
        } else {
          setSelectedHours(filledHours);
          const finalMin = filledHours[0];
          const finalMax = filledHours[filledHours.length - 1];
          setStartTime(`${finalMin.toString().padStart(2, '0')}:00`);
          setEndTime(`${(finalMax + 1).toString().padStart(2, '0')}:00`);
        }
      }
    }
    
    // Smooth scroll to booking details form
    const formSection = document.getElementById('booking-details-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 text-white pb-12">
      <div>
        <h1 className="text-3xl font-black text-white">Spor Tesisleri Rezervasyon Takvimi</h1>
        <p className="mt-2 text-sm text-white/45 leading-relaxed">
          Işık Üniversitesi Spor Müdürlüğü antrenman takvimini inceleyin, boş saatleri görerek kolayca rezerve edin.
        </p>
      </div>

      {(error || successMessage) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-3 ${
            error
              ? 'border border-red-500/20 bg-red-500/10 text-red-200'
              : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {error ? <AlertCircle className="h-5 w-5 shrink-0 text-red-400" /> : <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />}
          <span>{error || successMessage}</span>
        </motion.div>
      )}

      {isFacilitiesLoading ? (
        <div className="text-white/40 text-sm font-semibold py-12 text-center">Tesisler yükleniyor...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* Main Content Area */}
          <div className="space-y-6">
            {/* 1. Selection area */}
            <section className="rounded-3xl p-6 space-y-6" style={panelStyle}>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Alan & Tesis Seçimi</h2>
                  <p className="text-xs font-semibold text-white/35">Rezerve etmek veya programını incelemek istediğiniz sahayı seçin</p>
                </div>
              </div>

              <div className="w-full">
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
                  Spor Sahası / Salon / Kort Seçin
                </label>
                <select
                  className={inputClass}
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
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
            </section>

            {/* 2. Visual Weekly Calendar */}
            <section className="rounded-3xl p-6 space-y-6" style={panelStyle}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Haftalık Rezervasyon ve Antrenman Takvimi</h2>
                    <p className="text-xs font-semibold text-white/35">Boş saatlerin üzerine tıklayarak doğrudan form doldurabilirsiniz</p>
                  </div>
                </div>

                {/* Week Navigation */}
                <div className="flex items-center gap-2 bg-[#111123] rounded-2xl p-1.5 border border-white/5">
                  <button
                    onClick={handlePrevWeek}
                    className="p-2 hover:bg-white/5 rounded-xl text-white/70 transition cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-black px-2 tracking-wide whitespace-nowrap">
                    {currentWeekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={handleNextWeek}
                    className="p-2 hover:bg-white/5 rounded-xl text-white/70 transition cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs font-bold text-white/60">
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500/15 border border-emerald-400/20" />
                  Boş Saat
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-cyan-500/25 border border-cyan-400/35" />
                  Seçtiğiniz Saatler (Rezervasyon Talebi)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-400/30" />
                  Rezervasyonlu (Öğrenci)
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-purple-500/20 border border-purple-400/30" />
                  Spor Takımı Antrenmanı (Bloke Slot)
                </span>
              </div>

              {/* Grid Calendar Layout */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px] border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a14]">
                  {/* Calendar Header: Days */}
                  <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-white/[0.02] border-b border-white/10 text-center py-3">
                    <span className="text-xs font-black text-white/30 self-center">SAAT</span>
                    {weekDays.map((day, idx) => {
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

                  {/* Calendar Body: Hours & Slots */}
                  <div className="divide-y divide-white/5">
                    {dynamicHoursList.map((hour) => (
                      <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] items-stretch">
                        {/* Hour Label */}
                        <div className="text-center py-4 text-xs font-bold text-white/40 self-center bg-white/[0.01] border-r border-white/5 flex flex-col justify-center">
                          <span>{hour.toString().padStart(2, '0')}:00</span>
                          <span className="text-[10px] opacity-40 -mt-0.5">{(hour + 1).toString().padStart(2, '0')}:00</span>
                        </div>

                        {/* Slots for each day */}
                        {weekDays.map((day, dayIdx) => {
                          const booking = getBookingForSlot(day, hour);
                          const isBlocked = booking?.durum === 'BLOKE';
                          const isConfirmed = booking && !isBlocked;
                          const slotDateTime = new Date(day);
                          slotDateTime.setHours(hour, 0, 0, 0);
                          const isPast = slotDateTime < new Date();
                          const isClosed = isDayClosed(day);
                          const isSelected = selectedDate && selectedDate.toDateString() === day.toDateString() && selectedHours.includes(hour);

                          let cellStyle = 'bg-emerald-500/[0.03] hover:bg-emerald-500/10 text-emerald-300 border-r border-white/5 last:border-r-0 cursor-pointer';
                          if (isClosed) {
                            cellStyle = 'bg-red-500/[0.01] border-red-500/5 text-white/20 border-r border-white/5 last:border-r-0 cursor-not-allowed opacity-40';
                          } else if (isBlocked) {
                            cellStyle = 'bg-purple-500/15 border border-purple-500/20 text-purple-200 border-r border-white/5 last:border-r-0 cursor-not-allowed';
                          } else if (isConfirmed) {
                            cellStyle = 'bg-amber-500/15 border border-amber-500/20 text-amber-200 border-r border-white/5 last:border-r-0 cursor-not-allowed';
                          } else if (isPast) {
                            cellStyle = 'bg-white/[0.01] text-white/20 border-r border-white/5 last:border-r-0 cursor-not-allowed';
                          } else if (isSelected) {
                            cellStyle = 'bg-cyan-500/25 border border-cyan-400/35 text-cyan-200 border-r border-white/5 last:border-r-0 cursor-pointer';
                          }

                          return (
                            <div
                              key={dayIdx}
                              onClick={() => !booking && !isPast && !isClosed && handleSlotClick(day, hour)}
                              className={`p-2 min-h-14 flex flex-col items-center justify-center text-center transition-all ${cellStyle}`}
                            >
                              {isClosed ? (
                                <span className="text-[10px] font-black opacity-30 tracking-wider">KAPALI</span>
                              ) : isBlocked ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Lock className="h-3 w-3 text-purple-400" />
                                  <span className="text-[10px] font-black leading-none uppercase tracking-wide truncate max-w-[90px]">
                                    {booking.amac || 'Takım Antrenmanı'}
                                  </span>
                                </div>
                              ) : isConfirmed ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[10px] font-black leading-none uppercase tracking-wide">
                                    DOLU
                                  </span>
                                  <span className="text-[9px] opacity-60">
                                    {booking.rezervasyonYapanKullaniciId}
                                  </span>
                                </div>
                              ) : isPast ? (
                                <span className="text-[10px] font-bold opacity-30">GEÇMİŞ</span>
                              ) : isSelected ? (
                                <span className="text-[10px] font-black tracking-wide text-cyan-200">SEÇİLDİ</span>
                              ) : (
                                <span className="text-[10px] font-black opacity-40 hover:opacity-100 transition-opacity">BOŞ</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Booking Details Form */}
            <section id="booking-details-form" className="rounded-3xl p-6 scroll-mt-6" style={panelStyle}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Rezervasyon Formu</h2>
                    <p className="text-xs font-semibold text-white/35">Zaman ve kullanım detaylarını belirtin</p>
                  </div>
                </div>

                {/* Selected Time Summary Slot Card instead of manual fields */}
                {selectedDate && selectedHours.length > 0 ? (
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      Seçilen Rezervasyon Zamanı
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-lg font-black text-white">
                          {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
                        </div>
                        <div className="text-sm font-semibold text-cyan-200/80 flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>{startTime} - {endTime} ({selectedHours.length} saat)</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(null);
                          setSelectedHours([]);
                          setStartTime('09:00');
                          setEndTime('10:00');
                        }}
                        className="text-xs font-bold text-red-300 hover:text-red-200 cursor-pointer self-start sm:self-center"
                      >
                        Seçimi Temizle
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center text-sm text-white/40">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-white/20" />
                    Lütfen yukarıdaki haftalık takvimden rezervasyon yapmak istediğiniz boş saat slotlarına tıklayarak seçim yapın.
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <div>
                    <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
                      Rezervasyon Amacı
                    </label>
                    <div className="relative flex items-center">
                      <FileText className="absolute left-4 text-white/30 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Örn: Basketbol antrenmanı veya maç"
                        className={`${inputClass} pl-11`}
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
                      Kişi Sayısı
                    </label>
                    <div className="relative flex items-center">
                      <Users className="absolute left-4 text-white/30 h-4 w-4" />
                      <input
                        type="number"
                        min={1}
                        max={selectedResource?.kapasite || 100}
                        className={`${inputClass} pl-11`}
                        value={participantCount}
                        onChange={(e) => setParticipantCount(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBookingLoading || !selectedResourceId || !selectedDate || selectedHours.length === 0}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-cyan-300 hover:bg-cyan-200 text-[#071018] font-black text-sm transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-300/10 cursor-pointer"
                >
                  {isBookingLoading ? 'Rezervasyon Yapılıyor...' : 'Rezervasyonu Tamamla'}
                </button>
              </form>
            </section>
          </div>

          {/* Sidebar Area: Policies & Availability */}
          <div className="space-y-6">
            {/* Rules & Policy Card */}
            <section className="rounded-3xl p-5 space-y-4" style={panelStyle}>
              <div className="flex items-center gap-2 text-cyan-200">
                <HelpCircle className="h-5 w-5 shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wider">Tesis Kriterleri</h3>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                Bu tesise özel olarak özelleştirilmiş kurallar ve politikalar aşağıda listelenmiştir.
              </p>

              {selectedFacility ? (
                <div className="space-y-3 pt-2">
                  <PolicyItem
                    label="İleri Rezervasyon Limiti"
                    value={`${selectedFacility.politika?.rezervasyonPenceresiGun || 14} gün önceden`}
                  />
                  <PolicyItem
                    label="Minimum Ön Bildirim"
                    value={`${selectedFacility.politika?.minimumBildirimDakika || 15} dakika kala`}
                  />
                  <PolicyItem
                    label="Son İptal Süresi"
                    value={`${selectedFacility.politika?.iptalLimitDakika || 30} dakika kalaya kadar`}
                  />
                  <PolicyItem
                    label="Maksimum Süre"
                    value={`${selectedFacility.politika?.maksimumRezervasyonSureDakika || 120} dakika`}
                  />
                  <PolicyItem
                    label="Geç Kalma Toleransı (No-Show)"
                    value={`${selectedFacility.politika?.otomatikGelmemeDakika || 15} dakika`}
                  />
                  <PolicyItem
                    label="Günlük Rezervasyon Sınırı"
                    value="En fazla 1 slot / gün (kaynak başına)"
                  />
                  <PolicyItem
                    label="Eşzamanlı Aktif Sınırı"
                    value="En fazla 3 aktif rezervasyon"
                  />
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-xs font-semibold text-white/40">Check-in Zorunluluğu</span>
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        selectedFacility.politika?.yoklamaZorunlu
                          ? 'bg-amber-400/10 text-amber-200'
                          : 'bg-emerald-400/10 text-emerald-200'
                      }`}
                    >
                      {selectedFacility.politika?.yoklamaZorunlu ? 'Zorunlu' : 'Gerekli Değil'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-white/30 text-center py-4">Politika kuralları bulunamadı</div>
              )}
            </section>

            {/* Weekly Availability Card */}
            <section className="rounded-3xl p-5 space-y-4" style={panelStyle}>
              <div className="flex items-center gap-2 text-cyan-200">
                <Clock className="h-5 w-5 shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wider">Haftalık Çalışma Saatleri</h3>
              </div>

              {selectedResource ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedResource.kullanimKurallari?.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1 text-xs border-b border-white/5 last:border-0"
                    >
                      <span className="font-bold text-white/70">{dayLabels[rule.haftaninGunu]}</span>
                      <span className="font-semibold text-white/50">
                        {rule.baslangicSaati.substring(0, 5)} - {rule.bitisSaati.substring(0, 5)}
                      </span>
                    </div>
                  ))}
                  {(!selectedResource.kullanimKurallari || selectedResource.kullanimKurallari.length === 0) && (
                    <div className="text-xs text-white/30 text-center py-4">Tanımlı saat aralığı yok (Tüm gün açık)</div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-white/30 text-center py-4">Önce bir kaynak birimi seçmelisiniz</div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

const PolicyItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
    <span className="text-white/40">{label}</span>
    <span className="font-black text-white/80">{value}</span>
  </div>
);
