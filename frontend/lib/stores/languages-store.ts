import { create } from "zustand"
import { persist } from "zustand/middleware"
import { type Language } from "@/lib/languages"

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
export interface TranslationKey {
  key: string
  translations: Record<string, string>
}

// ──────────────────────────────────────────
// API helpers (all hit /api/translations)
// ──────────────────────────────────────────
const API_URL = "/api/translations"

async function fetchAllTranslations() {
  // "no-cache" still revalidates every time, but a 304 skips re-transferring
  // the payload. "no-store" would bypass the cache and always refetch it.
  const res = await fetch(API_URL, { cache: "no-cache" })
  if (!res.ok) throw new Error("Failed to load translations")
  const json = await res.json()
  return {
    availableLanguages: json.availableLanguages as Language[],
    translations: json.translations as TranslationKey[],
  }
}

async function bulkSaveTranlationsApi(payload: {
  availableLanguages: Language[]
  translations: TranslationKey[]
}) {
  const res = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to save translations")
}

async function addLanguageApi(language: Language) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j.error || "Failed to add language")
  }
}

async function deleteLanguageApi(langCode: string) {
  const res = await fetch(`${API_URL}?code=${langCode}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete language")
}

async function addTranslationKeyApi(key: string, translations: Record<string, string>) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, translations }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j.error || "Failed to add translation key")
  }
}

async function updateTranslationKeyApi(key: string, translations: Record<string, string>) {
  const res = await fetch(API_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, translations }),
  })
  if (!res.ok) throw new Error("Failed to update translation key")
}

async function deleteTranslationKeyApi(key: string) {
  const res = await fetch(`${API_URL}?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete translation key")
}

async function loadFlatTranslations(langCode: string) {
  try {
    const res = await fetch(`${API_URL}?lang=${langCode}`, { cache: "no-cache" })
    if (!res.ok) return {}
    const json = await res.json()
    return (json.data as Record<string, string>) || {}
  } catch {
    return {}
  }
}

// ──────────────────────────────────────────
// Lookup index
// ──────────────────────────────────────────
// getTranslationForKey is called once per label per render. A linear find over
// the full key list turns every render into hundreds of scans, so keep a map.
// Keyed on the array's identity, so any code path that replaces `translations`
// rebuilds it automatically and the index can never drift from the state.
/** Shared by concurrent loadTranslations callers so they issue one request. */
let inFlightLoad: Promise<void> | null = null

let indexCache: {
  source: TranslationKey[]
  index: Map<string, Record<string, string>>
} | null = null

function getIndex(translations: TranslationKey[]) {
  if (!indexCache || indexCache.source !== translations) {
    const index = new Map<string, Record<string, string>>()
    for (const entry of translations) index.set(entry.key, entry.translations)
    indexCache = { source: translations, index }
  }
  return indexCache.index
}

// ──────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────
const defaultLanguages: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  { code: "om", name: "Oromo", nativeName: "Afaan Oromoo" },
]

// ──────────────────────────────────────────
// Store interface
// ──────────────────────────────────────────
export interface LanguagesStore {
  // State
  availableLanguages: Language[]
  selectedLanguage: string
  translations: TranslationKey[]
  isAddKeyDialogOpen: boolean
  isEditKeyDialogOpen: boolean
  selectedTranslationKey: TranslationKey | null
  newKeyForm: {
    key: string
    translations: Record<string, string>
  }
  searchTerm: string
  filteredTranslations: TranslationKey[]
  hasUnsavedChanges: boolean
  isLoading: boolean
  translationData: Record<string, string>
  /** True once real translations are present (from the server or the API). */
  isHydrated: boolean

  // Actions
  setSelectedLanguage: (languageCode: string) => void
  setSearchTerm: (term: string) => void
  setIsAddKeyDialogOpen: (isOpen: boolean) => void
  setIsEditKeyDialogOpen: (isOpen: boolean) => void
  setSelectedTranslationKey: (key: TranslationKey | null) => void
  updateTranslation: (key: string, languageCode: string, value: string) => void
  addNewTranslationKey: (key: string, translations: Record<string, string>) => void
  deleteTranslationKey: (key: string) => void
  updateNewKeyForm: (field: string, value: string | Record<string, string>) => void
  resetNewKeyForm: () => void
  saveTranslations: () => Promise<void>
  loadTranslations: (force?: boolean) => Promise<void>
  filterTranslations: () => void
  getTranslationForKey: (key: string, languageCode?: string) => string
  addLanguage: (language: Language) => Promise<void>
  deleteLanguage: (langCode: string) => Promise<void>
  loadTranslationData: (langCode: string) => Promise<void>
  t: (
    key: string,
    defaultValueOrVars?: string | Record<string, string | number>,
    vars?: Record<string, string | number>
  ) => string
}

