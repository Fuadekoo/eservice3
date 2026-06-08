import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type ReportStatus = "pending" | "sent" | "received" | "read" | "archived";

export type ReportUser = {
  id: string;
  username: string;
  phoneNumber: string;
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
  receiverStatus: ReportStatus;
  sender?: ReportUser | null;
  receiver?: ReportUser | null;
  office?: ReportOffice | null;
  files: ReportFile[];
  filesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateReportPayload = {
  name: string;
  description: string;
  reportSentTo: string;
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
};

type ReportStore = {
  reports: Report[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  adminUsers: ReportUser[];
  pagination: Pagination | null;

  fetchReports: (params?: FetchReportsParams) => Promise<void>;
  createReport: (payload: CreateReportPayload) => Promise<Report>;
  updateReportStatus: (id: string, status: ReportStatus) => Promise<Report>;
  deleteReport: (id: string) => Promise<void>;
  fetchAdminUsers: () => Promise<void>;
};

export const useReportStore = create<ReportStore>((set) => ({
  reports: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  adminUsers: [],
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

      const res = (await axiosInstance.get(
        `/reports?${q.toString()}`
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

  createReport: async (payload) => {
    set({ isSubmitting: true });
    try {
      const res = (await axiosInstance.post(
        "/reports",
        payload
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
    try {
      const res = (await axiosInstance.patch(
        `/reports/${id}/status`,
        { status }
      )) as unknown as { data: Report };
      const updated = res.data;
      set((state) => ({
        reports: state.reports.map((r) => (r.id === id ? updated : r)),
      }));
      return updated;
    } catch (err: any) {
      throw err;
    }
  },

  deleteReport: async (id) => {
    try {
      await axiosInstance.delete(`/reports/${id}`);
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
      }));
    } catch (err: any) {
      throw err;
    }
  },

  fetchAdminUsers: async () => {
    try {
      const res = (await axiosInstance.get(
        "/reports/admins"
      )) as unknown as { data: ReportUser[] };
      set({ adminUsers: res.data ?? [] });
    } catch {
      // silently fail — non-critical
    }
  },
}));
