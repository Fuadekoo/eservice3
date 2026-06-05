import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

// Types for dashboard analytics
export type DashboardAnalytics = {
  files: number;
  folders: number;
  staff: number;
  tags: number;
  trash: number;
  offices?: number;
  auditLogs?: number;
};

export type FileOverview = {
  total: number;
  inFolders: number;
  withoutFolders: number;
  recentUploads: number;
};

export type FolderOverview = {
  total: number;
  withFiles: number;
  empty: number;
  withSubfolders: number;
  recentCreated: number;
  totalFiles: number;
};

export type StaffOverview = {
  name: string;
  count: number;
};

export type TagOverview = {
  name: string;
  count: number;
};

export type TrashOverview = {
  name: string;
  count: number;
};

type DashboardStore = {
  // Analytics data
  analytics: DashboardAnalytics | null;
  fileOverview: FileOverview | null;
  folderOverview: FolderOverview | null;
  staffOverview: StaffOverview | null;
  tagOverview: TagOverview | null;
  trashOverview: TrashOverview | null;

  // Loading states
  isLoadingAnalytics: boolean;
  isLoadingFileOverview: boolean;
  isLoadingFolderOverview: boolean;
  isLoadingStaffOverview: boolean;
  isLoadingTagOverview: boolean;
  isLoadingTrashOverview: boolean;

  // Error states
  error: string | null;

  // Actions
  fetchAnalytics: () => Promise<void>;
  fetchFileOverview: () => Promise<void>;
  fetchFolderOverview: () => Promise<void>;
  fetchStaffOverview: () => Promise<void>;
  fetchTagOverview: () => Promise<void>;
  fetchTrashOverview: () => Promise<void>;
  fetchAllOverviews: () => Promise<void>;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initialState = {
  analytics: null,
  fileOverview: null,
  folderOverview: null,
  staffOverview: null,
  tagOverview: null,
  trashOverview: null,
  isLoadingAnalytics: false,
  isLoadingFileOverview: false,
  isLoadingFolderOverview: false,
  isLoadingStaffOverview: false,
  isLoadingTagOverview: false,
  isLoadingTrashOverview: false,
  error: null,
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  ...initialState,

  fetchAnalytics: async () => {
    set({ isLoadingAnalytics: true, error: null });
    try {
      const response = await axiosInstance.get<{ data: DashboardAnalytics }>(
        "/dashboard/analytics"
      ) as unknown as { data: DashboardAnalytics };
      set({ analytics: response.data, isLoadingAnalytics: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch dashboard analytics",
        isLoadingAnalytics: false,
      });
      throw error;
    }
  },

  fetchFileOverview: async () => {
    set({ isLoadingFileOverview: true, error: null });
    try {
      const response = await axiosInstance.get<FileOverview>(
        "/dashboard/files/overview"
      ) as unknown as FileOverview;
      set({ fileOverview: response, isLoadingFileOverview: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch file overview",
        isLoadingFileOverview: false,
      });
      throw error;
    }
  },

  fetchFolderOverview: async () => {
    set({ isLoadingFolderOverview: true, error: null });
    try {
      const response = await axiosInstance.get<FolderOverview>(
        "/dashboard/folders/overview"
      ) as unknown as FolderOverview;
      set({ folderOverview: response, isLoadingFolderOverview: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch folder overview",
        isLoadingFolderOverview: false,
      });
      throw error;
    }
  },

  fetchStaffOverview: async () => {
    set({ isLoadingStaffOverview: true, error: null });
    try {
      const response = await axiosInstance.get<StaffOverview>(
        "/dashboard/staff/overview"
      ) as unknown as StaffOverview;
      set({ staffOverview: response, isLoadingStaffOverview: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch staff overview",
        isLoadingStaffOverview: false,
      });
      throw error;
    }
  },

  fetchTagOverview: async () => {
    set({ isLoadingTagOverview: true, error: null });
    try {
      const response = await axiosInstance.get<TagOverview>(
        "/dashboard/tags/overview"
      ) as unknown as TagOverview;
      set({ tagOverview: response, isLoadingTagOverview: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch tag overview",
        isLoadingTagOverview: false,
      });
      throw error;
    }
  },

  fetchTrashOverview: async () => {
    set({ isLoadingTrashOverview: true, error: null });
    try {
      const response = await axiosInstance.get<TrashOverview>(
        "/dashboard/trash/overview"
      ) as unknown as TrashOverview;
      set({ trashOverview: response, isLoadingTrashOverview: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch trash overview",
        isLoadingTrashOverview: false,
      });
      throw error;
    }
  },

  fetchAllOverviews: async () => {
    set({ error: null });
    const store = useDashboardStore.getState();

    // Fetch all overviews in parallel
    await Promise.allSettled([
      store.fetchAnalytics(),
      store.fetchFileOverview(),
      store.fetchFolderOverview(),
      store.fetchStaffOverview(),
      store.fetchTagOverview(),
      store.fetchTrashOverview(),
    ]);
  },

  setError: (error) => {
    set({ error });
  },

  reset: () => {
    set(initialState);
  },
}));
