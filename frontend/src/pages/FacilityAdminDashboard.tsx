import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  Calendar,
  User,
  FileText,
  Lock,
} from 'lucide-react';
import { useFacilityStore, type KullanimKurali, type TesisPolitikasi } from '../store/facilityStore';
import { useBookingStore, type Rezervasyon } from '../store/bookingStore';

import {
  panelStyle,
  inputClass,
  compactInputClass,
  facilityTypes,
  dayLabels,
  blankFacilityForm,
  defaultPolicy,
  type WeeklyHourDay,
  SectionTitle,
  StatusBadge,
  BookingStatusBadge,
  NumberField,
} from '../components/facility-admin/ortak';
import { CalendarView } from '../components/facility-admin/CalendarView';

export const FacilityAdminDashboard = () => {
  const {
    facilities,
    selectedFacilityId,
    selectedResourceId,
    isLoading: isFacilityLoading,
    error: facilityError,
    successMessage: facilitySuccess,
    fetchFacilities,
    selectFacility,
    createFacility,
    updateFacility,
    updatePolicy,
    replaceAvailabilityRules,
    deleteFacility,
  } = useFacilityStore();

  const {
    allBookings,
    calendarBookings,
    fetchAllBookings,
    fetchCalendarBookings,
    createBlockedSlot,
    updateBookingStatus,
    isLoading: isBookingLoading,
    error: bookingError,
    successMessage: bookingSuccess,
  } = useBookingStore();

  const [activeView, setActiveView] = useState<'config' | 'bookings' | 'calendar'>('config');

  // Config Forms
  const [facilityForm, setFacilityForm] = useState(blankFacilityForm);
  const [policyForm, setPolicyForm] = useState<TesisPolitikasi>(defaultPolicy);
  const [, setRules] = useState<KullanimKurali[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHourDay[]>([]);

  // Block Team Training Form
  const [blockResourceId, setBlockResourceId] = useState<string>('');
  const [blockDate, setBlockDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [blockStart, setBlockStart] = useState<string>('18:00');
  const [blockEnd, setBlockEnd] = useState<string>('20:00');
  const [blockPurpose, setBlockPurpose] = useState<string>('');
  const [recurrence, setRecurrence] = useState<'NONE' | 'WEEKLY' | 'MONTHLY'>('NONE');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(12);

  // General Calendar States
  const [calendarFacilityId, setCalendarFacilityId] = useState<string>('');
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<Rezervasyon | null>(null);

  // Quick Block States
  const [quickBlockModalOpen, setQuickBlockModalOpen] = useState(false);
  const [quickBlockDate, setQuickBlockDate] = useState<string>('');
  const [quickBlockStart, setQuickBlockStart] = useState<string>('09:00');
  const [quickBlockEnd, setQuickBlockEnd] = useState<string>('10:00');
  const [quickBlockPurpose, setQuickBlockPurpose] = useState<string>('');
  const [quickBlockRecurrence, setQuickBlockRecurrence] = useState<'NONE' | 'WEEKLY' | 'MONTHLY'>('NONE');
  const [quickBlockRecurrenceCount, setQuickBlockRecurrenceCount] = useState<number>(12);

  // Loading triggers
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  useEffect(() => {
    if (activeView === 'bookings') {
      fetchAllBookings();
    }
  }, [activeView, fetchAllBookings]);

  // Set default calendar facility
  useEffect(() => {
    if (facilities.length > 0 && !calendarFacilityId) {
      setCalendarFacilityId(facilities[0].id);
    }
  }, [facilities, calendarFacilityId]);

  // Fetch calendar bookings when activeView, facility, or week changes
  useEffect(() => {
    if (activeView === 'calendar' && calendarFacilityId) {
      const facility = facilities.find(f => f.id === calendarFacilityId);
      const resourceId = facility?.kaynaklar?.[0]?.id;
      if (resourceId) {
        const start = new Date(calendarWeekStart);
        const end = new Date(calendarWeekStart);
        end.setDate(end.getDate() + 7);
        fetchCalendarBookings(resourceId, start.toISOString(), end.toISOString());
      }
    }
  }, [activeView, calendarFacilityId, calendarWeekStart, facilities, fetchCalendarBookings]);

  // Set default block resource
  useEffect(() => {
    if (facilities.length > 0 && !blockResourceId) {
      const activeResources = facilities.flatMap(f => f.kaynaklar).filter(r => r.durum === 'AKTIF');
      if (activeResources.length > 0) {
        setBlockResourceId(activeResources[0].id);
      }
    }
  }, [facilities, blockResourceId]);

  const selectedFacility = useMemo(
    () => facilities.find(facility => facility.id === selectedFacilityId) || null,
    [facilities, selectedFacilityId]
  );

  const selectedResource = useMemo(
    () => selectedFacility?.kaynaklar.find(resource => resource.id === selectedResourceId) || null,
    [selectedFacility, selectedResourceId]
  );

  const calendarFacility = useMemo(() => {
    return facilities.find(f => f.id === calendarFacilityId) || null;
  }, [facilities, calendarFacilityId]);

  const calendarResource = useMemo(() => {
    return calendarFacility?.kaynaklar?.[0] || null;
  }, [calendarFacility]);

  const dynamicCalendarHoursList = useMemo(() => {
    if (!calendarResource || !calendarResource.kullanimKurallari || calendarResource.kullanimKurallari.length === 0) {
      return Array.from({ length: 15 }, (_, i) => 8 + i); // Default 08:00 to 22:00
    }
    const activeRules = calendarResource.kullanimKurallari.filter(r => r.durum === 'AKTIF');
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
  }, [calendarResource]);

  // Sync forms with selected facility
  useEffect(() => {
    if (!selectedFacility) {
      setFacilityForm(blankFacilityForm);
      setPolicyForm(defaultPolicy);
      return;
    }
    setFacilityForm({
      ad: selectedFacility.ad,
      tesisTuru: selectedFacility.tesisTuru,
      aciklama: selectedFacility.aciklama || '',
      konumMetni: selectedFacility.konumMetni || '',
      kapasite: selectedFacility.kapasite,
      durum: selectedFacility.durum,
    });
    setPolicyForm(selectedFacility.politika || defaultPolicy);
  }, [selectedFacility]);

  // Sync availability rules with selected resource
  useEffect(() => {
    if (!selectedResource) {
      setRules([]);
      setWeeklyHours([]);
      return;
    }
    const currentRules = selectedResource.kullanimKurallari || [];
    setRules(currentRules);

    const initialWeekly: WeeklyHourDay[] = [];
    for (let day = 1; day <= 7; day++) {
      const match = currentRules.find(r => r.haftaninGunu === day && r.durum === 'AKTIF');
      if (match) {
        initialWeekly.push({
          haftaninGunu: day,
          isOpen: true,
          baslangicSaati: match.baslangicSaati.substring(0, 5),
          bitisSaati: match.bitisSaati.substring(0, 5),
        });
      } else {
        initialWeekly.push({
          haftaninGunu: day,
          isOpen: false,
          baslangicSaati: '08:00',
          bitisSaati: '22:00',
        });
      }
    }
    setWeeklyHours(initialWeekly);
  }, [selectedResource]);

  const resetFacilityForm = () => setFacilityForm(blankFacilityForm);

  const handleCreateFacility = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = await createFacility(facilityForm);
    if (ok) resetFacilityForm();
  };

  const handleUpdateFacility = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFacility) return;
    await updateFacility(selectedFacility.id, facilityForm);
  };

  const handleDeleteFacility = async () => {
    if (!selectedFacility) return;
    if (window.confirm(`${selectedFacility.ad} tesisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve ilişkili tüm rezervasyonlar iptal edilir.`)) {
      const ok = await deleteFacility(selectedFacility.id);
      if (ok) {
        selectFacility(null);
        resetFacilityForm();
      }
    }
  };

  const handleUpdatePolicy = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFacility) return;
    await updatePolicy(selectedFacility.id, policyForm);
  };

  const handleSaveRules = async () => {
    if (!selectedResource) return;
    const rulesToSave: KullanimKurali[] = weeklyHours
      .filter(w => w.isOpen)
      .map(w => ({
        haftaninGunu: w.haftaninGunu,
        baslangicSaati: w.baslangicSaati,
        bitisSaati: w.bitisSaati,
        durum: 'AKTIF',
      }));
    await replaceAvailabilityRules(selectedResource.id, rulesToSave);
  };

  const handleAddBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockResourceId) return;

    const localTimeZoneOffset = () => {
      const offset = new Date().getTimezoneOffset();
      const absOffset = Math.abs(offset);
      const hours = Math.floor(absOffset / 60).toString().padStart(2, '0');
      const mins = (absOffset % 60).toString().padStart(2, '0');
      return (offset <= 0 ? '+' : '-') + hours + ':' + mins;
    };

    const offset = localTimeZoneOffset();
    const datesToBlock: string[] = [];
    const baseDate = new Date(blockDate);

    if (recurrence === 'NONE') {
      datesToBlock.push(blockDate);
    } else if (recurrence === 'WEEKLY') {
      for (let i = 0; i < recurrenceCount; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + (i * 7));
        datesToBlock.push(nextDate.toISOString().split('T')[0]);
      }
    } else if (recurrence === 'MONTHLY') {
      for (let i = 0; i < recurrenceCount; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setMonth(baseDate.getMonth() + i);
        datesToBlock.push(nextDate.toISOString().split('T')[0]);
      }
    }

    let successCount = 0;
    for (const date of datesToBlock) {
      const startIso = `${date}T${blockStart}:00${offset}`;
      const endIso = `${date}T${blockEnd}:00${offset}`;

      const success = await createBlockedSlot({
        kaynakId: blockResourceId,
        baslangicTarihi: startIso,
        bitisTarihi: endIso,
        amac: blockPurpose || 'Takım Antrenmanı',
        katilimciSayisi: 15,
      });

      if (success) {
        successCount++;
      }
    }

    if (successCount > 0) {
      setBlockPurpose('');
      setRecurrence('NONE');
      fetchAllBookings();
    }
  };

  const formatDateTime = (isoStr: string) => {
    const d = new Date(isoStr);
    const date = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    const ok = await updateBookingStatus(bookingId, status);
    if (ok) {
      fetchAllBookings();
      if (calendarFacilityId) {
        const facility = facilities.find(f => f.id === calendarFacilityId);
        const resourceId = facility?.kaynaklar?.[0]?.id;
        if (resourceId) {
          const start = new Date(calendarWeekStart);
          const end = new Date(calendarWeekStart);
          end.setDate(end.getDate() + 7);
          fetchCalendarBookings(resourceId, start.toISOString(), end.toISOString());
        }
      }
      setSelectedBookingForModal(null);
    }
  };

  const handleQuickAddBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const facility = facilities.find(f => f.id === calendarFacilityId);
    const resourceId = facility?.kaynaklar?.[0]?.id;
    if (!resourceId) return;

    const localTimeZoneOffset = () => {
      const offset = new Date().getTimezoneOffset();
      const absOffset = Math.abs(offset);
      const hours = Math.floor(absOffset / 60).toString().padStart(2, '0');
      const mins = (absOffset % 60).toString().padStart(2, '0');
      return (offset <= 0 ? '+' : '-') + hours + ':' + mins;
    };

    const offset = localTimeZoneOffset();
    const datesToBlock: string[] = [];
    const baseDate = new Date(quickBlockDate);

    if (quickBlockRecurrence === 'NONE') {
      datesToBlock.push(quickBlockDate);
    } else if (quickBlockRecurrence === 'WEEKLY') {
      for (let i = 0; i < quickBlockRecurrenceCount; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + (i * 7));
        datesToBlock.push(nextDate.toISOString().split('T')[0]);
      }
    } else if (quickBlockRecurrence === 'MONTHLY') {
      for (let i = 0; i < quickBlockRecurrenceCount; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setMonth(baseDate.getMonth() + i);
        datesToBlock.push(nextDate.toISOString().split('T')[0]);
      }
    }

    let successCount = 0;
    for (const date of datesToBlock) {
      const startIso = `${date}T${quickBlockStart}:00${offset}`;
      const endIso = `${date}T${quickBlockEnd}:00${offset}`;

      const success = await createBlockedSlot({
        kaynakId: resourceId,
        baslangicTarihi: startIso,
        bitisTarihi: endIso,
        amac: quickBlockPurpose || 'Takım Antrenmanı',
        katilimciSayisi: 15,
      });

      if (success) {
        successCount++;
      }
    }

    if (successCount > 0) {
      setQuickBlockPurpose('');
      setQuickBlockRecurrence('NONE');
      setQuickBlockModalOpen(false);
      
      fetchAllBookings();
      const start = new Date(calendarWeekStart);
      const end = new Date(calendarWeekStart);
      end.setDate(end.getDate() + 7);
      fetchCalendarBookings(resourceId, start.toISOString(), end.toISOString());
    }
  };

  const isLoading = isFacilityLoading || isBookingLoading;
  const error = facilityError || bookingError;
  const successMessage = facilitySuccess || bookingSuccess;

  // Flatten active resources list for block form
  const flatResources = useMemo(() => {
    return facilities.flatMap((f) => 
      f.kaynaklar.filter(r => r.durum === 'AKTIF' && r.rezervasyonYapilabilir).map((r) => ({
        id: r.id,
        ad: f.ad === r.ad ? f.ad : `${f.ad} - ${r.ad}`,
      }))
    );
  }, [facilities]);

  return (
    <div className="space-y-6 text-white pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-normal text-white">Spor Müdürlüğü Yönetim Paneli</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/45">
            Işık Üniversitesi Spor Tesislerini, kaynaklarını, kurallarını yönetin ve takım antrenman programlarını bloke slotlar olarak tanımlayın.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (activeView === 'config') {
              fetchFacilities();
            } else if (activeView === 'bookings') {
              fetchAllBookings();
            } else if (activeView === 'calendar' && calendarFacilityId) {
              const facility = facilities.find(f => f.id === calendarFacilityId);
              const resourceId = facility?.kaynaklar?.[0]?.id;
              if (resourceId) {
                const start = new Date(calendarWeekStart);
                const end = new Date(calendarWeekStart);
                end.setDate(end.getDate() + 7);
                fetchCalendarBookings(resourceId, start.toISOString(), end.toISOString());
              }
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-px">
        <button
          onClick={() => setActiveView('config')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeView === 'config'
              ? 'border-cyan-300 text-cyan-200'
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          Tesis & Kaynak Yapılandırması
        </button>
        <button
          onClick={() => setActiveView('bookings')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeView === 'bookings'
              ? 'border-cyan-300 text-cyan-200'
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          Antrenman & Rezervasyon Yönetimi ({allBookings.length})
        </button>
        <button
          onClick={() => setActiveView('calendar')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition cursor-pointer ${
            activeView === 'calendar'
              ? 'border-cyan-300 text-cyan-200'
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          Genel Rezervasyon Takvimi
        </button>
      </div>

      {(error || successMessage) && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? 'border border-red-400/25 bg-red-500/12 text-red-100' : 'border border-emerald-300/25 bg-emerald-500/12 text-emerald-100'}`}>
          {error || successMessage}
        </div>
      )}

      {activeView === 'config' ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-3xl p-4" style={panelStyle}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">Spor Tesisleri</h2>
                  <p className="text-xs font-semibold text-white/35">Yönetilecek ana alanlar</p>
                </div>
                <button
                  type="button"
                  onClick={() => { selectFacility(null); resetFacilityForm(); }}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 transition cursor-pointer"
                  title="Yeni Tesis Ekle"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {facilities.map(facility => (
                  <button
                    key={facility.id}
                    type="button"
                    onClick={() => selectFacility(facility.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${facility.id === selectedFacilityId ? 'border-cyan-300/40 bg-cyan-400/10' : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{facility.ad}</p>
                        <p className="mt-1 text-xs font-semibold text-white/38">{facility.konumMetni || 'Konum girilmedi'}</p>
                      </div>
                      <StatusBadge durum={facility.durum} />
                    </div>
                    <div className="mt-3 flex gap-2 text-[11px] font-bold text-white/45">
                      <span>Kapasite: {facility.kapasite}</span>
                      <span>{facility.kaynaklar.length} kaynak</span>
                    </div>
                  </button>
                ))}
                {facilities.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/38">
                    Henüz tesis tanımı yok.
                  </p>
                )}
              </div>
            </section>

            <div className="grid gap-6 2xl:grid-cols-2">
              <section className="rounded-3xl p-5" style={panelStyle}>
                <SectionTitle icon={Plus} title="Tesis Tanımı" subtitle={selectedFacility ? 'Seçili tesisi güncelleyin veya yeni tesis oluşturun.' : 'İlk tesis kaydını oluşturun.'} />
                <form className="mt-5 space-y-4" onSubmit={selectedFacility ? handleUpdateFacility : handleCreateFacility}>
                  <input className={inputClass} placeholder="Tesis adı" value={facilityForm.ad} onChange={e => setFacilityForm(prev => ({ ...prev, ad: e.target.value }))} required />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select className={inputClass} value={facilityForm.tesisTuru} onChange={e => setFacilityForm(prev => ({ ...prev, tesisTuru: e.target.value }))}>
                      {facilityTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                    <input className={inputClass} type="number" min={1} value={facilityForm.kapasite} onChange={e => setFacilityForm(prev => ({ ...prev, kapasite: Number(e.target.value) }))} required />
                  </div>
                  <input className={inputClass} placeholder="Konum" value={facilityForm.konumMetni} onChange={e => setFacilityForm(prev => ({ ...prev, konumMetni: e.target.value }))} />
                  <textarea className={`${inputClass} min-h-28 resize-none`} placeholder="Açıklama" value={facilityForm.aciklama} onChange={e => setFacilityForm(prev => ({ ...prev, aciklama: e.target.value }))} />
                  <div className="flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#071018] transition hover:bg-cyan-200 cursor-pointer" type="submit">
                      <Save className="h-4 w-4" />
                      {selectedFacility ? 'Tesisi Güncelle' : 'Tesis Oluştur'}
                    </button>
                    {selectedFacility && (
                      <button
                        type="button"
                        onClick={handleDeleteFacility}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 hover:bg-red-500/20 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        Tesisi Sil
                      </button>
                    )}
                  </div>
                </form>
              </section>

              <section className="rounded-3xl p-5" style={panelStyle}>
                <SectionTitle icon={Settings2} title="Tesis Politikaları ve Kriterleri" subtitle="Öğrenci rezervasyon fazında uygulanacak tesis kuralları." />
                <form className="mt-5 space-y-4" onSubmit={handleUpdatePolicy}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField label="İleri rezervasyon günü" value={policyForm.rezervasyonPenceresiGun} onChange={value => setPolicyForm(prev => ({ ...prev, rezervasyonPenceresiGun: value }))} />
                    <NumberField label="Minimum ön süre (dk)" value={policyForm.minimumBildirimDakika} onChange={value => setPolicyForm(prev => ({ ...prev, minimumBildirimDakika: value }))} />
                    <NumberField label="İptal son süre (dk)" value={policyForm.iptalLimitDakika} onChange={value => setPolicyForm(prev => ({ ...prev, iptalLimitDakika: value }))} />
                    <NumberField label="Maks. rezervasyon (dk)" value={policyForm.maksimumRezervasyonSureDakika} onChange={value => setPolicyForm(prev => ({ ...prev, maksimumRezervasyonSureDakika: value }))} />
                    <NumberField label="No-show toleransı (dk)" value={policyForm.otomatikGelmemeDakika} onChange={value => setPolicyForm(prev => ({ ...prev, otomatikGelmemeDakika: value }))} />
                    <label className="flex min-h-[62px] items-center gap-3 rounded-2xl border border-white/10 bg-[#111123] px-4 py-3 text-sm font-bold text-white/70 font-sans cursor-pointer">
                      <input type="checkbox" checked={policyForm.yoklamaZorunlu} onChange={e => setPolicyForm(prev => ({ ...prev, yoklamaZorunlu: e.target.checked }))} />
                      Check-in zorunlu
                    </label>
                  </div>
                  <button disabled={!selectedFacility} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-[#071018] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer" type="submit">
                    <Save className="h-4 w-4" />
                    Kriterleri Kaydet
                  </button>
                </form>
              </section>

              <section className="rounded-3xl p-5 2xl:col-span-2" style={panelStyle}>
                <SectionTitle icon={Clock3} title="Tesis Çalışma Saatleri" subtitle={selectedFacility ? `${selectedFacility.ad} için haftalık çalışma saatlerini ve kapalı günleri belirleyin` : 'Önce sol taraftan bir tesis seçin.'} />
                
                {selectedFacility ? (
                  <div className="mt-5 space-y-4">
                    <div className="hidden sm:grid grid-cols-[160px_140px_1fr_1fr] gap-4 px-4 text-xs font-black uppercase tracking-wider text-white/35 pb-2 border-b border-white/5">
                      <span>Gün</span>
                      <span>Durum</span>
                      <span>Başlangıç Saati</span>
                      <span>Bitiş Saati</span>
                    </div>

                    <div className="space-y-2.5">
                      {weeklyHours.map((day) => (
                        <div
                          key={day.haftaninGunu}
                          className={`grid grid-cols-1 sm:grid-cols-[160px_140px_1fr_1fr] items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                            day.isOpen
                              ? 'bg-white/[0.02] border-white/10'
                              : 'bg-red-500/[0.01] border-red-500/10 opacity-70'
                          }`}
                        >
                          {/* Day Label */}
                          <span className="text-sm font-black text-white">{dayLabels[day.haftaninGunu]}</span>

                          {/* Toggle Switch */}
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => {
                                setWeeklyHours(prev =>
                                  prev.map(w =>
                                    w.haftaninGunu === day.haftaninGunu ? { ...w, isOpen: !w.isOpen } : w
                                  )
                                );
                              }}
                              className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:outline-none ${
                                day.isOpen ? 'bg-emerald-500' : 'bg-white/10'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  day.isOpen ? 'translate-x-6' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              className={`ml-3 text-xs font-black tracking-wide ${
                                day.isOpen ? 'text-emerald-400' : 'text-white/30'
                              }`}
                            >
                              {day.isOpen ? 'AÇIK' : 'KAPALI'}
                            </span>
                          </div>

                          {/* Start Time */}
                          <div>
                            <input
                              type="time"
                              disabled={!day.isOpen}
                              value={day.baslangicSaati}
                              onChange={e => {
                                setWeeklyHours(prev =>
                                  prev.map(w =>
                                    w.haftaninGunu === day.haftaninGunu ? { ...w, baslangicSaati: e.target.value } : w
                                  )
                                );
                              }}
                              className={`${compactInputClass} text-center font-mono font-bold tracking-wider ${
                                !day.isOpen ? 'opacity-30 cursor-not-allowed bg-transparent border-white/5' : ''
                              }`}
                            />
                          </div>

                          {/* End Time */}
                          <div>
                            <input
                              type="time"
                              disabled={!day.isOpen}
                              value={day.bitisSaati}
                              onChange={e => {
                                setWeeklyHours(prev =>
                                  prev.map(w =>
                                    w.haftaninGunu === day.haftaninGunu ? { ...w, bitisSaati: e.target.value } : w
                                  )
                                );
                              }}
                              className={`${compactInputClass} text-center font-mono font-bold tracking-wider ${
                                !day.isOpen ? 'opacity-30 cursor-not-allowed bg-transparent border-white/5' : ''
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveRules}
                        className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3.5 text-sm font-black text-[#071018] transition hover:bg-cyan-200 shadow-lg shadow-cyan-300/10 cursor-pointer"
                      >
                        <CheckCircle2 className="h-4.5 w-4.5" />
                        Çalışma Saatlerini Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/35 font-semibold mt-4">
                    Çalışma saatlerini yapılandırmak için sol taraftan bir tesis seçmelisiniz.
                  </p>
                )}
              </section>
            </div>
          </div>
        </>
      ) : activeView === 'bookings' ? (
        /* Reservations & Blocking View */
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
              {allBookings.map((booking) => {
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
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base font-black">{booking.tesisAd}</span>
                        {booking.tesisAd !== booking.kaynakAd && (
                          <span className="text-xs font-semibold text-white/50">/ {booking.kaynakAd}</span>
                        )}
                        <BookingStatusBadge durum={booking.durum} />
                      </div>

                      <div className="grid gap-x-6 gap-y-1.5 grid-cols-2 md:grid-cols-3 text-xs text-white/50 pt-1 font-bold">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-cyan-300/60" /> 
                          {isBlocked ? 'Spor Müdürlüğü' : booking.rezervasyonYapanKullaniciId}
                        </span>
                        <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-cyan-300/60" /> {start.date}</span>
                        <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-cyan-300/60" /> {start.time} - {end.time}</span>
                        {booking.amac && (
                          <span className="col-span-2 md:col-span-3 flex items-center gap-1.5 mt-1 font-normal text-white/40">
                            <FileText className="h-3.5 w-3.5 shrink-0" /> 
                            {booking.amac}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions for Admin */}
                    {['ONAYLANDI', 'BEKLEMEDE', 'BLOKE'].includes(booking.durum) && (
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        {!isBlocked && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'TAMAMLANDI')}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition border border-emerald-500/20 cursor-pointer"
                            >
                              Kullanıldı
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'GELMEDI')}
                              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition border border-amber-500/20 cursor-pointer"
                            >
                              Gelmedi
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(booking.id, 'IPTAL_EDILDI')}
                          className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition border border-red-500/20 cursor-pointer"
                        >
                          {isBlocked ? 'Blokajı Kaldır' : 'İptal Et'}
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
              })}

              {allBookings.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/35 font-semibold">
                  Henüz kayıtlı bir rezervasyon veya antrenman bulunmuyor.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <CalendarView
          facilities={facilities}
          calendarFacilityId={calendarFacilityId}
          setCalendarFacilityId={setCalendarFacilityId}
          calendarWeekStart={calendarWeekStart}
          setCalendarWeekStart={setCalendarWeekStart}
          calendarResource={calendarResource}
          calendarBookings={calendarBookings}
          dynamicCalendarHoursList={dynamicCalendarHoursList}
          selectedBookingForModal={selectedBookingForModal}
          setSelectedBookingForModal={setSelectedBookingForModal}
          quickBlockModalOpen={quickBlockModalOpen}
          setQuickBlockModalOpen={setQuickBlockModalOpen}
          quickBlockDate={quickBlockDate}
          setQuickBlockDate={setQuickBlockDate}
          quickBlockStart={quickBlockStart}
          setQuickBlockStart={setQuickBlockStart}
          quickBlockEnd={quickBlockEnd}
          setQuickBlockEnd={setQuickBlockEnd}
          quickBlockPurpose={quickBlockPurpose}
          setQuickBlockPurpose={setQuickBlockPurpose}
          quickBlockRecurrence={quickBlockRecurrence}
          setQuickBlockRecurrence={setQuickBlockRecurrence}
          quickBlockRecurrenceCount={quickBlockRecurrenceCount}
          setQuickBlockRecurrenceCount={setQuickBlockRecurrenceCount}
          handleQuickAddBlockSlot={handleQuickAddBlockSlot}
          handleUpdateBookingStatus={handleUpdateBookingStatus}
          formatDateTime={formatDateTime}
          isBookingLoading={isBookingLoading}
        />
      )}
    </div>
  );
};

