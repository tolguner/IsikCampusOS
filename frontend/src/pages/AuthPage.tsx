import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Loader2, AlertCircle, Eye, EyeOff,
  Calendar, BookOpen, ArrowRight, CheckCircle2, Zap,
  Car, Utensils, Briefcase, FolderKanban, Info, KeyRound, BadgeCheck
} from 'lucide-react';

type AuthMode = 'login' | 'forgot' | 'reset';

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const { login, forgotPassword, resetPassword, isLoading, error, successMessage, clearError, clearSuccess } = useAuthStore();
  const navigate = useNavigate();

  const resetForm = () => {
    setEmail(''); setPassword(''); setShowPassword(false);
    setResetCode(''); setNewPassword(''); setConfirmNewPassword('');
    clearError(); clearSuccess();
  };

  const switchMode = (newMode: AuthMode) => { resetForm(); setMode(newMode); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      const ok = await login(email, password);
      if (ok) navigate('/');
    } else if (mode === 'forgot') {
      const ok = await forgotPassword(email);
      if (ok) setMode('reset');
    } else if (mode === 'reset') {
      if (newPassword !== confirmNewPassword) return;
      const ok = await resetPassword(email, resetCode, newPassword);
      if (ok) setTimeout(() => switchMode('login'), 2000);
    }
  };

  const modules = [
    { icon: Calendar, title: 'Akıllı Etkinlik Motoru', desc: 'Kulüp etkinliklerini oluştur, SKS onayı al, RSVP topla ve katılımı takip et.', color: 'from-violet-500 to-purple-600', tag: 'Etkinlikler' },
    { icon: BookOpen, title: 'Tesis Rezervasyonu', desc: 'Derslik, spor salonu ve toplantı odalarını çakışmasız şekilde rezerve et.', color: 'from-cyan-500 to-blue-600', tag: 'Tesisler' },
    { icon: Utensils, title: 'Kampüs Yemek Merkezi', desc: 'Kampüs içi işletmelerden ön sipariş ver, sıra beklemeden teslim al.', color: 'from-orange-500 to-red-500', tag: 'Yemek' },
    { icon: Car, title: 'Kampüs Yolculuk', desc: 'Kampüs-şehir arası güvenli araç paylaşımı ile yolculuk eşleşmesi yap.', color: 'from-emerald-500 to-teal-600', tag: 'Yolculuk' },
    { icon: FolderKanban, title: 'Proje Eşleştirme', desc: 'Beceri profiline göre proje ekipleri bul, davet gönder ve takım kur.', color: 'from-pink-500 to-rose-600', tag: 'Projeler' },
    { icon: Briefcase, title: 'Mikro İş Pazarı', desc: 'Kampüs içi küçük işleri ilan et, teklif al, teslim et ve puanla.', color: 'from-amber-500 to-orange-600', tag: 'İş İlanları' },
  ];

  const stats = [
    { value: '5,000+', label: 'Aktif Öğrenci' },
    { value: '120+', label: 'Etkinlik / Yıl' },
    { value: '45+', label: 'Öğrenci Kulübü' },
    { value: '6', label: 'Ana Modül' },
  ];

  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.07)' };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050510]">
      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060818] via-[#0A0C27] to-[#070716]" />
        <div className="absolute bottom-[-15%] left-[-8%] w-[700px] h-[700px] rounded-full animate-float" style={{ background: 'radial-gradient(circle, rgba(0,210,255,0.35) 0%, rgba(0,150,255,0.15) 40%, transparent 70%)' }} />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full animate-float-reverse" style={{ background: 'radial-gradient(circle, rgba(138,43,226,0.45) 0%, rgba(100,40,200,0.18) 40%, transparent 70%)' }} />
        <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] rounded-full animate-pulse-glow" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-30 mx-5 mt-5 px-6 py-3.5 rounded-3xl flex justify-between items-center" style={{ background: 'rgba(10, 10, 25, 0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <img src="/isik-ikon.png" alt="Işık Üniversitesi İkon" className="w-7 h-7 object-contain" />
          <div>
            <span className="font-bold text-lg text-white">Işık<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">CampusOS</span></span>
            <p className="text-[11px] text-white/40 -mt-0.5">Kampüs İşletim Sistemi</p>
          </div>
        </motion.div>
        <div className="flex items-center gap-3">
          <img src="/isik-logo.png" alt="Işık Üniversitesi" className="h-6 object-contain" />
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex min-h-[calc(100vh-88px)] items-center px-6 lg:px-16 py-8">
        {/* LEFT — Platform Showcase */}
        <div className="hidden lg:flex flex-col flex-1 pr-12 xl:pr-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <div className="mb-6"><img src="/isik-logo.png" alt="Işık Üniversitesi" className="h-10 object-contain" /></div>
            <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
              Kampüs Hayatını<br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">Yeniden Keşfet</span>
            </h1>
            <p className="text-white/45 text-lg max-w-xl mb-10 leading-relaxed">
              6 entegre modülle etkinliklerden tesis rezervasyonlarına, yemek siparişlerinden araç paylaşımına kadar kampüs deneyimini tek platformda dijitalleştir.
            </p>
          </motion.div>
          <div className="grid grid-cols-3 gap-3 mb-10 max-w-2xl">
            {modules.map((mod, index) => (
              <motion.div key={mod.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + index * 0.08, duration: 0.5 }}
                className="group p-4 rounded-2xl cursor-default transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <mod.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{mod.tag}</span>
                </div>
                <h3 className="font-bold text-white text-[13px] mb-1 leading-tight">{mod.title}</h3>
                <p className="text-white/35 text-[11px] leading-relaxed">{mod.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }} className="flex gap-8 xl:gap-10">
            {stats.map((stat) => (<div key={stat.label}><div className="text-2xl font-extrabold text-white">{stat.value}</div><div className="text-xs text-white/30 mt-1">{stat.label}</div></div>))}
          </motion.div>
        </div>

        {/* RIGHT — Auth Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full lg:w-[440px] xl:w-[460px] flex-shrink-0 rounded-3xl p-8 sm:p-9 relative overflow-hidden mx-auto lg:mx-0"
          style={{ background: 'rgba(12, 12, 30, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 0 80px rgba(99,102,241,0.05), 0 32px 64px rgba(0,0,0,0.4)' }}>
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />

          <div className="relative z-10">
            {/* Header */}
            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.25 }} className="mb-7">
                <div className="flex items-center gap-2 mb-3">
                  {mode === 'login' && <Zap className="w-4 h-4 text-amber-400" />}
                  {mode === 'forgot' && <Mail className="w-4 h-4 text-cyan-400" />}
                  {mode === 'reset' && <KeyRound className="w-4 h-4 text-emerald-400" />}
                  <span className="text-[11px] font-semibold text-white/35 uppercase tracking-widest">
                    {mode === 'login' && 'Giriş Yap'}
                    {mode === 'forgot' && 'Şifremi Unuttum'}
                    {mode === 'reset' && 'Şifre Sıfırla'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-[28px] font-extrabold text-white mb-1.5">
                  {mode === 'login' && 'Hoş Geldin 👋'}
                  {mode === 'forgot' && 'Şifreni mi Unuttun? 🔑'}
                  {mode === 'reset' && 'Yeni Şifre Belirle 🔐'}
                </h2>
                <p className="text-white/35 text-sm">
                  {mode === 'login' && 'Kampüs hayatına devam etmek için giriş yap.'}
                  {mode === 'forgot' && 'Üniversite e-posta adresine sıfırlama kodu göndereceğiz.'}
                  {mode === 'reset' && 'E-postana gelen kodu gir ve yeni şifreni belirle.'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3.5 rounded-2xl flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" /><p className="text-sm font-medium text-red-400">{error}</p>
                </motion.div>
              )}
              {successMessage && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3.5 rounded-2xl flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /><p className="text-sm font-medium text-emerald-400">{successMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} onSubmit={handleSubmit} className="space-y-4">
                {/* Email — login & forgot */}
                {(mode === 'login' || mode === 'forgot') && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-white/60 ml-1">Üniversite E-postası</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-[18px] w-[18px] text-white/25" /></div>
                      <input id="email-input" type="email" required value={email} onChange={(e) => { setEmail(e.target.value); clearError(); clearSuccess(); }}
                        className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder:text-white/20 outline-none transition-all text-sm"
                        style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="ornek@isik.edu.tr" />
                    </div>
                  </div>
                )}

                {/* Password — login only */}
                {mode === 'login' && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-white/60 ml-1">Şifre</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-[18px] w-[18px] text-white/25" /></div>
                      <input id="password-input" type={showPassword ? 'text' : 'password'} required minLength={6} value={password}
                        onChange={(e) => { setPassword(e.target.value); clearError(); }}
                        className="w-full pl-11 pr-12 py-3 rounded-xl text-white placeholder:text-white/20 outline-none transition-all text-sm"
                        style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/25 hover:text-white/50 transition-colors cursor-pointer">
                        {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reset code + new password */}
                {mode === 'reset' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-white/60 ml-1">Doğrulama Kodu</label>
                      <input type="text" required value={resetCode} onChange={(e) => setResetCode(e.target.value)} maxLength={6}
                        className="w-full px-4 py-3 rounded-xl text-white placeholder:text-white/20 outline-none transition-all text-sm text-center tracking-[0.5em] font-mono text-lg"
                        style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="000000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-white/60 ml-1">Yeni Şifre</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-[18px] w-[18px] text-white/25" /></div>
                        <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder:text-white/20 outline-none transition-all text-sm"
                          style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Yeni şifreniz" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-white/60 ml-1">Yeni Şifre Tekrar</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-[18px] w-[18px] text-white/25" /></div>
                        <input type="password" required minLength={6} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder:text-white/20 outline-none transition-all text-sm"
                          style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Tekrar girin" />
                      </div>
                      {confirmNewPassword && newPassword !== confirmNewPassword && <p className="text-xs text-red-400 ml-1">Şifreler eşleşmiyor</p>}
                    </div>
                  </>
                )}

                {/* Forgot link — login mode only */}
                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => switchMode('forgot')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer">Şifremi unuttum</button>
                  </div>
                )}

                {/* Submit */}
                <motion.button whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.985 }}
                  disabled={isLoading || (mode === 'reset' && newPassword !== confirmNewPassword)} type="submit" id="auth-submit-btn"
                  className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>
                    {mode === 'login' && 'Giriş Yap'}
                    {mode === 'forgot' && 'Kod Gönder'}
                    {mode === 'reset' && 'Şifreyi Sıfırla'}
                    <ArrowRight className="w-4 h-4" />
                  </>)}
                </motion.button>
              </motion.form>
            </AnimatePresence>

            {/* Mode switches */}
            <div className="mt-5 text-center">
              {mode === 'login' && (
                <div className="flex items-center gap-2 justify-center p-3 rounded-xl mt-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                  <p className="text-[11px] text-white/40 text-left">Bu sistem Işık Üniversitesi mensuplarına özeldir. Hesap bilgileriniz için <span className="text-indigo-400 font-semibold">Öğrenci İşleri</span>'ne başvurun.</p>
                </div>
              )}
              {mode === 'login' && (
                <Link to="/certificates/verify" className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-purple-200 hover:text-purple-100 transition-colors">
                  <BadgeCheck className="w-4 h-4" />
                  Sertifika Kodu Kontrolü
                </Link>
              )}
              {(mode === 'forgot' || mode === 'reset') && (
                <p className="text-sm text-white/35 mt-3">
                  <button onClick={() => switchMode('login')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors cursor-pointer">← Giriş ekranına dön</button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
