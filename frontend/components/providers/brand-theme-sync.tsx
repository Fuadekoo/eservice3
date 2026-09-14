"use client";

import * as React from "react";

import { getToken } from "@/lib/auth-client";
import {
  applyTheme,
  readStoredTheme,
  themesEqual,
} from "@/lib/theme/brand-theme";
import { fetchOfficeTheme, resolveOfficeId } from "@/lib/theme/office-theme";

/**
 * Keeps this browser's palette in step with the office's saved one.
 *
 * The pre-paint script in <head> restores whatever this browser saw last,
 * which is right often enough to be worth doing but is only a cache: an
 * administrator may have changed the colour since, or this may be the first
 * sign-in on the device. One request per mount reconciles the two, and the
 * palette is only re-applied when it actually differs, so the common case
 * costs nothing visible.
 *
 * Rendered inside the dashboard, where a signed-in office is guaranteed;
 * public pages keep the cached palette.
 */
export function BrandThemeSync() {
  React.useEffect(() => {
    if (!getToken()) return;

    const officeId = resolveOfficeId();
    if (!officeId) return;

    let cancelled = false;

    void (async () => {
      try {
        const remote = await fetchOfficeTheme(officeId);
        if (cancelled) return;
        if (!themesEqual(remote, readStoredTheme())) applyTheme(remote);
      } catch {
        // The office is unreachable or the user cannot read it — the cached
        // palette is still a perfectly good answer, so this stays silent.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
