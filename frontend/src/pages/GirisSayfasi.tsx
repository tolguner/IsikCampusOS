import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKimlikDeposu } from '../depolar/kimlikDeposu';
import { Link, useNavigate } from 'react-router-dom';
import { YOLLAR } from '../yardimcilar/yollar';
import { TemaDegistirici } from '../components/duzen/TemaDegistirici';
import {
  Mail, Lock, Loader2, AlertCircle, Eye, EyeOff,
  Calendar, BookOpen, ArrowRight, CheckCircle2, Zap,
  Car, Utensils, Briefcase, FolderKanban, Info, KeyRound, BadgeCheck, Sparkles, ShieldCheck
} from 'lucide-react';

type AuthMode = 'login' | 'forgot' | 'reset';

export const GirisSayfasi = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const { login, forgotPassword, resetPassword, isLoading, error, successMessage, clearError, clearSuccess } = useKimlikDeposu();
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
    { icon: Calendar, title: 'ClubHub', desc: 'Kulüp ve etkinlik yönetimi', color: 'from-violet-500 to-purple-600', status: 'Aktif' },
    { icon: BookOpen, title: 'SpotReserve', desc: 'Spor tesisleri rezervasyon sistemi', color: 'from-cyan-500 to-blue-600', status: 'Aktif' },
    { icon: Utensils, title: 'UniEats', desc: 'Kampüs çevrimiçi yemek siparişi', color: 'from-orange-500 to-red-500', status: 'Aktif' },
    { icon: Car, title: 'CampusRide', desc: 'Paylaşımlı yolculuk sistemi', color: 'from-emerald-500 to-teal-600', status: 'Aktif' },
    { icon: FolderKanban, title: 'ProjectMatch', desc: 'Proje eşleştirme sistemi', color: 'from-indigo-500 to-violet-600', status: 'Çok yakında' },
    { icon: Briefcase, title: 'MicroJob', desc: 'Kampüs içi mikro iş pazarı', color: 'from-pink-500 to-rose-600', status: 'Çok yakında' },
  ];

  const inputStyle = { background: 'var(--input-bg)', border: '1.5px solid var(--input-border)' };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = 'none'; };

  return (
    <div className="theme-page min-h-screen relative overflow-hidden bg-[#050510]">
      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="theme-app-gradient absolute inset-0 bg-gradient-to-br from-[#060818] via-[#0A0C27] to-[#070716]" />
        <div className="absolute bottom-[-15%] left-[-8%] w-[700px] h-[700px] rounded-full animate-float" style={{ background: 'radial-gradient(circle, var(--ambient-cyan-strong) 0%, var(--ambient-cyan-soft) 40%, transparent 70%)' }} />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full animate-float-reverse" style={{ background: 'radial-gradient(circle, var(--ambient-indigo-strong) 0%, var(--ambient-indigo-soft) 40%, transparent 70%)' }} />
        <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] rounded-full animate-pulse-glow" style={{ background: 'radial-gradient(circle, var(--ambient-pink-strong) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      </div>

      {/* NAVBAR */}
      <nav className="theme-nav relative z-30 mx-5 mt-5 px-6 py-3.5 rounded-3xl flex justify-between items-center" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link to={YOLLAR.tanitim} className="flex items-center gap-3 rounded-2xl outline-none transition hover:opacity-85 focus-visible:ring-2 focus-visible:ring-indigo-300">
          <img src="/isik-ikon.png" alt="Işık Üniversitesi İkon" className="w-7 h-7 object-contain" />
          <div>
            <span className="theme-text font-bold text-lg text-white">Işık<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">CampusOS</span></span>
            <p className="theme-muted text-[11px] text-white/40 -mt-0.5">Dijital Kampüs Platformu</p>
          </div>
          </Link>
        </motion.div>
        <div className="flex items-center gap-3">
          <TemaDegistirici />
          <img src="/isik-logo.png" alt="Işık Üniversitesi" className="h-6 object-contain" />
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex min-h-[calc(100vh-88px)] items-center px-6 lg:px-16 py-8">
        {/* LEFT — Platform Showcase */}
        <div className="hidden lg:flex flex-col flex-1 pr-12 xl:pr-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Işık Üniversitesi dijital kampüs platformu
            </div>
            <h1 className="text-5xl xl:text-7xl font-black text-white leading-[1.02] mb-5 tracking-normal">
              Kampüs artık<br />
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">tek işletim sistemi</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mb-7 leading-relaxed">
              ClubHub, SpotReserve, UniEats ve CampusRide aynı kimli ve aynı kullanıcı
              deneyimiyle birleşir. Işık CampusOS kampüs yaşamını tek platformda toplar.
            </p>
            <div className="mb-8 flex flex-wrap gap-3">
              <Link to={YOLLAR.tanitim} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100">
                Projeyi tanı
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Kapalı üniversite topluluğu
              </div>
            </div>
          </motion.div>

          <div className="mb-8 grid max-w-3xl grid-cols-3 gap-3">
            {modules.map((mod, index) => (
              <motion.div key={mod.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + index * 0.08, duration: 0.5 }}
                className="theme-card group relative min-h-[132px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.065]">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${mod.color}`} />
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${mod.color} shadow-lg shadow-black/20 transition-transform group-hover:scale-105`}>
                    <mod.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${mod.status === 'Aktif' ? 'bg-emerald-300/12 text-emerald-100' : 'bg-white/10 text-white/60'}`}>
                    {mod.status}
                  </span>
                </div>
                <h3 className="mb-1 text-lg font-black leading-tight text-white">{mod.title}</h3>
                <p className="text-xs font-semibold leading-5 text-white/45">{mod.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>

        {/* RIGHT — Auth Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full lg:w-[440px] xl:w-[460px] flex-shrink-0 rounded-3xl p-8 sm:p-9 relative overflow-hidden mx-auto lg:mx-0"
          style={{ background: 'var(--auth-card-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--auth-card-border)', boxShadow: 'var(--auth-card-shadow)' }}>
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
                <Link to={YOLLAR.sertifikaDogrula} className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-purple-200 hover:text-purple-100 transition-colors">
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
