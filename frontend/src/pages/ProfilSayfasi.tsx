import React, { useEffect, useState, useRef } from 'react';
import { useKimlikDeposu } from '../depolar/kimlikDeposu';
import { useProfilDeposu } from '../depolar/profilDeposu';
import { motion, AnimatePresence } from 'framer-motion';
import { useMesajOtomatikKapat } from '../kancalar/useMesajOtomatikKapat';
import { yetkilerdenBiriVarMi, YETKI_GRUPLARI, YETKILER } from '../yardimcilar/yetkiler';
import { 
  User, Mail, GraduationCap, Building2, Calendar, 
  Camera, Lock, CheckCircle2, AlertCircle, Loader2,
  ShieldCheck, MapPin, Phone
} from 'lucide-react';

export const ProfilSayfasi = () => {
  const { user, changePassword, isLoading } = useKimlikDeposu();
  const {
    profile,
    changeRequests,
    isLoading: profileLoading,
    error: profileError,
    successMessage: profileSuccess,
    fetchMyProfile,
    fetchMyChangeRequests,
    updateMyProfile,
    requestProfileChange,
    clearMessages: clearProfileMessages,
  } = useProfilDeposu();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profilePic, setProfilePic] = useState<string | null>(null);
  
  // Local state for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [changeField, setChangeField] = useState('phoneNumber');
  const [phoneCountryCode, setPhoneCountryCode] = useState('TR');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [residenceAddress, setResidenceAddress] = useState('');
  const [bloodType, setBloodType] = useState('A Rh+');
  const changeFieldOptions = [
    { value: 'phoneNumber', label: 'Telefon' },
    { value: 'residenceAddress', label: 'İkametgah' },
    { value: 'bloodType', label: 'Kan grubu' },
  ];
  const bloodTypeOptions = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'];
  const phoneCountryOptions = [
    { code: 'TR', label: 'Türkiye', dialCode: '+90', digits: 10, placeholder: '5XXXXXXXXX', startsWith: ['5'] },
    { code: 'US', label: 'ABD / Kanada', dialCode: '+1', digits: 10, placeholder: '5551234567' },
    { code: 'GB', label: 'Birleşik Krallık', dialCode: '+44', digits: 10, placeholder: '7XXXXXXXXX', startsWith: ['7'] },
    { code: 'DE', label: 'Almanya', dialCode: '+49', minDigits: 10, maxDigits: 11, placeholder: '15123456789' },
    { code: 'FR', label: 'Fransa', dialCode: '+33', digits: 9, placeholder: '612345678', startsWith: ['6', '7'] },
  ];

  useMesajOtomatikKapat(passError, () => setPassError(''));
  useMesajOtomatikKapat(passSuccess, () => setPassSuccess(''));

  useEffect(() => {
    if (!user) return;
    fetchMyProfile();
    fetchMyChangeRequests();
  }, [fetchMyChangeRequests, fetchMyProfile, user]);

  if (!user) return null;

  const isStudent = yetkilerdenBiriVarMi(user.roller, YETKI_GRUPLARI.ogrenci);
  const isRegistrar = yetkilerdenBiriVarMi(user.roller, YETKI_GRUPLARI.ogrenciIsleri);
  const isAdmin = yetkilerdenBiriVarMi(user.roller, [YETKILER.SISTEM_YONETICISI]);

  const getRoleName = () => {
    if (isAdmin) return 'Sistem Yöneticisi';
    if (isRegistrar) return 'Öğrenci İşleri Personeli';
    if (isStudent) return 'Öğrenci';
    return 'Kullanıcı';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      clearProfileMessages();
      return;
    }

    if (file.size > 1_500_000) {
      clearProfileMessages();
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const imageUrl = String(reader.result || '');
      if (!imageUrl) return;
      setProfilePic(imageUrl);
      const ok = await updateMyProfile({ profilResmiUrl: imageUrl }, 'Profil fotoğrafın güncellendi.');
      if (!ok) {
        setProfilePic(null);
      }
    };
    reader.readAsDataURL(file);
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

  const displayValue = (value?: string | null) => value?.trim() || 'Kayıtlı bilgi yok';
  const maskedIdValue = profile?.tcKimlikMaskeli?.trim() || user.tcKimlikMaskeli?.trim() || 'Yetkili birim tarafından doğrulanmalı';
  const pendingChange = changeRequests.find(request => request.durum === 'BEKLEMEDE');
  const selectedPhoneCountry = phoneCountryOptions.find(country => country.code === phoneCountryCode) || phoneCountryOptions[0];
  const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');
  const isPhoneLengthValid = selectedPhoneCountry.digits
    ? normalizedPhoneNumber.length === selectedPhoneCountry.digits
    : normalizedPhoneNumber.length >= (selectedPhoneCountry.minDigits || 0) && normalizedPhoneNumber.length <= (selectedPhoneCountry.maxDigits || 99);
  const isPhonePrefixValid = !selectedPhoneCountry.startsWith || selectedPhoneCountry.startsWith.some(prefix => normalizedPhoneNumber.startsWith(prefix));
  const isPhoneValid = normalizedPhoneNumber.length > 0 && isPhoneLengthValid && isPhonePrefixValid;
  const phoneRuleText = selectedPhoneCountry.digits
    ? `${selectedPhoneCountry.digits} hane`
    : `${selectedPhoneCountry.minDigits}-${selectedPhoneCountry.maxDigits} hane`;
  const phoneValidationMessage =
    normalizedPhoneNumber.length === 0
      ? ''
      : !isPhoneLengthValid
        ? `${selectedPhoneCountry.label} için telefon numarası ${phoneRuleText} olmalı.`
        : !isPhonePrefixValid
          ? `${selectedPhoneCountry.label} mobil numarası ${selectedPhoneCountry.startsWith?.join(' veya ')} ile başlamalı.`
          : '';
  const requestedProfileValue =
    changeField === 'phoneNumber'
      ? `${selectedPhoneCountry.dialCode} ${normalizedPhoneNumber}`.trim()
      : changeField === 'residenceAddress'
        ? residenceAddress.trim()
        : bloodType;
  const canSubmitProfileChange =
    changeField === 'phoneNumber'
      ? isPhoneValid
      : requestedProfileValue.length > 0;

  const handleProfileChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitProfileChange) return;
    const ok = await requestProfileChange(changeField, requestedProfileValue);
    if (!ok) return;
    setPhoneNumber('');
    setResidenceAddress('');
  };

  return (
    <div className="w-full pb-10">
      
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
                {profilePic || profile?.profilResmiUrl ? (
                  <img src={profilePic || profile?.profilResmiUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user.ad?.[0]}{user.soyad?.[0]}</span>
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
                {user.tamAd}
                {user.epostaDogrulandi && <span title="Doğrulanmış Hesap"><ShieldCheck className="w-6 h-6 text-emerald-400" /></span>}
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
                  <p className="text-sm text-white/90 font-medium">{profile?.eposta || user.eposta}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Telefon</p>
                  <p className="text-sm text-white/90 font-medium">{displayValue(profile?.telefonNumarasi)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">TC Kimlik / Pasaport No</p>
                  <p className="text-sm text-white/90 font-medium font-mono">{maskedIdValue}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">İkametgah Adresi</p>
                  <p className="text-sm text-white/90 font-medium">{displayValue(profile?.ikametAdresi)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Kan Grubu</p>
                  <p className="text-sm text-white/90 font-medium">{displayValue(profile?.kanGrubu)}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleProfileChangeRequest} className="mt-5 pt-5 border-t border-white/5 space-y-3 overflow-hidden">
              <div>
                <p className="text-sm font-bold text-white">Bilgi değişikliği bildir</p>
                <p className="text-xs text-white/40 mt-1">Telefon, ikametgah ve kan grubu değişiklikleri yetkili onayına gönderilir.</p>
              </div>
              {(profileError || profileSuccess) && (
                <div className={`rounded-xl px-3 py-2 text-xs font-semibold ${profileSuccess ? 'text-emerald-200 bg-emerald-500/10 border border-emerald-400/20' : 'text-red-200 bg-red-500/10 border border-red-400/20'}`}>
                  {profileSuccess || profileError}
                </div>
              )}
              {pendingChange && (
                <div className="rounded-xl px-3 py-2 text-xs font-semibold text-amber-100 bg-amber-500/10 border border-amber-400/20">
                  Bekleyen talep: {pendingChange.talepEdilenDeger}
                </div>
              )}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.035] p-1.5">
                  {changeFieldOptions.map(option => {
                    const active = changeField === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          clearProfileMessages();
                          setChangeField(option.value);
                        }}
                        className={`min-h-10 rounded-xl px-2 text-xs font-bold transition-colors ${active ? 'bg-indigo-500/85 text-white shadow-lg shadow-indigo-500/15' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {changeField === 'phoneNumber' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[5.75rem_minmax(0,1fr)] gap-2">
                      <select
                        value={phoneCountryCode}
                        onChange={e => {
                          clearProfileMessages();
                          setPhoneCountryCode(e.target.value);
                        }}
                        className="w-full min-w-0 rounded-xl bg-white/[0.04] border border-white/10 px-2 py-2.5 text-sm font-bold text-white outline-none"
                        aria-label="Ülke kodu"
                      >
                        {phoneCountryOptions.map(country => (
                          <option key={country.code} value={country.code} className="bg-[#0f1123]">
                            {country.dialCode} {country.code}
                          </option>
                        ))}
                      </select>
                      <input
                        value={phoneNumber}
                        onChange={e => {
                          clearProfileMessages();
                          setPhoneNumber(e.target.value.replace(/[^\d\s()-]/g, ''));
                        }}
                        required
                        className="w-full min-w-0 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                        placeholder={selectedPhoneCountry.placeholder}
                        inputMode="tel"
                        maxLength={(selectedPhoneCountry.maxDigits || selectedPhoneCountry.digits || 12) + 4}
                      />
                    </div>
                    <div className={`rounded-xl border px-3 py-2 text-xs font-semibold ${phoneValidationMessage ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-white/10 bg-white/[0.025] text-white/40'}`}>
                      {phoneValidationMessage || `${selectedPhoneCountry.label}: ${selectedPhoneCountry.dialCode} alan kodu, ${phoneRuleText}.`}
                    </div>
                  </div>
                )}
                {changeField === 'residenceAddress' && (
                  <textarea
                    value={residenceAddress}
                    onChange={e => {
                      clearProfileMessages();
                      setResidenceAddress(e.target.value);
                    }}
                    required
                    rows={3}
                    className="w-full resize-none rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                    placeholder="Mahalle, cadde/sokak, ilçe ve şehir bilgisi"
                  />
                )}
                {changeField === 'bloodType' && (
                  <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.035] p-1.5">
                    {bloodTypeOptions.map(option => {
                      const active = bloodType === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            clearProfileMessages();
                            setBloodType(option);
                          }}
                          className={`min-h-10 rounded-xl px-2 text-xs font-black transition-colors ${active ? 'bg-red-500/80 text-white shadow-lg shadow-red-500/15' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={profileLoading || !canSubmitProfileChange}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileLoading ? 'Gönderiliyor...' : 'Onaya gönder'}
              </button>
            </form>
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
                  <span className="text-sm font-semibold text-white font-mono">{user.ogrenciNumarasi || '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">Fakülte</span>
                  </div>
                  <span className="text-sm font-semibold text-white text-right max-w-[150px] truncate" title={user.fakulte || 'İİSBF'}>{user.fakulte || 'İİSBF'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">Bölüm</span>
                  </div>
                  <span className="text-sm font-semibold text-white text-right max-w-[150px] truncate" title={user.bolum || 'YBS (İngilizce)'}>{user.bolum || 'YBS (İng)'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-white/50" />
                    <span className="text-sm text-white/70">Kayıt Yılı</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{user.kayitYili || '2023'}</span>
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
