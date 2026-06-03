import { Router } from "express";
import {
  // Roles
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  // Permissions
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  // Permission Sets
  listPermissionSets,
  createPermissionSet,
  updatePermissionSet,
  deletePermissionSet,
  // Security Programs
  listSecurityPrograms,
  createSecurityProgram,
  updateSecurityProgram,
  deleteSecurityProgram,
  // Security Audits
  listSecurityAudits,
  createSecurityAudit,
  updateSecurityAudit,
  deleteSecurityAudit,
  // Security Incidents
  listSecurityIncidents,
  createSecurityIncident,
  updateSecurityIncident,
  deleteSecurityIncident,
  // Security Reminders
  listSecurityReminders,
  createSecurityReminder,
  updateSecurityReminder,
  deleteSecurityReminder,
  // Permission Change Requests
  listPermissionChangeRequests,
  createPermissionChangeRequest,
  updatePermissionChangeRequest,
  deletePermissionChangeRequest,
  // Audit Logs
  listAuditLogs,
  createAuditLog,
  updateAuditLog,
  deleteAuditLog,
} from "../controllers/security.controller.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * /security/roles:
 *   get:
 *     summary: List all roles
 *     description: Get a list of all roles
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Role'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
// Roles routes
router.get("/roles", requireAuth, requirePermission("role:read"), listRoles);

/**
 * @swagger
 * /security/roles:
 *   post:
 *     summary: Create role
 *     description: Create a new role
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - roleType
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               roleType:
 *                 type: string
 *                 enum: [SUPER_ADMIN_ROLE, OFFICE_ROLE]
 *               systemRole:
 *                 type: string
 *                 enum: [admin, office, storekeeper]
 *                 nullable: true
 *               officeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  "/roles",
  requireAuth,
  requirePermission("role:create"),
  createRole,
);

/**
 * @swagger
 * /security/roles/{id}:
 *   put:
 *     summary: Update role
 *     description: Update role information
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Role not found
 */
router.put(
  "/roles/:id",
  requireAuth,
  requirePermission("role:update"),
  updateRole,
);

/**
 * @swagger
 * /security/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     description: Delete a role
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Role not found
 */
router.delete(
  "/roles/:id",
  requireAuth,
  requirePermission("role:delete"),
  deleteRole,
);

/**
 * @swagger
 * /security/permissions:
 *   get:
 *     summary: List all permissions
 *     description: Get a list of all permissions
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Permission'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
// Permissions routes
router.get(
  "/permissions",
  requireAuth,
  requirePermission("permissions.view"),
  listPermissions,
);

/**
 * @swagger
 * /security/permissions:
 *   post:
 *     summary: Create permission
 *     description: Create a new permission
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 */
router.post(
  "/permissions",
  requireAuth,
  requirePermission("permissions.create"),
  createPermission,
);

/**
 * @swagger
 * /security/permissions/{id}:
 *   put:
 *     summary: Update permission
 *     description: Update permission information
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Permission not found
 */
router.put(
  "/permissions/:id",
  requireAuth,
  requirePermission("permissions.update"),
  updatePermission,
);

/**
 * @swagger
 * /security/permissions/{id}:
 *   delete:
 *     summary: Delete permission
 *     description: Delete a permission
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Permission not found
 */
router.delete(
  "/permissions/:id",
  requireAuth,
  requirePermission("permissions.delete"),
  deletePermission,
);

/**
 * @swagger
 * /security/permission-sets:
 *   get:
 *     summary: List all permission sets
 *     description: Get a list of all permission sets
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of permission sets retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 */
// Permission Sets routes
router.get(
  "/permission-sets",
  requireAuth,
  requirePermission("roles.view"),
  listPermissionSets,
);

/**
 * @swagger
 * /security/permission-sets:
 *   post:
 *     summary: Create permission set
 *     description: Create a new permission set
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Permission set created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 */
router.post(
  "/permission-sets",
  requireAuth,
  requirePermission("roles.create"),
  createPermissionSet,
);

/**
 * @swagger
 * /security/permission-sets/{id}:
 *   put:
 *     summary: Update permission set
 *     description: Update permission set information
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permission set updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Permission set not found
 */
router.put(
  "/permission-sets/:id",
  requireAuth,
  requirePermission("roles.update"),
  updatePermissionSet,
);

/**
 * @swagger
 * /security/permission-sets/{id}:
 *   delete:
 *     summary: Delete permission set
 *     description: Delete a permission set
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission set deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Permission set not found
 */
router.delete(
  "/permission-sets/:id",
  requireAuth,
  requirePermission("roles.delete"),
  deletePermissionSet,
);

/**
 * @swagger
 * /security/programs:
 *   get:
 *     summary: List all security programs
 *     description: Get a list of all security programs
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of security programs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 */
// Security Programs routes
router.get(
  "/programs",
  requireAuth,
  requirePermission("security_programs.view"),
  listSecurityPrograms,
);

/**
 * @swagger
 * /security/programs:
 *   post:
 *     summary: Create security program
 *     description: Create a new security program
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Security program created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 */
router.post(
  "/programs",
  requireAuth,
  requirePermission("security_programs.create"),
  createSecurityProgram,
);

/**
 * @swagger
 * /security/programs/{id}:
 *   put:
 *     summary: Update security program
 *     description: Update security program information
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Security program updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Security program not found
 */
router.put(
  "/programs/:id",
  requireAuth,
  requirePermission("security_programs.update"),
  updateSecurityProgram,
);

