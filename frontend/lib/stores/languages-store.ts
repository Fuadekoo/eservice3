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
  const res = await fetch(API_URL, { cache: "no-store" })
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
    const res = await fetch(`${API_URL}?lang=${langCode}`, { cache: "no-store" })
    if (!res.ok) return {}
    const json = await res.json()
    return (json.data as Record<string, string>) || {}
  } catch {
    return {}
  }
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
  loadTranslations: () => Promise<void>
  filterTranslations: () => void
  getTranslationForKey: (key: string, languageCode?: string) => string
  addLanguage: (language: Language) => Promise<void>
  deleteLanguage: (langCode: string) => Promise<void>
  loadTranslationData: (langCode: string) => Promise<void>
  t: (key: string, defaultValue?: string) => string
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
      loadTranslations: async () => {
        try {
          set({ isLoading: true })
          const data = await fetchAllTranslations()
          set({
            availableLanguages: data.availableLanguages,
            translations: data.translations,
            filteredTranslations: data.translations,
          })
        } catch (e) {
          console.error("Failed to load translations:", e)
          // fallback: keep defaults
        } finally {
          set({ isLoading: false })
        }
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
        const found = translations.find((t) => t.key === key)
        return found?.translations[lang] || key
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
      t: (key, defaultValue) => {
        const { translationData } = get()
        return translationData[key] || defaultValue || key
      },
    }),
    {
      name: "language-storage",
      partialize: (state) => ({ selectedLanguage: state.selectedLanguage }),
    }
  )
)