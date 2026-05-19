import { prisma } from "../lib/db.js";
const OFFICE_WIDE_ACCESS_ROLES = new Set([
    "SUPERADMIN",
    "ADMIN",
    "MANAGER",
    "COMPANYR",
]);
function normalizeId(value) {
    const normalizedValue = value?.trim();
    return normalizedValue || undefined;
}
function getRequestStaff(req) {
    return req.user?.staff;
}
function getRequestOfficer(req) {
    return req.user?.officer;
}
export function normalizeRoleName(roleName) {
    return roleName?.trim().toUpperCase() ?? "";
}
export function getMyOfficeId(req) {
    const authRequest = req;
    return (normalizeId(getRequestStaff(authRequest)?.officeId) ??
        normalizeId(getRequestOfficer(authRequest)?.companyId));
}
export function getAssignedOfficeId(req) {
    const authRequest = req;
    return (normalizeId(getRequestStaff(authRequest)?.officeId) ??
        normalizeId(getRequestOfficer(authRequest)?.warehouseId) ??
        getMyOfficeId(req));
}
export function hasOfficeWideAccess(roleName, isSuperAdmin = false, isManager = false) {
    return (isSuperAdmin ||
        isManager ||
        OFFICE_WIDE_ACCESS_ROLES.has(normalizeRoleName(roleName)));
}
export function requestHasOfficeWideAccess(req) {
    const authRequest = req;
    const roleName = getRequestStaff(authRequest)?.role?.name ??
        getRequestOfficer(authRequest)?.role?.name;
    return hasOfficeWideAccess(roleName, req.isSuperAdmin === true, req.isManager === true);
}
export function roleRequiresOfficeAssignment(roleName, isSuperAdmin = false, isManager = false) {
    const normalizedRoleName = normalizeRoleName(roleName);
    return (normalizedRoleName.length > 0 &&
        !hasOfficeWideAccess(normalizedRoleName, isSuperAdmin, isManager));
}
export function getMyOfficeIds(req) {
    if (requestHasOfficeWideAccess(req)) {
        return [];
    }
    const officeId = getAssignedOfficeId(req);
    return officeId ? [officeId] : [];
}
export function getScopedOfficeId(req, requestedOfficeId) {
    const normalizedRequestedOfficeId = normalizeId(requestedOfficeId);
    if (requestHasOfficeWideAccess(req)) {
        return normalizedRequestedOfficeId;
    }
    return getAssignedOfficeId(req);
}
export function canAccessOffice(req, officeId) {
    const normalizedOfficeId = normalizeId(officeId);
    if (!normalizedOfficeId) {
        return false;
    }
    if (requestHasOfficeWideAccess(req)) {
        return true;
    }
    return getAssignedOfficeId(req) === normalizedOfficeId;
}
export function applyOfficeScope(req, where, officeField = "officeId") {
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
export function applyTransferOfficeScope(req, where, fromField = "fromOfficeId", toField = "toOfficeId") {
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
async function officeExists(officeId) {
    const office = await prisma.office.findFirst({
        where: { id: officeId },
        select: { id: true },
    });
    return !!office;
}
export async function getDefaultOfficeId(preferredOfficeId) {
    const normalizedPreferredOfficeId = normalizeId(preferredOfficeId);
    if (normalizedPreferredOfficeId &&
        (await officeExists(normalizedPreferredOfficeId))) {
        return normalizedPreferredOfficeId;
    }
    const defaultOffice = await prisma.office.findFirst({
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true },
    });
    return defaultOffice?.id ?? null;
}
export async function resolveStaffOfficeAssignment({ actorRoleName, actorIsSuperAdmin = false, actorIsManager = false, actorOfficeId, requestedOfficeId, targetRoleName, }) {
    if (!roleRequiresOfficeAssignment(targetRoleName, actorIsSuperAdmin, actorIsManager)) {
        return null;
    }
    const normalizedRequestedOfficeId = normalizeId(requestedOfficeId);
    const normalizedActorOfficeId = normalizeId(actorOfficeId);
    const actorHasOfficeWideAccess = hasOfficeWideAccess(actorRoleName, actorIsSuperAdmin, actorIsManager);
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
export function getMyCompanyId(req) {
    return getMyOfficeId(req);
}
export function getAssignedWarehouseId(req) {
    return getAssignedOfficeId(req);
}
export function hasCompanyWideWarehouseAccess(roleName, isSuperAdmin = false, isManager = false) {
    return hasOfficeWideAccess(roleName, isSuperAdmin, isManager);
}
export function requestHasCompanyWideWarehouseAccess(req) {
    return requestHasOfficeWideAccess(req);
}
export function roleRequiresWarehouseAssignment(roleName, isSuperAdmin = false, isManager = false) {
    return roleRequiresOfficeAssignment(roleName, isSuperAdmin, isManager);
}
export function getMyCompanyWarehouses(req) {
    return getMyOfficeIds(req);
}
export function getScopedWarehouseId(req, requestedWarehouseId) {
    return getScopedOfficeId(req, requestedWarehouseId);
}
export function canAccessWarehouse(req, warehouseId) {
    return canAccessOffice(req, warehouseId);
}
export function applyTransferWarehouseScope(req, where, fromField = "fromWarehouseId", toField = "toWarehouseId") {
    return applyTransferOfficeScope(req, where, fromField, toField);
}
export async function getDefaultWarehouseIdForCompany(_companyId, preferredWarehouseId) {
    return getDefaultOfficeId(preferredWarehouseId);
}
export async function resolveOfficerWarehouseAssignment({ actorRoleName, actorIsSuperAdmin = false, actorIsManager = false, actorWarehouseId, actorOfficeId, requestedWarehouseId, requestedOfficeId, targetRoleName, }) {
    return resolveStaffOfficeAssignment({
        actorRoleName,
        actorIsSuperAdmin,
        actorIsManager,
        actorOfficeId: actorOfficeId ?? actorWarehouseId,
        requestedOfficeId: requestedOfficeId ?? requestedWarehouseId,
        targetRoleName,
    });
}
//# sourceMappingURL=myOffice.js.map