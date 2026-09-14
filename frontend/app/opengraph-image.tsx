import { renderOgCard, OG_ALT, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";

/**
 * The share card for the whole site. Every route inherits it unless a segment
 * ships its own `opengraph-image`, so one file covers the homepage, the guest
 * pages and anything linked from them.
 */
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgCard();
}
