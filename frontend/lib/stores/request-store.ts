import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type ServiceRequest = {
  id: string;
  user: { id: string; username: string; phoneNumber: string };
  service: {
    id: string;
    name: string;
    office: { id: string; name: string; roomNumber: string; address: string; status: boolean };
  };
  currentAddress: string;
  date: string;
  statusbystaff: "pending" | "approved" | "rejected";
  statusbyadmin: "pending" | "approved" | "rejected";
  approveStaff?: { id: string; user: { id: string; username: string; phoneNumber: string } } | null;
  approveManager?: { id: string; user: { id: string; username: string; phoneNumber: string } } | null;
  appointments: any[];
  fileData: any[];
  customerSatisfaction?: { id: string; rating: number; comment: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

type RequestStore = {
  requests: ServiceRequest[];
  isLoading: boolean;
  error: string | null;
  pagination: Pagination | null;

  fetchRequests: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }) => Promise<void>;
  approveRequestStaff: (id: string, staffId: string, notes?: string) => Promise<void>;
  approveRequestManager: (id: string, approverId: string, notes?: string) => Promise<void>;
  rejectRequest: (id: string, rejectionReason: string) => Promise<void>;
  createAppointment: (requestId: string, date: string, time?: string, notes?: string) => Promise<void>;
};

export const useRequestStore = create<RequestStore>((set) => ({
  requests: [],
  isLoading: false,
  error: null,
  pagination: null,

  fetchRequests: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const q = new URLSearchParams();
      if (params.page) q.set("page", String(params.page));
      if (params.pageSize) q.set("pageSize", String(params.pageSize));
      if (params.search) q.set("search", params.search);
      if (params.status) q.set("status", params.status);

      const res = (await axiosInstance.get(
        `/requests?${q.toString()}`
      )) as unknown as { data: ServiceRequest[]; pagination: Pagination };

      set({ requests: res.data ?? [], pagination: res.pagination ?? null, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.message ?? "Failed to fetch requests",
        isLoading: false,
        requests: [],
      });
    }
  },

  approveRequestStaff: async (id, staffId, notes) => {
    await axiosInstance.patch(`/requests/${id}/approve-staff`, { staffId, notes });
  },

  approveRequestManager: async (id, approverId, notes) => {
    await axiosInstance.patch(`/requests/${id}/approve-admin`, { approverId, notes });
  },

  rejectRequest: async (id, rejectionReason) => {
    await axiosInstance.patch(`/requests/${id}/reject`, { rejectionReason });
  },

  createAppointment: async (requestId, date, time, notes) => {
    // Backend expects a full ISO 8601 datetime string for `date`
    const timeStr = time || "09:00";
    const isoDate = new Date(`${date}T${timeStr}:00`).toISOString();
    await axiosInstance.post(`/appointments`, { requestId, date: isoDate, time, notes });
  },
}));
