/**
 * Helpers shared by the rich-text editor and the renderer.
 *
 * About-page content used to be stored as plain text and is now stored as HTML.
 * Both shapes live in the database at the same time, so every read path has to
 * cope with either — hence `looksLikeHtml` and `plainTextToHtml`.
 */

/** Tags the editor can produce; anything else is stripped before rendering. */
const ALLOWED_TAGS = new Set([
  "P", "BR", "STRONG", "B", "EM", "I", "U", "S", "STRIKE", "DEL",
  "H1", "H2", "H3", "H4", "H5", "H6",
  "UL", "OL", "LI", "BLOCKQUOTE", "HR", "CODE", "PRE", "A", "SPAN", "DIV",
]);

/** Attributes worth keeping. Everything else (including every `on*`) is dropped. */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel", "title"]),
};

const SAFE_LINK = /^(https?:|mailto:|tel:|\/|#)/i;

/**
 * True when the value already contains markup, so legacy plain-text rows keep
 * rendering with their line breaks instead of collapsing into one paragraph.
 */
export function looksLikeHtml(value: string | null | undefined): boolean {
  if (!value) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/** Escapes text so it can be embedded in HTML without being parsed as markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Turns a legacy plain-text value into the paragraph markup the editor expects,
 * so opening an old section for editing shows it laid out the way it displayed.
 */
export function plainTextToHtml(value: string): string {
  const blocks = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) return "";

  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Whatever shape the stored value is in, return HTML the editor can load. */
export function toEditorHtml(value: string | null | undefined): string {
  if (!value) return "";
  return looksLikeHtml(value) ? value : plainTextToHtml(value);
}

/**
 * True when the document has no visible content. TipTap emits `<p></p>` for an
 * empty document, which would otherwise be saved as a non-empty string.
 */
export function isEmptyHtml(value: string | null | undefined): boolean {
  if (!value) return true;
  const stripped = value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return stripped.length === 0 && !/<(img|hr|iframe)\b/i.test(value);
}

/**
 * Strip anything the editor could not have produced.
 *
 * The server sanitises on write, which is the real trust boundary; this is a
 * second pass on the way to the screen so a row written before that existed —
 * or through some other path — still cannot execute script. It uses the
 * browser's own parser and is therefore client-only; on the server the raw
 * value is returned and the markup is rendered after hydration instead.
 */
export function sanitizeHtml(value: string | null | undefined): string {
  if (!value) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return value;
  }

  const doc = new DOMParser().parseFromString(value, "text/html");

  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        // Keep the text, drop the element: a stripped <script> leaves nothing,
        // while a stripped <font> keeps the words it wrapped.
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }

      const allowed = ALLOWED_ATTRS[child.tagName] ?? new Set<string>();
      for (const attr of Array.from(child.attributes)) {
        if (!allowed.has(attr.name.toLowerCase())) {
          child.removeAttribute(attr.name);
        }
      }

      if (child.tagName === "A") {
        const href = child.getAttribute("href") ?? "";
        if (!SAFE_LINK.test(href)) {
          child.removeAttribute("href");
        } else {
          child.setAttribute("rel", "noopener noreferrer nofollow");
          child.setAttribute("target", "_blank");
        }
      }

      walk(child);
    }
  };

  // <script> and <style> carry their payload as text, so removing the element
  // is not enough — the text has to go with it.
  doc.body.querySelectorAll("script, style, iframe, object, embed").forEach((el) => el.remove());
  walk(doc.body);

  return doc.body.innerHTML;
}
