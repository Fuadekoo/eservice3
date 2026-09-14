"use client";

import * as React from "react";
import { Check, Palette, RotateCcw, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  applyTheme,
  BRAND_PRESETS,
  buildPalette,
  deepBrandShade,
  contrastRatio,
  DEFAULT_BRAND,
  DEFAULT_THEME,
  normalizeHex,
  oklchToHex,
  readableInk,
  readStoredTheme,
  SIDEBAR_PRESETS,
  themesEqual,
  type BrandTheme,
  type ThemeVars,
} from "@/lib/theme/brand-theme";
import { resolveOfficeId, saveOfficeTheme, fetchOfficeTheme } from "@/lib/theme/office-theme";

/**
 * The neutral surfaces each mode is drawn on.
 *
 * Taken from the `:root` and `.dark` blocks in `app/globals.css` so the
 * previews sit on the same paper the real interface does. They are not part
 * of the brand palette — a brand colour tints the interface, it does not
 * repaint the background — so they are fixed here rather than derived.
 */
const SURFACES = {
  light: {
    background: oklchToHex({ l: 1, c: 0, h: 0 }),
    card: oklchToHex({ l: 1, c: 0, h: 0 }),
    foreground: oklchToHex({ l: 0.141, c: 0.005, h: 285.823 }),
    muted: oklchToHex({ l: 0.967, c: 0.001, h: 286.375 }),
    mutedForeground: oklchToHex({ l: 0.552, c: 0.016, h: 285.938 }),
    border: oklchToHex({ l: 0.92, c: 0.004, h: 286.32 }),
  },
  dark: {
    background: oklchToHex({ l: 0.141, c: 0.005, h: 285.823 }),
    card: oklchToHex({ l: 0.21, c: 0.006, h: 285.885 }),
    foreground: oklchToHex({ l: 0.985, c: 0, h: 0 }),
    muted: oklchToHex({ l: 0.274, c: 0.006, h: 286.033 }),
    mutedForeground: oklchToHex({ l: 0.705, c: 0.015, h: 286.067 }),
    border: oklchToHex({ l: 0.32, c: 0.006, h: 286.033 }),
  },
} as const;

