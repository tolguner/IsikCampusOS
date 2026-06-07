import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Banknote,
  CheckCircle2,
  Clock,
  ImagePlus,
  Link as LinkIcon,
  GraduationCap,
  MapPin,
  Megaphone,
  Pencil,
  Power,
  RefreshCw,
  Save,
  Search,
  UserCog,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useClubStore, type Kulup } from '../store/clubStore';
import { useEventStore, type Etkinlik } from '../store/eventStore';
import { useNotificationStore } from '../store/notificationStore';
import { useStudentStore, type Student } from '../store/studentStore';
import { useAuthStore } from '../store/authStore';
import { useAcademicStaffStore, type AcademicAdvisor } from '../store/academicStaffStore';

import {
  type SksModule,
  panelStyle,
  inputClass,
  SHORT_DESCRIPTION_MIN_LENGTH,
  SHORT_DESCRIPTION_MAX_LENGTH,
  VISION_MIN_LENGTH,
  VISION_MAX_LENGTH,
  fieldLimitText,
  initialClubForm,
  moduleMeta,
} from '../components/sks-dashboard/ortak';

export const SksDashboard = () => {
  const {
    clubs,
    isLoading: clubsLoading,
    error: clubError,
    successMessage,
    fetchAdminClubs,
    createClub,
    updateClubProfile,
    changeClubStatus,
    profileChangeRequests,
    fetchProfileChangeRequests,
    approveProfileChangeRequest,
    requestProfileChangeRevision,
    rejectProfileChangeRequest,
    deleteClub,
    clubHealth,
    clubAuditLogsByClub,
    fetchClubHealth,
    addClubHealthNote,
    watchlistClub,
    requestClubHealthAction,
    fetchClubAuditLogs,
  } = useClubStore();
  const {
    reviewQueue,
    isLoading: eventsLoading,
    error: eventError,
    successMessage: eventSuccess,
    fetchReviewQueue,
    approveEvent,
    requestRevision,
  } = useEventStore();
  const { duyuruOlustur, hata: notificationError } = useNotificationStore();
  const currentUser = useAuthStore(state => state.user);
  const { students, fetchStudents, isLoading: studentsLoading } = useStudentStore();
  const {
    advisors,
    searchAdvisors,
    syncAdvisors,
    isLoading: advisorsLoading,
    error: advisorError,
  } = useAcademicStaffStore();

  const [activeModule, setActiveModule] = useState<SksModule>('clubs');
  const [clubForm, setClubForm] = useState(initialClubForm);
  const [logoSource, setLogoSource] = useState('');
  const [logoCropScale, setLogoCropScale] = useState(1);
  const [logoCropX, setLogoCropX] = useState(0);
  const [logoCropY, setLogoCropY] = useState(0);
  const [logoDragStart, setLogoDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    cropX: number;
    cropY: number;
  } | null>(null);
  const [clubSearch, setClubSearch] = useState('');
  const [clubStatusFilter, setClubStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [clubEditForm, setClubEditForm] = useState({
    ad: '',
    kisaAciklama: '',
    vizyon: '',
    aciklama: '',
    logoUrl: '',
    danismanAkademikKadroId: '',
    danismanUnvani: '',
    danismanAdSoyad: '',
    danismanEposta: '',
    danismanBolumu: '',
    advisorSearch: '',
    presidentSearch: '',
    presidentId: '',
    baskanAdSoyad: '',
    baskanEposta: '',
  });
  const [revisionTextByEvent, setRevisionTextByEvent] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    linkUrl: '',
    linkLabel: '',
    imageUrl: '',
    targetAudience: 'ALL_STUDENTS' as 'ALL_STUDENTS' | 'CLUB_PRESIDENTS',
  });
  const [revisionTextByProfileRequest, setRevisionTextByProfileRequest] = useState<Record<string, string>>({});
  const [healthMessageByClub, setHealthMessageByClub] = useState<Record<string, string>>({});
  const [healthLogSearchByClub, setHealthLogSearchByClub] = useState<Record<string, string>>({});
  const announcementSenderName = currentUser?.tamAd || currentUser?.eposta || 'SKS Yönetimi';

  useEffect(() => {
    fetchAdminClubs();
    fetchProfileChangeRequests();
    fetchReviewQueue();
    fetchClubHealth();
    fetchStudents(0, 8, '', 'AKTIF');
    searchAdvisors('');
  }, [fetchAdminClubs, fetchProfileChangeRequests, fetchReviewQueue, fetchClubHealth, fetchStudents, searchAdvisors]);

  useEffect(() => {
    if (activeModule !== 'create') return;

    const timeoutId = window.setTimeout(() => {
      searchAdvisors(clubForm.advisorSearch);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [activeModule, clubForm.advisorSearch, searchAdvisors]);

  useEffect(() => {
    if (activeModule !== 'clubs' || !editingClubId) return;

    const timeoutId = window.setTimeout(() => {
      searchAdvisors(clubEditForm.advisorSearch);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [activeModule, editingClubId, clubEditForm.advisorSearch, searchAdvisors]);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(student => map.set(student.id, student));
    return map;
  }, [students]);

  const selectedPresident = clubForm.presidentId ? studentMap.get(clubForm.presidentId) : null;
  const selectedAdvisorDisplayName = clubForm.danismanUnvani
    ? `${clubForm.danismanUnvani} ${clubForm.danismanAdSoyad}`.trim()
    : clubForm.danismanAdSoyad;
  const selectedEditAdvisorDisplayName = clubEditForm.danismanUnvani
    ? `${clubEditForm.danismanUnvani} ${clubEditForm.danismanAdSoyad}`.trim()
    : clubEditForm.danismanAdSoyad;
  const selectedEditPresidentName = clubEditForm.baskanAdSoyad || clubEditForm.presidentSearch;
  const assignedAdvisorIds = useMemo(() => new Set(
    clubs
      .map(club => club.danismanAkademikKadroId)
      .filter((advisorId): advisorId is string => Boolean(advisorId))
  ), [clubs]);
  const assignedPresidentIds = useMemo(() => new Set(
    clubs
      .map(club => club.yoneticiKullaniciId)
      .filter((presidentId): presidentId is string => Boolean(presidentId))
  ), [clubs]);
  const selectedAdvisorUnavailable = Boolean(
    clubForm.danismanAkademikKadroId && assignedAdvisorIds.has(clubForm.danismanAkademikKadroId)
  );
  const selectedPresidentUnavailable = Boolean(
    clubForm.presidentId && assignedPresidentIds.has(clubForm.presidentId)
  );
  const isAdvisorAssignedToAnotherClub = (advisorId: string, clubId: string) =>
    clubs.some(club => club.id !== clubId && club.danismanAkademikKadroId === advisorId);
  const isPresidentAssignedToAnotherClub = (studentId: string, clubId: string) =>
    clubs.some(club => club.id !== clubId && club.yoneticiKullaniciId === studentId);
  const activeClubCount = clubs.filter(club => club.aktif).length;
  const inactiveClubCount = clubs.length - activeClubCount;
  const activeModuleMeta = moduleMeta[activeModule];
  const ActiveModuleIcon = activeModuleMeta.icon;

  const filteredClubs = useMemo(() => {
    const normalized = clubSearch.trim().toLocaleLowerCase('tr-TR');
    return clubs.filter(club => {
      const matchesSearch = !normalized ||
        club.ad.toLocaleLowerCase('tr-TR').includes(normalized) ||
        club.kisaAciklama?.toLocaleLowerCase('tr-TR').includes(normalized) ||
        club.baskanAdSoyad?.toLocaleLowerCase('tr-TR').includes(normalized) ||
        club.danismanUnvani?.toLocaleLowerCase('tr-TR').includes(normalized) ||
        club.danismanAdSoyad?.toLocaleLowerCase('tr-TR').includes(normalized);
      const matchesStatus =
        clubStatusFilter === 'all' ||
        (clubStatusFilter === 'active' && club.aktif) ||
        (clubStatusFilter === 'inactive' && !club.aktif);

      return matchesSearch && matchesStatus;
    });
  }, [clubs, clubSearch, clubStatusFilter]);

  const handleRefresh = () => {
    fetchAdminClubs();
    fetchProfileChangeRequests();
    fetchReviewQueue();
    fetchStudents(0, 8, activeModule === 'clubs' ? clubEditForm.presidentSearch : clubForm.presidentSearch, 'AKTIF');
    searchAdvisors(activeModule === 'clubs' ? clubEditForm.advisorSearch : clubForm.advisorSearch);
  };

  const handlePresidentSearch = async () => {
    await fetchStudents(0, 8, clubForm.presidentSearch, 'AKTIF');
  };

  const handleEditPresidentSearch = async () => {
    await fetchStudents(0, 8, clubEditForm.presidentSearch, 'AKTIF');
  };

  const handleAdvisorSelect = (advisor: AcademicAdvisor) => {
    if (assignedAdvisorIds.has(advisor.id)) {
      return;
    }

    setClubForm(prev => ({
      ...prev,
      advisorSearch: advisor.displayName,
      advisorAcademicStaffId: advisor.id,
      advisorTitle: advisor.academicTitle || '',
      advisorFullName: advisor.fullName,
      advisorEmail: advisor.email || '',
      advisorDepartment: advisor.department || advisor.facultyOrUnit || '',
    }));
  };

  const handleEditAdvisorSelect = (club: Kulup, advisor: AcademicAdvisor) => {
    if (isAdvisorAssignedToAnotherClub(advisor.id, club.id)) {
      return;
    }

    setClubEditForm(prev => ({
      ...prev,
      advisorSearch: advisor.displayName,
      advisorAcademicStaffId: advisor.id,
      advisorTitle: advisor.academicTitle || '',
      advisorFullName: advisor.fullName,
      advisorEmail: advisor.email || '',
      advisorDepartment: advisor.department || advisor.facultyOrUnit || '',
    }));
  };

  const handleEditPresidentSelect = (club: Kulup, student: Student) => {
    if (isPresidentAssignedToAnotherClub(student.id, club.id)) {
      return;
    }

    setClubEditForm(prev => ({
      ...prev,
      presidentId: student.id,
      presidentSearch: student.tamAd,
      presidentFullName: student.tamAd,
      presidentEmail: student.eposta,
    }));
  };

  const squareImageFile = (file: File) => new Promise<string>((resolve, reject) => {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      reject(new Error('Unsupported image type'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Image could not be read'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Image could not be loaded'));
      image.onload = () => {
        const size = Math.min(image.width, image.height);
        const sourceX = (image.width - size) / 2;
        const sourceY = (image.height - size) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas could not be created'));
          return;
        }
        context.drawImage(image, sourceX, sourceY, size, size, 0, 0, 512, 512);
        resolve(canvas.toDataURL('image/png'));
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });

  const startEditingClub = (club: Kulup) => {
    setEditingClubId(club.id);
    setClubEditForm({
      ad: club.ad || '',
      kisaAciklama: club.kisaAciklama || '',
      vizyon: club.vizyon || club.aciklama || '',
      aciklama: club.vizyon || club.aciklama || '',
      logoUrl: club.logoUrl || '',
      danismanAkademikKadroId: club.danismanAkademikKadroId || '',
      danismanUnvani: club.danismanUnvani || '',
      danismanAdSoyad: club.danismanAdSoyad || '',
      danismanEposta: club.danismanEposta || '',
      danismanBolumu: club.danismanBolumu || '',
      advisorSearch: [club.danismanUnvani, club.danismanAdSoyad].filter(Boolean).join(' '),
      presidentSearch: club.baskanAdSoyad || '',
      presidentId: club.yoneticiKullaniciId || '',
      baskanAdSoyad: club.baskanAdSoyad || '',
      baskanEposta: club.baskanEposta || '',
    });
  };

  const handleEditLogoFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const logoUrl = await squareImageFile(file);
      setClubEditForm(prev => ({ ...prev, logoUrl }));
    } catch {
      setClubEditForm(prev => ({ ...prev, logoUrl: prev.logoUrl }));
    }
  };

  const handleUpdateClubProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingClubId) return;
    const ok = await updateClubProfile(editingClubId, {
      ad: clubEditForm.ad,
      kisaAciklama: clubEditForm.kisaAciklama,
      vizyon: clubEditForm.vizyon,
      aciklama: clubEditForm.aciklama,
      logoUrl: clubEditForm.logoUrl,
      danismanAkademikKadroId: clubEditForm.danismanAkademikKadroId,
      danismanUnvani: clubEditForm.danismanUnvani,
      danismanAdSoyad: clubEditForm.danismanAdSoyad,
      danismanEposta: clubEditForm.danismanEposta,
      danismanBolumu: clubEditForm.danismanBolumu,
      yoneticiKullaniciId: clubEditForm.presidentId,
      baskanAdSoyad: clubEditForm.baskanAdSoyad,
      baskanEposta: clubEditForm.baskanEposta,
    });
    if (ok) setEditingClubId(null);
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    const president = selectedPresident;
    if (!president) return;
    if (!clubForm.danismanAkademikKadroId) return;
    if (selectedPresidentUnavailable || selectedAdvisorUnavailable) return;

    const ok = await createClub({
      ad: clubForm.ad,
      kisaAciklama: clubForm.kisaAciklama,
      vizyon: clubForm.vizyon,
      aciklama: clubForm.vizyon,
      logoUrl: clubForm.logoUrl,
      danismanAkademikKadroId: clubForm.danismanAkademikKadroId,
      danismanUnvani: clubForm.danismanUnvani,
      danismanAdSoyad: clubForm.danismanAdSoyad,
      danismanEposta: clubForm.danismanEposta,
      danismanBolumu: clubForm.danismanBolumu,
      yoneticiKullaniciId: president.id,
      baskanAdSoyad: president.tamAd,
      baskanEposta: president.eposta,
    });

    if (ok) {
      setClubForm(initialClubForm);
      setLogoSource('');
      setLogoCropScale(1);
      setLogoCropX(0);
      setLogoCropY(0);
    }
  };

  const handleLogoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setClubForm(prev => ({ ...prev, logoUrl: '' }));
      setLogoSource('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      setLogoSource(value);
      setClubForm(prev => ({ ...prev, logoUrl: '' }));
      setLogoCropScale(1);
      setLogoCropX(0);
      setLogoCropY(0);
    };
    reader.readAsDataURL(file);
  };

  const cropLogoToSquare = async () => {
    if (!logoSource) return;

    const image = new Image();
    image.onload = () => {
      const outputSize = 512;
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.fillStyle = '#0f1123';
      context.fillRect(0, 0, outputSize, outputSize);

      const baseScale = Math.max(outputSize / image.width, outputSize / image.height);
      const scale = baseScale * logoCropScale;
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const maxOffsetX = Math.max(0, (drawWidth - outputSize) / 2);
      const maxOffsetY = Math.max(0, (drawHeight - outputSize) / 2);
      const offsetX = (logoCropX / 100) * maxOffsetX;
      const offsetY = (logoCropY / 100) * maxOffsetY;
      const left = (outputSize - drawWidth) / 2 + offsetX;
      const top = (outputSize - drawHeight) / 2 + offsetY;

      context.drawImage(image, left, top, drawWidth, drawHeight);
      setClubForm(prev => ({ ...prev, logoUrl: canvas.toDataURL('image/png') }));
    };
    image.src = logoSource;
  };

  const handleLogoDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!logoSource || clubForm.logoUrl) return;
    setLogoDragStart({
      mouseX: event.clientX,
      mouseY: event.clientY,
      cropX: logoCropX,
      cropY: logoCropY,
    });
  };

  const handleLogoDragMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!logoDragStart) return;
    const nextX = Math.max(-100, Math.min(100, logoDragStart.cropX + (event.clientX - logoDragStart.mouseX)));
    const nextY = Math.max(-100, Math.min(100, logoDragStart.cropY + (event.clientY - logoDragStart.mouseY)));
    setLogoCropX(nextX);
    setLogoCropY(nextY);
  };

  const handleLogoWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!logoSource || clubForm.logoUrl) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setLogoCropScale(prev => Math.max(1, Math.min(2.4, Number((prev + delta).toFixed(2)))));
  };

  const handleRevision = async (event: Etkinlik) => {
    const feedback = revisionTextByEvent[event.id]?.trim();
    if (!feedback) return;
    const ok = await requestRevision(event.id, feedback);
    if (ok) setRevisionTextByEvent(prev => ({ ...prev, [event.id]: '' }));
  };

  const formatEventDate = (value?: string) =>
    value
      ? new Intl.DateTimeFormat('tr-TR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(value))
      : 'Belirtilmedi';

  const eventLocationLabel = (event: Etkinlik) =>
    event.etkinlikTuru === 'CEVRIMICI'
      ? event.cevrimiciPlatform || 'Online etkinlik'
      : event.konumAdi || event.konum || 'Konum belirtilmedi';

  const handleProfileChangeRevision = async (requestId: string) => {
    const feedback = revisionTextByProfileRequest[requestId]?.trim();
    if (!feedback) return;
    const ok = await requestProfileChangeRevision(requestId, feedback);
    if (ok) setRevisionTextByProfileRequest(prev => ({ ...prev, [requestId]: '' }));
  };

  const handleProfileChangeReject = async (requestId: string) => {
    const feedback = revisionTextByProfileRequest[requestId]?.trim();
    if (!feedback) return;
    const ok = await rejectProfileChangeRequest(requestId, feedback);
    if (ok) setRevisionTextByProfileRequest(prev => ({ ...prev, [requestId]: '' }));
  };

  const handleAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await duyuruOlustur({
      baslik: announcement.title,
      mesaj: announcement.message,
      baglantiUrl: announcement.linkUrl,
      baglantiEtiketi: announcement.linkLabel,
      resimUrl: announcement.imageUrl,
      olusturanAdi: announcementSenderName,
      hedefKitle: announcement.targetAudience === 'CLUB_PRESIDENTS' ? 'KULUP_BASKANLARI' : 'TUM_OGRENCILER',
    });
    if (ok) setAnnouncement({
      title: '',
      message: '',
      linkUrl: '',
      linkLabel: '',
      imageUrl: '',
      targetAudience: 'ALL_STUDENTS',
    });
  };

  const handleAnnouncementImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAnnouncement(prev => ({ ...prev, imageUrl: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };


  const renderModuleHeaderActions = () => {
    if (activeModule === 'clubs') {
      return (
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[560px]">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={clubSearch}
              onChange={e => setClubSearch(e.target.value)}
              placeholder="Kulüp, başkan veya danışman ara"
              className="w-full rounded-2xl bg-[#111123] border border-white/10 pl-11 pr-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60"
            />
          </div>
          <select
            value={clubStatusFilter}
            onChange={e => setClubStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-400/60"
          >
            <option value="all">Tüm kulüpler</option>
            <option value="active">Aktif kulüpler</option>
            <option value="inactive">Pasif kulüpler</option>
          </select>
        </div>
      );
    }

    if (activeModule === 'events') {
      return (
        <span className="rounded-full px-3 py-1 text-xs font-bold text-cyan-200 bg-cyan-500/10 border border-cyan-400/20">
          {reviewQueue.length} talep
        </span>
      );
    }

    if (activeModule === 'profileRequests') {
      return (
        <span className="rounded-full px-3 py-1 text-xs font-bold text-purple-200 bg-purple-500/10 border border-purple-400/20">
          {profileChangeRequests.length} talep
        </span>
      );
    }

    if (activeModule === 'health') {
      return (
        <button
          type="button"
          onClick={fetchClubHealth}
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white/70 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      );
    }

    return null;
  };

  const renderClubsModule = () => (
    <section className="space-y-5">
      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.025]">
        <table className="w-full min-w-[1120px] border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-white/35 bg-white/[0.025]">
              <th className="px-5 py-4 font-bold">Kulüp</th>
              <th className="px-5 py-4 font-bold">Başkan</th>
              <th className="px-5 py-4 font-bold">Danışman</th>
              <th className="px-5 py-4 font-bold">Durum</th>
              <th className="px-5 py-4 font-bold">Operasyon</th>
              <th className="px-5 py-4 font-bold text-right">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {filteredClubs.map(club => (
              <React.Fragment key={club.id}>
              <tr className="border-t border-white/10 text-sm text-white/70 hover:bg-white/[0.025]">
                <td className="px-5 py-4 border-t border-white/5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {club.logoUrl ? (
                        <img src={club.logoUrl} alt={`${club.ad} logosu`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-black text-white">{club.ad.slice(0, 2).toLocaleUpperCase('tr-TR')}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-white truncate">{club.ad}</div>
                      <div className="text-xs text-white/40 max-w-xs truncate">{club.kisaAciklama || 'Kısa açıklama bekleniyor.'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 border-t border-white/5">
                  <div className="font-bold text-white">{club.baskanAdSoyad || 'Atanmadı'}</div>
                  <div className="text-xs text-white/35 break-all">{club.baskanEposta || 'E-posta yok'}</div>
                </td>
                <td className="px-5 py-4 border-t border-white/5">
                  <div className="font-bold text-white">{[club.danismanUnvani, club.danismanAdSoyad].filter(Boolean).join(' ') || 'Bilgi yok'}</div>
                  <div className="text-xs text-white/35">{club.danismanBolumu || 'Birim yok'}</div>
                </td>
                <td className="px-5 py-4 border-t border-white/5">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${club.aktif ? 'text-emerald-200 bg-emerald-500/10' : 'text-zinc-300 bg-white/10'}`}>
                    {club.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-5 py-4 border-t border-white/5">
                  <div className="flex gap-3">
                    <div><span className="font-black text-white">{club.uyeSayisi}</span><span className="text-xs text-white/35 ml-1">üye</span></div>
                    <div><span className="font-black text-white">{club.etkinlikSayisi}</span><span className="text-xs text-white/35 ml-1">etkinlik</span></div>
                  </div>
                </td>
                <td className="px-5 py-4 border-t border-white/5">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => editingClubId === club.id ? setEditingClubId(null) : startEditingClub(club)}
                      className="rounded-2xl px-3 py-2 text-xs font-bold text-indigo-100 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/20 transition-colors"
                    >
                      {editingClubId === club.id ? 'Kapat' : 'Düzenle'}
                    </button>
                    <button
                      type="button"
                      onClick={() => changeClubStatus(club.id, !club.aktif)}
                      className={`rounded-2xl px-3 py-2 text-xs font-bold transition-colors ${club.aktif ? 'text-red-200 bg-red-500/10 hover:bg-red-500/20' : 'text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20'}`}
                    >
                      {club.aktif ? 'Pasifleştir' : 'Aktifleştir'}
                    </button>

                      <button
                        type="button"
                        onClick={() => {
                          if(window.confirm('Bu kulübü ve tüm verilerini tamamen silmek istediğinize emin misiniz?')) {
                            deleteClub(club.id);
                          }
                        }}
                        className="rounded-2xl px-3 py-2 text-xs font-bold transition-colors bg-red-900/40 text-red-200 hover:bg-red-700/60 ml-2"
                      >
                        Sil
                      </button>
                  </div>
                </td>
              </tr>
              {editingClubId === club.id && (
                <tr className="bg-white/[0.018]">
                  <td colSpan={6} className="px-5 py-5 border-t border-white/5">
                    <form onSubmit={handleUpdateClubProfile} className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5 rounded-3xl border border-white/10 bg-[#0d0d1a]/70 p-5">
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-black text-white">
                          <Pencil className="w-4 h-4 text-indigo-300" />
                          Kulüp Profil Bilgileri
                        </div>
                        <input value={clubEditForm.ad} onChange={e => setClubEditForm(prev => ({ ...prev, name: e.target.value }))} required placeholder="Kulüp adı" className={inputClass} />
                        <div>
                          <input
                            value={clubEditForm.kisaAciklama}
                            onChange={e => setClubEditForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                            required
                            minLength={SHORT_DESCRIPTION_MIN_LENGTH}
                            maxLength={SHORT_DESCRIPTION_MAX_LENGTH}
                            placeholder="Kısa açıklama"
                            className={inputClass}
                          />
                          <p className="mt-2 text-xs text-white/35">{fieldLimitText(clubEditForm.kisaAciklama, SHORT_DESCRIPTION_MIN_LENGTH, SHORT_DESCRIPTION_MAX_LENGTH)}</p>
                        </div>
                        <textarea
                          value={clubEditForm.vizyon}
                          onChange={e => setClubEditForm(prev => ({ ...prev, vision: e.target.value, description: e.target.value }))}
                          required
                          minLength={VISION_MIN_LENGTH}
                          maxLength={VISION_MAX_LENGTH}
                          rows={5}
                          placeholder="Vizyon"
                          className={`${inputClass} resize-none`}
                        />
                                                  <p className="-mt-2 text-xs text-white/35">{fieldLimitText(clubEditForm.vizyon, VISION_MIN_LENGTH, VISION_MAX_LENGTH)}</p>
                      </section>

                      <aside className="space-y-4">
                        <div className="grid grid-cols-[72px_1fr] gap-4 items-center">
                          <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 border border-white/10 overflow-hidden flex items-center justify-center">
                            {clubEditForm.logoUrl ? (
                              <img src={clubEditForm.logoUrl} alt="Kulüp logosu" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-black text-white">{clubEditForm.ad.slice(0, 2).toLocaleUpperCase('tr-TR') || 'KL'}</span>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white mb-2">Logo</label>
                            <input
                              type="file"
                              accept="image/png,image/jpeg"
                              onChange={handleEditLogoFileSelect}
                              className="block w-full text-xs text-white/65 file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-xs file:font-bold file:text-indigo-100 hover:file:bg-indigo-500/30"
                            />
                          </div>
                        </div>
                        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-white">
                            <UserCog className="w-4 h-4 text-purple-300" />
                            Kulüp Başkanı
                          </div>
                          <div className="flex gap-2">
                            <input
                              value={clubEditForm.presidentSearch}
                              onChange={e => setClubEditForm(prev => ({
                                ...prev,
                                presidentSearch: e.target.value,
                                presidentId: '',
                                presidentFullName: '',
                                presidentEmail: '',
                              }))}
                              placeholder="Öğrenci adı, e-posta veya numara"
                              className={inputClass}
                            />
                            <button type="button" onClick={handleEditPresidentSearch} className="rounded-2xl px-4 gradient-btn">
                              <Search className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {students.map(student => {
                              const alreadyPresident = isPresidentAssignedToAnotherClub(student.id, club.id);
                              return (
                                <button
                                  key={student.id}
                                  type="button"
                                  onClick={() => handleEditPresidentSelect(club, student)}
                                  disabled={alreadyPresident}
                                  className={`w-full rounded-2xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${clubEditForm.presidentId === student.id ? 'border-purple-400/50 bg-purple-500/15' : alreadyPresident ? 'border-amber-400/20 bg-amber-500/[0.06] opacity-60' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06]'}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="text-sm font-bold text-white">{student.tamAd}</div>
                                    {alreadyPresident && <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">Başkan</span>}
                                  </div>
                                  <div className="text-xs text-white/35">{student.ogrenciNumarasi} - {student.eposta}</div>
                                </button>
                              );
                            })}
                            {studentsLoading && <p className="text-xs text-white/35">Öğrenciler aranıyor...</p>}
                          </div>
                          {clubEditForm.presidentId && (
                            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-3 text-sm text-emerald-100">
                              Seçilen başkan: <span className="font-bold">{selectedEditPresidentName}</span>
                              <div className="mt-1 text-xs text-emerald-100/75 break-all">{clubEditForm.baskanEposta}</div>
                            </div>
                          )}
                          {clubEditForm.presidentId && isPresidentAssignedToAnotherClub(clubEditForm.presidentId, club.id) && (
                            <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-100">
                              Bu öğrenci halihazırda başka bir kulüpte başkan.
                            </p>
                          )}
                        </section>
                        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                              <GraduationCap className="w-4 h-4 text-cyan-300" />
                              Danışman Akademisyen
                            </div>
                            <button
                              type="button"
                              onClick={syncAdvisors}
                              disabled={advisorsLoading}
                              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-cyan-100 bg-cyan-500/10 border border-cyan-400/20 hover:bg-cyan-500/20 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${advisorsLoading ? 'animate-spin' : ''}`} />
                              Güncelle
                            </button>
                          </div>
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                              value={clubEditForm.advisorSearch}
                              onChange={e => setClubEditForm(prev => ({
                                ...prev,
                                advisorSearch: e.target.value,
                                advisorAcademicStaffId: '',
                                advisorTitle: '',
                                advisorFullName: '',
                                advisorEmail: '',
                                advisorDepartment: '',
                              }))}
                              placeholder="Akademisyen adı, e-posta veya bölüm"
                              className={`${inputClass} pl-11`}
                            />
                          </div>
                          <div className="max-h-56 overflow-y-auto space-y-2">
                            {advisors.map(advisor => {
                              const alreadyAssigned = isAdvisorAssignedToAnotherClub(advisor.id, club.id);
                              return (
                                <button
                                  key={advisor.id}
                                  type="button"
                                  onClick={() => handleEditAdvisorSelect(club, advisor)}
                                  disabled={alreadyAssigned}
                                  className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed ${clubEditForm.danismanAkademikKadroId === advisor.id ? 'border-cyan-400/50 bg-cyan-500/15' : alreadyAssigned ? 'border-amber-400/20 bg-amber-500/[0.06] opacity-60' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06]'}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="text-sm font-bold text-white">{advisor.displayName}</div>
                                    {alreadyAssigned && <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">Atanmış</span>}
                                  </div>
                                  <div className="mt-1 text-xs text-white/40 break-all">{advisor.email || 'E-posta yok'}</div>
                                  <div className="mt-1 text-xs text-white/35">{advisor.department || advisor.facultyOrUnit || 'Bölüm bilgisi yok'}</div>
                                </button>
                              );
                            })}
                            {advisorsLoading && <p className="text-xs text-white/35">Akademik kadro aranıyor...</p>}
                            {!advisorsLoading && advisors.length === 0 && !clubEditForm.danismanAkademikKadroId && (
                              <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-xs text-white/35">
                                Sonuç bulunamadı. Listeyi güncelleyip tekrar arayabilirsin.
                              </p>
                            )}
                          </div>
                          {clubEditForm.danismanAkademikKadroId && (
                            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-3 text-sm text-emerald-100">
                              Seçilen danışman: <span className="font-bold">{selectedEditAdvisorDisplayName}</span>
                              <div className="mt-1 text-xs text-emerald-100/75 break-all">{clubEditForm.danismanEposta} · {clubEditForm.danismanBolumu}</div>
                            </div>
                          )}
                          {clubEditForm.danismanAkademikKadroId && isAdvisorAssignedToAnotherClub(clubEditForm.danismanAkademikKadroId, club.id) && (
                            <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-100">
                              Bu akademisyen halihazırda başka bir kulüpte danışman.
                            </p>
                          )}
                        </section>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setEditingClubId(null)} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white/70 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10">
                            <X className="w-4 h-4" />
                            Vazgeç
                          </button>
                          <button
                            type="submit"
                            disabled={
                              clubsLoading ||
                              !clubEditForm.presidentId ||
                              !clubEditForm.danismanAkademikKadroId ||
                              isPresidentAssignedToAnotherClub(clubEditForm.presidentId, club.id) ||
                              isAdvisorAssignedToAnotherClub(clubEditForm.danismanAkademikKadroId, club.id)
                            }
                            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold gradient-btn disabled:opacity-45"
                          >
                            <Save className="w-4 h-4" />
                            Kaydet
                          </button>
                        </div>
                      </aside>
                    </form>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {!clubsLoading && filteredClubs.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center text-white/35">
          Bu filtrelere uygun kulüp bulunamadı.
        </div>
      )}
      {clubsLoading && <p className="text-sm text-white/40">Kulüpler yükleniyor...</p>}
    </section>
  );

  const renderCreateModule = () => (
    <form onSubmit={handleCreateClub} className="grid grid-cols-1 2xl:grid-cols-[1.15fr_0.85fr] gap-5">
      <section className="rounded-3xl p-6 space-y-5" style={panelStyle}>
        <div>
          <h2 className="text-xl font-black text-white">Kulüp Kimliği</h2>
          <p className="text-sm text-white/40 mt-1">Öğrencilerin göreceği isim, kısa açıklama, vizyon ve logo bilgileri.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <input value={clubForm.ad} onChange={e => setClubForm(prev => ({ ...prev, name: e.target.value }))} required placeholder="Kulüp adı" className={inputClass} />
          <div className="lg:col-span-2">
            <input
              value={clubForm.kisaAciklama}
              onChange={e => setClubForm(prev => ({ ...prev, shortDescription: e.target.value }))}
              required
              minLength={SHORT_DESCRIPTION_MIN_LENGTH}
              maxLength={SHORT_DESCRIPTION_MAX_LENGTH}
              placeholder="Kısa açıklama"
              className={inputClass}
            />
            <p className="mt-2 text-xs text-white/35">{fieldLimitText(clubForm.kisaAciklama, SHORT_DESCRIPTION_MIN_LENGTH, SHORT_DESCRIPTION_MAX_LENGTH)}</p>
          </div>
          <div className="lg:col-span-2">
            <textarea
              value={clubForm.vizyon}
              onChange={e => setClubForm(prev => ({ ...prev, vision: e.target.value }))}
              required
              minLength={VISION_MIN_LENGTH}
              maxLength={VISION_MAX_LENGTH}
              placeholder="Vizyon"
              rows={9}
              className={`${inputClass} resize-none`}
            />
                          <p className="mt-2 text-xs text-white/35">{fieldLimitText(clubForm.vizyon, VISION_MIN_LENGTH, VISION_MAX_LENGTH)}</p>
            </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            <div
              onMouseDown={handleLogoDragStart}
              onMouseMove={handleLogoDragMove}
              onMouseUp={() => setLogoDragStart(null)}
              onMouseLeave={() => setLogoDragStart(null)}
              onWheel={handleLogoWheel}
              className={`relative w-36 h-36 rounded-3xl border border-white/10 bg-[#111123] overflow-hidden flex items-center justify-center shrink-0 select-none ${logoSource && !clubForm.logoUrl ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {clubForm.logoUrl ? (
                <img src={clubForm.logoUrl} alt="Kırpılmış kulüp logosu" className="w-full h-full object-cover" />
              ) : logoSource ? (
                <img
                  src={logoSource}
                  alt="Logo kırpma önizlemesi"
                  draggable={false}
                  className="w-full h-full object-cover pointer-events-none"
                  style={{ transform: `scale(${logoCropScale}) translate(${logoCropX / 4}px, ${logoCropY / 4}px)` }}
                />
              ) : (
                <span className="text-xs text-white/35 text-center px-4">Kare logo önizlemesi</span>
              )}
              {logoSource && !clubForm.logoUrl && (
                <div className="absolute inset-0 border-2 border-white/20 rounded-3xl pointer-events-none" />
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Kulüp Logosu</h3>
                <p className="text-xs text-white/40 mt-1">PNG veya JPG yükle. Görseli kare alanda mouse ile sürükle, tekerlekle yakınlaştır, sonra uygula.</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleLogoFileSelect}
                className="block w-full text-sm text-white/65 file:mr-4 file:rounded-xl file:border-0 file:bg-purple-500/20 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-purple-100 hover:file:bg-purple-500/30"
              />
              {logoSource && (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                  <label className="space-y-2 text-xs font-bold text-white/50">
                    Yakınlaştırma
                    <input type="range" min="1" max="2.4" step="0.05" value={logoCropScale} onChange={e => setLogoCropScale(Number(e.target.value))} className="w-full" />
                  </label>
                  <button type="button" onClick={cropLogoToSquare} className="rounded-2xl px-5 py-3 text-sm font-bold text-white bg-white/[0.07] border border-white/10 hover:bg-white/[0.11]">
                    Kare Logoyu Uygula
                  </button>
                </div>
              )}
              {clubForm.logoUrl && <p className="text-xs font-bold text-emerald-200">Logo kare olarak hazır.</p>}
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-3xl p-5 space-y-3" style={panelStyle}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <GraduationCap className="w-4 h-4 text-cyan-300" />
              Danışman Akademisyen
            </div>
            <button
              type="button"
              onClick={syncAdvisors}
              disabled={advisorsLoading}
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-cyan-100 bg-cyan-500/10 border border-cyan-400/20 hover:bg-cyan-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${advisorsLoading ? 'animate-spin' : ''}`} />
              Güncelle
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={clubForm.advisorSearch}
              onChange={e => setClubForm(prev => ({
                ...prev,
                advisorSearch: e.target.value,
                advisorAcademicStaffId: '',
                advisorTitle: '',
                advisorFullName: '',
                advisorEmail: '',
                advisorDepartment: '',
              }))}
              placeholder="Akademisyen adı, e-posta veya bölüm"
              className={`${inputClass} pl-11`}
            />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {advisors.map(advisor => {
              const alreadyAssigned = assignedAdvisorIds.has(advisor.id);
              return (
                <button
                  key={advisor.id}
                  type="button"
                  onClick={() => handleAdvisorSelect(advisor)}
                  disabled={alreadyAssigned}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed ${clubForm.danismanAkademikKadroId === advisor.id ? 'border-cyan-400/50 bg-cyan-500/15' : alreadyAssigned ? 'border-amber-400/20 bg-amber-500/[0.06] opacity-60' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-bold text-white">{advisor.displayName}</div>
                    {alreadyAssigned && <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">Atanmış</span>}
                  </div>
                  <div className="mt-1 text-xs text-white/40 break-all">{advisor.email || 'E-posta yok'}</div>
                  <div className="mt-1 text-xs text-white/35">{advisor.department || advisor.facultyOrUnit || 'Bölüm bilgisi yok'}</div>
                </button>
              );
            })}
            {advisorsLoading && <p className="text-xs text-white/35">Akademik kadro aranıyor...</p>}
            {!advisorsLoading && advisors.length === 0 && !clubForm.danismanAkademikKadroId && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-xs text-white/35">
                Sonuç bulunamadı. Listeyi güncelleyip tekrar arayabilirsin.
              </p>
            )}
          </div>
          {clubForm.danismanAkademikKadroId && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-3 text-sm text-emerald-100">
              Seçilen danışman: <span className="font-bold">{selectedAdvisorDisplayName}</span>
              <div className="mt-1 text-xs text-emerald-100/75">{clubForm.danismanEposta} · {clubForm.danismanBolumu}</div>
            </div>
          )}
          {selectedAdvisorUnavailable && (
            <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-100">
              Bu akademisyen halihazırda başka bir kulüpte danışman.
            </p>
          )}
        </section>

        <section className="rounded-3xl p-5 space-y-3" style={panelStyle}>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <UserCog className="w-4 h-4 text-purple-300" />
            Kulüp Başkanı
          </div>
          <div className="flex gap-2">
            <input
              value={clubForm.presidentSearch}
              onChange={e => setClubForm(prev => ({ ...prev, presidentSearch: e.target.value }))}
              placeholder="Öğrenci adı, e-posta veya numara"
              className={inputClass}
            />
            <button type="button" onClick={handlePresidentSearch} className="rounded-2xl px-4 gradient-btn">
              <Search className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-2">
            {students.map(student => {
              const alreadyPresident = assignedPresidentIds.has(student.id);
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => {
                    if (alreadyPresident) return;
                    setClubForm(prev => ({ ...prev, presidentId: student.id, presidentSearch: student.tamAd }));
                  }}
                  disabled={alreadyPresident}
                  className={`w-full rounded-2xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${clubForm.presidentId === student.id ? 'border-purple-400/50 bg-purple-500/15' : alreadyPresident ? 'border-amber-400/20 bg-amber-500/[0.06] opacity-60' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-bold text-white">{student.tamAd}</div>
                    {alreadyPresident && <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">Başkan</span>}
                  </div>
                  <div className="text-xs text-white/35">{student.ogrenciNumarasi} - {student.eposta}</div>
                </button>
              );
            })}
            {studentsLoading && <p className="text-xs text-white/35">Öğrenciler aranıyor...</p>}
          </div>
          {selectedPresident && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-3 text-sm text-emerald-100">
              Seçilen başkan: <span className="font-bold">{selectedPresident.tamAd}</span>
            </div>
          )}
          {selectedPresidentUnavailable && (
            <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-100">
              Bu öğrenci halihazırda başka bir kulüpte başkan.
            </p>
          )}
        </section>

        <section className="rounded-3xl p-5 space-y-4" style={panelStyle}>
          <div>
            <h3 className="text-sm font-bold text-white">Kayıt Özeti</h3>
            <p className="text-xs text-white/40 mt-1">Kulüp aktif oluşturulur ve seçilen başkan kulüp yöneticisi yapılır.</p>
          </div>
          <div className="space-y-2 text-sm text-white/60">
            <div className="flex justify-between gap-4"><span>Kulüp</span><strong className="text-white text-right">{clubForm.ad || 'Bekleniyor'}</strong></div>
            <div className="flex justify-between gap-4"><span>Danışman</span><strong className="text-white text-right">{selectedAdvisorDisplayName || 'Seçilmedi'}</strong></div>
            <div className="flex justify-between gap-4"><span>Başkan</span><strong className="text-white text-right">{selectedPresident?.tamAd || 'Seçilmedi'}</strong></div>
          </div>
          <button type="submit" disabled={!selectedPresident || !clubForm.danismanAkademikKadroId || selectedPresidentUnavailable || selectedAdvisorUnavailable || clubsLoading} className="w-full rounded-2xl px-8 py-3 gradient-btn font-bold disabled:opacity-45 disabled:cursor-not-allowed">
            Kulübü Oluştur
          </button>
        </section>
      </aside>
    </form>
  );

  const renderEventsModule = () => (
    <section className="space-y-5">
      <div className="space-y-4">
        {reviewQueue.map(event => (
          <motion.div key={event.id} layout className="rounded-3xl p-5 bg-white/[0.035] border border-white/5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-white">{event.baslik}</h3>
                  <span className="rounded-full px-3 py-1 text-xs font-black text-purple-100 bg-purple-500/15 border border-purple-300/20">
                    {event.kulup?.ad || 'Kulüp bilgisi yok'}
                  </span>
                  <span className="rounded-full px-3 py-1 text-xs font-black text-cyan-100 bg-cyan-500/10 border border-cyan-300/15">
                    {event.etkinlikTuru === 'CEVRIMICI' ? 'Online' : 'Yüz yüze'}
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="text-xs font-black uppercase tracking-wide text-white/35 mb-2">Etkinlik açıklaması</div>
                  <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{event.aciklama || 'Açıklama belirtilmedi.'}</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[12rem_1fr] gap-4">
                  {event.afisResmiUrl ? (
                    <img src={event.afisResmiUrl} alt={event.baslik} className="w-full max-w-xs xl:max-w-none aspect-[297/420] object-cover rounded-2xl border border-white/10 bg-white/[0.025]" />
                  ) : (
                    <div className="w-full max-w-xs xl:max-w-none aspect-[297/420] rounded-2xl border border-white/10 bg-white/[0.025] flex items-center justify-center text-xs font-bold text-white/30">
                      Afiş yok
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/35 mb-3">
                        <Clock className="w-4 h-4 text-indigo-200" />
                        Zaman
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-3"><span className="text-white/40">Başlangıç</span><strong className="text-white text-right">{formatEventDate(event.baslangicTarihi)}</strong></div>
                        <div className="flex justify-between gap-3"><span className="text-white/40">Bitiş</span><strong className="text-white text-right">{formatEventDate(event.bitisTarihi)}</strong></div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/35 mb-3">
                        <MapPin className="w-4 h-4 text-emerald-200" />
                        Konum
                      </div>
                      <div className="space-y-2 text-sm text-white/60">
                        <p className="font-bold text-white">{eventLocationLabel(event)}</p>
                        {event.etkinlikTuru === 'CEVRIMICI' && event.cevrimiciToplantiUrl && (
                          <a href={event.cevrimiciToplantiUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-100 hover:text-cyan-50 break-all">
                            <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                            {event.cevrimiciToplantiUrl}
                          </a>
                        )}
                        {event.etkinlikTuru === 'YUZ_YUZE' && (
                          <>
                            <p>{event.konumDetayi || 'Konum detayı belirtilmedi.'}</p>
                            {event.enlem && event.boylam && <p className="text-xs text-white/35">{event.enlem}, {event.boylam}</p>}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/35 mb-3">
                        <Users className="w-4 h-4 text-cyan-200" />
                        Katılım
                      </div>
                      <div className="space-y-2 text-sm text-white/60">
                        <div className="flex justify-between gap-3"><span>Kontenjan</span><strong className="text-white">{event.kontenjanSiniriVar || event.kontenjanSinirli ? `${event.kontenjan} kişi` : 'Sınırsız'}</strong></div>
                        <div className="flex justify-between gap-3"><span>QR yoklama</span><strong className="text-white">{event.qrGirisEtkin ? 'Açık' : 'Kapalı'}</strong></div>
                        <div className="flex justify-between gap-3"><span>Sertifika</span><strong className="text-white">{event.sertifikaEtkin ? event.sertifikaBasligi || 'Açık' : 'Kapalı'}</strong></div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/35 mb-3">
                        <Banknote className="w-4 h-4 text-amber-200" />
                        Ücret ve ödeme
                      </div>
                      {event.ucretli ? (
                        <div className="space-y-2 text-sm text-amber-50/80">
                          <div className="font-black">{event.ucretTutari || 0} TL</div>
                          <p className="break-all">IBAN: {event.iban || 'Belirtilmedi'}</p>
                          <p>{event.odemeTalimatlari || 'Ödeme açıklaması yok.'}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-white/55">Ücretsiz etkinlik.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {event.hatirlaticiEtkin && <span className="rounded-full px-3 py-1 text-xs font-bold bg-cyan-500/10 text-cyan-200">Hatırlatma: {event.hatirlatmaZamanlariDakika || 'Planlandı'}</span>}
                  {event.redNedeni && <span className="rounded-full px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-200">Önceki SKS notu var</span>}
                </div>
                {event.redNedeni && <p className="mt-3 text-sm text-amber-200">Son geri bildirim: {event.redNedeni}</p>}
              </div>

              <div className="w-full lg:w-72 space-y-3">
                <button onClick={() => approveEvent(event.id)} type="button" className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                  Onayla
                </button>
                <textarea
                  value={revisionTextByEvent[event.id] || ''}
                  onChange={e => setRevisionTextByEvent(prev => ({ ...prev, [event.id]: e.target.value }))}
                  placeholder="Düzenleme isteği geri bildirimi"
                  rows={3}
                  className={`${inputClass} resize-none focus:border-amber-400/60`}
                />
                <button onClick={() => handleRevision(event)} type="button" className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-amber-100 bg-amber-500/15 hover:bg-amber-500/25 transition-colors">
                  <XCircle className="w-4 h-4" />
                  Düzenleme İste
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {!eventsLoading && reviewQueue.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center text-white/35">
            Şu anda bekleyen etkinlik talebi yok.
          </div>
        )}
      </div>
    </section>
  );

  const renderProfileRequestsModule = () => (
    <section className="space-y-4">
      {profileChangeRequests.map(request => (
        <motion.article key={request.id} layout className="rounded-2xl p-5 bg-white/[0.035] border border-white/5">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-5">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-white">{request.kulup.ad}</h3>
                <span className="rounded-full px-2.5 py-1 text-xs font-bold text-purple-200 bg-purple-500/10">{request.durum}</span>
                <span className="text-xs text-white/35">{new Date(request.olusturulmaTarihi).toLocaleString('tr-TR')}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="text-xs font-black uppercase tracking-wide text-white/35 mb-3">Mevcut Profil</div>
                  <div className="space-y-2 text-sm">
                    <div className="font-bold text-white">{request.kulup.ad}</div>
                    <p className="text-white/45">{request.kulup.kisaAciklama || 'Kısa açıklama yok.'}</p>
                    <p className="text-white/35 line-clamp-4">{request.kulup.vizyon || request.kulup.aciklama}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-purple-400/20 bg-purple-500/[0.06] p-4">
                  <div className="text-xs font-black uppercase tracking-wide text-purple-200/75 mb-3">Talep Edilen Profil</div>
                  <div className="space-y-2 text-sm">
                    <div className="font-bold text-white">{request.ad}</div>
                    <p className="text-white/55">{request.kisaAciklama}</p>
                    <p className="text-white/45 line-clamp-4">{request.vizyon}</p>
                    {request.logoUrl && <p className="text-xs text-purple-100/75 break-all">Logo güncellemesi var.</p>}
                  </div>
                </div>
              </div>

              {request.geriBildirim && (
                <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  Son SKS notu: {request.geriBildirim}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => approveProfileChangeRequest(request.id)}
                disabled={clubsLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors disabled:opacity-45"
              >
                <CheckCircle2 className="w-4 h-4" />
                Onayla ve Yayınla
              </button>
              <textarea
                value={revisionTextByProfileRequest[request.id] || ''}
                onChange={e => setRevisionTextByProfileRequest(prev => ({ ...prev, [request.id]: e.target.value }))}
                placeholder="Revizyon veya red gerekçesi"
                rows={4}
                className={`${inputClass} resize-none focus:border-amber-400/60`}
              />
              <button
                type="button"
                onClick={() => handleProfileChangeRevision(request.id)}
                disabled={clubsLoading || !revisionTextByProfileRequest[request.id]?.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-amber-100 bg-amber-500/15 hover:bg-amber-500/25 transition-colors disabled:opacity-45"
              >
                <Pencil className="w-4 h-4" />
                Revizyon İste
              </button>
              <button
                type="button"
                onClick={() => handleProfileChangeReject(request.id)}
                disabled={clubsLoading || !revisionTextByProfileRequest[request.id]?.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-red-100 bg-red-500/15 hover:bg-red-500/25 transition-colors disabled:opacity-45"
              >
                <XCircle className="w-4 h-4" />
                Reddet
              </button>
            </div>
          </div>
        </motion.article>
      ))}
      {!clubsLoading && profileChangeRequests.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center text-white/35">
          Şu anda bekleyen kulüp profil talebi yok.
        </div>
      )}
    </section>
  );

  const renderAnnouncementsModule = () => (
    <form onSubmit={handleAnnouncement} className="rounded-3xl p-6 space-y-6" style={panelStyle}>
      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <section className="space-y-5">
          <select value={announcement.targetAudience} onChange={e => setAnnouncement(prev => ({ ...prev, targetAudience: e.target.value as 'ALL_STUDENTS' | 'CLUB_PRESIDENTS' }))} className={inputClass}>
            <option value="ALL_STUDENTS">Tüm öğrenciler</option>
            <option value="CLUB_PRESIDENTS">Kulüp başkanları</option>
          </select>
          <input value={announcement.title} onChange={e => setAnnouncement(prev => ({ ...prev, title: e.target.value }))} required maxLength={140} placeholder="Duyuru başlığı" className={inputClass} />
          <textarea value={announcement.message} onChange={e => setAnnouncement(prev => ({ ...prev, message: e.target.value }))} required maxLength={3000} placeholder="Duyuru metni" rows={12} className={`${inputClass} resize-none`} />
          <p className="-mt-3 text-xs text-white/35">{announcement.message.trim().length}/3000 karakter</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={announcement.linkUrl} onChange={e => setAnnouncement(prev => ({ ...prev, linkUrl: e.target.value }))} type="url" placeholder="Bağlantı URL'si" className={`${inputClass} pl-11`} />
            </div>
            <input value={announcement.linkLabel} onChange={e => setAnnouncement(prev => ({ ...prev, linkLabel: e.target.value }))} placeholder="Bağlantı etiketi (örn. Başvuru formu)" className={inputClass} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border border-white/10 bg-[#111123] overflow-hidden flex items-center justify-center shrink-0">
                {announcement.imageUrl ? (
                  <img src={announcement.imageUrl} alt="Duyuru görseli" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-7 h-7 text-white/35" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">Görsel içerik</div>
                <p className="text-xs text-white/40 mt-1">PNG veya JPG eklenebilir. Bildirim önizlemesinde ve kullanıcı bildirimlerinde gösterilir.</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleAnnouncementImageSelect}
                  className="mt-3 block w-full text-sm text-white/65 file:mr-4 file:rounded-xl file:border-0 file:bg-purple-500/20 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-purple-100 hover:file:bg-purple-500/30"
                />
              </div>
              {announcement.imageUrl && (
                <button type="button" onClick={() => setAnnouncement(prev => ({ ...prev, imageUrl: '' }))} className="rounded-2xl px-4 py-3 text-sm font-bold text-white/70 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10">
                  Görseli kaldır
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 h-fit">
          <div className="flex items-center gap-2 text-sm font-black text-white mb-4">
            <Megaphone className="w-4 h-4 text-pink-300" />
            Canlı Önizleme
          </div>
          <article className="rounded-3xl border border-white/10 bg-[#111123] overflow-hidden">
            {announcement.imageUrl && <img src={announcement.imageUrl} alt="Duyuru önizleme" className="w-full max-h-56 object-cover" />}
            <div className="p-5 space-y-3">
              <span className="rounded-full px-3 py-1 text-xs font-bold text-pink-100 bg-pink-500/15 border border-pink-400/20">
                {announcement.targetAudience === 'ALL_STUDENTS' ? 'Tüm öğrenciler' : 'Kulüp başkanları'}
              </span>
              <h3 className="text-2xl font-black text-white leading-tight">{announcement.title || 'Duyuru başlığı'}</h3>
              <p className="text-xs font-semibold text-white/35">
                Gönderen: <span className="text-white/60">{announcementSenderName}</span>
              </p>
              <p className="text-sm text-white/50 whitespace-pre-line leading-relaxed">{announcement.message || 'Duyuru metni burada önizlenir.'}</p>
              {announcement.linkUrl && (
                <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-cyan-100 bg-cyan-500/10 border border-cyan-400/20">
                  <LinkIcon className="w-4 h-4" />
                  {announcement.linkLabel || announcement.linkUrl}
                </div>
              )}
            </div>
          </article>
        </aside>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-3 gradient-btn font-bold">
          <Bell className="w-4 h-4" />
          Duyuruyu Gönder
        </button>
      </div>
    </form>
  );

  const renderHealthModule = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl p-5 flex items-center justify-between gap-4" style={panelStyle}>
          <div>
            <div className="text-3xl font-black text-white">{clubs.length}</div>
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

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'create':
        return renderCreateModule();
      case 'events':
        return renderEventsModule();
      case 'profileRequests':
        return renderProfileRequestsModule();
      case 'announcements':
        return renderAnnouncementsModule();
      case 'health':
        return renderHealthModule();
      case 'clubs':
      default:
        return renderClubsModule();
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-purple-300">SKS Yönetimi</p>
          <h1 className="text-4xl font-extrabold gradient-text mt-2">Kulüpler Kontrol Paneli</h1>
          <p className="text-white/45 mt-3 max-w-3xl">
            İş akışını seç, yalnızca o modüle odaklan. Kulüp yönetimi, kayıt oluşturma, etkinlik talepleri ve duyurular ayrı alanlarda çalışır.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          style={panelStyle}
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {(clubError || eventError || notificationError || advisorError || successMessage || eventSuccess) && (
        <div className={`rounded-2xl px-5 py-4 text-sm font-semibold ${successMessage || eventSuccess ? 'text-emerald-200 bg-emerald-500/10 border border-emerald-400/20' : 'text-red-200 bg-red-500/10 border border-red-400/20'}`}>
          {successMessage || eventSuccess || clubError || eventError || notificationError || advisorError}
        </div>
      )}


      <nav className="grid grid-cols-[repeat(6,minmax(11rem,1fr))] gap-3 overflow-x-auto pb-1">
        {(Object.keys(moduleMeta) as SksModule[]).map(moduleKey => {
          const meta = moduleMeta[moduleKey];
          const Icon = meta.icon;
          const selected = activeModule === moduleKey;
          return (
            <button
              key={moduleKey}
              type="button"
              onClick={() => setActiveModule(moduleKey)}
              className={`relative h-20 rounded-3xl p-3.5 min-w-44 text-left border transition-colors overflow-hidden ${selected ? 'bg-purple-500/15 border-purple-400/35' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${selected ? 'bg-purple-500/20 border-purple-300/30 text-purple-100' : 'bg-white/[0.04] border-white/10 text-white/55'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">{meta.label}</div>
                  <div className="text-xs text-white/40 mt-1 leading-snug line-clamp-2">{meta.description}</div>
                </div>
              </div>
              
              {moduleKey === 'events' && reviewQueue.length > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="absolute top-2 right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white border border-red-400/25 shadow-lg shadow-red-500/35"
                >
                  {reviewQueue.length}
                </motion.span>
              )}
              
              {moduleKey === 'profileRequests' && profileChangeRequests.length > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="absolute top-2 right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white border border-red-400/25 shadow-lg shadow-red-500/35"
                >
                  {profileChangeRequests.length}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      <motion.div
        key={activeModule}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="space-y-5"
      >
        <section className="rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4" style={panelStyle}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-300/25 text-purple-100 flex items-center justify-center shrink-0">
              <ActiveModuleIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{activeModuleMeta.label}</h2>
              <p className="text-sm text-white/45 mt-1">{activeModuleMeta.description}</p>
            </div>
          </div>
          {renderModuleHeaderActions()}
        </section>
        {renderActiveModule()}
      </motion.div>
    </div>
  );
};







