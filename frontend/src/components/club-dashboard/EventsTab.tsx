import { useState, useMemo, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FilePenLine,
  Link as LinkIcon,
  MapPin,
  ImagePlus,
  UsersRound,
  XCircle,
  QrCode,
} from 'lucide-react';
import type { Kulup } from '../../store/clubStore';
import { useEventStore, type Event } from '../../store/eventStore';
import { YOLLAR } from '../../utils/paths';
import {
  inputClass,
  textareaClass,
  emptyEventForm,
  reminderOptions,
  statusClass,
  statusLabel,
  isPastEvent,
  isCheckInWindowOpen,
  a3PosterFile,
  parseReminderOffsets,
} from './constants';
import { LocationPicker } from './LocationPicker';

interface EventsTabProps {
  selectedClub: Kulup;
}

const pad = (value: number) => value.toString().padStart(2, '0');

const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toLocalDateTimeValue = (date: Date) =>
  `${toDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const formatDateTimePreview = (value: string) => {
  if (!value) return 'Tarih ve saat seçilmedi';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

interface DateTimePickerProps {
  label: string;
  value: string;
  min?: string;
  defaultTime: string;
  onChange: (value: string) => void;
}

const DateTimePicker = ({ label, value, min, defaultTime, onChange }: DateTimePickerProps) => {
  const selectedDate = value ? new Date(value) : null;
  const minDate = min ? new Date(min) : null;
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const base = selectedDate || minDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [value]);

  const selectedDateValue = selectedDate ? toDateInputValue(selectedDate) : '';
  const selectedTimeValue = value ? value.slice(11, 16) : defaultTime;
  const minDateValue = minDate ? toDateInputValue(minDate) : '';
  const firstDayOffset = (visibleMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const selectDate = (day: number) => {
    const dateValue = `${visibleMonth.getFullYear()}-${pad(visibleMonth.getMonth() + 1)}-${pad(day)}`;
    onChange(`${dateValue}T${selectedTimeValue || defaultTime}`);
  };

  const selectTime = (time: string) => {
    const dateValue = selectedDateValue || minDateValue || toDateInputValue(new Date());
    onChange(`${dateValue}T${time}`);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black text-white">
          <CalendarDays className="w-4 h-4 text-indigo-200" />
          {label}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/55">
          {formatDateTimePreview(value)}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0c0c1c] p-3">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setVisibleMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] text-white/65 hover:text-white hover:bg-white/[0.08] flex items-center justify-center"
            aria-label="Önceki ay"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-black text-white">
            {visibleMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </div>
          <button
            type="button"
            onClick={() => setVisibleMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] text-white/65 hover:text-white hover:bg-white/[0.08] flex items-center justify-center"
            aria-label="Sonraki ay"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-white/35 mb-1">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => <span key={day}>{day}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, index) => {
            if (!day) return <span key={`empty-${index}`} className="aspect-square" />;
            const dateValue = `${visibleMonth.getFullYear()}-${pad(visibleMonth.getMonth() + 1)}-${pad(day)}`;
            const disabled = Boolean(minDateValue && dateValue < minDateValue);
            const selected = dateValue === selectedDateValue;
            return (
              <button
                key={dateValue}
                type="button"
                disabled={disabled}
                onClick={() => selectDate(day)}
                className={`aspect-square rounded-xl text-sm font-black transition-colors ${
                  selected
                    ? 'bg-purple-500 text-white shadow-[0_0_18px_rgba(168,85,247,0.35)]'
                    : disabled
                      ? 'text-white/15 cursor-not-allowed'
                      : 'text-white/65 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
        <Clock className="w-4 h-4 text-cyan-200" />
        <span className="text-xs font-black uppercase text-white/35">Saat</span>
        <input
          type="time"
          value={selectedTimeValue}
          onChange={event => selectTime(event.target.value)}
          className="ml-auto rounded-xl border border-white/10 bg-[#111123] px-3 py-2 text-sm font-bold text-white outline-none focus:border-purple-400/60"
        />
      </label>
    </section>
  );
};

