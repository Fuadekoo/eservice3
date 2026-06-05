import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type Office = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  logo?: string | null;
  slogan?: string | null;
  roomNumber: string;
  phoneNumber?: string | null;
  subdomain: string;
  status: boolean;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    service: number;
    staffs: number;
    requests?: number;
    appointments?: number;
  };
  service?: {
    id: string;
    name: string;
    description?: string | null;
    timeToTake?: string;
  }[];
};

export type CreateOfficePayload = {
  name: string;
  phoneNumber?: string;
  roomNumber: string;
  address: string;
  subdomain: string;
  logo?: string;
  slogan?: string;
  description?: string;
  status?: boolean;
};

export type UpdateOfficePayload = Partial<CreateOfficePayload>;

type OfficeStore = {
  offices: Office[];
  currentOffice: Office | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOffices: () => Promise<void>;
  getOffice: (id: string) => Promise<void>;
  createOffice: (payload: CreateOfficePayload) => Promise<Office>;
  updateOffice: (id: string, payload: UpdateOfficePayload) => Promise<Office>;
  deleteOffice: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
};

export const useOfficeStore = create<OfficeStore>((set, get) => ({
  offices: [],
  currentOffice: null,
  isLoading: false,
  error: null,

  fetchOffices: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = (await axiosInstance.get<{ data: Office[] }>(
        "/offices",
      )) as unknown as { data: Office[] };
      set({ offices: response.data || [], isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch offices",
        isLoading: false,
        offices: [],
      });
      throw error;
    }
  },

  getOffice: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = (await axiosInstance.get<{ data: Office }>(
        `/offices/${id}`,
      )) as unknown as { data: Office };
      set({ currentOffice: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch office",
        isLoading: false,
        currentOffice: null,
      });
      throw error;
    }
  },

  createOffice: async (payload) => {
    try {
      const response = (await axiosInstance.post<{ data: Office }>(
        "/offices",
        payload,
      )) as unknown as { data: Office };
      const newOffice = response.data;
      set((state) => ({ offices: [...state.offices, newOffice] }));
      return newOffice;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create office" });
      throw error;
    }
  },

  updateOffice: async (id, payload) => {
    try {
      const response = (await axiosInstance.put<{ data: Office }>(
        `/offices/${id}`,
        payload,
      )) as unknown as { data: Office };
      const updatedOffice = response.data;
      set((state) => ({
        offices: state.offices.map((office) =>
          office.id === id ? updatedOffice : office,
        ),
        currentOffice:
          state.currentOffice?.id === id ? updatedOffice : state.currentOffice,
      }));
      return updatedOffice;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update office" });
      throw error;
    }
  },

  deleteOffice: async (id) => {
    try {
      await axiosInstance.delete(`/offices/${id}`);
      set((state) => ({
        offices: state.offices.filter((office) => office.id !== id),
        currentOffice:
          state.currentOffice?.id === id ? null : state.currentOffice,
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete office" });
      throw error;
    }
  },

  setError: (error) => {
    set({ error });
  },
}));
