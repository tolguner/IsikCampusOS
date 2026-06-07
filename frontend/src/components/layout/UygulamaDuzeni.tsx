import React, { useEffect, useState } from 'react';
import { useKimlikDeposu } from '../../store/kimlikDeposu';
import { Bell, Building2, LayoutDashboard, Link as LinkIcon, ShieldCheck, UsersRound, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useBildirimDeposu } from '../../store/bildirimDeposu';
import { useKulupDeposu } from '../../store/kulupDeposu';
import { useProfilDeposu } from '../../store/profilDeposu';
import { yetkilerdenBiriVarMi, YETKI_GRUPLARI } from '../../utils/roles';
import { YOLLAR } from '../../utils/paths';

export const UygulamaDuzeni = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, logout, user } = useKimlikDeposu();
  const { bildirimler, okunmamisSayisi, bildirimleriGetir, okunduIsaretle } = useBildirimDeposu();
  const { managedClubs, fetchManagedClubs } = useKulupDeposu();
  const { profile, fetchMyProfile } = useProfilDeposu();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isStudent = yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.ogrenci);
  const isFacilityAdmin = yetkilerdenBiriVarMi(user?.roller, YETKI_GRUPLARI.tesisYonetimi);
  const isClubPresident = isStudent && managedClubs.length > 0;
  const userInitials = `${user?.ad?.[0] ?? ''}${user?.soyad?.[0] ?? ''}` ||
    user?.tamAd?.split(' ').map(part => part[0]).slice(0, 2).join('') ||
    '?';

  useEffect(() => {
    if (isAuthenticated) bildirimleriGetir();
  }, [isAuthenticated, bildirimleriGetir]);

  useEffect(() => {
    if (isAuthenticated && isStudent) fetchManagedClubs();
  }, [fetchManagedClubs, isAuthenticated, isStudent]);

  useEffect(() => {
    if (isAuthenticated && user) fetchMyProfile();
  }, [fetchMyProfile, isAuthenticated, user]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#050510]">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060818] via-[#0A0C27] to-[#070716]" />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-float"
             style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }} />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-float-reverse"
             style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[120px] animate-float"
             style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)' }} />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Navbar */}
        <nav className="relative z-50 mx-5 mt-5 px-6 py-3.5 rounded-3xl flex justify-between items-center"
             style={{ background: 'rgba(10, 10, 25, 0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src="/isik-ikon.png" alt="Işık Üniversitesi İkon" className="w-7 h-7 object-contain" />
            <div>
              <span className="font-bold text-lg text-white">
                Işık<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">CampusOS</span>
              </span>
              <p className="text-[11px] text-white/40 -mt-0.5">Kampüs İşletim Sistemi</p>
            </div>
          </motion.div>
          
          <div className="flex gap-2 items-center">
            <Link to="/" className="p-2.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" title="Kontrol Paneli">
              <LayoutDashboard className="w-5 h-5 text-white/40 hover:text-white/70" />
            </Link>
            <Link to={YOLLAR.kulupler} className="hidden md:flex p-2.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" title="Kulüpler">
              <UsersRound className="w-5 h-5 text-white/40 hover:text-white/70" />
            </Link>
            {isStudent && (
              <>
                <Link to={YOLLAR.tesisRezervasyon} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" title="Tesis Rezerve Et">
                  <Calendar className="w-5 h-5 text-white/40 hover:text-white/70" />
                </Link>
                <Link to={YOLLAR.rezervasyonlarim} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" title="Tesis Rezervasyonlarım">
                  <Building2 className="w-5 h-5 text-white/40 hover:text-white/70" />
                </Link>
              </>
            )}
            {isClubPresident && (
              <Link to={YOLLAR.kulupYonetimi} className="hidden md:flex p-2.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" title="Kulüp Yönetim Paneli">
                <ShieldCheck className="w-5 h-5 text-white/40 hover:text-white/70" />
              </Link>
            )}
            {isFacilityAdmin && (
              <Link to={YOLLAR.tesisYonetimi} className="hidden md:flex p-2.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" title="Tesis Yönetim Paneli">
                <Building2 className="w-5 h-5 text-white/40 hover:text-white/70" />
              </Link>
            )}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(prev => !prev)}
                className="relative p-2.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                title="Bildirimler"
                type="button"
              >
                <Bell className="w-5 h-5 text-white/40 hover:text-white/70" />
                {okunmamisSayisi > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-purple-500 border border-[#0c0c18] text-[10px] font-black leading-[16px] text-white text-center shadow-[0_0_16px_rgba(168,85,247,0.55)]">
                    {okunmamisSayisi > 99 ? '99+' : okunmamisSayisi}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-3 w-80 rounded-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[100]"
                     style={{ background: 'rgba(12, 12, 24, 0.98)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-white">Bildirimler</p>
                      {okunmamisSayisi > 0 && (
                        <span className="rounded-full bg-purple-500/20 border border-purple-300/25 px-2 py-1 text-[10px] font-black text-purple-100">
                          {okunmamisSayisi} okunmamış
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    {bildirimler.slice(0, 8).map(notification => (
                      <div
                        key={notification.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => okunduIsaretle(notification.id)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            okunduIsaretle(notification.id);
                          }
                        }}
                        className={`relative rounded-xl px-3 py-3 hover:bg-white/5 transition-colors cursor-pointer ${notification.okundu ? 'opacity-70' : 'bg-purple-500/[0.06] border border-purple-400/10'}`}
                      >
                        {!notification.okundu && (
                          <span className="absolute right-3 top-3 w-2 h-2 rounded-full bg-purple-300 shadow-[0_0_12px_rgba(216,180,254,0.7)]" />
                        )}
                        {notification.resimUrl && (
                          <img src={notification.resimUrl} alt={notification.baslik} className="mb-3 w-full h-28 object-cover rounded-xl border border-white/10" />
                        )}
                        <p className="text-sm font-semibold text-white/90">{notification.baslik}</p>
                        <p className="text-[11px] font-semibold text-white/35 mt-1">
                          Gönderen: <span className="text-white/55">{notification.olusturanAdi || (notification.tur === 'DUYURU' ? 'SKS Yönetimi' : 'Sistem')}</span>
                        </p>
                        <p className="text-xs text-white/45 mt-1 leading-relaxed">{notification.mesaj}</p>
                        {notification.baglantiUrl && (
                          <a
                            href={notification.baglantiUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => okunduIsaretle(notification.id)}
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-200 hover:text-cyan-100"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            {notification.baglantiEtiketi || 'Bağlantıyı aç'}
                          </a>
                        )}
                        <p className="text-[11px] text-white/30 mt-2">{new Date(notification.olusturulmaTarihi).toLocaleString('tr-TR')}</p>
                      </div>
                    ))}
                    {bildirimler.length === 0 && (
                      <p className="px-3 py-6 text-sm text-white/40 text-center">Yeni bildirim yok.</p>
                    )}
                  </div>
                  <div className="p-2 border-t border-white/10">
                    <Link
                      to={YOLLAR.bildirimler}
                      onClick={() => setNotificationsOpen(false)}
                      className="block w-full rounded-xl px-3 py-2.5 text-center text-sm font-bold text-purple-100 bg-purple-500/15 hover:bg-purple-500/25 transition-colors"
                    >
                      Tüm bildirimleri görüntüle
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated && user && (
              <>
                <div className="w-px h-6 self-center mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                
                <div className="relative group">
                  <div className="flex items-center gap-3 p-1.5 pr-3 rounded-full cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg border border-white/10 overflow-hidden">
                      {profile?.profilResmiUrl ? (
                        <img
                          src={profile.profilResmiUrl}
                          alt={user.tamAd || 'Profil'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{userInitials}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-white/90">{user.tamAd}</span>
                  </div>

                  {/* Dropdown Menu (Hover) */}
                  <div className="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                    <div className="w-52 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10"
                         style={{ background: 'rgba(12, 12, 24, 0.98)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                      <div className="p-2 flex flex-col gap-1">
                        <Link to={YOLLAR.profil} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left">
                          Profil
                        </Link>
                        <Link to={YOLLAR.ayarlar} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left">
                          Ayarlar
                        </Link>
                        <div className="h-px bg-white/10 my-1 mx-2" />
                        <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-colors cursor-pointer text-left">
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="w-px h-6 self-center mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <img src="/isik-logo.png" alt="Işık Üniversitesi" className="h-6 object-contain" />
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-5 pt-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-3xl p-4 sm:p-6 lg:p-8 min-h-[80vh]"
            style={{
              background: 'rgba(10, 10, 25, 0.45)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
