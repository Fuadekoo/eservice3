import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type Tag = {
  id: string;
  name: string;
  _count?: {
    files: number;
  };
};

export type CreateTagPayload = {
  name: string;
};

export type UpdateTagPayload = Partial<CreateTagPayload>;

type TagStore = {
  tags: Tag[];
  currentTag: Tag | null;
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
  fetchTags: (opts?: { page?: number; pageSize?: number; search?: string }) => Promise<void>;
  getTag: (id: string) => Promise<void>;
  createTag: (payload: CreateTagPayload) => Promise<Tag>;
  updateTag: (id: string, payload: UpdateTagPayload) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
};

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  currentTag: null,
  isLoading: false,
  error: null,
  pagination: null,

  fetchTags: async (opts = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { page = 1, pageSize = 50, search } = opts;
      const params: Record<string, unknown> = { page, pageSize };
      if (search) params.search = search;

      const response = (await axiosInstance.get<{
        data: Tag[];
        pagination: any;
      }>("/tags", { params })) as unknown as {
        data: Tag[];
        pagination: any;
      };
      set({
        tags: response.data || [],
        pagination: response.pagination || null,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch tags",
        isLoading: false,
        tags: [],
        pagination: null,
      });
      throw error;
    }
  },

  getTag: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = (await axiosInstance.get<{ data: Tag }>(
        `/tags/${id}`
      )) as unknown as { data: Tag };
      set({ currentTag: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch tag",
        isLoading: false,
        currentTag: null,
      });
      throw error;
    }
  },

  createTag: async (payload) => {
    try {
      const response = (await axiosInstance.post<{ data: Tag }>(
        "/tags",
        payload
      )) as unknown as { data: Tag };
      const newTag = response.data;
      set((state) => ({ tags: [...state.tags, newTag] }));
      return newTag;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create tag" });
      throw error;
    }
  },

  updateTag: async (id, payload) => {
    try {
      const response = (await axiosInstance.put<{ data: Tag }>(
        `/tags/${id}`,
        payload
      )) as unknown as { data: Tag };
      const updatedTag = response.data;
      set((state) => ({
        tags: state.tags.map((tag) => (tag.id === id ? updatedTag : tag)),
        currentTag: state.currentTag?.id === id ? updatedTag : state.currentTag,
      }));
      return updatedTag;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update tag" });
      throw error;
    }
  },

  deleteTag: async (id) => {
    try {
      await axiosInstance.delete(`/tags/${id}`);
      set((state) => ({
        tags: state.tags.filter((tag) => tag.id !== id),
        currentTag: state.currentTag?.id === id ? null : state.currentTag,
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete tag" });
      throw error;
    }
  },

  setError: (error) => {
    set({ error });
  },
}));

