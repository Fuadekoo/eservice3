/**
 * One-time maintenance: normalize every stored user phone number to the
 * canonical 2519XXXXXXXX form (see src/utils/phone.ts). Safe to re-run.
 *
 *   npx tsx prisma/normalize-phones.ts
 */
import { prisma } from "../src/lib/db.js";
import { normalizeEthiopianMobilePhone } from "../src/utils/phone.js";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, phoneNumber: true },
  });

  let updated = 0;
  let alreadyOk = 0;
  let skippedInvalid = 0;
  let skippedConflict = 0;

  for (const user of users) {
    if (!user.phoneNumber) continue;

    const normalized = normalizeEthiopianMobilePhone(user.phoneNumber);
    if (!normalized) {
      skippedInvalid += 1;
      console.warn(
        `  ! ${user.username}: cannot normalize "${user.phoneNumber}" — left as-is`,
      );
      continue;
    }

    if (normalized === user.phoneNumber) {
      alreadyOk += 1;
      continue;
    }

    // Another row may already hold the normalized value (phoneNumber is unique).
    const clash = await prisma.user.findFirst({
      where: { phoneNumber: normalized, id: { not: user.id } },
      select: { id: true, username: true },
    });
    if (clash) {
      skippedConflict += 1;
      console.warn(
        `  ! ${user.username}: "${user.phoneNumber}" -> "${normalized}" conflicts with ${clash.username}; skipped`,
      );
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { phoneNumber: normalized },
    });
    updated += 1;
    console.log(`  ✓ ${user.username}: "${user.phoneNumber}" -> "${normalized}"`);
  }

  console.log("\nDone.");
  console.log(`  updated:           ${updated}`);
  console.log(`  already canonical: ${alreadyOk}`);
  console.log(`  invalid (skipped): ${skippedInvalid}`);
  console.log(`  conflicts (skipped): ${skippedConflict}`);
}

main()
  .catch((error) => {
    console.error("normalize-phones failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
