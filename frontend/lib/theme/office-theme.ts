"use client";

import { axiosInstance } from "@/lib/axios";
import {
  DEFAULT_THEME,
  normalizeHex,
  type BrandTheme,
} from "@/lib/theme/brand-theme";

/**
 * Where a brand palette lives on the server.
 *
 * The office row already carries a free-form `settings` JSON column, so the
 * palette rides along in it under one key rather than earning a migration of
 * its own. Everything else in `settings` is preserved on write.
 */
const THEME_SETTINGS_KEY = "theme";

type OfficeRecord = {
  id: string;
  settings?: Record<string, unknown> | null;
};

/**
 * The signed-in user's office id.
 *
 * Read from the session copy in localStorage that auth-client writes at
 * login, which is also where the rest of the dashboard reads it from. The
 * shape varies by endpoint — `/auth/me` nests the office, login may send a
 * bare id — so all three known spellings are tried.
 */
export function resolveOfficeId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const direct = window.localStorage.getItem("officeId");
    if (direct?.trim()) return direct.trim();

    for (const key of ["office", "user"]) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { id?: string; officeId?: string };
      const id = key === "office" ? parsed?.id : parsed?.officeId;
      if (id?.trim()) return id.trim();
    }
  } catch {
    // A malformed session copy is not worth throwing over; the caller treats
    // a missing id as "no office palette to sync".
  }
  return null;
}

/** Read a stored palette out of an office's settings blob. */
function parseTheme(settings: unknown): BrandTheme {
  if (!settings || typeof settings !== "object") return DEFAULT_THEME;
  const stored = (settings as Record<string, unknown>)[THEME_SETTINGS_KEY];
  if (!stored || typeof stored !== "object") return DEFAULT_THEME;
  const { brand, sidebar } = stored as Partial<BrandTheme>;
  return {
    brand: normalizeHex(typeof brand === "string" ? brand : ""),
    sidebar: normalizeHex(typeof sidebar === "string" ? sidebar : ""),
  };
}

async function fetchOffice(officeId: string): Promise<OfficeRecord | null> {
  const response = (await axiosInstance.get(
    `/offices/${officeId}`,
  )) as unknown as { data?: OfficeRecord } | null;
  return response?.data ?? null;
}

/** The palette an office has saved, or the product default. */
export async function fetchOfficeTheme(officeId: string): Promise<BrandTheme> {
  const office = await fetchOffice(officeId);
  return parseTheme(office?.settings);
}

/**
 * Save `theme` onto the office.
 *
 * The API replaces `settings` wholesale, so the current blob is read back
 * first and merged — otherwise saving a colour would silently drop every
 * other setting the office has.
 */
export async function saveOfficeTheme(
  officeId: string,
  theme: BrandTheme,
): Promise<void> {
  const office = await fetchOffice(officeId);
  const settings =
    office?.settings && typeof office.settings === "object"
      ? { ...office.settings }
      : {};

  if (theme.brand || theme.sidebar) {
    settings[THEME_SETTINGS_KEY] = { brand: theme.brand, sidebar: theme.sidebar };
  } else {
    delete settings[THEME_SETTINGS_KEY];
  }

  await axiosInstance.put(`/offices/${officeId}`, { settings });
}
