import { Prisma } from "../lib/prisma-client.js";

export interface RelationUsage {
  count: number;
  label: string;
}

function formatUsage({ count, label }: RelationUsage) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

export function buildDeleteRelationMessage(
  entityName: string,
  usages: RelationUsage[],
) {
  const activeUsages = usages.filter((usage) => usage.count > 0);
  if (activeUsages.length === 0) {
    return null;
  }

  const usageSummary = activeUsages.map(formatUsage).join(" and ");
  return `Cannot delete this ${entityName} because it is linked to ${usageSummary}. Remove or reassign those records first.`;
}

export function isForeignKeyConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}
