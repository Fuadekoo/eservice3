# Notifications & Web Push

Every event in e-Service that a person needs to know about — a request
submitted, reviewed, approved or rejected; an appointment booked, confirmed,
rescheduled or cancelled — writes a durable notification row **and** pushes it
to that person's browsers.

That order matters. A push is a best-effort tap on the shoulder that a locked
phone, a revoked permission or an offline device can swallow without a trace.
The inbox row is what actually guarantees the message is seen; the push only
shortens the wait. Nothing in the system pushes without recording first.

---

## Setup

### 1. Generate a VAPID key pair

```bash
cd backend
npm run vapid
```

Paste the output into the env files:

```ini
# backend/.env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@your-domain.gov
```

```ini
# frontend/.env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   # optional; saves one round trip
```

`VAPID_SUBJECT` must be a `mailto:` or `https:` URI a push service can use to
reach you about a misbehaving sender.

**Treat the pair as long-lived.** A browser's push endpoint is cryptographically
bound to the public key that created it, so rotating the keys invalidates every
stored subscription and forces every user to re-enable notifications.

Without the keys the app still works — notifications land in the inbox and the
bell — but nothing is pushed, and the settings screen says so explicitly rather
than showing a switch that quietly does nothing.

### 2. Apply the migration

```bash
cd backend
npx prisma migrate deploy
```

Creates `notification` and `web_push_subscription`.

### 3. Serve over HTTPS

Service workers — and therefore push — only run on `https://` or `localhost`.

### Testing push in local development

The service worker is production-only by default, because a dev-mode worker
serves cached Next.js chunks that no longer match the running dev server. To
accept that trade-off in exchange for being able to test notifications:

```ini
# frontend/.env
NEXT_PUBLIC_ENABLE_SW_IN_DEV=true
```

Then use **Settings → Preferences → Send a test notification**.

---

## How it fits together

```
controller  ──▶  notification-events.ts  ──▶  notification.service.ts
(what happened)   (who hears about it,          (write the inbox row)
                   worded for that audience)              │
                                                          ▼
                                              push.service.ts  ──▶  browser
                                              (encrypt, deliver,      │
                                               prune dead endpoints)  ▼
                                                              sw.js `push`
                                                                      │
                                                                      ▼
                                                     tray notification + the
                                                     open tab's bell badge
```

### Backend

| File | Responsibility |
| --- | --- |
| `services/push.service.ts` | VAPID config, encrypted delivery, dead-endpoint pruning |
| `services/notification.service.ts` | Persist, dedupe, dispatch, and all inbox queries |
| `services/notification-events.ts` | One function per business event: who is told what |
| `controllers/notification.controller.ts` | Inbox + subscription HTTP endpoints |
| `routes/notification.route.ts` | Routing and Swagger docs |

Controllers call a single `notifyX(...)` and say nothing about recipients or
wording. Keeping that in one file means "who hears about a rejected request?"
has exactly one answer instead of being re-derived at each call site.

### Frontend

| File | Responsibility |
| --- | --- |
| `public/sw.js` | `push`, `notificationclick`, `pushsubscriptionchange` handlers |
| `lib/push.ts` | Permission, subscribe/unsubscribe, server sync |
| `lib/stores/notification-store.ts` | Inbox state with optimistic read/delete |
| `lib/stores/push-store.ts` | Permission/subscription/device state, shared by bell and settings |
| `hooks/use-notifications.ts` | Badge polling, SW messages, deep-link handling |
| `components/notifications/*` | Bell, list item, settings card |
| `app/(dashboard)/notifications/page.tsx` | Full inbox with filters and paging |

---

## Design decisions worth knowing

**Dedupe keys.** Every notification carries a stable key for its source event
(`request:<id>:approved`), unique per user. A retried handler or a
double-clicked approve button cannot produce two notifications. Rescheduling
includes the new date in the key, so a second reschedule is a fresh
notification rather than a silently swallowed duplicate.

**Push tags collapse on the subject, not the event.** A request that moves from
"approved by staff" to "approved by manager" replaces its own tray entry
instead of stacking a second one beneath it.

**Dead endpoints are pruned on 404/410 only.** Those two statuses mean the
subscription is gone for good. Everything else — 429, 5xx, a timeout — is
transient, and the row stays put.

**Notifications never block a response.** Controllers wrap every call in
`dispatch()`, so approving a request succeeds even when every push service on
earth is down.

**Ownership is enforced in the service layer.** There is no
"notifications for user X" endpoint, and every read and write is scoped to the
caller — an id guessed from another account is a no-op, not a cross-account
write.

**Push permission is per-browser, not per-account.** The settings screen shows
both facts at once: whether *this* browser is subscribed, and every other
device the account still delivers to. Conflating them is how "I turned
notifications off but still get them on my phone" happens.

**The prompt is never fired on page load.** It is offered inside the bell and
in settings, both behind a user gesture. A permission request that arrives
before anyone has seen the feature is the fastest way to get permanently
blocked.

**Signing out detaches the subscription**, so the next person on a shared
machine does not receive the previous user's approvals on the lock screen.

---

## API

All routes are under `/back-api/notifications` and scoped to the caller.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/` | Paginated inbox. `?unreadOnly=true`, `?kind=` |
| `DELETE` | `/` | Clear the whole inbox |
| `GET` | `/unread-count` | Badge count only |
| `PATCH` | `/read-all` | Mark everything read |
| `PATCH` | `/:id/read` | Idempotent |
| `DELETE` | `/:id` | 404 if not yours |
| `GET` | `/push/public-key` | **Unauthenticated** — it is a public key |
| `POST` | `/push/subscribe` | Upsert by endpoint |
| `DELETE` | `/push/subscribe` | Endpoint in the body, not the path |
| `GET` | `/push/devices` | Registered browsers |
| `POST` | `/push/test` | Delivery check; writes no inbox row |

Full request/response shapes are in Swagger at `/api-docs`.

---

## Events currently wired

| Event | Customer | Assigned staff | Office managers |
| --- | --- | --- | --- |
| Request submitted | receipt with ref no. | new work item | visibility |
| Approved by staff | moved forward, awaiting manager | — | needs your decision |
| Approved by manager | approved + where to go | approver gets a receipt | — |
| Request rejected | reason included | notified | — |
| Appointment booked | requested, awaiting confirmation | confirm this slot | confirm this slot |
| Appointment confirmed | confirmed + when | approver gets a receipt | — |
| Appointment rescheduled | new time | new time | new time |
| Appointment cancelled | cancelled | cancelled | cancelled |

SMS notifications are unchanged and continue to run alongside these.

### Adding a new event

1. Add a function to `services/notification-events.ts` that decides the
   audience and the wording, with a `dedupeKey` built from the source event.
2. Call it from the controller wrapped in `dispatch(...)`.
3. If it needs a new visual treatment, add the kind to `NotificationKind`
   (`notification.service.ts` and `notification-store.ts`), to
   `KIND_PRESENTATION` in `notification-item.tsx`, and to `KIND_STYLES` in
   `sw.js`.