export const EventsTab = ({ selectedClub }: EventsTabProps) => {
  const {
    managedEvents,
    isLoading: eventsLoading,
    createEventDraft,
    updateEvent,
    submitForApproval,
    cancelEvent,
  } = useEventStore();

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [formError, setFormError] = useState('');

  const currentDateTimeValue = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return toLocalDateTimeValue(now);
  };

  useEffect(() => {
    setEventForm((prev) => ({ ...prev, clubId: selectedClub.id }));
  }, [selectedClub.id]);

  const selectedClubEvents = useMemo(
    () => managedEvents.filter((event) => event.club?.id === selectedClub?.id),
    [managedEvents, selectedClub?.id]
  );

  const toEventPayload = () => {
    return {
      ...eventForm,
      clubId: selectedClub.id,
      location: eventForm.eventMode === 'IN_PERSON' ? eventForm.locationName : eventForm.onlineMeetingUrl,
      hasCapacityLimit: eventForm.hasCapacityLimit,
      capacityLimited: eventForm.hasCapacityLimit,
      hasWaitlistLimit: false,
      waitlistCapacity: 0,
      capacity: Number(eventForm.capacity || 0),
      feeAmount: eventForm.paid ? Number(eventForm.feeAmount || 0) : 0,
      iban: eventForm.paid ? eventForm.iban : '',
      paymentInstructions: eventForm.paid ? eventForm.paymentInstructions : '',
      certificateTitle: eventForm.certificateEnabled ? eventForm.certificateTitle : '',
      reminderEnabled: eventForm.reminderEnabled,
      reminderOffsetsMinutes: eventForm.reminderEnabled ? eventForm.reminderOffsetsMinutes : [],
    };
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setFormError('');
    setEventForm({ ...emptyEventForm, clubId: selectedClub.id });
  };

  const startEditingEvent = (event: Event) => {
    if (isPastEvent(event)) return;
    setEditingEventId(event.id);
    setEventForm({
      clubId: event.club?.id || selectedClub?.id || '',
      title: event.title || '',
      description: event.description || '',
      startTime: event.startTime ? event.startTime.slice(0, 16) : '',
      endTime: event.endTime ? event.endTime.slice(0, 16) : '',
      location: event.location || '',
      eventMode: event.eventMode || 'IN_PERSON',
      onlinePlatform: event.onlinePlatform || 'Google Meet',
      onlineMeetingUrl: event.onlineMeetingUrl || '',
      locationName: event.locationName || event.location || '',
      locationDetail: event.locationDetail || '',
      latitude: event.latitude || emptyEventForm.latitude,
      longitude: event.longitude || emptyEventForm.longitude,
      posterImageUrl: event.posterImageUrl || '',
      hasCapacityLimit: Boolean(event.hasCapacityLimit || event.capacityLimited),
      capacity: event.capacity || 0,
      hasWaitlistLimit: false,
      waitlistCapacity: 0,
      qrCheckInEnabled: event.qrCheckInEnabled,
      certificateEnabled: event.certificateEnabled,
      certificateTitle: event.certificateTitle || '',
      paid: Boolean(event.paid),
      feeAmount: event.feeAmount || 0,
      iban: event.iban || '',
      paymentInstructions: event.paymentInstructions || '',
      reminderEnabled: Boolean(event.reminderEnabled),
      reminderOffsetsMinutes: parseReminderOffsets(event.reminderOffsetsMinutes as any),
    });
  };

  const toggleReminderOffset = (value: number) => {
    setEventForm((prev) => {
      const exists = prev.reminderOffsetsMinutes.includes(value);
      const reminderOffsetsMinutes = exists
        ? prev.reminderOffsetsMinutes.filter((item) => item !== value)
        : [...prev.reminderOffsetsMinutes, value].sort((a, b) => b - a);
      return {
        ...prev,
        reminderOffsetsMinutes,
        reminderEnabled: reminderOffsetsMinutes.length > 0 ? true : prev.reminderEnabled,
      };
    });
  };

  const submitEventDraft = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const currentEvent = editingEventId ? managedEvents.find((item) => item.id === editingEventId) : null;
    if (editingEventId) {
      if (currentEvent && isPastEvent(currentEvent)) return;
    }

    const payload = toEventPayload();
    if (!payload) return;
    const startDate = payload.startTime ? new Date(payload.startTime) : null;
    const endDate = payload.endTime ? new Date(payload.endTime) : null;
    const now = new Date();
    now.setSeconds(0, 0);
    if (!startDate || !endDate) {
      setFormError('Başlangıç ve bitiş tarihi zorunludur.');
      return;
    }
    if (startDate < now) {
      setFormError('Etkinlik başlangıç tarihi geçmişte olamaz.');
      return;
    }
    if (endDate <= startDate) {
      setFormError('Etkinlik bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
      return;
    }
    if (payload.eventMode === 'ONLINE') {
      try {
        const url = new URL(payload.onlineMeetingUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          setFormError('Online etkinlik bağlantısı http:// veya https:// ile başlamalıdır.');
          return;
        }
      } catch {
        setFormError('Geçerli bir online etkinlik bağlantısı gir.');
        return;
      }
    }

    let ok = false;
    if (editingEventId) {
      ok = await updateEvent(editingEventId, payload);
      if (ok && currentEvent && ['DRAFT', 'REVISION_REQUESTED'].includes(currentEvent.status)) {
        ok = await submitForApproval(editingEventId);
      }
    } else {
      const createdEvent = await createEventDraft(payload);
      ok = createdEvent ? await submitForApproval(createdEvent.id) : false;
    }
    if (ok) {
      resetEventForm();
    }
  };

  const handlePosterSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormError('');
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setFormError('Etkinlik afişi yalnızca PNG veya JPG olabilir.');
      e.target.value = '';
      return;
    }
    try {
      const posterImageUrl = await a3PosterFile(file);
      setEventForm((prev) => ({ ...prev, posterImageUrl }));
    } catch {
      setFormError('Afiş görseli okunamadı. PNG veya JPG bir dosya seç.');
      e.target.value = '';
    }
  };

  const submitEventCancel = async (eventId: string) => {
    const ok = await cancelEvent(eventId, cancelReason);
    if (ok) {
      setCancellingEventId(null);
      setCancelReason('');
    }
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-5">
      <form onSubmit={submitEventDraft} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-white">{editingEventId ? 'Etkinlik Düzenleme' : 'Etkinlik Talebi'}</h2>
            <p className="text-sm text-white/40 mt-1">
              {editingEventId
                ? 'SKS geri bildirimine göre etkinliği güncelle; uygunsa otomatik olarak tekrar onaya gönderilir.'
                : 'Kaydettiğinde etkinlik doğrudan SKS onay kuyruğuna gönderilir.'}
            </p>
          </div>
          {editingEventId && (
            <button
              type="button"
              onClick={resetEventForm}
              className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white/70 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10"
            >
              Vazgeç
            </button>
          )}
        </div>
        <input value={eventForm.title} onChange={e => setEventForm(prev => ({ ...prev, title: e.target.value }))} className={inputClass} placeholder="Etkinlik başlığı" />
        <textarea value={eventForm.description} onChange={e => setEventForm(prev => ({ ...prev, description: e.target.value }))} className={textareaClass} placeholder="Etkinlik açıklaması" />
        {formError && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <DateTimePicker
            label="Başlangıç tarihi"
            value={eventForm.startTime}
            min={currentDateTimeValue()}
            defaultTime="12:00"
            onChange={value => setEventForm(prev => ({ ...prev, startTime: value }))}
          />
          <DateTimePicker
            label="Bitiş tarihi"
            value={eventForm.endTime}
            min={eventForm.startTime || currentDateTimeValue()}
            defaultTime="13:00"
            onChange={value => setEventForm(prev => ({ ...prev, endTime: value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-3xl border border-white/10 bg-white/[0.025] p-2">
          <button type="button" onClick={() => setEventForm(prev => ({ ...prev, eventMode: 'IN_PERSON' }))} className={`rounded-2xl px-4 py-3 text-sm font-black transition-colors ${eventForm.eventMode === 'IN_PERSON' ? 'bg-purple-500/25 text-white' : 'text-white/45 hover:text-white'}`}>
            Yüz yüze
          </button>
          <button type="button" onClick={() => setEventForm(prev => ({ ...prev, eventMode: 'ONLINE' }))} className={`rounded-2xl px-4 py-3 text-sm font-black transition-colors ${eventForm.eventMode === 'ONLINE' ? 'bg-purple-500/25 text-white' : 'text-white/45 hover:text-white'}`}>
            Online
          </button>
        </div>

        {eventForm.eventMode === 'ONLINE' ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <LinkIcon className="w-4 h-4 text-cyan-200" />
              Online etkinlik bilgileri
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <select value={eventForm.onlinePlatform} onChange={e => setEventForm(prev => ({ ...prev, onlinePlatform: e.target.value }))} className={inputClass}>
                <option>Google Meet</option>
                <option>Zoom</option>
                <option>Microsoft Teams</option>
                <option>Diğer</option>
              </select>
              <input type="url" value={eventForm.onlineMeetingUrl} onChange={e => setEventForm(prev => ({ ...prev, onlineMeetingUrl: e.target.value }))} className={inputClass} placeholder="Toplantı linki" />
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <MapPin className="w-4 h-4 text-emerald-200" />
              Yüz yüze konum
            </div>
            <LocationPicker
              latitude={eventForm.latitude}
              longitude={eventForm.longitude}
              onChange={(latitude, longitude) => setEventForm(prev => ({ ...prev, latitude, longitude }))}
              onLocationSelect={(name) => setEventForm(prev => ({ ...prev, locationName: name }))}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <input value={eventForm.locationName} onChange={e => setEventForm(prev => ({ ...prev, locationName: e.target.value }))} className={inputClass} placeholder="Konum adı / bina / salon" />
              <input value={`${eventForm.latitude}, ${eventForm.longitude}`} readOnly className={`${inputClass} text-white/45`} />
            </div>
            <textarea value={eventForm.locationDetail} onChange={e => setEventForm(prev => ({ ...prev, locationDetail: e.target.value }))} className={textareaClass} placeholder="Konum detayı, giriş tarifi, kampüs içi yönlendirme" />
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <ImagePlus className="w-4 h-4 text-purple-200" />
            Etkinlik afişi
          </div>
          <p className="text-xs text-white/40">Yüklenen PNG/JPG görsel A3 portre oranına göre kaydedilir.</p>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handlePosterSelect}
            className="block w-full text-sm text-white/65 file:mr-4 file:rounded-xl file:border-0 file:bg-purple-500/20 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-purple-100 hover:file:bg-purple-500/30"
          />
          {eventForm.posterImageUrl && (
            <div className="w-full max-w-xs aspect-[297/420] rounded-2xl overflow-hidden border border-white/10 bg-white/[0.025]">
              <img src={eventForm.posterImageUrl} alt="Etkinlik afişi" className="w-full h-full object-cover" />
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <label className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm font-semibold text-white/70 flex flex-col gap-2">
            <div className="flex items-center">
              <input type="checkbox" checked={eventForm.hasCapacityLimit} onChange={e => setEventForm(prev => ({ ...prev, hasCapacityLimit: e.target.checked }))} className="mr-2" />
              Sınırlı kontenjan
            </div>
            {eventForm.hasCapacityLimit && (
              <div className="flex items-center gap-1 bg-[#0c0c1c] border border-white/10 rounded-xl p-1 w-full max-w-[200px] mt-1">
                <button
                  type="button"
                  onClick={() => setEventForm(prev => ({ ...prev, capacity: Math.max(1, (prev.capacity || 0) - 1) }))}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] text-white hover:bg-white/[0.08] active:scale-95 transition-all font-extrabold flex items-center justify-center text-base select-none cursor-pointer"
                >
                  −
                </button>
                <input
                  type="number"
                  value={eventForm.capacity || ''}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : Math.max(1, Number(e.target.value));
                    setEventForm(prev => ({ ...prev, capacity: val as any }));
                  }}
                  onBlur={() => {
                    if (!eventForm.capacity) setEventForm(prev => ({ ...prev, capacity: 1 }));
                  }}
                  className="flex-1 bg-transparent text-center font-extrabold text-white text-sm outline-none"
                  min={1}
                />
                <button
                  type="button"
                  onClick={() => setEventForm(prev => ({ ...prev, capacity: (prev.capacity || 0) + 1 }))}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] text-white hover:bg-white/[0.08] active:scale-95 transition-all font-extrabold flex items-center justify-center text-base select-none cursor-pointer"
                >
                  +
                </button>
              </div>
            )}
          </label>
          <label className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm font-semibold text-white/70 flex flex-col gap-2">
            <div className="flex items-center">
              <input type="checkbox" checked={eventForm.paid} onChange={e => setEventForm(prev => ({ ...prev, paid: e.target.checked }))} className="mr-2" />
              Ücretli etkinlik
            </div>
            {eventForm.paid && (
              <div className="space-y-3 mt-1">
                <div className="flex items-center gap-1 bg-[#0c0c1c] border border-white/10 rounded-xl p-1 w-full max-w-[200px]">
                  <button
                    type="button"
                    onClick={() => setEventForm(prev => ({ ...prev, feeAmount: Math.max(0, (prev.feeAmount || 0) - 10) }))}
                    className="w-9 h-9 rounded-lg bg-white/[0.04] text-white hover:bg-white/[0.08] active:scale-95 transition-all font-extrabold flex items-center justify-center text-base select-none cursor-pointer"
                  >
                    −
                  </button>
                  <div className="flex-1 flex items-center justify-center gap-1">
                    <input
                      type="number"
                      value={eventForm.feeAmount === 0 ? '0' : (eventForm.feeAmount || '')}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                        setEventForm(prev => ({ ...prev, feeAmount: val as any }));
                      }}
                      onBlur={() => {
                        if (!eventForm.feeAmount && eventForm.feeAmount !== 0) setEventForm(prev => ({ ...prev, feeAmount: 0 }));
                      }}
                      className="w-12 bg-transparent text-right font-extrabold text-white text-sm outline-none"
                      min={0}
                    />
                    <span className="text-white/45 text-xs font-bold pr-1">TL</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEventForm(prev => ({ ...prev, feeAmount: (prev.feeAmount || 0) + 10 }))}
                    className="w-9 h-9 rounded-lg bg-white/[0.04] text-white hover:bg-white/[0.08] active:scale-95 transition-all font-extrabold flex items-center justify-center text-base select-none cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <input value={eventForm.iban} onChange={e => setEventForm(prev => ({ ...prev, iban: e.target.value }))} className={inputClass} placeholder="IBAN" />
                <textarea value={eventForm.paymentInstructions} onChange={e => setEventForm(prev => ({ ...prev, paymentInstructions: e.target.value }))} className={`${textareaClass}`} placeholder="Ödeme açıklaması / açıklama kodu" />
              </div>
            )}
          </label>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <label className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm font-semibold text-white/70">
            <input type="checkbox" checked={eventForm.qrCheckInEnabled} onChange={e => setEventForm(prev => ({ ...prev, qrCheckInEnabled: e.target.checked }))} className="mr-2" />
            QR katılım doğrulama
          </label>
          <label className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm font-semibold text-white/70">
            <input type="checkbox" checked={eventForm.certificateEnabled} onChange={e => setEventForm(prev => ({ ...prev, certificateEnabled: e.target.checked }))} className="mr-2" />
            Sertifikalı etkinlik
            {eventForm.certificateEnabled && (
              <input value={eventForm.certificateTitle} onChange={e => setEventForm(prev => ({ ...prev, certificateTitle: e.target.value }))} className={`${inputClass} mt-3`} placeholder="Sertifika başlığı" />
            )}
          </label>
        </div>
        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
          <label className="flex items-start gap-3 text-sm font-semibold text-white/70">
            <input
              type="checkbox"
              checked={eventForm.reminderEnabled}
              onChange={e => setEventForm(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
              className="mt-1"
            />
            <span>
              <span className="block font-black text-white">Zamanlanmış hatırlatma duyuruları</span>
              <span className="block text-xs text-white/40 mt-1">Seçilen zamanlarda kayıt olan öğrencilere otomatik bildirim gider.</span>
            </span>
          </label>
          {eventForm.reminderEnabled && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {reminderOptions.map(option => {
                const active = eventForm.reminderOffsetsMinutes.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleReminderOffset(option.value)}
                    className={`rounded-2xl px-3 py-3 text-xs font-black border transition-colors ${active ? 'border-cyan-300/35 bg-cyan-500/20 text-cyan-100' : 'border-white/10 bg-white/[0.035] text-white/45 hover:text-white'}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
          {eventForm.reminderEnabled && (
            <p className="text-xs text-white/35">
              {eventForm.reminderOffsetsMinutes.length > 0
                ? `${eventForm.reminderOffsetsMinutes.length} hatırlatma planlandı.`
                : 'En az bir hatırlatma zamanı seç.'}
            </p>
          )}
        </section>
        <button disabled={eventsLoading} type="submit" className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 gradient-btn font-bold disabled:opacity-45">
          <FilePenLine className="w-4 h-4" />
          {editingEventId ? 'Düzenlemeyi Kaydet' : 'SKS Onayına Gönder'}
        </button>
      </form>

      <div className="rounded-3xl border border-white/10 bg-white/[0.035] overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-black text-white">Etkinlik Akışı</h2>
          <p className="text-sm text-white/40 mt-1">Taslak, revizyon ve yayın durumlarını buradan takip et.</p>
        </div>
        <div className="divide-y divide-white/10">
          {selectedClubEvents.map(event => (
            <div key={event.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              {(() => {
                const pastEvent = isPastEvent(event);
                const canEditEvent = !pastEvent && (event.status === 'DRAFT' || event.status === 'REVISION_REQUESTED' || event.status === 'PUBLISHED');
                const canSubmitEvent = !pastEvent && (event.status === 'DRAFT' || event.status === 'REVISION_REQUESTED');
                const canOperatePublishedEvent = !pastEvent && event.status === 'PUBLISHED';
                const canCheckInEvent = event.status === 'PUBLISHED' && isCheckInWindowOpen(event);
                const showActionPanel = canEditEvent || event.status === 'PUBLISHED';
                return (
              <>
              {event.posterImageUrl && (
                <img src={event.posterImageUrl} alt={event.title} className="w-full lg:w-24 aspect-[297/420] rounded-2xl object-cover border border-white/10 bg-white/[0.025]" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-white">{event.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black ${statusClass[event.status]}`}>{statusLabel[event.status]}</span>
                  <span className="rounded-full px-3 py-1 text-[11px] font-black bg-cyan-500/10 text-cyan-100">
                    {event.eventMode === 'ONLINE' ? 'Online' : 'Yüz yüze'}
                  </span>
                  {event.paid && <span className="rounded-full px-3 py-1 text-[11px] font-black bg-amber-500/10 text-amber-100">Ücretli</span>}
                  {pastEvent && <span className="rounded-full px-3 py-1 text-[11px] font-black bg-white/10 text-white/45">Geçmiş</span>}
                </div>
                <p className="text-xs text-white/40 mt-2">
                  {(event.eventMode === 'ONLINE' ? event.onlinePlatform : event.locationName || event.location) || 'Konum/link bekleniyor'} · {new Date(event.startTime).toLocaleString('tr-TR')}
                </p>
                {event.eventMode === 'ONLINE' && event.onlineMeetingUrl && (
                  <a href={event.onlineMeetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-cyan-200 hover:text-cyan-100">
                    <LinkIcon className="w-3.5 h-3.5" />
                    Online etkinliğe git
                  </a>
                )}
                {event.eventMode === 'IN_PERSON' && event.latitude && event.longitude && (
                  <p className="text-xs text-white/35 mt-2">{event.latitude}, {event.longitude} · {event.locationDetail || 'Konum detayı yok'}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-white/45">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
                    <UsersRound className="w-3.5 h-3.5 text-cyan-200" />
                    {event.hasCapacityLimit ? `${event.currentRsvpCount}/${event.capacity} kayıt` : `${event.currentRsvpCount} kayıt`}
                  </span>
                  {event.qrCheckInEnabled && (
                    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 ${canCheckInEvent ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/[0.025]'}`}>
                      <QrCode className="w-3.5 h-3.5" />
                      {canCheckInEvent ? 'Yoklama açık' : 'Yoklama kapalı'}
                    </span>
                  )}
                </div>
                {event.paid && <p className="text-xs text-amber-100/75 mt-2">Ödeme: {event.feeAmount || 0} TL · {event.iban || 'IBAN bekleniyor'}</p>}
                {event.reminderEnabled && event.reminderOffsetsMinutes && (
                  <p className="text-xs text-cyan-100/75 mt-2">
                    Hatırlatmalar: {(event.reminderOffsetsMinutes as any as string).split(',').filter(Boolean).map(value => {
                      const minutes = Number(value);
                      return minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} saat önce` : `${minutes} dk önce`;
                    }).join(', ')}
                  </p>
                )}
                {event.rejectionReason && <p className="text-xs text-red-200 mt-2">SKS geri bildirimi: {event.rejectionReason}</p>}
                {event.status === 'CANCELLED' && event.rejectionReason && (
                  <p className="mt-3 rounded-2xl border border-red-400/15 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
                    İptal gerekçesi: {event.rejectionReason}
                  </p>
                )}
              </div>
              {showActionPanel && (
                <div className="flex flex-col gap-2 lg:w-44">
                  <Link to={YOLLAR.kulupEtkinlikYonetimi(event.id)} className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-cyan-100 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/15">
                    Detay
                  </Link>
                  {canEditEvent && (
                    <button onClick={() => startEditingEvent(event)} type="button" className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white/80 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10">
                      Düzenle
                    </button>
                  )}
                  {canSubmitEvent && (
                    <button onClick={() => submitForApproval(event.id)} type="button" className="rounded-2xl px-4 py-2.5 text-sm font-bold text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25">
                      Onaya Gönder
                    </button>
                  )}
                  {event.status === 'PUBLISHED' && (
                    <>
                      {canOperatePublishedEvent && (
                        <>
                      <button
                        onClick={() => {
                          setCancellingEventId(prev => prev === event.id ? null : event.id);
                          setCancelReason('');
                        }}
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-red-100 bg-red-500/15 hover:bg-red-500/25 border border-red-400/15"
                      >
                        <XCircle className="w-4 h-4" />
                        İptal Et
                      </button>
                      {cancellingEventId === event.id && (
                        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 space-y-2">
                          <textarea
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            className={`${inputClass} min-h-24 resize-none`}
                            placeholder="İptal gerekçesi"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingEventId(null);
                                setCancelReason('');
                              }}
                              className="rounded-xl px-3 py-2 text-xs font-bold text-white/70 bg-white/[0.06] hover:bg-white/[0.1]"
                            >
                              Vazgeç
                            </button>
                            <button
                              type="button"
                              disabled={eventsLoading}
                              onClick={() => submitEventCancel(event.id)}
                              className="rounded-xl px-3 py-2 text-xs font-black text-red-50 bg-red-500/70 hover:bg-red-500 disabled:opacity-45"
                            >
                              Duyur ve İptal Et
                            </button>
                          </div>
                        </div>
                      )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
              {pastEvent && (
                <div className="lg:w-52 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-semibold text-white/45 text-center space-y-3">
                  <p>
                    {event.status === 'DRAFT' || event.status === 'REVISION_REQUESTED'
                      ? 'Bu taslak geçmiş tarihli olduğu için SKS onayına gönderilemez. Yeni tarihli bir etkinlik talebi oluştur.'
                      : canCheckInEvent
                        ? 'Etkinlik sona erdi; yoklama +1 saat esnekliği içinde açık kalır.'
                        : 'Geçmiş etkinliklerde düzenleme, yoklama ve iptal kapalıdır.'}
                  </p>
                  <Link to={YOLLAR.kulupEtkinlikYonetimi(event.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-black text-purple-50 bg-purple-500/70 hover:bg-purple-500">
                    Detayları Yönet
                  </Link>
                </div>
              )}
              </>
                );
              })()}
            </div>
          ))}
          {selectedClubEvents.length === 0 && (
            <p className="p-8 text-center text-sm text-white/40">Henüz etkinlik oluşturulmadı.</p>
          )}
        </div>
      </div>
    </section>
  );
};
