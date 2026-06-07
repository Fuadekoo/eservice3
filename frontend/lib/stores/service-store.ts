import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type Requirement = {
  id: string;
  name: string;
  description?: string | null;
};

export type ServiceFor = {
  id: string;
  name: string;
  description?: string | null;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  officeId: string;
  office?: {
    id: string;
    name: string;
  };
  requirements: Requirement[];
  serviceFors: ServiceFor[];
  createdAt: string;
  updatedAt: string;
};

export type CreateServicePayload = {
  name: string;
  description: string;
  timeToTake: string;
  officeId?: string;
  requirements?: { name: string; description?: string }[];
  serviceFors?: { name: string; description?: string }[];
};

export type UpdateServicePayload = Partial<CreateServicePayload>;

type ServiceStore = {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;

  // Actions
  fetchServices: (params?: {
    officeId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  createService: (payload: CreateServicePayload) => Promise<Service>;
  updateService: (id: string, payload: UpdateServicePayload) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
};

export const useServiceStore = create<ServiceStore>((set) => ({
  services: [],
  isLoading: false,
  error: null,
  pagination: null,

  fetchServices: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { officeId, search, page = 1, pageSize = 10 } = params;
      const queryParams = new URLSearchParams();
      if (officeId) queryParams.append("officeId", officeId);
      if (search) queryParams.append("search", search);
      queryParams.append("page", page.toString());
      queryParams.append("pageSize", pageSize.toString());

      const response = (await axiosInstance.get<{
        data: Service[];
        pagination: any;
      }>(`/services?${queryParams.toString()}`)) as unknown as {
        data: Service[];
        pagination: any;
      };

      set({
        services: response.data || [],
        pagination: response.pagination || null,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch services",
        isLoading: false,
        services: [],
      });
      throw error;
    }
  },

  createService: async (payload) => {
    try {
      const response = (await axiosInstance.post<{ data: Service }>(
        "/services",
        payload,
      )) as unknown as { data: Service };
      const newService = response.data;
      set((state) => ({ services: [newService, ...state.services] }));
      return newService;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create service" });
      throw error;
    }
  },

  updateService: async (id, payload) => {
    try {
      const response = (await axiosInstance.put<{ data: Service }>(
        `/services/${id}`,
        payload,
      )) as unknown as { data: Service };
      const updatedService = response.data;
      set((state) => ({
        services: state.services.map((s) => (s.id === id ? updatedService : s)),
      }));
      return updatedService;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update service" });
      throw error;
    }
  },

  deleteService: async (id) => {
    try {
      await axiosInstance.delete(`/services/${id}`);
      set((state) => ({
        services: state.services.filter((s) => s.id !== id),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete service" });
      throw error;
    }
  },

  setError: (error) => {
    set({ error });
  },
}));
