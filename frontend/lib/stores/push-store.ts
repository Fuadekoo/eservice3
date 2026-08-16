import { create } from "zustand";
import { toast } from "sonner";

import { axiosInstance } from "@/lib/axios";
import {
  getCurrentSubscription,
  getPermission,
  getPublicKey,
  isIosWithoutStandalone,
  isPushSupported,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
  type PushPermission,
} from "@/lib/push";

/**
 * Web Push state for the whole app.
 *
 * Held in a store rather than a hook because two places need the same answer
 * at the same time — the header bell decides whether to offer the permission
 * prompt, and the settings card draws the switch — and duplicating it means
 * two permission probes per page load and two views that can disagree.
 *
 * The three failure modes are deliberately kept distinct: an unsupported
 * browser, a blocked permission, and a server without VAPID keys all look
 * identical to a user ("the switch does nothing") but need entirely different
 * advice.
 */

export type PushDevice = {
  id: string;
  endpoint: string;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
};

type PushStore = {
  /** Still working out what this browser supports. */
  isChecking: boolean;
  /** The browser can do Web Push. */
  isSupported: boolean;
  /** The server has VAPID keys, so push is actually available. */
  isServerEnabled: boolean;
  permission: PushPermission;
  isSubscribed: boolean;
  /** A subscribe/unsubscribe round trip is in flight. */
  isBusy: boolean;
  /** iOS only grants push to home-screen installs. */
  needsHomeScreenInstall: boolean;

  /** Endpoint of the subscription this browser holds, if any. */
  currentEndpoint: string | null;
  devices: PushDevice[];
  isLoadingDevices: boolean;

  refresh: () => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  toggle: (next: boolean) => Promise<void>;
  test: () => Promise<void>;
  loadDevices: () => Promise<void>;
  removeDevice: (device: PushDevice) => Promise<void>;
};

export const usePushStore = create<PushStore>((set, get) => ({
  isChecking: true,
  isSupported: false,
  isServerEnabled: false,
  permission: "unsupported",
  isSubscribed: false,
  isBusy: false,
  needsHomeScreenInstall: false,

  currentEndpoint: null,
  devices: [],
  isLoadingDevices: true,

  refresh: async () => {
    const isSupported = isPushSupported();

    // Both probes are awaited even on an unsupported browser, where they
    // resolve to null, so the state lands in a single update.
    const [publicKey, subscription] = await Promise.all([
      isSupported ? getPublicKey() : Promise.resolve(null),
      isSupported ? getCurrentSubscription() : Promise.resolve(null),
    ]);

    set({
      isChecking: false,
      isSupported,
      isServerEnabled: Boolean(publicKey),
      permission: isSupported ? getPermission() : "unsupported",
      isSubscribed: Boolean(subscription),
      needsHomeScreenInstall: isSupported ? false : isIosWithoutStandalone(),
      currentEndpoint: subscription?.endpoint ?? null,
    });
  },

  enable: async () => {
    set({ isBusy: true });

    try {
      const result = await subscribeToPush();

      switch (result.status) {
        case "subscribed":
          toast.success("Notifications enabled on this device");
          break;
        case "denied":
          toast.error("Notifications blocked", {
            description:
              "Allow notifications for this site in your browser settings, then try again.",
          });
          break;
        case "unsupported":
          toast.error("This browser does not support notifications");
          break;
        case "unavailable":
          toast.error("Notifications unavailable", {
            description: result.reason,
          });
          break;
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not enable notifications",
      );
    } finally {
      set({ isBusy: false });
      await get().refresh();
      await get().loadDevices();
    }
  },

  disable: async () => {
    set({ isBusy: true });

    try {
      await unsubscribeFromPush();
      toast.success("Notifications turned off on this device");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not turn off notifications",
      );
    } finally {
      set({ isBusy: false });
      await get().refresh();
      await get().loadDevices();
    }
  },

  toggle: async (next) => (next ? get().enable() : get().disable()),

  test: async () => {
    set({ isBusy: true });
    try {
      const { sent } = await sendTestPush();
      if (sent > 0) {
        toast.success(`Test notification sent to ${sent} device(s)`);
      } else {
        toast.warning("No device received it", {
          description: "Enable notifications on this browser first.",
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send a test",
      );
    } finally {
      set({ isBusy: false });
    }
  },

  /**
   * The loading flag is only ever cleared, never re-raised: the spinner
   * belongs to the first load. Later refreshes swap the list in place, which
   * reads better than blinking the rows out and back.
   */
  loadDevices: async () => {
    try {
      const response = await axiosInstance.get("/notifications/push/devices");
      set({ devices: (response?.data as PushDevice[]) ?? [] });
    } catch {
      set({ devices: [] });
    } finally {
      set({ isLoadingDevices: false });
    }
  },

  removeDevice: async (device) => {
    try {
      await axiosInstance.delete("/notifications/push/subscribe", {
        data: { endpoint: device.endpoint },
      });

      // Removing the row for the browser you are sitting at has to tear down
      // the local subscription too, or the next page load quietly restores it.
      if (device.endpoint === get().currentEndpoint) {
        await get().disable();
        return;
      }

      toast.success("Device removed");
      await get().loadDevices();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove device",
      );
    }
  },
}));
