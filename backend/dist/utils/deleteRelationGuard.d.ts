import { Prisma } from "../lib/prisma-client.js";
export interface RelationUsage {
    count: number;
    label: string;
}
export declare function buildDeleteRelationMessage(entityName: string, usages: RelationUsage[]): string | null;
export declare function isForeignKeyConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError;
//# sourceMappingURL=deleteRelationGuard.d.ts.map