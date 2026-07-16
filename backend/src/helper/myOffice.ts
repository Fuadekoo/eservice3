import { prisma } from "../lib/db.js";
import type { AuthRequest } from "../middleware/auth.js";

const OFFICE_WIDE_ACCESS_ROLES = new Set(["ADMIN", "MANAGER", "STAFF"]);

type AuthRequestWithStaff = AuthRequest & {
  user?: AuthRequest["user"] & {
    staff?: {
      id: string;
      officeId?: string | null;
      role?: {
        id: string;
        name: string;
      } | null;
    } | null;
    officer?: {
      id: string;
      officeId?: string | null;
      role?: {
        id: string;
        name: string;
      } | null;
    } | null;
  };
};

type ScopedWhere = Record<string, unknown>;

function normalizeId(value?: string | null): string | undefined {
  const normalizedValue = value?.trim();
  return normalizedValue || undefined;
}

function getRequestStaff(req: AuthRequestWithStaff) {
  return req.user?.staff;
}

function getRequestOfficer(req: AuthRequestWithStaff) {
  return req.user?.officer;
}

export function normalizeRoleName(roleName?: string | null): string {
  return roleName?.trim().toUpperCase() ?? "";
}

export function getMyOfficeId(req: AuthRequest): string | undefined {
  const authRequest = req as AuthRequestWithStaff;

  return (
    normalizeId(getRequestStaff(authRequest)?.officeId) ??
    normalizeId(getRequestOfficer(authRequest)?.officeId)
  );
}

export function getAssignedOfficeId(req: AuthRequest): string | undefined {
  const authRequest = req as AuthRequestWithStaff;

  return (
    normalizeId(getRequestStaff(authRequest)?.officeId) ??
    normalizeId(getRequestOfficer(authRequest)?.warehouseId) ??
    getMyOfficeId(req)
  );
}

export function hasOfficeWideAccess(
  roleName?: string | null,
  isAdmin = false,
  isManager = false,
): boolean {
  return (
    isAdmin ||
    isManager ||
    OFFICE_WIDE_ACCESS_ROLES.has(normalizeRoleName(roleName))
  );
}

export function requestHasOfficeWideAccess(req: AuthRequest): boolean {
  // Only ADMIN transcends office boundaries. A MANAGER or STAFF user is bound to
  // their single assigned office, so every list/scope query must filter to it —
  // otherwise they would see (and act on) data from every office. This governs
  // the read-scope helpers below (getScopedOfficeId / applyOfficeScope /
  // getMyOfficeIds / canAccessOffice); staff-creation assignment uses
  // hasOfficeWideAccess() directly and is intentionally left unchanged.
  return req.isAdmin === true;
}

const OFFICE_ASSIGNMENT_EXEMPT_ROLES = new Set(["ADMIN", "CUSTOMER"]);

export function roleRequiresOfficeAssignment(
  roleName?: string | null,
  isAdmin = false,
  isManager = false,
): boolean {
  const normalizedRoleName = normalizeRoleName(roleName);

  if (isAdmin || isManager) {
    return false;
  }

  if (OFFICE_ASSIGNMENT_EXEMPT_ROLES.has(normalizedRoleName)) {
    return false;
  }

  return (
    normalizedRoleName.length > 0 &&
    !hasOfficeWideAccess(normalizedRoleName, isAdmin, isManager)
  );
}

export function getMyOfficeIds(req: AuthRequest): string[] {
  if (requestHasOfficeWideAccess(req)) {
    return [];
  }

  const officeId = getAssignedOfficeId(req);
  return officeId ? [officeId] : [];
}

export function getScopedOfficeId(
  req: AuthRequest,
  requestedOfficeId?: string | null,
): string | undefined {
  const normalizedRequestedOfficeId = normalizeId(requestedOfficeId);
  if (requestHasOfficeWideAccess(req)) {
    return normalizedRequestedOfficeId;
  }

  return getAssignedOfficeId(req);
}

export function canAccessOffice(
  req: AuthRequest,
  officeId?: string | null,
): boolean {
  const normalizedOfficeId = normalizeId(officeId);
  if (!normalizedOfficeId) {
    return false;
  }

  if (requestHasOfficeWideAccess(req)) {
    return true;
  }

  return getAssignedOfficeId(req) === normalizedOfficeId;
}

export function applyOfficeScope(
  req: AuthRequest,
  where: ScopedWhere,
  officeField = "officeId",
): ScopedWhere {
  if (requestHasOfficeWideAccess(req)) {
    return where;
  }

  const assignedOfficeId = getAssignedOfficeId(req);
  if (!assignedOfficeId) {
    return where;
  }

  where[officeField] = assignedOfficeId;
  return where;
}

export function applyTransferOfficeScope(
  req: AuthRequest,
  where: ScopedWhere,
  fromField = "fromOfficeId",
  toField = "toOfficeId",
): ScopedWhere {
  if (requestHasOfficeWideAccess(req)) {
    return where;
  }

  const assignedOfficeId = getAssignedOfficeId(req);
  if (!assignedOfficeId) {
    return where;
  }

  where.OR = [
    { [fromField]: assignedOfficeId },
    { [toField]: assignedOfficeId },
  ];

  return where;
}

async function officeExists(officeId: string): Promise<boolean> {
  const office = await prisma.office.findFirst({
    where: { id: officeId },
    select: { id: true },
  });

  return !!office;
}

