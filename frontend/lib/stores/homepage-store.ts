import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { useOfficeStore, type Office } from "@/lib/stores/office-store";
import { useAdministrationStore } from "@/lib/stores/administration-store";
import { useGalleryStore } from "@/lib/stores/gallery-store";

export type HomepageServiceItem = {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  roomNumber?: string | null;
  requirements?: { id: string; name: string; description?: string | null }[];
  serviceFors?: { id: string; name: string; description?: string | null }[];
};

export type HomepageOfficeDetail = Office & {
  service?: HomepageServiceItem[];
};

type HomepageStore = {
  searchQuery: string;
  selectedOffice: HomepageOfficeDetail | null;
  isOfficeDialogOpen: boolean;
  isFetchingOfficeDetail: boolean;
  selectedService: HomepageServiceItem | null;
  isInitialized: boolean;

  setSearchQuery: (query: string) => void;
  initializeHomepage: () => Promise<void>;
  getFilteredOffices: () => Office[];
  openOfficeDialog: (office: Office) => Promise<void>;
  closeOfficeDialog: () => void;
  setSelectedService: (service: HomepageServiceItem | null) => void;
  reset: () => void;
};

const initialState = {
  searchQuery: "",
  selectedOffice: null as HomepageOfficeDetail | null,
  isOfficeDialogOpen: false,
  isFetchingOfficeDetail: false,
  selectedService: null as HomepageServiceItem | null,
  isInitialized: false,
};

export const useHomepageStore = create<HomepageStore>((set, get) => ({
  ...initialState,

  setSearchQuery: (query) => set({ searchQuery: query }),

  initializeHomepage: async () => {
    const { fetchOffices } = useOfficeStore.getState();
    const { fetchAdministration } = useAdministrationStore.getState();
    const { fetchGalleries } = useGalleryStore.getState();

    await Promise.all([
      fetchOffices(),
      fetchAdministration(),
      fetchGalleries({ pageSize: 4 }),
    ]);

    set({ isInitialized: true });
  },

  getFilteredOffices: () => {
    const { offices } = useOfficeStore.getState();
    const { searchQuery } = get();
    const activeOffices = offices.filter((office) => office.status !== false);

    const query = searchQuery.trim().toLowerCase();
    if (!query) return activeOffices;

    return activeOffices.filter(
      (office) =>
        office.name.toLowerCase().includes(query) ||
        office.description?.toLowerCase().includes(query) ||
        office.service?.some((service) =>
          service.name.toLowerCase().includes(query),
        ),
    );
  },

  openOfficeDialog: async (office) => {
    set({ isFetchingOfficeDetail: true });
    try {
      const response = (await axiosInstance.get(
        `/offices/${office.id}/public`,
      )) as unknown as { data: HomepageOfficeDetail };
      set({
        selectedOffice: response.data,
        isOfficeDialogOpen: true,
        selectedService: null,
      });
    } catch {
      set({
        selectedOffice: office as HomepageOfficeDetail,
        isOfficeDialogOpen: true,
        selectedService: null,
      });
    } finally {
      set({ isFetchingOfficeDetail: false });
    }
  },

  closeOfficeDialog: () =>
    set({
      isOfficeDialogOpen: false,
      selectedOffice: null,
      selectedService: null,
    }),

  setSelectedService: (service) => set({ selectedService: service }),

  reset: () => set(initialState),
}));
