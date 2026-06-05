import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type SearchFileResult = {
  id: string;
  fileNumber: string;
  firstName: string;
  fatherName: string;
  lastName: string;
  fan: string;
  phone: string;
  address: string;
  woreda: string;
  zone: string;
  city: string;
  state: string;
  country: string;
  folderId: string | null;
  folder: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
    username: string;
  };
  versions: Array<{
    id: string;
    version: number;
    path: string;
    mimeType: string | null;
    size: number | null;
    createdAt: string | Date; // Can be string from API or Date object
  }>;
  createdAt: string;
  updatedAt: string;
};

export type SearchFilters = {
  woreda?: string;
  fan?: string;
  fileNumber?: string;
  phone?: string;
  tagId?: string;
};

type SearchStore = {
  results: SearchFileResult[];
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;

  // Actions
  searchFiles: (
    filters: SearchFilters,
    page?: number,
    pageSize?: number
  ) => Promise<void>;
  setFilters: (filters: SearchFilters) => void;
  clearResults: () => void;
  setError: (error: string | null) => void;
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  results: [],
  isLoading: false,
  error: null,
  filters: {},
  pagination: null,

  searchFiles: async (filters: SearchFilters, page = 1, pageSize = 20) => {
    // Check if at least one filter has a value
    const hasFilter = Object.values(filters).some(
      (value) => value && value.trim().length > 0
    );

    if (!hasFilter) {
      set({ results: [], pagination: null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null, filters });
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize,
      };

      // Only add non-empty filter values
      if (filters.woreda?.trim()) params.woreda = filters.woreda.trim();
      if (filters.fan?.trim()) params.fan = filters.fan.trim();
      if (filters.fileNumber?.trim())
        params.fileNumber = filters.fileNumber.trim();
      if (filters.phone?.trim()) params.phone = filters.phone.trim();
      if (typeof filters.tagId === "string" && filters.tagId.trim() !== "") {
        params.tagId = filters.tagId.trim();
      }

      const response = (await axiosInstance.get<{
        data: SearchFileResult[];
        pagination: any;
      }>("/search", { params })) as unknown as {
        data: SearchFileResult[];
        pagination: any;
      };

      const resultsData = response.data || [];
      const paginationData = response.pagination || null;

      set({
        results: resultsData,
        pagination: paginationData,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("[SearchStore] Error searching files:", error);
      set({
        error: error?.message || "Failed to search files",
        isLoading: false,
        results: [],
        pagination: null,
      });
      throw error;
    }
  },

  setFilters: (filters: SearchFilters) => {
    set({ filters });
  },

  clearResults: () => {
    set({ results: [], pagination: null, filters: {}, error: null });
  },

  setError: (error) => {
    set({ error });
  },
}));
