import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  permissions: Permission[];
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type Permission = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateRolePayload = {
  name: string;
  description?: string;
  permissions?: string[];
};

export type UpdateRolePayload = Partial<CreateRolePayload>;

export type CreatePermissionPayload = {
  code: string;
  name: string;
  description?: string;
};

export type UpdatePermissionPayload = Partial<CreatePermissionPayload>;

type SecurityStore = {
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;

  // Role Actions
  fetchRoles: (opts?: { officeId?: string; search?: string }) => Promise<void>;
  getRole: (id: string) => Promise<Role>;
  createRole: (payload: CreateRolePayload) => Promise<Role>;
  updateRole: (id: string, payload: UpdateRolePayload) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;

  // Permission Actions
  fetchPermissions: () => Promise<void>;
  createPermission: (payload: CreatePermissionPayload) => Promise<Permission>;
  updatePermission: (
    id: string,
    payload: UpdatePermissionPayload,
  ) => Promise<Permission>;
  deletePermission: (id: string) => Promise<void>;

  setError: (error: string | null) => void;
};

export const useSecurityStore = create<SecurityStore>((set) => ({
  roles: [],
  permissions: [],
  isLoading: false,
  error: null,

  fetchRoles: async (opts = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { officeId, search } = opts;
      const params: Record<string, any> = {};
      if (officeId) params.officeId = officeId;
      if (search) params.search = search;

      const response = (await axiosInstance.get<{ data: Role[] }>(
        "/security/roles",
        { params },
      )) as unknown as { data: Role[] };
      set({ roles: response.data || [], isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch roles",
        isLoading: false,
        roles: [],
      });
      throw error;
    }
  },

  getRole: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = (await axiosInstance.get<{ data: Role }>(
        `/security/roles/${id}`,
      )) as unknown as { data: Role };
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch role",
        isLoading: false,
      });
      throw error;
    }
  },

  createRole: async (payload) => {
    try {
      const response = (await axiosInstance.post<{ data: Role }>(
        "/security/roles",
        payload,
      )) as unknown as { data: Role };
      const newRole = response.data;
      set((state) => ({ roles: [...state.roles, newRole] }));
      return newRole;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create role" });
      throw error;
    }
  },

  updateRole: async (id, payload) => {
    try {
      const response = (await axiosInstance.put<{ data: Role }>(
        `/security/roles/${id}`,
        payload,
      )) as unknown as { data: Role };
      const updatedRole = response.data;
      set((state) => ({
        roles: state.roles.map((role) => (role.id === id ? updatedRole : role)),
      }));
      return updatedRole;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update role" });
      throw error;
    }
  },

  deleteRole: async (id) => {
    try {
      await axiosInstance.delete(`/security/roles/${id}`);
      set((state) => ({
        roles: state.roles.filter((role) => role.id !== id),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete role" });
      throw error;
    }
  },

  fetchPermissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = (await axiosInstance.get<{ data: Permission[] }>(
        "/security/permissions",
      )) as unknown as { data: Permission[] };
      set({ permissions: response.data || [], isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch permissions",
        isLoading: false,
        permissions: [],
      });
      throw error;
    }
  },

  createPermission: async (payload) => {
    try {
      const response = (await axiosInstance.post<{ data: Permission }>(
        "/security/permissions",
        payload,
      )) as unknown as { data: Permission };
      const newPermission = response.data;
      set((state) => ({ permissions: [...state.permissions, newPermission] }));
      return newPermission;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create permission" });
      throw error;
    }
  },

  updatePermission: async (id, payload) => {
    try {
      const response = (await axiosInstance.put<{ data: Permission }>(
        `/security/permissions/${id}`,
        payload,
      )) as unknown as { data: Permission };
      const updatedPermission = response.data;
      set((state) => ({
        permissions: state.permissions.map((permission) =>
          permission.id === id ? updatedPermission : permission,
        ),
      }));
      return updatedPermission;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update permission" });
      throw error;
    }
  },

  deletePermission: async (id) => {
    try {
      await axiosInstance.delete(`/security/permissions/${id}`);
      set((state) => ({
        permissions: state.permissions.filter(
          (permission) => permission.id !== id,
        ),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete permission" });
      throw error;
    }
  },

  setError: (error) => {
    set({ error });
  },
}));
