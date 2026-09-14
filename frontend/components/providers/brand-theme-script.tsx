import { THEME_CSS_STORAGE_KEY } from "@/lib/theme/brand-theme";

/**
 * Restores the saved brand palette before the first paint.
 *
 * The palette lives in CSS custom properties, so React could apply it on
 * mount — but by then the browser has already painted one frame of the
 * default blue, and a branded dashboard that flashes another organisation's
 * colour on every load looks broken. This runs synchronously in <head>,
 * ahead of the body, which is the same trick next-themes uses for dark mode.
 *
 * It reads the *generated* CSS rather than the chosen colours so no colour
 * maths has to be inlined here; `applyTheme` keeps that cache in step.
 */
export function BrandThemeScript() {
  const script = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
    THEME_CSS_STORAGE_KEY,
  )});if(!c)return;var s=document.createElement("style");s.id="brand-theme";s.textContent=c;document.head.appendChild(s)}catch(e){}})()`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
