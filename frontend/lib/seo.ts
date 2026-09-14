import type { Metadata } from "next";

/**
 * One place for everything a link preview, a search result or a browser tab
 * shows. Page files describe themselves through `pageMetadata` below rather
 * than hand-assembling `openGraph` blocks, so a card never ends up with a title
 * but no description, or a canonical URL that points at the wrong host.
 */

export const SITE_NAME = "e-Service";

export const SITE_TAGLINE = "Government Services Management System";

/** What a share card leads with when no page overrides it. */
export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const SITE_DESCRIPTION =
  "Apply for government services online, track every request from submission to approval, and book your office appointment — available in Afaan Oromoo, Amharic and English.";

/**
 * The public origin, used to turn every relative path into the absolute URL
 * that Open Graph requires — a crawler has no page context to resolve `/about`
 * against, so a relative `og:url` or `og:image` is simply dropped.
 *
 * Set `NEXT_PUBLIC_SITE_URL` to the real origin in every deployed environment.
 * The localhost fallback keeps development working, but a production build that
 * inherits it will publish link previews pointing at the reader's own machine,
 * so the build warns rather than failing silently.
 */
function resolveSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    try {
      return new URL(configured);
    } catch {
      console.warn(
        `[seo] NEXT_PUBLIC_SITE_URL is not a valid URL: ${configured}. Falling back to localhost.`,
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn(
      "[seo] NEXT_PUBLIC_SITE_URL is not set. Link previews and canonical URLs will point at localhost.",
    );
  }

  return new URL("http://localhost:3000");
}

export const SITE_URL = resolveSiteUrl();

/** Absolute URL for a path, which is the only form Open Graph accepts. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * The locales this system is offered in. `og:locale` names the one the markup
 * is written in; the alternates tell a crawler the same page serves the others.
 */
export const OG_LOCALE = "en_US";
export const OG_LOCALE_ALTERNATES = ["am_ET", "om_ET"];

/**
 * The share card, named explicitly rather than left to the file convention.
 *
 * `app/opengraph-image.tsx` auto-attaches itself to routes that inherit the
 * root `openGraph` untouched — but a segment that declares an `openGraph` block
 * of its own replaces the resolved parent object wholesale, images included. So
 * every page that sets a title here would otherwise unfurl with text and no
 * picture, which is the one failure mode a share card cannot survive. Verified
 * against the built HTML, not assumed.
 */
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: SITE_TITLE,
};

const TWITTER_IMAGE = {
  url: "/twitter-image",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: SITE_TITLE,
};

type PageMetadataInput = {
  /** Page title, without the site name — the title template appends that. */
  title: string;
  description: string;
  /** Route path, e.g. "/about". Becomes the canonical and `og:url`. */
  path: string;
  /**
   * Whether search engines should index the page. Pages behind sign-in, and
   * one-off utility pages like password recovery, set this to false: they are
   * thin, duplicated or private, and indexing them helps nobody.
   */
  index?: boolean;
};

/** Metadata for one page, complete on every channel at once. */
export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const socialTitle = `${title} — ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: OG_LOCALE,
      alternateLocale: OG_LOCALE_ALTERNATES,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [TWITTER_IMAGE],
    },
    ...(index
      ? {}
      : { robots: { index: false, follow: false, nocache: true } }),
  };
}
