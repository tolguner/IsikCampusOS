import { useEffect, useState } from 'react';
import { useRezervasyonDeposu, type Rezervasyon } from '../depolar/rezervasyonDeposu';
import { MesajBildirimi } from '../components/ortak/MesajBildirimi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock,
  Clock,
  Users,
  MapPin,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

const panelStyle = {
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
};

export const RezervasyonlarimSayfasi = () => {
  const { myBookings, isLoading, error, successMessage, fetchMyBookings, cancelBooking, clearMessages } = useRezervasyonDeposu();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  // Modals state
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Rezervasyon | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  useEffect(() => {
    fetchMyBookings();
    return () => {
      clearMessages();
    };
  }, [fetchMyBookings, clearMessages]);

  const handleCancelSubmit = async () => {
    if (!selectedBookingForCancel) return;
    const ok = await cancelBooking(selectedBookingForCancel.id, cancelReason);
    if (ok) {
      setSelectedBookingForCancel(null);
      setCancelReason('');
    }
  };

  const formatDateTime = (isoStr: string) => {
    const d = new Date(isoStr);
    const date = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  // Filter bookings — süresi geçmiş ya da iptal/sonlanmış olanlar "geçmiş" sayılır
  const now = new Date();
  const filteredBookings = myBookings.filter((booking) => {
    const isPast = ['TAMAMLANDI', 'IPTAL_EDILDI', 'GELMEDI'].includes(booking.durum)
      || new Date(booking.bitisTarihi) < now;
    return activeTab === 'active' ? !isPast : isPast;
  });

  return (
    <div className="space-y-6 text-white pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Tesis Rezervasyonlarım</h1>
          <p className="mt-2 text-sm text-white/45 leading-relaxed">
            Aktif kampüs rezervasyonlarınızı görüntüleyin veya iptal edin.
          </p>
        </div>
      </div>

      <MesajBildirimi hata={error} basari={successMessage} onKapat={clearMessages} />

      {/* Tabs Layout */}
      <div className="flex gap-2 border-b border-white/5 pb-px">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition ${
            activeTab === 'active'
              ? 'border-cyan-300 text-cyan-200'
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          Aktif Rezervasyonlar ({myBookings.filter(b => !(['TAMAMLANDI', 'IPTAL_EDILDI', 'GELMEDI'].includes(b.durum) || new Date(b.bitisTarihi) < now)).length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition ${
            activeTab === 'past'
              ? 'border-cyan-300 text-cyan-200'
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          Geçmiş / İptaller ({myBookings.filter(b => ['TAMAMLANDI', 'IPTAL_EDILDI', 'GELMEDI'].includes(b.durum) || new Date(b.bitisTarihi) < now).length})
        </button>
      </div>

      {isLoading ? (
        <div className="text-white/40 text-sm font-semibold py-12 text-center">Yükleniyor...</div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const start = formatDateTime(booking.baslangicTarihi);
            const end = formatDateTime(booking.bitisTarihi);
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl p-5"
                style={panelStyle}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-black">{booking.tesisAd}</span>
                      {booking.tesisAd !== booking.kaynakAd && (
                        <span className="text-sm font-semibold text-white/60">/ {booking.kaynakAd}</span>
                      )}
                      <StatusBadge status={booking.durum} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs font-bold text-white/50 pt-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-300/60" />
                        <span>Tesis Birimi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-cyan-300/60" />
                        <span>{start.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-cyan-300/60" />
                        <span>{start.time} - {end.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-300/60" />
                        <span>{booking.katilimciSayisi} Katılımcı</span>
                      </div>
                    </div>

                    {booking.amac && (
                      <p className="text-xs text-white/40 bg-[#111123] px-3.5 py-2.5 rounded-xl border border-white/5 inline-block mt-2">
                        <strong className="text-white/60">Kullanım Amacı:</strong> {booking.amac}
                      </p>
                    )}

                    {booking.durum === 'IPTAL_EDILDI' && booking.iptalNedeni && (
                      <p className="text-xs text-red-300/70 bg-red-500/5 px-3.5 py-2.5 rounded-xl border border-red-500/10 inline-block mt-2">
                        <strong className="text-red-400/80">İptal Nedeni:</strong> {booking.iptalNedeni}
                      </p>
                    )}
                  </div>

                  {/* Actions area */}
                  {activeTab === 'active' && booking.durum !== 'IPTAL_EDILDI' && (
                    <div className="flex flex-wrap gap-2 sm:self-center shrink-0">
                      <button
                        onClick={() => setSelectedBookingForCancel(booking)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        İptal Et
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filteredBookings.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 px-4 py-16 text-center">
              <CalendarClock className="h-10 w-10 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/35 font-semibold">Bu kategoride rezervasyonunuz bulunmuyor.</p>
            </div>
          )}
        </div>
      )}

      {/* Cancellation Modal */}
      <AnimatePresence>
        {selectedBookingForCancel && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl p-6 space-y-6 relative text-white"
              style={panelStyle}
            >
              <button
                onClick={() => setSelectedBookingForCancel(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Rezervasyonu İptal Et</h3>
                  <p className="text-xs text-white/40">Bu işlem geri alınamaz</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs leading-relaxed text-white/60">
                  <strong>
                    {selectedBookingForCancel.tesisAd}
                    {selectedBookingForCancel.tesisAd !== selectedBookingForCancel.kaynakAd && ` - ${selectedBookingForCancel.kaynakAd}`}
                  </strong>
                  <br />
                  rezervasyonunu iptal etmek istediğinize emin misiniz? İptal politikası gereği, son dakikalardaki iptaller puanınızı etkileyebilir.
                </p>

                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
                    İPTAL GEREKÇESİ
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Ders saatim değişti"
                    className="w-full rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-red-400/60"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubmit}
                  disabled={!cancelReason.trim()}
                  className="flex-1 px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Evet, İptal Et
                </button>
                <button
                  onClick={() => {
                    setSelectedBookingForCancel(null);
                    setCancelReason('');
                  }}
                  className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 font-bold text-sm transition cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge = ({ status }: { status: Rezervasyon['durum'] }) => {
  const colors: Record<Rezervasyon['durum'], string> = {
    TASLAK: 'bg-white/5 text-white/50 border border-white/10',
    BEKLEMEDE: 'bg-amber-400/10 text-amber-200 border border-amber-400/20',
    ONAYLANDI: 'bg-cyan-400/10 text-cyan-200 border border-cyan-400/20',
    IPTAL_EDILDI: 'bg-red-500/10 text-red-200 border border-red-500/20',
    TAMAMLANDI: 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20',
    GELMEDI: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    BLOKE: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
  };

  const labels: Record<Rezervasyon['durum'], string> = {
    TASLAK: 'Taslak',
    BEKLEMEDE: 'Onay Bekliyor',
    ONAYLANDI: 'Onaylandı',
    IPTAL_EDILDI: 'İptal Edildi',
    TAMAMLANDI: 'Kullanıldı',
    GELMEDI: 'Gelmedi',
    BLOKE: 'Takım Antrenmanı / Bloke',
  };

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};
