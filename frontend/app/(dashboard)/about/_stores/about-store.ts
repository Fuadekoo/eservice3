import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type AboutSection = {
  id: string;
  name: string;
  description?: string | null;
  image: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAboutPayload = {
  name: string;
  image: string;
  description?: string;
};

export type UpdateAboutPayload = Partial<CreateAboutPayload>;

type AboutStore = {
  sections: AboutSection[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAbout: () => Promise<void>;
  createAbout: (payload: CreateAboutPayload) => Promise<AboutSection>;
  updateAbout: (id: string, payload: UpdateAboutPayload) => Promise<AboutSection>;
  deleteAbout: (id: string) => Promise<void>;
};

export const useAboutStore = create<AboutStore>((set) => ({
  sections: [],
  isLoading: false,
  error: null,

  fetchAbout: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get<{ data: AboutSection[] }>("/about") as unknown as { data: AboutSection[] };
      set({ sections: response.data || [], isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch about sections",
        isLoading: false,
      });
      throw error;
    }
  },

  createAbout: async (payload) => {
    try {
      const response = await axiosInstance.post<{ data: AboutSection }>("/about", payload) as unknown as { data: AboutSection };
      const newSection = response.data;
      set((state) => ({ sections: [...state.sections, newSection] }));
      return newSection;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create about section" });
      throw error;
    }
  },

  updateAbout: async (id, payload) => {
    try {
      const response = await axiosInstance.put<{ data: AboutSection }>(`/about/${id}`, payload) as unknown as { data: AboutSection };
      const updatedSection = response.data;
      set((state) => ({
        sections: state.sections.map((s) => (s.id === id ? updatedSection : s)),
      }));
      return updatedSection;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update about section" });
      throw error;
    }
  },

  deleteAbout: async (id) => {
    try {
      await axiosInstance.delete(`/about/${id}`);
      set((state) => ({
        sections: state.sections.filter((s) => s.id !== id),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete about section" });
      throw error;
    }
  },
}));
