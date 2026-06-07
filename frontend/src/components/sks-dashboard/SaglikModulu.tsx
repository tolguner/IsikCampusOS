import React from 'react';
import { CheckCircle2, Power, Users } from 'lucide-react';
import type { KulupSaglik, DenetimGunlugu } from '../../store/clubStore';
import { panelStyle, inputClass } from './ortak';

interface SaglikModuluProps {
  totalClubCount: number;
  activeClubCount: number;
  inactiveClubCount: number;
  clubHealth: KulupSaglik[];
  clubAuditLogsByClub: Record<string, DenetimGunlugu[]>;
  healthMessageByClub: Record<string, string>;
  setHealthMessageByClub: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  healthLogSearchByClub: Record<string, string>;
  setHealthLogSearchByClub: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  addClubHealthNote: (clubId: string, message: string) => void;
  watchlistClub: (clubId: string, message: string) => void;
  requestClubHealthAction: (clubId: string, message: string) => void;
  fetchClubAuditLogs: (clubId: string, filters?: { search?: string }) => void;
}

export const SaglikModulu = ({
  totalClubCount,
  activeClubCount,
  inactiveClubCount,
  clubHealth,
  clubAuditLogsByClub,
  healthMessageByClub,
  setHealthMessageByClub,
  healthLogSearchByClub,
  setHealthLogSearchByClub,
  addClubHealthNote,
  watchlistClub,
  requestClubHealthAction,
  fetchClubAuditLogs,
}: SaglikModuluProps) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-3xl p-5 flex items-center justify-between gap-4" style={panelStyle}>
        <div>
          <div className="text-3xl font-black text-white">{totalClubCount}</div>
          <div className="text-xs font-semibold text-white/40 mt-1">Toplam kulüp</div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 text-indigo-200">
          <Users className="w-6 h-6" />
        </div>
      </div>

      <div className="rounded-3xl p-5 flex items-center justify-between gap-4" style={panelStyle}>
        <div>
          <div className="text-3xl font-black text-white">{activeClubCount}</div>
          <div className="text-xs font-semibold text-white/40 mt-1">Aktif kulüp</div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 text-emerald-200">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      <div className="rounded-3xl p-5 flex items-center justify-between gap-4" style={panelStyle}>
        <div>
          <div className="text-3xl font-black text-white">{inactiveClubCount}</div>
          <div className="text-xs font-semibold text-white/40 mt-1">Pasif kulüp</div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 text-amber-200">
          <Power className="w-6 h-6" />
        </div>
      </div>
    </div>

    <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {clubHealth.map(item => {
        const message = healthMessageByClub[item.kulupId] || '';
        const logSearch = healthLogSearchByClub[item.kulupId] || '';
        const logs = clubAuditLogsByClub[item.kulupId] || [];
        const statusClass =
          item.saglikDurumu === 'Sağlıklı'
            ? 'text-emerald-100 bg-emerald-500/15 border-emerald-300/20'
            : item.saglikDurumu === 'Takip Edilmeli'
              ? 'text-cyan-100 bg-cyan-500/15 border-cyan-300/20'
              : item.saglikDurumu === 'Riskli'
                ? 'text-amber-100 bg-amber-500/15 border-amber-300/20'
                : 'text-red-100 bg-red-500/15 border-red-300/20';
        return (
          <article key={item.kulupId} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-white">{item.kulupAdi}</h3>
                <p className="mt-1 text-xs text-white/40">{item.aktif ? 'Aktif kulüp' : 'Pasif kulüp'} · {item.uyeSayisi} üye</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass}`}>
                {item.saglikDurumu}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                <div className="text-xl font-black text-white">{item.gelecekEtkinlikSayisi}</div>
                <div className="text-[11px] text-white/35">Yaklaşan</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                <div className="text-xl font-black text-white">{item.onayBekleyenEtkinlikSayisi}</div>
                <div className="text-[11px] text-white/35">Bekleyen etkinlik</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                <div className="text-xl font-black text-white">{item.onayBekleyenProfilTalebiSayisi}</div>
                <div className="text-[11px] text-white/35">Profil talebi</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                <div className="text-sm font-black text-white">{item.sonEtkinlikTarihi ? new Date(item.sonEtkinlikTarihi).toLocaleDateString('tr-TR') : '-'}</div>
                <div className="text-[11px] text-white/35">Son etkinlik</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                <div className="text-sm font-black text-white">{item.sonDuyuruTarihi ? new Date(item.sonDuyuruTarihi).toLocaleDateString('tr-TR') : '-'}</div>
                <div className="text-[11px] text-white/35">Son duyuru</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                <div className="text-sm font-black text-white">{item.katilimOrtalamasi.toFixed(1)}</div>
                <div className="text-[11px] text-white/35">Ort. katılım</div>
              </div>
            </div>

            {item.sonNot && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/55">
                {item.sonNot}
              </p>
            )}

            <textarea
              value={message}
              onChange={e => setHealthMessageByClub(prev => ({ ...prev, [item.kulupId]: e.target.value }))}
              placeholder="Gözlem notu veya kulüp yöneticisine gönderilecek aksiyon mesajı"
              className={`${inputClass} min-h-24 resize-none`}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button type="button" onClick={() => addClubHealthNote(item.kulupId, message)} className="rounded-2xl px-3 py-2.5 text-xs font-black text-indigo-100 bg-indigo-500/15 hover:bg-indigo-500/25">Not Ekle</button>
              <button type="button" onClick={() => watchlistClub(item.kulupId, message)} className="rounded-2xl px-3 py-2.5 text-xs font-black text-amber-100 bg-amber-500/15 hover:bg-amber-500/25">Takibe Al</button>
              <button type="button" onClick={() => requestClubHealthAction(item.kulupId, message)} className="rounded-2xl px-3 py-2.5 text-xs font-black text-cyan-100 bg-cyan-500/15 hover:bg-cyan-500/25">Aksiyon İste</button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  value={logSearch}
                  onChange={e => setHealthLogSearchByClub(prev => ({ ...prev, [item.kulupId]: e.target.value }))}
                  placeholder="Kulüp loglarında ara"
                  className={`${inputClass} py-2.5`}
                />
                <button type="button" onClick={() => fetchClubAuditLogs(item.kulupId, { search: logSearch })} className="rounded-2xl px-4 py-2.5 text-xs font-black text-white/70 bg-white/[0.06] hover:bg-white/[0.1]">
                  Logları Aç
                </button>
              </div>
              {logs.slice(0, 4).map(log => (
                <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black text-purple-100">{log.islem}</span>
                    <span className="text-[11px] text-white/30">{new Date(log.olusturulmaTarihi).toLocaleString('tr-TR')}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/50">{log.mesaj}</p>
                </div>
              ))}
              {logs.length === 0 && <p className="text-xs text-white/35">Kulüp loglarını görmek için Logları Aç.</p>}
            </div>
          </article>
        );
      })}
      {clubHealth.length === 0 && (
        <p className="xl:col-span-2 rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-white/40">
          Sağlık verisi bulunamadı.
        </p>
      )}
    </section>
  </div>
);
