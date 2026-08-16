import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export type NotificationKind =
  | "request"
  | "request_approved"
  | "request_rejected"
  | "appointment"
  | "appointment_approved"
  | "appointment_cancelled"
  | "appointment_reminder"
  | "report"
  | "feedback"
  | "system";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  url: string;
  icon: string | null;
  kind: NotificationKind;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type FetchOptions = {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  /** Append to the existing list instead of replacing it — "load more". */
  append?: boolean;
};

type NotificationStore = {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: Pagination | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  fetchNotifications: (options?: FetchOptions) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  reset: () => void;
};

const DEFAULT_PAGE_SIZE = 20;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  pagination: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,

  fetchNotifications: async (options = {}) => {
    const {
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      unreadOnly = false,
      append = false,
    } = options;

    set(append ? { isLoadingMore: true } : { isLoading: true, error: null });

    try {
      // The response interceptor unwraps to the JSON body, but its declared
      // type is still AxiosResponse — hence the cast, as elsewhere in the app.
      const response = (await axiosInstance.get("/notifications", {
        params: {
          page,
          pageSize,
          ...(unreadOnly ? { unreadOnly: true } : {}),
        },
      })) as unknown as {
        data: AppNotification[];
        pagination: Pagination;
        unreadCount: number;
      };

      const incoming: AppNotification[] = response?.data ?? [];

      set((state) => ({
        notifications: append
          ? // Guards against a duplicate row when a push lands between pages.
            [
              ...state.notifications,
              ...incoming.filter(
                (item) =>
                  !state.notifications.some((existing) => existing.id === item.id),
              ),
            ]
          : incoming,
        pagination: response?.pagination ?? null,
        unreadCount: response?.unreadCount ?? state.unreadCount,
        isLoading: false,
        isLoadingMore: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        isLoadingMore: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load notifications",
      });
    }
  },

  /**
   * Badge-only refresh. Polled on a timer and after a push arrives, so it
   * deliberately fetches a single number rather than the whole list.
   */
  fetchUnreadCount: async () => {
    try {
      const response = await axiosInstance.get("/notifications/unread-count");
      const unreadCount = response?.data?.unreadCount;
      if (typeof unreadCount === "number") set({ unreadCount });
    } catch {
      // A failed poll is not worth surfacing — the next tick tries again.
    }
  },

  markAsRead: async (id) => {
    const target = get().notifications.find((item) => item.id === id);
    if (target?.isRead) return;

    // Optimistic: the badge should drop the instant the row is opened.
    const previous = get().notifications;
    const previousCount = get().unreadCount;

    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      const response = await axiosInstance.patch(`/notifications/${id}/read`);
      const unreadCount = response?.data?.unreadCount;
      if (typeof unreadCount === "number") set({ unreadCount });
    } catch {
      set({ notifications: previous, unreadCount: previousCount });
    }
  },

  markAllAsRead: async () => {
    const previous = get().notifications;
    const previousCount = get().unreadCount;

    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.isRead
          ? item
          : { ...item, isRead: true, readAt: new Date().toISOString() },
      ),
      unreadCount: 0,
    }));

    try {
      await axiosInstance.patch("/notifications/read-all");
    } catch (error) {
      set({
        notifications: previous,
        unreadCount: previousCount,
        error:
          error instanceof Error ? error.message : "Failed to mark all as read",
      });
    }
  },

  removeNotification: async (id) => {
    const previous = get().notifications;
    const previousCount = get().unreadCount;
    const target = previous.find((item) => item.id === id);

    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
      unreadCount:
        target && !target.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
    }));

    try {
      await axiosInstance.delete(`/notifications/${id}`);
    } catch {
      set({ notifications: previous, unreadCount: previousCount });
    }
  },

  clearAll: async () => {
    const previous = get().notifications;
    const previousCount = get().unreadCount;

    set({ notifications: [], unreadCount: 0, pagination: null });

    try {
      await axiosInstance.delete("/notifications");
    } catch (error) {
      set({
        notifications: previous,
        unreadCount: previousCount,
        error:
          error instanceof Error
            ? error.message
            : "Failed to clear notifications",
      });
    }
  },

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      pagination: null,
      isLoading: false,
      isLoadingMore: false,
      error: null,
    }),
}));