/**
 * @swagger
 * /security/programs/{id}:
 *   delete:
 *     summary: Delete security program
 *     description: Delete a security program
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Security program deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Security program not found
 */
router.delete(
  "/programs/:id",
  requireAuth,
  requirePermission("security_programs.delete"),
  deleteSecurityProgram,
);

/**
 * @swagger
 * /security/audits:
 *   get:
 *     summary: List all security audits
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of security audits retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// Security Audits routes
router.get(
  "/audits",
  requireAuth,
  requirePermission("security_programs.view"),
  listSecurityAudits,
);

/**
 * @swagger
 * /security/audits:
 *   post:
 *     summary: Create security audit
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Security audit created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/audits",
  requireAuth,
  requirePermission("security_programs.create"),
  createSecurityAudit,
);

/**
 * @swagger
 * /security/audits/{id}:
 *   put:
 *     summary: Update security audit
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Security audit updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/audits/:id",
  requireAuth,
  requirePermission("security_programs.update"),
  updateSecurityAudit,
);

/**
 * @swagger
 * /security/audits/{id}:
 *   delete:
 *     summary: Delete security audit
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Security audit deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/audits/:id",
  requireAuth,
  requirePermission("security_programs.delete"),
  deleteSecurityAudit,
);

/**
 * @swagger
 * /security/incidents:
 *   get:
 *     summary: List all security incidents
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of security incidents retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// Security Incidents routes
router.get(
  "/incidents",
  requireAuth,
  requirePermission("security_programs.view"),
  listSecurityIncidents,
);

/**
 * @swagger
 * /security/incidents:
 *   post:
 *     summary: Create security incident
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Security incident created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/incidents",
  requireAuth,
  requirePermission("security_programs.create"),
  createSecurityIncident,
);

/**
 * @swagger
 * /security/incidents/{id}:
 *   put:
 *     summary: Update security incident
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Security incident updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/incidents/:id",
  requireAuth,
  requirePermission("security_programs.update"),
  updateSecurityIncident,
);

/**
 * @swagger
 * /security/incidents/{id}:
 *   delete:
 *     summary: Delete security incident
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Security incident deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/incidents/:id",
  requireAuth,
  requirePermission("security_programs.delete"),
  deleteSecurityIncident,
);

/**
 * @swagger
 * /security/reminders:
 *   get:
 *     summary: List all security reminders
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of security reminders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// Security Reminders routes
router.get(
  "/reminders",
  requireAuth,
  requirePermission("security_programs.view"),
  listSecurityReminders,
);

/**
 * @swagger
 * /security/reminders:
 *   post:
 *     summary: Create security reminder
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Security reminder created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/reminders",
  requireAuth,
  requirePermission("security_programs.create"),
  createSecurityReminder,
);

/**
 * @swagger
 * /security/reminders/{id}:
 *   put:
 *     summary: Update security reminder
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Security reminder updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/reminders/:id",
  requireAuth,
  requirePermission("security_programs.update"),
  updateSecurityReminder,
);

/**
 * @swagger
 * /security/reminders/{id}:
 *   delete:
 *     summary: Delete security reminder
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Security reminder deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/reminders/:id",
  requireAuth,
  requirePermission("security_programs.delete"),
  deleteSecurityReminder,
);

/**
 * @swagger
 * /security/permission-change-requests:
 *   get:
 *     summary: List all permission change requests
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of permission change requests retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// Permission Change Requests routes
router.get(
  "/permission-change-requests",
  requireAuth,
  requirePermission("roles.view"),
  listPermissionChangeRequests,
);

/**
 * @swagger
 * /security/permission-change-requests:
 *   post:
 *     summary: Create permission change request
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Permission change request created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/permission-change-requests",
  requireAuth,
  requirePermission("roles.create"),
  createPermissionChangeRequest,
);

/**
 * @swagger
 * /security/permission-change-requests/{id}:
 *   put:
 *     summary: Update permission change request
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission change request updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/permission-change-requests/:id",
  requireAuth,
  requirePermission("roles.update"),
  updatePermissionChangeRequest,
);

/**
 * @swagger
 * /security/permission-change-requests/{id}:
 *   delete:
 *     summary: Delete permission change request
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission change request deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/permission-change-requests/:id",
  requireAuth,
  requirePermission("roles.delete"),
  deletePermissionChangeRequest,
);

/**
 * @swagger
 * /security/audit-logs:
 *   get:
 *     summary: List all audit logs
 *     description: Get a paginated list of audit logs
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
// Audit Logs routes
router.get(
  "/audit-logs",
  requireAuth,
  requirePermission("audit_logs.view"),
  listAuditLogs,
);

/**
 * @swagger
 * /security/audit-logs:
 *   post:
 *     summary: Create audit log
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Audit log created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/audit-logs",
  requireAuth,
  requirePermission("audit_logs.view"),
  createAuditLog,
);

/**
 * @swagger
 * /security/audit-logs/{id}:
 *   put:
 *     summary: Update audit log
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/audit-logs/:id",
  requireAuth,
  requirePermission("audit_logs.view"),
  updateAuditLog,
);

/**
 * @swagger
 * /security/audit-logs/{id}:
 *   delete:
 *     summary: Delete audit log
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/audit-logs/:id",
  requireAuth,
  requirePermission("audit_logs.view"),
  deleteAuditLog,
);

export default router;
