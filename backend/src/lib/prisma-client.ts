// Prisma generates its client outside `src`, so we re-export it from inside the
// app source tree and keep the rest of the codebase within the TypeScript root.
// @ts-ignore -- runtime module exists at this path after `prisma generate`.
export { PrismaClient, Prisma } from "../../generated/prisma/client.js";
