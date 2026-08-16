import { Router } from "express";

import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  clearAllNotifications,
  getNotifications,
  getPushDevices,
  getPushPublicKey,
  getUnreadCount,
  readAllNotifications,
  readNotification,
  removeNotification,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
} from "../controllers/notification.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notification inbox and Web Push subscriptions
 *
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         title: { type: string }
 *         body: { type: string }
 *         url: { type: string, description: "In-app path a click should open" }
 *         icon: { type: string, nullable: true }
 *         kind:
 *           type: string
 *           enum: [request, request_approved, request_rejected, appointment, appointment_approved, appointment_cancelled, appointment_reminder, report, feedback, system]
 *         isRead: { type: boolean }
 *         readAt: { type: string, format: date-time, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *     PushSubscriptionInput:
 *       type: object
 *       required: [endpoint, keys]
 *       properties:
 *         endpoint: { type: string, maxLength: 512 }
 *         expirationTime: { type: number, nullable: true }
 *         keys:
 *           type: object
 *           required: [p256dh, auth]
 *           properties:
 *             p256dh: { type: string }
 *             auth: { type: string }
 */

/**
 * @swagger
 * /notifications/push/public-key:
 *   get:
 *     tags: [Notifications]
 *     summary: VAPID public key for this server
 *     description: >
 *       Unauthenticated — the browser needs this key before it can create a
 *       subscription. `enabled` is false when the server has no VAPID pair
 *       configured, which clients use to hide the feature.
 *     responses:
 *       200:
 *         description: Key, or enabled=false
 *
 * /notifications/push/subscribe:
 *   post:
 *     tags: [Notifications]
 *     summary: Register this browser for push
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PushSubscriptionInput' }
 *     responses:
 *       201: { description: Subscription stored }
 *       400: { description: Malformed subscription }
 *       503: { description: Push is not configured on the server }
 *   delete:
 *     tags: [Notifications]
 *     summary: Unregister a browser from push
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint]
 *             properties:
 *               endpoint: { type: string }
 *     responses:
 *       200: { description: Removed (idempotent) }
 *
 * /notifications/push/devices:
 *   get:
 *     tags: [Notifications]
 *     summary: Browsers currently receiving this account's notifications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Device list }
 *
 * /notifications/push/test:
 *   post:
 *     tags: [Notifications]
 *     summary: Send a test push to your own devices
 *     description: Does not create an inbox row — this is a delivery check.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Per-endpoint send/fail/prune counts }
 *       503: { description: Push is not configured on the server }
 *
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: The caller's notification inbox, newest first
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 *       - in: query
 *         name: kind
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated notifications plus the total unread count
 *   delete:
 *     tags: [Notifications]
 *     summary: Clear the caller's whole inbox
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Number of notifications deleted }
 *
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Unread badge count
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "{ unreadCount }" }
 *
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark every unread notification as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Number of notifications updated }
 *
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark one notification as read (idempotent)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated unread count }
 *
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete one notification
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found, or not yours }
 */

/**
 * Web Push plumbing.
 *
 * The public key is deliberately open: the browser must fetch it before it can
 * create a subscription, and it is a public key by definition. Everything that
 * touches a specific person's devices or inbox requires a session.
 *
 * These are declared before `/:id` so "push" is never mistaken for an id.
 */
router.get("/push/public-key", asyncHandler(getPushPublicKey));
router.post("/push/subscribe", requireAuth, asyncHandler(subscribeToPush));
router.delete("/push/subscribe", requireAuth, asyncHandler(unsubscribeFromPush));
router.get("/push/devices", requireAuth, asyncHandler(getPushDevices));
router.post("/push/test", requireAuth, asyncHandler(sendTestPush));

// Inbox — always the caller's own.
router.get("/", requireAuth, asyncHandler(getNotifications));
router.get("/unread-count", requireAuth, asyncHandler(getUnreadCount));
router.patch("/read-all", requireAuth, asyncHandler(readAllNotifications));
router.patch("/:id/read", requireAuth, asyncHandler(readNotification));
router.delete("/:id", requireAuth, asyncHandler(removeNotification));
router.delete("/", requireAuth, asyncHandler(clearAllNotifications));

export default router;
