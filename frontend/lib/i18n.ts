"use client";

import { useLanguagesStore } from "@/lib/stores/languages-store";
import { useCallback } from "react";

/**
 * Custom hook for translations using the unified languages store
 */
export function useTranslation() {
  const { t, getTranslationForKey, selectedLanguage } = useLanguagesStore();

  const translate = useCallback(
    (key: string, defaultValue?: string) => {
      // Use the t function from store which handles flat translation data
      return t(key, defaultValue);
    },
    [t]
  );

  return {
    t: translate,
    getTranslationForKey,
    selectedLanguage,
  };
}
