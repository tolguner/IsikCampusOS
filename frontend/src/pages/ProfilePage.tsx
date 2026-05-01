import React, { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, GraduationCap, Building2, Calendar, 
  Camera, Lock, CheckCircle2, AlertCircle, Loader2,
  ShieldCheck, MapPin, Phone
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, changePassword, isLoading } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for profile picture (UI only for now)
  const [profilePic, setProfilePic] = useState<string | null>(null);
  
  // Local state for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  if (!user) return null;

  const isStudent = user.roles.includes('ROLE_STUDENT');
  const isRegistrar = user.roles.includes('ROLE_REGISTRAR');
  const isAdmin = user.roles.includes('ROLE_ADMIN');

  const getRoleName = () => {
    if (isAdmin) return 'Sistem Yöneticisi';
    if (isRegistrar) return 'Öğrenci İşleri Personeli';
    if (isStudent) return 'Öğrenci';
    return 'Kullanıcı';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to server here.
      // For now, we just create a local object URL to preview it.
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword !== confirmPassword) {
      setPassError('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      const success = await changePassword(currentPassword, newPassword);
      if (success) {
        setPassSuccess('Şifreniz başarıyla güncellendi.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError('Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin.');
      }
    } catch (err: any) {
      setPassError(err.message || 'Bir hata oluştu.');
    }
  };

  const inputStyle = { 
    background: 'rgba(255,255,255,0.04)', 
    border: '1px solid rgba(255,255,255,0.08)' 
  };
  
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { 
    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; 
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; 
  };
  
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => { 
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; 
    e.currentTarget.style.boxShadow = 'none'; 
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* Banner & Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-8"
        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Abstract Banner Background */}
        <div className="h-48 w-full bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-indigo-900/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[200%] bg-indigo-500/20 blur-[80px] rounded-full mix-blend-screen"></div>
          <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-pink-500/20 blur-[80px] rounded-full mix-blend-screen"></div>
        </div>

        {/* Profile Info Section */}
        <div className="px-8 pb-8 pt-0 relative" style={{ background: 'rgba(15, 15, 30, 0.4)', backdropFilter: 'blur(20px)' }}>
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 relative z-10">
            
            {/* Avatar with Upload */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#0c0d1e] shadow-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white relative">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
                )}
                
                {/* Upload Overlay */}
                <div 
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-8 h-8 text-white mb-1" />
                  <span className="text-xs font-medium text-white">Değiştir</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Name and Role */}
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                {user.fullName}
                {user.emailVerified && <span title="Doğrulanmış Hesap"><ShieldCheck className="w-6 h-6 text-emerald-400" /></span>}
              </h1>
              <p className="text-indigo-300 font-medium mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {getRoleName()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info Cards */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* General Info Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-6"
            style={{ background: 'rgba(15, 15, 30, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" /> Kişisel ve İletişim
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Üniversite E-postası</p>
                  <p className="text-sm text-white/90 font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Telefon</p>
                  <p className="text-sm text-white/90 font-medium">+90 (555) 123 45 67</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">TC Kimlik / Pasaport No</p>
                  <p className="text-sm text-white/90 font-medium font-mono">12345******</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">İkametgah Adresi</p>
                  <p className="text-sm text-white/90 font-medium">Şile, İstanbul</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Kan Grubu</p>
                  <p className="text-sm text-white/90 font-medium">A Rh+</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Academic Info Card (Only for students) */}
          {isStudent && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl p-6"
              style={{ background: 'rgba(15, 15, 30, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-400" /> Akademik Durum
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">Öğrenci No</span>
                  </div>
                  <span className="text-sm font-semibold text-white font-mono">{user.studentNumber || '23yobi1001'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">Fakülte</span>
                  </div>
                  <span className="text-sm font-semibold text-white text-right max-w-[150px] truncate" title={user.faculty || 'İİSBF'}>{user.faculty || 'İİSBF'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">Bölüm</span>
                  </div>
                  <span className="text-sm font-semibold text-white text-right max-w-[150px] truncate" title={user.department || 'YBS (İngilizce)'}>{user.department || 'YBS (İng)'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">Kayıt Yılı</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{user.enrollmentYear || '2023'}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-emerald-400">3.45</span>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-semibold mt-1">GNO</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-blue-400">120</span>
                    <span className="text-[10px] uppercase tracking-wider text-blue-400/70 font-semibold mt-1">Kredi</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Settings & Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Activity Overview (Only for students) */}
          {isStudent && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'rgba(15, 15, 30, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
                <div className="text-3xl font-extrabold text-white mb-1">3</div>
                <p className="text-sm font-medium text-purple-300">Aktif Kulüp Üyeliği</p>
              </div>
              <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'rgba(15, 15, 30, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-500/10 rounded-full blur-xl"></div>
                <div className="text-3xl font-extrabold text-white mb-1">12</div>
                <p className="text-sm font-medium text-pink-300">Katılınan Etkinlik</p>
              </div>
              <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'rgba(15, 15, 30, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
                <div className="text-3xl font-extrabold text-white mb-1">5</div>
                <p className="text-sm font-medium text-emerald-300">Tesis Rezervasyonu</p>
              </div>
            </motion.div>
          )}
          
          {/* Password Change Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
            style={{ background: 'rgba(15, 15, 30, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none"></div>
            
            <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              Şifre Değiştir
            </h3>
            <p className="text-sm text-white/40 mb-6">
              Hesabınızın güvenliği için şifrenizi düzenli aralıklarla değiştirin.
            </p>

            <AnimatePresence>
              {passError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
                  <div className="p-3.5 rounded-xl flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" /><p className="text-sm font-medium text-red-400">{passError}</p>
                  </div>
                </motion.div>
              )}
              {passSuccess && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
                  <div className="p-3.5 rounded-xl flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /><p className="text-sm font-medium text-emerald-400">{passSuccess}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-white/60 ml-1">Mevcut Şifre</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-[18px] w-[18px] text-white/25" />
                  </div>
                  <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder:text-white/20 outline-none transition-all text-sm"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Mevcut şifreniz" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-white/60 ml-1">Yeni Şifre</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-[18px] w-[18px] text-white/25" />
                  </div>
                  <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder:text-white/20 outline-none transition-all text-sm"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="En az 6 karakter" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-white/60 ml-1">Yeni Şifre (Tekrar)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-[18px] w-[18px] text-white/25" />
                  </div>
                  <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder:text-white/20 outline-none transition-all text-sm"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Yeni şifrenizi doğrulayın" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="mt-6 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Şifreyi Güncelle'}
              </button>
            </form>
          </motion.div>

        </div>
      </div>

    </div>
  );
};
