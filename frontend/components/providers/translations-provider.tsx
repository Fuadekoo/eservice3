"use client";

import * as React from "react";

import { useLanguagesStore } from "@/lib/stores/languages-store";

/**
 * Loads the translation catalogue once, for every route group.
 *
 * The dashboard shell, the guest layout and the sign-in page each used to do
 * this on their own, which left the remaining pages (sign-up, password reset,
 * error and not-found screens) rendering untranslated. Mounting this in the
 * root layout means every page has translations regardless of where the user
 * lands first; the store de-duplicates concurrent calls, so the extra mounts
 * cost nothing.
 */
export function TranslationsProvider() {
  const loadTranslations = useLanguagesStore((state) => state.loadTranslations);
  const selectedLanguage = useLanguagesStore((state) => state.selectedLanguage);
  const loadTranslationData = useLanguagesStore(
    (state) => state.loadTranslationData
  );

  React.useEffect(() => {
    void loadTranslations();
  }, [loadTranslations]);

  // Keep the flat map in step with the persisted language after a reload.
  React.useEffect(() => {
    void loadTranslationData(selectedLanguage);
  }, [loadTranslationData, selectedLanguage]);

  return null;
}
