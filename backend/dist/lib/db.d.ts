import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./prisma-client.js";
declare const prisma: PrismaClient<{
    adapter: PrismaMariaDb;
}, never, import("../../generated/prisma/runtime/client.js").DefaultArgs>;
export { prisma };
//# sourceMappingURL=db.d.ts.map