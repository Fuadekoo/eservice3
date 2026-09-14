import { renderOgCard, OG_ALT, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";

/**
 * X reads `twitter:image` in preference to `og:image`, and omitting this file
 * would leave the summary_large_image card falling back to the Open Graph tag
 * on some clients and to nothing on others. Same card, declared on both.
 */
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgCard();
}
