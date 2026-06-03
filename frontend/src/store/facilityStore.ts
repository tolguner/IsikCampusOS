import { create } from 'zustand';
import { api } from '../lib/api';

export interface AvailabilityRule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom?: string;
  validTo?: string;
  status?: 'ACTIVE' | 'PAUSED';
}

export interface FacilityPolicy {
  id?: string;
  facilityId?: string;
  bookingWindowDays: number;
  minNoticeMinutes: number;
  cancellationDeadlineMinutes: number;
  checkinRequired: boolean;
  autoNoShowMinutes: number;
  maxBookingDurationMinutes: number;
  status?: string;
}

export interface FacilityResource {
  id: string;
  facilityId: string;
  resourceCode: string;
  name: string;
  resourceType: 'MEETING_ROOM' | 'STUDY_ROOM' | 'SPORTS_AREA' | 'LAB' | 'OTHER';
  capacity: number;
  bookable: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  availabilityRules: AvailabilityRule[];
}

export interface Facility {
  id: string;
  name: string;
  facilityType: 'MEETING_ROOM' | 'STUDY_ROOM' | 'SPORTS_AREA' | 'LAB' | 'OTHER';
  description?: string;
  locationText?: string;
  capacity: number;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  policy?: FacilityPolicy;
  resources: FacilityResource[];
}

type FacilityForm = {
  name: string;
  facilityType: string;
  description: string;
  locationText: string;
  capacity: number;
  status?: string;
};

type ResourceForm = {
  resourceCode: string;
  name: string;
  resourceType: string;
  capacity: number;
  bookable: boolean;
  status?: string;
};

interface FacilityState {
  facilities: Facility[];
  selectedFacilityId: string | null;
  selectedResourceId: string | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
  selectFacility: (facilityId: string | null) => void;
  selectResource: (resourceId: string | null) => void;
  fetchFacilities: () => Promise<void>;
  createFacility: (data: FacilityForm) => Promise<boolean>;
  updateFacility: (facilityId: string, data: FacilityForm) => Promise<boolean>;
  createResource: (facilityId: string, data: ResourceForm) => Promise<boolean>;
  updateResource: (resourceId: string, data: ResourceForm) => Promise<boolean>;
  updatePolicy: (facilityId: string, data: FacilityPolicy) => Promise<boolean>;
  replaceAvailabilityRules: (resourceId: string, rules: AvailabilityRule[]) => Promise<boolean>;
  deleteFacility: (facilityId: string) => Promise<boolean>;
}

const getErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

const mapFacilityType = (type: string): Facility['facilityType'] => {
  switch (type) {
    case 'TOPLANTI_ODASI': return 'MEETING_ROOM';
    case 'CALISMA_ODASI': return 'STUDY_ROOM';
    case 'SPOR_ALANI': return 'SPORTS_AREA';
    case 'LABORATUVAR': return 'LAB';
    case 'DIGER': return 'OTHER';
    default: return type as any;
  }
};

const mapReverseFacilityType = (type: string): string => {
  switch (type) {
    case 'MEETING_ROOM': return 'TOPLANTI_ODASI';
    case 'STUDY_ROOM': return 'CALISMA_ODASI';
    case 'SPORTS_AREA': return 'SPOR_ALANI';
    case 'LAB': return 'LABORATUVAR';
    case 'OTHER': return 'DIGER';
    default: return type;
  }
};

const mapStatus = (status: string): 'ACTIVE' | 'PAUSED' | 'ARCHIVED' => {
  switch (status) {
    case 'AKTIF': return 'ACTIVE';
    case 'DURDURULMUS': return 'PAUSED';
    case 'ARSIVLENMIS': return 'ARCHIVED';
    default: return status as any;
  }
};

const mapReverseStatus = (status: string): string => {
  switch (status) {
    case 'ACTIVE': return 'AKTIF';
    case 'PAUSED': return 'DURDURULMUS';
    case 'ARCHIVED': return 'ARSIVLENMIS';
    default: return status;
  }
};

const mapRuleStatus = (status: string): 'ACTIVE' | 'PAUSED' => {
  switch (status) {
    case 'AKTIF': return 'ACTIVE';
    case 'DURDURULMUS': return 'PAUSED';
    default: return status as any;
  }
};

const mapReverseRuleStatus = (status: string): string => {
  switch (status) {
    case 'ACTIVE': return 'AKTIF';
    case 'PAUSED': return 'DURDURULMUS';
    default: return status;
  }
};

const mapPolicy = (data: any): FacilityPolicy | undefined => {
  if (!data) return undefined;
  return {
    id: data.id,
    facilityId: data.tesisId,
    bookingWindowDays: data.rezervasyonPenceresiGun,
    minNoticeMinutes: data.minimumBildirimDakika,
    cancellationDeadlineMinutes: data.iptalLimitDakika,
    checkinRequired: data.yoklamaZorunlu,
    autoNoShowMinutes: data.otomatikGelmemeDakika,
    maxBookingDurationMinutes: data.maksimumRezervasyonSureDakika,
    status: mapRuleStatus(data.durum)
  };
};

const mapRule = (data: any): AvailabilityRule => ({
  id: data.id,
  dayOfWeek: data.haftaninGunu,
  startTime: data.baslangicSaati,
  endTime: data.bitisSaati,
  validFrom: data.gecerlilikBaslangici,
  validTo: data.gecerlilikBitisi,
  status: mapRuleStatus(data.durum)
});

const mapResource = (data: any): FacilityResource => ({
  id: data.id,
  facilityId: data.tesisId,
  resourceCode: data.kaynakKodu,
  name: data.ad,
  resourceType: mapFacilityType(data.kaynakTuru),
  capacity: data.kapasite,
  bookable: data.rezervasyonYapilabilir,
  status: mapStatus(data.durum),
  availabilityRules: data.kullanimKurallari ? data.kullanimKurallari.map(mapRule) : []
});

