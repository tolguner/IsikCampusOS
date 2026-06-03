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
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFacilityStore, type AvailabilityRule, type Facility, type FacilityPolicy, type FacilityResource } from '../store/facilityStore';
import { useBookingStore, type Booking } from '../store/bookingStore';

const panelStyle = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const inputClass = 'w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60 transition-all';
const compactInputClass = 'w-full rounded-xl bg-[#111123] border border-white/10 px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60 transition-all';

const facilityTypes = [
  { value: 'SPORTS_AREA', label: 'Spor Alanı / Salon' },
  { value: 'STUDY_ROOM', label: 'Etüt / Çalışma Alanı' },
  { value: 'MEETING_ROOM', label: 'Toplantı Odası' },
  { value: 'LAB', label: 'Laboratuvar' },
  { value: 'OTHER', label: 'Diğer' },
];

const dayLabels: Record<number, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar',
};

const blankFacilityForm = {
  name: '',
  facilityType: 'SPORTS_AREA',
  description: '',
  locationText: '',
  capacity: 10,
  status: 'ACTIVE' as Facility['status'],
};

const defaultPolicy: FacilityPolicy = {
  bookingWindowDays: 14,
  minNoticeMinutes: 120,
  cancellationDeadlineMinutes: 60,
  checkinRequired: true,
  autoNoShowMinutes: 15,
  maxBookingDurationMinutes: 120,
};

const blankRule: AvailabilityRule = {
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:00',
  status: 'ACTIVE',
};

