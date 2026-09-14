import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type ServiceRequest = {
  id: string;
  /** Human-readable reference (REQ-YYYYMMDD-NNNNN) shown to the customer. */
  requestNumber: string;
  user: { id: string; username: string; phoneNumber: string };
  service: {
    id: string;
    name: string;
    office: { id: string; name: string; roomNumber: string; address: string; status: boolean };
  };
  currentAddress: string;
  date: string;
  /** Who the request is for; null when the applicant applied for themselves. */
  beneficiary: {
    name: string;
    phoneNumber: string;
    relationship: string;
  } | null;
  statusbystaff: "pending" | "approved" | "rejected";
  statusbyadmin: "pending" | "approved" | "rejected";
  /** Which table the row came from; "other" is a request for a family member. */
  beneficiaryType?: "self" | "other";
  approveStaff?: Decider | null;
  approveManager?: Decider | null;
  /** Notes left by whoever reviewed it, newest appended. */
  approveNote?: string | null;
  /**
   * Why it was turned down. Persisted rather than only sent by SMS, so the
   * customer can still read it in the portal days later.
   */
  rejectionReason?: string | null;
  /** When the decision behind the current status was taken. */
  decidedAt?: string | null;
  /** Set when this request was folded into another as a duplicate. */
  mergedInto?: { id: string; requestNumber: string } | null;
  /** Duplicates that were folded into this one. */
  mergedDuplicates?: Array<{ id: string; requestNumber: string; createdAt: string }>;
  mergedAt?: string | null;
  mergeNote?: string | null;
  appointments: any[];
  fileData: any[];
  customerSatisfaction?: { id: string; rating: number; comment: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

/** Whoever took a decision, as the API returns them. */
export type Decider = {
  id: string;
  user: { id: string; username: string; name?: string | null; phoneNumber?: string };
};

/** The display name for a decider, preferring their full name. */
export function deciderName(decider?: Decider | null): string | null {
  if (!decider) return null;
  return decider.user?.name?.trim() || decider.user?.username || null;
}

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
    officeId?: string;
  }) => Promise<void>;
  approveRequestStaff: (id: string, staffId: string, notes?: string) => Promise<void>;
  approveRequestManager: (id: string, approverId: string, notes?: string) => Promise<void>;
  rejectRequest: (id: string, rejectionReason: string) => Promise<void>;
  mergeRequests: (
    primaryId: string,
    duplicateIds: string[],
    note?: string
  ) => Promise<number>;
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
      if (params.officeId) q.set("officeId", params.officeId);

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

  /**
   * Fold duplicate applications into one.
   *
   * The duplicates keep their reference numbers and their place in the record;
   * they are marked as merged and closed, and their attachments move to the
   * surviving request. Returns how many were absorbed.
   */
  mergeRequests: async (primaryId, duplicateIds, note) => {
    const res = (await axiosInstance.post(`/requests/${primaryId}/merge`, {
      duplicateIds,
      note,
    })) as unknown as { mergedCount?: number };

    return res?.mergedCount ?? duplicateIds.length;
  },

  createAppointment: async (requestId, date, time, notes) => {
    // Backend expects a full ISO 8601 datetime string for `date`
    const timeStr = time || "09:00";
    const isoDate = new Date(`${date}T${timeStr}:00`).toISOString();
    await axiosInstance.post(`/appointments`, { requestId, date: isoDate, time, notes });
  },
}));
