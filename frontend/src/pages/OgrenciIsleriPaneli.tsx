import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useOgrenciDeposu } from '../depolar/ogrenciDeposu';
import { useProfilDeposu, type ProfilDegisiklikIstegi } from '../depolar/profilDeposu';
import { Search, Plus, MoreVertical, X, CheckCircle2, AlertCircle, Loader2, KeyRound, UserX, UserCheck, GraduationCap, Edit2, ChevronLeft, ChevronRight, ClipboardCheck, Trash2 } from 'lucide-react';

export const OgrenciIsleriPaneli = () => {
  const facultiesAndDepartments: Record<string, string[]> = {
    "İktisadi, İdari ve Sosyal Bilimler Fakültesi": [
      "Psikoloji (Türkçe)",
      "Psikoloji (İngilizce)",
      "Yönetim Bilişim Sistemleri (Türkçe)",
      "Yönetim Bilişim Sistemleri (İngilizce)",
      "İktisat (İngilizce)",
      "İşletme (İngilizce)",
      "Uluslararası İlişkiler (İngilizce)",
      "Uluslararası Ticaret ve Finansman (İngilizce)"
    ],
    "Mühendislik ve Doğa Bilimleri Fakültesi": [
      "Bilgisayar Mühendisliği (İngilizce)",
      "Biyomedikal Mühendisliği (İngilizce)",
      "Elektrik-Elektronik Mühendisliği (İngilizce)",
      "Endüstri Mühendisliği (İngilizce)",
      "İnşaat Mühendisliği (İngilizce)",
      "Makine Mühendisliği (İngilizce)",
      "Mekatronik Mühendisliği (İngilizce)",
      "Yazılım Mühendisliği (İngilizce)"
    ],
    "Sanat Tasarım ve Mimarlık Fakültesi": [
      "Görsel İletişim Tasarımı (Türkçe)",
      "İç Mimarlık ve Çevre Tasarımı (Türkçe)",
      "Sinema ve Televizyon (Türkçe)",
      "Endüstriyel Tasarım (Türkçe)",
      "İç Mimarlık ve Çevre Tasarımı (İngilizce)",
      "Mimarlık (İngilizce)"
    ],
    "Meslek Yüksekokulu": [
      "Ameliyathane Hizmetleri (Türkçe)",
      "Tıbbi Görüntüleme Teknikleri (Türkçe)",
      "İlk ve Acil Yardım (Türkçe)",
      "Anestezi (Türkçe)",
      "Tıbbi Laboratuvar Teknikleri (Türkçe)",
      "Optisyenlik (Türkçe)",
      "Bilgisayar Programcılığı (Türkçe)",
      "Bilişim Güvenliği Teknolojisi (Türkçe)",
      "Dış Ticaret (Türkçe)",
      "Grafik Tasarım (Türkçe)",
      "Fizyoterapi (Türkçe)"
    ],
    "Lisansüstü Eğitim Enstitüsü": [
      "Uygulamalı Ekonomi (Tezli)",
      "Uygulamalı Ekonomi (Tezsiz)",
      "İnşaat Mühendisliği (Tezli)",
      "İnşaat Mühendisliği (Tezsiz)",
      "Bilgisayar Mühendisliği (Tezli)",
      "Bilgisayar Mühendisliği (Tezsiz)",
      "Elektronik Mühendisliği (Tezli)",
      "Elektronik Mühendisliği (Tezsiz)",
      "Endüstri Mühendisliği (Tezli)",
      "Endüstri Mühendisliği (Tezsiz)",
      "Makine Mühendisliği (Tezli)",
      "Makine Mühendisliği (Tezsiz)",
      "Yöneticiler İçin MBA (Tezli)",
      "Yöneticiler İçin MBA (Tezsiz)",
      "Enformasyon Teknolojileri (Tezli)",
      "Enformasyon Teknolojileri (Tezsiz)",
      "Uluslararası İlişkiler (Tezli)",
      "Uluslararası İlişkiler (Tezsiz)",
      "Yönetim Bilişim Sistemleri (Tezsiz)",
      "Teknoloji ve İnovasyon Yönetimi (Tezsiz)",
      "Mimarlık ve Kent Çalışmaları (Türkçe, Tezli)",
      "Sanat Kuramı ve Eleştiri (Türkçe, Tezli)",
      "Sinema ve Televizyon (Türkçe, Tezsiz)",
      "Sinema ve Televizyon (Türkçe, Tezli)",
      "Siber Güvenlik (Türkçe, Tezsiz)",
      "Siber Güvenlik (Türkçe, Tezli)",
      "İç Mimarlık (Türkçe, Tezsiz)",
      "İç Mimarlık (Türkçe, Tezli)",
      "Peyzaj Mimarlığı (Türkçe, Tezsiz)",
      "Peyzaj Mimarlığı (Türkçe, Tezli)",
      "Görsel İletişim Tasarımı (Türkçe, Tezsiz)",
      "Görsel İletişim Tasarımı (Türkçe, Tezli)",
      "İşletme (İngilizce) (Doktora)",
      "Bilgisayar Mühendisliği (İngilizce) (Doktora)",
      "Elektronik Mühendisliği (İngilizce) (Doktora)",
      "Sanat Bilimi (Türkçe) (Doktora)"
    ]
  };


  const { students, totalElements, totalPages, currentPage, fetchStudents, createStudent, updateStudent, changeStatus, resetPassword, deleteStudent, isLoading, error, successMessage, clearMessages } = useOgrenciDeposu();
  const {
    pendingChangeRequests,
    fetchPendingChangeRequests,
    approveChangeRequest,
    rejectChangeRequest,
    isLoading: profileRequestLoading,
    error: profileRequestError,
    successMessage: profileRequestSuccess,
    clearMessages: clearProfileRequestMessages,
  } = useProfilDeposu();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [requestMenuOpenId, setRequestMenuOpenId] = useState<string | null>(null);

  // Add Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', studentNumber: '', tcKimlikNo: '', faculty: '', department: '', enrollmentYear: new Date().getFullYear(),
    phoneNumber: '', residenceAddress: '', bloodType: 'A Rh+'
  });

  // Reset department when faculty changes
  useEffect(() => {
    if (formData.faculty && facultiesAndDepartments[formData.faculty]) {
      setFormData(prev => ({ ...prev, department: facultiesAndDepartments[formData.faculty][0] }));
    } else {
      setFormData(prev => ({ ...prev, department: '' }));
    }
  }, [formData.faculty]);

  useEffect(() => {
    fetchStudents(0, 10, searchTerm, statusFilter);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchPendingChangeRequests();
  }, [fetchPendingChangeRequests]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createStudent(formData);
    if (ok) {
      setIsAddModalOpen(false);
      setFormData({ 
        firstName: '', lastName: '', studentNumber: '', tcKimlikNo: '', faculty: '', department: '', enrollmentYear: new Date().getFullYear(),
        phoneNumber: '', residenceAddress: '', bloodType: 'A Rh+'
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const ok = await updateStudent(editingId, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      faculty: formData.faculty,
      department: formData.department
    });
    if (ok) {
      setIsEditModalOpen(false);
      setEditingId(null);
    }
  };

  const openEditModal = (student: any) => {
    setFormData({
      firstName: student.ad,
      lastName: student.soyad,
      studentNumber: student.ogrenciNumarasi,
      tcKimlikNo: '',
      faculty: student.fakulte,
      department: student.bolum,
      enrollmentYear: student.kayitYili,
      phoneNumber: '',
      residenceAddress: '',
      bloodType: 'A Rh+'
    });
    setEditingId(student.id);
    setIsEditModalOpen(true);
    setActionMenuOpenId(null);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await changeStatus(id, newStatus);
    setActionMenuOpenId(null);
  };

  const handleResetPassword = async (id: string) => {
    const tc = prompt("Güvenlik onayı: Öğrencinin TC Kimlik Numarasını giriniz (Şifre bu numaraya sıfırlanacaktır):");
    if (tc && tc.length === 11) {
      await resetPassword(id, tc);
    } else if (tc) {
      alert("Geçersiz TC Kimlik Numarası!");
    }
    setActionMenuOpenId(null);
  };

  const handleDeleteStudent = async (id: string, fullName: string) => {
    const confirmDelete = window.confirm(`Öğrenciyi sistemden kalıcı olarak silmek istediğinize emin misiniz? (${fullName})`);
    if (confirmDelete) {
      const ok = await deleteStudent(id);
      if (ok) {
        setActionMenuOpenId(null);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'AKTIF': return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Aktif</span>;
      case 'PASIF': return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">Pasif</span>;
      case 'MEZUN': return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">Mezun</span>;
      case 'ILISIGI_KESILMIS': return <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20">İlişiği Kesilmiş</span>;
      default: return null;
    }
  };

  const getFieldLabel = (fieldName: string) => {
    if (fieldName === 'phoneNumber') return 'Telefon';
    if (fieldName === 'residenceAddress') return 'İkametgah';
    if (fieldName === 'bloodType') return 'Kan grubu';
    return fieldName;
  };

  const getStudentRequests = (studentId: string) =>
    pendingChangeRequests.filter(request => request.kullaniciId === studentId);

  const handleApproveProfileRequest = async (requestId: string) => {
    await approveChangeRequest(requestId);
    setRequestMenuOpenId(null);
  };

  const handleRejectProfileRequest = async (request: ProfilDegisiklikIstegi) => {
    const feedback = prompt(`${getFieldLabel(request.alanAdi)} talebini reddetme gerekçesi:`);
    if (feedback === null) return;
    await rejectChangeRequest(request.id, feedback);
    setRequestMenuOpenId(null);
  };

  const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in pb-10 mt-6 w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Öğrenci Yönetimi</h1>
          <p className="text-sm text-white/40">Sistemde kayıtlı toplam <span className="text-indigo-400 font-bold">{totalElements}</span> öğrenci bulunuyor.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg cursor-pointer transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Plus className="w-4 h-4" /> Yeni Öğrenci Ekle
        </button>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {(error || profileRequestError) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-400" /><p className="text-sm text-red-400 font-medium">{error || profileRequestError}</p></div>
            <button onClick={() => { clearMessages(); clearProfileRequestMessages(); }} className="text-red-400 hover:text-red-300"><X className="w-4 h-4"/></button>
          </motion.div>
        )}
        {(successMessage || profileRequestSuccess) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><p className="text-sm text-emerald-400 font-medium">{successMessage || profileRequestSuccess}</p></div>
            <button onClick={() => { clearMessages(); clearProfileRequestMessages(); }} className="text-emerald-400 hover:text-emerald-300"><X className="w-4 h-4"/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" placeholder="Öğrenci no, ad veya e-posta ile ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 outline-none" style={inputStyle} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="py-2.5 px-4 rounded-xl text-sm text-white outline-none cursor-pointer" style={inputStyle}>
          <option value="" className="bg-[#0f1123]">Tüm Durumlar</option>
          <option value="AKTIF" className="bg-[#0f1123]">Aktif</option>
          <option value="PASIF" className="bg-[#0f1123]">Pasif</option>
          <option value="MEZUN" className="bg-[#0f1123]">Mezun</option>
          <option value="ILISIGI_KESILMIS" className="bg-[#0f1123]">İlişiği Kesilmiş</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.01]">
        <div className="overflow-x-auto relative min-h-[400px] pb-48">
          {isLoading && students.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#050510]/50 backdrop-blur-sm"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40 bg-white/[0.02]">
                  <th className="px-6 py-4 font-semibold">Öğrenci</th>
                  <th className="px-6 py-4 font-semibold">Fakülte / Bölüm</th>
                  <th className="px-6 py-4 font-semibold">Kayıt Yılı</th>
                  <th className="px-6 py-4 font-semibold">Durum</th>
                  <th className="px-6 py-4 font-semibold">Talepler</th>
                  <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300 font-bold">
                          {student.ad[0]}{student.soyad[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{student.tamAd}</div>
                          <div className="text-xs text-white/40 flex items-center gap-2">
                            <span>{student.ogrenciNumarasi}</span> • <span>{student.eposta}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white/80">{student.bolum}</div>
                      <div className="text-xs text-white/30">{student.fakulte}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">{student.kayitYili}</td>
                    <td className="px-6 py-4">{getStatusBadge(student.durum)}</td>
                    <td className="px-6 py-4 relative">
                      {getStudentRequests(student.id).length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setRequestMenuOpenId(requestMenuOpenId === student.id ? null : student.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/15 transition-colors"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            {getStudentRequests(student.id).length} talep
                          </button>
                          <AnimatePresence>
                            {requestMenuOpenId === student.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setRequestMenuOpenId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                                  className="absolute left-6 top-14 z-50 w-80 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                                  style={{ background: 'rgba(15,15,30,0.98)', backdropFilter: 'blur(18px)' }}
                                >
                                  <div className="border-b border-white/10 px-4 py-3">
                                    <p className="text-sm font-black text-white">Profil değişiklik talepleri</p>
                                    <p className="text-xs text-white/35 mt-0.5">{student.tamAd}</p>
                                  </div>
                                  <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                                    {getStudentRequests(student.id).map(request => (
                                      <div key={request.id} className="rounded-xl border border-amber-400/15 bg-amber-500/[0.07] p-3">
                                        <div className="flex items-start gap-2">
                                          <ClipboardCheck className="w-4 h-4 text-amber-200 mt-0.5 shrink-0" />
                                          <div className="min-w-0">
                                            <p className="text-xs font-black text-amber-100">{getFieldLabel(request.alanAdi)}</p>
                                            <p className="text-xs text-white/45 mt-1">Mevcut: {request.mevcutDeger || 'Kayıtlı değil'}</p>
                                            <p className="text-xs text-white/85 mt-0.5 break-words">Yeni: {request.talepEdilenDeger}</p>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                          <button
                                            type="button"
                                            disabled={profileRequestLoading}
                                            onClick={() => handleApproveProfileRequest(request.id)}
                                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-100 bg-emerald-500/20 border border-emerald-400/20 hover:bg-emerald-500/30 disabled:opacity-50"
                                          >
                                            Onayla
                                          </button>
                                          <button
                                            type="button"
                                            disabled={profileRequestLoading}
                                            onClick={() => handleRejectProfileRequest(request)}
                                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-100 bg-red-500/20 border border-red-400/20 hover:bg-red-500/30 disabled:opacity-50"
                                          >
                                            Reddet
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <span className="text-xs text-white/25">Talep yok</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button onClick={() => setActionMenuOpenId(actionMenuOpenId === student.id ? null : student.id)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Action Menu Dropdown */}
                      <AnimatePresence>
                        {actionMenuOpenId === student.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpenId(null)} />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute right-6 top-14 w-48 rounded-xl shadow-xl z-50 overflow-hidden border border-white/10"
                              style={{ background: 'rgba(20,20,35,0.95)', backdropFilter: 'blur(16px)' }}>
                              <div className="p-1.5 flex flex-col gap-1">
                                <button onClick={() => openEditModal(student)} className="flex items-center gap-2 px-3 py-2 text-xs text-blue-400 hover:bg-white/5 rounded-lg w-full text-left cursor-pointer transition-colors"><Edit2 className="w-3.5 h-3.5"/> Düzenle</button>
                                {student.durum !== 'AKTIF' && <button onClick={() => handleStatusChange(student.id, 'AKTIF')} className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-white/5 rounded-lg w-full text-left cursor-pointer transition-colors"><UserCheck className="w-3.5 h-3.5"/> Aktif Yap</button>}
                                {student.durum !== 'MEZUN' && <button onClick={() => handleStatusChange(student.id, 'MEZUN')} className="flex items-center gap-2 px-3 py-2 text-xs text-purple-400 hover:bg-white/5 rounded-lg w-full text-left cursor-pointer transition-colors"><GraduationCap className="w-3.5 h-3.5"/> Mezun Yap</button>}
                                {student.durum !== 'PASIF' && <button onClick={() => handleStatusChange(student.id, 'PASIF')} className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/5 rounded-lg w-full text-left cursor-pointer transition-colors"><UserX className="w-3.5 h-3.5"/> Pasife Al</button>}
                                {student.durum !== 'ILISIGI_KESILMIS' && <button onClick={() => handleStatusChange(student.id, 'ILISIGI_KESILMIS')} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:bg-white/5 rounded-lg w-full text-left cursor-pointer transition-colors"><AlertCircle className="w-3.5 h-3.5"/> İlişiği Kes</button>}
                                <div className="h-px bg-white/10 my-1" />
                                <button onClick={() => handleResetPassword(student.id)} className="flex items-center gap-2 px-3 py-2 text-xs text-amber-400 hover:bg-white/5 rounded-lg w-full text-left cursor-pointer transition-colors"><KeyRound className="w-3.5 h-3.5"/> Şifreyi Sıfırla</button>
                                <button onClick={() => handleDeleteStudent(student.id, student.tamAd)} className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg w-full text-left cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5"/> Öğrenciyi Sil</button>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && !isLoading && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-white/30 text-sm">Arama kriterlerine uygun öğrenci bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-white/5 bg-white/[0.01] rounded-b-2xl">
            <button onClick={() => fetchStudents(currentPage - 1, 10, searchTerm, statusFilter)} disabled={currentPage === 0} className="px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-30 rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
              <ChevronLeft className="w-4 h-4" /> Önceki
            </button>
            <span className="text-sm text-white/50">Sayfa <span className="text-white font-semibold">{currentPage + 1}</span> / {totalPages}</span>
            <button onClick={() => fetchStudents(currentPage + 1, 10, searchTerm, statusFilter)} disabled={currentPage === totalPages - 1} className="px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-30 rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
              Sonraki <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {createPortal(
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl rounded-3xl p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
                style={{ background: 'rgba(15,15,30,0.95)', backdropFilter: 'blur(24px)' }}>
                
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Yeni Öğrenci Ekle</h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl text-white/40 hover:bg-white/10 transition-colors cursor-pointer"><X className="w-5 h-5"/></button>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-white/60 ml-1">Ad</label><input required type="text" value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-colors" style={inputStyle} placeholder="Örn: Ali" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-white/60 ml-1">Soyad</label><input required type="text" value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-colors" style={inputStyle} placeholder="Örn: Yılmaz" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-white/60 ml-1">TC Kimlik No</label><input required type="text" maxLength={11} minLength={11} value={formData.tcKimlikNo} onChange={e=>setFormData({...formData, tcKimlikNo: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-colors" style={inputStyle} placeholder="11 Haneli" /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-white/60 ml-1">Öğrenci No</label><input required type="text" value={formData.studentNumber} onChange={e=>setFormData({...formData, studentNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-colors" style={inputStyle} placeholder="Örn: 24yobi1234" /></div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-white/60 ml-1">Fakülte</label>
                      <select required value={formData.faculty} onChange={e=>setFormData({...formData, faculty: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-colors cursor-pointer" style={inputStyle}>
                        <option value="" disabled className="bg-[#0f1123]">Fakülte Seçiniz</option>
                        {Object.keys(facultiesAndDepartments).map(faculty => (
                          <option key={faculty} value={faculty} className="bg-[#0f1123]">{faculty}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-white/60 ml-1">Bölüm / Program</label>
                      <select required value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} disabled={!formData.faculty} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-colors cursor-pointer disabled:opacity-50" style={inputStyle}>
                        <option value="" disabled className="bg-[#0f1123]">Önce Fakülte Seçiniz</option>
                        {formData.faculty && facultiesAndDepartments[formData.faculty]?.map(dept => (
                          <option key={dept} value={dept} className="bg-[#0f1123]">{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2"><label className="text-xs font-semibold text-white/60 ml-1">Kayıt Yılı</label><input required type="number" min={2000} value={formData.enrollmentYear} onChange={e=>setFormData({...formData, enrollmentYear: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-colors" style={inputStyle} /></div>
                    
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-white/60 ml-1">Telefon Numarası</label><input type="text" value={formData.phoneNumber} onChange={e=>setFormData({...formData, phoneNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-colors" style={inputStyle} placeholder="Örn: 5XXXXXXXXX" /></div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/60 ml-1">Kan Grubu</label>
                      <select value={formData.bloodType} onChange={e=>setFormData({...formData, bloodType: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-colors cursor-pointer" style={inputStyle}>
                        {['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'].map(bt => (
                          <option key={bt} value={bt} className="bg-[#0f1123]">{bt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2"><label className="text-xs font-semibold text-white/60 ml-1">İkametgah Adresi</label><textarea value={formData.residenceAddress} onChange={e=>setFormData({...formData, residenceAddress: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 transition-colors" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Örn: Meşrutiyet Mh. Üniversite Sk. No: 2" /></div>
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/5 transition-colors cursor-pointer">İptal</button>
                    <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg cursor-pointer disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Öğrenciyi Kaydet'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Edit Modal */}
      {createPortal(
        <AnimatePresence>
          {isEditModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl rounded-3xl p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
                style={{ background: 'rgba(15,15,30,0.95)', backdropFilter: 'blur(24px)' }}>
                
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Öğrenci Bilgilerini Düzenle</h2>
                  <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-xl text-white/40 hover:bg-white/10 transition-colors cursor-pointer"><X className="w-5 h-5"/></button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-white/60 ml-1">Ad</label><input required type="text" value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-colors" style={inputStyle} /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-white/60 ml-1">Soyad</label><input required type="text" value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-colors" style={inputStyle} /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-white/60 ml-1">Öğrenci No (Değiştirilemez)</label><input disabled type="text" value={formData.studentNumber} className="w-full px-4 py-3 rounded-xl text-sm text-white/50 bg-white/5 outline-none cursor-not-allowed" style={inputStyle} /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-white/60 ml-1">Kayıt Yılı (Değiştirilemez)</label><input disabled type="number" value={formData.enrollmentYear} className="w-full px-4 py-3 rounded-xl text-sm text-white/50 bg-white/5 outline-none cursor-not-allowed" style={inputStyle} /></div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-white/60 ml-1">Fakülte</label>
                      <select required value={formData.faculty} onChange={e=>setFormData({...formData, faculty: e.target.value})} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-colors cursor-pointer" style={inputStyle}>
                        <option value="" disabled className="bg-[#0f1123]">Fakülte Seçiniz</option>
                        {Object.keys(facultiesAndDepartments).map(faculty => (
                          <option key={faculty} value={faculty} className="bg-[#0f1123]">{faculty}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-white/60 ml-1">Bölüm / Program</label>
                      <select required value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} disabled={!formData.faculty} className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-colors cursor-pointer disabled:opacity-50" style={inputStyle}>
                        <option value="" disabled className="bg-[#0f1123]">Önce Fakülte Seçiniz</option>
                        {formData.faculty && facultiesAndDepartments[formData.faculty]?.map(dept => (
                          <option key={dept} value={dept} className="bg-[#0f1123]">{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/5 transition-colors cursor-pointer">İptal</button>
                    <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg cursor-pointer disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Değişiklikleri Kaydet'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