export async function getDefaultOfficeId(
  preferredOfficeId?: string | null,
): Promise<string | null> {
  const normalizedPreferredOfficeId = normalizeId(preferredOfficeId);
  if (
    normalizedPreferredOfficeId &&
    (await officeExists(normalizedPreferredOfficeId))
  ) {
    return normalizedPreferredOfficeId;
  }

  const defaultOffice = await prisma.office.findFirst({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  return defaultOffice?.id ?? null;
}

type ResolveOfficeAssignmentInput = {
  actorRoleName?: string | null | undefined;
  actorIsAdmin?: boolean | undefined;
  actorIsManager?: boolean | undefined;
  actorOfficeId?: string | null | undefined;
  requestedOfficeId?: string | null | undefined;
  targetRoleName?: string | null | undefined;
};

export async function resolveStaffOfficeAssignment({
  actorRoleName,
  actorIsAdmin = false,
  actorIsManager = false,
  actorOfficeId,
  requestedOfficeId,
  targetRoleName,
}: ResolveOfficeAssignmentInput): Promise<string | null> {
  if (
    !roleRequiresOfficeAssignment(targetRoleName, actorIsAdmin, actorIsManager)
  ) {
    return null;
  }

  const normalizedRequestedOfficeId = normalizeId(requestedOfficeId);
  const normalizedActorOfficeId = normalizeId(actorOfficeId);
  const actorHasOfficeWideAccess = hasOfficeWideAccess(
    actorRoleName,
    actorIsAdmin,
    actorIsManager,
  );

  if (actorHasOfficeWideAccess) {
    if (normalizedRequestedOfficeId) {
      if (!(await officeExists(normalizedRequestedOfficeId))) {
        throw new Error("Selected office does not exist.");
      }

      return normalizedRequestedOfficeId;
    }

    const fallbackOfficeId = await getDefaultOfficeId(normalizedActorOfficeId);
    if (!fallbackOfficeId) {
      throw new Error("No office is available. Create an office first.");
    }

    return fallbackOfficeId;
  }

  if (normalizedActorOfficeId) {
    return normalizedActorOfficeId;
  }

  const fallbackOfficeId = await getDefaultOfficeId();
  if (!fallbackOfficeId) {
    throw new Error("No office is available. Create an office first.");
  }

  return fallbackOfficeId;
}

type ResolveOfficerWarehouseAssignmentInput = {
  companyId?: string | undefined;
  actorRoleName?: string | null | undefined;
  actorIsAdmin?: boolean | undefined;
  actorIsManager?: boolean | undefined;
  actorWarehouseId?: string | null | undefined;
  actorOfficeId?: string | null | undefined;
  requestedWarehouseId?: string | null | undefined;
  requestedOfficeId?: string | null | undefined;
  targetRoleName?: string | null | undefined;
};

export function getMyCompanyId(req: AuthRequest): string | undefined {
  return getMyOfficeId(req);
}

export function getAssignedWarehouseId(req: AuthRequest): string | undefined {
  return getAssignedOfficeId(req);
}

export function hasCompanyWideWarehouseAccess(
  roleName?: string | null,
  isAdmin = false,
  isManager = false,
): boolean {
  return hasOfficeWideAccess(roleName, isAdmin, isManager);
}

export function requestHasCompanyWideWarehouseAccess(
  req: AuthRequest,
): boolean {
  return requestHasOfficeWideAccess(req);
}

export function roleRequiresWarehouseAssignment(
  roleName?: string | null,
  isAdmin = false,
  isManager = false,
): boolean {
  return roleRequiresOfficeAssignment(roleName, isAdmin, isManager);
}

export function getMyCompanyWarehouses(req: AuthRequest): string[] {
  return getMyOfficeIds(req);
}

export function getScopedWarehouseId(
  req: AuthRequest,
  requestedWarehouseId?: string | null,
): string | undefined {
  return getScopedOfficeId(req, requestedWarehouseId);
}

export function canAccessWarehouse(
  req: AuthRequest,
  warehouseId?: string | null,
): boolean {
  return canAccessOffice(req, warehouseId);
}

export function applyTransferWarehouseScope(
  req: AuthRequest,
  where: ScopedWhere,
  fromField = "fromWarehouseId",
  toField = "toWarehouseId",
): ScopedWhere {
  return applyTransferOfficeScope(req, where, fromField, toField);
}

export async function getDefaultWarehouseIdForCompany(
  _companyId: string,
  preferredWarehouseId?: string | null,
): Promise<string | null> {
  return getDefaultOfficeId(preferredWarehouseId);
}

export async function resolveOfficerWarehouseAssignment({
  actorRoleName,
  actorIsAdmin = false,
  actorIsManager = false,
  actorWarehouseId,
  actorOfficeId,
  requestedWarehouseId,
  requestedOfficeId,
  targetRoleName,
}: ResolveOfficerWarehouseAssignmentInput): Promise<string | null> {
  return resolveStaffOfficeAssignment({
    actorRoleName,
    actorIsAdmin,
    actorIsManager,
    actorOfficeId: actorOfficeId ?? actorWarehouseId,
    requestedOfficeId: requestedOfficeId ?? requestedWarehouseId,
    targetRoleName,
  });
}
