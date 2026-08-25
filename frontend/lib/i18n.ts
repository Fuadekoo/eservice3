"use client";

import { useLanguagesStore } from "@/lib/stores/languages-store";
import { useCallback } from "react";

/** Placeholder values for `{name}` slots inside a translated string. */
export type TranslationVars = Record<string, string | number>;

/**
 * Custom hook for translations using the unified languages store.
 *
 * The translation key IS the English copy, so a missing key degrades to
 * readable English rather than to a raw identifier.
 *
 *   t("Save")                           → "Save"
 *   t("Save", "Save changes")           → default used when the key is missing
 *   t("{count} services", { count: 3 }) → "3 services"
 */
export function useTranslation() {
  const { t, getTranslationForKey, selectedLanguage } = useLanguagesStore();

  const translate = useCallback(
    (
      key: string,
      defaultValueOrVars?: string | TranslationVars,
      vars?: TranslationVars
    ) => t(key, defaultValueOrVars, vars),
    [t]
  );

  return {
    t: translate,
    getTranslationForKey,
    selectedLanguage,
  };
}
