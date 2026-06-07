import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'qrcode';
import { Link, useParams } from 'react-router-dom';
import { Banknote, Bell, CalendarDays, CheckCircle2, ChevronLeft, Clock, GraduationCap, Link as LinkIcon, Loader2, MapPin, Maximize2, Megaphone, Ticket, UserRound, Users, X } from 'lucide-react';
import { useClubStore } from '../store/clubStore';
import { useEventStore, type Etkinlik, type EtkinlikDurumu } from '../store/eventStore';
import { useAuthStore } from '../store/authStore';
import { yetkilerdenBiriVarMi, YETKI_GRUPLARI } from '../utils/roles';
import { YOLLAR } from '../utils/paths';

const formatDate = (value?: string) => {
  if (!value) return 'Tarih bekleniyor';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const ClubDetailPage = () => {
  const { clubId } = useParams();
  const user = useAuthStore(state => state.user);
  const { selectedClub, clubEvents, fetchClub, fetchClubEvents, joinClub, leaveClub, isLoading } = useClubStore();
  const {
    isLoading: eventActionLoading,
    error: eventError,
    successMessage: eventSuccess,
    myRsvpsByEvent,
    fetchMyRsvps,
    createRsvp,
    cancelRsvp,
  } = useEventStore();
  const [eventFilter, setEventFilter] = useState<'active' | 'past'>('active');
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [expandedPosterEvent, setExpandedPosterEvent] = useState<Etkinlik | null>(null);
  const [qrTicket, setQrTicket] = useState<{ event: Etkinlik; dataUrl: string } | null>(null);
  const isStudent = yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.ogrenci);

  useEffect(() => {
    if (!clubId) return;
    fetchClub(clubId);
    fetchClubEvents(clubId);
    if (isStudent) fetchMyRsvps();
  }, [clubId, fetchClub, fetchClubEvents, fetchMyRsvps, isStudent]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const visibleStatuses = new Set<EtkinlikDurumu>(['YAYINLANDI', 'TAMAMLANDI', 'IPTAL_EDILDI']);
    return clubEvents.filter(event => {
      if (!visibleStatuses.has(event.durum)) return false;
      const endDate = event.bitisTarihi ? new Date(event.bitisTarihi) : event.baslangicTarihi ? new Date(event.baslangicTarihi) : null;
      const isPast = endDate ? endDate < now || event.durum === 'TAMAMLANDI' || event.durum === 'IPTAL_EDILDI' : false;
      return eventFilter === 'past' ? isPast : !isPast;
    });
  }, [clubEvents, eventFilter]);

  if (!clubId) return null;

  if (isLoading && !selectedClub) {
    return (
      <div className="min-h-[560px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!selectedClub) {
    return (
      <div className="w-full py-10 text-white/45">
        Kulüp bulunamadı.
      </div>
    );
  }

  const isManager = selectedClub.mevcutKullaniciRol === 'YONETICI';
  const vision = selectedClub.vizyon || selectedClub.aciklama;
  const membershipButtonLabel =
    selectedClub.mevcutKullaniciRol === 'YONETICI'
      ? 'Yöneticisisin'
      : selectedClub.mevcutKullaniciDurum === 'AKTIF'
          ? 'Üyesiniz'
          : selectedClub.mevcutKullaniciDurum === 'REDDEDILDI'
              ? 'Tekrar başvur'
              : 'Üye ol';
  const initials = selectedClub.ad
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toLocaleUpperCase('tr-TR');

  const handleMembershipClick = async () => {
    if (selectedClub.mevcutKullaniciDurum !== 'AKTIF') {
      await joinClub(selectedClub.id);
      return;
    }

    setIsLeaveDialogOpen(true);
  };

  const confirmLeaveClub = async () => {
    const ok = await leaveClub(selectedClub.id);
    if (ok) setIsLeaveDialogOpen(false);
  };

  const handleEventRegistration = async (eventId: string) => {
    const ok = await createRsvp(eventId);
    if (ok && clubId) {
      fetchClub(clubId);
      fetchClubEvents(clubId);
    }
  };

  const handleEventRegistrationCancel = async (eventId: string) => {
    const ok = await cancelRsvp(eventId);
    if (ok && clubId) {
      fetchClub(clubId);
      fetchClubEvents(clubId);
    }
  };

  const isEventFull = (event: Etkinlik) =>
    Boolean(event.kontenjanSiniriVar || event.kontenjanSinirli) && event.mevcutRsvpSayisi >= event.kontenjan;

  const isEventRegisterable = (event: Etkinlik) => {
    const endDate = event.bitisTarihi ? new Date(event.bitisTarihi) : event.baslangicTarihi ? new Date(event.baslangicTarihi) : null;
    return event.durum === 'YAYINLANDI' && (!endDate || endDate >= new Date()) && !isEventFull(event);
  };

  const activeRsvpFor = (eventId: string) => {
    const rsvp = myRsvpsByEvent[eventId];
    return rsvp && rsvp.durum !== 'IPTAL_EDILDI' ? rsvp : null;
  };

  const canWithdrawRsvp = (event: Etkinlik, status: string) => {
    const endDate = event.bitisTarihi ? new Date(event.bitisTarihi) : event.baslangicTarihi ? new Date(event.baslangicTarihi) : null;
    return event.durum === 'YAYINLANDI' && status !== 'KATILDI' && (!endDate || endDate >= new Date());
  };

  const showQrTicket = async (event: Etkinlik, token?: string) => {
    if (!token) return;
    const dataUrl = await QRCode.toDataURL(JSON.stringify({ eventId: event.id, token }), {
      width: 360,
      margin: 2,
      color: {
        dark: '#111123',
        light: '#ffffff',
      },
    });
    setQrTicket({ event, dataUrl });
  };

  return (
    <div className="w-full py-6 space-y-6">
      <Link to={YOLLAR.kulupler} className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> Kulüplere dön
      </Link>

      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          <div className="space-y-5 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="w-24 h-24 shrink-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 border border-white/15 shadow-lg overflow-hidden flex items-center justify-center">
                {selectedClub.logoUrl ? (
                  <img src={selectedClub.logoUrl} alt={`${selectedClub.ad} logosu`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">{initials}</span>
                )}
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">{selectedClub.ad}</h1>
              </div>
            </div>
            {selectedClub.kisaAciklama && (
              <p className="text-lg text-indigo-100/75 leading-relaxed">{selectedClub.kisaAciklama}</p>
            )}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-indigo-200/80 mb-3">Vizyon</div>
              <p className="text-base text-white/50 leading-relaxed whitespace-pre-line">{vision}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-80 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/40">Üye sayısı</span>
                <span className="text-2xl font-black text-white">{selectedClub.uyeSayisi}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/40">Etkinlik sayısı</span>
                <span className="text-2xl font-black text-white">{selectedClub.etkinlikSayisi}</span>
              </div>
              {isStudent ? (
                <button
                  disabled={isLoading || selectedClub.mevcutKullaniciRol === 'YONETICI'}
                  onClick={handleMembershipClick}
                  className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-45 disabled:cursor-not-allowed group ${
                    selectedClub.mevcutKullaniciRol === 'YONETICI'
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                      : selectedClub.mevcutKullaniciDurum === 'AKTIF'
                        ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 hover:bg-red-500/15 hover:border-red-500/25 hover:text-red-100'
                        : 'gradient-btn'
                  }`}
                >
                  {selectedClub.mevcutKullaniciDurum === 'AKTIF' ? (
                    <>
                      <span className="group-hover:hidden">Üyesiniz</span>
                      <span className="hidden group-hover:inline">Üyelikten çık</span>
                    </>
                  ) : (
                    membershipButtonLabel
                  )}
                </button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs font-bold text-white/40">
                  Üyelik işlemleri yalnızca öğrenciler içindir.
                </div>
              )}
              <AnimatePresence>
                {isLeaveDialogOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
                  >
                    <p className="text-sm font-bold text-white mb-1">Üyelikten çıkılsın mı?</p>
                    <p className="text-xs text-white/45 leading-relaxed mb-3">
                      {selectedClub.ad} üyeliğin sonlandırılacak.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsLeaveDialogOpen(false)}
                        disabled={isLoading}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-white/70 bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] disabled:opacity-40"
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        onClick={confirmLeaveClub}
                        disabled={isLoading}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-red-500/75 border border-red-400/30 hover:bg-red-500 disabled:opacity-50"
                      >
                        {isLoading ? 'İşleniyor...' : 'Çık'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex gap-3">
                <UserRound className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-white/35 mb-1">Kulüp Başkanı</div>
                  <div className="text-sm font-bold text-white">{selectedClub.baskanAdSoyad || 'Bilgi bekleniyor'}</div>
                  <div className="text-xs text-white/35 mt-1 break-all">{selectedClub.baskanEposta || 'E-posta bekleniyor'}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex gap-3">
                <GraduationCap className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-white/35 mb-1">Danışman Akademisyen</div>
                  <div className="text-sm font-bold text-white">{selectedClub.danismanAdSoyad || 'Bilgi bekleniyor'}</div>
                  <div className="text-xs text-white/35 mt-1">{selectedClub.danismanBolumu || 'Birim bilgisi bekleniyor'}</div>
                  <div className="text-xs text-white/35 mt-1 break-all">{selectedClub.danismanEposta || 'E-posta bekleniyor'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Etkinlikler</h2>
              <p className="text-sm text-white/40">Aktif ve geçmiş kulüp etkinliklerini buradan takip et.</p>
            </div>
          </div>
          {(eventError || eventSuccess) && (
            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-bold ${eventSuccess ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border-red-400/20 bg-red-500/10 text-red-100'}`}>
              {eventSuccess || eventError}
            </div>
          )}
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1 mb-5">
            <button
              onClick={() => setEventFilter('active')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${eventFilter === 'active' ? 'bg-indigo-500 text-white' : 'text-white/45 hover:text-white'}`}
            >
              Aktif Etkinlikler
            </button>
            <button
              onClick={() => setEventFilter('past')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${eventFilter === 'past' ? 'bg-indigo-500 text-white' : 'text-white/45 hover:text-white'}`}
            >
              Geçmiş Etkinlikler
            </button>
          </div>

          <div className="space-y-3">
            {filteredEvents.map(event => (
              <article key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                {(() => {
                  const activeRsvp = activeRsvpFor(event.id);
                  return (
                <div className="grid grid-cols-1 xl:grid-cols-[8rem_1fr_auto] gap-4">
                  {event.afisResmiUrl && (
                    <button
                      type="button"
                      onClick={() => setExpandedPosterEvent(event)}
                      className="group relative w-full max-w-48 xl:max-w-none aspect-[297/420] rounded-2xl overflow-hidden border border-white/10 bg-white/[0.025]"
                      aria-label={`${event.baslik} afişini büyüt`}
                    >
                      <img src={event.afisResmiUrl} alt={event.baslik} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/45 group-hover:opacity-100">
                        <Maximize2 className="w-6 h-6" />
                      </span>
                    </button>
                  )}
                  <div className="space-y-4 min-w-0">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-200 border border-cyan-500/20">{event.etkinlikTuru === 'CEVRIMICI' ? 'Online' : 'Yüz yüze'}</span>
                        {event.sertifikaEtkin && <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-200 border border-indigo-500/20">Sertifikalı</span>}
                        {event.qrGirisEtkin && <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">QR yoklama</span>}
                        {event.ucretli && <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-200 border border-amber-500/20">Ücretli</span>}
                      </div>
                      <h3 className="text-xl font-black text-white leading-snug">{event.baslik}</h3>
                      <p className="text-sm text-white/55 whitespace-pre-line leading-relaxed">{event.aciklama}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-white/55">
                      <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2"><CalendarDays className="w-4 h-4 text-indigo-200" />Başlangıç: {formatDate(event.baslangicTarihi)}</span>
                      <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2"><Clock className="w-4 h-4 text-indigo-200" />Bitiş: {formatDate(event.bitisTarihi)}</span>
                      <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2"><MapPin className="w-4 h-4 text-cyan-200" />{event.etkinlikTuru === 'CEVRIMICI' ? event.cevrimiciPlatform || 'Online' : event.konumAdi || event.konum || 'Lokasyon bekleniyor'}</span>
                      <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2"><Users className="w-4 h-4 text-cyan-200" />{event.kontenjanSiniriVar || event.kontenjanSinirli ? `${event.mevcutRsvpSayisi}/${event.kontenjan} kayıt` : `${event.mevcutRsvpSayisi} kayıt`}</span>
                    </div>

                    {event.sertifikaEtkin && event.sertifikaBasligi && (
                      <p className="rounded-2xl border border-indigo-400/15 bg-indigo-500/10 px-4 py-3 text-xs font-semibold text-indigo-100">
                        Sertifika: {event.sertifikaBasligi}
                      </p>
                    )}

                    {event.etkinlikTuru === 'CEVRIMICI' && event.cevrimiciToplantiUrl && (
                      <a href={event.cevrimiciToplantiUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-cyan-100 bg-cyan-500/10 border border-cyan-400/20 hover:bg-cyan-500/15">
                        <LinkIcon className="w-3.5 h-3.5" />
                        Online etkinliğe git
                      </a>
                    )}

                    {event.etkinlikTuru === 'YUZ_YUZE' && event.enlem && event.boylam && (
                      <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.025] max-w-2xl">
                        <iframe
                          title={`${event.baslik} konumu`}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.boylam - 0.004}%2C${event.enlem - 0.004}%2C${event.boylam + 0.004}%2C${event.enlem + 0.004}&layer=mapnik&marker=${event.enlem}%2C${event.boylam}`}
                          className="w-full h-44 border-0"
                        />
                        <div className="px-3 py-2 text-xs text-white/45 space-y-1">
                          <p>{event.konumAdi || event.konum}</p>
                          {event.konumDetayi && <p>{event.konumDetayi}</p>}
                        </div>
                      </div>
                    )}

                    {event.ucretli && (
                      <div className="rounded-2xl border border-amber-300/15 bg-amber-500/10 p-3 text-xs text-amber-50/80">
                        <div className="font-black flex items-center gap-2"><Banknote className="w-4 h-4" />Ücretli etkinlik: {event.ucretTutari || 0} TL</div>
                        {event.iban && <div className="mt-1 break-all">IBAN: {event.iban}</div>}
                        {event.odemeTalimatlari && <div className="mt-1">{event.odemeTalimatlari}</div>}
                      </div>
                    )}
                  </div>

                  <div className="xl:w-44 space-y-2">
                    {!isStudent ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs font-bold text-white/40">
                        Etkinlik katılımı yalnızca öğrenciler içindir.
                      </div>
                    ) : activeRsvp ? (
                      <>
                        {event.qrGirisEtkin && activeRsvp.yoklamaBelirteci && (
                          <button
                            type="button"
                            onClick={() => showQrTicket(event, activeRsvp.yoklamaBelirteci)}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-emerald-100 bg-emerald-500/15 border border-emerald-400/20 hover:bg-emerald-500/25"
                          >
                            <Ticket className="w-4 h-4" />
                            QR Biletim
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={eventActionLoading || isManager || !canWithdrawRsvp(event, activeRsvp.durum)}
                          onClick={() => handleEventRegistrationCancel(event.id)}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-red-100 bg-red-500/15 border border-red-400/20 hover:bg-red-500/25 disabled:opacity-45 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                          Kaydı Geri Çek
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={!isEventRegisterable(event) || eventActionLoading || isManager}
                        onClick={() => handleEventRegistration(event.id)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white gradient-btn disabled:opacity-45 disabled:cursor-not-allowed"
                      >
                        <Ticket className="w-4 h-4" />
                        {event.ucretli ? 'Kayıt Ol' : 'Etkinliğe Katıl'}
                      </button>
                    )}
                    {activeRsvp?.durum === 'ODEME_BEKLIYOR' && <p className="text-xs text-amber-100/75 text-center">Ödeme onayı bekliyor.</p>}
                    {activeRsvp?.durum === 'ONAYLANDI' && <p className="text-xs text-emerald-100/75 text-center">Kaydın kesinleşti.</p>}
                    {activeRsvp?.durum === 'KATILDI' && <p className="text-xs text-cyan-100/75 text-center">Katılımın işaretlendi.</p>}
                    {isManager && <p className="text-xs text-white/35 text-center">Yöneticisi olduğun etkinliğe kayıt alınmaz.</p>}
                    {isEventFull(event) && <p className="text-xs text-amber-100 text-center">Kontenjan dolu.</p>}
                    {event.ucretli && !activeRsvp && <p className="text-xs text-amber-100/75 text-center">Kayıt, ödeme onayı sonrası kesinleşir.</p>}
                    {event.durum !== 'YAYINLANDI' && <p className="text-xs text-white/35 text-center">Etkinlik yayında değil.</p>}
                  </div>
                </div>
                  );
                })()}
              </article>
            ))}
            {filteredEvents.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/35">
                Bu filtrede etkinlik görünmüyor.
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 space-y-4">
          <h2 className="text-2xl font-extrabold text-white">Kulüp Duyuruları</h2>
          <div className="space-y-3">
            <div className="flex gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <Megaphone className="w-5 h-5 text-indigo-300 shrink-0" />
              <div><div className="text-sm font-bold text-white">Yeni duyuru alanı hazırlanıyor</div><p className="text-xs text-white/40 mt-1">Kulüp yönetimi yakında duyurularını bu alandan paylaşabilecek.</p></div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <Bell className="w-5 h-5 text-cyan-300 shrink-0" />
              <div><div className="text-sm font-bold text-white">Etkinlik hatırlatmaları</div><p className="text-xs text-white/40 mt-1">Aktif etkinlikler ve önemli tarih bildirimleri burada listelenecek.</p></div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <CalendarDays className="w-5 h-5 text-emerald-300 shrink-0" />
              <div><div className="text-sm font-bold text-white">Toplantı ve başvuru duyuruları</div><p className="text-xs text-white/40 mt-1">Kulüp toplantıları, başvuru dönemleri ve özel çağrılar burada görünecek.</p></div>
            </div>
          </div>
        </aside>
      </section>

      <AnimatePresence>
        {qrTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setQrTicket(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#111123] p-5 shadow-2xl"
              onClick={event => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setQrTicket(null)}
                className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/[0.06] p-2 text-white/80 hover:text-white"
                aria-label="QR bileti kapat"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="pr-12">
                <h3 className="text-xl font-black text-white">QR Bilet</h3>
                <p className="mt-1 text-sm text-white/45">{qrTicket.event.baslik}</p>
              </div>
              <div className="mt-5 rounded-3xl bg-white p-4">
                <img src={qrTicket.dataUrl} alt={`${qrTicket.event.baslik} QR bileti`} className="w-full" />
              </div>
              <p className="mt-4 text-xs text-white/45 leading-relaxed">
                Bu QR yalnızca senin kaydına özeldir. Etkinlik girişinde kulüp yöneticisine okut.
              </p>
            </motion.div>
          </motion.div>
        )}

        {expandedPosterEvent?.afisResmiUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setExpandedPosterEvent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative max-h-[92vh] max-w-[min(92vw,720px)]"
              onClick={event => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setExpandedPosterEvent(null)}
                className="absolute -right-3 -top-3 z-10 rounded-full border border-white/15 bg-[#111123] p-2 text-white/80 hover:text-white"
                aria-label="Afişi kapat"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={expandedPosterEvent.afisResmiUrl} alt={expandedPosterEvent.baslik} className="max-h-[92vh] w-auto rounded-2xl border border-white/10 object-contain shadow-2xl" />
              <div className="mt-3 rounded-2xl border border-white/10 bg-[#111123]/95 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  {expandedPosterEvent.baslik}
                </div>
                <p className="mt-1 text-xs text-white/45">{formatDate(expandedPosterEvent.baslangicTarihi)}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
