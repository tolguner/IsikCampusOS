import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  GraduationCap,
  Link as LinkIcon,
  MapPin,
  QrCode,
  Search,
  UsersRound,
  XCircle,
} from 'lucide-react';
import { useClubStore } from '../store/clubStore';
import { useEventStore, type EventParticipant } from '../store/eventStore';
import { YOLLAR } from '../utils/paths';
import {
  isCheckInWindowOpen,
  isPastEvent,
  participantStatusLabel,
  statusClass,
  statusLabel,
} from '../components/club-dashboard/constants';
import { QrCheckInPanel } from '../components/club-dashboard/QrCheckInPanel';

const tabClass = (active: boolean) =>
  `rounded-2xl px-4 py-2.5 text-sm font-black border transition-colors ${
    active
      ? 'border-purple-300/35 bg-purple-500/20 text-white'
      : 'border-white/10 bg-white/[0.035] text-white/45 hover:text-white'
  }`;

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('tr-TR') : 'Belirtilmedi';

const participantName = (participant: EventParticipant) =>
  participant.fullName || participant.userId;

const participantNumber = (participant: EventParticipant) =>
  participant.studentNumber || participant.userId;

const downloadXlsx = (filename: string, rows: Record<string, string>[]) => {
  const headers = [
    'Ad Soyad',
    'Öğrenci No',
    'E-posta',
    'Bölüm',
    'Kayıt Tarihi',
    'Kayıt Durumu',
    'Yoklama Tarihi',
    'Ödeme Durumu',
    'Sertifika Durumu',
  ];
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Katılımcılar');
  XLSX.writeFile(workbook, filename.replace(/[\\/:*?"<>|]/g, '-'));
};

export const ClubEventManagementPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const managedClubs = useClubStore(state => state.managedClubs);
  const fetchManagedClubs = useClubStore(state => state.fetchManagedClubs);
  const {
    managedEvents,
    participantsByEvent,
    auditLogsByEvent,
    isLoading,
    fetchManagedEvents,
    fetchParticipants,
    fetchEventAuditLogs,
    checkInUser,
    checkInWithQr,
    approvePayment,
    rejectPayment,
    issueCertificates,
  } = useEventStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'qr' | 'payments' | 'certificates' | 'logs'>('overview');
  const [checked, setChecked] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [attendanceFilter, setAttendanceFilter] = useState('ALL');
  const [certificateFilter, setCertificateFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [logAction, setLogAction] = useState('');
  const [logActor, setLogActor] = useState('');
  const [logFrom, setLogFrom] = useState('');
  const [logTo, setLogTo] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([fetchManagedClubs(), fetchManagedEvents()]).finally(() => {
      if (active) setChecked(true);
    });
    return () => {
      active = false;
    };
  }, [fetchManagedClubs, fetchManagedEvents]);

  const event = useMemo(
    () => managedEvents.find(item => item.id === eventId),
    [eventId, managedEvents]
  );

  useEffect(() => {
    if (eventId) {
      fetchParticipants(eventId);
      fetchEventAuditLogs(eventId);
    }
  }, [eventId, fetchParticipants, fetchEventAuditLogs]);

  if (!eventId) {
    return <Navigate to={YOLLAR.kulupYonetimi} replace />;
  }

  if (!checked) {
    return <div className="text-sm font-semibold text-white/45">Yükleniyor...</div>;
  }

  if (managedClubs.length === 0 && managedEvents.length === 0) {
    return <Navigate to={YOLLAR.kulupler} replace />;
  }

  if (!event) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center">
        <p className="text-sm font-semibold text-white/45">Etkinlik yükleniyor veya bu etkinliği yönetme yetkin yok.</p>
        <button
          type="button"
          onClick={() => navigate(YOLLAR.kulupYonetimi)}
          className="mt-4 rounded-2xl px-4 py-2.5 text-sm font-bold text-white/80 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10"
        >
          Kulüp yönetimine dön
        </button>
      </section>
    );
  }

  const participants = participantsByEvent[event.id] || [];
  const auditLogs = auditLogsByEvent[event.id] || [];
  const filteredParticipants = participants.filter(participant => {
    const normalized = participantSearch.trim().toLocaleLowerCase('tr-TR');
    const searchable = [
      participantName(participant),
      participantNumber(participant),
      participant.email || '',
      participant.department || '',
      participant.userId,
    ].join(' ').toLocaleLowerCase('tr-TR');
    const matchesSearch = !normalized || searchable.includes(normalized);
    const matchesStatus = statusFilter === 'ALL' || participant.status === statusFilter;
    const matchesPayment =
      paymentFilter === 'ALL'
      || (paymentFilter === 'PENDING' && participant.paymentPending)
      || (paymentFilter === 'CONFIRMED' && participant.paymentConfirmed)
      || (paymentFilter === 'NONE' && !participant.paymentPending && !participant.paymentConfirmed);
    const matchesAttendance =
      attendanceFilter === 'ALL'
      || (attendanceFilter === 'ATTENDED' && participant.status === 'ATTENDED')
      || (attendanceFilter === 'NOT_ATTENDED' && participant.status !== 'ATTENDED');
    const matchesCertificate =
      certificateFilter === 'ALL'
      || (certificateFilter === 'SENT' && participant.certificateSent)
      || (certificateFilter === 'PENDING' && !participant.certificateSent);
    return matchesSearch && matchesStatus && matchesPayment && matchesAttendance && matchesCertificate;
  });
  const attendedParticipants = participants.filter(participant => participant.status === 'ATTENDED');
  const pendingPaymentParticipants = participants.filter(participant => participant.status === 'PENDING_PAYMENT');
  const pendingCertificateParticipants = attendedParticipants.filter(participant => !participant.certificateSent);
  const canCheckIn = event.status === 'PUBLISHED' && event.qrCheckInEnabled && isCheckInWindowOpen(event);
  const canIssueCertificates =
    isPastEvent(event)
    && event.certificateEnabled
    && (event.status === 'PUBLISHED' || event.status === 'COMPLETED')
    && pendingCertificateParticipants.length > 0;

  const submitQrCheckIn = async (token: string) => {
    const ok = await checkInWithQr(event.id, token);
    if (ok) await fetchParticipants(event.id);
    return ok;
  };

  const refreshLogs = () => {
    fetchEventAuditLogs(event.id, {
      action: logAction || undefined,
      actorId: logActor || undefined,
      from: logFrom || undefined,
      to: logTo || undefined,
      search: logSearch || undefined,
    });
  };

  const exportParticipants = () => {
    const rows = filteredParticipants.map(participant => ({
      'Ad Soyad': participantName(participant),
      'Öğrenci No': participantNumber(participant),
      'E-posta': participant.email || '',
      'Bölüm': participant.department || '',
      'Kayıt Tarihi': formatDateTime(participant.registeredAt),
      'Kayıt Durumu': participantStatusLabel[participant.status],
      'Yoklama Tarihi': participant.checkedInAt ? formatDateTime(participant.checkedInAt) : '',
      'Ödeme Durumu': participant.paymentPending ? 'Ödeme bekliyor' : participant.paymentConfirmed ? 'Ödeme onaylandı' : 'Ödeme yok',
      'Sertifika Durumu': participant.certificateSent ? 'Gönderildi' : 'Bekliyor',
    }));
    downloadXlsx(`${event.title}-katilimcilar.xlsx`, rows);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link to={YOLLAR.kulupYonetimi} className="inline-flex items-center gap-2 text-sm font-bold text-white/45 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Etkinlik akışına dön
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${statusClass[event.status]}`}>{statusLabel[event.status]}</span>
            <span className="rounded-full px-3 py-1 text-[11px] font-black bg-cyan-500/10 text-cyan-100">
              {event.eventMode === 'ONLINE' ? 'Online' : 'Yüz yüze'}
            </span>
            {event.paid && <span className="rounded-full px-3 py-1 text-[11px] font-black bg-amber-500/10 text-amber-100">Ücretli</span>}
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white leading-tight">{event.title}</h1>
          <p className="mt-2 text-sm text-white/45">{event.club?.name}</p>
        </div>

        {event.posterImageUrl && (
          <img src={event.posterImageUrl} alt={event.title} className="w-28 aspect-[297/420] rounded-2xl object-cover border border-white/10 bg-white/[0.025]" />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveTab('overview')} className={tabClass(activeTab === 'overview')}>Genel</button>
        <button type="button" onClick={() => setActiveTab('participants')} className={tabClass(activeTab === 'participants')}>Katılımcılar</button>
        <button type="button" onClick={() => setActiveTab('qr')} className={tabClass(activeTab === 'qr')}>QR Yoklama</button>
        {event.paid && <button type="button" onClick={() => setActiveTab('payments')} className={tabClass(activeTab === 'payments')}>Ödeme</button>}
        {event.certificateEnabled && <button type="button" onClick={() => setActiveTab('certificates')} className={tabClass(activeTab === 'certificates')}>Sertifika</button>}
        <button type="button" onClick={() => setActiveTab('logs')} className={tabClass(activeTab === 'logs')}>İşlem Geçmişi</button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-5">
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 space-y-4">
            <h2 className="text-xl font-black text-white">Etkinlik Detayları</h2>
            <p className="text-sm leading-6 text-white/55 whitespace-pre-line">{event.description || 'Açıklama girilmemiş.'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-xs font-black text-white/45"><CalendarDays className="w-4 h-4" />Başlangıç</div>
                <p className="mt-2 text-sm font-bold text-white">{formatDateTime(event.startTime)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-xs font-black text-white/45"><CalendarDays className="w-4 h-4" />Bitiş</div>
                <p className="mt-2 text-sm font-bold text-white">{formatDateTime(event.endTime)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:col-span-2">
                <div className="flex items-center gap-2 text-xs font-black text-white/45">
                  {event.eventMode === 'ONLINE' ? <LinkIcon className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  {event.eventMode === 'ONLINE' ? 'Online Bağlantı' : 'Konum'}
                </div>
                <p className="mt-2 text-sm font-bold text-white">
                  {event.eventMode === 'ONLINE' ? event.onlinePlatform || 'Online' : event.locationName || event.location || 'Konum belirtilmedi'}
                </p>
                {event.eventMode === 'ONLINE' && event.onlineMeetingUrl && (
                  <a href={event.onlineMeetingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-cyan-100 bg-cyan-500/15 hover:bg-cyan-500/25">
                    <ExternalLink className="w-4 h-4" />
                    Online etkinliği aç
                  </a>
                )}
                {event.eventMode === 'IN_PERSON' && (
                  <p className="mt-2 text-xs text-white/40">{event.latitude}, {event.longitude} · {event.locationDetail || 'Konum detayı yok'}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 space-y-3">
            <h2 className="text-xl font-black text-white">Kayıt Özeti</h2>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <div className="text-3xl font-black text-white">{participants.length}</div>
              <div className="text-sm font-semibold text-white/40">Toplam kayıt</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <div className="text-3xl font-black text-emerald-100">{attendedParticipants.length}</div>
              <div className="text-sm font-semibold text-white/40">Yoklaması alınan</div>
            </div>
            {event.hasCapacityLimit && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="text-3xl font-black text-cyan-100">{event.currentRsvpCount}/{event.capacity}</div>
                <div className="text-sm font-semibold text-white/40">Kontenjan</div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'participants' && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">Katılımcı Listesi</h2>
              <p className="text-sm text-white/40 mt-1">Kayıt olan öğrenciler ad soyad ve öğrenci no ile görüntülenir.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportParticipants} className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/15">
                <Download className="w-4 h-4" />
                .xlsx indir
              </button>
              <button type="button" onClick={() => fetchParticipants(event.id)} className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white/70 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10">
                Yenile
              </button>
            </div>
          </div>
          <div className="p-4 border-b border-white/10 grid grid-cols-1 md:grid-cols-5 gap-2">
            <label className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={participantSearch} onChange={e => setParticipantSearch(e.target.value)} placeholder="Ad, öğrenci no, e-posta ara" className="w-full rounded-2xl bg-[#111123] border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60" />
            </label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-2xl bg-[#111123] border border-white/10 px-3 py-2.5 text-sm text-white outline-none">
              <option value="ALL">Tüm durumlar</option>
              <option value="CONFIRMED">Katılım onaylı</option>
              <option value="PENDING_PAYMENT">Ödeme bekliyor</option>
              <option value="ATTENDED">Katıldı</option>
              <option value="CANCELLED">İptal</option>
            </select>
            <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="rounded-2xl bg-[#111123] border border-white/10 px-3 py-2.5 text-sm text-white outline-none">
              <option value="ALL">Tüm ödemeler</option>
              <option value="PENDING">Ödeme bekliyor</option>
              <option value="CONFIRMED">Ödeme onaylandı</option>
              <option value="NONE">Ödeme yok</option>
            </select>
            <select value={attendanceFilter} onChange={e => setAttendanceFilter(e.target.value)} className="rounded-2xl bg-[#111123] border border-white/10 px-3 py-2.5 text-sm text-white outline-none">
              <option value="ALL">Tüm yoklama</option>
              <option value="ATTENDED">Yoklaması alınan</option>
              <option value="NOT_ATTENDED">Yoklaması alınmayan</option>
            </select>
            <select value={certificateFilter} onChange={e => setCertificateFilter(e.target.value)} className="rounded-2xl bg-[#111123] border border-white/10 px-3 py-2.5 text-sm text-white outline-none md:col-span-5">
              <option value="ALL">Tüm sertifikalar</option>
              <option value="SENT">Sertifika gönderildi</option>
              <option value="PENDING">Sertifika bekliyor</option>
            </select>
          </div>
          <ParticipantTable participants={filteredParticipants} canManualCheckIn={canCheckIn} onCheckIn={(userId) => checkInUser(event.id, userId)} />
        </section>
      )}

      {activeTab === 'qr' && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-300/20 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">QR Yoklama</h2>
              <p className="text-sm text-white/40">Yoklama başlangıçtan 1 saat önce açılır, bitişten 1 saat sonra kapanır.</p>
            </div>
          </div>
          {!event.qrCheckInEnabled ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-white/45">Bu etkinlikte QR katılım doğrulama açık değil.</p>
          ) : canCheckIn ? (
            <QrCheckInPanel event={event} isLoading={isLoading} onClose={() => undefined} onSubmit={submitQrCheckIn} />
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-white/45">Şu anda yoklama penceresi açık değil.</p>
          )}
        </section>
      )}

      {activeTab === 'payments' && event.paid && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-amber-200" />
            <h2 className="text-xl font-black text-white">Ödeme Bekleyen Kayıtlar</h2>
          </div>
          {pendingPaymentParticipants.length === 0 ? (
            <p className="text-sm font-semibold text-white/40">Ödeme bekleyen kayıt yok.</p>
          ) : (
            <div className="space-y-2">
              {pendingPaymentParticipants.map(participant => (
                <div key={participant.rsvpId} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-amber-300/15 bg-amber-500/10 px-4 py-3">
                  <div>
                    <div className="text-sm font-black text-white">{participantName(participant)}</div>
                    <div className="text-xs text-white/40">{participantNumber(participant)} · {formatDateTime(participant.registeredAt)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={isLoading} onClick={() => approvePayment(event.id, participant.rsvpId)} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-45">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Onayla
                    </button>
                    <button type="button" disabled={isLoading} onClick={() => rejectPayment(event.id, participant.rsvpId)} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black text-red-100 bg-red-500/15 hover:bg-red-500/25 disabled:opacity-45">
                      <XCircle className="w-3.5 h-3.5" />
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'certificates' && event.certificateEnabled && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-purple-200" />
            <h2 className="text-xl font-black text-white">Sertifika Yönetimi</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <div className="text-2xl font-black text-white">{attendedParticipants.length}</div>
              <div className="text-xs font-semibold text-white/40">Sertifikaya uygun</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <div className="text-2xl font-black text-purple-100">{attendedParticipants.length - pendingCertificateParticipants.length}</div>
              <div className="text-xs font-semibold text-white/40">Gönderilen</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <div className="text-2xl font-black text-amber-100">{pendingCertificateParticipants.length}</div>
              <div className="text-xs font-semibold text-white/40">Bekleyen</div>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading || !canIssueCertificates}
            onClick={() => issueCertificates(event.id)}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-purple-50 bg-purple-500/70 hover:bg-purple-500 disabled:opacity-45 disabled:hover:bg-purple-500/70"
          >
            <GraduationCap className="w-4 h-4" />
            Sertifikaları Gönder
          </button>
          {!isPastEvent(event) && <p className="text-xs font-semibold text-white/40">Sertifikalar etkinlik bittikten sonra gönderilebilir.</p>}
        </section>
      )}

      {activeTab === 'logs' && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-black text-white">İşlem Geçmişi</h2>
            <p className="text-sm text-white/40 mt-1">Etkinlik üzerinde yapılan kritik işlemler burada tutulur.</p>
          </div>
          <div className="p-4 border-b border-white/10 grid grid-cols-1 md:grid-cols-5 gap-2">
            <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Metin ara" className="rounded-2xl bg-[#111123] border border-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25" />
            <input value={logAction} onChange={e => setLogAction(e.target.value)} placeholder="İşlem tipi" className="rounded-2xl bg-[#111123] border border-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25" />
            <input value={logActor} onChange={e => setLogActor(e.target.value)} placeholder="Aktör" className="rounded-2xl bg-[#111123] border border-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25" />
            <input type="date" value={logFrom} onChange={e => setLogFrom(e.target.value)} className="rounded-2xl bg-[#111123] border border-white/10 px-3 py-2.5 text-sm text-white outline-none" />
            <input type="date" value={logTo} onChange={e => setLogTo(e.target.value)} className="rounded-2xl bg-[#111123] border border-white/10 px-3 py-2.5 text-sm text-white outline-none" />
            <button type="button" onClick={refreshLogs} className="rounded-2xl px-4 py-2.5 text-sm font-black text-cyan-100 bg-cyan-500/15 hover:bg-cyan-500/25 md:col-span-5">
              Filtrele
            </button>
          </div>
          <div className="divide-y divide-white/10">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-3 py-1 text-[11px] font-black bg-purple-500/15 text-purple-100">{log.action}</span>
                    <span className="text-xs font-semibold text-white/35">{log.actorId}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white/65">{log.message}</p>
                </div>
                <span className="text-xs text-white/35">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="p-8 text-center text-sm font-semibold text-white/40">Bu filtrelerle işlem kaydı bulunamadı.</p>
            )}
          </div>
        </section>
      )}
    </section>
  );
};

const ParticipantTable = ({
  participants,
  canManualCheckIn,
  onCheckIn,
}: {
  participants: EventParticipant[];
  canManualCheckIn: boolean;
  onCheckIn: (userId: string) => Promise<boolean>;
}) => {
  if (participants.length === 0) {
    return (
      <div className="p-8 text-center">
        <UsersRound className="w-8 h-8 text-white/20 mx-auto" />
        <p className="mt-3 text-sm font-semibold text-white/40">Henüz kayıtlı katılımcı yok.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left">
        <thead className="bg-white/[0.025] text-xs font-black uppercase text-white/35">
          <tr>
            <th className="px-5 py-3">Öğrenci</th>
            <th className="px-5 py-3">Öğrenci No</th>
            <th className="px-5 py-3">Kayıt</th>
            <th className="px-5 py-3">Durum</th>
            <th className="px-5 py-3">Yoklama</th>
            <th className="px-5 py-3">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {participants.map(participant => (
            <tr key={participant.rsvpId} className="hover:bg-white/[0.025]">
              <td className="px-5 py-4">
                <div className="text-sm font-black text-white">{participantName(participant)}</div>
                <div className="text-xs text-white/35">{participant.email || participant.department || participant.userId}</div>
              </td>
              <td className="px-5 py-4 text-sm font-bold text-white/70">{participantNumber(participant)}</td>
              <td className="px-5 py-4 text-sm text-white/50">{formatDateTime(participant.registeredAt)}</td>
              <td className="px-5 py-4">
                <span className="rounded-full px-3 py-1 text-[11px] font-black bg-white/10 text-white/65">
                  {participantStatusLabel[participant.status]}
                </span>
              </td>
              <td className="px-5 py-4 text-sm text-white/50">
                {participant.checkedInAt ? formatDateTime(participant.checkedInAt) : '-'}
              </td>
              <td className="px-5 py-4">
                <button
                  type="button"
                  disabled={!canManualCheckIn || participant.status !== 'CONFIRMED'}
                  onClick={() => onCheckIn(participant.userId)}
                  className="rounded-xl px-3 py-2 text-xs font-black text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 disabled:hover:bg-emerald-500/15 disabled:cursor-not-allowed"
                >
                  Yoklama Al
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
