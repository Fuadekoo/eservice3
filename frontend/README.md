This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

`.env` is not committed, so set these in every environment you deploy to.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | yes | Origin or path the browser calls the backend on. |
| `NEXT_PUBLIC_SITE_URL` | in production | This site's public origin, e.g. `https://eservice.example.gov.et`. Open Graph and canonical URLs have to be absolute, so link previews and search results point at `localhost` until this is set. The build prints a warning if it is missing. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | no | Public half of the backend's Web Push key; fetched from the API if unset. |
| `NEXT_PUBLIC_TUTORIAL_VIDEO_URL` | no | Video embedded on *How to Apply*. |
| `NEXT_PUBLIC_ENABLE_SW_IN_DEV` | no | Registers the service worker in `next dev` for testing push locally. |

### Link previews

Every page carries Open Graph and Twitter card tags built by `lib/seo.ts`. The
1200×630 share image is drawn at build time by `app/opengraph-image.tsx` (and
its Twitter twin) from `lib/og-card.tsx`, so it stays in step with the site name
and tagline instead of being a PNG somebody has to re-export. To change what a
shared link looks like, edit those two files — not the individual pages.

A page gets its own title and description by exporting `pageMetadata(...)` from
a segment `layout.tsx`; the guest and auth routes each have one. Pages under
`app/(dashboard)` are marked `noindex`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
