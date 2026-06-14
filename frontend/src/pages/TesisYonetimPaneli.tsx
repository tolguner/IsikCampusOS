import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Settings2, ClipboardList, CalendarDays } from 'lucide-react';
import { ModulSekmeleri } from '../components/yonetim/ModulSekmeleri';
import { useTesisDeposu, type TamTesisFormu } from '../depolar/tesisDeposu';
import { useRezervasyonDeposu, type Rezervasyon } from '../depolar/rezervasyonDeposu';

import {
  blankFacilityForm,
  defaultPolicyForm,
  type WeeklyHourDay,
  type PolitikaFormState,
} from '../components/tesis-yonetim/ortak';
import { TakvimGorunumu } from '../components/tesis-yonetim/TakvimGorunumu';
import { RezervasyonGorunumu } from '../components/tesis-yonetim/RezervasyonGorunumu';
import { YapilandirmaGorunumu } from '../components/tesis-yonetim/YapilandirmaGorunumu';
import { DuyuruButonu } from '../components/DuyuruButonu';

export const TesisYonetimPaneli = () => {
  const {
    facilities,
    selectedFacilityId,
    selectedResourceId,
    isLoading: isFacilityLoading,
    error: facilityError,
    successMessage: facilitySuccess,
    fetchFacilities,
    selectFacility,
    tesisTamOlustur,
    tesisTamGuncelle,
    deleteFacility,
  } = useTesisDeposu();

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
  } = useRezervasyonDeposu();

  const [activeView, setActiveView] = useState<'config' | 'bookings' | 'calendar'>('config');

  // Config Forms
  const [facilityForm, setFacilityForm] = useState(blankFacilityForm);
  const [policyForm, setPolicyForm] = useState<PolitikaFormState>(defaultPolicyForm);
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
      setPolicyForm(defaultPolicyForm);
      return;
    }
    setFacilityForm({
      ad: selectedFacility.ad,
      aciklama: selectedFacility.aciklama || '',
      konumMetni: selectedFacility.konumMetni || '',
      enlem: selectedFacility.enlem ?? blankFacilityForm.enlem,
      boylam: selectedFacility.boylam ?? blankFacilityForm.boylam,
      kapasite: selectedFacility.kapasite,
      durum: selectedFacility.durum,
    });
    const p = selectedFacility.politika;
    setPolicyForm(p ? {
      rezervasyonPenceresiGun: p.rezervasyonPenceresiGun,
      maksimumRezervasyonSureSaat: Math.max(1, Math.round(p.maksimumRezervasyonSureDakika / 60)),
      iptalLimitSaat: Math.round(p.iptalLimitDakika / 60),
      onayGerekli: p.onayGerekli,
    } : defaultPolicyForm);
  }, [selectedFacility]);

  // Sync availability rules with selected (gizli) resource
  useEffect(() => {
    if (!selectedResource) {
      // Yeni tesis: 7 gün varsayılan açık şablon (kullanıcı kapatabilir)
      setWeeklyHours(Array.from({ length: 7 }, (_, i) => ({
        haftaninGunu: i + 1,
        isOpen: true,
        baslangicSaati: '08:00',
        bitisSaati: '22:00',
      })));
      return;
    }
    const currentRules = selectedResource.kullanimKurallari || [];

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

  const resetFacilityForm = () => {
    setFacilityForm(blankFacilityForm);
    setPolicyForm(defaultPolicyForm);
    setWeeklyHours([]);
  };

  // Tek-buton kaydet: tanım + politika + çalışma saatleri birlikte (atomik).
  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const calismaSaatleri = weeklyHours
      .filter(w => w.isOpen)
      .map(w => ({ haftaninGunu: w.haftaninGunu, baslangicSaati: w.baslangicSaati, bitisSaati: w.bitisSaati }));
    if (calismaSaatleri.length === 0) {
      window.alert('En az bir gün için çalışma saati tanımlamalısınız.');
      return;
    }
    const hataliGun = calismaSaatleri.find(s => s.baslangicSaati >= s.bitisSaati);
    if (hataliGun) {
      window.alert('Çalışma saatlerinde başlangıç saati bitiş saatinden önce olmalıdır.');
      return;
    }
    const payload: TamTesisFormu = {
      ad: facilityForm.ad,
      kapasite: facilityForm.kapasite,
      aciklama: facilityForm.aciklama,
      konumMetni: facilityForm.konumMetni,
      enlem: facilityForm.enlem,
      boylam: facilityForm.boylam,
      durum: facilityForm.durum,
      rezervasyonPenceresiGun: policyForm.rezervasyonPenceresiGun,
      maksimumRezervasyonSureSaat: policyForm.maksimumRezervasyonSureSaat,
      iptalLimitSaat: policyForm.iptalLimitSaat,
      onayGerekli: policyForm.onayGerekli,
      calismaSaatleri,
    };
    if (selectedFacility) {
      await tesisTamGuncelle(selectedFacility.id, payload);
    } else {
      const ok = await tesisTamOlustur(payload);
      if (ok) resetFacilityForm();
    }
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

  const handleAddBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockResourceId) return;
    if (blockStart >= blockEnd) {
      window.alert('Başlangıç saati bitiş saatinden önce olmalıdır.');
      return;
    }

    const localTimeZoneOffset = () => {
      const offset = new Date().getTimezoneOffset();
      const absOffset = Math.abs(offset);
      const hours = Math.floor(absOffset / 60).toString().padStart(2, '0');
      const mins = (absOffset % 60).toString().padStart(2, '0');
      return (offset <= 0 ? '+' : '-') + hours + ':' + mins;
    };

    const offset = localTimeZoneOffset();
    const grupId = recurrence !== 'NONE' ? crypto.randomUUID() : undefined;
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
        tekrarGrupId: grupId,
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
    if (quickBlockStart >= quickBlockEnd) {
      window.alert('Başlangıç saati bitiş saatinden önce olmalıdır.');
      return;
    }

    const localTimeZoneOffset = () => {
      const offset = new Date().getTimezoneOffset();
      const absOffset = Math.abs(offset);
      const hours = Math.floor(absOffset / 60).toString().padStart(2, '0');
      const mins = (absOffset % 60).toString().padStart(2, '0');
      return (offset <= 0 ? '+' : '-') + hours + ':' + mins;
    };

    const offset = localTimeZoneOffset();
    const grupId = quickBlockRecurrence !== 'NONE' ? crypto.randomUUID() : undefined;
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
        tekrarGrupId: grupId,
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
    // "Kaynak" UX'te yok; her tesisin tek (gizli) kaynağı için yalnız tesis adı gösterilir.
    return facilities.flatMap((f) =>
      f.kaynaklar.filter(r => r.durum === 'AKTIF' && r.rezervasyonYapilabilir).map((r) => ({
        id: r.id,
        ad: f.ad,
      }))
    );
  }, [facilities]);

  return (
    <div className="space-y-6 text-white pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-normal text-white">Spor Müdürlüğü</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/45 lg:whitespace-nowrap">
            Işık Üniversitesi Spor Tesislerini, kurallarını yönetin ve takım antrenman programlarını bloke slotlar olarak tanımlayın.
          </p>
        </div>
        <div className="flex items-center gap-3">
        <DuyuruButonu />
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
      </div>

      {/* Modül sekmeleri */}
      <ModulSekmeleri
        aktif={activeView}
        onSecim={setActiveView}
        sekmeler={[
          { anahtar: 'config', baslik: 'Tesis Yapılandırması', aciklama: 'Tesis tanımı, kuralları ve çalışma saatleri', ikon: Settings2 },
          { anahtar: 'bookings', baslik: `Antrenman & Rezervasyon (${allBookings.length})`, aciklama: 'Antrenman ve rezervasyon talep yönetimi', ikon: ClipboardList },
          { anahtar: 'calendar', baslik: 'Genel Rezervasyon Takvimi', aciklama: 'Tüm rezervasyonların takvim görünümü', ikon: CalendarDays },
        ]}
      />

      {(error || successMessage) && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? 'border border-red-400/25 bg-red-500/12 text-red-100' : 'border border-emerald-300/25 bg-emerald-500/12 text-emerald-100'}`}>
          {error || successMessage}
        </div>
      )}

      {activeView === 'config' ? (
        <YapilandirmaGorunumu
          facilities={facilities}
          selectedFacilityId={selectedFacilityId}
          selectFacility={selectFacility}
          resetForm={resetFacilityForm}
          selectedFacility={selectedFacility}
          facilityForm={facilityForm}
          setFacilityForm={setFacilityForm}
          policyForm={policyForm}
          setPolicyForm={setPolicyForm}
          weeklyHours={weeklyHours}
          setWeeklyHours={setWeeklyHours}
          handleSave={handleSave}
          handleDeleteFacility={handleDeleteFacility}
          isLoading={isFacilityLoading}
        />
      ) : activeView === 'bookings' ? (
        <RezervasyonGorunumu
          handleAddBlockSlot={handleAddBlockSlot}
          blockResourceId={blockResourceId}
          setBlockResourceId={setBlockResourceId}
          flatResources={flatResources}
          blockDate={blockDate}
          setBlockDate={setBlockDate}
          recurrence={recurrence}
          setRecurrence={setRecurrence}
          recurrenceCount={recurrenceCount}
          setRecurrenceCount={setRecurrenceCount}
          blockStart={blockStart}
          setBlockStart={setBlockStart}
          blockEnd={blockEnd}
          setBlockEnd={setBlockEnd}
          blockPurpose={blockPurpose}
          setBlockPurpose={setBlockPurpose}
          isBookingLoading={isBookingLoading}
          allBookings={allBookings}
          formatDateTime={formatDateTime}
          handleUpdateBookingStatus={handleUpdateBookingStatus}
        />
      ) : (
        <TakvimGorunumu
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

