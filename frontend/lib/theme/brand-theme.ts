/**
 * Brand theming — one colour in, a whole palette out.
 *
 * An administrator picks a brand colour in Settings → Appearance; everything
 * the dashboard draws in that colour (buttons, rings, the active sidebar row,
 * chart ramps) is derived from it here, so there is a single place where
 * "what does this brand look like" is decided.
 *
 * The palette is emitted as the same CSS custom properties `app/globals.css`
 * already defines, so nothing in the component tree has to know theming
 * exists — overriding `--primary` recolours every button that was already
 * written against it.
 *
 * Colour maths runs in OKLCH because the derivations are perceptual ones
 * ("the same colour, lighter", "a whisper of this hue"), and those are only
 * well behaved in a perceptually uniform space. sRGB hex is kept as the
 * storage and interchange format since that is what a colour input speaks.
 */

export type BrandTheme = {
  /** Brand hex (`#rrggbb`), or null for the product default. */
  brand: string | null;
  /**
   * Explicit sidebar hex, or null to derive the sidebar from the brand.
   *
   * When set, the sidebar is exactly this colour in both light and dark mode
   * and its labels are picked for contrast against it.
   */
  sidebar: string | null;
};

export const DEFAULT_THEME: BrandTheme = { brand: null, sidebar: null };

/** The `--primary` that `app/globals.css` ships, as hex. */
export const DEFAULT_BRAND = "#1447e6";

export const BRAND_PRESETS: ReadonlyArray<{ name: string; hex: string }> = [
  { name: "Default blue", hex: DEFAULT_BRAND },
  { name: "Amber", hex: "#f5a623" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Green", hex: "#16a34a" },
  { name: "Red", hex: "#dc2626" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Pink", hex: "#db2777" },
  { name: "Midnight", hex: "#1e293b" },
];

/**
 * Ready-made sidebar surfaces.
 *
 * Deep, low-chroma colours, because the sidebar is a large flat area that a
 * saturated fill makes exhausting to sit beside all day. The pale one is here
 * for anyone who wants the rail to recede instead.
 */
export const SIDEBAR_PRESETS: ReadonlyArray<{ name: string; hex: string }> = [
  { name: "Navy", hex: "#16213e" },
  { name: "Charcoal", hex: "#1f2430" },
  { name: "Slate", hex: "#27313f" },
  { name: "Forest", hex: "#12281f" },
  { name: "Plum", hex: "#26172e" },
  { name: "Porcelain", hex: "#eef1f6" },
];

/* ──────────────────────────────────────────────────────────────────────────
   Colour space conversions
   ────────────────────────────────────────────────────────────────────────── */

export type Oklch = { l: number; c: number; h: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const srgbToLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const linearToSrgb = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

/**
 * Accept what a human might type — `f00`, `#F00`, `1447e6` — and return a
 * canonical `#rrggbb`, or null when it is not a colour at all.
 */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return `#${full.toLowerCase()}`;
}

export function hexToOklch(hex: string): Oklch {
  const normalized = normalizeHex(hex) ?? DEFAULT_BRAND;
  const r = srgbToLinear(parseInt(normalized.slice(1, 3), 16) / 255);
  const g = srgbToLinear(parseInt(normalized.slice(3, 5), 16) / 255);
  const b = srgbToLinear(parseInt(normalized.slice(5, 7), 16) / 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const hue = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c: Math.hypot(A, B), h: hue < 0 ? hue + 360 : hue };
}

function oklchToLinearRgb({ l, c, h }: Oklch): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const inGamut = (rgb: [number, number, number]) =>
  rgb.every((v) => v >= -0.0001 && v <= 1.0001);

/**
 * OKLCH → hex, reducing chroma until the colour fits sRGB.
 *
 * Clipping the channels instead would shift the hue of any out-of-gamut
 * colour, which is exactly the thing an administrator would notice: the
 * vivid green they picked coming back looking yellow.
 */
export function oklchToHex(colour: Oklch): string {
  const l = clamp(colour.l, 0, 1);
  let chroma = Math.max(0, colour.c);

  if (!inGamut(oklchToLinearRgb({ ...colour, l, c: chroma }))) {
    let lo = 0;
    let hi = chroma;
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinearRgb({ ...colour, l, c: mid }))) lo = mid;
      else hi = mid;
    }
    chroma = lo;
  }

  return `#${oklchToLinearRgb({ ...colour, l, c: chroma })
    .map((v) => {
      const byte = Math.round(clamp(linearToSrgb(v), 0, 1) * 255);
      return byte.toString(16).padStart(2, "0");
    })
    .join("")}`;
}