export function AppearanceTab() {
  const { t } = useTranslation();

  const [officeId] = React.useState<string | null>(() => resolveOfficeId());
  const [saved, setSaved] = React.useState<BrandTheme>(DEFAULT_THEME);
  const [draft, setDraft] = React.useState<BrandTheme>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // The hex fields keep their own text so a half-typed code ("#1a4") stays on
  // screen; the palette only moves once what was typed actually parses.
  const [hexInput, setHexInput] = React.useState("");
  const [sidebarInput, setSidebarInput] = React.useState("");

  // The office's palette is the source of truth; what this browser cached is
  // the fallback for when it cannot be read.
  React.useEffect(() => {
    let cancelled = false;

    const adopt = (theme: BrandTheme) => {
      if (cancelled) return;
      setSaved(theme);
      setDraft(theme);
      setHexInput(theme.brand ?? "");
      setSidebarInput(theme.sidebar ?? "");
      setIsLoading(false);
    };

    if (!officeId) {
      adopt(readStoredTheme());
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        adopt(await fetchOfficeTheme(officeId));
      } catch {
        adopt(readStoredTheme());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [officeId]);

  const brandHex = draft.brand ?? DEFAULT_BRAND;
  const palette = React.useMemo(() => buildPalette(draft), [draft]);
  const isDirty = !themesEqual(draft, saved);

  const setBrand = React.useCallback((hex: string | null) => {
    setDraft((prev) => ({ ...prev, brand: hex }));
    setHexInput(hex ?? "");
  }, []);

  const handleHexInput = React.useCallback((value: string) => {
    setHexInput(value);
    // Only commit once it parses, so the palette does not lurch about while
    // somebody is halfway through typing a hex code.
    const parsed = normalizeHex(value);
    if (parsed) setDraft((prev) => ({ ...prev, brand: parsed }));
    else if (value.trim() === "") setDraft((prev) => ({ ...prev, brand: null }));
  }, []);

  const setSidebar = React.useCallback((hex: string | null) => {
    setDraft((prev) => ({ ...prev, sidebar: hex }));
    setSidebarInput(hex ?? "");
  }, []);

  const handleSidebarInput = React.useCallback((value: string) => {
    setSidebarInput(value);
    const parsed = normalizeHex(value);
    if (parsed) setDraft((prev) => ({ ...prev, sidebar: parsed }));
  }, []);

  const toggleCustomSidebar = React.useCallback(
    (enabled: boolean) => {
      setSidebar(enabled ? deepBrandShade(brandHex) : null);
    },
    [brandHex, setSidebar],
  );

  /** Hand the whole palette back to the product default. */
  const handleUseDefault = React.useCallback(() => {
    setDraft(DEFAULT_THEME);
    setHexInput("");
    setSidebarInput("");
  }, []);

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      if (officeId) await saveOfficeTheme(officeId, draft);
      applyTheme(draft);
      setSaved(draft);
      toast.success(
        officeId
          ? t("Theme colour saved")
          : t("Theme colour applied on this device"),
      );
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          t("Failed to save the theme colour"),
      );
    } finally {
      setIsSaving(false);
    }
  }, [draft, officeId, t]);

  const handleRevert = React.useCallback(() => {
    setDraft(saved);
    setHexInput(saved.brand ?? "");
    setSidebarInput(saved.sidebar ?? "");
  }, [saved]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Spinner className="mr-2 size-5" />
        {t("Loading theme colour...")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!officeId && (
        <Alert>
          <ShieldAlert className="size-4" />
          <AlertTitle>{t("No office assigned")}</AlertTitle>
          <AlertDescription>
            {t(
              "Your account is not attached to an office, so a colour saved here applies to this browser only.",
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4.5 text-primary" />
            {t("Theme colour")}
          </CardTitle>
          <CardDescription>
            {t(
              "The colour this system is drawn in. Buttons, highlights, charts and the sidebar are all derived from it.",
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            {/* ── Controls ───────────────────────────────────────────── */}
            <div className="min-w-0 space-y-6">
              <div className="space-y-3">
                <Label>{t("Presets")}</Label>
                <SwatchRow
                  presets={BRAND_PRESETS}
                  selected={brandHex}
                  onSelect={setBrand}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-colour">{t("Brand colour")}</Label>
                <div className="flex items-center gap-2">
                  <ColourSwatch
                    id="brand-colour-swatch"
                    value={brandHex}
                    onChange={setBrand}
                    disabled={isSaving}
                    label={t("Pick a brand colour")}
                  />
                  <Input
                    id="brand-colour"
                    value={hexInput}
                    onChange={(event) => handleHexInput(event.target.value)}
                    disabled={isSaving}
                    placeholder={DEFAULT_BRAND}
                    spellCheck={false}
                    autoComplete="off"
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("Leave empty to use the default colour.")}
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <Label htmlFor="custom-sidebar" className="cursor-pointer">
                    {t("Custom sidebar colour")}
                  </Label>
                  <Switch
                    id="custom-sidebar"
                    checked={draft.sidebar !== null}
                    onCheckedChange={toggleCustomSidebar}
                    disabled={isSaving}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {draft.sidebar === null
                    ? t(
                        "Off: the sidebar is tinted with the brand colour, chosen so its labels always stay readable.",
                      )
                    : t(
                        "On: the sidebar is exactly this colour in both light and dark mode.",
                      )}
                </p>
                {draft.sidebar !== null && (
                  <div className="space-y-3 pt-2">
                    <SwatchRow
                      presets={SIDEBAR_PRESETS}
                      selected={draft.sidebar}
                      onSelect={setSidebar}
                      disabled={isSaving}
                    />
                    <div className="flex items-center gap-2">
                    <ColourSwatch
                      id="sidebar-colour-swatch"
                      value={draft.sidebar}
                      onChange={setSidebar}
                      disabled={isSaving}
                      label={t("Pick a sidebar colour")}
                    />
                    <Input
                      value={sidebarInput}
                      onChange={(event) => handleSidebarInput(event.target.value)}
                      disabled={isSaving}
                      spellCheck={false}
                      autoComplete="off"
                      className="font-mono"
                    />
                    </div>
                  </div>
                )}
              </div>

              <ContrastReadout palette={palette} />
            </div>

            {/* ── Previews ───────────────────────────────────────────── */}
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <Preview mode="light" vars={palette.light} label={t("Light mode")} />
              <Preview mode="dark" vars={palette.dark} label={t("Dark mode")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {officeId
            ? t(
                "Saved colours apply the moment you press Save, and to everyone else the next time they sign in or reload.",
              )
            : t("Saved colours apply the moment you press Save.")}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            onClick={handleUseDefault}
            disabled={isSaving || (draft.brand === null && draft.sidebar === null)}
          >
            <RotateCcw className="mr-2 size-4" />
            {t("Use default")}
          </Button>
          <Button variant="outline" onClick={handleRevert} disabled={isSaving || !isDirty}>
            {t("Discard changes")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? (
              <>
                <Spinner className="mr-2 size-4" />
                {t("Saving...")}
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                {t("Save")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Pieces
   ────────────────────────────────────────────────────────────────────────── */

/**
 * A row of one-click colours.
 *
 * Shared by the brand and sidebar pickers: the same affordance either way, so
 * choosing a sidebar surface works exactly like choosing a brand colour.
 */
function SwatchRow({
  presets,
  selected,
  onSelect,
  disabled,
}: {
  presets: ReadonlyArray<{ name: string; hex: string }>;
  selected: string;
  onSelect: (hex: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2.5">
      {presets.map((preset) => {
        const isActive = selected.toLowerCase() === preset.hex.toLowerCase();
        return (
          <button
            key={preset.hex}
            type="button"
            onClick={() => onSelect(preset.hex)}
            disabled={disabled}
            title={t(preset.name)}
            aria-label={t(preset.name)}
            aria-pressed={isActive}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border border-black/10 transition",
              "ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              "hover:scale-110 disabled:pointer-events-none disabled:opacity-50",
              isActive && "ring-2 ring-foreground",
            )}
            style={{ backgroundColor: preset.hex }}
          >
            {isActive && (
              <Check className="size-4" style={{ color: readableInk(preset.hex) }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A native colour picker wearing the app's input styling.
 *
 * `<input type="color">` gets the platform's own picker — eyedropper,
 * recent colours, the lot — which is worth far more than a hand-rolled
 * wheel; only its chrome is hidden.
 */
function ColourSwatch({
  id,
  value,
  onChange,
  disabled,
  label,
}: {
  id: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border shadow-sm transition",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        disabled && "pointer-events-none opacity-50",
      )}
      style={{ backgroundColor: value }}
      title={label}
    >
      <span className="sr-only">{label}</span>
      <input
        id={id}
        type="color"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </label>
  );
}

/**
 * How legible a label on a brand button is, in both modes.
 *
 * The label colour is computed rather than chosen, so this is the one number
 * that tells an administrator whether the colour they like is a colour the
 * interface can actually use.
 */
function ContrastReadout({ palette }: { palette: { light: ThemeVars; dark: ThemeVars } }) {
  const { t } = useTranslation();

  const rows = (["light", "dark"] as const).map((mode) => {
    const vars = palette[mode];
    const ratio = contrastRatio(vars["--primary-foreground"]!, vars["--primary"]!);
    return {
      mode,
      ratio,
      // WCAG AA is 4.5:1 for body text; button labels are the smallest text
      // that ever sits on the brand colour, so that is the bar used here.
      grade: ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : t("Low"),
      passes: ratio >= 4.5,
    };
  });

  return (
    <div className="space-y-2 text-xs">
      <p className="font-medium text-foreground">{t("Button label contrast")}</p>
      {rows.map((row) => (
        <div key={row.mode} className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">
            {row.mode === "light" ? t("Light mode") : t("Dark mode")}
          </span>
          <span
            className={cn(
              "font-mono",
              row.passes ? "text-muted-foreground" : "text-destructive",
            )}
          >
            {row.ratio.toFixed(1)}:1 · {row.grade}
          </span>
        </div>
      ))}
      {rows.some((row) => !row.passes) && (
        <p className="text-destructive">
          {t(
            "Labels on this colour fall below the 4.5:1 readability bar. A slightly darker or lighter shade will clear it.",
          )}
        </p>
      )}
    </div>
  );
}

/**
 * A miniature of the dashboard in one mode.
 *
 * Both modes are shown at once, so the previews cannot use CSS custom
 * properties — those resolve to whichever mode the administrator is
 * currently in. Each mark takes its colour inline from the candidate
 * palette instead.
 */
function Preview({
  mode,
  vars,
  label,
}: {
  mode: "light" | "dark";
  vars: ThemeVars;
  label: string;
}) {
  const surface = SURFACES[mode];

  return (
    <figure className="min-w-0 space-y-2">
      <figcaption className="text-xs font-medium text-muted-foreground">
        {label}
      </figcaption>
      <div
        className="flex h-44 overflow-hidden rounded-xl border shadow-sm"
        style={{ backgroundColor: surface.background, borderColor: surface.border }}
      >
        {/* Sidebar */}
        <div
          className="flex w-[30%] shrink-0 flex-col gap-2 p-2.5"
          style={{ backgroundColor: vars["--sidebar"] }}
        >
          <div
            className="h-3.5 rounded"
            style={{ backgroundColor: vars["--sidebar-primary"] }}
          />
          <div className="space-y-1.5 pt-1">
            <div
              className="h-2.5 rounded"
              style={{ backgroundColor: vars["--sidebar-accent"] }}
            />
            <div
              className="h-2.5 w-4/5 rounded"
              style={{ backgroundColor: vars["--sidebar-accent"] }}
            />
            <div
              className="h-2.5 w-3/5 rounded"
              style={{ backgroundColor: vars["--sidebar-accent"] }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3">
          <p
            className="truncate text-[11px] font-bold"
            style={{ color: surface.foreground }}
          >
            Dashboard
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="rounded-md px-2 py-1 text-[9px] font-semibold"
              style={{
                backgroundColor: vars["--primary"],
                color: vars["--primary-foreground"],
              }}
            >
              Save
            </span>
            <span
              className="rounded-md px-2 py-1 text-[9px] font-semibold"
              style={{
                backgroundColor: vars["--sidebar-accent"],
                color: vars["--sidebar-accent-foreground"],
              }}
            >
              Badge
            </span>
          </div>

          {/* Chart ramp, drawn as the bars it would colour */}
          <div
            className="flex min-h-0 flex-1 items-end gap-1.5 rounded-lg border p-2"
            style={{ backgroundColor: surface.card, borderColor: surface.border }}
          >
            {([1, 2, 3, 4, 5] as const).map((slot, index) => (
              <div
                key={slot}
                className="flex-1 rounded-t-[3px]"
                style={{
                  backgroundColor: vars[`--chart-${slot}`],
                  height: `${45 + index * 12}%`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
