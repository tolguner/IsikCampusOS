import React from 'react';
import { motion } from 'framer-motion';
import { Banknote, CheckCircle2, Clock, Link as LinkIcon, MapPin, Users, XCircle } from 'lucide-react';
import type { Etkinlik } from '../../store/etkinlikDeposu';
import { inputClass } from './ortak';

interface EtkinlikModuluProps {
  reviewQueue: Etkinlik[];
  eventsLoading: boolean;
  formatEventDate: (value?: string) => string;
  eventLocationLabel: (event: Etkinlik) => string;
  approveEvent: (id: string) => void;
  handleRevision: (event: Etkinlik) => void;
  revisionTextByEvent: Record<string, string>;
  setRevisionTextByEvent: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const EtkinlikModulu = ({
  reviewQueue,
  eventsLoading,
  formatEventDate,
  eventLocationLabel,
  approveEvent,
  handleRevision,
  revisionTextByEvent,
  setRevisionTextByEvent,
}: EtkinlikModuluProps) => (
  <section className="space-y-5">
    <div className="space-y-4">
      {reviewQueue.map(event => (
        <motion.div key={event.id} layout className="rounded-3xl p-5 bg-white/[0.035] border border-white/5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-white">{event.baslik}</h3>
                <span className="rounded-full px-3 py-1 text-xs font-black text-purple-100 bg-purple-500/15 border border-purple-300/20">
                  {event.kulup?.ad || 'Kulüp bilgisi yok'}
                </span>
                <span className="rounded-full px-3 py-1 text-xs font-black text-cyan-100 bg-cyan-500/10 border border-cyan-300/15">
                  {event.etkinlikTuru === 'CEVRIMICI' ? 'Online' : 'Yüz yüze'}
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="text-xs font-black uppercase tracking-wide text-white/35 mb-2">Etkinlik açıklaması</div>
                <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{event.aciklama || 'Açıklama belirtilmedi.'}</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[12rem_1fr] gap-4">
                {event.afisResmiUrl ? (
                  <img src={event.afisResmiUrl} alt={event.baslik} className="w-full max-w-xs xl:max-w-none aspect-[297/420] object-cover rounded-2xl border border-white/10 bg-white/[0.025]" />
                ) : (
                  <div className="w-full max-w-xs xl:max-w-none aspect-[297/420] rounded-2xl border border-white/10 bg-white/[0.025] flex items-center justify-center text-xs font-bold text-white/30">
                    Afiş yok
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/35 mb-3">
                      <Clock className="w-4 h-4 text-indigo-200" />
                      Zaman
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-3"><span className="text-white/40">Başlangıç</span><strong className="text-white text-right">{formatEventDate(event.baslangicTarihi)}</strong></div>
                      <div className="flex justify-between gap-3"><span className="text-white/40">Bitiş</span><strong className="text-white text-right">{formatEventDate(event.bitisTarihi)}</strong></div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/35 mb-3">
                      <MapPin className="w-4 h-4 text-emerald-200" />
                      Konum
                    </div>
                    <div className="space-y-2 text-sm text-white/60">
                      <p className="font-bold text-white">{eventLocationLabel(event)}</p>
                      {event.etkinlikTuru === 'CEVRIMICI' && event.cevrimiciToplantiUrl && (
                        <a href={event.cevrimiciToplantiUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-100 hover:text-cyan-50 break-all">
                          <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                          {event.cevrimiciToplantiUrl}
                        </a>
                      )}
                      {event.etkinlikTuru === 'YUZ_YUZE' && (
                        <>
                          <p>{event.konumDetayi || 'Konum detayı belirtilmedi.'}</p>
                          {event.enlem && event.boylam && <p className="text-xs text-white/35">{event.enlem}, {event.boylam}</p>}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/35 mb-3">
                      <Users className="w-4 h-4 text-cyan-200" />
                      Katılım
                    </div>
                    <div className="space-y-2 text-sm text-white/60">
                      <div className="flex justify-between gap-3"><span>Kontenjan</span><strong className="text-white">{event.kontenjanSiniriVar || event.kontenjanSinirli ? `${event.kontenjan} kişi` : 'Sınırsız'}</strong></div>
                      <div className="flex justify-between gap-3"><span>QR yoklama</span><strong className="text-white">{event.qrGirisEtkin ? 'Açık' : 'Kapalı'}</strong></div>
                      <div className="flex justify-between gap-3"><span>Sertifika</span><strong className="text-white">{event.sertifikaEtkin ? event.sertifikaBasligi || 'Açık' : 'Kapalı'}</strong></div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/35 mb-3">
                      <Banknote className="w-4 h-4 text-amber-200" />
                      Ücret ve ödeme
                    </div>
                    {event.ucretli ? (
                      <div className="space-y-2 text-sm text-amber-50/80">
                        <div className="font-black">{event.ucretTutari || 0} TL</div>
                        <p className="break-all">IBAN: {event.iban || 'Belirtilmedi'}</p>
                        <p>{event.odemeTalimatlari || 'Ödeme açıklaması yok.'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-white/55">Ücretsiz etkinlik.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {event.hatirlaticiEtkin && <span className="rounded-full px-3 py-1 text-xs font-bold bg-cyan-500/10 text-cyan-200">Hatırlatma: {event.hatirlatmaZamanlariDakika || 'Planlandı'}</span>}
                {event.redNedeni && <span className="rounded-full px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-200">Önceki SKS notu var</span>}
              </div>
              {event.redNedeni && <p className="mt-3 text-sm text-amber-200">Son geri bildirim: {event.redNedeni}</p>}
            </div>

            <div className="w-full lg:w-72 space-y-3">
              <button onClick={() => approveEvent(event.id)} type="button" className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
                Onayla
              </button>
              <textarea
                value={revisionTextByEvent[event.id] || ''}
                onChange={e => setRevisionTextByEvent(prev => ({ ...prev, [event.id]: e.target.value }))}
                placeholder="Düzenleme isteği geri bildirimi"
                rows={3}
                className={`${inputClass} resize-none focus:border-amber-400/60`}
              />
              <button onClick={() => handleRevision(event)} type="button" className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-amber-100 bg-amber-500/15 hover:bg-amber-500/25 transition-colors">
                <XCircle className="w-4 h-4" />
                Düzenleme İste
              </button>
            </div>
          </div>
        </motion.div>
      ))}
      {!eventsLoading && reviewQueue.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center text-white/35">
          Şu anda bekleyen etkinlik talebi yok.
        </div>
      )}
    </div>
  </section>
);
