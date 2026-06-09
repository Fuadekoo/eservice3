import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import type { ReportStatusKey } from "@/lib/report-utils";

export type ReportUser = {
  id: string;
  username: string;
  phoneNumber: string;
  role?: string | null;
};

export type ReportOffice = {
  id: string;
  name: string;
};

export type ReportFile = {
  id: string;
  name: string;
  filepath: string;
};

export type Report = {
  id: string;
  name: string;
  description: string;
  reportSentTo: string;
  reportSentBy: string;
  receiverStatus: ReportStatusKey;
  sender?: ReportUser | null;
  receiver?: ReportUser | null;
  office?: ReportOffice | null;
  files: ReportFile[];
  filesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ReportFilePayload = {
  name: string;
  filepath: string;
};

export type CreateReportPayload = {
  name: string;
  description: string;
  reportSentTo: string;
  files: ReportFilePayload[];
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type FetchReportsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  officeId?: string;
  status?: string;
  month?: number;
  year?: number;
  scope?: "inbox" | "sent" | "all";
};

type ReportStore = {
  reports: Report[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  adminUsers: ReportUser[];
  managerUsers: ReportUser[];
  pagination: Pagination | null;

  fetchReports: (params?: FetchReportsParams) => Promise<void>;
  fetchReportById: (id: string) => Promise<Report>;
  createReport: (payload: CreateReportPayload) => Promise<Report>;
  updateReportStatus: (id: string, status: ReportStatusKey) => Promise<Report>;
  approveReport: (id: string) => Promise<Report>;
  rejectReport: (id: string) => Promise<Report>;
  deleteReport: (id: string) => Promise<void>;
  fetchAdminUsers: () => Promise<void>;
  fetchManagerUsers: () => Promise<void>;
};

export const useReportStore = create<ReportStore>((set) => ({
  reports: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  adminUsers: [],
  managerUsers: [],
  pagination: null,

  fetchReports: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const q = new URLSearchParams();
      if (params.page) q.set("page", String(params.page));
      if (params.pageSize) q.set("pageSize", String(params.pageSize));
      if (params.search) q.set("search", params.search);
      if (params.officeId) q.set("officeId", params.officeId);
      if (params.status) q.set("status", params.status);
      if (params.month) q.set("month", String(params.month));
      if (params.year) q.set("year", String(params.year));
      if (params.scope) q.set("scope", params.scope);

      const res = (await axiosInstance.get(
        `/reports?${q.toString()}`,
      )) as unknown as { data: Report[]; pagination: Pagination };

      set({
        reports: res.data ?? [],
        pagination: res.pagination ?? null,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.message ?? "Failed to fetch reports",
        isLoading: false,
        reports: [],
      });
    }
  },

  fetchReportById: async (id) => {
    const res = (await axiosInstance.get(`/reports/${id}`)) as unknown as {
      data: Report;
    };
    return res.data;
  },

  createReport: async (payload) => {
    set({ isSubmitting: true });
    try {
      const res = (await axiosInstance.post(
        "/reports",
        payload,
      )) as unknown as { data: Report };
      const newReport = res.data;
      set((state) => ({
        reports: [newReport, ...state.reports],
        isSubmitting: false,
      }));
      return newReport;
    } catch (err: any) {
      set({ isSubmitting: false });
      throw err;
    }
  },

  updateReportStatus: async (id, status) => {
    const res = (await axiosInstance.patch(`/reports/${id}/status`, {
      status,
    })) as unknown as { data: Report };
    const updated = res.data;
    set((state) => ({
      reports: state.reports.map((r) => (r.id === id ? updated : r)),
    }));
    return updated;
  },

  approveReport: async (id) => {
    return useReportStore.getState().updateReportStatus(id, "approved");
  },

  rejectReport: async (id) => {
    return useReportStore.getState().updateReportStatus(id, "rejected");
  },

  deleteReport: async (id) => {
    await axiosInstance.delete(`/reports/${id}`);
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    }));
  },

  fetchAdminUsers: async () => {
    try {
      const res = (await axiosInstance.get("/reports/admins")) as unknown as {
        data: ReportUser[];
      };
      set({ adminUsers: res.data ?? [] });
    } catch {
      set({ adminUsers: [] });
    }
  },

  fetchManagerUsers: async () => {
    try {
      const res = (await axiosInstance.get("/reports/managers")) as unknown as {
        data: ReportUser[];
      };
      set({ managerUsers: res.data ?? [] });
    } catch {
      set({ managerUsers: [] });
    }
  },
}));

export type { ReportStatusKey as ReportStatus };
