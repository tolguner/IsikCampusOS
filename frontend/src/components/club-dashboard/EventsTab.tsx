import { useState, useMemo, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  FilePenLine,
  Link as LinkIcon,
  MapPin,
  ImagePlus,
  UsersRound,
  Banknote,
  CheckCircle2,
  XCircle,
  QrCode,
  GraduationCap
} from 'lucide-react';
import type { Club } from '../../store/clubStore';
import { useEventStore, type Event } from '../../store/eventStore';
import {
  inputClass,
  textareaClass,
  emptyEventForm,
  reminderOptions,
  statusClass,
  statusLabel,
  participantStatusLabel,
  isPastEvent,
  a3PosterFile,
  parseReminderOffsets,
} from './constants';
import { LocationPicker } from './LocationPicker';
import { QrCheckInPanel } from './QrCheckInPanel';

interface EventsTabProps {
  selectedClub: Club;
}

export const EventsTab = ({ selectedClub }: EventsTabProps) => {
  const {
    managedEvents,
    isLoading: eventsLoading,
    createEventDraft,
    updateEvent,
    submitForApproval,
    cancelEvent,
    participantsByEvent,
    fetchParticipants,
    checkInWithQr,
    approvePayment,
    rejectPayment,
    issueCertificates,
  } = useEventStore();

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null);
  const [qrCheckInEventId, setQrCheckInEventId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [eventForm, setEventForm] = useState(emptyEventForm);

  useEffect(() => {
    setEventForm((prev) => ({ ...prev, clubId: selectedClub.id }));
  }, [selectedClub.id]);

  const selectedClubEvents = useMemo(
    () => managedEvents.filter((event) => event.club?.id === selectedClub?.id),
    [managedEvents, selectedClub?.id]
  );

  useEffect(() => {
    selectedClubEvents.forEach((event) => {
      fetchParticipants(event.id);
    });
  }, [fetchParticipants, selectedClubEvents]);

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
    if (editingEventId) {
      const currentEvent = managedEvents.find((item) => item.id === editingEventId);
      if (currentEvent && isPastEvent(currentEvent)) return;
    }

    const payload = toEventPayload();
    if (!payload) return;

    const ok = editingEventId
      ? await updateEvent(editingEventId, payload)
      : await createEventDraft(payload);
    if (ok) {
      resetEventForm();
    }
  };

  const handlePosterSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !['image/png', 'image/jpeg'].includes(file.type)) return;
    try {
      const posterImageUrl = await a3PosterFile(file);
      setEventForm((prev) => ({ ...prev, posterImageUrl }));
    } catch {
      // ignore
    }
  };

  const submitEventCancel = async (eventId: string) => {
    const ok = await cancelEvent(eventId, cancelReason);
    if (ok) {
      setCancellingEventId(null);
      setCancelReason('');
    }
  };

  const submitQrCheckIn = async (eventId: string, token: string) => {
    const ok = await checkInWithQr(eventId, token);
    if (ok) {
      await fetchParticipants(eventId);
      setQrCheckInEventId(null);
    }
    return ok;
  };

  const submitCertificateIssue = async (eventId: string) => {
    await issueCertificates(eventId);
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-5">
      <form onSubmit={submitEventDraft} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-white">{editingEventId ? 'Etkinlik Düzenleme' : 'Etkinlik Taslağı'}</h2>
            <p className="text-sm text-white/40 mt-1">
              {editingEventId
                ? 'SKS geri bildirimine göre etkinliği güncelle, ardından listeden tekrar onaya gönder.'
                : 'Taslağı oluşturduktan sonra listeden SKS onayına gönderebilirsin.'}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <input type="datetime-local" value={eventForm.startTime} onChange={e => setEventForm(prev => ({ ...prev, startTime: e.target.value }))} className={inputClass} />
          <input type="datetime-local" value={eventForm.endTime} onChange={e => setEventForm(prev => ({ ...prev, endTime: e.target.value }))} className={inputClass} />
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
          <label className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm font-semibold text-white/70">
            <input type="checkbox" checked={eventForm.hasCapacityLimit} onChange={e => setEventForm(prev => ({ ...prev, hasCapacityLimit: e.target.checked }))} className="mr-2" />
            Sınırlı kontenjan
            {eventForm.hasCapacityLimit && (
              <input type="number" value={eventForm.capacity} onChange={e => setEventForm(prev => ({ ...prev, capacity: Number(e.target.value) }))} className={`${inputClass} mt-3`} min={1} placeholder="Kontenjan" />
            )}
          </label>
          <label className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm font-semibold text-white/70">
            <input type="checkbox" checked={eventForm.paid} onChange={e => setEventForm(prev => ({ ...prev, paid: e.target.checked }))} className="mr-2" />
            Ücretli etkinlik
            {eventForm.paid && (
              <div className="space-y-3 mt-3">
                <input type="number" value={eventForm.feeAmount} onChange={e => setEventForm(prev => ({ ...prev, feeAmount: Number(e.target.value) }))} className={inputClass} min={0} placeholder="Ücret" />
                <input value={eventForm.iban} onChange={e => setEventForm(prev => ({ ...prev, iban: e.target.value }))} className={inputClass} placeholder="IBAN" />
                <textarea value={eventForm.paymentInstructions} onChange={e => setEventForm(prev => ({ ...prev, paymentInstructions: e.target.value }))} className={`${inputClass} min-h-20 resize-none`} placeholder="Ödeme açıklaması / açıklama kodu" />
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
          {editingEventId ? 'Düzenlemeyi Kaydet' : 'Taslak Oluştur'}
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
                const participants = participantsByEvent[event.id] || [];
                const attendedParticipants = participants.filter(participant => participant.status === 'ATTENDED');
                const pendingCertificateParticipants = attendedParticipants.filter(participant => !participant.certificateSent);
                const canEditEvent = !pastEvent && (event.status === 'DRAFT' || event.status === 'REVISION_REQUESTED' || event.status === 'PUBLISHED');
                const canSubmitEvent = !pastEvent && (event.status === 'DRAFT' || event.status === 'REVISION_REQUESTED');
                const canOperatePublishedEvent = !pastEvent && event.status === 'PUBLISHED';
                const canIssueCertificates = pastEvent && event.certificateEnabled && pendingCertificateParticipants.length > 0;
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
                    Toplantı linki
                  </a>
                )}
                {event.eventMode === 'IN_PERSON' && event.latitude && event.longitude && (
                  <p className="text-xs text-white/35 mt-2">{event.latitude}, {event.longitude} · {event.locationDetail || 'Konum detayı yok'}</p>
                )}
                {event.hasCapacityLimit && <p className="text-xs text-white/35 mt-2">Kontenjan: {event.currentRsvpCount}/{event.capacity}</p>}
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
                {participants.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-black text-white/70">
                        <UsersRound className="w-4 h-4 text-cyan-200" />
                        Katılımcılar
                      </div>
                      <div className="text-[11px] font-bold text-white/35">
                        {attendedParticipants.length} katıldı · {participants.length} kayıt
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {participants.slice(0, 6).map(participant => (
                        <div key={participant.rsvpId} className="rounded-xl bg-white/[0.035] border border-white/10 px-3 py-2">
                          <div className="truncate text-xs font-bold text-white">{participant.userId}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                            <span>{participantStatusLabel[participant.status]}</span>
                            {participant.checkedInAt && <span>{new Date(participant.checkedInAt).toLocaleString('tr-TR')}</span>}
                            {participant.certificateSent && <span className="text-purple-200">Sertifika gönderildi</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {participants.length > 6 && (
                      <p className="text-[11px] font-semibold text-white/35">+{participants.length - 6} katılımcı daha kayıtlı.</p>
                    )}
                  </div>
                )}
                {event.paid && !pastEvent && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-white/70">
                      <Banknote className="w-4 h-4 text-amber-200" />
                      Ödeme bekleyen kayıtlar
                    </div>
                    {(participantsByEvent[event.id] || []).filter(participant => participant.status === 'PENDING_PAYMENT').map(participant => (
                      <div key={participant.rsvpId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-amber-500/10 border border-amber-300/15 px-3 py-2">
                        <div>
                          <div className="text-xs font-bold text-white">{participant.userId}</div>
                          <div className="text-[11px] text-white/40">{new Date(participant.registeredAt).toLocaleString('tr-TR')}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => approvePayment(event.id, participant.rsvpId)} type="button" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Onayla
                          </button>
                          <button onClick={() => rejectPayment(event.id, participant.rsvpId)} type="button" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black text-red-100 bg-red-500/15 hover:bg-red-500/25">
                            <XCircle className="w-3.5 h-3.5" />
                            Reddet
                          </button>
                        </div>
                      </div>
                    ))}
                    {(participantsByEvent[event.id] || []).filter(participant => participant.status === 'PENDING_PAYMENT').length === 0 && (
                      <p className="text-xs text-white/35">Ödeme bekleyen kayıt yok.</p>
                    )}
                  </div>
                )}
                {event.qrCheckInEnabled && canOperatePublishedEvent && qrCheckInEventId === event.id && (
                  <QrCheckInPanel
                    event={event}
                    isLoading={eventsLoading}
                    onClose={() => setQrCheckInEventId(null)}
                    onSubmit={(token) => submitQrCheckIn(event.id, token)}
                  />
                )}
                {event.status === 'CANCELLED' && event.rejectionReason && (
                  <p className="mt-3 rounded-2xl border border-red-400/15 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
                    İptal gerekçesi: {event.rejectionReason}
                  </p>
                )}
              </div>
              {canEditEvent && (
                <div className="flex flex-col gap-2 lg:w-44">
                  <button onClick={() => startEditingEvent(event)} type="button" className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white/80 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10">
                    Düzenle
                  </button>
                  {canSubmitEvent && (
                    <button onClick={() => submitForApproval(event.id)} type="button" className="rounded-2xl px-4 py-2.5 text-sm font-bold text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25">
                      Onaya Gönder
                    </button>
                  )}
                  {canOperatePublishedEvent && (
                    <>
                      {event.qrCheckInEnabled && (
                        <button
                          onClick={() => setQrCheckInEventId(prev => prev === event.id ? null : event.id)}
                          type="button"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/15"
                        >
                          <QrCode className="w-4 h-4" />
                          QR Yoklama
                        </button>
                      )}
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
                </div>
              )}
              {pastEvent && (
                <div className="lg:w-52 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-semibold text-white/45 text-center space-y-3">
                  <p>Geçmiş etkinliklerde düzenleme, yoklama ve iptal kapalıdır.</p>
                  {event.certificateEnabled && (
                    <>
                      <div className="rounded-xl bg-purple-500/10 border border-purple-300/15 px-3 py-2 text-purple-100">
                        {attendedParticipants.length} katılımcı sertifikaya uygun.
                      </div>
                      <button
                        type="button"
                        disabled={eventsLoading || !canIssueCertificates}
                        onClick={() => submitCertificateIssue(event.id)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-black text-purple-50 bg-purple-500/70 hover:bg-purple-500 disabled:opacity-45 disabled:hover:bg-purple-500/70"
                      >
                        <GraduationCap className="w-4 h-4" />
                        Sertifikaları Gönder
                      </button>
                      {pendingCertificateParticipants.length === 0 && attendedParticipants.length > 0 && (
                        <p className="text-[11px] text-white/35">Tüm katılımcılara sertifika gönderilmiş.</p>
                      )}
                    </>
                  )}
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
