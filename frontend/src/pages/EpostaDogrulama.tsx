import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useKimlikDeposu } from '../depolar/kimlikDeposu';
import { Mail, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export const EpostaDogrulama = () => {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { user, verifyEmail, resendVerification, isLoading, error, successMessage, clearError, clearSuccess, logout } = useKimlikDeposu();
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    // İlk yüklemede doğrulama kodu gönder
    resendVerification();
    setCountdown(60);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    clearError(); clearSuccess();
    await verifyEmail(user.eposta, code);
  };

  const handleResend = async () => {
    clearError(); clearSuccess();
    const ok = await resendVerification();
    if (ok) setCountdown(60);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510] relative overflow-hidden">
      <div className="absolute bottom-[-15%] left-[-8%] w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,210,255,0.15) 0%, transparent 70%)' }} />
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(138,43,226,0.2) 0%, transparent 70%)' }} />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-3xl p-8 relative z-10"
        style={{ background: 'rgba(12,12,30,0.65)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 0 80px rgba(99,102,241,0.05)' }}>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">E-posta Doğrulama 📧</h2>
          <p className="text-white/40 text-sm">
            <span className="text-indigo-400 font-semibold">{user?.eposta}</span> adresine 6 haneli doğrulama kodu gönderdik.
          </p>
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
          <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} maxLength={6}
            className="w-full px-4 py-4 rounded-xl text-white placeholder:text-white/20 outline-none text-center tracking-[0.5em] font-mono text-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.07)' }} placeholder="000000" />

          <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} disabled={isLoading || code.length !== 6} type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Doğrula'}
          </motion.button>
        </form>

        <div className="mt-4 flex items-center justify-between">
          <button onClick={handleResend} disabled={countdown > 0 || isLoading}
            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> {countdown > 0 ? `Tekrar gönder (${countdown}s)` : 'Kodu tekrar gönder'}
          </button>
          <button onClick={logout} className="text-sm text-white/30 hover:text-white/50 transition-colors cursor-pointer">Çıkış Yap</button>
        </div>
      </motion.div>
    </div>
  );
};