const mapFacility = (data: any): Facility => ({
  id: data.id,
  name: data.ad,
  facilityType: mapFacilityType(data.tesisTuru),
  description: data.aciklama,
  locationText: data.konumMetni,
  capacity: data.kapasite,
  status: mapStatus(data.durum),
  policy: mapPolicy(data.politika),
  resources: data.kaynaklar ? data.kaynaklar.map(mapResource) : []
});

export const useFacilityStore = create<FacilityState>((set, get) => ({
  facilities: [],
  selectedFacilityId: null,
  selectedResourceId: null,
  isLoading: false,
  error: null,
  successMessage: null,

  clearMessages: () => set({ error: null, successMessage: null }),
  selectFacility: (facilityId) => {
    const facility = get().facilities.find(item => item.id === facilityId);
    set({
      selectedFacilityId: facilityId,
      selectedResourceId: facility?.resources?.[0]?.id || null,
      error: null,
      successMessage: null,
    });
  },
  selectResource: (resourceId) => set({ selectedResourceId: resourceId }),

  fetchFacilities: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<any[]>('/tesisler');
      const facilities = res.data.map(mapFacility);
      const currentFacilityId = get().selectedFacilityId;
      const selectedFacility = facilities.find(item => item.id === currentFacilityId) || facilities[0] || null;
      const selectedResourceId = selectedFacility?.resources?.find(item => item.id === get().selectedResourceId)?.id
        || selectedFacility?.resources?.[0]?.id
        || null;
      set({
        facilities,
        selectedFacilityId: selectedFacility?.id || null,
        selectedResourceId,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Tesisler yüklenemedi.'), isLoading: false });
    }
  },

  createFacility: async (data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        ad: data.name,
        tesisTuru: mapReverseFacilityType(data.facilityType),
        aciklama: data.description,
        konumMetni: data.locationText,
        kapasite: data.capacity,
        durum: mapReverseStatus(data.status || 'ACTIVE')
      };
      const res = await api.post<any>('/tesisler', payload);
      set({ selectedFacilityId: res.data.id, successMessage: 'Tesis oluşturuldu.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Tesis oluşturulamadı.'), isLoading: false });
      return false;
    }
  },

  updateFacility: async (facilityId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        ad: data.name,
        tesisTuru: mapReverseFacilityType(data.facilityType),
        aciklama: data.description,
        konumMetni: data.locationText,
        kapasite: data.capacity,
        durum: mapReverseStatus(data.status || 'ACTIVE')
      };
      await api.patch(`/tesisler/${facilityId}`, payload);
      set({ successMessage: 'Tesis bilgileri güncellendi.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Tesis güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  createResource: async (facilityId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        kaynakKodu: data.resourceCode,
        ad: data.name,
        kaynakTuru: mapReverseFacilityType(data.resourceType),
        kapasite: data.capacity,
        rezervasyonYapilabilir: data.bookable,
        durum: mapReverseStatus(data.status || 'ACTIVE')
      };
      const res = await api.post<any>(`/tesisler/${facilityId}/kaynaklar`, payload);
      set({ selectedResourceId: res.data.id, successMessage: 'Kaynak oluşturuldu.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kaynak oluşturulamadı.'), isLoading: false });
      return false;
    }
  },

  updateResource: async (resourceId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        kaynakKodu: data.resourceCode,
        ad: data.name,
        kaynakTuru: mapReverseFacilityType(data.resourceType),
        kapasite: data.capacity,
        rezervasyonYapilabilir: data.bookable,
        durum: mapReverseStatus(data.status || 'ACTIVE')
      };
      await api.patch(`/tesis-kaynaklari/${resourceId}`, payload);
      set({ successMessage: 'Kaynak güncellendi.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kaynak güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  updatePolicy: async (facilityId, data) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = {
        rezervasyonPenceresiGun: data.bookingWindowDays,
        minimumBildirimDakika: data.minNoticeMinutes,
        iptalLimitDakika: data.cancellationDeadlineMinutes,
        yoklamaZorunlu: data.checkinRequired,
        otomatikGelmemeDakika: data.autoNoShowMinutes,
        maksimumRezervasyonSureDakika: data.maxBookingDurationMinutes
      };
      await api.put(`/tesisler/${facilityId}/politika`, payload);
      set({ successMessage: 'Rezervasyon kriterleri güncellendi.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Kriterler güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  replaceAvailabilityRules: async (resourceId, rules) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      const payload = rules.map(rule => ({
        haftaninGunu: rule.dayOfWeek,
        baslangicSaati: rule.startTime,
        bitisSaati: rule.endTime,
        gecerlilikBaslangici: rule.validFrom,
        gecerlilikBitisi: rule.validTo,
        durum: mapReverseRuleStatus(rule.status || 'ACTIVE')
      }));
      await api.put(`/tesis-kaynaklari/${resourceId}/kullanilabilirlik-kurallari`, payload);
      set({ successMessage: 'Haftalık uygunluk güncellendi.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Uygunluk kuralları güncellenemedi.'), isLoading: false });
      return false;
    }
  },

  deleteFacility: async (facilityId) => {
    set({ isLoading: true, error: null, successMessage: null });
    try {
      await api.delete(`/tesisler/${facilityId}`);
      set({ selectedFacilityId: null, selectedResourceId: null, successMessage: 'Tesis silindi.', isLoading: false });
      await get().fetchFacilities();
      return true;
    } catch (err: any) {
      set({ error: getErrorMessage(err, 'Tesis silinemedi.'), isLoading: false });
      return false;
    }
  },
}));
