import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type FileTag = {
  fileId: string;
  tagId: string;
  tag?: {
    id: string;
    name: string;
  };
};

type FileTagStore = {
  isLoading: boolean;
  error: string | null;

  attachTag: (fileId: string, tagId: string) => Promise<void>;
  detachTag: (fileId: string, tagId: string) => Promise<void>;
};

export const useFileTagStore = create<FileTagStore>((set) => ({
  isLoading: false,
  error: null,

  attachTag: async (fileId, tagId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post("/file-tags", { fileId, tagId });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || "Failed to attach tag",
        isLoading: false,
      });
      throw error;
    }
  },

  detachTag: async (fileId, tagId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/file-tags/${fileId}/${tagId}`);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || "Failed to detach tag",
        isLoading: false,
      });
      throw error;
    }
  },
}));
