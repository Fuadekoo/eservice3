import { prisma } from "../src/lib/db.ts";

/**
 * Backfills the denormalised `officeId` on `request`, `request_for_other` and
 * `appointment`.
 *
 * Those columns were added after the tables were already in use and no write
 * path populated them, so every historical row carries NULL. Anything that
 * counted or filtered by the office relation therefore reported zero. The
 * owning office is unambiguous — a request points at a service, and a service
 * belongs to exactly one office — so the values can be derived rather than
 * guessed.
 *
 * Safe to re-run: each statement only touches rows whose `officeId` is still
 * NULL or has drifted away from the service's office.
 *
 *   npm run backfill:office-ids
 */
async function main(): Promise<void> {
  const requests = await prisma.$executeRaw`
    UPDATE \`request\` \`r\`
    JOIN \`service\` \`s\` ON \`s\`.\`id\` = \`r\`.\`serviceId\`
    SET \`r\`.\`officeId\` = \`s\`.\`officeId\`
    WHERE \`r\`.\`officeId\` IS NULL OR \`r\`.\`officeId\` <> \`s\`.\`officeId\`
  `;
  console.log(`request:           ${requests} row(s) updated`);

  const requestsForOther = await prisma.$executeRaw`
    UPDATE \`request_for_other\` \`r\`
    JOIN \`service\` \`s\` ON \`s\`.\`id\` = \`r\`.\`serviceId\`
    SET \`r\`.\`officeId\` = \`s\`.\`officeId\`
    WHERE \`r\`.\`officeId\` IS NULL OR \`r\`.\`officeId\` <> \`s\`.\`officeId\`
  `;
  console.log(`request_for_other: ${requestsForOther} row(s) updated`);

  const appointments = await prisma.$executeRaw`
    UPDATE \`appointment\` \`a\`
    JOIN \`request\` \`r\` ON \`r\`.\`id\` = \`a\`.\`requestId\`
    JOIN \`service\` \`s\` ON \`s\`.\`id\` = \`r\`.\`serviceId\`
    SET \`a\`.\`officeId\` = \`s\`.\`officeId\`
    WHERE \`a\`.\`officeId\` IS NULL OR \`a\`.\`officeId\` <> \`s\`.\`officeId\`
  `;
  console.log(`appointment:       ${appointments} row(s) updated`);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
