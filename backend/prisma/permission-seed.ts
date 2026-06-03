import { prisma } from "../src/lib/db.ts";

/**
 * Permission Seed
 *
 * This script creates all permissions for the eservice system.
 * Permissions follow the pattern: resource:action
 *
 * Resources:
 * - user: User management
 * - office: Office management
 * - service: Service management
 * - request: Service request management
 * - appointment: Appointment management
 * - staff: Staff management
 * - report: Report management
 * - gallery: Gallery management
 * - role: Role and permission management
 * - language: Language/translation management
 * - about: About page management
 * - administration: Administration page management
 * - feedback: Feedback/customer satisfaction management
 * - file: File upload/download management
 * - dashboard: Dashboard overview access
 * - configuration: System configuration
 */

async function main() {
  console.log("🌱 Starting permission seed...");
  console.log(
    "ℹ️  This script will create all permissions for the eservice system.\n",
  );

  // Check if database tables exist first
  try {
    await prisma.$queryRaw`SELECT 1 FROM permission LIMIT 1`;
  } catch (error: any) {
    if (error.code === "P2021" || error.code === "42S02") {
      console.error("\n❌ ERROR: Database tables don't exist yet!");
      console.error("📋 Please run database migrations first:\n");
      console.error("   npx prisma migrate dev");
      console.error("\n   OR\n");
      console.error("   npx prisma db push\n");
      throw new Error(
        "Database tables don't exist. Please run migrations first: npx prisma migrate dev",
      );
    }
    throw error;
  }

  // Define all permissions
  const permissions = [
    // --- System & User Management ---
    { name: "user:create", description: "Create new users" },
    { name: "user:read", description: "View users" },
    { name: "user:update", description: "Update user information" },
    { name: "user:delete", description: "Delete users" },
    { name: "user:manage", description: "Full user management" },

    // --- Office Management ---
    { name: "office:create", description: "Create new offices" },
    { name: "office:read", description: "View offices" },
    { name: "office:update", description: "Update office information" },
    { name: "office:delete", description: "Delete offices" },
    { name: "office:manage", description: "Full office management" },
    { name: "office:configure", description: "Configure office settings" },

    // --- Service Management ---
    { name: "service:create", description: "Create new services" },
    { name: "service:read", description: "View services" },
    { name: "service:update", description: "Update service information" },
    { name: "service:delete", description: "Delete services" },
    { name: "service:manage", description: "Full service management" },
    { name: "service:assign-staff", description: "Assign staff to services" },

    // --- Request Management ---
    { name: "request:create", description: "Create service requests" },
    { name: "request:read", description: "View service requests" },
    { name: "request:update", description: "Update service requests" },
    { name: "request:delete", description: "Delete service requests" },
    { name: "request:approve-staff", description: "Approve requests (Staff)" },
    {
      name: "request:approve-manager",
      description: "Approve requests (Manager)",
    },
    { name: "request:approve-admin", description: "Approve requests (Admin)" },
    { name: "request:view-all", description: "View all requests" },

    // --- Appointment Management ---
    { name: "appointment:create", description: "Create appointments" },
    { name: "appointment:read", description: "View appointments" },
    { name: "appointment:update", description: "Update appointments" },
    { name: "appointment:delete", description: "Delete appointments" },
    { name: "appointment:approve", description: "Approve appointments" },
    { name: "appointment:manage", description: "Full appointment management" },

    // --- Staff Management ---
    { name: "staff:create", description: "Create staff members" },
    { name: "staff:read", description: "View staff members" },
    { name: "staff:update", description: "Update staff information" },
    { name: "staff:delete", description: "Delete staff members" },
    { name: "staff:manage", description: "Full staff management" },

    // --- Report Management ---
    { name: "report:create", description: "Create reports" },
    { name: "report:read", description: "View reports" },
    { name: "report:update", description: "Update reports" },
    { name: "report:delete", description: "Delete reports" },
    { name: "report:view-all", description: "View all reports" },

    // --- Role & Permission Management ---
    { name: "role:create", description: "Create roles" },
    { name: "role:read", description: "View roles" },
    { name: "role:update", description: "Update roles" },
    { name: "role:delete", description: "Delete roles" },
    {
      name: "role:assign-permissions",
      description: "Assign permissions to roles",
    },
    { name: "role:manage", description: "Full role management" },
    { name: "permission:read", description: "View permissions" },

    // --- Language & Configuration ---
    { name: "language:read", description: "View languages" },
    { name: "language:update", description: "Update translations" },
    { name: "language:manage", description: "Full language management" },
    { name: "configuration:read", description: "View system config" },
    { name: "configuration:update", description: "Update system config" },

    // --- Profile & Feedback ---
    { name: "profile:read", description: "View own profile" },
    { name: "profile:update", description: "Update own profile" },
    { name: "profile:change-password", description: "Change password" },
    { name: "feedback:read", description: "View feedback" },
    { name: "feedback:create", description: "Submit feedback" },

    // --- Dashboard Access ---
    { name: "dashboard:view", description: "General dashboard access" },
    { name: "dashboard:admin", description: "Admin dashboard access" },
    { name: "dashboard:manager", description: "Manager dashboard access" },
    { name: "dashboard:staff", description: "Staff dashboard access" },
    { name: "dashboard:customer", description: "Customer dashboard access" },

    // --- Page Access ---
    { name: "page:admin:overview", description: "Admin overview page" },
    { name: "page:admin:office", description: "Admin office page" },
    { name: "page:manager:overview", description: "Manager overview page" },
    { name: "page:manager:staff", description: "Manager staff page" },
    { name: "page:staff:overview", description: "Staff overview page" },
    { name: "page:customer:overview", description: "Customer overview page" },
    { name: "audit:read", description: "View audit logs" },
  ];

  console.log(`📝 Creating ${permissions.length} permissions...\n`);

  // Create permissions using upsert to avoid duplicates
  const createdPermissions = [];
  const skippedPermissions = [];

  for (const permission of permissions) {
    try {
      const existing = await prisma.permission.findFirst({
        where: { name: permission.name },
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${permission.name} (already exists)`);
        skippedPermissions.push(permission.name);
        createdPermissions.push(existing);
      } else {
        const newPermission = await prisma.permission.create({
          data: {
            name: permission.name,
          },
        });
        console.log(
          `✅ Created: ${permission.name} - ${permission.description}`,
        );
        createdPermissions.push(newPermission);
      }
    } catch (error: any) {
      console.error(
        `❌ Error creating permission ${permission.name}:`,
        error.message,
      );
      throw error;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(
    `   ✅ Created: ${
      createdPermissions.length - skippedPermissions.length
    } permissions`,
  );
  console.log(
    `   ⏭️  Skipped: ${skippedPermissions.length} permissions (already exist)`,
  );
  console.log(
    `   📦 Total: ${createdPermissions.length} permissions in database\n`,
  );

  console.log("🎉 Permission seed completed successfully!");
  console.log("\n💡 Next steps:");
  console.log(
    "   1. Assign permissions to roles using the role management interface",
  );
  console.log(
    "   2. Or use the API endpoints to assign permissions programmatically",
  );
}

main()
  .catch((e) => {
    console.error("❌ Permission seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