/** Shorthand for "this hue, at this lightness and chroma", as hex. */
const ok = (l: number, c: number, h: number) => oklchToHex({ l, c, h });

/** Append an alpha byte to a `#rrggbb`. */
const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(clamp(alpha, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0")}`;

/* ──────────────────────────────────────────────────────────────────────────
   Contrast
   ────────────────────────────────────────────────────────────────────────── */

function relativeLuminance(hex: string): number {
  const normalized = normalizeHex(hex) ?? "#000000";
  const [r, g, b] = [1, 3, 5].map((i) =>
    srgbToLinear(parseInt(normalized.slice(i, i + 2), 16) / 255),
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two opaque colours, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  ) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Text that stays readable on `background`.
 *
 * The administrator chooses the fill; the label on top of it is not a matter
 * of taste, so it is computed. The dark candidate is tinted with the fill's
 * own hue so a label on a brand button still belongs to the brand.
 */
export function readableInk(background: string): string {
  const { c, h } = hexToOklch(background);
  const light = "#ffffff";
  const dark = ok(0.16, Math.min(c * 0.25, 0.04), h);
  return contrastRatio(light, background) >= contrastRatio(dark, background)
    ? light
    : dark;
}

/* ──────────────────────────────────────────────────────────────────────────
   Palette derivation
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Chart ramp steps.
 *
 * `--chart-1..5` are an *ordinal* ramp — one hue, monotone lightness — which
 * is what `app/globals.css` already shipped and what a single-hue brand can
 * legitimately produce. A categorical palette (one hue per series) is
 * deliberately NOT derived from the brand: its fixed hue order is what keeps
 * series distinguishable under colour-vision deficiency, and rotating that
 * order onto a brand hue collapses it. Status colours stay reserved too.
 *
 * These steps were swept across the hue circle against the data-visualisation
 * ordinal checks (monotone lightness, adjacent ΔL ≥ 0.06, light end ≥ 2:1 on
 * its surface): 576 brand/mode combinations, no failures.
 */
const CHART_LIGHTNESS = {
  light: [0.75, 0.665, 0.58, 0.495, 0.41],
  dark: [0.8, 0.715, 0.63, 0.545, 0.46],
} as const;

/** Per-step chroma ceilings, so a vivid brand does not produce a neon ramp. */
const CHART_CHROMA_CEILING = [0.11, 0.15, 0.19, 0.2, 0.17] as const;

function chartRamp(brand: Oklch, mode: "light" | "dark"): string[] {
  const chroma = mode === "dark" ? brand.c * 1.05 : brand.c;
  return CHART_LIGHTNESS[mode].map((l, i) =>
    ok(l, clamp(chroma, 0.04, CHART_CHROMA_CEILING[i]!), brand.h),
  );
}

export type ThemeVars = Record<string, string>;

export type Palette = { light: ThemeVars; dark: ThemeVars };

/**
 * Every custom property the brand owns, for both modes.
 *
 * Neutrals (background, card, muted, border) are left alone on purpose: a
 * brand colour should tint the interface, not repaint the paper it is printed
 * on. `--destructive` is likewise untouched — red means failed, whatever the
 * brand is.
 */
export function buildPalette(theme: BrandTheme): Palette {
  const brandHex = normalizeHex(theme.brand ?? "") ?? DEFAULT_BRAND;
  const brand = hexToOklch(brandHex);
  const { c, h } = brand;

  // On a dark background a dark brand disappears, so the primary is floated
  // up into a readable band there while keeping the admin's hue and chroma.
  const darkBrandHex = ok(clamp(brand.l, 0.55, 0.8), c, h);

  const lightChart = chartRamp(brand, "light");
  const darkChart = chartRamp(brand, "dark");

  const light: ThemeVars = {
    "--primary": brandHex,
    "--primary-foreground": readableInk(brandHex),
    "--ring": ok(clamp(brand.l, 0.45, 0.72), Math.min(c * 0.55, 0.12), h),
    "--chart-1": lightChart[0]!,
    "--chart-2": lightChart[1]!,
    "--chart-3": lightChart[2]!,
    "--chart-4": lightChart[3]!,
    "--chart-5": lightChart[4]!,
  };

  const dark: ThemeVars = {
    "--primary": darkBrandHex,
    "--primary-foreground": readableInk(darkBrandHex),
    "--ring": ok(clamp(brand.l, 0.5, 0.75), Math.min(c * 0.5, 0.1), h),
    "--chart-1": darkChart[0]!,
    "--chart-2": darkChart[1]!,
    "--chart-3": darkChart[2]!,
    "--chart-4": darkChart[3]!,
    "--chart-5": darkChart[4]!,
  };

  const customSidebar = normalizeHex(theme.sidebar ?? "");

  if (customSidebar) {
    Object.assign(light, sidebarFromSurface(customSidebar, brandHex));
    Object.assign(dark, sidebarFromSurface(customSidebar, darkBrandHex));
  } else {
    Object.assign(light, {
      "--sidebar": ok(0.985, Math.min(c * 0.03, 0.006), h),
      "--sidebar-foreground": ok(0.16, Math.min(c * 0.03, 0.006), h),
      "--sidebar-primary": brandHex,
      "--sidebar-primary-foreground": readableInk(brandHex),
      "--sidebar-accent": ok(0.94, Math.min(c * 0.1, 0.028), h),
      "--sidebar-accent-foreground": ok(0.36, Math.min(c * 0.7, 0.16), h),
      "--sidebar-active": withAlpha(brandHex, 0.1),
      "--sidebar-border": ok(0.92, Math.min(c * 0.03, 0.006), h),
      "--sidebar-ring": ok(0.7, Math.min(c * 0.2, 0.04), h),
    } satisfies ThemeVars);
    Object.assign(dark, {
      "--sidebar": ok(0.19, Math.min(c * 0.06, 0.016), h),
      "--sidebar-foreground": ok(0.97, Math.min(c * 0.02, 0.006), h),
      "--sidebar-primary": darkBrandHex,
      "--sidebar-primary-foreground": readableInk(darkBrandHex),
      "--sidebar-accent": ok(0.27, Math.min(c * 0.16, 0.042), h),
      "--sidebar-accent-foreground": ok(0.84, Math.min(c * 0.4, 0.1), h),
      "--sidebar-active": withAlpha(darkBrandHex, 0.16),
      "--sidebar-border": ok(0.3, Math.min(c * 0.08, 0.02), h),
      "--sidebar-ring": ok(0.5, Math.min(c * 0.2, 0.04), h),
    } satisfies ThemeVars);
  }

  return { light, dark };
}

/**
 * Build the sidebar slots from an explicitly chosen sidebar colour.
 *
 * The administrator gets exactly the colour they picked; everything drawn on
 * top of it — labels, hover fills, the active row — is derived from its own
 * lightness so a dark navy sidebar gets pale labels and a pastel one gets dark
 * labels, with no further choices to make.
 */
function sidebarFromSurface(surface: string, accent: string): ThemeVars {
  const { l, c, h } = hexToOklch(surface);
  const isDarkSurface = l < 0.6;
  const ink = readableInk(surface);

  // A highlight has to be visible against the surface it sits on, so it moves
  // away from the surface's lightness rather than to a fixed value.
  const lift = (amount: number) =>
    ok(clamp(isDarkSurface ? l + amount : l - amount, 0.05, 0.98), c, h);

  // The brand accent needs to survive on this surface; if it cannot, the
  // sidebar's own ink carries the active state instead.
  const accentOnSurface = contrastRatio(accent, surface) >= 3 ? accent : ink;

  return {
    "--sidebar": surface,
    "--sidebar-foreground": ink,
    "--sidebar-primary": accentOnSurface,
    "--sidebar-primary-foreground": readableInk(accentOnSurface),
    "--sidebar-accent": lift(0.08),
    "--sidebar-accent-foreground": ink,
    "--sidebar-active": withAlpha(ink, isDarkSurface ? 0.14 : 0.1),
    "--sidebar-border": withAlpha(ink, 0.14),
    "--sidebar-ring": accentOnSurface,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   CSS emission
   ────────────────────────────────────────────────────────────────────────── */

const serialize = (vars: ThemeVars) =>
  Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(";");

/**
 * The palette as a stylesheet.
 *
 * `:root:root` and `:root:root.dark` are doubled deliberately: they raise the
 * specificity above the `:root` / `.dark` blocks in `app/globals.css` so the
 * override wins no matter which stylesheet the browser happens to apply last,
 * and the dark selector still outranks the light one.
 */
export function buildThemeCss(theme: BrandTheme): string {
  const { light, dark } = buildPalette(theme);
  return `:root:root{${serialize(light)}}:root:root.dark{${serialize(dark)}}`;
}

/* ──────────────────────────────────────────────────────────────────────────
   Persistence and application
   ────────────────────────────────────────────────────────────────────────── */

/** The chosen colours, so the settings form can show what is saved. */
export const THEME_STORAGE_KEY = "brand-theme";
/** The generated CSS, so the pre-paint script needs no colour maths. */
export const THEME_CSS_STORAGE_KEY = "brand-theme-css";
/** Fired after the palette changes, so open views restyle without a reload. */
export const THEME_CHANGE_EVENT = "brand-theme-change";

const STYLE_ELEMENT_ID = "brand-theme";

export function readStoredTheme(): BrandTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw) as Partial<BrandTheme>;
    return {
      brand: normalizeHex(parsed.brand ?? ""),
      sidebar: normalizeHex(parsed.sidebar ?? ""),
    };
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Put `theme` on screen and remember it.
 *
 * The CSS is cached alongside the colours so the pre-paint script in the
 * document head can restore the palette without loading this module — that is
 * what stops a branded dashboard from flashing the default blue on every
 * navigation.
 */
export function applyTheme(theme: BrandTheme): void {
  if (typeof document === "undefined") return;

  const isDefault = !theme.brand && !theme.sidebar;
  const css = isDefault ? "" : buildThemeCss(theme);

  let style = document.getElementById(STYLE_ELEMENT_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;

  try {
    if (isDefault) {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      window.localStorage.removeItem(THEME_CSS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
      window.localStorage.setItem(THEME_CSS_STORAGE_KEY, css);
    }
  } catch {
    // A browser with storage disabled still gets the colours for this page.
  }

  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
}

/**
 * A deep, mostly-desaturated shade of the brand.
 *
 * The opening value when somebody takes the sidebar colour into their own
 * hands: recognisably their brand, dark enough to carry pale labels, and a
 * starting point rather than a surprise.
 */
export function deepBrandShade(brandHex: string): string {
  const { c, h } = hexToOklch(brandHex);
  return ok(0.28, Math.min(c * 0.35, 0.06), h);
}

/** True when the two themes would produce the same palette. */
export function themesEqual(a: BrandTheme, b: BrandTheme): boolean {
  return a.brand === b.brand && a.sidebar === b.sidebar;
}
