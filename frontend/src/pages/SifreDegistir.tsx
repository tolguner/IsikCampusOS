import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useKimlikDeposu } from '../depolar/kimlikDeposu';
import { Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const SifreDegistir = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { changePassword, isLoading, error, successMessage, clearError, clearSuccess, logout } = useKimlikDeposu();

  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.07)' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    clearError(); clearSuccess();
    await changePassword(oldPassword, newPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510] relative overflow-hidden">
      <div className="absolute bottom-[-15%] left-[-8%] w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,210,255,0.15) 0%, transparent 70%)' }} />
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(138,43,226,0.2) 0%, transparent 70%)' }} />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-3xl p-8 relative z-10"
        style={{ background: 'rgba(12,12,30,0.65)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 0 80px rgba(99,102,241,0.05)' }}>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Şifre Değiştir 🔒</h2>
          <p className="text-white/40 text-sm">Güvenliğiniz için ilk girişte şifrenizi değiştirmeniz gerekmektedir.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" /><p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /><p className="text-sm text-emerald-400">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-white/60 ml-1">Mevcut Şifre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-[18px] w-[18px] text-white/25" /></div>
              <input type={showOld ? 'text' : 'password'} required value={oldPassword} onChange={(e) => { setOldPassword(e.target.value); clearError(); }}
                className="w-full pl-11 pr-12 py-3 rounded-xl text-white placeholder:text-white/20 outline-none text-sm" style={inputStyle} placeholder="TC Kimlik No veya mevcut şifreniz" />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/25 hover:text-white/50 cursor-pointer">
                {showOld ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-white/60 ml-1">Yeni Şifre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-[18px] w-[18px] text-white/25" /></div>
              <input type={showNew ? 'text' : 'password'} required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-xl text-white placeholder:text-white/20 outline-none text-sm" style={inputStyle} placeholder="En az 6 karakter" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/25 hover:text-white/50 cursor-pointer">
                {showNew ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-white/60 ml-1">Yeni Şifre Tekrar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-[18px] w-[18px] text-white/25" /></div>
              <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder:text-white/20 outline-none text-sm" style={inputStyle} placeholder="Tekrar girin" />
            </div>
            {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-red-400 ml-1">Şifreler eşleşmiyor</p>}
          </div>

          <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
            disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 6} type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Şifreyi Değiştir'}
          </motion.button>
        </form>

        <div className="mt-4 text-right">
          <button onClick={logout} className="text-sm text-white/30 hover:text-white/50 transition-colors cursor-pointer">Çıkış Yap</button>
        </div>
      </motion.div>
    </div>
  );
};
