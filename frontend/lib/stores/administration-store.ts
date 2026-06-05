import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type Administration = {
  id: string;
  name: string;
  description?: string | null;
  image: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdministrationPayload = {
  name: string;
  image: string;
  description?: string;
};

export type UpdateAdministrationPayload = Partial<CreateAdministrationPayload>;

type AdministrationStore = {
  sections: Administration[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAdministration: () => Promise<void>;
  createAdministration: (payload: CreateAdministrationPayload) => Promise<Administration>;
  updateAdministration: (id: string, payload: UpdateAdministrationPayload) => Promise<Administration>;
  deleteAdministration: (id: string) => Promise<void>;
};

export const useAdministrationStore = create<AdministrationStore>((set) => ({
  sections: [],
  isLoading: false,
  error: null,

  fetchAdministration: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get<{ data: Administration[] }>("/administration") as unknown as { data: Administration[] };
      set({ sections: response.data || [], isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch administration sections",
        isLoading: false,
      });
      throw error;
    }
  },

  createAdministration: async (payload) => {
    try {
      const response = await axiosInstance.post<{ data: Administration }>("/administration", payload) as unknown as { data: Administration };
      const newSection = response.data;
      set((state) => ({ sections: [...state.sections, newSection] }));
      return newSection;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create administration section" });
      throw error;
    }
  },

  updateAdministration: async (id, payload) => {
    try {
      const response = await axiosInstance.put<{ data: Administration }>(`/administration/${id}`, payload) as unknown as { data: Administration };
      const updatedSection = response.data;
      set((state) => ({
        sections: state.sections.map((s) => (s.id === id ? updatedSection : s)),
      }));
      return updatedSection;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update administration section" });
      throw error;
    }
  },

  deleteAdministration: async (id) => {
    try {
      await axiosInstance.delete(`/administration/${id}`);
      set((state) => ({
        sections: state.sections.filter((s) => s.id !== id),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete administration section" });
      throw error;
    }
  },
}));
