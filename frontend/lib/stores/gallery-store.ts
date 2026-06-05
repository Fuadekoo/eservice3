import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type GalleryImage = {
  id: string;
  galleryId: string;
  filename: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Gallery = {
  id: string;
  name: string;
  description?: string | null;
  images: GalleryImage[];
  createdAt: string;
  updatedAt: string;
};

export type CreateGalleryPayload = {
  name: string;
  description?: string;
};

export type UpdateGalleryPayload = Partial<CreateGalleryPayload>;

export type GalleryPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type GalleryStore = {
  galleries: Gallery[];
  isLoading: boolean;
  error: string | null;
  pagination: GalleryPagination | null;

  // Actions
  fetchGalleries: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => Promise<void>;
  createGallery: (payload: CreateGalleryPayload) => Promise<Gallery>;
  updateGallery: (
    id: string,
    payload: UpdateGalleryPayload,
  ) => Promise<Gallery>;
  deleteGallery: (id: string) => Promise<void>;
  addImage: (
    galleryId: string,
    payload: { filename: string; order?: number },
  ) => Promise<GalleryImage>;
  deleteImage: (imageId: string) => Promise<void>;
};

export const useGalleryStore = create<GalleryStore>((set) => ({
  galleries: [],
  isLoading: false,
  error: null,
  pagination: null,

  fetchGalleries: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { page = 1, pageSize = 12, search } = params;
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("pageSize", pageSize.toString());
      if (search) queryParams.append("search", search);

      const response = (await axiosInstance.get<{
        data: Gallery[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>(`/gallery?${queryParams.toString()}`)) as unknown as {
        data: Gallery[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };

      set({
        galleries: response.data || [],
        pagination: {
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          totalPages: response.totalPages,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch galleries",
        isLoading: false,
        galleries: [],
        pagination: null,
      });
      throw error;
    }
  },

  createGallery: async (payload) => {
    try {
      const response = (await axiosInstance.post<{ data: Gallery }>(
        "/gallery",
        payload,
      )) as unknown as { data: Gallery };
      const newGallery = response.data;
      set((state) => ({ galleries: [newGallery, ...state.galleries] }));
      return newGallery;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create gallery" });
      throw error;
    }
  },

  updateGallery: async (id, payload) => {
    try {
      const response = (await axiosInstance.put<{ data: Gallery }>(
        `/gallery/${id}`,
        payload,
      )) as unknown as { data: Gallery };
      const updatedGallery = response.data;
      set((state) => ({
        galleries: state.galleries.map((g) =>
          g.id === id ? updatedGallery : g,
        ),
      }));
      return updatedGallery;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update gallery" });
      throw error;
    }
  },

  deleteGallery: async (id) => {
    try {
      await axiosInstance.delete(`/gallery/${id}`);
      set((state) => ({
        galleries: state.galleries.filter((g) => g.id !== id),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete gallery" });
      throw error;
    }
  },

  addImage: async (galleryId, payload) => {
    try {
      const response = (await axiosInstance.post<{ data: GalleryImage }>(
        `/gallery/${galleryId}/images`,
        payload,
      )) as unknown as { data: GalleryImage };
      const newImage = response.data;
      set((state) => ({
        galleries: state.galleries.map((g) =>
          g.id === galleryId ? { ...g, images: [...g.images, newImage] } : g,
        ),
      }));
      return newImage;
    } catch (error: any) {
      set({ error: error?.message || "Failed to add image" });
      throw error;
    }
  },

  deleteImage: async (imageId) => {
    try {
      await axiosInstance.delete(`/gallery/images/${imageId}`);
      set((state) => ({
        galleries: state.galleries.map((g) => ({
          ...g,
          images: g.images.filter((img) => img.id !== imageId),
        })),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete image" });
      throw error;
    }
  },
}));
