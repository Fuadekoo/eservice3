import { Prisma } from "../lib/prisma-client.js";
function formatUsage({ count, label }) {
    return `${count} ${label}${count === 1 ? "" : "s"}`;
}
export function buildDeleteRelationMessage(entityName, usages) {
    const activeUsages = usages.filter((usage) => usage.count > 0);
    if (activeUsages.length === 0) {
        return null;
    }
    const usageSummary = activeUsages.map(formatUsage).join(" and ");
    return `Cannot delete this ${entityName} because it is linked to ${usageSummary}. Remove or reassign those records first.`;
}
export function isForeignKeyConstraintError(error) {
    return (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003");
}
//# sourceMappingURL=deleteRelationGuard.js.map