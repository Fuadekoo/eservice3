/**
 * Allowlist sanitiser for rich-text content authored in the dashboard.
 *
 * The about page is public, so anything stored in these fields is served to
 * every visitor. The editor only ever produces the tags below, but the API
 * accepts whatever is posted to it — this is the boundary where that is made
 * safe, rather than trusting each client to clean up on the way out.
 *
 * Written against a tag/attribute allowlist rather than a blocklist: a
 * blocklist has to anticipate every dangerous construct, an allowlist only has
 * to know what is legitimate.
 */

/** Tags the editor can produce. Everything else is unwrapped or dropped. */
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "del",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "hr", "code", "pre", "a", "span",
]);

/** Elements whose *content* is dangerous, so the text goes with the tag. */
const VOID_CONTENT_TAGS = new Set(["script", "style", "iframe", "object", "embed", "noscript"]);

/** Attributes kept per tag. Anything not listed — every `on*` included — goes. */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
};

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

/** Self-closing tags that must not get a closing tag when re-serialised. */
const VOID_TAGS = new Set(["br", "hr"]);

type Attr = { name: string; value: string };

function parseAttributes(raw: string): Attr[] {
  const attrs: Attr[] = [];
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw)) !== null) {
    attrs.push({
      name: match[1]!.toLowerCase(),
      value: match[2] ?? match[3] ?? match[4] ?? "",
    });
  }
  return attrs;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Strip everything outside the allowlist from a rich-text value.
 *
 * Returns the cleaned HTML. Unknown *formatting* tags are unwrapped so their
 * text survives; tags whose content is itself the payload (script, style) are
 * removed wholesale.
 */
export function sanitizeRichText(input: string): string {
  if (!input) return "";

  // Drop dangerous elements together with everything they contain, including
  // unclosed ones — `<script>alert(1)` must not leave the payload behind.
  let html = input.replace(
    new RegExp(`<\\s*(${[...VOID_CONTENT_TAGS].join("|")})\\b[\\s\\S]*?(?:<\\/\\s*\\1\\s*>|$)`, "gi"),
    "",
  );

  // Comments can hide conditional markup.
  html = html.replace(/<!--[\s\S]*?(?:-->|$)/g, "");

  const out: string[] = [];
  const open: string[] = [];
  const token = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|<[^>]*>/g;

  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = token.exec(html)) !== null) {
    if (match.index > cursor) {
      out.push(escapeText(html.slice(cursor, match.index)));
    }
    cursor = token.lastIndex;

    const [raw, name, attrRaw] = match;
    // A stray `<` or a doctype: not a recognisable tag, so treat it as text.
    if (!name) {
      out.push(escapeText(raw));
      continue;
    }

    const tag = name.toLowerCase();
    const isClosing = raw.startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) {
      // Unwrap: the tag disappears, its text keeps flowing.
      continue;
    }

    if (isClosing) {
      const index = open.lastIndexOf(tag);
      if (index === -1) continue; // stray close tag
      // Close anything left open inside it, so the output stays well-formed.
      while (open.length > index) {
        out.push(`</${open.pop()}>`);
      }
      continue;
    }

    if (VOID_TAGS.has(tag)) {
      out.push(`<${tag}>`);
      continue;
    }

    const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
    const kept: string[] = [];

    for (const attr of parseAttributes(attrRaw ?? "")) {
      if (!allowed.has(attr.name)) continue;

      if (tag === "a" && attr.name === "href") {
        const href = attr.value.trim();
        // `javascript:`, `data:` and friends never reach the page.
        if (!SAFE_HREF.test(href)) continue;
        kept.push(`href="${escapeAttr(href)}"`);
        continue;
      }

      kept.push(`${attr.name}="${escapeAttr(attr.value)}"`);
    }

    // Links leave the site, so they get the usual protections.
    if (tag === "a") {
      if (!kept.some((a) => a.startsWith("href="))) continue;
      kept.push('target="_blank"', 'rel="noopener noreferrer nofollow"');
    }

    out.push(`<${tag}${kept.length ? " " + kept.join(" ") : ""}>`);
    open.push(tag);
  }

  if (cursor < html.length) {
    out.push(escapeText(html.slice(cursor)));
  }

  while (open.length) {
    out.push(`</${open.pop()}>`);
  }

  return out.join("");
}

/**
 * Sanitise an optional rich-text field, normalising a document that turns out
 * to be empty (`<p></p>`) to null so "no description" checks keep working.
 */
export function sanitizeOptionalRichText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const clean = sanitizeRichText(value);
  const text = clean.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
  return text.length === 0 && !/<hr\b/i.test(clean) ? null : clean;
}