// ──────────────────────────────────────────
// Create store
// ──────────────────────────────────────────
export const useLanguagesStore = create<LanguagesStore>()(
  persist(
    (set, get) => ({
      // Initial State
      availableLanguages: defaultLanguages,
      selectedLanguage: "en",
      translations: [],
      isAddKeyDialogOpen: false,
      isEditKeyDialogOpen: false,
      selectedTranslationKey: null,
      newKeyForm: { key: "", translations: {} },
      searchTerm: "",
      filteredTranslations: [],
      hasUnsavedChanges: false,
      isLoading: false,
      translationData: {},
      isHydrated: false,

      // ── Language selection ──
      setSelectedLanguage: async (languageCode) => {
        set({ selectedLanguage: languageCode })
        await get().loadTranslationData(languageCode)
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("languageChanged", { detail: languageCode })
          )
        }
      },

      // ── Search ──
      setSearchTerm: (term) => {
        set({ searchTerm: term })
        get().filterTranslations()
      },

      // ── Dialog toggles ──
      setIsAddKeyDialogOpen: (isOpen) => {
        set({ isAddKeyDialogOpen: isOpen })
        if (!isOpen) get().resetNewKeyForm()
      },

      setIsEditKeyDialogOpen: (isOpen) => {
        set({ isEditKeyDialogOpen: isOpen })
        if (!isOpen) set({ selectedTranslationKey: null })
      },

      setSelectedTranslationKey: (key) => {
        set({ selectedTranslationKey: key })
      },

      // ── Translation CRUD ──
      updateTranslation: async (key, languageCode, value) => {
        const { translations } = get()
        const existing = translations.find((t) => t.key === key)
        if (!existing) return

        const updated = { ...existing.translations, [languageCode]: value }

        try {
          set({ isLoading: true })
          await updateTranslationKeyApi(key, updated)

          const updatedTranslations = translations.map((t) =>
            t.key === key ? { ...t, translations: updated } : t
          )
          set({ translations: updatedTranslations, hasUnsavedChanges: false })
          get().filterTranslations()
        } catch (e) {
          console.error("Failed to update translation:", e)
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      addNewTranslationKey: async (key, translationsObj) => {
        try {
          set({ isLoading: true })
          await addTranslationKeyApi(key, translationsObj)

          const { translations } = get()
          set({
            translations: [...translations, { key, translations: translationsObj }],
            hasUnsavedChanges: false,
            isAddKeyDialogOpen: false,
          })
          get().resetNewKeyForm()
          get().filterTranslations()
        } catch (e) {
          console.error("Failed to add translation key:", e)
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      deleteTranslationKey: async (key) => {
        try {
          set({ isLoading: true })
          await deleteTranslationKeyApi(key)

          const { translations } = get()
          set({
            translations: translations.filter((t) => t.key !== key),
            hasUnsavedChanges: false,
          })
          get().filterTranslations()
        } catch (e) {
          console.error("Failed to delete translation key:", e)
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Form helpers ──
      updateNewKeyForm: (field, value) => {
        const { newKeyForm } = get()
        set({ newKeyForm: { ...newKeyForm, [field]: value } })
      },

      resetNewKeyForm: () => {
        set({ newKeyForm: { key: "", translations: {} } })
      },

      // ── Bulk save ──
      saveTranslations: async () => {
        const { availableLanguages, translations } = get()
        try {
          set({ isLoading: true })
          await bulkSaveTranlationsApi({ availableLanguages, translations })
          set({ hasUnsavedChanges: false })
        } catch (e) {
          console.error("Failed to save translations:", e)
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Load all from API ──
      // Several trees (guest layout, dashboard shell, signin) each ask for
      // translations on mount, and StrictMode double-invokes every effect in
      // dev. Without the guards below that is four fetches of the same 65KB.
      // `force` is for the translations admin screens, which must re-read the
      // file after an edit rather than reuse what is already in memory.
      loadTranslations: async (force = false) => {
        if (!force && get().isHydrated) return
        if (!force && inFlightLoad) return inFlightLoad

        const run = (async () => {
          try {
            set({ isLoading: true })
            const data = await fetchAllTranslations()
            // Also seed the flat map t() reads, so every label is translated on
            // the very first paint. Without this it only filled in after the
            // user actively switched language, and the whole UI stayed English.
            const lang = get().selectedLanguage
            const flat: Record<string, string> = {}
            for (const entry of data.translations) {
              const value = entry.translations[lang] ?? entry.translations["en"]
              if (value) flat[entry.key] = value
            }
            set({
              availableLanguages: data.availableLanguages,
              translations: data.translations,
              filteredTranslations: data.translations,
              translationData: flat,
              isHydrated: true,
            })
          } catch (e) {
            console.error("Failed to load translations:", e)
            // fallback: keep defaults
          } finally {
            set({ isLoading: false })
            inFlightLoad = null
          }
        })()

        inFlightLoad = run
        return run
      },

      // ── Filter ──
      filterTranslations: () => {
        const { translations, searchTerm } = get()
        if (!searchTerm) {
          set({ filteredTranslations: translations })
          return
        }
        const lowerTerm = searchTerm.toLowerCase()
        const filtered = translations.filter(
          (t) =>
            t.key.toLowerCase().includes(lowerTerm) ||
            Object.values(t.translations).some((v) =>
              v.toLowerCase().includes(lowerTerm)
            )
        )
        set({ filteredTranslations: filtered })
      },

      getTranslationForKey: (key, languageCode) => {
        const { translations, selectedLanguage } = get()
        const lang = languageCode || selectedLanguage
        const found = getIndex(translations).get(key)
        return found?.[lang] || key
      },

      // ── Language management ──
      addLanguage: async (language) => {
        try {
          set({ isLoading: true })
          await addLanguageApi(language)
          const { availableLanguages } = get()
          set({ availableLanguages: [...availableLanguages, language] })
        } catch (e) {
          console.error("Failed to add language:", e)
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      deleteLanguage: async (langCode) => {
        try {
          set({ isLoading: true })
          await deleteLanguageApi(langCode)
          const { availableLanguages, translations } = get()

          const updatedLanguages = availableLanguages.filter(
            (l) => l.code !== langCode
          )
          const updatedTranslations = translations.map((t) => ({
            ...t,
            translations: Object.fromEntries(
              Object.entries(t.translations).filter(([c]) => c !== langCode)
            ),
          }))

          set({
            availableLanguages: updatedLanguages,
            translations: updatedTranslations,
          })
          get().filterTranslations()
        } catch (e) {
          console.error("Failed to delete language:", e)
          throw e
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Load flat data for current language (used by t()) ──
      loadTranslationData: async (langCode) => {
        try {
          const data = await loadFlatTranslations(langCode)
          set({ translationData: data })
        } catch (error) {
          console.error(`Failed to load translations for ${langCode}:`, error)
        }
      },

      // ── Translation helper t() ──
      // t("Save")                                → "Save"
      // t("Save", "Save changes")                → default when the key is missing
      // t("{count} services", { count: 3 })      → "3 services"
      // t("{count} services", "…", { count: 3 }) → default + placeholders
      t: (key, defaultValueOrVars, vars) => {
        const { translationData } = get()
        const varsGiven =
          typeof defaultValueOrVars === "object" && defaultValueOrVars !== null
        const values = varsGiven
          ? (defaultValueOrVars as Record<string, string | number>)
          : vars
        const fallback = varsGiven ? undefined : (defaultValueOrVars as string | undefined)

        // Either source may be the one that is loaded: `translationData` is the
        // flat per-language map, `translations` the full catalogue used by the
        // admin screens. Read both so t() never falls back to English early.
        const { translations, selectedLanguage } = get()
        const template =
          translationData[key] ||
          getIndex(translations).get(key)?.[selectedLanguage] ||
          fallback ||
          key
        if (!values) return template
        return template.replace(/\{(\w+)\}/g, (match, name) =>
          name in values ? String(values[name]) : match
        )
      },
    }),
    {
      name: "language-storage",
      partialize: (state) => ({ selectedLanguage: state.selectedLanguage }),
    }
  )
)