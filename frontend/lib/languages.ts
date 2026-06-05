export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const AVAILABLE_LANGUAGES: readonly Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
  },
  {
    code: "am",
    name: "Amharic",
    nativeName: "አማርኛ",
  },
  {
    code: "om",
    name: "Oromo",
    nativeName: "Afaan Oromoo",
  },
] as const;

export type SupportedLanguageCode =
  (typeof AVAILABLE_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: SupportedLanguageCode = "en";

export function normalizeLanguage(
  lang: string | null | undefined,
): SupportedLanguageCode {
  if (!lang) return DEFAULT_LANGUAGE;

  // Handle full locale strings like 'en-US'
  const baseLang = lang.split("-")[0].toLowerCase();

  const found = AVAILABLE_LANGUAGES.find((l) => l.code === baseLang);
  return found ? (found.code as SupportedLanguageCode) : DEFAULT_LANGUAGE;
}

export function persistLanguagePreference(
  langCode: string,
): SupportedLanguageCode {
  const nextLanguage = normalizeLanguage(langCode);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("bekolas-language", nextLanguage);
      document.cookie = [
        `bekolas-language=${nextLanguage}`,
        "path=/",
        "max-age=31536000",
        "samesite=lax",
      ].join("; ");
    } catch (error) {
      console.error("Failed to persist language preference:", error);
    }
  }

  return nextLanguage;
}
