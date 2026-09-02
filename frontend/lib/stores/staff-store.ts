import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type StaffMember = {
  id: string;
  name: string;
  firstName?: string | null;
  fatherName?: string | null;
  lastName?: string | null;
  phone: string;
  username: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "BLOCKED";
  role: {
    id: string;
    name: string;
    description?: string | null;
  };
  /** The office this staff row belongs to. Always set by the API. */
  officeId?: string | null;
  office?: {
    id: string;
    name: string;
    status?: string | null;
  } | null;
  assignedServicesCount?: number;
  createdAt: string;
  updatedAt: string;
};

function normalizeStaffMember(raw: any): StaffMember {
  const user = raw?.user ?? {};
  const firstName = raw?.firstName ?? user?.firstName ?? null;
  const fatherName = raw?.fatherName ?? user?.fatherName ?? null;
  const lastName = raw?.lastName ?? user?.lastName ?? null;
  const derivedName = [firstName, fatherName, lastName]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim();

  return {
    id: raw?.id ?? "",
    name: raw?.name ?? (derivedName || user?.username || "Unknown Staff"),
    firstName,
    fatherName,
    lastName,
    phone:
      raw?.phone ?? raw?.phoneNumber ?? user?.phone ?? user?.phoneNumber ?? "",
    username: raw?.username ?? user?.username ?? "",
    gender: raw?.gender ?? "OTHER",
    status: raw?.status ?? (user?.isActive === false ? "INACTIVE" : "ACTIVE"),
    role: raw?.role ?? {
      id: "",
      name: "Unassigned",
      description: null,
    },
    officeId: raw?.officeId ?? raw?.office?.id ?? null,
    office: raw?.office ?? null,
    assignedServicesCount: raw?.assignedServicesCount ?? 0,
    createdAt: raw?.createdAt ?? user?.createdAt ?? "",
    updatedAt: raw?.updatedAt ?? user?.updatedAt ?? "",
  };
}

export type CreateStaffMemberPayload = {
  firstName: string;
  fatherName: string;
  lastName: string;
  name?: string; // Optional: can be recomputed by backend
  phone: string;
  username: string;
  password: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  status?: "ACTIVE" | "INACTIVE" | "PENDING" | "BLOCKED";
  roleId?: string;
  roleName?: string;
  officeId?: string; // Optional: specify office for super admins
};

export type UpdateStaffMemberPayload = Partial<CreateStaffMemberPayload> & {
  name?: string;
};

type StaffStore = {
  staff: StaffMember[];
  currentStaff: StaffMember | null;
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
  fetchStaff: (opts?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    roleId?: string;
    roleName?: string;
    officeId?: string;
  }) => Promise<void>;
  getStaff: (id: string) => Promise<StaffMember>;
  createStaff: (payload: CreateStaffMemberPayload) => Promise<StaffMember>;
  updateStaff: (
    id: string,
    payload: UpdateStaffMemberPayload,
  ) => Promise<StaffMember>;
  deleteStaff: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
};

export const useStaffStore = create<StaffStore>((set, get) => ({
  staff: [],
  currentStaff: null,
  isLoading: false,
  error: null,
  pagination: null,

  fetchStaff: async (opts = {}) => {
    set({ isLoading: true, error: null });
    try {
      const {
        page = 1,
        pageSize = 50,
        search,
        status,
        roleId,
        roleName,
        officeId,
      } = opts;
      const params: Record<string, unknown> = { page, pageSize };
      if (search) params.search = search;
      if (status) params.status = status;
      if (roleId) params.roleId = roleId;
      if (roleName) params.roleName = roleName;
      if (officeId) params.officeId = officeId;

      const response = (await axiosInstance.get<{
        data: StaffMember[];
        pagination: any;
      }>("/staff", { params })) as unknown as {
        data: StaffMember[];
        pagination: any;
      };
      set({
        staff: (response.data || []).map(normalizeStaffMember),
        pagination: response.pagination || null,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch staff",
        isLoading: false,
        staff: [],
        pagination: null,
      });
      throw error;
    }
  },

  getStaff: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = (await axiosInstance.get<{ data: StaffMember }>(
        `/staff/${id}`,
      )) as unknown as { data: StaffMember };
      const normalizedStaff = normalizeStaffMember(response.data);
      set({ currentStaff: normalizedStaff, isLoading: false });
      return normalizedStaff;
    } catch (error: any) {
      set({
        error: error?.message || "Failed to fetch staff member",
        isLoading: false,
        currentStaff: null,
      });
      throw error;
    }
  },

  createStaff: async (payload) => {
    try {
      const url = payload.officeId
        ? `/staff?officeId=${payload.officeId}`
        : "/staff";

      const response = (await axiosInstance.post<{ data: StaffMember }>(
        url,
        payload,
      )) as unknown as { data: StaffMember };
      const newStaff = normalizeStaffMember(response.data);
      set((state) => ({ staff: [...state.staff, newStaff] }));
      return newStaff;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create staff member" });
      throw error;
    }
  },

  updateStaff: async (id, payload) => {
    try {
      const response = (await axiosInstance.put<{ data: StaffMember }>(
        `/staff/${id}`,
        payload,
      )) as unknown as { data: StaffMember };
      const updatedStaff = normalizeStaffMember(response.data);
      set((state) => ({
        staff: state.staff.map((member) =>
          member.id === id ? updatedStaff : member,
        ),
        currentStaff:
          state.currentStaff?.id === id ? updatedStaff : state.currentStaff,
      }));
      return updatedStaff;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update staff member" });
      throw error;
    }
  },

  deleteStaff: async (id) => {
    try {
      await axiosInstance.delete(`/staff/${id}`);
      set((state) => ({
        staff: state.staff.filter((member) => member.id !== id),
        currentStaff: state.currentStaff?.id === id ? null : state.currentStaff,
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete staff member" });
      throw error;
    }
  },

  setError: (error) => {
    set({ error });
  },
}));
