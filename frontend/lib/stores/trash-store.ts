import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type TrashItem = {
  id: string;
  fileId: string | null;
  deletedBy: string;
  deletedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
  file: {
    id: string;
    fileNumber: string;
    firstName: string;
    fatherName: string;
    lastName: string;
  } | null;
  type: "file";
};

export type ListTrashOptions = {
  page?: number;
  pageSize?: number;
  type?: "file" | "all";
  search?: string;
};

type TrashStore = {
  trash: TrashItem[];
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
  fetchTrash: (opts?: ListTrashOptions) => Promise<void>;
  restoreTrash: (id: string) => Promise<void>;
  deleteTrashPermanently: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
};

export const useTrashStore = create<TrashStore>((set, get) => ({
  trash: [],
  isLoading: false,
  error: null,
  pagination: null,

  fetchTrash: async (opts = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { page = 1, pageSize = 50, search } = opts;
      const params: Record<string, unknown> = { page, pageSize };
      // Only files are in trash, so type is always "file"
      if (search) params.search = search;

      console.log("[TrashStore] Fetching trash with params:", params);
      const response = await axiosInstance.get<{ data: TrashItem[]; pagination: any }>("/trash", { params }) as unknown as { data: TrashItem[]; pagination: any };
      
      console.log("[TrashStore] Response received:", {
        response: response,
        hasData: !!response,
        dataKeys: response ? Object.keys(response) : [],
        dataLength: response?.data?.length,
        pagination: response?.pagination,
      });
      
      set({ 
        trash: response.data || [], 
        pagination: response.pagination || null,
        isLoading: false 
      });
    } catch (error: any) {
      console.error("[TrashStore] Error fetching trash:", error);
      console.error("[TrashStore] Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      set({
        error: error?.message || "Failed to fetch trash items",
        isLoading: false,
        trash: [],
        pagination: null,
      });
      throw error;
    }
  },

  restoreTrash: async (id: string) => {
    try {
      await axiosInstance.post(`/trash/${id}/restore`);
      set((state) => ({
        trash: state.trash.filter((item) => item.id !== id),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to restore trash item" });
      throw error;
    }
  },

  deleteTrashPermanently: async (id: string) => {
    try {
      await axiosInstance.delete(`/trash/${id}`);
      set((state) => ({
        trash: state.trash.filter((item) => item.id !== id),
      }));
    } catch (error: any) {
      set({
        error: error?.message || "Failed to delete trash item permanently",
      });
      throw error;
    }
  },

  setError: (error) => {
    set({ error });
  },
}));