interface WeeklyHourDay {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

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
  const [policyForm, setPolicyForm] = useState<FacilityPolicy>(defaultPolicy);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
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
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<Booking | null>(null);

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
      const resourceId = facility?.resources?.[0]?.id;
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
      const activeResources = facilities.flatMap(f => f.resources).filter(r => r.status === 'ACTIVE');
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
    () => selectedFacility?.resources.find(resource => resource.id === selectedResourceId) || null,
    [selectedFacility, selectedResourceId]
  );

  const calendarFacility = useMemo(() => {
    return facilities.find(f => f.id === calendarFacilityId) || null;
  }, [facilities, calendarFacilityId]);

  const calendarResource = useMemo(() => {
    return calendarFacility?.resources?.[0] || null;
  }, [calendarFacility]);

  const dynamicCalendarHoursList = useMemo(() => {
    if (!calendarResource || !calendarResource.availabilityRules || calendarResource.availabilityRules.length === 0) {
      return Array.from({ length: 15 }, (_, i) => 8 + i); // Default 08:00 to 22:00
    }
    const activeRules = calendarResource.availabilityRules.filter(r => r.status === 'ACTIVE');
    if (activeRules.length === 0) {
      return Array.from({ length: 15 }, (_, i) => 8 + i); // Default
    }
    
    let minHour = 24;
    let maxHour = 0;
    
    activeRules.forEach(r => {
      const startHour = parseInt(r.startTime.split(':')[0], 10);
      const endHour = parseInt(r.endTime.split(':')[0], 10);
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
      name: selectedFacility.name,
      facilityType: selectedFacility.facilityType,
      description: selectedFacility.description || '',
      locationText: selectedFacility.locationText || '',
      capacity: selectedFacility.capacity,
      status: selectedFacility.status,
    });
    setPolicyForm(selectedFacility.policy || defaultPolicy);
  }, [selectedFacility]);

  // Sync availability rules with selected resource
  useEffect(() => {
    if (!selectedResource) {
      setRules([]);
      setWeeklyHours([]);
      return;
    }
    const currentRules = selectedResource.availabilityRules || [];
    setRules(currentRules);

    const initialWeekly: WeeklyHourDay[] = [];
    for (let day = 1; day <= 7; day++) {
      const match = currentRules.find(r => r.dayOfWeek === day && r.status === 'ACTIVE');
      if (match) {
        initialWeekly.push({
          dayOfWeek: day,
          isOpen: true,
          startTime: match.startTime.substring(0, 5),
          endTime: match.endTime.substring(0, 5),
        });
      } else {
        initialWeekly.push({
          dayOfWeek: day,
          isOpen: false,
          startTime: '08:00',
          endTime: '22:00',
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
    if (window.confirm(`${selectedFacility.name} tesisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve ilişkili tüm rezervasyonlar iptal edilir.`)) {
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
    const rulesToSave: AvailabilityRule[] = weeklyHours
      .filter(w => w.isOpen)
      .map(w => ({
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime,
        endTime: w.endTime,
        status: 'ACTIVE',
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
        resourceId: blockResourceId,
        startAt: startIso,
        endAt: endIso,
        purpose: blockPurpose || 'Takım Antrenmanı',
        participantCount: 15,
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
        const resourceId = facility?.resources?.[0]?.id;
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
    const resourceId = facility?.resources?.[0]?.id;
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
        resourceId,
        startAt: startIso,
        endAt: endIso,
        purpose: quickBlockPurpose || 'Takım Antrenmanı',
        participantCount: 15,
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
      f.resources.filter(r => r.status === 'ACTIVE' && r.bookable).map((r) => ({
        id: r.id,
        name: f.name === r.name ? f.name : `${f.name} - ${r.name}`,
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
              const resourceId = facility?.resources?.[0]?.id;
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
                        <p className="text-sm font-black text-white">{facility.name}</p>
                        <p className="mt-1 text-xs font-semibold text-white/38">{facility.locationText || 'Konum girilmedi'}</p>
                      </div>
                      <StatusBadge status={facility.status} />
                    </div>
                    <div className="mt-3 flex gap-2 text-[11px] font-bold text-white/45">
                      <span>Kapasite: {facility.capacity}</span>
                      <span>{facility.resources.length} kaynak</span>
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
                  <input className={inputClass} placeholder="Tesis adı" value={facilityForm.name} onChange={e => setFacilityForm(prev => ({ ...prev, name: e.target.value }))} required />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select className={inputClass} value={facilityForm.facilityType} onChange={e => setFacilityForm(prev => ({ ...prev, facilityType: e.target.value }))}>
                      {facilityTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                    <input className={inputClass} type="number" min={1} value={facilityForm.capacity} onChange={e => setFacilityForm(prev => ({ ...prev, capacity: Number(e.target.value) }))} required />
                  </div>
                  <input className={inputClass} placeholder="Konum" value={facilityForm.locationText} onChange={e => setFacilityForm(prev => ({ ...prev, locationText: e.target.value }))} />
                  <textarea className={`${inputClass} min-h-28 resize-none`} placeholder="Açıklama" value={facilityForm.description} onChange={e => setFacilityForm(prev => ({ ...prev, description: e.target.value }))} />
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
                    <NumberField label="İleri rezervasyon günü" value={policyForm.bookingWindowDays} onChange={value => setPolicyForm(prev => ({ ...prev, bookingWindowDays: value }))} />
                    <NumberField label="Minimum ön süre (dk)" value={policyForm.minNoticeMinutes} onChange={value => setPolicyForm(prev => ({ ...prev, minNoticeMinutes: value }))} />
                    <NumberField label="İptal son süre (dk)" value={policyForm.cancellationDeadlineMinutes} onChange={value => setPolicyForm(prev => ({ ...prev, cancellationDeadlineMinutes: value }))} />
                    <NumberField label="Maks. rezervasyon (dk)" value={policyForm.maxBookingDurationMinutes} onChange={value => setPolicyForm(prev => ({ ...prev, maxBookingDurationMinutes: value }))} />
                    <NumberField label="No-show toleransı (dk)" value={policyForm.autoNoShowMinutes} onChange={value => setPolicyForm(prev => ({ ...prev, autoNoShowMinutes: value }))} />
                    <label className="flex min-h-[62px] items-center gap-3 rounded-2xl border border-white/10 bg-[#111123] px-4 py-3 text-sm font-bold text-white/70 font-sans cursor-pointer">
                      <input type="checkbox" checked={policyForm.checkinRequired} onChange={e => setPolicyForm(prev => ({ ...prev, checkinRequired: e.target.checked }))} />
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
                <SectionTitle icon={Clock3} title="Tesis Çalışma Saatleri" subtitle={selectedFacility ? `${selectedFacility.name} için haftalık çalışma saatlerini ve kapalı günleri belirleyin` : 'Önce sol taraftan bir tesis seçin.'} />
                
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
                          key={day.dayOfWeek}
                          className={`grid grid-cols-1 sm:grid-cols-[160px_140px_1fr_1fr] items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                            day.isOpen
                              ? 'bg-white/[0.02] border-white/10'
                              : 'bg-red-500/[0.01] border-red-500/10 opacity-70'
                          }`}
                        >
                          {/* Day Label */}
                          <span className="text-sm font-black text-white">{dayLabels[day.dayOfWeek]}</span>

                          {/* Toggle Switch */}
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => {
                                setWeeklyHours(prev =>
                                  prev.map(w =>
                                    w.dayOfWeek === day.dayOfWeek ? { ...w, isOpen: !w.isOpen } : w
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
                              value={day.startTime}
                              onChange={e => {
                                setWeeklyHours(prev =>
                                  prev.map(w =>
                                    w.dayOfWeek === day.dayOfWeek ? { ...w, startTime: e.target.value } : w
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
                              value={day.endTime}
                              onChange={e => {
                                setWeeklyHours(prev =>
                                  prev.map(w =>
                                    w.dayOfWeek === day.dayOfWeek ? { ...w, endTime: e.target.value } : w
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
                      {res.name}
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
                const start = formatDateTime(booking.startAt);
                const end = formatDateTime(booking.endAt);
                const isBlocked = booking.status === 'BLOCKED';
                
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
                        <span className="text-base font-black">{booking.facilityName}</span>
                        {booking.facilityName !== booking.resourceName && (
                          <span className="text-xs font-semibold text-white/50">/ {booking.resourceName}</span>
                        )}
                        <BookingStatusBadge status={booking.status} />
                      </div>

                      <div className="grid gap-x-6 gap-y-1.5 grid-cols-2 md:grid-cols-3 text-xs text-white/50 pt-1 font-bold">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-cyan-300/60" /> 
                          {isBlocked ? 'Spor Müdürlüğü' : booking.bookedByUserId}
                        </span>
                        <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-cyan-300/60" /> {start.date}</span>
                        <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-cyan-300/60" /> {start.time} - {end.time}</span>
                        {booking.purpose && (
                          <span className="col-span-2 md:col-span-3 flex items-center gap-1.5 mt-1 font-normal text-white/40">
                            <FileText className="h-3.5 w-3.5 shrink-0" /> 
                            {booking.purpose}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions for Admin */}
                    {['CONFIRMED', 'PENDING', 'BLOCKED'].includes(booking.status) && (
                      <div className="flex gap-2 self-start sm:self-center shrink-0">
                        {!isBlocked && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'COMPLETED')}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition border border-emerald-500/20 cursor-pointer"
                            >
                              Kullanıldı
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'NO_SHOW')}
                              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition border border-amber-500/20 cursor-pointer"
                            >
                              Gelmedi
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                          className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition border border-red-500/20 cursor-pointer"
                        >
                          {isBlocked ? 'Blokajı Kaldır' : 'İptal Et'}
                        </button>
                      </div>
                    )}

                    {booking.status === 'CANCELLED' && booking.cancelReason && (
                      <span className="text-xs font-semibold text-red-200/50 bg-red-500/5 px-3 py-1.5 rounded-lg border border-red-500/10 shrink-0 self-start sm:self-center">
                        İptal: {booking.cancelReason}
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
        /* Calendar View rendering block */
        (() => {
          const calendarWeekDays: Date[] = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(calendarWeekStart);
            d.setDate(d.getDate() + i);
            calendarWeekDays.push(d);
          }
          const calendarHoursList = dynamicCalendarHoursList;

          const isDayClosed = (day: Date) => {
            if (!calendarResource || !calendarResource.availabilityRules) return false;
            let dayNum = day.getDay();
            if (dayNum === 0) dayNum = 7;
            const hasActiveRule = calendarResource.availabilityRules.some(
              r => r.dayOfWeek === dayNum && r.status === 'ACTIVE'
            );
            return !hasActiveRule;
          };

          const getCalendarBookingForSlot = (day: Date, hour: number) => {
            const slotStart = new Date(day);
            slotStart.setHours(hour, 0, 0, 0);
            const slotEnd = new Date(day);
            slotEnd.setHours(hour + 1, 0, 0, 0);

            return calendarBookings.find((b) => {
              const bStart = new Date(b.startAt);
              const bEnd = new Date(b.endAt);
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
                          {fac.name}
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
                              const isBlocked = booking.status === 'BLOCKED';
                              const isCompleted = booking.status === 'COMPLETED';
                              const isNoShow = booking.status === 'NO_SHOW';
                              const isCancelled = booking.status === 'CANCELLED';

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
                                  title={`${booking.purpose || 'Rezervasyon'} (${booking.bookedByUserId})`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-1 w-full">
                                    <span className="text-[10px] font-black tracking-wide truncate max-w-[80px]">
                                      {isBlocked ? 'SPOR MÜDÜRÜ' : booking.bookedByUserId}
                                    </span>
                                    {isBlocked && <Lock className="h-3 w-3 shrink-0 opacity-60" />}
                                  </div>
                                  <span className="text-[9px] font-bold opacity-60 mt-1 truncate block w-full">
                                    {booking.purpose || 'Serbest Çalışma'}
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
                        <span className="font-black text-white">{selectedBookingForModal.facilityName}</span>
                      </div>
                      <div className="py-2.5 flex justify-between gap-3">
                        <span className="text-white/40">Kullanıcı / Görevli:</span>
                        <span className="font-black text-white">{selectedBookingForModal.status === 'BLOCKED' ? 'Spor Müdürlüğü (Bloke)' : selectedBookingForModal.bookedByUserId}</span>
                      </div>
                      <div className="py-2.5 flex justify-between gap-3">
                        <span className="text-white/40">Tarih:</span>
                        <span className="font-black text-cyan-300">{formatDateTime(selectedBookingForModal.startAt).date}</span>
                      </div>
                      <div className="py-2.5 flex justify-between gap-3">
                        <span className="text-white/40">Saat:</span>
                        <span className="font-black text-cyan-300">{formatDateTime(selectedBookingForModal.startAt).time} - {formatDateTime(selectedBookingForModal.endAt).time}</span>
                      </div>
                      <div className="py-2.5 flex justify-between gap-3">
                        <span className="text-white/40">Açıklama / Amaç:</span>
                        <span className="text-white/70">{selectedBookingForModal.purpose || 'Girilmedi'}</span>
                      </div>
                      <div className="py-2.5 flex justify-between gap-3">
                        <span className="text-white/40">Katılımcı Sayısı:</span>
                        <span className="font-black text-white">{selectedBookingForModal.participantCount} kişi</span>
                      </div>
                      <div className="py-2.5 flex justify-between gap-3 items-center">
                        <span className="text-white/40">Durum:</span>
                        <BookingStatusBadge status={selectedBookingForModal.status} />
                      </div>
                      {selectedBookingForModal.checkin && (
                        <div className="py-2.5 flex justify-between gap-3 items-center">
                          <span className="text-white/40">Giriş (Check-in):</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Doğrulandı ({new Date(selectedBookingForModal.checkin.checkedInAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions inside Modal */}
                    <div className="pt-2 flex flex-wrap gap-2.5 justify-end">
                      {selectedBookingForModal.status !== 'BLOCKED' && ['PENDING', 'CONFIRMED'].includes(selectedBookingForModal.status) && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(selectedBookingForModal.id, 'COMPLETED')}
                            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition border border-emerald-500/20 cursor-pointer"
                          >
                            Kullanıldı
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingStatus(selectedBookingForModal.id, 'NO_SHOW')}
                            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition border border-amber-500/20 cursor-pointer"
                          >
                            Gelmedi
                          </button>
                        </>
                      )}
                      {['PENDING', 'CONFIRMED', 'BLOCKED'].includes(selectedBookingForModal.status) && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(selectedBookingForModal.id, 'CANCELLED')}
                          className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition border border-red-500/20 cursor-pointer"
                        >
                          {selectedBookingForModal.status === 'BLOCKED' ? 'Blokajı Kaldır' : 'İptal Et'}
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
        })()
      )}
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3">
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-white/38">{subtitle}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: Facility['status'] | FacilityResource['status'] }) => {
  const active = status === 'ACTIVE';
  return (
    <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black bg-emerald-400/15 text-emerald-100">
      {active ? 'Aktif' : 'Pasif'}
    </span>
  );
};

const BookingStatusBadge = ({ status }: { status: Booking['status'] }) => {
  const colors: Record<Booking['status'], string> = {
    DRAFT: 'bg-white/5 text-white/50 border border-white/10',
    PENDING: 'bg-amber-400/10 text-amber-200 border border-amber-400/20',
    CONFIRMED: 'bg-cyan-400/10 text-cyan-200 border border-cyan-400/20',
    CANCELLED: 'bg-red-500/10 text-red-200 border border-red-500/20',
    COMPLETED: 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20',
    NO_SHOW: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    BLOCKED: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
  };

  const labels: Record<Booking['status'], string> = {
    DRAFT: 'Taslak',
    PENDING: 'Onay Bekliyor',
    CONFIRMED: 'Onaylandı',
    CANCELLED: 'İptal Edildi',
    COMPLETED: 'Kullanıldı',
    NO_SHOW: 'Gelmedi',
    BLOCKED: 'Takım Antrenmanı',
  };

  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};

const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <label className="block font-sans">
    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">{label}</span>
    <input className="w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60 transition-all" type="number" min={0} value={value} onChange={event => onChange(Number(event.target.value))} />
  </label>
);
