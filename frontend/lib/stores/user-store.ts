import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type UserRole = {
  id: string;
  name: string;
};

export type UserOffice = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  username: string;
  firstName?: string | null;
  fatherName?: string | null;
  lastName?: string | null;
  phoneNumber: string;
  phoneVerified: boolean;
  isActive: boolean;
  role: UserRole | null;
  staff?: {
    id: string;
    officeId: string;
    office?: UserOffice | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserPayload = {
  username: string;
  firstName: string;
  fatherName: string;
  lastName: string;
  phoneNumber: string;
  password?: string;
  roleId?: string;
  roleName?: string;
  officeId?: string;
  isActive?: boolean;
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

type UserStore = {
  users: User[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;

  // Actions
  fetchUsers: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    roleId?: string;
    roleName?: string;
    officeId?: string;
    isActive?: boolean;
  }) => Promise<void>;
  createUser: (payload: CreateUserPayload) => Promise<User>;
  updateUser: (id: string, payload: UpdateUserPayload) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  isLoading: false,
  error: null,
  pagination: null,

  fetchUsers: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { page = 1, pageSize = 10, search, roleId, roleName, officeId, isActive } = params;
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("pageSize", pageSize.toString());
      if (search) queryParams.append("search", search);
      if (roleId) queryParams.append("roleId", roleId);
      if (roleName) queryParams.append("roleName", roleName);
      if (officeId) queryParams.append("officeId", officeId);
      if (isActive !== undefined) queryParams.append("isActive", isActive.toString());

      const response = (await axiosInstance.get<{
        success: boolean;
        data: User[];
        pagination: any;
      }>(`/users?${queryParams.toString()}`)) as unknown as {
        success: boolean;
        data: User[];
        pagination: any;
      };

      set({
        users: response.data || [],
        pagination: response.pagination || null,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch users",
        isLoading: false,
        users: [],
        pagination: null,
      });
      throw error;
    }
  },

  createUser: async (payload) => {
    try {
      const response = (await axiosInstance.post<{
        success: boolean;
        data: User;
      }>("/users", payload)) as unknown as { success: boolean; data: User };
      const newUser = response.data;
      set((state) => ({ users: [newUser, ...state.users] }));
      return newUser;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create user" });
      throw error;
    }
  },

  updateUser: async (id, payload) => {
    try {
      const response = (await axiosInstance.put<{
        success: boolean;
        data: User;
      }>(`/users/${id}`, payload)) as unknown as {
        success: boolean;
        data: User;
      };
      const updatedUser = response.data;
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
      }));
      return updatedUser;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update user" });
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete user" });
      throw error;
    }
  },

  setError: (error) => {
    set({ error });
  },
}));
