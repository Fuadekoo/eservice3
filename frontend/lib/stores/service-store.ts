import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type Requirement = {
  id: string;
  name: string;
  description?: string | null;
};

export type ServiceFor = {
  id: string;
  name: string;
  description?: string | null;
};

/** One staff member handling a service. Mirrors the API's `staffAssignments`. */
export type ServiceStaffAssignment = {
  id: string;
  staffId: string;
  staff: {
    id: string;
    officeId: string;
    user: {
      id: string;
      username: string;
      name?: string | null;
      firstName?: string | null;
      fatherName?: string | null;
      lastName?: string | null;
    };
  };
};

/**
 * Display name for an assigned staff member. The three name parts are the
 * authoritative source — `name` is a denormalized copy that older rows may not
 * have — and the username is the last resort so a row is never blank.
 */
export function staffAssignmentName(
  assignment: ServiceStaffAssignment,
): string {
  const { user } = assignment.staff;
  const composed = [user.firstName, user.fatherName, user.lastName]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return composed || user.name?.trim() || user.username;
}

export type Service = {
  id: string;
  name: string;
  description: string;
  timeToTake: string;
  officeId: string;
  office?: {
    id: string;
    name: string;
  };
  requirements: Requirement[];
  serviceFors: ServiceFor[];
  /** Who handles this service. Absent on older cached payloads. */
  staffAssignments?: ServiceStaffAssignment[];
  createdAt: string;
  updatedAt: string;
};

export type CreateServicePayload = {
  name: string;
  description: string;
  timeToTake: string;
  officeId?: string;
  requirements?: { name: string; description?: string }[];
  serviceFors?: { name: string; description?: string }[];
};

export type UpdateServicePayload = Partial<CreateServicePayload>;

type ServiceStore = {
  services: Service[];
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
  fetchServices: (params?: {
    officeId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  createService: (payload: CreateServicePayload) => Promise<Service>;
  updateService: (
    id: string,
    payload: UpdateServicePayload,
  ) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;
  assignStaff: (serviceId: string, staffId: string) => Promise<void>;
  removeStaff: (serviceId: string, staffId: string) => Promise<void>;
  setError: (error: string | null) => void;
};

/**
 * Sequence number of the most recently issued list request.
 *
 * Typing in the search box fires one request per change, and the replies do
 * not necessarily arrive in the order they were sent — a slower earlier reply
 * landing last would paint results for a query the user has already moved on
 * from. Only the newest request is allowed to write to the store.
 */
let latestListRequest = 0;

export const useServiceStore = create<ServiceStore>((set) => ({
  services: [],
  isLoading: false,
  error: null,
  pagination: null,

  fetchServices: async (params = {}) => {
    const requestId = ++latestListRequest;
    const isStale = () => requestId !== latestListRequest;

    set({ isLoading: true, error: null });
    try {
      const { officeId, search, page = 1, pageSize = 10 } = params;
      const queryParams = new URLSearchParams();
      if (officeId) queryParams.append("officeId", officeId);
      if (search) queryParams.append("search", search);
      queryParams.append("page", page.toString());
      queryParams.append("pageSize", pageSize.toString());

      const response = (await axiosInstance.get<{
        data: Service[];
        pagination: any;
      }>(`/services?${queryParams.toString()}`)) as unknown as {
        data: Service[];
        pagination: any;
      };

      // A superseded reply is discarded rather than rendered; the request
      // that overtook it owns the list, and the loading flag with it.
      if (isStale()) return;

      set({
        services: response.data || [],
        pagination: response.pagination || null,
        isLoading: false,
      });
    } catch (error: any) {
      if (isStale()) return;

      set({
        error: error?.message || "Failed to fetch services",
        isLoading: false,
        services: [],
      });
      throw error;
    }
  },

  createService: async (payload) => {
    try {
      const response = (await axiosInstance.post<{ data: Service }>(
        "/services",
        payload,
      )) as unknown as { data: Service };
      const newService = response.data;
      set((state) => ({ services: [newService, ...state.services] }));
      return newService;
    } catch (error: any) {
      set({ error: error?.message || "Failed to create service" });
      throw error;
    }
  },

  updateService: async (id, payload) => {
    try {
      const response = (await axiosInstance.put<{ data: Service }>(
        `/services/${id}`,
        payload,
      )) as unknown as { data: Service };
      const updatedService = response.data;
      set((state) => ({
        services: state.services.map((s) => (s.id === id ? updatedService : s)),
      }));
      return updatedService;
    } catch (error: any) {
      set({ error: error?.message || "Failed to update service" });
      throw error;
    }
  },

  deleteService: async (id) => {
    try {
      await axiosInstance.delete(`/services/${id}`);
      set((state) => ({
        services: state.services.filter((s) => s.id !== id),
      }));
    } catch (error: any) {
      set({ error: error?.message || "Failed to delete service" });
      throw error;
    }
  },

  // The join is edited one staff member at a time, so both actions patch the
  // service in place rather than refetching the page — a list-wide reload here
  // would drop the caller back to whatever the server's ordering says while
  // they are still working through a dialog.
  assignStaff: async (serviceId, staffId) => {
    const response = (await axiosInstance.post<{
      data: ServiceStaffAssignment;
    }>(`/services/${serviceId}/staff`, { staffId })) as unknown as {
      data: ServiceStaffAssignment;
    };
    const assignment = response.data;
    set((state) => ({
      services: state.services.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              staffAssignments: [
                ...(service.staffAssignments ?? []).filter(
                  (entry) => entry.staffId !== staffId,
                ),
                assignment,
              ],
            }
          : service,
      ),
    }));
  },

  removeStaff: async (serviceId, staffId) => {
    await axiosInstance.delete(`/services/${serviceId}/staff/${staffId}`);
    set((state) => ({
      services: state.services.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              staffAssignments: (service.staffAssignments ?? []).filter(
                (entry) => entry.staffId !== staffId,
              ),
            }
          : service,
      ),
    }));
  },

  setError: (error) => {
    set({ error });
  },
}));
