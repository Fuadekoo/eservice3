import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type AnalyticsData = {
  overview: {
    totalFiles: number;
    totalFolders: number;
    totalUsers: number;
    totalFileVersions: number;
    totalStorageSize: number;
    totalTrashItems: number;
    totalShares: number;
  };
  files: {
    total: number;
    withFolder: number;
    withoutFolder: number;
    byMonth: Array<{ month: string; files: number }>;
  };
  folders: {
    total: number;
    withFiles: number;
    withSubfolders: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Array<{ role: string; count: number }>;
  };
  shares: {
    total: number;
    active: number;
    inactive: number;
  };
};

type AnalyticsStore = {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
  setError: (error: string | null) => void;
};

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = (await axiosInstance.get<{ data: AnalyticsData }>(
        "/analytics"
      )) as unknown as { data: AnalyticsData };
      set({ data: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch analytics",
        isLoading: false,
        data: null,
      });
      throw error;
    }
  },

  setError: (error) => {
    set({ error });
  },
}));

