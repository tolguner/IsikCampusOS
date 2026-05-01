import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Home, Calendar, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, logout, user } = useAuthStore();

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
            <Link to="/" className="p-2.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" title="Ana Sayfa">
              <Home className="w-5 h-5 text-white/40 hover:text-white/70" />
            </Link>
            <Link to="/" className="p-2.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" title="Etkinlikler">
              <Calendar className="w-5 h-5 text-white/40 hover:text-white/70" />
            </Link>
            <Link to="/" className="p-2.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" title="Kontrol Paneli">
              <LayoutDashboard className="w-5 h-5 text-white/40 hover:text-white/70" />
            </Link>

            {isAuthenticated && user && (
              <>
                <div className="w-px h-6 self-center mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                
                <div className="relative group">
                  <div className="flex items-center gap-3 p-1.5 pr-3 rounded-full cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg border border-white/10">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <span className="text-sm font-medium text-white/90">{user.fullName}</span>
                  </div>

                  {/* Dropdown Menu (Hover) */}
                  <div className="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                    <div className="w-52 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10"
                         style={{ background: 'rgba(12, 12, 24, 0.98)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                      <div className="p-2 flex flex-col gap-1">
                        <Link to="/profile" className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left">
                          Profil
                        </Link>
                        <Link to="/settings" className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-left">
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
            className="rounded-3xl p-8 min-h-[80vh]"
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
