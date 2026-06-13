import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Search,
} from 'lucide-react';
import { useKulupDeposu, type Kulup } from '../depolar/kulupDeposu';
import { useEtkinlikDeposu, type Etkinlik } from '../depolar/etkinlikDeposu';
import { useBildirimDeposu } from '../depolar/bildirimDeposu';
import { useOgrenciDeposu, type Student } from '../depolar/ogrenciDeposu';
import { useAkademikKadroDeposu, type AcademicAdvisor } from '../depolar/akademikKadroDeposu';
import { DuyuruButonu } from '../components/DuyuruButonu';

import {
  type SksModule,
  panelStyle,
  initialClubForm,
  moduleMeta,
  type KulupDuzenleFormu,
} from '../components/sks-paneli/ortak';
import { ProfilTalepModulu } from '../components/sks-paneli/ProfilTalepModulu';
import { EtkinlikModulu } from '../components/sks-paneli/EtkinlikModulu';
import { SaglikModulu } from '../components/sks-paneli/SaglikModulu';
import { KulupModulu } from '../components/sks-paneli/KulupModulu';
import { OlusturModulu } from '../components/sks-paneli/OlusturModulu';

export const SksPaneli = () => {
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
  } = useKulupDeposu();
  const {
    reviewQueue,
    isLoading: eventsLoading,
    error: eventError,
    successMessage: eventSuccess,
    fetchReviewQueue,
    approveEvent,
    requestRevision,
  } = useEtkinlikDeposu();
  const { hata: notificationError } = useBildirimDeposu();
  const { students, fetchStudents, isLoading: studentsLoading } = useOgrenciDeposu();
  const {
    advisors,
    searchAdvisors,
    syncAdvisors,
    isLoading: advisorsLoading,
    error: advisorError,
  } = useAkademikKadroDeposu();

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
  const [clubEditForm, setClubEditForm] = useState<KulupDuzenleFormu>({
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
  const [revisionTextByProfileRequest, setRevisionTextByProfileRequest] = useState<Record<string, string>>({});
  const [healthMessageByClub, setHealthMessageByClub] = useState<Record<string, string>>({});
  const [healthLogSearchByClub, setHealthLogSearchByClub] = useState<Record<string, string>>({});

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
    <KulupModulu
      filteredClubs={filteredClubs}
      clubsLoading={clubsLoading}
      editingClubId={editingClubId}
      setEditingClubId={setEditingClubId}
      startEditingClub={startEditingClub}
      changeClubStatus={changeClubStatus}
      deleteClub={deleteClub}
      handleUpdateClubProfile={handleUpdateClubProfile}
      clubEditForm={clubEditForm}
      setClubEditForm={setClubEditForm}
      handleEditLogoFileSelect={handleEditLogoFileSelect}
      handleEditPresidentSearch={handleEditPresidentSearch}
      students={students}
      studentsLoading={studentsLoading}
      isPresidentAssignedToAnotherClub={isPresidentAssignedToAnotherClub}
      handleEditPresidentSelect={handleEditPresidentSelect}
      selectedEditPresidentName={selectedEditPresidentName}
      syncAdvisors={syncAdvisors}
      advisorsLoading={advisorsLoading}
      advisors={advisors}
      isAdvisorAssignedToAnotherClub={isAdvisorAssignedToAnotherClub}
      handleEditAdvisorSelect={handleEditAdvisorSelect}
      selectedEditAdvisorDisplayName={selectedEditAdvisorDisplayName}
    />
  );

  const renderCreateModule = () => (
    <OlusturModulu
      handleCreateClub={handleCreateClub}
      clubForm={clubForm}
      setClubForm={setClubForm}
      logoSource={logoSource}
      logoCropScale={logoCropScale}
      logoCropX={logoCropX}
      logoCropY={logoCropY}
      setLogoCropScale={setLogoCropScale}
      setLogoDragStart={setLogoDragStart}
      handleLogoDragStart={handleLogoDragStart}
      handleLogoDragMove={handleLogoDragMove}
      handleLogoWheel={handleLogoWheel}
      handleLogoFileSelect={handleLogoFileSelect}
      cropLogoToSquare={cropLogoToSquare}
      syncAdvisors={syncAdvisors}
      advisorsLoading={advisorsLoading}
      advisors={advisors}
      assignedAdvisorIds={assignedAdvisorIds}
      handleAdvisorSelect={handleAdvisorSelect}
      selectedAdvisorDisplayName={selectedAdvisorDisplayName}
      selectedAdvisorUnavailable={selectedAdvisorUnavailable}
      handlePresidentSearch={handlePresidentSearch}
      students={students}
      studentsLoading={studentsLoading}
      assignedPresidentIds={assignedPresidentIds}
      selectedPresident={selectedPresident}
      selectedPresidentUnavailable={selectedPresidentUnavailable}
      clubsLoading={clubsLoading}
    />
  );

  const renderEventsModule = () => (
    <EtkinlikModulu
      reviewQueue={reviewQueue}
      eventsLoading={eventsLoading}
      formatEventDate={formatEventDate}
      eventLocationLabel={eventLocationLabel}
      approveEvent={approveEvent}
      handleRevision={handleRevision}
      revisionTextByEvent={revisionTextByEvent}
      setRevisionTextByEvent={setRevisionTextByEvent}
    />
  );

  const renderProfileRequestsModule = () => (
    <ProfilTalepModulu
      profileChangeRequests={profileChangeRequests}
      clubsLoading={clubsLoading}
      approveProfileChangeRequest={approveProfileChangeRequest}
      handleProfileChangeRevision={handleProfileChangeRevision}
      handleProfileChangeReject={handleProfileChangeReject}
      revisionTextByProfileRequest={revisionTextByProfileRequest}
      setRevisionTextByProfileRequest={setRevisionTextByProfileRequest}
    />
  );


  const renderHealthModule = () => (
    <SaglikModulu
      totalClubCount={clubs.length}
      activeClubCount={activeClubCount}
      inactiveClubCount={inactiveClubCount}
      clubHealth={clubHealth}
      clubAuditLogsByClub={clubAuditLogsByClub}
      healthMessageByClub={healthMessageByClub}
      setHealthMessageByClub={setHealthMessageByClub}
      healthLogSearchByClub={healthLogSearchByClub}
      setHealthLogSearchByClub={setHealthLogSearchByClub}
      addClubHealthNote={addClubHealthNote}
      watchlistClub={watchlistClub}
      requestClubHealthAction={requestClubHealthAction}
      fetchClubAuditLogs={fetchClubAuditLogs}
    />
  );

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'create':
        return renderCreateModule();
      case 'events':
        return renderEventsModule();
      case 'profileRequests':
        return renderProfileRequestsModule();
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
            İş akışını seç, yalnızca o modüle odaklan. Kulüp yönetimi, kayıt oluşturma ve etkinlik talepleri ayrı alanlarda çalışır.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DuyuruButonu />
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







