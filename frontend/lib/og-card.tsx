import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";

/**
 * The image every link to this system unfurls into.
 *
 * 1200×630 is the size Facebook, LinkedIn, WhatsApp, Slack and X all crop to
 * least destructively, and the one that earns the large card rather than the
 * thumbnail. Everything important is kept inside a generous margin because each
 * of them trims the edges by a different amount, and the smallest a card is
 * ever shown at is around 300px wide — which is why the headline is set at 64px
 * rather than at a size that only reads on a desktop timeline.
 *
 * Drawn rather than shipped as a PNG so it never falls out of step with the
 * name and tagline in `lib/seo.ts`, and so there is no binary to re-export by
 * hand when either changes.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
export const OG_ALT = `${SITE_NAME} — ${SITE_TAGLINE}`;

/** The brand blue, matching `theme_color` in manifest.json. */
const BRAND = "#0047ff";
const BRAND_LIGHT = "#5b8bff";
const INK = "#050a1c";
const PAPER = "#ffffff";
const MUTED = "#a9b6d9";

/**
 * The logo as a data URI. Satori cannot fetch a relative path — it has no page
 * to resolve one against — so the bytes are inlined. A missing or unreadable
 * file falls back to a monogram rather than failing the build, because a plain
 * card is a far better outcome than a deployment that cannot produce one.
 */
async function loadLogo(): Promise<string | null> {
  try {
    const file = await readFile(path.join(process.cwd(), "public", "logo.png"));
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
}

/** The three things someone can actually do here, as the card's footer. */
const CAPABILITIES = [
  "Apply online",
  "Track every request",
  "Book appointments",
];

export async function renderOgCard(options?: {
  /** Headline. Defaults to the site tagline. */
  title?: string;
  /** The line under the headline. */
  subtitle?: string;
  /** Small label above the headline. */
  eyebrow?: string;
}): Promise<ImageResponse> {
  const title = options?.title ?? SITE_TAGLINE;
  const subtitle =
    options?.subtitle ??
    "Government offices, services and appointments in one place.";
  const eyebrow = options?.eyebrow ?? SITE_NAME;
  const logo = await loadLogo();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: INK,
          // Two offset glows keep a flat dark rectangle from reading as an
          // image that failed to load.
          backgroundImage: `radial-gradient(1100px 620px at 12% -12%, ${BRAND}66 0%, ${BRAND}00 62%), radial-gradient(900px 520px at 106% 118%, ${BRAND_LIGHT}33 0%, ${BRAND_LIGHT}00 60%)`,
          padding: "68px 76px",
          color: PAPER,
          fontFamily: "Geist, sans-serif",
        }}
      >
        {/* ── Brand row ───────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {logo ? (
            // Satori renders this to a PNG on the server; next/image has no
            // meaning here, and its output is not markup a browser ever loads.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              width={92}
              height={92}
              style={{ borderRadius: 22, objectFit: "cover" }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: BRAND,
                fontSize: 40,
                letterSpacing: -1,
              }}
            >
              eS
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 34, letterSpacing: -0.5 }}>{eyebrow}</div>
            <div style={{ fontSize: 21, color: MUTED }}>{SITE_URL.host}</div>
          </div>
        </div>

        {/* ── Headline ────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              lineHeight: 1.12,
              letterSpacing: -1.6,
              // Keeps a long page title from pushing the footer off the card.
              maxWidth: 940,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 27,
              lineHeight: 1.4,
              color: MUTED,
              maxWidth: 880,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* ── Capabilities ────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {CAPABILITIES.map((capability) => (
            <div
              key={capability}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 24px",
                borderRadius: 999,
                fontSize: 22,
                color: PAPER,
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.16)",
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  backgroundColor: BRAND_LIGHT,
                }}
              />
              {capability}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
