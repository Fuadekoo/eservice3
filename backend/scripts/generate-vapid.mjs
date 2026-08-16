/**
 * Generates a VAPID key pair for Web Push.
 *
 * Run once per environment (`npm run vapid`), paste the output into the
 * backend `.env` and the public key into the frontend `.env.local`, then leave
 * it alone. Regenerating invalidates every subscription already stored — a
 * browser's push endpoint is bound to the public key that created it, so after
 * a rotation every user has to re-enable notifications.
 */

import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log(`
VAPID key pair generated. Store these — they are long-lived secrets.

────────────────────── backend/.env ──────────────────────
VAPID_PUBLIC_KEY=${publicKey}
VAPID_PRIVATE_KEY=${privateKey}
VAPID_SUBJECT=mailto:admin@your-domain.gov

──────────────── frontend/.env.local ─────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}

Notes:
  • VAPID_SUBJECT must be a mailto: or https: URI a push service can use to
    contact you. Point it at a mailbox somebody reads.
  • Never commit VAPID_PRIVATE_KEY.
  • The frontend key is optional — the app fetches the public key from
    /back-api/notifications/push/public-key at runtime — but setting it saves
    a round trip on first subscribe.
`);
