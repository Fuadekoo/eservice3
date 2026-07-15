import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Prisma } from "../src/lib/prisma-client.ts";
import { prisma } from "../src/lib/db.ts";

/**
 * Seeds the real East Shoa dataset exported from the live database.
 *
 * The rows live in seed-data.json rather than inline here: there are ~2,000 of
 * them, and keeping them as data means re-exporting is a regeneration rather
 * than a rewrite of this file.
 *
 * Runtime tables (session, otp, audit_log) and transactional ones (request,
 * requestForOther, appointment, customerSatisfaction, fileData) are
 * deliberately excluded — the application writes those itself, and seeding them
 * would fabricate login sessions, live OTP codes and audit history.
 */

type Row = Record<string, unknown>;

type SeedData = {
  permission: Row[];
  office: Row[];
  role: Row[];
  rolePermission: Row[];
  user: Row[];
  staff: Row[];
  officeAvailability: Row[];
  service: Row[];
  requirement: Row[];
  serviceFor: Row[];
  serviceStaffAssignment: Row[];
  gallery: Row[];
  galleryImage: Row[];
  administration: Row[];
  report: Row[];
};

const here = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  readFileSync(path.join(here, "seed-data.json"), "utf8"),
) as SeedData;

/** ISO string -> Date. Every timestamp in seed-data.json is already ISO/UTC. */
const d = (v: unknown): Date => new Date(v as string);

/**
 * Upserts are issued in batches inside a transaction: one round trip per row
 * would make a 2,000-row seed needlessly slow, and upsert keeps it re-runnable.
 */
const CHUNK = 100;

async function seed<T>(
  label: string,
  rows: T[],
  toOp: (row: T) => Prisma.PrismaPromise<unknown>,
): Promise<void> {
  if (rows.length === 0) {
    console.log(`   ${label}: nothing to seed`);
    return;
  }
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.$transaction(rows.slice(i, i + CHUNK).map(toOp));
  }
  console.log(`   ${label}: ${rows.length}`);
}

