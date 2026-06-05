import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { getToken } from "@/lib/auth-client";

export type FileShare = {
  id: string;
  fileId: string;
  token: string;
  expiresAt: string | null;
  isActive: boolean;
  shareType: "PUBLIC" | "SYSTEM_USER";
  createdById: string;
  createdAt: string;
  shareUrl: string;
  file: {
    id: string;
    fileNumber: string;
    firstName: string;
    fatherName: string;
    lastName: string;
  };
  createdBy: {
    id: string;
    name: string;
    username: string;
  };
};

export type CreateSharePayload = {
  fileId: string;
  expiresAt?: string | null;
  shareType?: "PUBLIC" | "SYSTEM_USER";
};

export type UpdateSharePayload = {
  expiresAt?: string | null;
  isActive?: boolean;
};

export type SharePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ShareStore = {
  shares: FileShare[];
  pagination: SharePagination | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchShares: (params?: {
    page?: number;
    limit?: number;
    fileId?: string;
    isActive?: boolean;
  }) => Promise<void>;
  createShare: (payload: CreateSharePayload) => Promise<FileShare>;
  updateShare: (id: string, payload: UpdateSharePayload) => Promise<FileShare>;
  deleteShare: (id: string) => Promise<void>;
  getSharedFileByToken: (token: string) => Promise<any>;
  setError: (error: string | null) => void;
};

export const useShareStore = create<ShareStore>((set, get) => ({
  shares: [],
  pagination: null,
  isLoading: false,
  error: null,

  fetchShares: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { page = 1, limit = 50, fileId, isActive } = params;
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      if (fileId) queryParams.append("fileId", fileId);
      if (isActive !== undefined)
        queryParams.append("isActive", isActive.toString());

      const response = (await axiosInstance.get<{
        data: FileShare[];
        pagination: SharePagination;
      }>(`/share?${queryParams.toString()}`)) as unknown as {
        data: FileShare[];
        pagination: SharePagination;
      };

      set({
        shares: response.data || [],
        pagination: response.pagination || null,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch shares",
        isLoading: false,
        shares: [],
        pagination: null,
      });
      throw error;
    }
  },

  createShare: async (payload) => {
    try {
      const response = (await axiosInstance.post<{
        data: FileShare;
        shareUrl: string;
      }>("/share", payload)) as unknown as {
        data: FileShare;
        shareUrl: string;
      };
      const newShare = { ...response.data, shareUrl: response.shareUrl };
      set((state) => ({
        shares: [newShare, ...state.shares],
      }));
      return newShare;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create share" });
      throw error;
    }
  },

  updateShare: async (id, payload) => {
    try {
      const response = (await axiosInstance.put<{ data: FileShare }>(
        `/share/${id}`,
        payload
      )) as unknown as { data: FileShare };
      const updatedShare = response.data;
      set((state) => ({
        shares: state.shares.map((s) => (s.id === id ? updatedShare : s)),
      }));
      return updatedShare;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update share" });
      throw error;
    }
  },

  deleteShare: async (id) => {
    try {
      await axiosInstance.delete(`/share/${id}`);
      set((state) => ({
        shares: state.shares.filter((s) => s.id !== id),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete share" });
      throw error;
    }
  },

  getSharedFileByToken: async (token) => {
    try {
      // Public endpoint - use fetch, but include auth token if available for SYSTEM_USER shares
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      const tokenAuth = getToken();
      if (tokenAuth) {
        headers["Authorization"] = `Bearer ${tokenAuth}`;
      }

      const response = await fetch(`${baseURL}/share/public/${token}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch shared file";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to fetch shared file";
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  setError: (error) => {
    set({ error });
  },
}));
