"use client";

/**
 * Languages and translations.
 *
 * This page was a placeholder that rendered the single line "May role is PMS
 * Manage" — a stray note from another project that reached production as the
 * entire content of a navigation entry offered to every administrator. What it
 * should have been is the screen behind `lib/stores/languages-store.ts`, which
 * has carried a complete translation-management API all along with nothing
 * calling it.
 *
 * Three things happen here: see how complete each language is, edit the copy
 * for any key, and add or remove keys and languages.
 */

import * as React from "react";
import {
  Globe,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Languages as LanguagesIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  useLanguagesStore,
  type TranslationKey,
} from "@/lib/stores/languages-store";
import type { Language } from "@/lib/languages";
import { ProtectedPage } from "@/components/protected-page";
import { PageLayout } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

/** How many keys a language has copy for, and how many it is missing. */
function coverageOf(
  translations: TranslationKey[],
  code: string,
): { done: number; total: number; percent: number } {
  const total = translations.length;
  if (total === 0) return { done: 0, total: 0, percent: 100 };

  const done = translations.filter((entry) => {
    const value = entry.translations?.[code];
    return typeof value === "string" && value.trim().length > 0;
  }).length;

  return { done, total, percent: Math.round((done / total) * 100) };
}

const PAGE_SIZE = 25;