async function main() {
  console.log("🌱 Seeding East Shoa E-Service data...\n");

  // Order below follows foreign keys: a row is only written once everything it
  // points at already exists.

  await seed("permissions", data.permission, (r: any) =>
    prisma.permission.upsert({
      where: { id: r.id },
      update: { name: r.name },
      create: {
        id: r.id,
        name: r.name,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("offices", data.office, (r: any) =>
    prisma.office.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        phoneNumber: r.phoneNumber,
        roomNumber: r.roomNumber,
        address: r.address,
        subdomain: r.subdomain,
        logo: r.logo,
        slogan: r.slogan,
        settings: r.settings,
        status: r.status,
      },
      create: {
        id: r.id,
        name: r.name,
        phoneNumber: r.phoneNumber,
        roomNumber: r.roomNumber,
        address: r.address,
        subdomain: r.subdomain,
        logo: r.logo,
        slogan: r.slogan,
        settings: r.settings,
        status: r.status,
        startedAt: d(r.startedAt),
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("roles", data.role, (r: any) =>
    prisma.role.upsert({
      where: { id: r.id },
      update: { name: r.name, officeId: r.officeId },
      create: {
        id: r.id,
        name: r.name,
        officeId: r.officeId,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("role permissions", data.rolePermission, (r: any) =>
    prisma.rolePermission.upsert({
      // Keyed on the pair, not the id: the unique constraint is what a re-run
      // would otherwise collide with.
      where: { roleId_permissionId: { roleId: r.roleId, permissionId: r.permissionId } },
      update: {},
      create: {
        id: r.id,
        roleId: r.roleId,
        permissionId: r.permissionId,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("users", data.user, (r: any) =>
    prisma.user.upsert({
      where: { id: r.id },
      update: {
        username: r.username,
        phoneNumber: r.phoneNumber,
        password: r.password,
        roleId: r.roleId,
        isActive: r.isActive,
        phoneVerified: r.phoneVerified,
      },
      create: {
        id: r.id,
        username: r.username,
        phoneNumber: r.phoneNumber,
        password: r.password,
        roleId: r.roleId,
        isActive: r.isActive,
        phoneVerified: r.phoneVerified,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("staff", data.staff, (r: any) =>
    prisma.staff.upsert({
      where: { id: r.id },
      update: { userId: r.userId, officeId: r.officeId },
      create: {
        id: r.id,
        userId: r.userId,
        officeId: r.officeId,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("office availability", data.officeAvailability, (r: any) =>
    prisma.officeAvailability.upsert({
      where: { id: r.id },
      update: {
        officeId: r.officeId,
        defaultSchedule: r.defaultSchedule,
        slotDuration: r.slotDuration,
        unavailableDateRanges: r.unavailableDateRanges,
        unavailableDates: r.unavailableDates,
        dateOverrides: r.dateOverrides,
      },
      create: {
        id: r.id,
        officeId: r.officeId,
        defaultSchedule: r.defaultSchedule,
        slotDuration: r.slotDuration,
        unavailableDateRanges: r.unavailableDateRanges,
        unavailableDates: r.unavailableDates,
        dateOverrides: r.dateOverrides,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("services", data.service, (r: any) =>
    prisma.service.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        description: r.description,
        timeToTake: r.timeToTake,
        roomNumber: r.roomNumber,
        officeId: r.officeId,
      },
      create: {
        id: r.id,
        name: r.name,
        description: r.description,
        timeToTake: r.timeToTake,
        roomNumber: r.roomNumber,
        officeId: r.officeId,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("requirements", data.requirement, (r: any) =>
    prisma.requirement.upsert({
      where: { id: r.id },
      update: { name: r.name, description: r.description, serviceId: r.serviceId },
      create: {
        id: r.id,
        name: r.name,
        description: r.description,
        serviceId: r.serviceId,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("service audiences", data.serviceFor, (r: any) =>
    prisma.serviceFor.upsert({
      where: { id: r.id },
      update: { name: r.name, description: r.description, serviceId: r.serviceId },
      create: {
        id: r.id,
        name: r.name,
        description: r.description,
        serviceId: r.serviceId,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("service-staff assignments", data.serviceStaffAssignment, (r: any) =>
    prisma.serviceStaffAssignment.upsert({
      where: { serviceId_staffId: { serviceId: r.serviceId, staffId: r.staffId } },
      update: {},
      create: {
        id: r.id,
        serviceId: r.serviceId,
        staffId: r.staffId,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("galleries", data.gallery, (r: any) =>
    prisma.gallery.upsert({
      where: { id: r.id },
      update: { name: r.name, description: r.description },
      create: {
        id: r.id,
        name: r.name,
        description: r.description,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("gallery images", data.galleryImage, (r: any) =>
    prisma.galleryImage.upsert({
      where: { id: r.id },
      update: { galleryId: r.galleryId, filename: r.filename, order: r.order },
      create: {
        id: r.id,
        galleryId: r.galleryId,
        filename: r.filename,
        order: r.order,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("administration", data.administration, (r: any) =>
    prisma.administration.upsert({
      where: { id: r.id },
      update: { name: r.name, description: r.description, image: r.image },
      create: {
        id: r.id,
        name: r.name,
        description: r.description,
        image: r.image,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  await seed("reports", data.report, (r: any) =>
    prisma.report.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        description: r.description,
        reportSentTo: r.reportSentTo,
        reportSentBy: r.reportSentBy,
        receiverStatus: r.receiverStatus,
      },
      create: {
        id: r.id,
        name: r.name,
        description: r.description,
        reportSentTo: r.reportSentTo,
        reportSentBy: r.reportSentBy,
        receiverStatus: r.receiverStatus,
        createdAt: d(r.createdAt),
        updatedAt: d(r.updatedAt),
      },
    }),
  );

  const total = Object.values(data).reduce((n, rows) => n + rows.length, 0);
  console.log(`\n🎉 Seed complete — ${total} rows across ${Object.keys(data).length} tables.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
