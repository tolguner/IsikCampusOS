import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Pencil, XCircle } from 'lucide-react';
import type { KulupProfilDegisiklikIstegi } from '../../store/clubStore';
import { inputClass } from './ortak';

interface ProfileRequestsModuleProps {
  profileChangeRequests: KulupProfilDegisiklikIstegi[];
  clubsLoading: boolean;
  approveProfileChangeRequest: (requestId: string) => void;
  handleProfileChangeRevision: (requestId: string) => void;
  handleProfileChangeReject: (requestId: string) => void;
  revisionTextByProfileRequest: Record<string, string>;
  setRevisionTextByProfileRequest: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const ProfilTalepModulu = ({
  profileChangeRequests,
  clubsLoading,
  approveProfileChangeRequest,
  handleProfileChangeRevision,
  handleProfileChangeReject,
  revisionTextByProfileRequest,
  setRevisionTextByProfileRequest,
}: ProfileRequestsModuleProps) => (
  <section className="space-y-4">
    {profileChangeRequests.map(request => (
      <motion.article key={request.id} layout className="rounded-2xl p-5 bg-white/[0.035] border border-white/5">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-5">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-white">{request.kulup.ad}</h3>
              <span className="rounded-full px-2.5 py-1 text-xs font-bold text-purple-200 bg-purple-500/10">{request.durum}</span>
              <span className="text-xs text-white/35">{new Date(request.olusturulmaTarihi).toLocaleString('tr-TR')}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="text-xs font-black uppercase tracking-wide text-white/35 mb-3">Mevcut Profil</div>
                <div className="space-y-2 text-sm">
                  <div className="font-bold text-white">{request.kulup.ad}</div>
                  <p className="text-white/45">{request.kulup.kisaAciklama || 'Kısa açıklama yok.'}</p>
                  <p className="text-white/35 line-clamp-4">{request.kulup.vizyon || request.kulup.aciklama}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-purple-400/20 bg-purple-500/[0.06] p-4">
                <div className="text-xs font-black uppercase tracking-wide text-purple-200/75 mb-3">Talep Edilen Profil</div>
                <div className="space-y-2 text-sm">
                  <div className="font-bold text-white">{request.ad}</div>
                  <p className="text-white/55">{request.kisaAciklama}</p>
                  <p className="text-white/45 line-clamp-4">{request.vizyon}</p>
                  {request.logoUrl && <p className="text-xs text-purple-100/75 break-all">Logo güncellemesi var.</p>}
                </div>
              </div>
            </div>

            {request.geriBildirim && (
              <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Son SKS notu: {request.geriBildirim}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => approveProfileChangeRequest(request.id)}
              disabled={clubsLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors disabled:opacity-45"
            >
              <CheckCircle2 className="w-4 h-4" />
              Onayla ve Yayınla
            </button>
            <textarea
              value={revisionTextByProfileRequest[request.id] || ''}
              onChange={e => setRevisionTextByProfileRequest(prev => ({ ...prev, [request.id]: e.target.value }))}
              placeholder="Revizyon veya red gerekçesi"
              rows={4}
              className={`${inputClass} resize-none focus:border-amber-400/60`}
            />
            <button
              type="button"
              onClick={() => handleProfileChangeRevision(request.id)}
              disabled={clubsLoading || !revisionTextByProfileRequest[request.id]?.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-amber-100 bg-amber-500/15 hover:bg-amber-500/25 transition-colors disabled:opacity-45"
            >
              <Pencil className="w-4 h-4" />
              Revizyon İste
            </button>
            <button
              type="button"
              onClick={() => handleProfileChangeReject(request.id)}
              disabled={clubsLoading || !revisionTextByProfileRequest[request.id]?.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-red-100 bg-red-500/15 hover:bg-red-500/25 transition-colors disabled:opacity-45"
            >
              <XCircle className="w-4 h-4" />
              Reddet
            </button>
          </div>
        </div>
      </motion.article>
    ))}
    {!clubsLoading && profileChangeRequests.length === 0 && (
      <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center text-white/35">
        Şu anda bekleyen kulüp profil talebi yok.
      </div>
    )}
  </section>
);
