import { prisma } from "../src/lib/db.ts";
import bcrypt from "bcryptjs";
import { assignDefaultPermissionsToRole } from "./role-permissions-assignment.ts";

async function main() {
  console.log("🌱 Starting East Shoa E-Service seed...");

  // 1. Create the Primary Office
  const office = await prisma.office.upsert({
    where: { id: "east-shoa-office-id" },
    update: {},
    create: {
      id: "east-shoa-office-id",
      name: "East Shoa E-Service Office",
      roomNumber: "A-204",
      address: "Adama, East Shoa, Ethiopia",
      subdomain: "eastshoa",
      phoneNumber: "+251911223344",
      slogan: "Excellence in Public Service",
    },
  });
  console.log(`🏢 Office created: ${office.name}`);

  // 2. Define and Create Roles for this Office
  const rolesToCreate = [
    { name: "ADMIN", isGlobal: true },
    { name: "MANAGER", isGlobal: false },
    { name: "STAFF", isGlobal: false },
    { name: "CUSTOMER", isGlobal: true },
  ];

  const roleMap: Record<string, string> = {};

  for (const roleData of rolesToCreate) {
    const roleId = roleData.isGlobal
      ? `role-global-${roleData.name.toLowerCase()}`
      : `role-${office.id}-${roleData.name.toLowerCase()}`;

    const role = await prisma.role.upsert({
      where: { id: roleId },
      update: { name: roleData.name },
      create: {
        id: roleId,
        name: roleData.name,
        officeId: roleData.isGlobal ? null : office.id,
      },
    });

    roleMap[roleData.name] = role.id;
    console.log(
      `🎭 Role created: ${role.name} (${roleData.isGlobal ? "Global" : "Office-specific"})`,
    );

    // Assign Permissions (Always re-run to update with new permissions like audit:read)
    const result = await assignDefaultPermissionsToRole(role.id, role.name);
    if (result.success) {
      console.log(`✅ Permissions updated for ${role.name}`);
    }
  }

  // 3. Create Users and Assign to Office
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = [
    {
      username: "admin_user",
      name: "System Administrator",
      phoneNumber: "0900000000",
      role: "ADMIN",
      isStaff: false,
    },
    {
      username: "office_manager",
      name: "Office Manager",
      phoneNumber: "0911111111",
      role: "MANAGER",
      isStaff: true,
    },
    {
      username: "office_staff",
      name: "Office Staff",
      phoneNumber: "0922222222",
      role: "STAFF",
      isStaff: true,
    },
    {
      username: "test_customer",
      name: "Test Customer",
      phoneNumber: "0933333333",
      role: "CUSTOMER",
      isStaff: false,
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        name: u.name,
        roleId: roleMap[u.role],
        password: passwordHash,
      },
      create: {
        username: u.username,
        name: u.name,
        phoneNumber: u.phoneNumber,
        password: passwordHash,
        roleId: roleMap[u.role],
      },
    });

    console.log(`👤 User created: ${user.username} as ${u.role}`);

    // If staff or manager, create the staff record and link to office
    if (u.isStaff) {
      const staffRecord = await prisma.staff.upsert({
        where: { id: `staff-${user.id}` },
        update: { officeId: office.id },
        create: {
          id: `staff-${user.id}`,
          userId: user.id,
          officeId: office.id,
        },
      });
      console.log(
        `� ${u.username} assigned to office: ${office.name} as staff record`,
      );
    }
  }

  // 4. Create a Sample Service for the Office
  const service = await prisma.service.upsert({
    where: { id: "sample-service-id" },
    update: {},
    create: {
      id: "sample-service-id",
      name: "Document Verification",
      description: "Official verification of educational and legal documents.",
      timeToTake: "2-3 business days",
      officeId: office.id,
    },
  });
  console.log(`🛠️ Sample service created: ${service.name} for ${office.name}`);

  // 5. Create Sample Administration Data
  const adminSection = await prisma.administration.upsert({
    where: { id: "sample-admin-id" },
    update: {},
    create: {
      id: "sample-admin-id",
      name: "Ababu Waqoo",
      description: "Welcome and thank you for visiting our pages. Welcome to East Shoa Services.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ababu", // Placeholder image
    },
  });
  console.log(`👨‍💼 Administration created: ${adminSection.name}`);

  // 6. Create Sample Gallery Data
  const gallery = await prisma.gallery.upsert({
    where: { id: "sample-gallery-id" },
    update: {},
    create: {
      id: "sample-gallery-id",
      name: "East Shoa Zone Overview",
      description: "Pictures from across the East Shoa Zone.",
    },
  });

  const galleryImages = [
    { id: "img-1", filename: "east-shoa-1.jpg", order: 1 },
    { id: "img-2", filename: "east-shoa-2.jpg", order: 2 },
  ];

  for (const img of galleryImages) {
    await prisma.galleryImage.upsert({
      where: { id: img.id },
      update: {},
      create: {
        id: img.id,
        galleryId: gallery.id,
        filename: img.filename,
        order: img.order,
      },
    });
  }
  console.log(`🖼️ Gallery and images created: ${gallery.name}`);

  console.log("\n🎉 Seed process completed! You now have:");
  console.log(`- 1 Office: ${office.name}`);
  console.log("- 1 Admin, 1 Manager, 1 Staff, 1 Customer");
  console.log(
    "- Manager and Staff are correctly linked to the Office via staff records.",
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