function LanguagesOverview() {
  const { t } = useTranslation();

  const {
    availableLanguages,
    translations,
    filteredTranslations,
    searchTerm,
    isLoading,
    setSearchTerm,
    loadTranslations,
    updateTranslation,
    addNewTranslationKey,
    deleteTranslationKey,
    addLanguage,
    deleteLanguage,
  } = useLanguagesStore();

  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [editingKey, setEditingKey] = React.useState<TranslationKey | null>(null);
  const [editDraft, setEditDraft] = React.useState<Record<string, string>>({});
  const [isSavingKey, setIsSavingKey] = React.useState(false);

  const [isAddingKey, setIsAddingKey] = React.useState(false);
  const [newKey, setNewKey] = React.useState("");
  const [newKeyDraft, setNewKeyDraft] = React.useState<Record<string, string>>({});

  const [isAddingLanguage, setIsAddingLanguage] = React.useState(false);
  const [newLanguage, setNewLanguage] = React.useState<Language>({
    code: "",
    name: "",
    nativeName: "",
  });

  const [keyToDelete, setKeyToDelete] = React.useState<string | null>(null);
  const [languageToDelete, setLanguageToDelete] = React.useState<Language | null>(
    null,
  );
  const [isMutating, setIsMutating] = React.useState(false);

  React.useEffect(() => {
    void loadTranslations();
  }, [loadTranslations]);

  // A new search should start again from the top of the list.
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm]);

  const rows = searchTerm ? filteredTranslations : translations;
  const visibleRows = rows.slice(0, visibleCount);

  // English is the key itself, so it is never "missing" and is not offered for
  // deletion — removing it would leave every other language with nothing to be
  // a translation of.
  const isBaseLanguage = (code: string) => code === "en";

  const openEditor = (entry: TranslationKey) => {
    setEditingKey(entry);
    setEditDraft({ ...entry.translations });
  };

  const handleSaveKey = async () => {
    if (!editingKey) return;

    setIsSavingKey(true);
    try {
      // The store writes one language at a time, so only send what changed.
      const changed = availableLanguages.filter(
        (language) =>
          (editDraft[language.code] ?? "") !==
          (editingKey.translations?.[language.code] ?? ""),
      );

      for (const language of changed) {
        await updateTranslation(
          editingKey.key,
          language.code,
          editDraft[language.code] ?? "",
        );
      }

      toast.success(
        changed.length > 0
          ? t("Translation saved")
          : t("Nothing to save — no changes were made"),
      );
      setEditingKey(null);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : t("Failed to save translation"),
      );
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleAddKey = async () => {
    const key = newKey.trim();
    if (!key) {
      toast.error(t("Enter the English text, which is also the key."));
      return;
    }
    if (translations.some((entry) => entry.key === key)) {
      toast.error(t("That key already exists."));
      return;
    }

    setIsMutating(true);
    try {
      // The key is the English copy, so English is filled in from it.
      await addNewTranslationKey(key, { ...newKeyDraft, en: key });
      toast.success(t("Translation key added"));
      setIsAddingKey(false);
      setNewKey("");
      setNewKeyDraft({});
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : t("Failed to add the key"),
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleAddLanguage = async () => {
    const code = newLanguage.code.trim().toLowerCase();
    const name = newLanguage.name.trim();

    if (!code || !name) {
      toast.error(t("A language needs both a code and a name."));
      return;
    }
    if (availableLanguages.some((language) => language.code === code)) {
      toast.error(t("That language is already listed."));
      return;
    }

    setIsMutating(true);
    try {
      await addLanguage({
        code,
        name,
        nativeName: newLanguage.nativeName.trim() || name,
      });
      toast.success(t("Language added"));
      setIsAddingLanguage(false);
      setNewLanguage({ code: "", name: "", nativeName: "" });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : t("Failed to add the language"),
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    setIsMutating(true);
    try {
      await deleteTranslationKey(keyToDelete);
      toast.success(t("Translation key deleted"));
      setKeyToDelete(null);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : t("Failed to delete the key"),
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteLanguage = async () => {
    if (!languageToDelete) return;

    setIsMutating(true);
    try {
      await deleteLanguage(languageToDelete.code);
      toast.success(t("Language removed"));
      setLanguageToDelete(null);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("Failed to remove the language"),
      );
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <PageLayout
      title={t("Languages")}
      description={t("Manage the languages the portal is offered in, and the copy behind every label.")}
      icon={Globe}
      actions={
        <>
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => void loadTranslations(true)}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("mr-2 size-4", isLoading && "animate-spin")}
            />
            {t("Refresh")}
          </Button>
          <Button
            className="h-10 rounded-xl"
            onClick={() => setIsAddingKey(true)}
          >
            <Plus className="mr-2 size-4" />
            {t("Add Text")}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* ── Language coverage ─────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableLanguages.map((language) => {
            const coverage = coverageOf(translations, language.code);
            const isComplete = coverage.percent === 100;

            return (
              <Card
                key={language.code}
                className="border-none shadow-sm ring-1 ring-border/50 bg-card/50"
              >
                <CardContent className="p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <LanguagesIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold">{language.name}</p>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] font-bold uppercase"
                        >
                          {language.code}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {language.nativeName}
                      </p>
                    </div>
                    {!isBaseLanguage(language.code) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 rounded-lg text-destructive hover:bg-destructive/10"
                        onClick={() => setLanguageToDelete(language)}
                        aria-label={t("Remove language")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                        {isComplete ? (
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="size-3.5 text-amber-600" />
                        )}
                        {t("{done} of {total} translated", {
                          done: coverage.done,
                          total: coverage.total,
                        })}
                      </span>
                      <span className="font-bold">{coverage.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isComplete ? "bg-emerald-500" : "bg-amber-500",
                        )}
                        style={{ width: `${coverage.percent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <button
            type="button"
            onClick={() => setIsAddingLanguage(true)}
            className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="size-6" />
            <span className="text-sm font-semibold">{t("Add Language")}</span>
          </button>
        </div>

        {/* ── Search ────────────────────────────────────────── */}
        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("Search the text or its translations...")}
            className="h-10 rounded-xl pl-9"
          />
        </div>

        {/* ── Translation table ─────────────────────────────── */}
        <div className="rounded-2xl border border-border/50 bg-card">
          {isLoading && translations.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-muted/30 p-4">
                <Globe className="size-10 text-muted-foreground/30" />
              </div>
              <p className="text-lg font-semibold">{t("No text found")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm
                  ? t("Try a different search term")
                  : t("Add the first piece of text to translate")}
              </p>
            </div>
          ) : (
            <>
              {/* The table scrolls inside its own box; the page never widens. */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="p-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        {t("English")}
                      </th>
                      {availableLanguages
                        .filter((language) => !isBaseLanguage(language.code))
                        .map((language) => (
                          <th
                            key={language.code}
                            className="p-4 text-xs font-bold tracking-wider text-muted-foreground uppercase"
                          >
                            {language.name}
                          </th>
                        ))}
                      <th className="p-4 text-right text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        {t("Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((entry) => (
                      <tr
                        key={entry.key}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/10"
                      >
                        <td className="max-w-xs p-4 align-top">
                          <p className="font-medium wrap-break-word">
                            {entry.key}
                          </p>
                        </td>
                        {availableLanguages
                          .filter((language) => !isBaseLanguage(language.code))
                          .map((language) => {
                            const value = entry.translations?.[language.code];
                            const missing =
                              !value || value.trim().length === 0;

                            return (
                              <td
                                key={language.code}
                                className="max-w-xs p-4 align-top"
                              >
                                {missing ? (
                                  <span className="text-xs font-medium text-amber-600">
                                    {t("Not translated")}
                                  </span>
                                ) : (
                                  <p className="wrap-break-word text-muted-foreground">
                                    {value}
                                  </p>
                                )}
                              </td>
                            );
                          })}
                        <td className="p-4 align-top">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 rounded-lg text-primary hover:bg-primary/10"
                              onClick={() => openEditor(entry)}
                              aria-label={t("Edit")}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 rounded-lg text-destructive hover:bg-destructive/10"
                              onClick={() => setKeyToDelete(entry.key)}
                              aria-label={t("Delete")}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visibleCount < rows.length && (
                <div className="flex items-center justify-center border-t border-border/50 p-4">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  >
                    {t("Show more ({remaining} remaining)", {
                      remaining: rows.length - visibleCount,
                    })}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Edit a key ──────────────────────────────────────── */}
      <Dialog
        open={!!editingKey}
        onOpenChange={(open) => !open && setEditingKey(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Edit translation")}</DialogTitle>
            <DialogDescription className="wrap-break-word">
              {editingKey?.key}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {availableLanguages
              .filter((language) => !isBaseLanguage(language.code))
              .map((language) => (
                <div key={language.code} className="space-y-1.5">
                  <label
                    htmlFor={`translation-${language.code}`}
                    className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    {language.name} ({language.nativeName})
                  </label>
                  <Textarea
                    id={`translation-${language.code}`}
                    rows={2}
                    className="resize-none rounded-xl"
                    value={editDraft[language.code] ?? ""}
                    onChange={(event) =>
                      setEditDraft((draft) => ({
                        ...draft,
                        [language.code]: event.target.value,
                      }))
                    }
                    placeholder={editingKey?.key}
                  />
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setEditingKey(null)}
              disabled={isSavingKey}
            >
              {t("Cancel")}
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleSaveKey}
              disabled={isSavingKey}
            >
              {isSavingKey && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add a key ───────────────────────────────────────── */}
      <Dialog open={isAddingKey} onOpenChange={setIsAddingKey}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Add text")}</DialogTitle>
            <DialogDescription>
              {t("The English text is also the key the code looks up, so write it exactly as it should appear.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-key"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {t("English")}
              </label>
              <Input
                id="new-key"
                className="rounded-xl"
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
                placeholder={t("e.g. Save changes")}
              />
            </div>

            {availableLanguages
              .filter((language) => !isBaseLanguage(language.code))
              .map((language) => (
                <div key={language.code} className="space-y-1.5">
                  <label
                    htmlFor={`new-${language.code}`}
                    className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    {language.name}
                  </label>
                  <Textarea
                    id={`new-${language.code}`}
                    rows={2}
                    className="resize-none rounded-xl"
                    value={newKeyDraft[language.code] ?? ""}
                    onChange={(event) =>
                      setNewKeyDraft((draft) => ({
                        ...draft,
                        [language.code]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsAddingKey(false)}
              disabled={isMutating}
            >
              {t("Cancel")}
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleAddKey}
              disabled={isMutating || !newKey.trim()}
            >
              {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add a language ──────────────────────────────────── */}
      <Dialog open={isAddingLanguage} onOpenChange={setIsAddingLanguage}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Add language")}</DialogTitle>
            <DialogDescription>
              {t("New languages start with no translations and fall back to English until they are filled in.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="language-code"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {t("Code")}
              </label>
              <Input
                id="language-code"
                className="rounded-xl"
                value={newLanguage.code}
                onChange={(event) =>
                  setNewLanguage((language) => ({
                    ...language,
                    code: event.target.value,
                  }))
                }
                placeholder={t("e.g. ti")}
                maxLength={8}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="language-name"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {t("Name in English")}
              </label>
              <Input
                id="language-name"
                className="rounded-xl"
                value={newLanguage.name}
                onChange={(event) =>
                  setNewLanguage((language) => ({
                    ...language,
                    name: event.target.value,
                  }))
                }
                placeholder={t("e.g. Tigrinya")}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="language-native"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {t("Name in the language itself")}
              </label>
              <Input
                id="language-native"
                className="rounded-xl"
                value={newLanguage.nativeName}
                onChange={(event) =>
                  setNewLanguage((language) => ({
                    ...language,
                    nativeName: event.target.value,
                  }))
                }
                placeholder={t("e.g. ትግርኛ")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsAddingLanguage(false)}
              disabled={isMutating}
            >
              {t("Cancel")}
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleAddLanguage}
              disabled={isMutating}
            >
              {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmations ───────────────────────────────────── */}
      <AlertDialog
        open={!!keyToDelete}
        onOpenChange={(open) => !open && setKeyToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete this text?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Every translation of it is removed too, and anywhere the portal uses it will fall back to the key itself.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              {t("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteKey}
              disabled={isMutating}
            >
              {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!languageToDelete}
        onOpenChange={(open) => !open && setLanguageToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Remove {name}?", { name: languageToDelete?.name ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("The portal stops offering this language and its translations are deleted. Anyone currently using it is moved to English.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              {t("Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteLanguage}
              disabled={isMutating}
            >
              {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}

export default function Page() {
  return (
    <ProtectedPage>
      <LanguagesOverview />
    </ProtectedPage>
  );
}
