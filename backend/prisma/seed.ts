import { hash } from "bcryptjs";
import type { Prisma } from "../src/lib/prisma-client.ts";
import { prisma } from "../src/lib/db.ts";

/**
 * Seeds the real East Shoa dataset (previously exported to seed-data.json,
 * now embedded directly in this file as a typed constant).
 *
 * Passwords: the exported rows carried per-user bcrypt hashes from the live
 * database. Those are intentionally discarded here — every seeded user is given
 * the shared development password below, hashed with bcrypt at seed time, so the
 * database still stores an encrypted value (never plaintext).
 *
 * Runtime tables (session, otp, audit_log) and transactional ones (request,
 * requestForOther, appointment, customerSatisfaction, fileData) are
 * deliberately excluded — the application writes those itself, and seeding them
 * would fabricate login sessions, live OTP codes and audit history.
 */

/** Plain development password. Login with this; the DB stores its bcrypt hash. */
const SEED_PASSWORD = "password123";

/**
 * The shared password, bcrypt-hashed once at module load. Every user row below
 * references this directly, so the seed data never carries a plaintext value or
 * a stale per-user hash — the database always stores this single encrypted hash.
 */
const hashedPassword = await hash(SEED_PASSWORD, 10);

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

const data: SeedData = {
  "permission": [
    {
      "id": "cmjh76umb0000jsie46o4uy33",
      "code": "user:create",
      "name": "Create User",
      "description": "Create user information"
    },
    {
      "id": "cmjh76umx0001jsieq3hfgly9",
      "code": "user:read",
      "name": "View User",
      "description": "View user information"
    },
    {
      "id": "cmjh76un90002jsie9feum0rl",
      "code": "user:update",
      "name": "Update User",
      "description": "Update user information"
    },
    {
      "id": "cmjh76unh0003jsiejp3wzolw",
      "code": "user:delete",
      "name": "Delete User",
      "description": "Delete user information"
    },
    {
      "id": "cmjh76unr0004jsiep9cmqkz2",
      "code": "user:manage",
      "name": "Manage User",
      "description": "Manage user information"
    },
    {
      "id": "cmjh76uny0005jsiewwvpv2lp",
      "code": "office:create",
      "name": "Create Office",
      "description": "Create office information"
    },
    {
      "id": "cmjh76uo70006jsielypypd0n",
      "code": "office:read",
      "name": "View Office",
      "description": "View office information"
    },
    {
      "id": "cmjh76uop0007jsiein1j2wwt",
      "code": "office:update",
      "name": "Update Office",
      "description": "Update office information"
    },
    {
      "id": "cmjh76uoz0008jsieog1j2xv7",
      "code": "office:delete",
      "name": "Delete Office",
      "description": "Delete office information"
    },
    {
      "id": "cmjh76up40009jsiege1qrl1s",
      "code": "office:manage",
      "name": "Manage Office",
      "description": "Manage office information"
    },
    {
      "id": "cmjh76upb000ajsie3hcogxvy",
      "code": "office:configure",
      "name": "Configure Office",
      "description": "Configure office information"
    },
    {
      "id": "cmjh76uph000bjsierv1hjnj6",
      "code": "service:create",
      "name": "Create Service",
      "description": "Create service information"
    },
    {
      "id": "cmjh76upn000cjsiekiwoxn4s",
      "code": "service:read",
      "name": "View Service",
      "description": "View service information"
    },
    {
      "id": "cmjh76upv000djsieaoqlvlx4",
      "code": "service:update",
      "name": "Update Service",
      "description": "Update service information"
    },
    {
      "id": "cmjh76uq3000ejsieh5md11h1",
      "code": "service:delete",
      "name": "Delete Service",
      "description": "Delete service information"
    },
    {
      "id": "cmjh76uq9000fjsieyqei6yxk",
      "code": "service:manage",
      "name": "Manage Service",
      "description": "Manage service information"
    },
    {
      "id": "cmjh76uqd000gjsie3ouwn84p",
      "code": "service:assign-staff",
      "name": "Assign Staff Service",
      "description": "Assign Staff service information"
    },
    {
      "id": "cmjh76uqk000hjsiezw0qnwsj",
      "code": "request:create",
      "name": "Create Request",
      "description": "Create request information"
    },
    {
      "id": "cmjh76uqp000ijsie8wx2b03q",
      "code": "request:read",
      "name": "View Request",
      "description": "View request information"
    },
    {
      "id": "cmjh76uqv000jjsied22vb9h1",
      "code": "request:update",
      "name": "Update Request",
      "description": "Update request information"
    },
    {
      "id": "cmjh76ur2000kjsieofld4ais",
      "code": "request:delete",
      "name": "Delete Request",
      "description": "Delete request information"
    },
    {
      "id": "cmjh76ur7000ljsie0ujofyyf",
      "code": "request:approve-staff",
      "name": "Approve Staff Request",
      "description": "Approve Staff request information"
    },
    {
      "id": "cmjh76urc000mjsievcb2o1q3",
      "code": "request:approve-manager",
      "name": "Approve Manager Request",
      "description": "Approve Manager request information"
    },
    {
      "id": "cmjh76urg000njsieub4ojasn",
      "code": "request:approve-admin",
      "name": "Approve Admin Request",
      "description": "Approve Admin request information"
    },
    {
      "id": "cmjh76urm000ojsie9i6uens7",
      "code": "request:view-all",
      "name": "View All Request",
      "description": "View All request information"
    },
    {
      "id": "cmjh76urp000pjsiep27rrydb",
      "code": "appointment:create",
      "name": "Create Appointment",
      "description": "Create appointment information"
    },
    {
      "id": "cmjh76urv000qjsiefmyzpdgg",
      "code": "appointment:read",
      "name": "View Appointment",
      "description": "View appointment information"
    },
    {
      "id": "cmjh76urz000rjsiec5lspjuf",
      "code": "appointment:update",
      "name": "Update Appointment",
      "description": "Update appointment information"
    },
    {
      "id": "cmjh76us2000sjsieebjpoaq5",
      "code": "appointment:delete",
      "name": "Delete Appointment",
      "description": "Delete appointment information"
    },
    {
      "id": "cmjh76us7000tjsie7lv4oixt",
      "code": "appointment:approve",
      "name": "Approve Appointment",
      "description": "Approve appointment information"
    },
    {
      "id": "cmjh76usd000ujsieo2c8qbsr",
      "code": "appointment:manage",
      "name": "Manage Appointment",
      "description": "Manage appointment information"
    },
    {
      "id": "cmjh76usi000vjsiela3z5gwx",
      "code": "staff:create",
      "name": "Create Staff",
      "description": "Create staff information"
    },
    {
      "id": "cmjh76uso000wjsie8xwxyyhl",
      "code": "staff:read",
      "name": "View Staff",
      "description": "View staff information"
    },
    {
      "id": "cmjh76uss000xjsieg5s09qqw",
      "code": "staff:update",
      "name": "Update Staff",
      "description": "Update staff information"
    },
    {
      "id": "cmjh76usx000yjsiel76mrf3q",
      "code": "staff:delete",
      "name": "Delete Staff",
      "description": "Delete staff information"
    },
    {
      "id": "cmjh76ut3000zjsiengrs0fey",
      "code": "staff:assign-office",
      "name": "Assign Office Staff",
      "description": "Assign Office staff information"
    },
    {
      "id": "cmjh76ut80010jsieuzo2odgg",
      "code": "staff:manage",
      "name": "Manage Staff",
      "description": "Manage staff information"
    },
    {
      "id": "cmjh76utd0011jsiez69hjwsl",
      "code": "report:create",
      "name": "Create Report",
      "description": "Create report information"
    },
    {
      "id": "cmjh76utj0012jsieci4b8fss",
      "code": "report:read",
      "name": "View Report",
      "description": "View report information"
    },
    {
      "id": "cmjh76utr0013jsie0u7qojwf",
      "code": "report:update",
      "name": "Update Report",
      "description": "Update report information"
    },
    {
      "id": "cmjh76utw0014jsiexni8sl3a",
      "code": "report:delete",
      "name": "Delete Report",
      "description": "Delete report information"
    },
    {
      "id": "cmjh76uu30015jsiefwllun1i",
      "code": "report:send",
      "name": "Send Report",
      "description": "Send report information"
    },
    {
      "id": "cmjh76uu80016jsie2fjowpyk",
      "code": "report:approve",
      "name": "Approve Report",
      "description": "Approve report information"
    },
    {
      "id": "cmjh76uud0017jsiei0tsk16c",
      "code": "report:view-all",
      "name": "View All Report",
      "description": "View All report information"
    },
    {
      "id": "cmjh76uug0018jsieh4jpx8gj",
      "code": "gallery:create",
      "name": "Create Gallery",
      "description": "Create gallery information"
    },
    {
      "id": "cmjh76uum0019jsiep0ould0o",
      "code": "gallery:read",
      "name": "View Gallery",
      "description": "View gallery information"
    },
    {
      "id": "cmjh76uur001ajsienq59c8i9",
      "code": "gallery:update",
      "name": "Update Gallery",
      "description": "Update gallery information"
    },
    {
      "id": "cmjh76uuv001bjsieuch0oah6",
      "code": "gallery:delete",
      "name": "Delete Gallery",
      "description": "Delete gallery information"
    },
    {
      "id": "cmjh76uv0001cjsiex7ul7cdp",
      "code": "gallery:manage",
      "name": "Manage Gallery",
      "description": "Manage gallery information"
    },
    {
      "id": "cmjh76uv5001djsiebno83xh8",
      "code": "gallery:upload-images",
      "name": "Upload Images Gallery",
      "description": "Upload Images gallery information"
    },
    {
      "id": "cmjh76uva001ejsierkti5ml1",
      "code": "role:create",
      "name": "Create Role",
      "description": "Create role information"
    },
    {
      "id": "cmjh76uvh001fjsie9lbo1y1j",
      "code": "role:read",
      "name": "View Role",
      "description": "View role information"
    },
    {
      "id": "cmjh76uvq001gjsiex4ixy9hj",
      "code": "role:update",
      "name": "Update Role",
      "description": "Update role information"
    },
    {
      "id": "cmjh76uw0001hjsiem016el01",
      "code": "role:delete",
      "name": "Delete Role",
      "description": "Delete role information"
    },
    {
      "id": "cmjh76uw7001ijsie7vtwzh18",
      "code": "role:assign-permissions",
      "name": "Assign Permissions Role",
      "description": "Assign Permissions role information"
    },
    {
      "id": "cmjh76uwg001jjsie26od5e5b",
      "code": "role:manage",
      "name": "Manage Role",
      "description": "Manage role information"
    },
    {
      "id": "cmjh76uwn001kjsie776w3kgv",
      "code": "permission:read",
      "name": "View Permission",
      "description": "View permission information"
    },
    {
      "id": "cmjh76uws001ljsie1vza1flo",
      "code": "permission:manage",
      "name": "Manage Permission",
      "description": "Manage permission information"
    },
    {
      "id": "cmjh76uwy001mjsies5xy1o80",
      "code": "language:read",
      "name": "View Language",
      "description": "View language information"
    },
    {
      "id": "cmjh76ux3001njsiee59zu1m3",
      "code": "language:update",
      "name": "Update Language",
      "description": "Update language information"
    },
    {
      "id": "cmjh76ux7001ojsie0zq62tba",
      "code": "language:manage",
      "name": "Manage Language",
      "description": "Manage language information"
    },
    {
      "id": "cmjh76uxb001pjsievpxr3p8r",
      "code": "about:read",
      "name": "View About",
      "description": "View about information"
    },
    {
      "id": "cmjh76uxf001qjsie9tpjyimi",
      "code": "about:update",
      "name": "Update About",
      "description": "Update about information"
    },
    {
      "id": "cmjh76uxl001rjsieyxiiocr9",
      "code": "about:manage",
      "name": "Manage About",
      "description": "Manage about information"
    },
    {
      "id": "cmjh76uxr001sjsieokcan77h",
      "code": "administration:read",
      "name": "View Administration",
      "description": "View administration information"
    },
    {
      "id": "cmjh76uxw001tjsie8q4hb618",
      "code": "administration:update",
      "name": "Update Administration",
      "description": "Update administration information"
    },
    {
      "id": "cmjh76uy3001ujsie8l6n5n20",
      "code": "administration:manage",
      "name": "Manage Administration",
      "description": "Manage administration information"
    },
    {
      "id": "cmjh76uy9001vjsienl2seli5",
      "code": "feedback:read",
      "name": "View Feedback",
      "description": "View feedback information"
    },
    {
      "id": "cmjh76uyf001wjsiefsqh293m",
      "code": "feedback:create",
      "name": "Create Feedback",
      "description": "Create feedback information"
    },
    {
      "id": "cmjh76uyk001xjsieqmzesycz",
      "code": "feedback:manage",
      "name": "Manage Feedback",
      "description": "Manage feedback information"
    },
    {
      "id": "cmjh76uyp001yjsiegbm9805v",
      "code": "file:upload",
      "name": "Upload File",
      "description": "Upload file information"
    },
    {
      "id": "cmjh76uyv001zjsiel7cfuymc",
      "code": "file:download",
      "name": "Download File",
      "description": "Download file information"
    },
    {
      "id": "cmjh76uyz0020jsie5832xd3u",
      "code": "file:delete",
      "name": "Delete File",
      "description": "Delete file information"
    },
    {
      "id": "cmjh76uz30021jsierx13saji",
      "code": "file:manage",
      "name": "Manage File",
      "description": "Manage file information"
    },
    {
      "id": "cmjh76uz90022jsiejgni3z3r",
      "code": "dashboard:view",
      "name": "View Dashboard",
      "description": "View dashboard information"
    },
    {
      "id": "cmjh76uzi0023jsie53rnner0",
      "code": "dashboard:admin",
      "name": "Dashboard Admin",
      "description": "Admin dashboard access"
    },
    {
      "id": "cmjh76uzo0024jsie0jlamd27",
      "code": "dashboard:manager",
      "name": "Dashboard Manager",
      "description": "Manager dashboard access"
    },
    {
      "id": "cmjh76uzs0025jsieo194xhu2",
      "code": "dashboard:staff",
      "name": "Dashboard Staff",
      "description": "Staff dashboard access"
    },
    {
      "id": "cmjh76uzz0026jsie6ujclihe",
      "code": "dashboard:customer",
      "name": "Dashboard Customer",
      "description": "Customer dashboard access"
    },
    {
      "id": "cmjh76v040027jsie2shswag2",
      "code": "page:admin:overview",
      "name": "Overview Page (Admin)",
      "description": "Access the admin overview page"
    },
    {
      "id": "cmjh76v090028jsie7n3krc6k",
      "code": "page:admin:user-management",
      "name": "User Management Page (Admin)",
      "description": "Access the admin user management page"
    },
    {
      "id": "cmjh76v0e0029jsiegu14yz2g",
      "code": "page:admin:office",
      "name": "Office Page (Admin)",
      "description": "Access the admin office page"
    },
    {
      "id": "cmjh76v0l002ajsie480ndnmb",
      "code": "page:admin:my-office",
      "name": "My Office Page (Admin)",
      "description": "Access the admin my office page"
    },
    {
      "id": "cmjh76v0r002bjsiexgbsqtqu",
      "code": "page:admin:request-management",
      "name": "Request Management Page (Admin)",
      "description": "Access the admin request management page"
    },
    {
      "id": "cmjh76v0w002cjsiexnzmq6ag",
      "code": "page:admin:report",
      "name": "Report Page (Admin)",
      "description": "Access the admin report page"
    },
    {
      "id": "cmjh76v11002djsie0jmgyv47",
      "code": "page:admin:languages",
      "name": "Languages Page (Admin)",
      "description": "Access the admin languages page"
    },
    {
      "id": "cmjh76v18002ejsie0i0hw5ar",
      "code": "page:admin:gallery",
      "name": "Gallery Page (Admin)",
      "description": "Access the admin gallery page"
    },
    {
      "id": "cmjh76v1e002fjsies6jvyu4e",
      "code": "page:admin:about",
      "name": "About Page (Admin)",
      "description": "Access the admin about page"
    },
    {
      "id": "cmjh76v1l002gjsiesjygsdul",
      "code": "page:admin:profile",
      "name": "Profile Page (Admin)",
      "description": "Access the admin profile page"
    },
    {
      "id": "cmkpadminroles0000000001a",
      "code": "page:admin:roles",
      "name": "Roles Page (Admin)",
      "description": "Access the admin roles page"
    },
    {
      "id": "cmkpadminperms0000000001a",
      "code": "page:admin:permissions",
      "name": "Permissions Page (Admin)",
      "description": "Access the admin permissions page"
    },
    {
      "id": "cmkpadminaudit0000000001a",
      "code": "page:admin:audit-logs",
      "name": "Audit Logs Page (Admin)",
      "description": "Access the admin audit logs page"
    },
    {
      "id": "cmjh76v1q002hjsiewnru9ufd",
      "code": "page:manager:overview",
      "name": "Overview Page (Manager)",
      "description": "Access the manager overview page"
    },
    {
      "id": "cmjh76v1v002ijsiexx72lpq8",
      "code": "page:manager:services",
      "name": "Services Page (Manager)",
      "description": "Access the manager services page"
    },
    {
      "id": "cmjh76v21002jjsiej4m4n43u",
      "code": "page:manager:staff",
      "name": "Staff Page (Manager)",
      "description": "Access the manager staff page"
    },
    {
      "id": "cmjh76v29002kjsiesdifd3u4",
      "code": "page:manager:request-management",
      "name": "Request Management Page (Manager)",
      "description": "Access the manager request management page"
    },
    {
      "id": "cmjh76v2g002ljsie32el2ea5",
      "code": "page:manager:report",
      "name": "Report Page (Manager)",
      "description": "Access the manager report page"
    },
    {
      "id": "cmjh76v2p002mjsiekgcoow0z",
      "code": "page:manager:appointment",
      "name": "Appointment Page (Manager)",
      "description": "Access the manager appointment page"
    },
    {
      "id": "cmjh76v2x002njsie9vwhqayi",
      "code": "page:manager:configuration",
      "name": "Configuration Page (Manager)",
      "description": "Access the manager configuration page"
    },
    {
      "id": "cmjh76v34002ojsiexylzwqcl",
      "code": "page:manager:availability",
      "name": "Availability Page (Manager)",
      "description": "Access the manager availability page"
    },
    {
      "id": "cmjh76v3d002pjsieypgqrb7a",
      "code": "page:staff:overview",
      "name": "Overview Page (Staff)",
      "description": "Access the staff overview page"
    },
    {
      "id": "cmjh76v3n002qjsiedn3c7pqp",
      "code": "page:staff:request-management",
      "name": "Request Management Page (Staff)",
      "description": "Access the staff request management page"
    },
    {
      "id": "cmjh76v3t002rjsievt9j1xr6",
      "code": "page:staff:appointment",
      "name": "Appointment Page (Staff)",
      "description": "Access the staff appointment page"
    },
    {
      "id": "cmjh76v40002sjsie6thoe0q5",
      "code": "page:staff:service-management",
      "name": "Service Management Page (Staff)",
      "description": "Access the staff service management page"
    },
    {
      "id": "cmjh76v48002tjsieiv19zyne",
      "code": "page:staff:report",
      "name": "Report Page (Staff)",
      "description": "Access the staff report page"
    },
    {
      "id": "cmjh76v4h002ujsiej6fso2o4",
      "code": "page:staff:profile",
      "name": "Profile Page (Staff)",
      "description": "Access the staff profile page"
    },
    {
      "id": "cmjh76v4n002vjsiei71lk677",
      "code": "page:customer:overview",
      "name": "Overview Page (Customer)",
      "description": "Access the customer overview page"
    },
    {
      "id": "cmjh76v4z002wjsieo7mdz7tk",
      "code": "page:customer:apply-service",
      "name": "Apply Service Page (Customer)",
      "description": "Access the customer apply service page"
    },
    {
      "id": "cmjh76v56002xjsiegfh6nlr8",
      "code": "page:customer:request",
      "name": "Request Page (Customer)",
      "description": "Access the customer request page"
    },
    {
      "id": "cmjh76v5h002yjsiejaeqsjoe",
      "code": "page:customer:appointment",
      "name": "Appointment Page (Customer)",
      "description": "Access the customer appointment page"
    },
    {
      "id": "cmjh76v5q002zjsie5b1frp94",
      "code": "page:customer:feedback",
      "name": "Feedback Page (Customer)",
      "description": "Access the customer feedback page"
    },
    {
      "id": "cmjh76v5x0030jsie8a2rsb8i",
      "code": "page:customer:profile",
      "name": "Profile Page (Customer)",
      "description": "Access the customer profile page"
    },
    {
      "id": "cmjh76v640031jsiemxriz296",
      "code": "configuration:read",
      "name": "View Configuration",
      "description": "View configuration information"
    },
    {
      "id": "cmjh76v6c0032jsieavspktz8",
      "code": "configuration:update",
      "name": "Update Configuration",
      "description": "Update configuration information"
    },
    {
      "id": "cmjh76v6i0033jsiepkrgry2v",
      "code": "configuration:manage",
      "name": "Manage Configuration",
      "description": "Manage configuration information"
    },
    {
      "id": "cmjh76v6p0034jsie0aecold6",
      "code": "profile:read",
      "name": "View Profile",
      "description": "View profile information"
    },
    {
      "id": "cmjh76v6y0035jsieua5ys3pn",
      "code": "profile:update",
      "name": "Update Profile",
      "description": "Update profile information"
    },
    {
      "id": "cmjh76v780036jsiekp2pdpd4",
      "code": "profile:change-password",
      "name": "Change Password Profile",
      "description": "Change Password profile information"
    },
    {
      "id": "cmjh76v7f0037jsiep08v8wx2",
      "code": "sms:send",
      "name": "Send Sms",
      "description": "Send sms information"
    },
    {
      "id": "cmjh76v7t0038jsielq9cyidy",
      "code": "otp:send",
      "name": "Send Otp",
      "description": "Send otp information"
    },
    {
      "id": "cmjh76v850039jsied5btgjld",
      "code": "otp:verify",
      "name": "Verify Otp",
      "description": "Verify otp information"
    }
  ],
  "office": [
    {
      "id": "cmiwlbtt20000jsp6ch1mh3lp",
      "name": "Waajjirra Bulchinsaa Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "R03",
      "address": "Main Office",
      "subdomain": "admin",
      "logo": "/api/filedata/1765378183240-jspxob4s95h.jpg",
      "slogan": "east shoa ",
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T03:23:38.534Z",
    },
    {
      "id": "cmiwtbrih0000jsmvxk1kww3f",
      "name": "Waajjirra Fayyaa Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "fayyaa",
      "logo": "/api/filedata/1765377760332-hskluwjtysf.jpg",
      "slogan": "FAYYAAN FAAYA !",
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:08:12.224Z",
    },
    {
      "id": "cmiwtftvd0001jsmvnaiv0eka",
      "name": "Waajjirra Carraa Hojii Uumuu fi Ogummaa Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "wchuo",
      "logo": "/api/filedata/1765341028390-dscc9s0sfl.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:11:16.625Z",
    },
    {
      "id": "cmiwtiz420002jsmvzoblvc02",
      "name": "Waajjirra Misooma Magaalaa fi Manneenii Godina Shawaa  Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "wmmm",
      "logo": "/api/filedata/1765377655620-nvwi2it70v.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:14:26.349Z",
    },
    {
      "id": "cmiwtl9ma0003jsmvqgo0nji3",
      "name": "Waajjirra Galiiwwaan  Godina  Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "galii",
      "logo": "/api/filedata/1765394338074-fydydox0xw.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:16:51.235Z",
    },
    {
      "id": "cmiwtowsm0004jsmvphmlc4z5",
      "name": "Waajjirra Bishaanii fi Inarjii Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "bishaani",
      "logo": "/api/filedata/1765341586921-dqdazjy9ddf.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:19:11.638Z",
    },
    {
      "id": "cmiwtrp780005jsmvjob5rfok",
      "name": "Waajjirra Daandiiwwannii fi Loojistiksii Godina Shaawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "daandiiwwaanni",
      "logo": "/api/filedata/1765394450722-efahipq7kpr.png",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:21:34.336Z",
    },
    {
      "id": "cmiwu1g5d0007jsmvkltn6oq3",
      "name": "Ejensii Galmeessii Siviilii Godina Shawaa Bahaa ",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "ejensii",
      "logo": "/api/filedata/1765397125043-w8at43eqokm.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:29:01.147Z",
    },
    {
      "id": "cmiwu4izk0008jsmve2lcslgp",
      "name": "Waajjirra Dargaggoo Ispoortii Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "dargaggoo",
      "logo": "/api/filedata/1765392534940-ruzm4u13v1i.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:32:11.311Z",
    },
    {
      "id": "cmiwu7x6m0009jsmvjbc45zv5",
      "name": "Waajjirra Misooma  Jallissii fi Horsissee Bulaa ",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "wmjhb",
      "logo": "/api/filedata/1765394800922-xhzdvzwpad.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:34:30.013Z",
    },
    {
      "id": "cmiwua43n000ajsmvogq5fg4p",
      "name": "Waajjirra Misooma Albuuda Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "albuuada",
      "logo": "/api/filedata/1765377497637-9nygtw3ksi.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:36:34.684Z",
    },
    {
      "id": "cmiwucdsm000bjsmv0hkq50cy",
      "name": "Waajjirra Aadaa fi Turizimii Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "aadaa",
      "logo": "/api/filedata/1765341517471-pwf8ddxdm9.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:38:16.553Z",
    },
    {
      "id": "cmiwuixeh000cjsmvdd516hqa",
      "name": "Waajjirra Dhimma Dubartootaa fi Daa'immanni Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "dubartoota",
      "logo": "/api/filedata/1765392726281-ddieu4klqee.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:40:41.891Z",
    },
    {
      "id": "cmiwukmpq000djsmv89g4bk05",
      "name": "Waajjirra Barnoota Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "barnoota",
      "logo": "/api/filedata/1765338392696-6ne3x31z7pu.png",
      "slogan": "Education For All",
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:44:47.751Z",
    },
    {
      "id": "cmiwun4l6000ejsmvic2y9emc",
      "name": "Waajjirra Bulchinsaa fi Nageenya Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "nageenya",
      "logo": "/api/filedata/1765341363661-q54xv6h6m8.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:46:44.416Z",
    },
    {
      "id": "cmiwupjpr000fjsmvz77cek4a",
      "name": "Ejeensii Geejjibaa Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "geejjiba",
      "logo": "/api/filedata/1765341438822-42uw2umxq6r.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:48:40.806Z",
    },
    {
      "id": "cmiwuv4ar000gjsmvn7thi4qz",
      "name": "Waajjirra Investiimantii fi Industrii Godiina Shawa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "investmantii",
      "logo": "/api/filedata/1765394553880-1mcqpwur5am.png",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:50:38.162Z",
    },
    {
      "id": "cmiwve9qh000hjsmv1ktd3i4r",
      "name": "Waajjirra Abbaa Taayitaa konistrakshinii Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "konistraakshinii",
      "logo": "/api/filedata/1765341292684-pg0m0m74sbl.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T07:57:41.725Z",
    },
    {
      "id": "cmiwvt0pm000ijsmvqgicrbqs",
      "name": "Waajjirra Lafa Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "lafa",
      "logo": "/api/filedata/1765394657354-qky2k3kkxdq.png",
      "slogan": "LAFTI LAFEEDHA.",
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T08:17:03.082Z",
    },
    {
      "id": "cmiww0myi000jjsmvyhxxlz3o",
      "name": "Waajjirra Pabliik Sarvisii fi Misooma Qabeenya Nama Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "psmqn",
      "logo": "/api/filedata/1765394902082-7evikw2wdsm.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T08:24:33.706Z",
    },
    {
      "id": "cmixqur860010jsn7l58up53s",
      "name": "Waajjirra Babal'ina Waldoota Hojii Gamtaa Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "coop",
      "logo": "/api/filedata/1765781684872-fu9x8tct9g.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-08T22:48:53.786Z",
    },
    {
      "id": "cmj0g35y30000js4678hrglup",
      "name": "Waajjirra Mallaqaa Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "wmwd",
      "logo": "/api/filedata/1765397449499-68bxk9empp.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-10T20:06:00.820Z",
    },
    {
      "id": "cmj6sdygu0006js064fd2lgpr",
      "name": "Waajjira Qonna Godina shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "agriculture",
      "logo": "/api/filedata/1765781704698-h804aghfj7g.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-15T06:41:22.595Z",
    },
    {
      "id": "cmj6syico0007js06qt4vpskb",
      "name": "Waajjira Kominikeeshinii Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "communication",
      "logo": "/api/filedata/1765781881780-4ddi21cn45x.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-15T06:55:28.495Z",
    },
    {
      "id": "cmj6t45fm0008js06xip4001x",
      "name": "Waajjirra Abbaa Alangaa Godina Shawaa Bahaa",
      "phoneNumber": null,
      "roomNumber": "001",
      "address": "Waajjirra Mummee",
      "subdomain": "attornery",
      "logo": "/api/filedata/1765782096110-0olv8ugf6b0l.jpg",
      "slogan": null,
      "settings": {},
      "status": true,
      "startedAt": "2025-12-15T07:00:15.098Z",
    }
  ],
  "role": [
    {
      "id": "cmiwl338h0000jsnoikvgm780",
      "name": "admin",
      "officeId": null,
    },
    {
      "id": "cmiwl338t0001jsno43wxxf9k",
      "name": "manager",
      "officeId": null,
    },
    {
      "id": "cmiwl338z0002jsnorjywaoi9",
      "name": "staff",
      "officeId": null,
    },
    {
      "id": "cmiwl33970003jsnogvq91lb2",
      "name": "customer",
      "officeId": null,
    },
    {
      "id": "cmix3x7g8000ljsmvxx6a4mui",
      "name": "MANAGER",
      "officeId": "cmiwua43n000ajsmvogq5fg4p",
    },
    {
      "id": "cmix40eyw000pjsmvu2zao9dy",
      "name": "MANAGER",
      "officeId": "cmiwucdsm000bjsmv0hkq50cy",
    },
    {
      "id": "cmix427xl000tjsmvj4jtd0wy",
      "name": "MANAGER",
      "officeId": "cmiwukmpq000djsmv89g4bk05",
    },
    {
      "id": "cmix44qfr000xjsmv3eto671i",
      "name": "MANAGER",
      "officeId": "cmiwuixeh000cjsmvdd516hqa",
    },
    {
      "id": "cmix4dnyt0011jsmv3151p66h",
      "name": "manager",
      "officeId": "cmiwuv4ar000gjsmvn7thi4qz",
    },
    {
      "id": "cmix4f7fv0015jsmve8j45rlg",
      "name": "MANAGER",
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "cmixk7tv90001jsoaanj1lrue",
      "name": "MANAGER",
      "officeId": "cmiwun4l6000ejsmvic2y9emc",
    },
    {
      "id": "cmixk97zm0005jsoa33guagkb",
      "name": "MANAGER",
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "cmixkaik60009jsoa4domcmj0",
      "name": "MANAGER",
      "officeId": "cmiwve9qh000hjsmv1ktd3i4r",
    },
    {
      "id": "cmixkbt47000djsoada3l5ljc",
      "name": "MANAGER",
      "officeId": "cmiww0myi000jjsmvyhxxlz3o",
    },
    {
      "id": "cmixq8wjr0001jsn7b1bwnkz9",
      "name": "MANAGER",
      "officeId": "cmiwu4izk0008jsmve2lcslgp",
    },
    {
      "id": "cmixqbp5a0005jsn7kqdr3dy8",
      "name": "MANAGER",
      "officeId": "cmiwu7x6m0009jsmvjbc45zv5",
    },
    {
      "id": "cmixqf1kn0009jsn7xqozuf6t",
      "name": "MANAGER",
      "officeId": "cmiwu1g5d0007jsmvkltn6oq3",
    },
    {
      "id": "cmixqh413000djsn794qlq7cm",
      "name": "MANAGER",
      "officeId": "cmiwtbrih0000jsmvxk1kww3f",
    },
    {
      "id": "cmixqkini000hjsn76t9opcog",
      "name": "MANAGER",
      "officeId": "cmiwtftvd0001jsmvnaiv0eka",
    },
    {
      "id": "cmixqlsr3000ljsn70jr1l89p",
      "name": "MANAGER",
      "officeId": "cmiwtiz420002jsmvzoblvc02",
    },
    {
      "id": "cmixqn9b6000pjsn7r5k4dfud",
      "name": "MANAGER",
      "officeId": "cmiwtl9ma0003jsmvqgo0nji3",
    },
    {
      "id": "cmixqolmv000tjsn73z9hlzz7",
      "name": "MANAGER",
      "officeId": "cmiwtowsm0004jsmvphmlc4z5",
    },
    {
      "id": "cmixqqbjq000xjsn79taubd2y",
      "name": "MANAGER",
      "officeId": "cmiwtrp780005jsmvjob5rfok",
    },
    {
      "id": "cmixqvv1q0012jsn7lkppuv1b",
      "name": "MANAGER",
      "officeId": "cmixqur860010jsn7l58up53s",
    },
    {
      "id": "cmjciihoe0001jsc0fqm56l5u",
      "name": "MANAGER",
      "officeId": "cmj6t45fm0008js06xip4001x",
    },
    {
      "id": "cmjcj6r660005jsc0o9nsji40",
      "name": "MANAGER",
      "officeId": "cmj6syico0007js06qt4vpskb",
    },
    {
      "id": "cmjcj83h90009jsc0lvjniek1",
      "name": "MANAGER",
      "officeId": "cmj0g35y30000js4678hrglup",
    }
  ],
  "rolePermission": [
    {
      "id": "cmjh77hz30000jsjvx6o22wh2",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76umb0000jsie46o4uy33",
    },
    {
      "id": "cmjh77hz30001jsjvbx6pibov",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76umx0001jsieq3hfgly9",
    },
    {
      "id": "cmjh77hz30002jsjvbm58juez",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76un90002jsie9feum0rl",
    },
    {
      "id": "cmjh77hz30003jsjv41zalw8h",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76unh0003jsiejp3wzolw",
    },
    {
      "id": "cmjh77hz30004jsjv3upz4mbb",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76unr0004jsiep9cmqkz2",
    },
    {
      "id": "cmjh77hz30005jsjvx3o7ck7f",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uny0005jsiewwvpv2lp",
    },
    {
      "id": "cmjh77hz30006jsjv47f6h5fe",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjh77hz30007jsjvqizc4j6m",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uop0007jsiein1j2wwt",
    },
    {
      "id": "cmjh77hz30008jsjvs2sabk6u",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uoz0008jsieog1j2xv7",
    },
    {
      "id": "cmjh77hz30009jsjvwdbpqu6v",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76up40009jsiege1qrl1s",
    },
    {
      "id": "cmjh77hz3000ajsjvdjeta0l0",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjh77hz3000bjsjve56t3ate",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjh77hz3000cjsjvrhwsqgm0",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjh77hz3000djsjvocbglqsm",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjh77hz3000ejsjv9arhn516",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjh77hz3000fjsjvyg4c7o22",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjh77hz3000gjsjvktd03t0p",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjh77hz3000hjsjvxksjogw5",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uqk000hjsiezw0qnwsj",
    },
    {
      "id": "cmjh77hz3000ijsjvbrtrnyur",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjh77hz3000jjsjv7993aeu0",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjh77hz3000kjsjvivi001z6",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76ur2000kjsieofld4ais",
    },
    {
      "id": "cmjh77hz3000ljsjvnt7ntq54",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76ur7000ljsie0ujofyyf",
    },
    {
      "id": "cmjh77hz3000mjsjvi87d32k7",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjh77hz3000njsjvm21en1f6",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76urg000njsieub4ojasn",
    },
    {
      "id": "cmjh77hz3000ojsjvo796l1gq",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjh77hz3000pjsjveg5p2o8s",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76urp000pjsiep27rrydb",
    },
    {
      "id": "cmjh77hz3000qjsjv8km7srs0",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjh77hz3000rjsjv03fhz3xy",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjh77hz3000sjsjv88whnpr6",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76us2000sjsieebjpoaq5",
    },
    {
      "id": "cmjh77hz3000tjsjvvzktxmf7",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76us7000tjsie7lv4oixt",
    },
    {
      "id": "cmjh77hz3000ujsjvrhv92o8o",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjh77hz3000vjsjvsgudelux",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjh77hz3000wjsjvqwii67xg",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjh77hz3000xjsjv1rbroclb",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjh77hz3000yjsjvql3j8qrj",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjh77hz3000zjsjvxo9xcs8i",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjh77hz30010jsjvhu1ql75e",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjh77hz30011jsjvkyicw7fj",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjh77hz30012jsjv5jpyw67h",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjh77hz30013jsjvkzivpit9",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjh77hz30014jsjvg1tlr57i",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjh77hz30015jsjvvdjps1zf",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjh77hz30016jsjvkarkcru6",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjh77hz30017jsjvp5osl4jq",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjh77hz30018jsjv7odvlu71",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uug0018jsieh4jpx8gj",
    },
    {
      "id": "cmjh77hz30019jsjvyjsv55j3",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uum0019jsiep0ould0o",
    },
    {
      "id": "cmjh77hz3001ajsjverbpqizf",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uur001ajsienq59c8i9",
    },
    {
      "id": "cmjh77hz3001bjsjvlqt6bjt8",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uuv001bjsieuch0oah6",
    },
    {
      "id": "cmjh77hz3001cjsjvmzawp62e",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uv0001cjsiex7ul7cdp",
    },
    {
      "id": "cmjh77hz3001djsjvjptfwlno",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uv5001djsiebno83xh8",
    },
    {
      "id": "cmjh77hz3001ejsjvgkg862rw",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uva001ejsierkti5ml1",
    },
    {
      "id": "cmjh77hz3001fjsjv6qoyl3r9",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uvh001fjsie9lbo1y1j",
    },
    {
      "id": "cmjh77hz3001gjsjvb9fo2im6",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uvq001gjsiex4ixy9hj",
    },
    {
      "id": "cmjh77hz3001hjsjveu266sz6",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uw0001hjsiem016el01",
    },
    {
      "id": "cmjh77hz3001ijsjv35n7xisi",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uw7001ijsie7vtwzh18",
    },
    {
      "id": "cmjh77hz3001jjsjvvs6fxbte",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uwg001jjsie26od5e5b",
    },
    {
      "id": "cmjh77hz3001kjsjv56l1p7ev",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uwn001kjsie776w3kgv",
    },
    {
      "id": "cmjh77hz3001ljsjvjd5pd8rg",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uws001ljsie1vza1flo",
    },
    {
      "id": "cmjh77hz3001mjsjvxbylp4ak",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uwy001mjsies5xy1o80",
    },
    {
      "id": "cmjh77hz3001njsjvegx3upzp",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76ux3001njsiee59zu1m3",
    },
    {
      "id": "cmjh77hz3001ojsjvx3m57gqz",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76ux7001ojsie0zq62tba",
    },
    {
      "id": "cmjh77hz3001pjsjvrwsnpo0n",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uxb001pjsievpxr3p8r",
    },
    {
      "id": "cmjh77hz3001qjsjvi0wshr1a",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uxf001qjsie9tpjyimi",
    },
    {
      "id": "cmjh77hz3001rjsjv8envb0ac",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uxl001rjsieyxiiocr9",
    },
    {
      "id": "cmjh77hz3001sjsjvqkypqeru",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uxr001sjsieokcan77h",
    },
    {
      "id": "cmjh77hz3001tjsjv19fv6b3f",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uxw001tjsie8q4hb618",
    },
    {
      "id": "cmjh77hz3001ujsjvf3e9r6nq",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uy3001ujsie8l6n5n20",
    },
    {
      "id": "cmjh77hz3001vjsjvyiyphc80",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uy9001vjsienl2seli5",
    },
    {
      "id": "cmjh77hz3001wjsjv9vxvijui",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uyf001wjsiefsqh293m",
    },
    {
      "id": "cmjh77hz3001xjsjvw0dv06hs",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uyk001xjsieqmzesycz",
    },
    {
      "id": "cmjh77hz3001yjsjvxux6n4qy",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjh77hz3001zjsjvwsnhe0si",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjh77hz30020jsjvj809so23",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uyz0020jsie5832xd3u",
    },
    {
      "id": "cmjh77hz30021jsjvnzsg1ulo",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uz30021jsierx13saji",
    },
    {
      "id": "cmjh77hz30022jsjvtgx1d951",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjh77hz30023jsjvw2v7w6st",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uzi0023jsie53rnner0",
    },
    {
      "id": "cmjh77hz30024jsjv0uvd6k11",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjh77hz30025jsjvo2x54643",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uzs0025jsieo194xhu2",
    },
    {
      "id": "cmjh77hz30026jsjvo3bwsada",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76uzz0026jsie6ujclihe",
    },
    {
      "id": "cmjh77hz30027jsjvwdj3nv9e",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v040027jsie2shswag2",
    },
    {
      "id": "cmjh77hz30028jsjvkto8vnut",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v090028jsie7n3krc6k",
    },
    {
      "id": "cmjh77hz30029jsjvm4hg0ln5",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v0e0029jsiegu14yz2g",
    },
    {
      "id": "cmjh77hz3002ajsjvu2kakr8g",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v0l002ajsie480ndnmb",
    },
    {
      "id": "cmjh77hz3002bjsjvxodtflv1",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v0r002bjsiexgbsqtqu",
    },
    {
      "id": "cmjh77hz3002cjsjvxt81tbul",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v0w002cjsiexnzmq6ag",
    },
    {
      "id": "cmjh77hz3002djsjvdl65dc6c",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v11002djsie0jmgyv47",
    },
    {
      "id": "cmjh77hz3002ejsjv214dlhvh",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v18002ejsie0i0hw5ar",
    },
    {
      "id": "cmjh77hz3002fjsjvfx81n1gb",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v1e002fjsies6jvyu4e",
    },
    {
      "id": "cmjh77hz3002gjsjvozw31n1w",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v1l002gjsiesjygsdul",
    },
    {
      "id": "cmjh77hz3002hjsjv8g29w3pm",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjh77hz3002ijsjvohs74rz8",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjh77hz3002jjsjvvwtlzp9t",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjh77hz3002kjsjv6hvfr0pu",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjh77hz3002ljsjv17pssni4",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjh77hz3002mjsjv1amav9zd",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjh77hz3002njsjvkp1mtz4e",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjh77hz3002ojsjvoenerhh2",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjh77hz3002pjsjve31y6sae",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v3d002pjsieypgqrb7a",
    },
    {
      "id": "cmjh77hz3002qjsjv88imcu4e",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v3n002qjsiedn3c7pqp",
    },
    {
      "id": "cmjh77hz3002rjsjv5y0arrj2",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v3t002rjsievt9j1xr6",
    },
    {
      "id": "cmjh77hz3002sjsjvknye242w",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v40002sjsie6thoe0q5",
    },
    {
      "id": "cmjh77hz3002tjsjvcg8azvl3",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v48002tjsieiv19zyne",
    },
    {
      "id": "cmjh77hz3002ujsjvwu5b5zbg",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v4h002ujsiej6fso2o4",
    },
    {
      "id": "cmjh77hz3002vjsjvxt175uem",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v4n002vjsiei71lk677",
    },
    {
      "id": "cmjh77hz3002wjsjvod4b9y2t",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v4z002wjsieo7mdz7tk",
    },
    {
      "id": "cmjh77hz3002xjsjvc592ggef",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v56002xjsiegfh6nlr8",
    },
    {
      "id": "cmjh77hz3002yjsjvghkwwbxl",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v5h002yjsiejaeqsjoe",
    },
    {
      "id": "cmjh77hz3002zjsjvsvomhsw0",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v5q002zjsie5b1frp94",
    },
    {
      "id": "cmjh77hz30030jsjv9gj2nqjv",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v5x0030jsie8a2rsb8i",
    },
    {
      "id": "cmjh77hz30031jsjv3g2rpoxj",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjh77hz30032jsjv8ko8gb63",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjh77hz30033jsjvm8lw8pau",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v6i0033jsiepkrgry2v",
    },
    {
      "id": "cmjh77hz40034jsjvd8gddcu3",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjh77hz40035jsjvegf1ntex",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjh77hz40036jsjvmb8ai0j2",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjh77hz40037jsjve6rxehn9",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v7f0037jsiep08v8wx2",
    },
    {
      "id": "cmjh77hz40038jsjv80p3mah6",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v7t0038jsielq9cyidy",
    },
    {
      "id": "cmjh77hz40039jsjvzai4gjw7",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmjh76v850039jsied5btgjld",
    },
    {
      "id": "cmkprpadminroles00000001a",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmkpadminroles0000000001a",
    },
    {
      "id": "cmkprpadminperms00000001a",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmkpadminperms0000000001a",
    },
    {
      "id": "cmkprpadminaudit00000001a",
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "permissionId": "cmkpadminaudit0000000001a",
    },
    {
      "id": "cmjh7g7qw0000jsnx48snf60b",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjh7g7qw0001jsnxd7hr9ip7",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjh7g7qx0002jsnxtt9c6ek3",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjh7g7qx0003jsnxfz38qmqr",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjh7g7qx0004jsnxx9z7zfju",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjh7g7qx0005jsnxzbltgykm",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjh7g7qx0006jsnx6b5t9gct",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjh7g7qx0007jsnx1r7fisfi",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjh7g7qx0008jsnxv8ulxjil",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjh7g7qx0009jsnxlwmw8gnr",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjh7g7qx000ajsnxttvf6ulc",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjh7g7qx000bjsnxc49l1ctr",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjh7g7qx000cjsnxgib0k4ok",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjh7g7qx000djsnxh2j3vndm",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjh7g7qx000ejsnxsdokcu1w",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjh7g7qx000fjsnx95laapsy",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjh7g7qx000gjsnxm96k0fe9",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjh7g7qx000hjsnxyzx9byvi",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjh7g7qx000ijsnxws346z7g",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjh7g7qx000jjsnxpsfbvid9",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjh7g7qx000kjsnxl9tflrdh",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjh7g7qx000ljsnxcf5icafq",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjh7g7qx000mjsnx1khi89i5",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjh7g7qx000njsnxg7evz3s4",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjh7g7qx000ojsnxrp49jn8c",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjh7g7qx000pjsnxgw6mjif8",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjh7g7qx000qjsnx0nes9h4c",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjh7g7qx000rjsnx79cn9ogi",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjh7g7qx000sjsnx9ga2tast",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjh7g7qx000tjsnxlcfvlvcc",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjh7g7qx000ujsnxxr9k3jsj",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjh7g7qx000vjsnxewkucvnm",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjh7g7qx000wjsnx7cknxnnl",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjh7g7qx000xjsnxx2cdxvhb",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjh7g7qx000yjsnx8zvdovps",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjh7g7qx000zjsnxyx7vpphx",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjh7g7qx0010jsnxcy7qayvl",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjh7g7qx0011jsnxgcamemn9",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjh7g7qx0012jsnx5lftx5ej",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjh7g7qx0013jsnx7uiw8scv",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjh7g7qx0014jsnxrcoq04wh",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjh7g7qx0015jsnxvdny5ujy",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjh7g7qx0016jsnxpp0o8c03",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjh7g7qx0017jsnxlwkrhg39",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjh7g7qx0018jsnx3fb80u5u",
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjh7gfw40019jsnxqoxbk958",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjh7gfw4001ajsnx2s74dcbp",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjh7gfw4001bjsnx8zd2g86x",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjh7gfw4001cjsnxjvgx31v3",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjh7gfw4001djsnxldtg2qys",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjh7gfw4001ejsnxvlodlh6l",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjh7gfw4001fjsnxv3wx04l0",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjh7gfw4001gjsnxexp1db3o",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjh7gfw4001hjsnxkinaz2sh",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjh7gfw4001ijsnx7cwn2tqe",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjh7gfw4001jjsnxzk4hn2rt",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjh7gfw4001kjsnxc85rixbd",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjh7gfw4001ljsnxowu223rz",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjh7gfw4001mjsnxfzre62zk",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjh7gfw4001njsnxed2rc89o",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjh7gfw4001ojsnx7v4e1q5a",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjh7gfw4001pjsnxljja6ue0",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjh7gfw4001qjsnxgq0kb25x",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjh7gfw4001rjsnxi5pv15hs",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjh7gfw4001sjsnxlvupnd5c",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjh7gfw4001tjsnxwgrh7b1g",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjh7gfw4001ujsnx1ns23u6a",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjh7gfw4001vjsnx6ehkg69w",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjh7gfw4001wjsnxhu8s1nzi",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjh7gfw4001xjsnxcboaoebv",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjh7gfw4001yjsnxxnvnclhg",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjh7gfw4001zjsnxp5be7ga3",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjh7gfw40020jsnxnjm93c62",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjh7gfw40021jsnxc93yn95j",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjh7gfw40022jsnxuttvq9xs",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjh7gfw40023jsnxyirtuw7a",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjh7gfw40024jsnx1yht94br",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjh7gfw40025jsnxy9p9g1p1",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjh7gfw40026jsnxqpk579v7",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjh7gfw40027jsnx1d19k8ai",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjh7gfw40028jsnx3c77h21k",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjh7gfw40029jsnxwx4schba",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjh7gfw4002ajsnxl9txs2o6",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjh7gfw4002bjsnxcc1xn0dj",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjh7gfw4002cjsnxyu8p9t5k",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjh7gfw4002djsnxhhum8cq5",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjh7gfw4002ejsnxmpjqgsyr",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjh7gfw4002fjsnxlo2sm97o",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjh7gfw4002gjsnx51ufakzr",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjh7gfw4002hjsnxwcopa2fg",
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjh7gq3r002ijsnxns94x78p",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjh7gq3r002jjsnx6gq6rzpz",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjh7gq3r002kjsnxvlybw0sb",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjh7gq3r002ljsnxjqwfk7p5",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76ur7000ljsie0ujofyyf",
    },
    {
      "id": "cmjh7gq3r002mjsnxhdu6gcq7",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjh7gq3r002njsnx09h4n9dq",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjh7gq3r002ojsnx6dvg4613",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76us7000tjsie7lv4oixt",
    },
    {
      "id": "cmjh7gq3r002pjsnxuyd4m2q7",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjh7gq3r002qjsnxgujgmvg6",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjh7gq3r002rjsnxvos7mftv",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjh7gq3r002sjsnxhvxb56fq",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjh7gq3r002tjsnxp3mtsh04",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjh7gq3r002ujsnxte44zu6b",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjh7gq3r002vjsnxak8fxni6",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjh7gq3r002wjsnxpk079zlr",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76uzs0025jsieo194xhu2",
    },
    {
      "id": "cmjh7gq3r002xjsnxfiop3z7a",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76v3d002pjsieypgqrb7a",
    },
    {
      "id": "cmjh7gq3r002yjsnxf1r375if",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76v3n002qjsiedn3c7pqp",
    },
    {
      "id": "cmjh7gq3r002zjsnxdbc02lx5",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76v3t002rjsievt9j1xr6",
    },
    {
      "id": "cmjh7gq3r0030jsnxo7uwcqx8",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76v40002sjsie6thoe0q5",
    },
    {
      "id": "cmjh7gq3r0031jsnxuusfgzqb",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76v48002tjsieiv19zyne",
    },
    {
      "id": "cmjh7gq3r0032jsnxf590uyae",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76v4h002ujsiej6fso2o4",
    },
    {
      "id": "cmjh7gq3r0033jsnxo1g74h5c",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjh7gq3r0034jsnxwlzbafwv",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjh7gq3r0035jsnx4uydm464",
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhfxjtd0036jsnxmkc0bs9s",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhfxjte0037jsnxjb3fqibv",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhfxjte0038jsnxgs9szlxo",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhfxjte0039jsnxnc93a0nv",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhfxjte003ajsnxaat9h3ja",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhfxjte003bjsnxkmi7tr2i",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhfxjte003cjsnxh4c30100",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhfxjte003djsnxq2kcct85",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhfxjte003ejsnxglv0a58a",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhfxjte003fjsnxekgg7gwl",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhfxjte003gjsnxbvspkitx",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhfxjte003hjsnxy1u4g7zi",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhfxjte003ijsnx1519e1s8",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhfxjte003jjsnx0ysti5z3",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhfxjte003kjsnxbh4xhq8p",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhfxjte003ljsnxv9hu5w3i",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhfxjte003mjsnxu7cuddqs",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhfxjte003njsnxffn7rkmk",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhfxjte003ojsnx61h9ywp5",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhfxjte003pjsnx8ce0b3ii",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhfxjte003qjsnxnp1gi7un",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhfxjte003rjsnxpxpsopgk",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhfxjte003sjsnxhqhzf0xf",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhfxjte003tjsnxq7omr48h",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhfxjte003ujsnxehkncqhc",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhfxjte003vjsnxitmfocpz",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhfxjte003wjsnx5qxpf3ub",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhfxjte003xjsnxv6cwl4v7",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhfxjte003yjsnxcau1etna",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhfxjte003zjsnxic6nhwsb",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhfxjte0040jsnxijik1k2s",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhfxjte0041jsnxmdpuihzz",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhfxjte0042jsnxyahmo6h0",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhfxjte0043jsnx7v22daht",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhfxjte0044jsnxlgxj79yo",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhfxjte0045jsnxajlhmw3w",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhfxjte0046jsnxwys6rb0m",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhfxjte0047jsnxu3cjzrf1",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhfxjte0048jsnxu6kydxyn",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhfxjte0049jsnx0zcfu0t6",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhfxjte004ajsnxnhb08c26",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhfxjte004bjsnxayniqdal",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhfxjte004cjsnxtaw6hl0a",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhfxjte004djsnxfe5odrjt",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhfxjte004ejsnxdunufj65",
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhfxpr0004fjsnxx1coeltc",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhfxpr0004gjsnxn5ddt9x6",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhfxpr0004hjsnxqc545wtq",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76uqk000hjsiezw0qnwsj",
    },
    {
      "id": "cmjhfxpr0004ijsnx8tc0pkuy",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhfxpr0004jjsnxh6ag9e5z",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhfxpr0004kjsnxkgwagtov",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76ur2000kjsieofld4ais",
    },
    {
      "id": "cmjhfxpr0004ljsnxjtgog55c",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76urp000pjsiep27rrydb",
    },
    {
      "id": "cmjhfxpr0004mjsnx06bvhvna",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhfxpr0004njsnxrmobkuhc",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhfxpr0004ojsnxowzoick1",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76us2000sjsieebjpoaq5",
    },
    {
      "id": "cmjhfxpr0004pjsnxxf2zcfyl",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76uy9001vjsienl2seli5",
    },
    {
      "id": "cmjhfxpr0004qjsnxg2trkorm",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76uyf001wjsiefsqh293m",
    },
    {
      "id": "cmjhfxpr0004rjsnxukuj4gpo",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhfxpr0004sjsnxmpowb8c0",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhfxpr0004tjsnxenre8pqx",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhfxpr0004ujsnxvo0j8mct",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76uzz0026jsie6ujclihe",
    },
    {
      "id": "cmjhfxpr0004vjsnx185siune",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76v4n002vjsiei71lk677",
    },
    {
      "id": "cmjhfxpr0004wjsnx1b78toi3",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76v4z002wjsieo7mdz7tk",
    },
    {
      "id": "cmjhfxpr0004xjsnxlnm2e52v",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76v56002xjsiegfh6nlr8",
    },
    {
      "id": "cmjhfxpr0004yjsnx75a0dqh3",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76v5h002yjsiejaeqsjoe",
    },
    {
      "id": "cmjhfxpr0004zjsnxxaz3t9m2",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76v5q002zjsie5b1frp94",
    },
    {
      "id": "cmjhfxpr00050jsnxzg3c1hs4",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76v5x0030jsie8a2rsb8i",
    },
    {
      "id": "cmjhfxpr00051jsnxjgw21r61",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhfxpr00052jsnxc0be6a3x",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhfxpr00053jsnxe1cxggdf",
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhfxw5d0054jsnxzsjoi1yt",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhfxw5d0055jsnxovc5vpxa",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhfxw5d0056jsnxwo0eaiu7",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhfxw5d0057jsnx6uwo3aix",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhfxw5d0058jsnxe052wq3s",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhfxw5d0059jsnxs3335zz1",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhfxw5d005ajsnxscq6kwk6",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhfxw5d005bjsnxfgld3gn8",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhfxw5d005cjsnx9b4wfe8a",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhfxw5d005djsnx18fiqdvw",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhfxw5d005ejsnxk76yb2ez",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhfxw5d005fjsnx8whuttbq",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhfxw5d005gjsnxknsljpn6",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhfxw5d005hjsnx8lrsvmfx",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhfxw5d005ijsnxyeovte6i",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhfxw5d005jjsnx7jcdv1xa",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhfxw5d005kjsnx0msvlvz7",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhfxw5d005ljsnx1r6dyvdz",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhfxw5d005mjsnxxy6jbivw",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhfxw5d005njsnx4r6v063z",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhfxw5d005ojsnxouorrf77",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhfxw5d005pjsnxd3xnlraz",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhfxw5d005qjsnx2krbfc99",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhfxw5d005rjsnxrlla9ojg",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhfxw5d005sjsnx9kf5dnum",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhfxw5d005tjsnxmeyx9w13",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhfxw5d005ujsnxi9ni6vvi",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhfxw5d005vjsnxcwkz84iv",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhfxw5d005wjsnxhfvsmy16",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhfxw5d005xjsnxki18pior",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhfxw5d005yjsnxs69sx36e",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhfxw5d005zjsnxu5crhh29",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhfxw5d0060jsnxsa119lnz",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhfxw5d0061jsnxc1n8zg43",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhfxw5d0062jsnx5jxamhsi",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhfxw5d0063jsnx8zj2fafu",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhfxw5d0064jsnxuxnjhocg",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhfxw5d0065jsnxt1kf65n3",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhfxw5d0066jsnx6pclrbs5",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhfxw5d0067jsnxazprukjc",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhfxw5d0068jsnxxc92816j",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhfxw5d0069jsnxdhjixaxp",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhfxw5d006ajsnxwh5sltse",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhfxw5d006bjsnxvpn3zvv3",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhfxw5d006cjsnxgh5s2x8q",
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhfy2hn006djsnxiac3o6zm",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhfy2hn006ejsnx7w5h5mu3",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhfy2hn006fjsnxl8semesy",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhfy2hn006gjsnxtsz1sg8k",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhfy2hn006hjsnxtgmmiybk",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhfy2hn006ijsnxd5ocz53u",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhfy2hn006jjsnxrntghium",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhfy2hn006kjsnxh1fr766g",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhfy2hn006ljsnx5x94dum1",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhfy2hn006mjsnxdga9d8dy",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhfy2hn006njsnx2m0bxpea",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhfy2hn006ojsnxgroccucp",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhfy2hn006pjsnxoijs3kxw",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhfy2hn006qjsnx3r5m3jwk",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhfy2hn006rjsnxpvtc7k6n",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhfy2hn006sjsnx6e394g4j",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhfy2hn006tjsnxa7lmfi22",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhfy2hn006ujsnx16e61ro7",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhfy2hn006vjsnxfotumdrz",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhfy2hn006wjsnxacw0v1gu",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhfy2hn006xjsnx8mf61ezt",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhfy2hn006yjsnxge99ew44",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhfy2hn006zjsnx749gwaeg",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhfy2hn0070jsnxdv9cwkoa",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhfy2hn0071jsnxaxe8yhdf",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhfy2ho0072jsnxlv9u6m4z",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhfy2ho0073jsnxs1rxwhso",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhfy2ho0074jsnxac2e29h7",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhfy2ho0075jsnxwr5v0lda",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhfy2ho0076jsnxagtgrl83",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhfy2ho0077jsnxu3farxed",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhfy2ho0078jsnxdu0g1548",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhfy2ho0079jsnx86avvyuj",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhfy2ho007ajsnxj8pr6em9",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhfy2ho007bjsnxoashztyb",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhfy2ho007cjsnxoan5bbrt",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhfy2ho007djsnxjar3g15i",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhfy2ho007ejsnxxhbrj74s",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhfy2ho007fjsnx4bjxr1ec",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhfy2ho007gjsnxu0xuqzbt",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhfy2ho007hjsnxrbczliuq",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhfy2ho007ijsnxthbytgb3",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhfy2ho007jjsnx7p6zfwkh",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhfy2ho007kjsnx0t0upefh",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhfy2ho007ljsnxfvpcyjyn",
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhfye16007mjsnx764zdsbn",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhfye16007njsnxpfavu403",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhfye16007ojsnxbz4nzufo",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhfye16007pjsnxu1tt02i6",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhfye16007qjsnxrgjfo3oc",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhfye16007rjsnxe5y2bfc0",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhfye16007sjsnxqrw4dh5y",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhfye16007tjsnxi2q7w1j5",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhfye16007ujsnx06nmpjic",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhfye16007vjsnxiys8w6t7",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhfye16007wjsnxsyoh6lw5",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhfye16007xjsnxva9il5to",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhfye16007yjsnxyn9rm4wq",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhfye16007zjsnxdja9ozp4",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhfye160080jsnxk292ggi0",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhfye160081jsnxza8gol42",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhfye160082jsnxxbhi8gj2",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhfye160083jsnx72pdyhuz",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhfye160084jsnxy07v8x9s",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhfye160085jsnx6ewqu4aq",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhfye160086jsnx1bjaxnln",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhfye160087jsnxort6ts1q",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhfye160088jsnxj8h8cv0p",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhfye160089jsnxqr3ftghn",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhfye16008ajsnxc57vqb1d",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhfye16008bjsnxu2ninlpg",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhfye16008cjsnx6ougyk9e",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhfye16008djsnxwn1iuzgs",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhfye16008ejsnxthjxtz0n",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhfye16008fjsnxgm6vup4o",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhfye16008gjsnxyt3n51vv",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhfye16008hjsnx29kp8yoz",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhfye16008ijsnxypomm14g",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhfye16008jjsnx7jrrts6s",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhfye16008kjsnxwknpk9nn",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhfye16008ljsnx2ghrpafx",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhfye16008mjsnx9f7tpqhu",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhfye16008njsnxi2yk9pje",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhfye16008ojsnx2ivs218t",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhfye16008pjsnxxfynluba",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhfye16008qjsnxyzdm75ut",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhfye16008rjsnxdbga7v1p",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhfye16008sjsnxm93ta0ni",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhfye16008tjsnxty6j72ol",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhfye16008ujsnx9etb7wns",
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhfyriv00a4jsnxdn4w1of0",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhfyriv00a5jsnxwyj2jkxv",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhfyriv00a6jsnx6spjx36o",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhfyriv00a7jsnxpxavv0a5",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhfyriv00a8jsnx0stey24n",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhfyriv00a9jsnxvwt6qxxg",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhfyriv00aajsnx91kdjpkw",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhfyriv00abjsnx1mzj1j9b",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhfyriv00acjsnx5jzlm49r",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhfyriv00adjsnxg90wvarc",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhfyriv00aejsnxaxnb1ix4",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhfyriv00afjsnxrhsdld80",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhfyriv00agjsnxdo3xe0qm",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhfyriv00ahjsnx7uowdwir",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhfyriv00aijsnx147775mn",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhfyriv00ajjsnxq46wzek2",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhfyriv00akjsnxkouqvs1h",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhfyriv00aljsnxc5gahfli",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhfyriv00amjsnxaj32aoll",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhfyriv00anjsnxnrddkyxg",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhfyriv00aojsnxt4mmeybo",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhfyriv00apjsnx6ffbupfh",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhfyriv00aqjsnxj6j73ass",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhfyriv00arjsnxj4tlnnk3",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhfyriv00asjsnxcdyjfcv5",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhfyriv00atjsnx6j03y6pl",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhfyriv00aujsnxd4d9ejsh",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhfyriv00avjsnx7qv2knj9",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhfyriv00awjsnxas68vw4c",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhfyriv00axjsnx4wgfkimk",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhfyriv00ayjsnxkd5740g4",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhfyriv00azjsnx7um815qe",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhfyriv00b0jsnxyqfmghhr",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhfyriv00b1jsnxtesxq1nx",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhfyriv00b2jsnxftnxihmt",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhfyriv00b3jsnxwbo6mwfq",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhfyriv00b4jsnx2bzwp7r9",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhfyriv00b5jsnxjckjypn4",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhfyriv00b6jsnxmc6k1djf",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhfyriv00b7jsnx1zq6e5wv",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhfyriv00b8jsnxb0sexnm6",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhfyriv00b9jsnx2dazdh5v",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhfyriw00bajsnxs9sj6uy0",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhfyriw00bbjsnx7viakrdp",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhfyriw00bcjsnxrvsav3t7",
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhfz1w900cmjsnxaqvdwqsi",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhfz1w900cnjsnxq7miaybo",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhfz1w900cojsnxpygylabb",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhfz1w900cpjsnxobivng2d",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhfz1w900cqjsnxx38hxdku",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhfz1w900crjsnxk3x3pdv3",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhfz1w900csjsnx2wsyzfky",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhfz1w900ctjsnx4rgvozhd",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhfz1w900cujsnx0z2fa6iz",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhfz1w900cvjsnx539p7iz9",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhfz1w900cwjsnxmw8bocrv",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhfz1w900cxjsnxxp0df5ic",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhfz1w900cyjsnxqu38756f",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhfz1w900czjsnxn4l8ps6h",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhfz1w900d0jsnxcgi38r57",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhfz1w900d1jsnxdrgoiopr",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhfz1w900d2jsnxa6di8tsg",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhfz1w900d3jsnxh1tyi31y",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhfz1w900d4jsnxukev5eqc",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhfz1w900d5jsnx5pjrwp5p",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhfz1w900d6jsnx8ob9t298",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhfz1w900d7jsnxasgsualy",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhfz1w900d8jsnxvpff5v1i",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhfz1w900d9jsnxbgyw9f9z",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhfz1w900dajsnxgsetma1d",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhfz1w900dbjsnx5mwpzyjs",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhfz1w900dcjsnx6qf36c4v",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhfz1w900ddjsnxsf5mp9ur",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhfz1w900dejsnxxh9myrce",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhfz1w900dfjsnxv4txsg5u",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhfz1w900dgjsnxzkcoato9",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhfz1w900dhjsnxvgyt870n",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhfz1w900dijsnx15p8c9mb",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhfz1w900djjsnx8a9eytci",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhfz1w900dkjsnxn8oajh8r",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhfz1w900dljsnxystv3oqx",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhfz1w900dmjsnxjsnq3wb7",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhfz1w900dnjsnxy5n2y0xo",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhfz1w900dojsnx9gto3zcj",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhfz1w900dpjsnxrheoy9dw",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhfz1w900dqjsnxhxptd571",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhfz1w900drjsnxukq5nsd0",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhfz1w900dsjsnxizxulq1e",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhfz1w900dtjsnxa27vij8h",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhfz1w900dujsnxw13582t8",
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhfzdac00f4jsnxx2sc47mc",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhfzdac00f5jsnxeg6wnfcu",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhfzdac00f6jsnxjhpfp10h",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhfzdac00f7jsnxd9h8cgux",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhfzdac00f8jsnxe4scfbdi",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhfzdac00f9jsnxnxcru090",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhfzdac00fajsnxtcbtt3q2",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhfzdac00fbjsnxk058tmm5",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhfzdac00fcjsnx3wzgi9wm",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhfzdac00fdjsnxyv1towrz",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhfzdac00fejsnx0hds1yet",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhfzdac00ffjsnxxkz1259v",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhfzdac00fgjsnxbht1gfjy",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhfzdac00fhjsnx4bs1p2gh",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhfzdac00fijsnxli8zrhnc",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhfzdac00fjjsnxm75blrc6",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhfzdac00fkjsnxcownoboi",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhfzdac00fljsnx9lnzcw9f",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhfzdac00fmjsnxdtz5yspx",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhfzdac00fnjsnxvah697ba",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhfzdac00fojsnxqh71bii1",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhfzdac00fpjsnxy2vrg39z",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhfzdac00fqjsnxg29mkfk4",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhfzdac00frjsnxqkkjnhqf",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhfzdac00fsjsnxfq2mi5d0",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhfzdac00ftjsnx1edcidpi",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhfzdac00fujsnx26juenja",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhfzdac00fvjsnx0rfh2nmn",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhfzdac00fwjsnxw9l32ymc",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhfzdac00fxjsnx7hbiysvn",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhfzdac00fyjsnxbeckuyb1",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhfzdad00fzjsnx2ch8ashk",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhfzdad00g0jsnxexrzp2lq",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhfzdad00g1jsnxz0q1ncut",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhfzdad00g2jsnxr2iceekq",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhfzdad00g3jsnxy8v1hcmo",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhfzdad00g4jsnxhgkhd0jm",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhfzdad00g5jsnxooo6yr05",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhfzdad00g6jsnxd6dhnoaj",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhfzdad00g7jsnx8u0i9obe",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhfzdad00g8jsnxj9maj091",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhfzdad00g9jsnx93pcqv0h",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhfzdad00gajsnxle5ttunp",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhfzdad00gbjsnx14vgnuox",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhfzdad00gcjsnxu8o15w1f",
      "roleId": "cmixqkini000hjsn76t9opcog",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhfzttx00hmjsnx0a7btkb8",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhfzttx00hnjsnxl2xzl39q",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhfzttx00hojsnxgud8zmos",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhfzttx00hpjsnx4ts29agf",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhfzttx00hqjsnxp8lxpyub",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhfzttx00hrjsnx0qfvdte5",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhfzttx00hsjsnxq9ivb8dc",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhfzttx00htjsnxjcmk26ts",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhfzttx00hujsnxvha29dyw",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhfzttx00hvjsnxm5mbxup3",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhfzttx00hwjsnx6tqcvy3t",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhfzttx00hxjsnxwf398dmc",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhfzttx00hyjsnxtgqzg9wt",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhfzttx00hzjsnxql63u06v",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhfzttx00i0jsnxgy4g2h1x",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhfzttx00i1jsnxol33bq2o",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhfzttx00i2jsnx56u63524",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhfzttx00i3jsnxvtgioeft",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhfzttx00i4jsnxiyszc674",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhfzttx00i5jsnxcfhgs0li",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhfzttx00i6jsnx7jf5l1yb",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhfzttx00i7jsnxx9t91g7v",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhfzttx00i8jsnxc0ijr6vm",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhfzttx00i9jsnxndyjdc3u",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhfzttx00iajsnxamm4bn8m",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhfzttx00ibjsnx5f3wk13o",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhfzttx00icjsnx7d39vvp4",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhfzttx00idjsnxzemocygd",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhfzttx00iejsnx52jmbv8f",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhfzttx00ifjsnxky8n20tb",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhfzttx00igjsnxqp6wdzdd",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhfzttx00ihjsnxm3kccn3b",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhfzttx00iijsnx9nfq29hg",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhfzttx00ijjsnxj9n361t2",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhfzttx00ikjsnxvsgj1bc8",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhfzttx00iljsnxin56mmzo",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhfzttx00imjsnxe5xxgcli",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhfzttx00injsnx26lk5cp9",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhfzttx00iojsnx513psbs8",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhfzttx00ipjsnxactj0pqu",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhfzttx00iqjsnxi4l42ek0",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhfzttx00irjsnx9u88b3vj",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhfzttx00isjsnx2wpnaput",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhfzttx00itjsnxn1bfz18w",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhfzttx00iujsnxb39s7x9i",
      "roleId": "cmixqh413000djsn794qlq7cm",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg05pw00k4jsnxtr3tf2by",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg05pw00k5jsnxc0foxj2a",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg05pw00k6jsnx2klje1uc",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg05pw00k7jsnxexjpjxag",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg05pw00k8jsnxette6p7l",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg05pw00k9jsnxzzkuxhnm",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg05pw00kajsnxxvzvxqee",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg05pw00kbjsnxkv12zyvw",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg05pw00kcjsnx6oiddzry",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg05pw00kdjsnx20x5f9gi",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg05pw00kejsnx5vzg8ent",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg05pw00kfjsnx3r2uj22u",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg05pw00kgjsnxoskme3py",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg05pw00khjsnxdfo2j0ce",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg05pw00kijsnxrjm87wsw",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg05pw00kjjsnxx82nzi6v",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg05pw00kkjsnx8f54i5jw",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg05pw00kljsnxu5wed57b",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg05pw00kmjsnxqlh6y77y",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg05pw00knjsnxsox5b68h",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg05pw00kojsnx8cnoo2lh",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg05pw00kpjsnx55rk7k7f",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg05pw00kqjsnxyoontxfw",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg05pw00krjsnx4rweis3q",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg05pw00ksjsnxjyxxxs8e",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg05pw00ktjsnxy7inpeim",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg05pw00kujsnxpppfhszg",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg05pw00kvjsnxyrib7dpu",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg05pw00kwjsnxbew6vb7c",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg05pw00kxjsnxmn78j4zm",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg05pw00kyjsnxizrzou5u",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg05pw00kzjsnxhu1ifpjo",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg05pw00l0jsnxtsh1hjy4",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg05pw00l1jsnxuswdgujn",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg05pw00l2jsnxgkln6tar",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg05pw00l3jsnxn27k9vuw",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg05pw00l4jsnxk1xsepfm",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg05pw00l5jsnx1m5hsz43",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg05pw00l6jsnxeg2rap42",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg05pw00l7jsnxf1w7hqw1",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg05pw00l8jsnxskvagpv3",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg05pw00l9jsnxddwjooxg",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg05pw00lajsnxuz4mj0bm",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg05pw00lbjsnx8jfktgl0",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg05pw00lcjsnx46o18g0v",
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg0e7y00ldjsnxmwbt71hh",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg0e7y00lejsnxj8w4w5zx",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg0e7y00lfjsnxb5bvzvee",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg0e7y00lgjsnxp6yno5r8",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg0e7y00lhjsnxl7is2vq9",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg0e7y00lijsnx8lrajjuv",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg0e7y00ljjsnxbjk34xyl",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg0e7y00lkjsnxlb1qaf8v",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg0e7y00lljsnxyb15yadz",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg0e7y00lmjsnx1wzfzwdb",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg0e7y00lnjsnxmlsoevy9",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg0e7y00lojsnx0kbb3rvj",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg0e7y00lpjsnx23l5yqij",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg0e7y00lqjsnxkubhwl26",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg0e7y00lrjsnxlvv3ljb9",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg0e7y00lsjsnxzeq8hgyd",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg0e7y00ltjsnxjt6xmb36",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg0e7y00lujsnxup31nkvs",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg0e7y00lvjsnxertniap3",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg0e7y00lwjsnx4qg2nksl",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg0e7y00lxjsnx882egxxd",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg0e7y00lyjsnx4ucdlg1w",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg0e7y00lzjsnxb0ouo1ks",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg0e7y00m0jsnxdia0fody",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg0e7y00m1jsnxn3pry3sv",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg0e7y00m2jsnxbrsxpe2r",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg0e7y00m3jsnxfae77ub8",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg0e7y00m4jsnx7ppo9o3o",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg0e7y00m5jsnxrdml9fv8",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg0e7y00m6jsnx76wvyp41",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg0e7y00m7jsnxunqvst9v",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg0e7y00m8jsnxx0qz1ra9",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg0e7y00m9jsnxtj1g5r5a",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg0e7y00majsnx53i8shh7",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg0e7y00mbjsnx2sq818zk",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg0e7y00mcjsnxvzbo5w2d",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg0e7y00mdjsnxwsud9h0m",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg0e7y00mejsnxtlsal0aa",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg0e7y00mfjsnxuyz3iaci",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg0e7y00mgjsnxo2yqmflr",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg0e7y00mhjsnxf6g29w8p",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg0e7y00mijsnx7lwdsktu",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg0e7y00mjjsnxnkdubpmr",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg0e7y00mkjsnx9ezab5td",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg0e7y00mljsnxjq3j2b2e",
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg0lc600mmjsnx4kaw5wp6",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg0lc600mnjsnxbeghh5bh",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg0lc600mojsnxoptrbkd2",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg0lc600mpjsnxge30fpsi",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg0lc600mqjsnxxovnwfbz",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg0lc600mrjsnxtmsomm6e",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg0lc600msjsnxp9mfyzvr",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg0lc600mtjsnx3q0ugw53",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg0lc600mujsnxblwxh3jk",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg0lc600mvjsnxtst83yen",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg0lc600mwjsnxben601v1",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg0lc600mxjsnxnt5rlqhe",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg0lc600myjsnxlink2vvc",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg0lc600mzjsnxgiqgac3d",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg0lc600n0jsnx73t6950e",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg0lc600n1jsnxg61ihjn2",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg0lc600n2jsnxg3x64nqo",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg0lc600n3jsnxtngk4c46",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg0lc600n4jsnxthbeevcg",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg0lc600n5jsnxy9nn7ffw",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg0lc600n6jsnxp4xu305n",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg0lc600n7jsnxvcvwn1t0",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg0lc600n8jsnx4nfzrn9y",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg0lc600n9jsnxqy5b8lxg",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg0lc600najsnx4xaievdh",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg0lc600nbjsnxeven6tv1",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg0lc600ncjsnxom23iu38",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg0lc600ndjsnx6omv983d",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg0lc600nejsnx7sv6vwv3",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg0lc600nfjsnxj1jebghn",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg0lc600ngjsnx8s3pagyl",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg0lc600nhjsnxrnmwz58e",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg0lc600nijsnxh62u1prz",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg0lc600njjsnx4evdlmfz",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg0lc600nkjsnxy7j64trr",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg0lc600nljsnxs1wotm0v",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg0lc600nmjsnx4dhgtyxt",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg0lc600nnjsnxf8p2kf1l",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg0lc600nojsnx9z7vng9o",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg0lc600npjsnxpxcubiwf",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg0lc600nqjsnxqvif2iq8",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg0lc600nrjsnxq4kml2a3",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg0lc600nsjsnx6d12fngp",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg0lc600ntjsnxahprbwkx",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg0lc600nujsnx1a64njp6",
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg0qwj00nvjsnx0xuocbzd",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg0qwj00nwjsnxz2r2zowq",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg0qwj00nxjsnxd5nv76o4",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg0qwj00nyjsnx88ssb73v",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg0qwj00nzjsnxj3hfvl6e",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg0qwj00o0jsnxe5vsd8up",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg0qwj00o1jsnxgo7evijx",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg0qwj00o2jsnxle01t752",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg0qwj00o3jsnx6f6n31ju",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg0qwj00o4jsnxwwrza9bc",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg0qwj00o5jsnxiww8l41c",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg0qwj00o6jsnx7exgjxsm",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg0qwj00o7jsnx8zhwtryg",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg0qwj00o8jsnx0243jhqj",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg0qwj00o9jsnxnjnn3xeu",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg0qwj00oajsnxt0g61av1",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg0qwj00objsnxpcztte1e",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg0qwj00ocjsnxi9ezck6y",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg0qwj00odjsnxv5uqqu51",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg0qwj00oejsnxec650dju",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg0qwj00ofjsnx9l8r77k3",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg0qwj00ogjsnxntx4w696",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg0qwj00ohjsnx419ail0p",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg0qwj00oijsnxnvrw5bhs",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg0qwj00ojjsnxvnst8gf4",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg0qwj00okjsnxn58pevf3",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg0qwj00oljsnxom4u6srz",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg0qwj00omjsnxv0ewnlg0",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg0qwj00onjsnxutx7nus4",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg0qwj00oojsnx4n2u6zm1",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg0qwj00opjsnxoxjy2jmc",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg0qwj00oqjsnxhxuzvgg0",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg0qwj00orjsnxxmp7laq8",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg0qwj00osjsnxbi4jh43v",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg0qwj00otjsnxprh1iers",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg0qwj00oujsnx1hxq3kns",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg0qwj00ovjsnxezxtdxq1",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg0qwj00owjsnxcxe8nrem",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg0qwj00oxjsnxruon2oc7",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg0qwj00oyjsnx7mznjrcc",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg0qwj00ozjsnx33674mi9",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg0qwj00p0jsnxl7bi86hh",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg0qwj00p1jsnxb99s337o",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg0qwj00p2jsnxyz8x94x2",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg0qwj00p3jsnx5gezcdqt",
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg0wzk00p4jsnx085be692",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg0wzk00p5jsnxlfevtp8a",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg0wzk00p6jsnxngi4ea0u",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg0wzk00p7jsnx7fzxdqvy",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg0wzk00p8jsnx4upuyv5v",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg0wzk00p9jsnxo1n5kkuf",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg0wzk00pajsnxf3vn3uaa",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg0wzk00pbjsnx5mlt58h1",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg0wzk00pcjsnxvcji7ij3",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg0wzk00pdjsnxrqu6jfi3",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg0wzk00pejsnx2pkucemn",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg0wzk00pfjsnx540jz0lr",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg0wzk00pgjsnx0e1atn7j",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg0wzk00phjsnxke7vtop8",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg0wzk00pijsnx7b5mvqvl",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg0wzk00pjjsnxfq2z6rsl",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg0wzk00pkjsnx25mh0929",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg0wzk00pljsnxjn8rg0t4",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg0wzk00pmjsnx4zsvfj1a",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg0wzk00pnjsnxzpri26sr",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg0wzk00pojsnxv42fq8x4",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg0wzk00ppjsnxxbam63a8",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg0wzk00pqjsnx4ju1t8mh",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg0wzk00prjsnx1fmio53k",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg0wzk00psjsnxn96bhri6",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg0wzk00ptjsnxy3gb51df",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg0wzk00pujsnx6z40zllm",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg0wzk00pvjsnxgchfbaxd",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg0wzk00pwjsnxhka1m029",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg0wzk00pxjsnx2zfr5fmy",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg0wzk00pyjsnxb3elk8hi",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg0wzk00pzjsnxytsyrur6",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg0wzk00q0jsnxnuju803g",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg0wzk00q1jsnxjll9vwgl",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg0wzk00q2jsnx4e152n04",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg0wzk00q3jsnx7c8nf86e",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg0wzk00q4jsnxj1qvn3cp",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg0wzk00q5jsnxscnd1ysf",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg0wzk00q6jsnxegsdh135",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg0wzk00q7jsnxzblfcdev",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg0wzk00q8jsnx77iqf1jc",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg0wzk00q9jsnxj0k1ex7z",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg0wzk00qajsnxtzc0d3du",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg0wzk00qbjsnxr9eaymiq",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg0wzk00qcjsnx12bltywa",
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg1a1j00qdjsnxvz39ek53",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg1a1j00qejsnx9i90o4x5",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg1a1j00qfjsnx7ofsbcdy",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg1a1j00qgjsnxjzsethfa",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg1a1j00qhjsnx5wz03etf",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg1a1j00qijsnx0o81lqrf",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg1a1j00qjjsnxy2zdollg",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg1a1j00qkjsnxzh9cdikg",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg1a1j00qljsnxoa6yjab4",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg1a1j00qmjsnxfd0pfnq6",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg1a1j00qnjsnxdmlqnkcm",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg1a1j00qojsnxk357un1n",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg1a1j00qpjsnxqywe2kfx",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg1a1j00qqjsnx1gkrmkjc",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg1a1j00qrjsnxqm4ga72t",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg1a1j00qsjsnx5xva4ice",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg1a1j00qtjsnxxpc8uc6z",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg1a1j00qujsnxe4jd2hlo",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg1a1j00qvjsnx7ge26tuf",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg1a1j00qwjsnxwbi9xb4d",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg1a1j00qxjsnxml0y2bls",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg1a1j00qyjsnx2t3vicky",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg1a1j00qzjsnxzbi3jb4h",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg1a1j00r0jsnx9hobzp60",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg1a1j00r1jsnxf3srdghx",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg1a1j00r2jsnxdlk992w0",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg1a1j00r3jsnxvnf1qyon",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg1a1j00r4jsnxtiwclpl9",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg1a1j00r5jsnx4pa7mnla",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg1a1j00r6jsnx44tcvw3y",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg1a1j00r7jsnxjshf51e8",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg1a1j00r8jsnxolqkjywm",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg1a1j00r9jsnxwnfc78a1",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg1a1j00rajsnx8376jgpj",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg1a1j00rbjsnx3g8boef9",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg1a1j00rcjsnxhu1sav88",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg1a1j00rdjsnx5e46khg6",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg1a1j00rejsnxmrfyal4s",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg1a1k00rfjsnx9r4obi2x",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg1a1k00rgjsnx7x2q80bw",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg1a1k00rhjsnxrloyo5qm",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg1a1k00rijsnxsw961ejk",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg1a1k00rjjsnx1f405wh9",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg1a1k00rkjsnx6hb244qa",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg1a1k00rljsnxvd3j9bnn",
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg2szl00rmjsnxhcnp1b33",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg2szl00rnjsnxcmuobsdj",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg2szl00rojsnx1vtosi45",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg2szl00rpjsnx62tu7x2a",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg2szl00rqjsnxhphqz6ba",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg2szl00rrjsnxrk4tmn3m",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg2szl00rsjsnxkmdonidu",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg2szl00rtjsnx02bblqa5",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg2szl00rujsnxbwxbmh5b",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg2szl00rvjsnxdpocmpkn",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg2szl00rwjsnxlqt6t0gp",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg2szl00rxjsnx1t6ofjww",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg2szl00ryjsnx83l8r17i",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg2szl00rzjsnx9c9xmh03",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg2szl00s0jsnxenbvpgav",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg2szl00s1jsnxtrzivhal",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg2szl00s2jsnx6uneme8m",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg2szl00s3jsnx7dx92exv",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg2szl00s4jsnxc8miz60v",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg2szl00s5jsnxzye6fq2x",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg2szl00s6jsnxgwepiaun",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg2szl00s7jsnx8h81gu6m",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg2szl00s8jsnxr3abdqkm",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg2szl00s9jsnxbo9gbczn",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg2szl00sajsnxruh920pu",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg2szl00sbjsnxlqo05azq",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg2szl00scjsnxgik6057c",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg2szl00sdjsnxmgsdaa4t",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg2szl00sejsnx3fma8kpw",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg2szl00sfjsnxdeqiehjr",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg2szl00sgjsnxublsqfom",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg2szl00shjsnxk41adp4u",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg2szl00sijsnx34vl9iwp",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg2szl00sjjsnxwj6sqq65",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg2szl00skjsnxowa5gvv0",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg2szl00sljsnx2y5j3ykv",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg2szl00smjsnxik1izunj",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg2szl00snjsnx4lyjnt60",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg2szl00sojsnxz3hfucgz",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg2szl00spjsnxyoudx6so",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg2szl00sqjsnxkegfhh5h",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg2szl00srjsnx1yyr5hzv",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg2szl00ssjsnxwn58jsmi",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg2szl00stjsnxl1h5wjwa",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg2szl00sujsnx8qk5c3ut",
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg2xt900svjsnx6vzaakb3",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg2xt900swjsnxk8scpv7n",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg2xt900sxjsnxdb1o06bi",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg2xt900syjsnx622hmol4",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg2xt900szjsnxfv2fxj7q",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg2xt900t0jsnxevn79lm4",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg2xt900t1jsnxzfccwaqe",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg2xt900t2jsnx2z5zbwtr",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg2xt900t3jsnx0aw62mr7",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg2xt900t4jsnxu3twtvt1",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg2xt900t5jsnxta4wtark",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg2xt900t6jsnxpp0zm4ng",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg2xt900t7jsnxq72g4bxy",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg2xt900t8jsnx45qv8wk0",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg2xt900t9jsnxkhgisjr4",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg2xt900tajsnxz7zmtiu7",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg2xt900tbjsnxzo8hhaof",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg2xt900tcjsnxsv3dt3a1",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg2xt900tdjsnx0jm329ta",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg2xt900tejsnx9qwfsdq0",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg2xt900tfjsnx2ys525l4",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg2xt900tgjsnxjm47yjqd",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg2xt900thjsnxhiq44yfm",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg2xt900tijsnxt9o44dwp",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg2xt900tjjsnxt3ptp8x1",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg2xt900tkjsnxjmcb2hug",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg2xt900tljsnxqin1h21f",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg2xt900tmjsnx8751ojli",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg2xt900tnjsnx0h99s5ve",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg2xt900tojsnxp4zvcqk6",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg2xt900tpjsnxec21lmnr",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg2xt900tqjsnxnvq83iam",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg2xt900trjsnx5se4zs8x",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg2xt900tsjsnxirmkxbdt",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg2xt900ttjsnxke7vnyw7",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg2xt900tujsnx2xvhgi7y",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg2xt900tvjsnx942g2kfy",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg2xt900twjsnxf1jzhhzy",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg2xt900txjsnxez553e31",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg2xt900tyjsnxwme8kl3o",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg2xt900tzjsnxnyf8rp3e",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg2xt900u0jsnx9zf7y9i4",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg2xt900u1jsnx5kwmecqn",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg2xt900u2jsnxnxz7cpmz",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg2xt900u3jsnxhkd6fpmb",
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg32b300u4jsnx74sufwjh",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg32b300u5jsnx9994185v",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg32b300u6jsnx84onboz9",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg32b300u7jsnxkoxaf8ke",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg32b300u8jsnxafuyk574",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg32b300u9jsnxhw3200pf",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg32b300uajsnxn29kjj1p",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg32b300ubjsnxfjymmsnr",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg32b300ucjsnxffjet3i8",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg32b300udjsnx4u9ibgpj",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg32b300uejsnxjzxrj9xm",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg32b300ufjsnxf2pinn63",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg32b300ugjsnxb9lp6zed",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg32b300uhjsnxv5rtnmeh",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg32b300uijsnxrw50g9o4",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg32b300ujjsnxhy1q7vgk",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg32b300ukjsnxk0rn61x2",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg32b300uljsnxocyf9o93",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg32b300umjsnxdn4zhfmn",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg32b300unjsnx5u4r3y9x",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg32b300uojsnx2y2ydhw0",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg32b300upjsnxco4ccaul",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg32b300uqjsnx7b38r0dk",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg32b300urjsnxnpapny82",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg32b300usjsnx9osr0ux8",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg32b300utjsnxai22xq3s",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg32b300uujsnxyclqj0h2",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg32b300uvjsnxmjtso9tn",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg32b300uwjsnxkbg29kn9",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg32b300uxjsnxo4441vy1",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg32b300uyjsnxwlfywv6s",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg32b300uzjsnxc8gdykoj",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg32b300v0jsnxr62chrov",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg32b300v1jsnxsk4kkbh9",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg32b300v2jsnxrf85yaqa",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg32b300v3jsnxte6llb3j",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg32b300v4jsnxkiusrw4i",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg32b300v5jsnxm6qvwqm7",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg32b300v6jsnxgsxe6dyi",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg32b300v7jsnxwnqqwgaf",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg32b300v8jsnxl0yp4sxg",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg32b300v9jsnx53peuccs",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg32b300vajsnxc40zmu8q",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg32b300vbjsnx75bp8gbq",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg32b300vcjsnxvhjepml8",
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg37wb00vdjsnxa8ueehwe",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg37wb00vejsnx79xns6tu",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg37wb00vfjsnx2gvs6309",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg37wb00vgjsnx6az7zufe",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg37wb00vhjsnx1391iffn",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg37wb00vijsnxozyfnhli",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg37wb00vjjsnxe6ac4kp6",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg37wb00vkjsnx4yb9nw1m",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg37wb00vljsnx84n1slfm",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg37wb00vmjsnxwqhjd3sh",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg37wb00vnjsnx1jzwe24t",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg37wb00vojsnx4f2pc49x",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg37wb00vpjsnx7jef5fxg",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg37wb00vqjsnx0bx6kqde",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg37wb00vrjsnx7fwgco68",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg37wb00vsjsnx6hynfrj2",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg37wb00vtjsnxtmx0fr31",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg37wb00vujsnxs5edulvn",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg37wb00vvjsnxz0emdsvv",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg37wb00vwjsnx3uly39af",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg37wb00vxjsnx4i0jb3fh",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg37wb00vyjsnx3axgvfgh",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg37wb00vzjsnxpe7japi3",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg37wb00w0jsnxecxil0ya",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg37wb00w1jsnxgdod6avg",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg37wb00w2jsnxo8541qca",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg37wb00w3jsnxoil1ady8",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg37wb00w4jsnxgo41wjui",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg37wb00w5jsnxko8x06zr",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg37wb00w6jsnx1z86rsbq",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg37wb00w7jsnx3hwpwcf3",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg37wb00w8jsnxa4hm4bua",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg37wb00w9jsnx21e5s2kq",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg37wb00wajsnxh6oghssq",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg37wb00wbjsnxbp8n4mh3",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg37wb00wcjsnxqeiu499j",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg37wb00wdjsnxrm9y39ul",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg37wb00wejsnxszx2jddw",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg37wb00wfjsnxbdvu87a7",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg37wb00wgjsnx8dboxqmt",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg37wb00whjsnxt0tvek18",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg37wb00wijsnx5d3ydws1",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg37wb00wjjsnxg8cuwdox",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg37wb00wkjsnx6hsv1yu3",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg37wb00wljsnxlmpnte3m",
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg3dgt00wmjsnxes10khl3",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg3dgt00wnjsnxbqo08vss",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg3dgt00wojsnx267wsl5s",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg3dgt00wpjsnxej9u8dbr",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg3dgt00wqjsnxjrtv1pgn",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg3dgt00wrjsnx5vuvkp4j",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg3dgt00wsjsnx3ajhl9iv",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg3dgt00wtjsnxkob2mk4n",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg3dgt00wujsnx26cqvo4b",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg3dgt00wvjsnxdghi72x8",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg3dgt00wwjsnx41gdzufe",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg3dgt00wxjsnxnwh5tvtx",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg3dgt00wyjsnx9zr8k9dt",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg3dgt00wzjsnxctv9oedk",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg3dgt00x0jsnx1bmided3",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg3dgt00x1jsnxzv54byzr",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg3dgt00x2jsnxbtx8q90r",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg3dgt00x3jsnx7lehdrv5",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg3dgt00x4jsnx8i2vcdsh",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg3dgt00x5jsnxv5afbyrg",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg3dgt00x6jsnxl89y3sfo",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg3dgt00x7jsnxt37zr70g",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg3dgt00x8jsnx7zvkwzxu",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg3dgt00x9jsnxb0cl7td7",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg3dgt00xajsnxbw8qelfc",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg3dgt00xbjsnxra4ft4vy",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg3dgt00xcjsnx0ox8yso3",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg3dgt00xdjsnx3ttiz3nt",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg3dgt00xejsnxsb8tlb6g",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg3dgt00xfjsnx1ivg8rei",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg3dgt00xgjsnxjsuntwc0",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg3dgt00xhjsnxin7a7p72",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg3dgt00xijsnxx5z4qzbc",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg3dgt00xjjsnx2vnm99qv",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg3dgt00xkjsnx8marp62c",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg3dgt00xljsnx6nny5gpj",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg3dgt00xmjsnxhx1a1abs",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg3dgt00xnjsnxr8ikypnv",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg3dgt00xojsnxhpy44tp3",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg3dgt00xpjsnx48h3qub0",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg3dgt00xqjsnx8nx9vpee",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg3dgt00xrjsnxtu6v1ak6",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg3dgt00xsjsnxj65tev1h",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg3dgt00xtjsnx8huez4tg",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg3dgt00xujsnx8uszcfa2",
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg3mj000z4jsnx1wom99kd",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg3mj000z5jsnxdfegea3g",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg3mj000z6jsnxp5emaeye",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg3mj000z7jsnxyn6h6abz",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg3mj000z8jsnxjn30twb1",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg3mj000z9jsnxw9qtal8c",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg3mj000zajsnxen7142e1",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg3mj000zbjsnxii5cxe97",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg3mj000zcjsnxroaca2xa",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg3mj000zdjsnx4n295jy3",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg3mj000zejsnxx4y7xt85",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg3mj000zfjsnx7gihzouz",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg3mj000zgjsnxh41ckmqk",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg3mj000zhjsnxr0puayr5",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg3mj000zijsnxn0lbj0pu",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg3mj000zjjsnxp3bpattl",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg3mj000zkjsnxafmcl1ci",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg3mj000zljsnx30cmulty",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg3mj000zmjsnxcafqtkkm",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg3mj000znjsnxk1a68i6i",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg3mj000zojsnxu6in3vtd",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg3mj000zpjsnxhxgtcin1",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg3mj000zqjsnxm14xgqtr",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg3mj000zrjsnxq8t5r836",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg3mj000zsjsnxuntb1jkp",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg3mj000ztjsnxi552jzve",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg3mj000zujsnxvqz4uvz0",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg3mj000zvjsnx511w9yhn",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg3mj000zwjsnxk6xjc7mu",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg3mj000zxjsnxl9f0clcd",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg3mj000zyjsnxspvkwe8u",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg3mj000zzjsnxult8ol16",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg3mj00100jsnxnh36y4yh",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg3mj00101jsnxvcscj3y3",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg3mj00102jsnx2ek95pfn",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg3mj00103jsnxswf8slwy",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg3mj00104jsnxiuju85l6",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg3mj00105jsnx7hanhvfv",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg3mj00106jsnxq2v0da0t",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg3mj00107jsnxug3naww9",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg3mj00108jsnx3ebmyyse",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg3mj00109jsnxzt5uskht",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg3mj0010ajsnxpai60sal",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg3mj0010bjsnx4grvoonm",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg3mj0010cjsnxthqr0zah",
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    },
    {
      "id": "cmjhg3srz010djsnxr1kk0pn1",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uo70006jsielypypd0n",
    },
    {
      "id": "cmjhg3srz010ejsnx3x83sb3t",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76upb000ajsie3hcogxvy",
    },
    {
      "id": "cmjhg3srz010fjsnxqsn3tmq2",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uph000bjsierv1hjnj6",
    },
    {
      "id": "cmjhg3srz010gjsnxecmt6fjy",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76upn000cjsiekiwoxn4s",
    },
    {
      "id": "cmjhg3srz010hjsnx1etzir11",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76upv000djsieaoqlvlx4",
    },
    {
      "id": "cmjhg3srz010ijsnx31421k2v",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uq3000ejsieh5md11h1",
    },
    {
      "id": "cmjhg3srz010jjsnxukcao1ty",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uq9000fjsieyqei6yxk",
    },
    {
      "id": "cmjhg3srz010kjsnx6uc2m3bc",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uqd000gjsie3ouwn84p",
    },
    {
      "id": "cmjhg3srz010ljsnxgybwp6vg",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uqp000ijsie8wx2b03q",
    },
    {
      "id": "cmjhg3srz010mjsnxjfejacce",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uqv000jjsied22vb9h1",
    },
    {
      "id": "cmjhg3srz010njsnxhw07ib7p",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76urc000mjsievcb2o1q3",
    },
    {
      "id": "cmjhg3srz010ojsnxwaaylscf",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76urm000ojsie9i6uens7",
    },
    {
      "id": "cmjhg3srz010pjsnxg03qwaur",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76urv000qjsiefmyzpdgg",
    },
    {
      "id": "cmjhg3srz010qjsnxgwd8kaxy",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76urz000rjsiec5lspjuf",
    },
    {
      "id": "cmjhg3srz010rjsnxisk57uky",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76usd000ujsieo2c8qbsr",
    },
    {
      "id": "cmjhg3srz010sjsnxfluwmh4p",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76usi000vjsiela3z5gwx",
    },
    {
      "id": "cmjhg3srz010tjsnxlo8voz8b",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uso000wjsie8xwxyyhl",
    },
    {
      "id": "cmjhg3srz010ujsnxdx0bpvuf",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uss000xjsieg5s09qqw",
    },
    {
      "id": "cmjhg3srz010vjsnx4g8g7g3y",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76usx000yjsiel76mrf3q",
    },
    {
      "id": "cmjhg3srz010wjsnx2ioukfub",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76ut3000zjsiengrs0fey",
    },
    {
      "id": "cmjhg3srz010xjsnxuhbiuk3w",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76ut80010jsieuzo2odgg",
    },
    {
      "id": "cmjhg3srz010yjsnx66adzxnp",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76utd0011jsiez69hjwsl",
    },
    {
      "id": "cmjhg3srz010zjsnxn0xfep7e",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76utj0012jsieci4b8fss",
    },
    {
      "id": "cmjhg3srz0110jsnxo399x8br",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76utr0013jsie0u7qojwf",
    },
    {
      "id": "cmjhg3srz0111jsnx45i4k00s",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76utw0014jsiexni8sl3a",
    },
    {
      "id": "cmjhg3srz0112jsnxrbupfcgw",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uu30015jsiefwllun1i",
    },
    {
      "id": "cmjhg3srz0113jsnx48nx9vxr",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uu80016jsie2fjowpyk",
    },
    {
      "id": "cmjhg3srz0114jsnx6hu8bmhd",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uud0017jsiei0tsk16c",
    },
    {
      "id": "cmjhg3srz0115jsnxg77l8jk6",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uyp001yjsiegbm9805v",
    },
    {
      "id": "cmjhg3srz0116jsnxzsz6okbx",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uyv001zjsiel7cfuymc",
    },
    {
      "id": "cmjhg3srz0117jsnxuhej2qse",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uz90022jsiejgni3z3r",
    },
    {
      "id": "cmjhg3srz0118jsnxghf75t1n",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76uzo0024jsie0jlamd27",
    },
    {
      "id": "cmjhg3srz0119jsnx22mpppi8",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v1q002hjsiewnru9ufd",
    },
    {
      "id": "cmjhg3srz011ajsnx7h5h058a",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v1v002ijsiexx72lpq8",
    },
    {
      "id": "cmjhg3srz011bjsnxpremci99",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v21002jjsiej4m4n43u",
    },
    {
      "id": "cmjhg3srz011cjsnxoggqbjac",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v29002kjsiesdifd3u4",
    },
    {
      "id": "cmjhg3srz011djsnxmkn61jo5",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v2g002ljsie32el2ea5",
    },
    {
      "id": "cmjhg3srz011ejsnxkzae8k1z",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v2p002mjsiekgcoow0z",
    },
    {
      "id": "cmjhg3srz011fjsnxdtiqbi84",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v2x002njsie9vwhqayi",
    },
    {
      "id": "cmjhg3srz011gjsnx4bvf11vq",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v34002ojsiexylzwqcl",
    },
    {
      "id": "cmjhg3srz011hjsnxri3t16c0",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v640031jsiemxriz296",
    },
    {
      "id": "cmjhg3srz011ijsnx9z99o82z",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v6c0032jsieavspktz8",
    },
    {
      "id": "cmjhg3srz011jjsnxoev7occv",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v6p0034jsie0aecold6",
    },
    {
      "id": "cmjhg3srz011kjsnxkpgvx5d2",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v6y0035jsieua5ys3pn",
    },
    {
      "id": "cmjhg3srz011ljsnxf2nmxx8m",
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "permissionId": "cmjh76v780036jsiekp2pdpd4",
    }
  ],
  "user": [
    {
      "id": "00d33b46-3ff8-4c4b-8769-e5c9aff69e04",
      "username": "manager24",
      "phoneNumber": "251910000024",
      "password": hashedPassword,
      "roleId": "cmjciihoe0001jsc0fqm56l5u",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "03966033-4099-421b-b766-6aadfa7bc5f7",
      "username": "manager6",
      "phoneNumber": "251910000006",
      "password": hashedPassword,
      "roleId": "cmix4f7fv0015jsmve8j45rlg",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "03a02df9-0ec4-4b48-b86a-4b074aa409ee",
      "username": "manager3",
      "phoneNumber": "251910000003",
      "password": hashedPassword,
      "roleId": "cmix427xl000tjsmvj4jtd0wy",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "057547c7-2dd2-440c-a7f8-92159bcbdfcf",
      "username": "manager12",
      "phoneNumber": "251910000012",
      "password": hashedPassword,
      "roleId": "cmixqbp5a0005jsn7kqdr3dy8",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "1a81234b-8aa2-4668-a84f-2af3000f61c8",
      "username": "fayyaastaff",
      "phoneNumber": "251920000014",
      "password": hashedPassword,
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "1c6181ed-6bce-4c5c-b27d-084d9ca28606",
      "username": "addisnagaash_7548",
      "phoneNumber": "251934927548",
      "password": hashedPassword,
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "isActive": true,
      "phoneVerified": true,
    },
    {
      "id": "2e19400b-408e-48fa-845a-4e6121590f86",
      "username": "manager2",
      "phoneNumber": "251910000002",
      "password": hashedPassword,
      "roleId": "cmix40eyw000pjsmvu2zao9dy",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "317db05b-6566-4ea1-9cac-1199de666065",
      "username": "manager8",
      "phoneNumber": "251910000008",
      "password": hashedPassword,
      "roleId": "cmixk97zm0005jsoa33guagkb",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "3c320305-f2f8-4236-b71e-5a2847bfb6b0",
      "username": "manager",
      "phoneNumber": "251910000001",
      "password": hashedPassword,
      "roleId": "cmix3x7g8000ljsmvxx6a4mui",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "3fc75fa4-52ed-481f-9250-a2aa309fb9f9",
      "username": "manager22",
      "phoneNumber": "251910000022",
      "password": hashedPassword,
      "roleId": "cmjcj83h90009jsc0lvjniek1",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "4988eb73-73dc-4068-a098-c3dd9650dbfb",
      "username": "manager19",
      "phoneNumber": "251910000019",
      "password": hashedPassword,
      "roleId": "cmixqqbjq000xjsn79taubd2y",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "49e8f5ff-d7c3-4519-9112-ef80062780b0",
      "username": "admin3",
      "phoneNumber": "251900112239",
      "password": hashedPassword,
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "4a0a2f19-0f05-4f65-8230-a59eaef86b6c",
      "username": "manager5",
      "phoneNumber": "251910000005",
      "password": hashedPassword,
      "roleId": "cmix4dnyt0011jsmv3151p66h",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "54035188-a90c-4915-9f5d-ceb05529b3f4",
      "username": "manager20",
      "phoneNumber": "251910000020",
      "password": hashedPassword,
      "roleId": "cmixqvv1q0012jsn7lkppuv1b",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "54a38039-4aae-4a95-b898-7d35cccb7e8f",
      "username": "manager15",
      "phoneNumber": "251910000015",
      "password": hashedPassword,
      "roleId": "cmixqkini000hjsn76t9opcog",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "671a5c8d-bca6-4212-9c82-b14571ff469e",
      "username": "seidabdurehman_9866",
      "phoneNumber": "251934689866",
      "password": hashedPassword,
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "isActive": true,
      "phoneVerified": true,
    },
    {
      "id": "6b722204-a224-4ca8-a39f-943260b45692",
      "username": "manager11",
      "phoneNumber": "251910000011",
      "password": hashedPassword,
      "roleId": "cmixq8wjr0001jsn7b1bwnkz9",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "6c571fbe-b3d4-4179-8563-2a390d88f518",
      "username": "manager13",
      "phoneNumber": "251910000013",
      "password": hashedPassword,
      "roleId": "cmixqf1kn0009jsn7xqozuf6t",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "7c77f8b4-a145-48a9-99c2-1d3c9ca71f04",
      "username": "manager7",
      "phoneNumber": "251910000007",
      "password": hashedPassword,
      "roleId": "cmixk7tv90001jsoaanj1lrue",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "803c16b5-dfdb-40ff-9409-d4bcf94b5937",
      "username": "manager21",
      "phoneNumber": "251910000021",
      "password": hashedPassword,
      "roleId": "cmjcj6r660005jsc0o9nsji40",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "8de91ac8-7ba0-4c33-b5c6-aab17504d91b",
      "username": "manager4",
      "phoneNumber": "251910000004",
      "password": hashedPassword,
      "roleId": "cmix44qfr000xjsmv3eto671i",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "94af81f2-290c-48fe-8783-bc6f8220e2e3",
      "username": "manager9",
      "phoneNumber": "251910000009",
      "password": hashedPassword,
      "roleId": "cmixkaik60009jsoa4domcmj0",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "95f9bb7c-07e6-498d-917e-4a4a47f18cae",
      "username": "manager17",
      "phoneNumber": "251910000017",
      "password": hashedPassword,
      "roleId": "cmixqn9b6000pjsn7r5k4dfud",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "9a0d9d9a-4ebb-477d-97bd-e5ebfad8ea7f",
      "username": "fuadabdurahman_7199",
      "phoneNumber": "251910737199",
      "password": hashedPassword,
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "isActive": true,
      "phoneVerified": true,
    },
    {
      "id": "a143c76a-0e10-4c5e-9900-f74ae2ab78b4",
      "username": "manager14",
      "phoneNumber": "251910000014",
      "password": hashedPassword,
      "roleId": "cmixqh413000djsn794qlq7cm",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "aacf0873-50a6-4204-b2a8-29621f8e68be",
      "username": "admin",
      "phoneNumber": "251900112233",
      "password": hashedPassword,
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "b2999ba6-bda2-4248-9506-6edb04bb8da7",
      "username": "ahmadmuhammad_4215",
      "phoneNumber": "251918914215",
      "password": hashedPassword,
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "isActive": true,
      "phoneVerified": true,
    },
    {
      "id": "bd2a28a1-bef5-46d1-96ab-7b35e1d6bce9",
      "username": "staff1",
      "phoneNumber": "251920000004",
      "password": hashedPassword,
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "ddd14824-609b-4883-b6b2-e742fa79666b",
      "username": "customer",
      "phoneNumber": "251900112236",
      "password": hashedPassword,
      "roleId": "cmiwl33970003jsnogvq91lb2",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "de2b062a-3efa-4090-9390-4b1b46e45aa1",
      "username": "manager10",
      "phoneNumber": "251910000010",
      "password": hashedPassword,
      "roleId": "cmixkbt47000djsoada3l5ljc",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "e1ce808d-c5d0-4b18-9369-07615f154878",
      "username": "admin2",
      "phoneNumber": "251900112238",
      "password": hashedPassword,
      "roleId": "cmiwl338h0000jsnoikvgm780",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "ee9819f5-23a8-465b-8d99-13600a7a4b15",
      "username": "Staffnahenya",
      "phoneNumber": "251910000036",
      "password": hashedPassword,
      "roleId": "cmiwl338z0002jsnorjywaoi9",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "f4a0bb35-ee0e-4c5e-8ef9-1c6b62f865fc",
      "username": "manager18",
      "phoneNumber": "251910000018",
      "password": hashedPassword,
      "roleId": "cmixqolmv000tjsn73z9hlzz7",
      "isActive": true,
      "phoneVerified": false,
    },
    {
      "id": "f6c9dc47-6e64-4125-81fe-d4f1ccf63b44",
      "username": "manager16",
      "phoneNumber": "251910000016",
      "password": hashedPassword,
      "roleId": "cmixqlsr3000ljsn70jr1l89p",
      "isActive": true,
      "phoneVerified": false,
    }
  ],
  "staff": [
    {
      "id": "10db531b-bdce-4be8-afe7-3416340ff539",
      "userId": "ee9819f5-23a8-465b-8d99-13600a7a4b15",
      "officeId": "cmiwun4l6000ejsmvic2y9emc",
    },
    {
      "id": "6b414f29-cc4e-420c-adb5-fb2887b37a6a",
      "userId": "1a81234b-8aa2-4668-a84f-2af3000f61c8",
      "officeId": "cmiwtbrih0000jsmvxk1kww3f",
    },
    {
      "id": "b01174d5-8c27-4ba1-942f-2c76506a4862",
      "userId": "bd2a28a1-bef5-46d1-96ab-7b35e1d6bce9",
      "officeId": "cmiwuixeh000cjsmvdd516hqa",
    },
    {
      "id": "cmiwlcme80002jsp6pgv7h46q",
      "userId": "aacf0873-50a6-4204-b2a8-29621f8e68be",
      "officeId": "cmiwlbtt20000jsp6ch1mh3lp",
    },
    {
      "id": "cmix3xrwh000njsmvoq9p6omh",
      "userId": "3c320305-f2f8-4236-b71e-5a2847bfb6b0",
      "officeId": "cmiwua43n000ajsmvogq5fg4p",
    },
    {
      "id": "cmix40zya000rjsmvpc6hcukh",
      "userId": "2e19400b-408e-48fa-845a-4e6121590f86",
      "officeId": "cmiwucdsm000bjsmv0hkq50cy",
    },
    {
      "id": "cmix42i77000vjsmvghpx019c",
      "userId": "03a02df9-0ec4-4b48-b86a-4b074aa409ee",
      "officeId": "cmiwukmpq000djsmv89g4bk05",
    },
    {
      "id": "cmix462fm000zjsmvxagfg3hq",
      "userId": "8de91ac8-7ba0-4c33-b5c6-aab17504d91b",
      "officeId": "cmiwuixeh000cjsmvdd516hqa",
    },
    {
      "id": "cmix4do7d0013jsmv7kjuz10f",
      "userId": "4a0a2f19-0f05-4f65-8230-a59eaef86b6c",
      "officeId": "cmiwuv4ar000gjsmvn7thi4qz",
    },
    {
      "id": "cmix4fwob0017jsmvgod6dewb",
      "userId": "03966033-4099-421b-b766-6aadfa7bc5f7",
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "cmixk82xb0003jsoa1p588srm",
      "userId": "7c77f8b4-a145-48a9-99c2-1d3c9ca71f04",
      "officeId": "cmiwun4l6000ejsmvic2y9emc",
    },
    {
      "id": "cmixk9ifm0007jsoaet7zdvr4",
      "userId": "317db05b-6566-4ea1-9cac-1199de666065",
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "cmixkas8n000bjsoatjhiexmc",
      "userId": "94af81f2-290c-48fe-8783-bc6f8220e2e3",
      "officeId": "cmiwve9qh000hjsmv1ktd3i4r",
    },
    {
      "id": "cmixkcd77000fjsoanoyorz8h",
      "userId": "de2b062a-3efa-4090-9390-4b1b46e45aa1",
      "officeId": "cmiww0myi000jjsmvyhxxlz3o",
    },
    {
      "id": "cmixq94bn0003jsn7tputoylf",
      "userId": "6b722204-a224-4ca8-a39f-943260b45692",
      "officeId": "cmiwu4izk0008jsmve2lcslgp",
    },
    {
      "id": "cmixqbwd60007jsn7rtmbi2ta",
      "userId": "057547c7-2dd2-440c-a7f8-92159bcbdfcf",
      "officeId": "cmiwu7x6m0009jsmvjbc45zv5",
    },
    {
      "id": "cmixqfvbc000bjsn7gpuhi16v",
      "userId": "6c571fbe-b3d4-4179-8563-2a390d88f518",
      "officeId": "cmiwu1g5d0007jsmvkltn6oq3",
    },
    {
      "id": "cmixqhag0000fjsn7ac027ge2",
      "userId": "a143c76a-0e10-4c5e-9900-f74ae2ab78b4",
      "officeId": "cmiwtbrih0000jsmvxk1kww3f",
    },
    {
      "id": "cmixqkqqv000jjsn77j15onhj",
      "userId": "54a38039-4aae-4a95-b898-7d35cccb7e8f",
      "officeId": "cmiwtftvd0001jsmvnaiv0eka",
    },
    {
      "id": "cmixqm02o000njsn78uk65a59",
      "userId": "f6c9dc47-6e64-4125-81fe-d4f1ccf63b44",
      "officeId": "cmiwtiz420002jsmvzoblvc02",
    },
    {
      "id": "cmixqniif000rjsn7h6k462lc",
      "userId": "95f9bb7c-07e6-498d-917e-4a4a47f18cae",
      "officeId": "cmiwtl9ma0003jsmvqgo0nji3",
    },
    {
      "id": "cmixqov3a000vjsn7w3g5l6zh",
      "userId": "f4a0bb35-ee0e-4c5e-8ef9-1c6b62f865fc",
      "officeId": "cmiwtowsm0004jsmvphmlc4z5",
    },
    {
      "id": "cmixqqy7f000zjsn7ffsdqu7t",
      "userId": "4988eb73-73dc-4068-a098-c3dd9650dbfb",
      "officeId": "cmiwtrp780005jsmvjob5rfok",
    },
    {
      "id": "cmixqw2ez0014jsn7h5x2op2v",
      "userId": "54035188-a90c-4915-9f5d-ceb05529b3f4",
      "officeId": "cmixqur860010jsn7l58up53s",
    },
    {
      "id": "cmjciip2d0003jsc0ovcroukr",
      "userId": "00d33b46-3ff8-4c4b-8769-e5c9aff69e04",
      "officeId": "cmj6t45fm0008js06xip4001x",
    },
    {
      "id": "cmjcj735h0007jsc0qhkofab0",
      "userId": "803c16b5-dfdb-40ff-9409-d4bcf94b5937",
      "officeId": "cmj6syico0007js06qt4vpskb",
    },
    {
      "id": "cmjcj8aoa000bjsc0ohzv8c8y",
      "userId": "3fc75fa4-52ed-481f-9250-a2aa309fb9f9",
      "officeId": "cmj0g35y30000js4678hrglup",
    }
  ],
  "officeAvailability": [
    {
      "id": "cmiy04qmn0001js6b507w7f8x",
      "officeId": "cmiwlbtt20000jsp6ch1mh3lp",
      "defaultSchedule": {
        "0": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        },
        "1": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "2": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "3": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "4": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "5": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "6": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        }
      },
      "slotDuration": 30,
      "unavailableDateRanges": [],
      "unavailableDates": [],
      "dateOverrides": {},
    },
    {
      "id": "cmiycb1k00001jsnbqbouxc2z",
      "officeId": "cmiwtbrih0000jsmvxk1kww3f",
      "defaultSchedule": {
        "0": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        },
        "1": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "2": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "3": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "4": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "5": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "6": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        }
      },
      "slotDuration": 30,
      "unavailableDateRanges": [],
      "unavailableDates": [],
      "dateOverrides": {},
    },
    {
      "id": "cmj5hw3540003jsy7iioz0v03",
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
      "defaultSchedule": {
        "0": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        },
        "1": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "2": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "3": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "4": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "5": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "6": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        }
      },
      "slotDuration": 30,
      "unavailableDateRanges": [],
      "unavailableDates": [],
      "dateOverrides": {},
    },
    {
      "id": "cmj68bjbk0005js06co2d84sb",
      "officeId": "cmiwuixeh000cjsmvdd516hqa",
      "defaultSchedule": {
        "0": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        },
        "1": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "2": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "3": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "4": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "5": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "6": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        }
      },
      "slotDuration": 30,
      "unavailableDateRanges": [],
      "unavailableDates": [],
      "dateOverrides": {},
    },
    {
      "id": "cmjlzha9h0001js0r21k05x68",
      "officeId": "cmiww0myi000jjsmvyhxxlz3o",
      "defaultSchedule": {
        "0": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        },
        "1": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "2": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "3": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "4": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "5": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "6": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        }
      },
      "slotDuration": 30,
      "unavailableDateRanges": [],
      "unavailableDates": [],
      "dateOverrides": {},
    },
    {
      "id": "cmjxcmizf0001krxddmyrdgu8",
      "officeId": "cmj6t45fm0008js06xip4001x",
      "defaultSchedule": {
        "0": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        },
        "1": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "2": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "3": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "4": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "5": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "6": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        }
      },
      "slotDuration": 30,
      "unavailableDateRanges": [],
      "unavailableDates": [],
      "dateOverrides": {},
    },
    {
      "id": "cmpjv16kx0001krzq62wmcg6r",
      "officeId": "cmiwucdsm000bjsmv0hkq50cy",
      "defaultSchedule": {
        "0": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        },
        "1": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "2": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "3": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "4": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "5": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "6": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        }
      },
      "slotDuration": 30,
      "unavailableDateRanges": [],
      "unavailableDates": [],
      "dateOverrides": {},
    },
    {
      "id": "cmq17vkpo0003krzql2kvloh8",
      "officeId": "cmj0g35y30000js4678hrglup",
      "defaultSchedule": {
        "0": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        },
        "1": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "2": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "3": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "4": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "5": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "6": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        }
      },
      "slotDuration": 30,
      "unavailableDateRanges": [],
      "unavailableDates": [],
      "dateOverrides": {},
    },
    {
      "id": "cmq1zcvcv0005krzqwttl96a2",
      "officeId": "cmj6syico0007js06qt4vpskb",
      "defaultSchedule": {
        "0": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        },
        "1": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "2": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "3": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "4": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "5": {
          "end": "17:00",
          "start": "09:00",
          "available": true
        },
        "6": {
          "end": "17:00",
          "start": "09:00",
          "available": false
        }
      },
      "slotDuration": 30,
      "unavailableDateRanges": [],
      "unavailableDates": [],
      "dateOverrides": {},
    }
  ],
  "service": [
    {
      "id": "01f10b33-2c44-40c1-94d5-e8601272d08a",
      "name": "Xalayaa Deggarsaa Waldaalee Ijaarsa Irrattti Gurmaa'aniif Gara Waajjirra Konstraakshiniitti Barreessuu",
      "description": "xalayaa",
      "timeToTake": "Sa'aatii 1",
      "roomNumber": null,
      "officeId": "cmiwtftvd0001jsmvnaiv0eka",
    },
    {
      "id": "03861060-a202-432f-810e-3aab203188e1",
      "name": "Karoora addaa qophessuu",
      "description": "Karooraa waggaa mana hojii qophessuu .gabasaa adaa addaa",
      "timeToTake": "Guyaa 1",
      "roomNumber": null,
      "officeId": "cmiwun4l6000ejsmvic2y9emc",
    },
    {
      "id": "06659662-1aae-43dd-972a-260dee1f3ed8",
      "name": "Gaaffii Xalayaa Deggarsaa Akka Barreeffamuuf Dhufan ",
      "description": "Xalayaa Deggarsaa\n",
      "timeToTake": "Daqiiqaa 30 - Guyyaa 3",
      "roomNumber": null,
      "officeId": "cmiwun4l6000ejsmvic2y9emc",
    },
    {
      "id": "081af485-b176-46f4-8ec3-29bcc49508c9",
      "name": "Istaandardii hojii Garee Hoggansaa fi Qabeenya Nama ",
      "description": "this is ",
      "timeToTake": "guyyaa 1 fi sana oll",
      "roomNumber": null,
      "officeId": "cmiwlbtt20000jsp6ch1mh3lp",
    },
    {
      "id": "0851495e-b516-4e2b-a490-0f5e685f3b68",
      "name": "Ragaa Dhufe Qulqullessu  ",
      "description": "Qulqullessu ",
      "timeToTake": "Sa'aatii 1",
      "roomNumber": null,
      "officeId": "cmiwu1g5d0007jsmvkltn6oq3",
    },
    {
      "id": "0a8f009c-be2b-4176-b348-823d62060fc6",
      "name": "Gurmii Waldaalee Ijaarsa Mana Jireenyaa",
      "description": "Gurmii ",
      "timeToTake": "Torbaan 1",
      "roomNumber": null,
      "officeId": "cmiwtiz420002jsmvzoblvc02",
    },
    {
      "id": "13222ab3-b1e9-4c42-bc13-1ec42a00f89a",
      "name": "Haaroomsaa Hayyama Dhaabbillee Moottummaa ",
      "description": "Haaroomsa ",
      "timeToTake": "Torbaan 1",
      "roomNumber": null,
      "officeId": "cmiwtbrih0000jsmvxk1kww3f",
    },
    {
      "id": "179f8fae-275e-49c1-8ad9-ef10b33854c7",
      "name": "Bulchinsa Kontiraataa fi Hordoffi Ijaarsaa ",
      "description": "Bulchinsa Kontiraataa fi Hordoffi Ijaarsaa ",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwtiz420002jsmvzoblvc02",
    },
    {
      "id": "18c5c8f5-baa4-4e9b-bad7-7b49acd8ac62",
      "name": "Leenjii Dargaggotaa Kennu  ",
      "description": "LeenJii",
      "timeToTake": "Haala Ragaa Qabatamaa Abbaan Dhimmaa Fidee Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiwu4izk0008jsmve2lcslgp",
    },
    {
      "id": "1b87687c-254a-4160-a2da-a518520c19ae",
      "name": "Gaaffi Rammaddi Hoggantoota Hoggansarra Bu'an",
      "description": "Rammaddi",
      "timeToTake": "Haala Ragaa Qabatamaa Abbaan Dhimmaa Fidee Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiww0myi000jjsmvyhxxlz3o",
    },
    {
      "id": "1be5cfba-dcd7-46a4-bfee-a5f7b1abbb20",
      "name": "Walii Galtee Mallatteessuu ",
      "description": "Waligaltee ",
      "timeToTake": "Haala Ragaa Qabatamaa  Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiwtrp780005jsmvjob5rfok",
    },
    {
      "id": "1de5f168-0255-4599-8c53-c101ad0cdc96",
      "name": "Kaffaltii Mirkannessu  ",
      "description": "Kaffaltii",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwtrp780005jsmvjob5rfok",
    },
    {
      "id": "209fd0ea-5389-43aa-ad45-30eddd0c32ce",
      "name": "Qormaata Dirree  Kan Magaaala Kessaa Kan Yeroon Haaromsaa Irra Darbe Kennuu",
      "description": "Qormaata dirre",
      "timeToTake": "Daqiiqaa 35",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "22adc289-c497-4075-a931-35be5bc9f931",
      "name": "Xalayaa Deggarsaa Adda Addaa kennu ",
      "description": "Akkka Barbaachisumaatii",
      "timeToTake": "daqiiqaa 30 - guyyaa 2",
      "roomNumber": null,
      "officeId": "cmiwlbtt20000jsp6ch1mh3lp",
    },
    {
      "id": "26190bdc-9647-4d42-b06c-3f0b0fee3441",
      "name": "Xalayaa Deggarsaa Adda Addaa kennu ",
      "description": "Xalayaa",
      "timeToTake": "Haala Ragaa Qabatamaa Abbaan Dhimmaa Fidee Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiww0myi000jjsmvyhxxlz3o",
    },
    {
      "id": "28a3145d-6b17-4c63-a002-b0ccac96493e",
      "name": "NTGA Forjiidii fi NTGA Aanaan Tokko Baasii Godhe Aanaa biraatti Yoo Qabamee ",
      "description": "NTGA Forjiidii ",
      "timeToTake": "Guyyaa 3",
      "roomNumber": null,
      "officeId": "cmiwua43n000ajsmvogq5fg4p",
    },
    {
      "id": "29bedd98-d936-4203-984f-d1797be4ef0b",
      "name": "Xalayaa Deggarsaa Waldaalee Ijaarsa Guddinaa Sadaarkaa ibsu Gara Waajjirra Konstraakshiniitti Barreessuu",
      "description": "Xalayaa ",
      "timeToTake": "Guyyaa 5",
      "roomNumber": null,
      "officeId": "cmiwtftvd0001jsmvnaiv0eka",
    },
    {
      "id": "29f44708-f88f-4232-802a-95027d7de1fa",
      "name": "Kuufama Idaa Taaksii Sassaabsiisauu fiSeera Gibiraaf Taaksiii Kabachiisu Seeratti Kan Dhiyaatu A/Alangaaf Ragaa Dabarsu",
      "description": "Seera ",
      "timeToTake": "Torbaan 1",
      "roomNumber": null,
      "officeId": "cmiwtl9ma0003jsmvqgo0nji3",
    },
    {
      "id": "2dd72ac4-5d84-4aa7-9797-fce1fdcc8d8c",
      "name": "Iyyanno fi Eeru Fuudhuu ,Gocha Yakkaa Poolisii Wajjin Qorachuu fi Galmee Qorranna Irratti Murtii Abbaa Alangaa Kennun Murtii Kenname Hordofuu  ",
      "description": "Iyyaannoo , qorrannaa Fi murtiii ",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmj6t45fm0008js06xip4001x",
    },
    {
      "id": "2f8c6004-33ed-4115-a425-f4ba9c019409",
      "name": "Gaaffii Hojitti Deebi'uu Hojjeatotaa",
      "description": "Hojiitti Deebi'uu",
      "timeToTake": "Haala Ragaa Qabatamaa Abbaan Dhimmaa Fidee Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiww0myi000jjsmvyhxxlz3o",
    },
    {
      "id": "326d9f37-c2b5-4e91-89c1-e6d0cc9afa32",
      "name": "Misooma Qabeenya Inaarjii ",
      "description": "inaarjii",
      "timeToTake": "Daqiiqaa 15 ykn Guyyaaa 15",
      "roomNumber": null,
      "officeId": "cmiwtowsm0004jsmvphmlc4z5",
    },
    {
      "id": "335add8c-a208-43a5-a9df-4a75212e2e7d",
      "name": "Ragaa Odeffannoo Godinichaa ",
      "description": "odeffanno",
      "timeToTake": "Dhimmicha Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmj6syico0007js06qt4vpskb",
    },
    {
      "id": "355b1c52-08e5-461c-a4fb-fa0d0e0fa940",
      "name": "Murtii Lafaa IMX,WHG,Q/Bulaa,Abbaa Qabeenya Dhunfaa fi Dhaabbata PLC",
      "description": "Murtii Lafaa",
      "timeToTake": "Guyyaa 10 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "360087c9-2136-411d-a8f0-22df4d81bafa",
      "name": "Dizaayiniin Akka Mirkanaa'uu Taasisuu",
      "description": "Dizaayinii ",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwtrp780005jsmvjob5rfok",
    },
    {
      "id": "36830254-7603-49f4-80ac-14c0b9ca121c",
      "name": "Heyyama Waldaalee Geejjiba  G/Galeessaa Haara Kennu fi Haaroomsuu",
      "description": "Heyyama Waldaalee Geejjiba  G/Galeessaa Haara Kennu fi Haaroomsuu",
      "timeToTake": "Daqiiqaa 45",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
      "name": "Mirkanessa Sanada Dizaayini/Heyyama Ijaarsaa ; Mirkanessaanada Caalbaasi fi Bu'aa Caalbaasii ",
      "description": "Mirkanessa Sanada Dizaayini/Heyyama Ijaarsaa",
      "timeToTake": "Guyyaa  3-5",
      "roomNumber": null,
      "officeId": "cmiwve9qh000hjsmv1ktd3i4r",
    },
    {
      "id": "392c931c-c5e1-47db-ae80-186d2a96cce5",
      "name": "Heyyama Waldaalee Geejjibaa Deddebisaa Ummataa Haara Kennu fi Haaromsuu",
      "description": "Heyyamaa fi Haroomsa\n",
      "timeToTake": "Daqiiqaa 45",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "39b83cb7-dabf-4bcd-8903-34c535d9fa81",
      "name": "Qaaama Seerummaa WIBJ Kennu ",
      "description": "qaama seerrumma",
      "timeToTake": "Guyyaa 15",
      "roomNumber": null,
      "officeId": "cmiwu7x6m0009jsmvjbc45zv5",
    },
    {
      "id": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
      "name": "Heyyama Waldalee Fe'uumsa Gogaa Gurmessu fi  Haaromsuu",
      "description": "Gurmessu fi Haaromsuu",
      "timeToTake": "Daqiiqaa 45",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "43ca0fb2-44c7-4a33-a447-02ab02a49663",
      "name": "Eeruumsa  Midiiyaa Kennu ",
      "description": "Eeruu",
      "timeToTake": "Battalumatti",
      "roomNumber": null,
      "officeId": "cmj6syico0007js06qt4vpskb",
    },
    {
      "id": "450a78c4-1776-4dc5-9850-8f5062013f5b",
      "name": "Koomii fi Wal-Dhabde Daangaa Hayyammaa",
      "description": "Koomii fi Wal-Dhabdee",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwua43n000ajsmvogq5fg4p",
    },
    {
      "id": "4654175b-4cef-4637-9803-77fcdfbe2cf8",
      "name": "Gaaffi Hayyama Qaccarrii Manneen Hojii Irraa dhufu",
      "description": "Qaccarri",
      "timeToTake": "Haala Ragaa Qabatamaa Abbaan Dhimmaa Fidee Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiww0myi000jjsmvyhxxlz3o",
    },
    {
      "id": "4b6c3fc8-d4f9-4d78-8975-8fe6ceb70e92",
      "name": "Waldorggommi Ispoortii Gaggeessuu",
      "description": "Waldorgommi",
      "timeToTake": "Haala Ragaa Qabatamaa  Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiwu4izk0008jsmve2lcslgp",
    },
    {
      "id": "4d5c048b-8d64-46e1-90a4-1bd904943795",
      "name": "Ragaa Abbaa Qabenyummaa(libree) Badee Bakka Busuu ",
      "description": "LIbree",
      "timeToTake": "Daqiiqaa 35",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "4d846a21-e5f8-49f2-a967-d3a94fdf8864",
      "name": "Sanadnii Caalbaasii Akka Qophaa'uuf Qaama Dhimmi Ilaallatuuf Erguu ",
      "description": "Sanada Caalbaasii ",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwtrp780005jsmvjob5rfok",
    },
    {
      "id": "4eff135e-2db7-40b7-acaa-98ab47190114",
      "name": "Hojii Dhiyeessi fi Raabsaa ,Idaa fi Liqii Callaa Guddistuu Deebisisuu",
      "description": "Callaa Guddistuu",
      "timeToTake": "Torbaan 1",
      "roomNumber": null,
      "officeId": "cmixqur860010jsn7l58up53s",
    },
    {
      "id": "4f58f171-0956-48f5-a997-f1e50bf6a311",
      "name": "Dubartoota hojiiwwaan madda galli argamsiisan irratti hirmaachisuu",
      "description": "dubbartoota hojii madda gallii argamsisaan irratti hirmachisuu addaa basuu",
      "timeToTake": "guyyaa 5 fi sana ol",
      "roomNumber": null,
      "officeId": "cmiwuixeh000cjsmvdd516hqa",
    },
    {
      "id": "501f51e5-9844-428f-b021-769667aaa312",
      "name": "Sagantaa Bobbii Ji'aan Mirkanessufi Hordofu Kan Guyyaa 30",
      "description": "Bobbii",
      "timeToTake": "Daqiiqaa 45",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "514a02c8-6986-4155-a199-edfd734ae0f8",
      "name": "Koomii Gibiraa fi Taksii Akkasumas Xalayaa Adda Addaa Qaama Dhimmi Ilaaluuf Qajeelchuu",
      "description": "Koomii fi Xalayaa",
      "timeToTake": "Guyyaa 1 ",
      "roomNumber": null,
      "officeId": "cmiwtl9ma0003jsmvqgo0nji3",
    },
    {
      "id": "549854a7-c1ae-4899-93a7-89854f339890",
      "name": "Odiiti Gochuu",
      "description": "Odiiti",
      "timeToTake": "Torbaan 1",
      "roomNumber": null,
      "officeId": "cmixqur860010jsn7l58up53s",
    },
    {
      "id": "57e54c18-bf04-4052-8156-686b4cf06687",
      "name": "Garee Qophii Dizaayinii",
      "description": "Dizaayinii",
      "timeToTake": "Guyyaa 10 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwtiz420002jsmvzoblvc02",
    },
    {
      "id": "58edfa34-0e84-419e-95fe-f4af36bc1099",
      "name": "Kaffaltii Hayyamaa Argachuu ",
      "description": "Hayyama Albuudaa",
      "timeToTake": "Guyyaa 3",
      "roomNumber": null,
      "officeId": "cmiwua43n000ajsmvogq5fg4p",
    },
    {
      "id": "5b83e2e7-aa86-480b-8b57-eeec355d1b03",
      "name": "Ragaa Konkolaataa Daataa Automation Galchuu",
      "description": "Data Automation",
      "timeToTake": "Daqiiqaa 35",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "5d7158db-5005-48de-87e3-41de50e24521",
      "name": "Murtii Lafaa IMX,WHG,Q/Bulaa,Abbaa Qabeenya Dhunfaa fi Dhaabbata PLC",
      "description": "Murtii Lafaa",
      "timeToTake": "Guyyaa 10 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "601e4598-e1aa-4804-abc8-6d0b7cc08fd6",
      "name": "Garee Inspeekshinii , Madaalli fi Sadarkessu",
      "description": "Madaalli",
      "timeToTake": "Haala Ragaa Qabatamaa Abbaan Dhimmaa Fidee Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmixqur860010jsn7l58up53s",
    },
    {
      "id": "65e1c5c6-dd89-4fba-b71b-666b0581a236",
      "name": "Leenjii Oggummaa Ispoortii Kennu ",
      "description": "Leenjii",
      "timeToTake": "Haala Ragaa Qabatamaa Abbaan Dhimmaa Fidee Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiwu4izk0008jsmve2lcslgp",
    },
    {
      "id": "6695f1d1-d96b-49cd-bda2-1bc4a9caaee0",
      "name": "Istaandaardii Hojii Ademsaa Hordoffi Rawwii Imaammmattaa fi Tarsimoo fi Dinaagdee",
      "description": "Karoora Gaggeessu , Xinxaluu fi Kallattiwwan Hoggansa Ol'aanaan Kayamaan Hojii irra olchuu fi Rawwatamuu Mirkanessu",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwlbtt20000jsp6ch1mh3lp",
    },
    {
      "id": "66ab7e77-f7a4-4b6c-8200-6941164d4fc0",
      "name": "Xalayaa Deggaarsaa Wallitti Hidhamiinsa Gabaa Waldaalee IMXf Barreessuu",
      "description": "xalayaa",
      "timeToTake": "Sa'aatii 1",
      "roomNumber": null,
      "officeId": "cmiwtftvd0001jsmvnaiv0eka",
    },
    {
      "id": "6b291339-4335-45fd-af55-0c7ecbd60474",
      "name": "Gaaffii Suphaa Iskiimii Kessummessu",
      "description": "Gaaffi Fuudhuu",
      "timeToTake": "Daqiiqaa 5",
      "roomNumber": null,
      "officeId": "cmiwu7x6m0009jsmvjbc45zv5",
    },
    {
      "id": "6fdde07d-81f5-4040-be9b-767cc0215f40",
      "name": "Heyyama Oppireetaraa Konkoolaataa Ummataa Haaromsuu fi Heyyama Oppireetaraa Konkoolaataa  Deddebisaa Ummataa  Haaroomsuu",
      "description": "Heyyama  Oppireetaraa",
      "timeToTake": "Daqiiqaa 45",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "71e8c566-9c54-4933-b8a8-a89ed4b2a99d",
      "name": "(NTGA)Nagahee To'anno Gurgurtaa Albuudaa Gaaffi Dhiyaatu ",
      "description": "(NTGA)",
      "timeToTake": "Guyyaa 3",
      "roomNumber": null,
      "officeId": "cmiwua43n000ajsmvogq5fg4p",
    },
    {
      "id": "7472e7c7-c839-484c-bf6e-49b4a5fdc864",
      "name": "Simmannaa Taatewwanni Taasisuu",
      "description": "Simmanaa",
      "timeToTake": "Sa'aatii 1",
      "roomNumber": null,
      "officeId": "cmiwu1g5d0007jsmvkltn6oq3",
    },
    {
      "id": "753ad252-2ed5-4da9-89ea-4203a744db49",
      "name": "Oduu Midiyaa Hawaasaa",
      "description": "Oduu",
      "timeToTake": "Dhimmicha Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmj6syico0007js06qt4vpskb",
    },
    {
      "id": "7bbfae6e-b6ff-403b-82bb-6d5b12319158",
      "name": "Kaappitaala Guddisuuu,Qussannaa fi Liqii kennu Akkasumas Debisiisuu",
      "description": "Liqiif Qussannaa",
      "timeToTake": "Torbaan 1",
      "roomNumber": null,
      "officeId": "cmixqur860010jsn7l58up53s",
    },
    {
      "id": "824e2b8b-e831-4541-9a45-2a54ae9b0c4c",
      "name": "Jijjirraa Faayilaa Gara Naannoo Biraa Taasifamuu ; Siimannaa Faayilaa ;Xalayaa Adda Addaa fi JIjjirraa Maqaa Mana Murtuii Gaggeessu ",
      "description": "Jijjiraa fi Simmannaa Faayilaa",
      "timeToTake": "Daqiiqaa 35",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "82e60402-e65b-48c5-acc1-e95cb62186f9",
      "name": "Sirrumma Ragaa Mirkannessu ",
      "description": "Sirrummaa",
      "timeToTake": "Sa'aatii 1",
      "roomNumber": null,
      "officeId": "cmiwu1g5d0007jsmvkltn6oq3",
    },
    {
      "id": "84352a7b-79a1-444e-a100-22d5c4dabb46",
      "name": "Ragiicha Daangaa Turtiin Adda Baasuu",
      "description": "Daangaa Turtii",
      "timeToTake": "Sa'aatii 1",
      "roomNumber": null,
      "officeId": "cmiwu1g5d0007jsmvkltn6oq3",
    },
    {
      "id": "845ed3fe-f137-4693-b80b-652b10249918",
      "name": "Hayyamma Oggummaa Haaroomsuu ",
      "description": "Haaroomsa",
      "timeToTake": "Guyyaa 4",
      "roomNumber": null,
      "officeId": "cmiwtbrih0000jsmvxk1kww3f",
    },
    {
      "id": "8529fa35-d948-48c0-85ad-7f1723ca7293",
      "name": "Mirkaneessa  Sanadaa fi Kennaa Hayyamaa",
      "description": "Sanadaa fi Hayyama",
      "timeToTake": "Daqiiqaa 10- Guyyaa 1",
      "roomNumber": null,
      "officeId": "cmj6t45fm0008js06xip4001x",
    },
    {
      "id": "86396516-cf9c-4876-9bd7-4af29ca82637",
      "name": "Adeemsa Garee Karoora , Hordofi , Gamaaggamaa fi Baajataa",
      "description": "Karoora Baajataa  Qopheessu Hordoffi Gaggessu \nGabaasaa fi Gamaggamma Raawwii karooraa gaggeessu ",
      "timeToTake": "Torbaan Tokko",
      "roomNumber": null,
      "officeId": "cmiwlbtt20000jsp6ch1mh3lp",
    },
    {
      "id": "86f3511e-648a-4e91-a791-9401dc15eab1",
      "name": "Hayyama Dhabbillee Dhunfaa Haaromfachuu",
      "description": "Haaroomsa Hayyamma Dhabbata Dhunfaaa",
      "timeToTake": "Torbaan 1",
      "roomNumber": null,
      "officeId": "cmiwtbrih0000jsmvxk1kww3f",
    },
    {
      "id": "88a011fc-6c83-4a49-b750-5a61d06dc797",
      "name": "Gaaffi Ce'uumsa Qonnan Bulaa Irraa Gara Investimantti",
      "description": "Ce'uumsaa",
      "timeToTake": "Guyyaa 3",
      "roomNumber": null,
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "8cc00cb2-c8a4-47c0-8849-32ce6291f8bc",
      "name": "Sassaabi Galii Mottummaa ",
      "description": "Galii",
      "timeToTake": "Sa'aatii 5",
      "roomNumber": null,
      "officeId": "cmiwtl9ma0003jsmvqgo0nji3",
    },
    {
      "id": "8dae1245-4642-4d15-a338-52e88e21bc18",
      "name": "Xalayaa Deggarsaa Wirtuu Lenjii fi Oggummaa Ispoortiif Kennu",
      "description": "Xalayaa",
      "timeToTake": "Dhimmicha Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiwu4izk0008jsmve2lcslgp",
    },
    {
      "id": "928edd8e-1ed2-4b28-a73e-6f1a12028b2d",
      "name": "Heyyama Oppireetarummaa  Kenna Tajaajila  Geejiba Deddebisaa Fee'uumsa Haaraa  Kennuu fi Heyyama Oppireetarummaa  Kenna Tajaajila  Geejiba Deddebisaa Fee'uumsa Buleeyyi Haaromsuu",
      "description": "Heyyama Oppiretarumma ",
      "timeToTake": "Daqiiqaa 45",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "94fe6660-e196-4d3f-a3b6-1c614d41f439",
      "name": "Hayyamma Laamineshinii Haaroomsuu fi Abbaa Dabtaraa  Guyyaa 1 - Waggaa 10 Irra Darbee",
      "description": "Heyyama  Laamineshinii ",
      "timeToTake": "Daqiiqaa 30",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "952fe9ae-b0c7-4e7c-89e3-be4914fb40b7",
      "name": "Xalayaa Deggarsaa Waldaalee Ijaarsa Guddinaa Sadaarkaa ibsu Gara Waajjirra Konstraakshiniitti Barreessuu",
      "description": "Xalayaa ",
      "timeToTake": "Guyyaa 5",
      "roomNumber": null,
      "officeId": "cmiwtftvd0001jsmvnaiv0eka",
    },
    {
      "id": "95f58ca9-0fae-4aba-a5f3-f1a8819ac173",
      "name": "Tilmaama Gatii Konkolaataa Raawwachisuu",
      "description": "Tilmaama",
      "timeToTake": "Daqiiqaa 35",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "964a9011-c8e8-4b27-b773-67f83af9aff6",
      "name": "Murtii Lafaa IMX,WHG,Q/Bulaa,Abbaa Qabeenya Dhunfaa fi Dhaabbata PLC",
      "description": "Murtii Lafaa",
      "timeToTake": "Guyyaa 10 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "976f2107-33f7-4529-a1a9-da874364f973",
      "name": "Gaaffi Suphaa Paampii Dhiyaatu",
      "description": "Gaaffi Suphaa",
      "timeToTake": "Daqiiqaa 5",
      "roomNumber": null,
      "officeId": "cmiwu7x6m0009jsmvjbc45zv5",
    },
    {
      "id": "9a8ac3f2-0606-4c3b-bb05-217248b68f89",
      "name": "Galmeewwan Investigeeshini fi Mirkanno Qulqullina Gochuun GaraaGarummaa Argame Kaffalchisuu",
      "description": "Ivestigeshini fi Mirkanoo",
      "timeToTake": "Guyyaa 3",
      "roomNumber": null,
      "officeId": "cmiwtl9ma0003jsmvqgo0nji3",
    },
    {
      "id": "9d4a7897-4c04-4626-92cf-e772d4776368",
      "name": "Kennaa Waraqaa Ragaa Abbaa Qabbiyyumma Lafa Investmantii (Haaraa)",
      "description": "Lafa Haaraa",
      "timeToTake": "Torbaan 1",
      "roomNumber": null,
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "9f9afed5-a7e0-463e-8c63-e37c3ed27f74",
      "name": "Eeruu fi Komii Hawaasa ",
      "description": "Eeruu fi Komii",
      "timeToTake": "Daqiiqaa 5",
      "roomNumber": null,
      "officeId": "cmiww0myi000jjsmvyhxxlz3o",
    },
    {
      "id": "a4172090-d35f-44d6-9c8f-a4fe62dfcbb7",
      "name": "Qoranno fi Dizaayinii Bishaan Dhugaatii",
      "description": "Qorannoo fi Dizaayinii",
      "timeToTake": "Daqiiqaa 30",
      "roomNumber": null,
      "officeId": "cmiwtowsm0004jsmvphmlc4z5",
    },
    {
      "id": "a61909fb-89ff-4e99-923f-922b36c0f8db",
      "name": "Sassaabbi Omisha Midhaanii ,Kuduuraa fi Muduuraa Gabaaf Dhiyessu",
      "description": "Sassaabbi ",
      "timeToTake": "Haala Ragaa Qabatamaa Abbaan Dhimmaa Fidee Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmixqur860010jsn7l58up53s",
    },
    {
      "id": "aa46f53c-01b5-4b51-a0bb-0d4e255e8164",
      "name": "Dhorkaa Adda Addaa Galmessu fi Haquu",
      "description": "Galmeessu fi Haquu",
      "timeToTake": "Torbaan 1",
      "roomNumber": null,
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "b0ffb9b2-83f1-4d29-aa51-728eb37c7cc5",
      "name": "Yakkoota  Malaanmaltummaa fi Taaksiii",
      "description": "malaanmaltummaa\n",
      "timeToTake": "Guyyaa 20 -ji'a 3",
      "roomNumber": null,
      "officeId": "cmj6t45fm0008js06xip4001x",
    },
    {
      "id": "b527d5a0-1f08-4c9b-b905-9ae5b431b70c",
      "name": "waldaalee Itti Fayyadamtoota Bishaan Jallisii (WIBJ) Gurmesssu",
      "description": "Itti Fayyadamtoota Bishaani",
      "timeToTake": "Guyyaa 3",
      "roomNumber": null,
      "officeId": "cmiwu7x6m0009jsmvjbc45zv5",
    },
    {
      "id": "bd07182b-e95c-426f-9ddc-522c6c851b5b",
      "name": "Bulchinsa Qabeenya Bishaanii ",
      "description": "Kennaa Hayyamaa \n",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwtowsm0004jsmvphmlc4z5",
    },
    {
      "id": "be39f394-53ee-497f-b39d-4d191bcaf357",
      "name": "JIjjirraa Hojjattootaa",
      "description": "Jijjirraa",
      "timeToTake": "Haala Ragaa Qabatamaa Abbaan Dhimmaa Fidee Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiww0myi000jjsmvyhxxlz3o",
    },
    {
      "id": "c0b7148a-2d2b-4341-bc17-c9d60b460047",
      "name": "Dubbartota Tajajila dhufan fayyadamtoota liiqii nanna'a manahojii tasisuu",
      "description": "Qamolle harka qalayiifi liiqii argachuu mallan adda basuu",
      "timeToTake": "guyyaa 2 fi sana oll",
      "roomNumber": null,
      "officeId": "cmiwuixeh000cjsmvdd516hqa",
    },
    {
      "id": "c13f72f3-4334-4047-8d2f-a3999f412b85",
      "name": "Istaandaardii Hojii Hordoffi Dagaagina Naamusaa fi Farra Malaammalttumma  ",
      "description": "Qo'aannoo Battalaa Gaggessu \nQabeenya Qisaasamee Akka Debi'uu gochuu\nEeruu Fudhachuun Furmaata  Kennu \n",
      "timeToTake": "Guyyaa 10 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwlbtt20000jsp6ch1mh3lp",
    },
    {
      "id": "c17b9a58-3905-4aaa-ad84-96d017177013",
      "name": "Ragaa Baruumsaa , Hayyamma Oggummaa Basuu fi Muxxannoo Hojii Barreessuu",
      "description": "Ragaa Baruumsaa\nHayyamma Oggummaa \nMuxxanno Hojii \n",
      "timeToTake": "Torbaan 1",
      "roomNumber": null,
      "officeId": "cmiwtbrih0000jsmvxk1kww3f",
    },
    {
      "id": "c5f0fb23-c51a-48e8-a5aa-88965a3144a7",
      "name": "Istaandaardii Hojii Adeemsa Iyyannoo fi Komii Ummataa",
      "description": "Hubanno Kennu \nKomiwwaan Kessumessuu , Sakkata'uu , \nKenna  Tajaajila Mannen Hojii  Mootumma qorachuu\nHojii Irra Olmaa Murtewwaan Bulchinsaa Hordofuu\n",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwlbtt20000jsp6ch1mh3lp",
    },
    {
      "id": "c6554f1b-3970-45ca-9d1a-f4a0f92de745",
      "name": "Kaartaa Lafa Albuudaa Kaasu",
      "description": "Kaartaa",
      "timeToTake": "Guyyaa 3",
      "roomNumber": null,
      "officeId": "cmiwua43n000ajsmvogq5fg4p",
    },
    {
      "id": "c7e20280-6746-4edb-9a7c-8ff29c324eea",
      "name": "Galmeessa fi Sakatta'a  Konkolaataa Haaraa ",
      "description": "Galmeessa fi Sakatta'a  Konkolaataa Haaraa ",
      "timeToTake": "Sa'atii 1",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "c8f335a2-25f3-479a-b8c9-50e5297f8a34",
      "name": "Bulchinsa Dhaabbilee Bishaan Dhugaati fi Suphaa Bishaani ",
      "description": "Bulchinsaa fi Suphaa\n",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwtowsm0004jsmvphmlc4z5",
    },
    {
      "id": "cb0b7afc-8097-46bf-9572-00de031d8e64",
      "name": "Gaaffii fi Komii Raabsa Bishaani",
      "description": "Gaaffii fi Koomii",
      "timeToTake": "Daqiiqaa 3",
      "roomNumber": null,
      "officeId": "cmiwu7x6m0009jsmvjbc45zv5",
    },
    {
      "id": "cc35c70f-05df-4e13-bdd2-8d3cccde6fa0",
      "name": "Falmii Himata Kallatti ,Mirga Wabii , Ol-iyyanno fi Komii Gaggessu ",
      "description": "falmii fi komii",
      "timeToTake": "Guyyaa 1 YKN Bellama MM",
      "roomNumber": null,
      "officeId": "cmj6t45fm0008js06xip4001x",
    },
    {
      "id": "d15e78a5-15da-47f8-a165-aa7a1f61657c",
      "name": "Galmeewwan Odiitii Taaksii fi Murttiwwan Taaksii Adda addaa Raawwachuu",
      "description": "Murtii Taaksii",
      "timeToTake": "Guyyaa 3 ",
      "roomNumber": null,
      "officeId": "cmiwtl9ma0003jsmvqgo0nji3",
    },
    {
      "id": "d1a85619-efba-497c-b854-a47a8c66b3c2",
      "name": "Jijjirra Abbaa Qabbiyyummaa Lafa Investmentii Gaaggessu",
      "description": "Abbaa Qabbiyyummaa",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "d3f1698a-579c-4dab-acab-c2d526569448",
      "name": "Waldaa Gumessuu ,Qaama Seerrummaa Kennu fi Haaromsuu",
      "description": "Glmee fi Haaroomsa",
      "timeToTake": "Guyyaa 3",
      "roomNumber": null,
      "officeId": "cmixqur860010jsn7l58up53s",
    },
    {
      "id": "d78c9717-9361-4383-8009-ff4b4766efbf",
      "name": "Hayyama Haaromee Kennu fi Raabsuu ; Heyyama Konkolaachsaa Bade Bakka Buusu",
      "description": "Heyyama Haaroome kennu fi raabsuu  ; Bade bBkka Busuu",
      "timeToTake": "Daqiiqaa 30",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "dbc68074-704e-4de2-9510-e34f3cc50ca8",
      "name": "Gaazexaa Maxxansiisuu ",
      "description": "Gaazexaa",
      "timeToTake": "Guyyaa 1 ykn Akka Barbaachisummaa Isaatti",
      "roomNumber": null,
      "officeId": "cmj6syico0007js06qt4vpskb",
    },
    {
      "id": "dbf0a495-0321-4d28-8b87-7770642faa02",
      "name": "Ajaja Mana Murti Irraa fi Qaama Seerrumaa Qabu Irraa  Dhufe Simachuu",
      "description": "Ajaja",
      "timeToTake": "Guyyaa 1",
      "roomNumber": null,
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "e00f6d6f-3a4a-4e55-8ddd-6f5b2727a5cd",
      "name": "Komii ,Iyyannoo fi Gaaffii Nageenya",
      "description": "Komii ,Iyyannoo fi Gaaffii Nageenyaa Ilachisee Dhiyaatuu",
      "timeToTake": "Daqiiqaa 30",
      "roomNumber": null,
      "officeId": "cmiwun4l6000ejsmvic2y9emc",
    },
    {
      "id": "e0408764-e6bd-4c00-bd69-074fdd206c15",
      "name": "Galmee Dhorkaa Rawwachuu ; Jijjirraa Kuusaa Konkolaataa Raawwachuu ; Boolloo /Maxxantuu/2018 kennuu fi Gabatee Badee Bakka Busu",
      "description": "Galmee ; JIjjiraa ; Bolloo fi Gabatee ",
      "timeToTake": "Daqiiqaa 40",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    },
    {
      "id": "e56aadd7-c402-4428-a302-acb1fc4e87eb",
      "name": "NID fi Lakk TIN Kennu",
      "description": "NID fi TIN",
      "timeToTake": "Guyyaa 1",
      "roomNumber": null,
      "officeId": "cmiwtl9ma0003jsmvqgo0nji3",
    },
    {
      "id": "e6fff1c2-a36a-414c-9256-1dafa2a979be",
      "name": "Dubartoonni GWG fi GQL ijaraaman ceesisuu ,maykiroo faayinaansiin wal-qabsiisuu fi deeggaru",
      "description": "dubbartota gurmainsan ala jiran adda basuu,dubartota GWG ijaruu",
      "timeToTake": "guyyaa 2,Anaa ji'a 1,magalaf ji'a 2,biroo ji'a3",
      "roomNumber": null,
      "officeId": "cmiwuixeh000cjsmvdd516hqa",
    },
    {
      "id": "e8f0a7bd-a60d-4e68-9224-6876b38cad7c",
      "name": "Koomii Abbaa Qabbiyye Lafaatiin  Walqabatee Dhiyaatu ",
      "description": "Koomii",
      "timeToTake": "Daqiiqaa 30",
      "roomNumber": null,
      "officeId": "cmiwvt0pm000ijsmvqgicrbqs",
    },
    {
      "id": "eca2a955-dbff-4cc6-876d-b60044be9f67",
      "name": "Hayyama Oomisha Albuudaa Kennuu",
      "description": "Hayyama Oomishaa",
      "timeToTake": "Guyyaa 3",
      "roomNumber": null,
      "officeId": "cmiwua43n000ajsmvogq5fg4p",
    },
    {
      "id": "ed7c6c1c-448b-423a-88a3-d98f6f734ebe",
      "name": "Wal-Harkaa Fuudhinsa  Taasisuu ",
      "description": "Wal-Harkaa Fuudhinsa  Taasisuu ",
      "timeToTake": "Haala Ragaa Qabatamaa Abbaan Dhimmaa Fidee Irratti Hunda'a",
      "roomNumber": null,
      "officeId": "cmiwtrp780005jsmvjob5rfok",
    },
    {
      "id": "f473e8c7-80cf-4787-9e10-6dbd79d5877d",
      "name": "Hariiroo  Hawaasaa",
      "description": "Gorsa ,Waliigaltee  ,Himata fi ol-iyyata ",
      "timeToTake": "Guyyaa 1-3",
      "roomNumber": null,
      "officeId": "cmj6t45fm0008js06xip4001x",
    },
    {
      "id": "f8408180-afba-428f-be89-069f699e128e",
      "name": "Gaaffi Fedhii Paampii Bishaan Jalliisii",
      "description": "Fedhii Paampii",
      "timeToTake": "Daqiiqaa 5",
      "roomNumber": null,
      "officeId": "cmiwu7x6m0009jsmvjbc45zv5",
    },
    {
      "id": "f944d9a0-64b7-4056-b8f7-f0ba50fe2c73",
      "name": "Gandootaa fi Aanalee Barmatilee midhaa dubartoota fi MKB irraa bilisa taanif beekamti kennu",
      "description": "Caasaalee yookiin qaamolee  midhaa koorniya bu'uurefate fi BMG haala ulaagaatiin maqse addaa bassuu",
      "timeToTake": "guyyaa 4  fi sanna oll",
      "roomNumber": null,
      "officeId": "cmiwuixeh000cjsmvdd516hqa",
    },
    {
      "id": "fbbb1ad5-98bc-495e-8d8a-029fb908291c",
      "name": "Sanada Wal-Harkaa Fudhinsaa Waliif Mallattessu",
      "description": "Wal-Harkaa Fudhinsa ",
      "timeToTake": "Sa'aatii 1",
      "roomNumber": null,
      "officeId": "cmiwu1g5d0007jsmvkltn6oq3",
    },
    {
      "id": "fdbf28c0-c9c1-4327-b884-221bfbdd7cbb",
      "name": "Heyyama Dhabbata suphaa  konkolaataa haaraa Kennu fi Heyyama Dhabbata suphaa  konkolaataa haaromsuu",
      "description": "Heyyama",
      "timeToTake": "Daqiiqaa 35",
      "roomNumber": null,
      "officeId": "cmiwupjpr000fjsmvz77cek4a",
    }
  ],
  "requirement": [
    {
      "id": "0068ea44-c2b5-46e6-8bec-f40c03df711d",
      "name": "Ragaa Guutu Abbaa DHimmaa Barbaachisuu",
      "description": null,
      "serviceId": "1b87687c-254a-4160-a2da-a518520c19ae",
    },
    {
      "id": "033622b2-baf9-4cee-8e16-948a88b7b32b",
      "name": "Ragaa Mana Amantaa",
      "description": null,
      "serviceId": "2f8c6004-33ed-4115-a425-f4ba9c019409",
    },
    {
      "id": "037d7be2-0f91-4cf3-b492-932acce28afc",
      "name": "Dhimma Koomishiinii Naamusaa fi Farra Malaanmaltummaattin Qabamee Ilaalamaa Jiruu fi  Murtaa'e Irratti Kan Hin Taane Ta'uu Qaba",
      "description": null,
      "serviceId": "e00f6d6f-3a4a-4e55-8ddd-6f5b2727a5cd",
    },
    {
      "id": "03bc159d-f6f2-4b32-b85c-e5d7e181c92d",
      "name": "Meedikaala Buufata  Fayyaa Mootumma irraa",
      "description": null,
      "serviceId": "94fe6660-e196-4d3f-a3b6-1c614d41f439",
    },
    {
      "id": "04b651db-e9cc-4e16-993a-bee0b517a379",
      "name": "Waraqaa Enyummaa Dhiyeeffachu",
      "description": null,
      "serviceId": "95f58ca9-0fae-4aba-a5f3-f1a8819ac173",
    },
    {
      "id": "05529c42-b1df-4d2f-9911-008990747d61",
      "name": "Bakka Bu'insaa Konkolaataa Qaama Dhiyaachu fi Ogeessi Sanadaa  fi KonkolaataaWaliin Mirkanessu",
      "description": null,
      "serviceId": "c7e20280-6746-4edb-9a7c-8ff29c324eea",
    },
    {
      "id": "05fa3928-aaaf-4321-8f3c-fed7af0c3f0a",
      "name": "waraqaa enyumma haromfamee qabachuu",
      "description": null,
      "serviceId": "4f58f171-0956-48f5-a997-f1e50bf6a311",
    },
    {
      "id": "07bcaee4-a097-415d-a649-b71ef73725f4",
      "name": "Iddoo Gita Hojii Banaa",
      "description": null,
      "serviceId": "4654175b-4cef-4637-9803-77fcdfbe2cf8",
    },
    {
      "id": "07f81129-6d5c-4aaa-941b-2f7e80441812",
      "name": "Waraqaa Qaama Seerrummaa,Barreeffama Hundeffamaa Waldaa fi Dambii Ittin Bulmaataa",
      "description": null,
      "serviceId": "01f10b33-2c44-40c1-94d5-e8601272d08a",
    },
    {
      "id": "08e32a31-22ce-400d-9c71-60af9902061c",
      "name": "Nagahee Tele birrin Itti Kaffalame",
      "description": null,
      "serviceId": "8cc00cb2-c8a4-47c0-8849-32ce6291f8bc",
    },
    {
      "id": "08fa596d-99ca-445f-afce-d7f58814dc79",
      "name": "Iddoo fi Sa'aatii Itti Argamuu Qaban  Adda Baasuu",
      "description": null,
      "serviceId": "43ca0fb2-44c7-4a33-a447-02ab02a49663",
    },
    {
      "id": "0a593d92-0886-4422-8e23-ca8e555eb582",
      "name": "Waraqaa Enyuymmaa Miseensa Hundaa",
      "description": null,
      "serviceId": "29bedd98-d936-4203-984f-d1797be4ef0b",
    },
    {
      "id": "0a6cf6dd-f0d5-4162-9358-4f42b0c2a40e",
      "name": "Ragaa Gutuu Waldaa",
      "description": null,
      "serviceId": "eca2a955-dbff-4cc6-876d-b60044be9f67",
    },
    {
      "id": "0af12337-98f0-42f3-a518-783b2b97dca0",
      "name": "Xalayaa Enyummaa",
      "description": null,
      "serviceId": "bd07182b-e95c-426f-9ddc-522c6c851b5b",
    },
    {
      "id": "0cc1d016-c490-4d36-be34-612679057a71",
      "name": "Madda Bishaanii",
      "description": null,
      "serviceId": "a4172090-d35f-44d6-9c8f-a4fe62dfcbb7",
    },
    {
      "id": "0ceeef96-5d2e-4b33-b80e-95e46dcb88ff",
      "name": "Waligaltee fi EAIA",
      "description": null,
      "serviceId": "5d7158db-5005-48de-87e3-41de50e24521",
    },
    {
      "id": "0d70a05a-e89e-4bfe-a94a-21e42bca60ff",
      "name": "Ragaa Fayyaa Kan Ji'a Jahaa",
      "description": null,
      "serviceId": "845ed3fe-f137-4693-b80b-652b10249918",
    },
    {
      "id": "0dc09838-b16b-41fa-999c-c01ec6a31ba0",
      "name": "Xalayaa Kaartaa Akka Kennamuu Jedhu Biroo Lafaa Irraa",
      "description": null,
      "serviceId": "9d4a7897-4c04-4626-92cf-e772d4776368",
    },
    {
      "id": "0ef0b434-fa7c-4973-9209-5b045fa0b86d",
      "name": "Qaama Seerummaa , Dambii Ittin Bulmaataa, Bu'aa Odiitii Bara fi Waraqaa Ragaa Sadarkaa Ibsu",
      "description": null,
      "serviceId": "952fe9ae-b0c7-4e7c-89e3-be4914fb40b7",
    },
    {
      "id": "0f0d486c-3a21-4412-802f-973c490a49f6",
      "name": "Qaboo yaa'ii Baniinsa Caalbaasii",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "0f37426a-e1b3-4f8a-9b82-672a9840e4c0",
      "name": "Barreeffama Hundeeffamaa fi Dambii Ittin Bulmaata",
      "description": null,
      "serviceId": "66ab7e77-f7a4-4b6c-8200-6941164d4fc0",
    },
    {
      "id": "10941481-0aaa-497f-bb23-2bc265735929",
      "name": "Tajaajilamtoota Alaa Yoo Ta'aan Ammoo Gaaffi Xalayaa Deggarsaa Dhiheefachuu Qaba",
      "description": null,
      "serviceId": "06659662-1aae-43dd-972a-260dee1f3ed8",
    },
    {
      "id": "10c91bc0-be3f-46f6-8a0e-06f2b495a199",
      "name": "Hojii Hojjatame Waliin Kan Wal Gitu Dokmantiin Kaffaltii Karaa Qulqullu Ta'een Dhiyaachuu Qaba",
      "description": null,
      "serviceId": "1de5f168-0255-4599-8c53-c101ad0cdc96",
    },
    {
      "id": "11342047-a952-4bff-9d61-8d3859b12ccd",
      "name": "Ragaa Mana Sirressaa",
      "description": null,
      "serviceId": "2f8c6004-33ed-4115-a425-f4ba9c019409",
    },
    {
      "id": "117f85fd-5db5-4a40-b296-817bc175853c",
      "name": "Qaaman Argamuu",
      "description": null,
      "serviceId": "209fd0ea-5389-43aa-ad45-30eddd0c32ce",
    },
    {
      "id": "11d5f436-3d39-4f36-8dc9-88ca2599be4a",
      "name": "Ragaa qabatamaa Abbaa Dhimmaa Wajjin Hidhata Qabu",
      "description": null,
      "serviceId": "2f8c6004-33ed-4115-a425-f4ba9c019409",
    },
    {
      "id": "126e028c-fcb1-4916-8f51-cd9a9c98f0e3",
      "name": "Xalayaa Deggarsaa Iddo Dhaabbatichi Argamu Irraa",
      "description": null,
      "serviceId": "86f3511e-648a-4e91-a791-9401dc15eab1",
    },
    {
      "id": "12f21841-e3d0-45bf-b674-181aa8f2f91a",
      "name": "Sababa Midiiyaan Afferamuf",
      "description": null,
      "serviceId": "43ca0fb2-44c7-4a33-a447-02ab02a49663",
    },
    {
      "id": "13a51bbc-5204-4faf-92b1-3ec3648fad66",
      "name": "Kaffaltoota Gibira Idaa Taaksii Qabab Qabeenyii Dhaabbataa fi Socho'aa Isaani Addaa Bahuu Qaba",
      "description": null,
      "serviceId": "29f44708-f88f-4232-802a-95027d7de1fa",
    },
    {
      "id": "164f73f4-1e07-4021-ac2f-9897bc6e3843",
      "name": "Heyyama Investamantii",
      "description": null,
      "serviceId": "355b1c52-08e5-461c-a4fb-fa0d0e0fa940",
    },
    {
      "id": "168cc509-0572-4276-9c7f-4814d45920dc",
      "name": "Xalayaa Iyyanno",
      "description": null,
      "serviceId": "88a011fc-6c83-4a49-b750-5a61d06dc797",
    },
    {
      "id": "16ad1f46-717d-46f3-b2c4-4173a15c1a87",
      "name": "Dhimma Mana Murtitti Ilaalamaa Jiruu fi Kan Murteen Itti Hin kennamiin Ta'uu Qaba",
      "description": null,
      "serviceId": "e00f6d6f-3a4a-4e55-8ddd-6f5b2727a5cd",
    },
    {
      "id": "1943da87-31c8-40db-b88d-77dc2c252c7d",
      "name": "TOR",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "19607911-27e1-43d1-8054-cbba532ab64d",
      "name": "Sababa Hanqinni Bishaani Umameef",
      "description": null,
      "serviceId": "cb0b7afc-8097-46bf-9572-00de031d8e64",
    },
    {
      "id": "1a94b101-55b4-4e95-a56f-99a9df26e42c",
      "name": "Eeruu Kenname Irratti Hunda'u",
      "description": null,
      "serviceId": "450a78c4-1776-4dc5-9850-8f5062013f5b",
    },
    {
      "id": "1a999d65-ec85-4cc3-8476-34085d5cc6b8",
      "name": "Gaaffi Iyyannoo",
      "description": null,
      "serviceId": "71e8c566-9c54-4933-b8a8-a89ed4b2a99d",
    },
    {
      "id": "1bf91628-4b36-4a0b-b945-2a4117df411e",
      "name": "Oggessa Fayyaa Ta'uu Qaba",
      "description": null,
      "serviceId": "845ed3fe-f137-4693-b80b-652b10249918",
    },
    {
      "id": "1c374c94-6d96-4571-88ca-8881da07379a",
      "name": "Waliigaltee Investimantii fi Hayyama Investmantii",
      "description": null,
      "serviceId": "d1a85619-efba-497c-b854-a47a8c66b3c2",
    },
    {
      "id": "1c9ad981-0f94-4a60-af1f-53f91e3f7f77",
      "name": "Iyyata Barrefamaa",
      "description": null,
      "serviceId": "06659662-1aae-43dd-972a-260dee1f3ed8",
    },
    {
      "id": "1da1bede-3177-4092-86e9-85263bc8624a",
      "name": "Ragaa Qulqullinaa  Waajjira Galii fi Waldaa Irraa Dhiyyefachuu",
      "description": null,
      "serviceId": "95f58ca9-0fae-4aba-a5f3-f1a8819ac173",
    },
    {
      "id": "1e38dd6b-2910-4d32-98d6-bcfeb1984dd6",
      "name": "Iyyataa Hayyamni Akka Kennamuf Gaafatu",
      "description": null,
      "serviceId": "8529fa35-d948-48c0-85ad-7f1723ca7293",
    },
    {
      "id": "1ece268a-0091-41db-9054-174d7aec0ec7",
      "name": "Lakk kaffalti Gibiraa",
      "description": null,
      "serviceId": "952fe9ae-b0c7-4e7c-89e3-be4914fb40b7",
    },
    {
      "id": "1f1dfe12-3514-497f-9c2a-d7d4907c6325",
      "name": "Heyyama OPP",
      "description": null,
      "serviceId": "501f51e5-9844-428f-b021-769667aaa312",
    },
    {
      "id": "1f595c26-ace1-4ebc-925f-4103b82563e5",
      "name": "Saayit Plaanii Iddoo dizaayiniin Itti Qophaa'u",
      "description": null,
      "serviceId": "57e54c18-bf04-4052-8156-686b4cf06687",
    },
    {
      "id": "20d4e412-02b1-4bf6-898a-a0a3ac40b253",
      "name": "Waligaltee fi EAIA",
      "description": null,
      "serviceId": "355b1c52-08e5-461c-a4fb-fa0d0e0fa940",
    },
    {
      "id": "21be6277-f753-4bce-b636-5bc83de9f3b6",
      "name": "Iyyata ykn Eeruu Odeeffanno yakkaa Raawwatamee",
      "description": null,
      "serviceId": "2dd72ac4-5d84-4aa7-9797-fce1fdcc8d8c",
    },
    {
      "id": "223afc8c-43d3-4eab-8ffd-50862f53268b",
      "name": "Gabaasa Ji'a",
      "description": null,
      "serviceId": "84352a7b-79a1-444e-a100-22d5c4dabb46",
    },
    {
      "id": "2458e528-cfee-409f-8a3d-9c14954b79c3",
      "name": "Chaappaa Waldaa",
      "description": null,
      "serviceId": "39b83cb7-dabf-4bcd-8903-34c535d9fa81",
    },
    {
      "id": "2484857c-8dc8-4406-859f-65a061a23089",
      "name": "Ragaa Abbaa Dhimmaa Harka Jiruu",
      "description": null,
      "serviceId": "e8f0a7bd-a60d-4e68-9224-6876b38cad7c",
    },
    {
      "id": "2505f4c2-c8fa-4b8f-a5f9-23693c6cd099",
      "name": "Xalayaa Deggarsaa Aaanaa Dhabbattichi Itti Argamu Irra  Barraa'e",
      "description": null,
      "serviceId": "13222ab3-b1e9-4c42-bc13-1ec42a00f89a",
    },
    {
      "id": "259cf127-1e2d-46c5-a06e-ebdc7d6cea91",
      "name": "Xalayaa Iskiimicha Ibsu",
      "description": null,
      "serviceId": "6b291339-4335-45fd-af55-0c7ecbd60474",
    },
    {
      "id": "25d072c2-909f-4017-a82e-19220cdd762d",
      "name": "Unkaa To'aanno Dhaabbatichaa Iddoo Dhabbatichi Ittii Argamu Irraa Guutamme",
      "description": null,
      "serviceId": "13222ab3-b1e9-4c42-bc13-1ec42a00f89a",
    },
    {
      "id": "260f9b56-7622-41c5-aea0-5b0d0d3e6cf3",
      "name": "Waraqaa Ragaa Abbaa Qabbiyyummaa",
      "description": null,
      "serviceId": "88a011fc-6c83-4a49-b750-5a61d06dc797",
    },
    {
      "id": "264e45ef-3160-4487-a55c-b819442c731a",
      "name": "Istaandardii iddoo Ilaalu",
      "description": null,
      "serviceId": "fdbf28c0-c9c1-4327-b884-221bfbdd7cbb",
    },
    {
      "id": "2770d87d-32de-4367-a60f-7bbc97da7473",
      "name": "Kan Hawaasummaa",
      "description": null,
      "serviceId": "26190bdc-9647-4d42-b06c-3f0b0fee3441",
    },
    {
      "id": "279aba9a-f67d-446e-9418-9e6964dc7979",
      "name": "Ragaa Gabaasa Xinxala Bu'aa Qabessumma Dinaagdee '' Economic Benefit Analaysis Report ''",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "28514295-1fea-43e0-863f-4a7d599e3bad",
      "name": "Waraqaa Enyummaa Miseensa Hundaa",
      "description": null,
      "serviceId": "66ab7e77-f7a4-4b6c-8200-6941164d4fc0",
    },
    {
      "id": "28be5e2b-bd07-4c27-8191-4a0e533a1d1e",
      "name": "Xalayaa Gaaffii Abbaa Piroojeektii",
      "description": null,
      "serviceId": "179f8fae-275e-49c1-8ad9-ef10b33854c7",
    },
    {
      "id": "2c8de0c2-00ae-4a02-aaa0-904591dd930a",
      "name": "Nagaheee Qusannaa Ittin Galcheee",
      "description": null,
      "serviceId": "f8408180-afba-428f-be89-069f699e128e",
    },
    {
      "id": "2cee839f-c440-42b1-ba52-78f5cb552c72",
      "name": "Iyyanno ; Qaboo Yaa'ii Tarrefama  amis/Mallataa'ee",
      "description": null,
      "serviceId": "36830254-7603-49f4-80ac-14c0b9ca121c",
    },
    {
      "id": "2cf64d62-924c-400c-8b3b-65f16faa3912",
      "name": "Muxxannoo Hojii",
      "description": null,
      "serviceId": "8529fa35-d948-48c0-85ad-7f1723ca7293",
    },
    {
      "id": "2e12aa8f-74e6-48ef-adae-d0f8edc8236d",
      "name": "Kuufama Idaa Taaksii Ragaan Guutuun Gare Hordoffi fi Sassaabbi Irra Dhiyeessu",
      "description": null,
      "serviceId": "29f44708-f88f-4232-802a-95027d7de1fa",
    },
    {
      "id": "308ad4bb-a94b-421d-9b62-40792688763e",
      "name": "Isteetmantii Baankii",
      "description": null,
      "serviceId": "355b1c52-08e5-461c-a4fb-fa0d0e0fa940",
    },
    {
      "id": "30c6a29b-244f-4907-8387-24d0f9077f0c",
      "name": "Moggaassa Maqaa DalDalaa",
      "description": null,
      "serviceId": "01f10b33-2c44-40c1-94d5-e8601272d08a",
    },
    {
      "id": "31f00668-3c73-42ca-87e7-33723e779f61",
      "name": "Sadarkaa Bara Darbee Dhiyeefachuu Qaba",
      "description": null,
      "serviceId": "928edd8e-1ed2-4b28-a73e-6f1a12028b2d",
    },
    {
      "id": "3223f594-3233-4e88-9839-47d1bceb39ee",
      "name": "Hirmaattoota Qophessu",
      "description": null,
      "serviceId": "4b6c3fc8-d4f9-4d78-8975-8fe6ceb70e92",
    },
    {
      "id": "32db2b90-d592-4c60-8032-174a74a3c775",
      "name": "Qaboo Yaa'ii Dizaayiniin Fedhii Hawaaasa  Bu'urreffattu Ta'uu Ibsu",
      "description": null,
      "serviceId": "57e54c18-bf04-4052-8156-686b4cf06687",
    },
    {
      "id": "331f1d59-ec51-4bf7-8546-3475844d5d69",
      "name": "' Invitation letter ' Sanada Caalbaasii Gidduu Gala Godhatee Qophaa'ee",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "3393ea47-45b3-42a7-a07e-dc698e113451",
      "name": "Kan Maatiin Walitti Fiduu",
      "description": null,
      "serviceId": "26190bdc-9647-4d42-b06c-3f0b0fee3441",
    },
    {
      "id": "33d0ad20-2460-411a-85dd-4134040a4b97",
      "name": "Waligaltee Bittaf Gurgurtaa",
      "description": null,
      "serviceId": "95f58ca9-0fae-4aba-a5f3-f1a8819ac173",
    },
    {
      "id": "346ee977-9689-4c76-a642-28cebb9555e9",
      "name": "Sadarkaa Bara Darbee Dhiyeefachuu Qaba",
      "description": null,
      "serviceId": "6fdde07d-81f5-4040-be9b-767cc0215f40",
    },
    {
      "id": "3576e006-0073-48e0-a996-2bbe50a04bac",
      "name": "Iyyanno ; Qaboo yaa'ii  Tarrefama Amis/mallattaa'e",
      "description": null,
      "serviceId": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
    },
    {
      "id": "368d8708-03b8-4d22-bd19-b66dba22a4a3",
      "name": "Lakk Kaffaltii Gibiraa",
      "description": null,
      "serviceId": "66ab7e77-f7a4-4b6c-8200-6941164d4fc0",
    },
    {
      "id": "36a0e64b-b5a4-4b01-9d25-8e892b3340a0",
      "name": "Ragaa Sakkata'iinsa Konkolaataa Waggaa  Bolloo",
      "description": null,
      "serviceId": "501f51e5-9844-428f-b021-769667aaa312",
    },
    {
      "id": "37051180-c6ed-4585-8406-080c5cd69166",
      "name": "Ragaa  Qabiyyee Konkolaataa ykn Libre Koopii",
      "description": null,
      "serviceId": "392c931c-c5e1-47db-ae80-186d2a96cce5",
    },
    {
      "id": "384f2c60-12a3-4a71-93b2-b7fcc95da039",
      "name": "baay'ina Humna Namaa Akkaata Istaandardiin Ilaalu",
      "description": null,
      "serviceId": "fdbf28c0-c9c1-4327-b884-221bfbdd7cbb",
    },
    {
      "id": "387cb60a-2270-4371-8360-0093e8559122",
      "name": "Hayyama Oggessotaa Dhaabbatichaaf Hojjatan Kan Haroomee",
      "description": null,
      "serviceId": "86f3511e-648a-4e91-a791-9401dc15eab1",
    },
    {
      "id": "3895fd4c-c919-4b31-b06f-d6c337bce9b1",
      "name": "Ragaa Heyyama opp",
      "description": null,
      "serviceId": "36830254-7603-49f4-80ac-14c0b9ca121c",
    },
    {
      "id": "394eeb66-e278-4c80-bb0e-fad860caa821",
      "name": "Ragaa Barbaadan Sana Tuqanii Xalayaan  Nu Gaafachuu Qabu",
      "description": null,
      "serviceId": "335add8c-a208-43a5-a9df-4a75212e2e7d",
    },
    {
      "id": "39a1fa36-f353-4ac1-af1b-dfe4051fb4b1",
      "name": "Heeyyama Hojii Daldalaa",
      "description": null,
      "serviceId": "01f10b33-2c44-40c1-94d5-e8601272d08a",
    },
    {
      "id": "3a9ac235-7f4a-4a22-80d1-7f5bda541a84",
      "name": "Ragaa Kaffalttin Rawwachuu Ibsu Waldaa Irraa",
      "description": null,
      "serviceId": "eca2a955-dbff-4cc6-876d-b60044be9f67",
    },
    {
      "id": "3d564642-0a2c-49ff-9d0a-af82dc95bade",
      "name": "OL-iyyanno",
      "description": null,
      "serviceId": "22adc289-c497-4075-a931-35be5bc9f931",
    },
    {
      "id": "3d84c8a9-9e48-4a52-bad3-13b9ea969cce",
      "name": "Waldaan Gurmaa'uuf Fedhiin Jiraaachuu",
      "description": null,
      "serviceId": "b527d5a0-1f08-4c9b-b905-9ae5b431b70c",
    },
    {
      "id": "3e7b8f55-4588-405a-9c27-d690f9d80fd4",
      "name": "jirratoota nanon sanii ta'uu",
      "description": null,
      "serviceId": "4f58f171-0956-48f5-a997-f1e50bf6a311",
    },
    {
      "id": "4058eeee-1347-4953-86e6-ebef72021fdf",
      "name": "Ragaa Qorrannoo Guutuu fi Dizaayinii Hojjatamee",
      "description": null,
      "serviceId": "326d9f37-c2b5-4e91-89c1-e6d0cc9afa32",
    },
    {
      "id": "41a0af59-0848-4732-89e6-cfbd395437ef",
      "name": "Barreffama Hundeffamaa fi Dambii Ittin Bulmaata",
      "description": null,
      "serviceId": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
    },
    {
      "id": "42df4493-d576-4cf3-96ea-f79e16e3cb3e",
      "name": "Kaffalaa Gibira Kenya",
      "description": null,
      "serviceId": "d15e78a5-15da-47f8-a165-aa7a1f61657c",
    },
    {
      "id": "42f210a8-8ac7-43c6-b8f9-c18ca7552c37",
      "name": "Dizaayini Mirkanaa'ee",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "42ff031f-8069-47d7-916e-c3f2a2de644a",
      "name": "Yaada Murtee koree",
      "description": null,
      "serviceId": "d1a85619-efba-497c-b854-a47a8c66b3c2",
    },
    {
      "id": "4352bf2d-b49c-471c-ad0d-845714890930",
      "name": "Waraqaa Qaamas Seerummaa",
      "description": null,
      "serviceId": "66ab7e77-f7a4-4b6c-8200-6941164d4fc0",
    },
    {
      "id": "44521080-f62e-4105-8b31-07655193ceac",
      "name": "Lafa Jallisii Ta'uu Jiraachuu",
      "description": null,
      "serviceId": "b527d5a0-1f08-4c9b-b905-9ae5b431b70c",
    },
    {
      "id": "44ebfed2-ed45-445c-9804-5fbc167d85b2",
      "name": "Ibsaa Miidhama Qaqqabee fi Gosa Suphaa",
      "description": null,
      "serviceId": "6b291339-4335-45fd-af55-0c7ecbd60474",
    },
    {
      "id": "470a5a68-969d-40f1-bf56-166ac1f86b81",
      "name": "Qaamolee Nageenyaa (Miseensa RIB, Poolisii, milishaa fi Hojjatoota Waajjira  Bul.nageenyaa) Ta'uu Qaba",
      "description": null,
      "serviceId": "06659662-1aae-43dd-972a-260dee1f3ed8",
    },
    {
      "id": "474552ee-08ad-4655-82dc-cce6d85485aa",
      "name": "Xalayaa Gaaffi fi Ragaa",
      "description": null,
      "serviceId": "0a8f009c-be2b-4176-b348-823d62060fc6",
    },
    {
      "id": "4ae3292e-1d8e-4c67-b96b-091195af4560",
      "name": "Bal'ina Lafa Waldichaa",
      "description": null,
      "serviceId": "39b83cb7-dabf-4bcd-8903-34c535d9fa81",
    },
    {
      "id": "4b91bfbf-295e-40ca-a862-b87223e60819",
      "name": "Midhama Paampichaa (Salphaa,G/galeessa fi Guddaa)",
      "description": null,
      "serviceId": "976f2107-33f7-4529-a1a9-da874364f973",
    },
    {
      "id": "4be91c90-355f-44e4-b42a-524545ae069f",
      "name": "Waligaltee fi EAIA",
      "description": null,
      "serviceId": "964a9011-c8e8-4b27-b773-67f83af9aff6",
    },
    {
      "id": "4ce29d39-b634-4f7b-b718-e9acd2672695",
      "name": "Guyyaa 15 Booda Libree Garagalchaa Hojjechuu",
      "description": null,
      "serviceId": "4d5c048b-8d64-46e1-90a4-1bd904943795",
    },
    {
      "id": "4d03e0eb-fd71-4517-bcc9-a28b9f34aa60",
      "name": "Sadarkaa Gitaa",
      "description": null,
      "serviceId": "be39f394-53ee-497f-b39d-4d191bcaf357",
    },
    {
      "id": "4d211bc4-f558-4967-aff8-ad19ed60eded",
      "name": "Xalayaa Gaaffanno Qorranno Dhaabbille Hawaasa Irraa Dhihaatu",
      "description": null,
      "serviceId": "326d9f37-c2b5-4e91-89c1-e6d0cc9afa32",
    },
    {
      "id": "4d70dda8-f26b-4bac-94ce-e3ab2f4a9126",
      "name": "Nagahee Galii fi Baasii",
      "description": null,
      "serviceId": "39b83cb7-dabf-4bcd-8903-34c535d9fa81",
    },
    {
      "id": "4e8402ee-ad95-404e-abec-ca857dbf918a",
      "name": "Waraqaa Qulqullumaa Qaaama Dhimmi ilaallatu Irraa",
      "description": null,
      "serviceId": "8dae1245-4642-4d15-a338-52e88e21bc18",
    },
    {
      "id": "4e9345e1-c767-4be9-8404-13fc4aef9388",
      "name": "Suuraa 3*4 lama",
      "description": null,
      "serviceId": "9d4a7897-4c04-4626-92cf-e772d4776368",
    },
    {
      "id": "4ed05fbc-5e6f-4bcb-8099-d9634d68bca6",
      "name": "Karoora Piroojaktii",
      "description": null,
      "serviceId": "355b1c52-08e5-461c-a4fb-fa0d0e0fa940",
    },
    {
      "id": "4fa2e69e-6c80-4563-a5ea-05aaf19cac36",
      "name": "Ragaa mana Galmee Kessa Jiruu",
      "description": null,
      "serviceId": "e8f0a7bd-a60d-4e68-9224-6876b38cad7c",
    },
    {
      "id": "4fa4b19c-1e12-404c-9d48-673acf988712",
      "name": "Kaffaltti Barbaachisuu Kaffallu",
      "description": null,
      "serviceId": "aa46f53c-01b5-4b51-a0bb-0d4e255e8164",
    },
    {
      "id": "5044ce45-3ebf-43dd-945f-24c46f08d1fe",
      "name": "Ragaa Leenjii Qabaachuu Qaba",
      "description": null,
      "serviceId": "18c5c8f5-baa4-4e9b-bad7-7b49acd8ac62",
    },
    {
      "id": "52130b09-b367-4ce5-82b5-d6e8e0a04816",
      "name": "Ragaa Abbaa Dhimmaa Harka Jiruu",
      "description": null,
      "serviceId": "dbf0a495-0321-4d28-8b87-7770642faa02",
    },
    {
      "id": "52f957f5-4a5a-4310-a2de-1f2a676021b6",
      "name": "Qaboo Yaa'ii",
      "description": null,
      "serviceId": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
    },
    {
      "id": "53962b66-addd-435e-ba3a-969ddd1f2582",
      "name": "Gaaffanno Xalayaa",
      "description": null,
      "serviceId": "bd07182b-e95c-426f-9ddc-522c6c851b5b",
    },
    {
      "id": "54608605-fc19-4f79-a85f-08d9371909fd",
      "name": "Konkolaataan Qaamaan Dhiyaaate Ilaalchisuu",
      "description": null,
      "serviceId": "95f58ca9-0fae-4aba-a5f3-f1a8819ac173",
    },
    {
      "id": "548e51e2-00cc-4195-baed-0ecaa48fc5a0",
      "name": "Kiliraansii Waajjira Galii fi Waajjira Daldalaa ; Sakkata'insa Teknikaa Abbaan Dhimmaa Kusaa Isaa ni Baasa fi Sadarkaa Konkolaataa Fandii Daandii",
      "description": null,
      "serviceId": "e0408764-e6bd-4c00-bd69-074fdd206c15",
    },
    {
      "id": "555e5211-5bfb-4171-9ed2-e4929d72465a",
      "name": "Hayyama Daldala fi TIN number",
      "description": null,
      "serviceId": "36830254-7603-49f4-80ac-14c0b9ca121c",
    },
    {
      "id": "5799c2ea-ce26-4c03-a061-58e89211dfdc",
      "name": "Xalayaa  Murtee",
      "description": null,
      "serviceId": "355b1c52-08e5-461c-a4fb-fa0d0e0fa940",
    },
    {
      "id": "59009b2c-9fce-4fc2-b633-15d23ff63ec9",
      "name": "Kan jijjirra Hojii",
      "description": null,
      "serviceId": "26190bdc-9647-4d42-b06c-3f0b0fee3441",
    },
    {
      "id": "595f0b32-6383-4c87-88c4-3222c8e5048d",
      "name": "Hundeffama Waldaa",
      "description": null,
      "serviceId": "355b1c52-08e5-461c-a4fb-fa0d0e0fa940",
    },
    {
      "id": "5b026658-50e4-4189-b408-a15ec4290630",
      "name": "Hundeffama Waldaa",
      "description": null,
      "serviceId": "5d7158db-5005-48de-87e3-41de50e24521",
    },
    {
      "id": "5b54ea19-a8e5-4e7d-9e0f-bcfd9ec4eb39",
      "name": "Sanada Konkolaataa Abbaa Dhimmaatiin Dhiyaate Guutu Ta'uu Isaa  Mirkanesssu fi Automized Gochu",
      "description": null,
      "serviceId": "5b83e2e7-aa86-480b-8b57-eeec355d1b03",
    },
    {
      "id": "5bc92f6b-e309-4693-b694-3a0f0c657abb",
      "name": "Barreffama Qaboo ya'ii fi Barreffama Dhabbi KKF",
      "description": null,
      "serviceId": "8529fa35-d948-48c0-85ad-7f1723ca7293",
    },
    {
      "id": "5c32c2ff-abd8-4121-92b6-d17f6da3ae74",
      "name": "Gabaasa Oditi Alaa",
      "description": null,
      "serviceId": "392c931c-c5e1-47db-ae80-186d2a96cce5",
    },
    {
      "id": "5c51e13b-abee-450a-836c-8106480425c2",
      "name": "Qaama Galme nu Biraa Qabu",
      "description": null,
      "serviceId": "d15e78a5-15da-47f8-a165-aa7a1f61657c",
    },
    {
      "id": "5c6bdcb4-2732-456d-97c6-64db8f36c91b",
      "name": "Gosa Iskiimi fi Iddoo Itti argamuu",
      "description": null,
      "serviceId": "6b291339-4335-45fd-af55-0c7ecbd60474",
    },
    {
      "id": "5cba4a0a-9307-4bfa-a327-1796cf233c0b",
      "name": "Bu'aa Odiitii",
      "description": null,
      "serviceId": "964a9011-c8e8-4b27-b773-67f83af9aff6",
    },
    {
      "id": "5ce1a52f-2b75-4e06-8991-b2b4693cad33",
      "name": "Sanada Teknikaa fi Faaynansii Dorgoomtootaa",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "5cf052f9-2dc1-42fc-8ab2-48ca32294ed1",
      "name": "Xalayaa Unkaa Pressitti Barressu",
      "description": null,
      "serviceId": "4d5c048b-8d64-46e1-90a4-1bd904943795",
    },
    {
      "id": "5ddff7b1-0dc9-402c-ad40-784d615d840f",
      "name": "Ragaa Abbaa Qabbiyyumma YKN Libree Koopi",
      "description": null,
      "serviceId": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
    },
    {
      "id": "5dfe884e-33ee-49be-b5ac-b9223525e664",
      "name": "Xalayaa Komii",
      "description": null,
      "serviceId": "9f9afed5-a7e0-463e-8c63-e37c3ed27f74",
    },
    {
      "id": "608c6fec-7a76-42ef-9cb1-e116b336fe5f",
      "name": "Dizaayiniin Hojjattammu Sadarkaa C Yoo Ta'ee Qorranno Biyyoo",
      "description": null,
      "serviceId": "57e54c18-bf04-4052-8156-686b4cf06687",
    },
    {
      "id": "61367ced-609c-49f2-9417-a934cffb367a",
      "name": "Eeruu Toora Bilbilaan YKN Barreffamaan",
      "description": null,
      "serviceId": "9f9afed5-a7e0-463e-8c63-e37c3ed27f74",
    },
    {
      "id": "617fca32-9af8-48ec-9ed3-6ae9108c68a0",
      "name": "Bu'uraaleen Jallisii JIraachuu",
      "description": null,
      "serviceId": "b527d5a0-1f08-4c9b-b905-9ae5b431b70c",
    },
    {
      "id": "6193fc51-befc-4580-bba7-9bd0e2c7928b",
      "name": "Muxxanno Hojii",
      "description": null,
      "serviceId": "be39f394-53ee-497f-b39d-4d191bcaf357",
    },
    {
      "id": "61ccc5db-8dbd-4b80-9ad2-b4903f51d9fc",
      "name": "Ragaa Hayyama Opp",
      "description": null,
      "serviceId": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
    },
    {
      "id": "63f580e5-3491-4267-94ee-8651850f562d",
      "name": "Eeruu Naamusaa",
      "description": null,
      "serviceId": "8529fa35-d948-48c0-85ad-7f1723ca7293",
    },
    {
      "id": "643cb903-eb23-4cb0-822b-074e3a7e0e99",
      "name": "Waraqaaa Enyummaa",
      "description": null,
      "serviceId": "01f10b33-2c44-40c1-94d5-e8601272d08a",
    },
    {
      "id": "6514cc6a-4c91-4e86-88b6-0121ce454d18",
      "name": "Abban Dhimma Ragaa Isaa Mana Galmee irraa Baasi godhachuu",
      "description": null,
      "serviceId": "4d5c048b-8d64-46e1-90a4-1bd904943795",
    },
    {
      "id": "6562dee5-8f9c-466a-add2-1fe76285f977",
      "name": "Ragaaa Kuufama Albuuda Jiraachu Ibsu",
      "description": null,
      "serviceId": "c6554f1b-3970-45ca-9d1a-f4a0f92de745",
    },
    {
      "id": "6585bb89-64bb-4fe7-ba9b-5b61d21f0f67",
      "name": "Abbaa Dhimmaa Sadarkaa Waajjirra Galiiwwaan Godinaa fi Aanaaleef  Magaaloota Godinaa Ta'uu Qaba",
      "description": null,
      "serviceId": "514a02c8-6986-4155-a199-edfd734ae0f8",
    },
    {
      "id": "65cdae14-b023-459a-b08e-8a05e3edb24f",
      "name": "Gaaffii ,Komii fi Iyyaannoo Dhimmoota Nageenyaan Wajjin Walqabatu Ta'uu fi Rakkoo Nageenyaa uumu Danda'an Jedhame Kan Yaadamu Ta'uu Qaba",
      "description": null,
      "serviceId": "e00f6d6f-3a4a-4e55-8ddd-6f5b2727a5cd",
    },
    {
      "id": "66016590-6d70-4fa4-9cfe-b8ce430c957e",
      "name": "Sanada Caalbaasii (SBD) MIrkanaa'ee fi priced (BOQ)",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "6a4f448e-d762-479e-8c1e-de6e0ae8a7d6",
      "name": "Karoora Piroojaktii",
      "description": null,
      "serviceId": "964a9011-c8e8-4b27-b773-67f83af9aff6",
    },
    {
      "id": "6a8a463b-a369-4258-aa63-56558a35c95b",
      "name": "Waldaa Paampii Itti Fayyadamaa Turee",
      "description": null,
      "serviceId": "976f2107-33f7-4529-a1a9-da874364f973",
    },
    {
      "id": "6a96104c-6e77-46bf-941c-7353b2095d11",
      "name": "Sanada Caalbaasi (SBD) Qaama Dhimmi Ilaallatuun Qophaa'ee mirkanaa'e",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "6ad07230-2b35-4620-b1d8-ecc0be03f5c9",
      "name": "Sadarkaa Barnootaa",
      "description": null,
      "serviceId": "be39f394-53ee-497f-b39d-4d191bcaf357",
    },
    {
      "id": "6adbdcbf-c669-48a4-aa9b-e4f84d9e78ee",
      "name": "Lakkofsa Kaffatii Gibiraa TIN",
      "description": null,
      "serviceId": "01f10b33-2c44-40c1-94d5-e8601272d08a",
    },
    {
      "id": "6bb21893-3ecb-49f0-91b5-f2be833828c6",
      "name": "Temporary fi Student Copy",
      "description": null,
      "serviceId": "845ed3fe-f137-4693-b80b-652b10249918",
    },
    {
      "id": "6be1eb9a-5660-4f3f-97bb-7cdc4705e7f5",
      "name": "Lakk TIN ,Kaartaa Lafaa,Qabbiyye Lafaa,EIA hojjachisuuKaffaltii Hayyama Bishaanii",
      "description": null,
      "serviceId": "bd07182b-e95c-426f-9ddc-522c6c851b5b",
    },
    {
      "id": "6c1a07de-aef6-4768-ab52-fe4a4cfad18d",
      "name": "Abbaa Qabbiyyumma",
      "description": null,
      "serviceId": "aa46f53c-01b5-4b51-a0bb-0d4e255e8164",
    },
    {
      "id": "6c98928e-24ce-4f4b-a546-c42e80caee8d",
      "name": "Gosa Midiyaa Barbaadanii",
      "description": null,
      "serviceId": "43ca0fb2-44c7-4a33-a447-02ab02a49663",
    },
    {
      "id": "6ca6dc43-35bc-4ed1-a169-4f93b1b73122",
      "name": "Paampichi Yoom Akka Kennamee",
      "description": null,
      "serviceId": "976f2107-33f7-4529-a1a9-da874364f973",
    },
    {
      "id": "6d3fc9e4-e323-408b-9ff0-a661946c1f36",
      "name": "Moggaassa Maqaa",
      "description": null,
      "serviceId": "66ab7e77-f7a4-4b6c-8200-6941164d4fc0",
    },
    {
      "id": "6d659a88-5e33-4a80-bdc9-24b282422c1e",
      "name": "Gosa Paampii Barbaadame",
      "description": null,
      "serviceId": "f8408180-afba-428f-be89-069f699e128e",
    },
    {
      "id": "70c5e4b0-74ca-484b-9da5-350f7d1be9ba",
      "name": "xalayaa dhimman wau hidhatuu qanbachu qaabaa",
      "description": null,
      "serviceId": "081af485-b176-46f4-8ec3-29bcc49508c9",
    },
    {
      "id": "70e5a0fa-9abf-40d3-bd82-3076a5645140",
      "name": "Ajaja Mana murtii",
      "description": null,
      "serviceId": "f473e8c7-80cf-4787-9e10-6dbd79d5877d",
    },
    {
      "id": "72033284-46f6-4a33-b180-d0d3ed517631",
      "name": "Maqaa Koreewwannii",
      "description": null,
      "serviceId": "39b83cb7-dabf-4bcd-8903-34c535d9fa81",
    },
    {
      "id": "727a19be-39f9-4243-b430-6de0b5e5c55d",
      "name": "Oddeffanno Xalayaa Irratti Barrefama fi Dabalataa",
      "description": null,
      "serviceId": "c8f335a2-25f3-479a-b8c9-50e5297f8a34",
    },
    {
      "id": "72b680ba-36bb-4adc-b5b0-be64ebfc4cb3",
      "name": "Miseensa Waldaa Ta'uu",
      "description": null,
      "serviceId": "cb0b7afc-8097-46bf-9572-00de031d8e64",
    },
    {
      "id": "736fe018-2674-4eca-bacd-f108562fe100",
      "name": "Heyyama Investamantii",
      "description": null,
      "serviceId": "964a9011-c8e8-4b27-b773-67f83af9aff6",
    },
    {
      "id": "739800cb-b550-4e33-a421-56e982e2d5d0",
      "name": "Xalayaa Fedhii",
      "description": null,
      "serviceId": "f8408180-afba-428f-be89-069f699e128e",
    },
    {
      "id": "73a4dd2a-78da-4f18-ae11-bdbc2e04bfa6",
      "name": "Ragaalee Gara Garaa  Adeemsa Bittaa Ibsan",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "7423dc71-d40f-4502-814d-31dd63f35592",
      "name": "Waliigaltee Kiraa Lafaa mallattessu",
      "description": null,
      "serviceId": "d1a85619-efba-497c-b854-a47a8c66b3c2",
    },
    {
      "id": "74637ea2-6331-45b2-a7d5-f811e4d946f5",
      "name": "Hayyama Daldalaa",
      "description": null,
      "serviceId": "66ab7e77-f7a4-4b6c-8200-6941164d4fc0",
    },
    {
      "id": "74952eee-943c-4a3c-bb88-8fd1f7af180c",
      "name": "Lenjistoota fi Lenjitoota Qophesuu",
      "description": null,
      "serviceId": "65e1c5c6-dd89-4fba-b71b-666b0581a236",
    },
    {
      "id": "749a33bb-2cbf-461d-9555-403e3fe6b701",
      "name": "inshuraansii",
      "description": null,
      "serviceId": "6fdde07d-81f5-4040-be9b-767cc0215f40",
    },
    {
      "id": "74c03696-3291-4108-9e6b-7fe0e434e99e",
      "name": "Bu'aa Qorranno CPD Sa'aatti 82",
      "description": null,
      "serviceId": "845ed3fe-f137-4693-b80b-652b10249918",
    },
    {
      "id": "77572a6b-9a37-478b-80ab-9ce3966015a1",
      "name": "Gosa Ispoortii Adda Baasu",
      "description": null,
      "serviceId": "4b6c3fc8-d4f9-4d78-8975-8fe6ceb70e92",
    },
    {
      "id": "78310c18-7c8f-4f37-8a4c-e19274e563d2",
      "name": "Xalayaa Komii",
      "description": null,
      "serviceId": "cb0b7afc-8097-46bf-9572-00de031d8e64",
    },
    {
      "id": "784e7a9e-8308-479f-9e9c-4f9fac92e2d0",
      "name": "Xalayaa Waajjira Poolisi Irra Ragaan Baduu Isaa Ibsu Fiduu",
      "description": null,
      "serviceId": "4d5c048b-8d64-46e1-90a4-1bd904943795",
    },
    {
      "id": "796443b7-65ec-4ff5-bb7b-07c485afae13",
      "name": "abaa dhimaa tauu qaba",
      "description": null,
      "serviceId": "081af485-b176-46f4-8ec3-29bcc49508c9",
    },
    {
      "id": "7b34eb11-4bff-45da-845a-b561d6d0d543",
      "name": "Galmee Kuusaa Baasuu",
      "description": null,
      "serviceId": "95f58ca9-0fae-4aba-a5f3-f1a8819ac173",
    },
    {
      "id": "7b547db8-96f4-4994-839b-fd1f49363e31",
      "name": "Karoora Ka'uumsaa",
      "description": null,
      "serviceId": "86396516-cf9c-4876-9bd7-4af29ca82637",
    },
    {
      "id": "7ba95648-1ab0-4f22-a3e7-b7ebfd9e5d1e",
      "name": "Ragaa Mana Yaalaa",
      "description": null,
      "serviceId": "2f8c6004-33ed-4115-a425-f4ba9c019409",
    },
    {
      "id": "7d890a77-f49b-483b-b9fe-580797276aa8",
      "name": "Ganda Wirtuu Leenjii Itti Banu Irraa Waraqaa Deggarsaa",
      "description": null,
      "serviceId": "8dae1245-4642-4d15-a338-52e88e21bc18",
    },
    {
      "id": "7daa45d3-3c28-4da9-80ae-c829e4798404",
      "name": "Guyyaa 2 Dursani Xalayaa Mana Hojiif Barressuu Qabuu",
      "description": null,
      "serviceId": "43ca0fb2-44c7-4a33-a447-02ab02a49663",
    },
    {
      "id": "7dd66415-e15b-4706-b124-52ab0cd7b42c",
      "name": "Hayyamma Dhabbatichaa Kan Bara Darbee",
      "description": null,
      "serviceId": "86f3511e-648a-4e91-a791-9401dc15eab1",
    },
    {
      "id": "7f66f000-d735-49b4-8f1c-81b53f1f271e",
      "name": "Waraqaa Enyummaa Ragaa Abbaa Qabenyumman Waliigalteen Irrattii Rawwatamu",
      "description": null,
      "serviceId": "8529fa35-d948-48c0-85ad-7f1723ca7293",
    },
    {
      "id": "804c1594-eaba-43d0-a179-049b0d9fbd09",
      "name": "Iyyanoo ; Qaboo yaa'ii Tarrefama amis/Mallataa'e",
      "description": null,
      "serviceId": "392c931c-c5e1-47db-ae80-186d2a96cce5",
    },
    {
      "id": "805f14f5-ff2e-4b7b-a1e8-c36fec25a116",
      "name": "Gamaaggammi Teknikaa",
      "description": null,
      "serviceId": "58edfa34-0e84-419e-95fe-f4af36bc1099",
    },
    {
      "id": "8113f62d-9da7-4d3d-aa7d-1b4b497893da",
      "name": "Iyyanno",
      "description": null,
      "serviceId": "450a78c4-1776-4dc5-9850-8f5062013f5b",
    },
    {
      "id": "8147a3ee-17c8-4d24-87bb-823b91dbb489",
      "name": "Gabaasa Ji'aa",
      "description": null,
      "serviceId": "0851495e-b516-4e2b-a490-0f5e685f3b68",
    },
    {
      "id": "81bd540a-43e3-41af-8df7-63e5a0614ddc",
      "name": "Heyyama Fichisisaa",
      "description": null,
      "serviceId": "c7e20280-6746-4edb-9a7c-8ff29c324eea",
    },
    {
      "id": "84368049-8578-47d5-99d5-9074ed9be836",
      "name": "Omishni Gahuu Isaa Mirkana'uu Qaba",
      "description": null,
      "serviceId": "a61909fb-89ff-4e99-923f-922b36c0f8db",
    },
    {
      "id": "847e2cd5-ee3c-4a77-82bd-cf631c23e3b7",
      "name": "Baajata Lenjii Qophessu",
      "description": null,
      "serviceId": "65e1c5c6-dd89-4fba-b71b-666b0581a236",
    },
    {
      "id": "84e189e7-5a2e-49d9-8d64-fa7d27ba360a",
      "name": "W/ra Investimantii fi Industrii Irraa Xalayaa Cehumsaa",
      "description": null,
      "serviceId": "9d4a7897-4c04-4626-92cf-e772d4776368",
    },
    {
      "id": "85c52198-a9dd-462f-a2ad-81785bfdd23e",
      "name": "Specification fi BOQ Mirkanaa'ee ( Both Priced BOQ and Non Priced BOQ )",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "86ded842-efca-4022-ab4b-677f0bc7c8ab",
      "name": "Meeshaalee suphaaf Barbaachisan Akkaataa Istaandardii Gutachuu Ilaalu",
      "description": null,
      "serviceId": "fdbf28c0-c9c1-4327-b884-221bfbdd7cbb",
    },
    {
      "id": "876e1007-9c42-4dae-8af5-aab2cbb7720e",
      "name": "Hayyama Oggummaa Yeroo Duraa fi Suraa 2",
      "description": null,
      "serviceId": "845ed3fe-f137-4693-b80b-652b10249918",
    },
    {
      "id": "8809a8f0-1d15-4de4-8470-4d1680d4df49",
      "name": "Isteetmantii Baankii",
      "description": null,
      "serviceId": "964a9011-c8e8-4b27-b773-67f83af9aff6",
    },
    {
      "id": "885c244c-79aa-45c6-855e-39736a3c34ea",
      "name": "Ragaaa Qorrannoo",
      "description": null,
      "serviceId": "a4172090-d35f-44d6-9c8f-a4fe62dfcbb7",
    },
    {
      "id": "8ab5e244-1c59-4c4c-a32e-a9653c24530b",
      "name": "Sakkata'insaa Taasaa",
      "description": null,
      "serviceId": "450a78c4-1776-4dc5-9850-8f5062013f5b",
    },
    {
      "id": "8ae2901a-1938-4c37-a32e-806dc9999eac",
      "name": "Konfaraansii Seensaa fi Bahiinsa Irratti KG Qaamaan Ykn Bakka Bu'uumma seera Qabbessa Nama Qabuun Hirmaachuu Qaba",
      "description": null,
      "serviceId": "9a8ac3f2-0606-4c3b-bb05-217248b68f89",
    },
    {
      "id": "8ae74ac1-f441-4688-a45e-eb1202c8a8b1",
      "name": "Bal'ina Lafa Misoomuu",
      "description": null,
      "serviceId": "6b291339-4335-45fd-af55-0c7ecbd60474",
    },
    {
      "id": "8e12f20a-667c-4723-bae0-523ecf75fe94",
      "name": "Declaration ,B/loading,Removal,RTA,Certificate,",
      "description": null,
      "serviceId": "c7e20280-6746-4edb-9a7c-8ff29c324eea",
    },
    {
      "id": "8f114c3c-2869-4df7-aa1c-2fbb32b98c6b",
      "name": "Gabaasa Bu'aa Mana Murtii",
      "description": null,
      "serviceId": "dbf0a495-0321-4d28-8b87-7770642faa02",
    },
    {
      "id": "8f436377-ffb0-4802-b5ae-1c515475bedd",
      "name": "Barrefama  Hundeffamaa fi dambii Ittin Bulmaaata",
      "description": null,
      "serviceId": "36830254-7603-49f4-80ac-14c0b9ca121c",
    },
    {
      "id": "8fa51f20-4bc8-4875-9603-3c3479c92525",
      "name": "Baajata Qophessu",
      "description": null,
      "serviceId": "4b6c3fc8-d4f9-4d78-8975-8fe6ceb70e92",
    },
    {
      "id": "8ff7a5b0-fe75-4048-a6ee-52c6512bd030",
      "name": "Hojjatta Waajjirra Ta'uu qaba",
      "description": null,
      "serviceId": "6695f1d1-d96b-49cd-bda2-1bc4a9caaee0",
    },
    {
      "id": "909fc119-34b2-4dac-b344-f7c34b27c248",
      "name": "Gabaasa Hojii fi Bajataa",
      "description": null,
      "serviceId": "392c931c-c5e1-47db-ae80-186d2a96cce5",
    },
    {
      "id": "91de01f4-8905-4af8-854f-2d1d0dd2d77b",
      "name": "Konfaransi Seensaa fi Bahiinsaa Irratti KG Qaamaan ykn Bakka Bu'uumma Seera Qabeessa Nama Qabuun Hirmaachuu Qaba",
      "description": null,
      "serviceId": "d15e78a5-15da-47f8-a165-aa7a1f61657c",
    },
    {
      "id": "92b30ba5-477c-4f36-8680-14ad633e2382",
      "name": "Xalayaa Deggarsaa Bakka Hojii Irraa",
      "description": null,
      "serviceId": "845ed3fe-f137-4693-b80b-652b10249918",
    },
    {
      "id": "930f2910-5d5a-4191-bc10-729863bef376",
      "name": "Kan Dhukkubaa",
      "description": null,
      "serviceId": "26190bdc-9647-4d42-b06c-3f0b0fee3441",
    },
    {
      "id": "9447f598-970d-4675-b070-b2a72d377788",
      "name": "Heyyama Orijinaala Qabatanii Dhuyaachuu",
      "description": null,
      "serviceId": "d78c9717-9361-4383-8009-ff4b4766efbf",
    },
    {
      "id": "946baa54-1922-4f48-a7a0-7cad87470ef7",
      "name": "Xalayaa  Murtee",
      "description": null,
      "serviceId": "5d7158db-5005-48de-87e3-41de50e24521",
    },
    {
      "id": "96864412-4c7a-42af-a758-9683d156a5bf",
      "name": "Kabachisa Kaffaltii Duraa Dhiyeefachu Qaba",
      "description": null,
      "serviceId": "1be5cfba-dcd7-46a4-bfee-a5f7b1abbb20",
    },
    {
      "id": "970b9553-95bd-48bb-ad00-3abec0c6bfc8",
      "name": "Gabaasa Ji'aa",
      "description": null,
      "serviceId": "82e60402-e65b-48c5-acc1-e95cb62186f9",
    },
    {
      "id": "97bcdf67-057d-4291-9e0c-75e50a3e24e2",
      "name": "Hundeffama Waldaa",
      "description": null,
      "serviceId": "964a9011-c8e8-4b27-b773-67f83af9aff6",
    },
    {
      "id": "9a443aa6-a90d-4d79-828e-88d65a3ab06c",
      "name": "Karoora Piroojaktii",
      "description": null,
      "serviceId": "5d7158db-5005-48de-87e3-41de50e24521",
    },
    {
      "id": "9b17556f-c2b2-4869-8446-2864e95c55ab",
      "name": "namaa dhimmii ilalatuu tauu qabuu",
      "description": null,
      "serviceId": "c0b7148a-2d2b-4341-bc17-c9d60b460047",
    },
    {
      "id": "9b78bc1b-eaef-4909-a970-d5e40c1c0fdd",
      "name": "Dhimma Abbaa Taayitaa Galiiwwaan Waliin Wal-qabatee Ilaalamaa Jiruu fi Murta'e Irratti Kan Hin Taane Ta'uu Qaba",
      "description": null,
      "serviceId": "e00f6d6f-3a4a-4e55-8ddd-6f5b2727a5cd",
    },
    {
      "id": "9c1a85d0-21f6-4602-8063-018930a29a91",
      "name": "Dambii Ittin Bulmaata Waldaa",
      "description": null,
      "serviceId": "39b83cb7-dabf-4bcd-8903-34c535d9fa81",
    },
    {
      "id": "9e2c206c-c0e3-481a-bf9b-29f2bc38efa9",
      "name": "Xalayaa Deggarsaa",
      "description": null,
      "serviceId": "88a011fc-6c83-4a49-b750-5a61d06dc797",
    },
    {
      "id": "9eadfa8a-1f30-435e-af43-0f0cffdddcb7",
      "name": "Maddii Bishaan Jallissi Ta'uu JIraachuu",
      "description": null,
      "serviceId": "b527d5a0-1f08-4c9b-b905-9ae5b431b70c",
    },
    {
      "id": "a011e91b-5ba6-4d1f-b8bb-8ad1f8b15743",
      "name": "Ragaa Gaha Qabaachuu",
      "description": null,
      "serviceId": "43ca0fb2-44c7-4a33-a447-02ab02a49663",
    },
    {
      "id": "a0caaa4e-cfd1-4ab5-bae5-7d4abbedfa7d",
      "name": "Iyyata Gaaffi M/W ykn ol-iyyatni akka Gaafatamu",
      "description": null,
      "serviceId": "cc35c70f-05df-4e13-bdd2-8d3cccde6fa0",
    },
    {
      "id": "a1877ac5-9ed9-4515-95fd-bcbdddafcb08",
      "name": "Baajatni Piroojektichaaf Qabame Jiraachuu Qaba",
      "description": null,
      "serviceId": "4d846a21-e5f8-49f2-a967-d3a94fdf8864",
    },
    {
      "id": "a194387a-fbe2-404a-943b-d37d84a31289",
      "name": "Waraqaa Ragaa Abbaa Qabbiyyumma Duraa",
      "description": null,
      "serviceId": "d1a85619-efba-497c-b854-a47a8c66b3c2",
    },
    {
      "id": "a2449991-b49c-4570-a96a-332c72476179",
      "name": "Konkolaataan Qaaman Dhiyaatu Qaba ; Inshuransiin Abbaa Dhimmaa Kuusaa Kessaa Bahuu Qaba",
      "description": null,
      "serviceId": "6fdde07d-81f5-4040-be9b-767cc0215f40",
    },
    {
      "id": "a265503a-7430-4d61-94be-ce568c3a2e54",
      "name": "Hayyama Daldalaa fi TIN number",
      "description": null,
      "serviceId": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
    },
    {
      "id": "a2753b6c-d79e-4fe8-8598-16bd0ec55464",
      "name": "Ragaa Kuufama Idaa Taaksii Sirruummaan isaa Mirkanaa'ee",
      "description": null,
      "serviceId": "29f44708-f88f-4232-802a-95027d7de1fa",
    },
    {
      "id": "a59b8256-d4dc-41c0-bea3-284b66a68f85",
      "name": "Xalayaa Iyyataa",
      "description": null,
      "serviceId": "e8f0a7bd-a60d-4e68-9224-6876b38cad7c",
    },
    {
      "id": "a67648da-85c9-412e-975f-bc4e4e746bdd",
      "name": "Xalayaa  Murtee",
      "description": null,
      "serviceId": "964a9011-c8e8-4b27-b773-67f83af9aff6",
    },
    {
      "id": "a68c0dd7-e9c9-40bc-a338-4bdedf74c503",
      "name": "Ragaa '' EIA '' Qaama  Aangoo Qabuun Mirkanaa'e",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "a702f1fa-0581-4997-802f-86d0ad5c9ee2",
      "name": "Waraqaa Ragaa Abbaa QabbiyyummaaQaama dhimmi Ilaalun Mirkana'ee",
      "description": null,
      "serviceId": "9d4a7897-4c04-4626-92cf-e772d4776368",
    },
    {
      "id": "a7c52a0c-060c-44e5-8854-ac774ea86e6e",
      "name": "Heyyamma Daldalaa",
      "description": null,
      "serviceId": "29bedd98-d936-4203-984f-d1797be4ef0b",
    },
    {
      "id": "a92dde4b-7e48-4451-8c76-445ab811ae5e",
      "name": "Murtii Mana Mana Mareetiin  Kan Hin Murtoofne",
      "description": null,
      "serviceId": "e00f6d6f-3a4a-4e55-8ddd-6f5b2727a5cd",
    },
    {
      "id": "a9986fc5-90de-4977-93fa-cb2eca7ff746",
      "name": "Hayyamma Dhaabbattichaa Kan Bara Darbee",
      "description": null,
      "serviceId": "13222ab3-b1e9-4c42-bc13-1ec42a00f89a",
    },
    {
      "id": "aae0b028-fb67-4544-9f36-39356732fe67",
      "name": "Ragaa Gaa'ilaa Dhiyeessuu",
      "description": null,
      "serviceId": "95f58ca9-0fae-4aba-a5f3-f1a8819ac173",
    },
    {
      "id": "ad0d042a-5ba2-4ab1-81ce-84b418ee8473",
      "name": "Xalayaa Mana Murtii Ykn Qaama Dhimmichi Ilaalu Irraa Xalayaa Fiduu Qabu",
      "description": null,
      "serviceId": "dbc68074-704e-4de2-9510-e34f3cc50ca8",
    },
    {
      "id": "adc9e777-3639-4885-9724-5c508d5d7fcd",
      "name": "Lakk kaffalti Gibiraa",
      "description": null,
      "serviceId": "29bedd98-d936-4203-984f-d1797be4ef0b",
    },
    {
      "id": "afafd4a2-2338-42ee-8d85-bf338f2d9e7d",
      "name": "Waraqaa Enyummaa Haaroome fi Xalayaa Deggarsaa W/Galii Aanaa Irraa",
      "description": null,
      "serviceId": "e56aadd7-c402-4428-a302-acb1fc4e87eb",
    },
    {
      "id": "b03fe3a4-f998-4a92-9f00-5f854d98f5cc",
      "name": "waldaa Tahuu Qaba",
      "description": null,
      "serviceId": "601e4598-e1aa-4804-abc8-6d0b7cc08fd6",
    },
    {
      "id": "b1442eb9-6199-40fa-8225-a846e54fd4a4",
      "name": "Iyyata Qaamani",
      "description": null,
      "serviceId": "cc35c70f-05df-4e13-bdd2-8d3cccde6fa0",
    },
    {
      "id": "b2b32600-ffc3-434f-9224-4df6923957a9",
      "name": "Gaaffi Tajaajilaa Mannen Hojii Mootummaa irra Dhiyaatu",
      "description": null,
      "serviceId": "f473e8c7-80cf-4787-9e10-6dbd79d5877d",
    },
    {
      "id": "b2d7d6c0-4aa8-4113-b8cc-9b91e798d7ff",
      "name": "Qaboo Yaa'ii",
      "description": null,
      "serviceId": "36830254-7603-49f4-80ac-14c0b9ca121c",
    },
    {
      "id": "b3bfd871-bb4e-4397-8a85-ea7a8aaa1b5c",
      "name": "Piroojektiin Akkaataa Walii Galteetiin  Dhumachuu Isaa  Kan Ibsu Ragaan Gutuun Jiraachuu Qaba",
      "description": null,
      "serviceId": "ed7c6c1c-448b-423a-88a3-d98f6f734ebe",
    },
    {
      "id": "b400c6c3-46a3-453e-8372-633caa508099",
      "name": "Hojjataa Mottummsaa Nu Biratti Mindaa Kaffalu",
      "description": null,
      "serviceId": "e56aadd7-c402-4428-a302-acb1fc4e87eb",
    },
    {
      "id": "b40869d3-1b2d-45d7-abe5-745a4003882f",
      "name": "Bu'aa Odiitii",
      "description": null,
      "serviceId": "5d7158db-5005-48de-87e3-41de50e24521",
    },
    {
      "id": "b425d4a1-d2e5-4a66-ac8f-a14dd264a980",
      "name": "Isteetmantii Baankii",
      "description": null,
      "serviceId": "5d7158db-5005-48de-87e3-41de50e24521",
    },
    {
      "id": "b6ac342c-ee72-4267-a2fc-07ea5d2d07f3",
      "name": "Sanadoota Eeruu kennamu Wajjin hidhaata Qabuu",
      "description": null,
      "serviceId": "c13f72f3-4334-4047-8d2f-a3999f412b85",
    },
    {
      "id": "b72205f5-5f61-4a0c-9b05-30e1301679bf",
      "name": "Waraqaa Enyummaa'",
      "description": null,
      "serviceId": "88a011fc-6c83-4a49-b750-5a61d06dc797",
    },
    {
      "id": "b811a55f-4a25-41be-b874-58fdc888c674",
      "name": "Ragaalee Adda Addaa Waa'ee Kaffaltii Sanaa Ibsuu",
      "description": null,
      "serviceId": "8cc00cb2-c8a4-47c0-8849-32ce6291f8bc",
    },
    {
      "id": "b8f0d547-e9fe-4064-864e-afc11f4c243e",
      "name": "Kaffalaa Gibiraa Kenya Ta'uu Qaba",
      "description": null,
      "serviceId": "9a8ac3f2-0606-4c3b-bb05-217248b68f89",
    },
    {
      "id": "b9af32a7-545a-4174-ae45-5a2d6dd4cfc1",
      "name": "Hojjataa motumma tauu",
      "description": null,
      "serviceId": "03861060-a202-432f-810e-3aab203188e1",
    },
    {
      "id": "b9e3ef0b-7278-4514-8b8b-2fd047a75a04",
      "name": "Ragaa Guutuu Dabarsaa Lafaa",
      "description": null,
      "serviceId": "9d4a7897-4c04-4626-92cf-e772d4776368",
    },
    {
      "id": "ba6fe422-b215-4901-bda2-277b721bb538",
      "name": "Gabaasa Ji'aa",
      "description": null,
      "serviceId": "7472e7c7-c839-484c-bf6e-49b4a5fdc864",
    },
    {
      "id": "bc323394-0db5-47e4-bc15-b2dafde5b41e",
      "name": "Sanada Dorgomtootaa",
      "description": null,
      "serviceId": "179f8fae-275e-49c1-8ad9-ef10b33854c7",
    },
    {
      "id": "bdbfea61-8cd0-4a3a-a256-8ad80732b4c9",
      "name": "Kaffaltiin Akka Raawwatamu  Xalayaa Seera Qabbessa Ta'een Gaafachuu",
      "description": null,
      "serviceId": "1de5f168-0255-4599-8c53-c101ad0cdc96",
    },
    {
      "id": "bee7f3e3-e812-4bc8-ad63-33b852d323d4",
      "name": "Waraqaa Enyuymmaa Miseensa Hundaa",
      "description": null,
      "serviceId": "952fe9ae-b0c7-4e7c-89e3-be4914fb40b7",
    },
    {
      "id": "c0d556e6-73fc-4f25-9a03-60a78f2cc92e",
      "name": "Kiliraansii Waajjirra Galii Irraa Dhiyesuu",
      "description": null,
      "serviceId": "fdbf28c0-c9c1-4327-b884-221bfbdd7cbb",
    },
    {
      "id": "c109bc31-e1eb-40a4-8cf1-ef4648d93741",
      "name": "Guyyaa Itti Midiyaa Barbaadan",
      "description": null,
      "serviceId": "43ca0fb2-44c7-4a33-a447-02ab02a49663",
    },
    {
      "id": "c1172d33-13b9-4440-9aaa-72bb522f2647",
      "name": "Gabaasa Odiiti Alaa",
      "description": null,
      "serviceId": "36830254-7603-49f4-80ac-14c0b9ca121c",
    },
    {
      "id": "c182efe1-ed2f-49f5-a837-fbec01667d85",
      "name": "Heyyamma Daldalaa",
      "description": null,
      "serviceId": "952fe9ae-b0c7-4e7c-89e3-be4914fb40b7",
    },
    {
      "id": "c18d38eb-9519-497a-a2ef-3fad30f5deaa",
      "name": "Baay'ina Fayyadamtootaa",
      "description": null,
      "serviceId": "6b291339-4335-45fd-af55-0c7ecbd60474",
    },
    {
      "id": "c3128af6-94cf-45a7-a4be-e4c9863a66ef",
      "name": "Qaboo Yaa'ii fi Gabaasa Guutuu Koree Bittaa",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "c3931f14-b037-4834-9196-e110c450d170",
      "name": "Xalayaa Gaaffii Maqaa Jijjirraf Dhiyaatee",
      "description": null,
      "serviceId": "d1a85619-efba-497c-b854-a47a8c66b3c2",
    },
    {
      "id": "c45808ed-9e97-4963-9c44-a8ef2beb7650",
      "name": "Xalayaa  Enyummaa",
      "description": null,
      "serviceId": "c7e20280-6746-4edb-9a7c-8ff29c324eea",
    },
    {
      "id": "c48e259d-597a-4586-bd72-860e06eb0e0a",
      "name": "Waraqaa Hojii Dhabdummaa",
      "description": null,
      "serviceId": "01f10b33-2c44-40c1-94d5-e8601272d08a",
    },
    {
      "id": "c518c4c7-fd42-44ad-8e67-f87dc0f6a0dd",
      "name": "Ragaa Heyyama Opp",
      "description": null,
      "serviceId": "392c931c-c5e1-47db-ae80-186d2a96cce5",
    },
    {
      "id": "c6421b00-fbaa-4209-a65e-a4b5d6208ed9",
      "name": "Aangoo Abbaa Taayiitaan Maxxansissu",
      "description": null,
      "serviceId": "28a3145d-6b17-4c63-a002-b0ccac96493e",
    },
    {
      "id": "c66c527d-06aa-4994-9246-9600a7f1dc6b",
      "name": "Isteetmantii Baankii",
      "description": null,
      "serviceId": "88a011fc-6c83-4a49-b750-5a61d06dc797",
    },
    {
      "id": "c68b390d-1219-4f19-982b-12e3dc8e85e9",
      "name": "Ajaja Mana Murtii",
      "description": null,
      "serviceId": "dbf0a495-0321-4d28-8b87-7770642faa02",
    },
    {
      "id": "c792d003-2210-4fa4-9778-a4e54992ac5b",
      "name": "Dizaayinii Hojjatamee",
      "description": null,
      "serviceId": "a4172090-d35f-44d6-9c8f-a4fe62dfcbb7",
    },
    {
      "id": "c830b550-305f-4180-b80f-3da7ab13ef6d",
      "name": "Xalayaa Mana Murtii fi Baankii Dhiyessu fi Faayila Mana Galmee Baasu",
      "description": null,
      "serviceId": "e0408764-e6bd-4c00-bd69-074fdd206c15",
    },
    {
      "id": "c83a2c1c-4d0e-4a3e-84e8-ffa1d65eb0f9",
      "name": "Ragaa Guutuu Ta'ee",
      "description": null,
      "serviceId": "58edfa34-0e84-419e-95fe-f4af36bc1099",
    },
    {
      "id": "c9477f4d-33da-449c-ad8d-92ae3f58e0f6",
      "name": "Qaama Seerummaa , Dambii Ittin Bulmaataa, Bu'aa Odiitii Bara fi Waraqaa Ragaa Sadarkaa Ibsu",
      "description": null,
      "serviceId": "29bedd98-d936-4203-984f-d1797be4ef0b",
    },
    {
      "id": "ccc879d0-ae65-4eab-87e1-b021001debfb",
      "name": "Lakkofsa Mana Poostaa Irraa Ittin Ergame Qabatani Dhiyaachuu",
      "description": null,
      "serviceId": "824e2b8b-e831-4541-9a45-2a54ae9b0c4c",
    },
    {
      "id": "ccdd7fd4-0974-4fe2-b018-8a1af5097ca1",
      "name": "Xalayaan Piroojekticha Akka Irraa Fudhamuu Gaafachu Qaba",
      "description": null,
      "serviceId": "ed7c6c1c-448b-423a-88a3-d98f6f734ebe",
    },
    {
      "id": "cd64ef29-ac25-44a6-983e-e6d7c08271f3",
      "name": "Hayyama Daldalaa fi TIN number",
      "description": null,
      "serviceId": "392c931c-c5e1-47db-ae80-186d2a96cce5",
    },
    {
      "id": "ced724c5-9c73-493e-b2e4-10c1779c1d31",
      "name": "Heyyama Investamantii",
      "description": null,
      "serviceId": "5d7158db-5005-48de-87e3-41de50e24521",
    },
    {
      "id": "d1723701-847b-4468-9b88-8d7c7e43c7b0",
      "name": "Lafa Jallisiif Ta'uu Qabaachuu",
      "description": null,
      "serviceId": "f8408180-afba-428f-be89-069f699e128e",
    },
    {
      "id": "d181d63c-e1ed-4b3d-a3c4-f87eda8a403f",
      "name": "Moggaassa Maqaa Daldalaa",
      "description": null,
      "serviceId": "29bedd98-d936-4203-984f-d1797be4ef0b",
    },
    {
      "id": "d1dfd252-af30-473c-8724-9aa40e40e00b",
      "name": "Ragaalee Ibsa Galmee Herregaa Isaa Waajjin Walqabate Qabaachuu Qaba",
      "description": null,
      "serviceId": "9a8ac3f2-0606-4c3b-bb05-217248b68f89",
    },
    {
      "id": "d2dc6e37-4b89-41fd-8a9c-1df4df662681",
      "name": "Kaffalaa Gibiraa Kenya Ta'uu Qaba",
      "description": null,
      "serviceId": "e56aadd7-c402-4428-a302-acb1fc4e87eb",
    },
    {
      "id": "d3606df2-3bae-4b2e-ac49-85d54a703965",
      "name": "Qusannaa Duraa %10 Qabaachuu",
      "description": null,
      "serviceId": "f8408180-afba-428f-be89-069f699e128e",
    },
    {
      "id": "d3732158-4df9-40d3-a838-ba1e72481b50",
      "name": "Ragaa Guutuu Maagaaloota Irraa",
      "description": null,
      "serviceId": "0a8f009c-be2b-4176-b348-823d62060fc6",
    },
    {
      "id": "d38ab521-541d-402b-a001-21d05a32618a",
      "name": "Gabaasa NTGA Duraan Fudhatamee",
      "description": null,
      "serviceId": "71e8c566-9c54-4933-b8a8-a89ed4b2a99d",
    },
    {
      "id": "d55c915a-18bc-4936-a1a8-498d7534dabe",
      "name": "Gabaasa Hojii fi Bajataa",
      "description": null,
      "serviceId": "36830254-7603-49f4-80ac-14c0b9ca121c",
    },
    {
      "id": "d5a441ca-9c37-405e-acd0-e4a8cbfd6b5c",
      "name": "Xalayaa Deggarsaa Aanaa irraa Hojjattu Irraa",
      "description": null,
      "serviceId": "c17b9a58-3905-4aaa-ad84-96d017177013",
    },
    {
      "id": "d6ee787d-847e-49aa-be74-218d5cee68cd",
      "name": "Bara Wal-harkaa Fudhiinsa Ittin Raawwatamee",
      "description": null,
      "serviceId": "6b291339-4335-45fd-af55-0c7ecbd60474",
    },
    {
      "id": "d71f7a20-639b-4ce9-9d54-89bc936b13da",
      "name": "Gabaasa Oditii Alaa",
      "description": null,
      "serviceId": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
    },
    {
      "id": "d7330a8b-3854-4aba-8056-7387d9f46c48",
      "name": "jirrata nano  sanii ta'uu",
      "description": null,
      "serviceId": "e6fff1c2-a36a-414c-9256-1dafa2a979be",
    },
    {
      "id": "d7f413c2-e22e-44b9-83e4-b382660b5ae2",
      "name": "Moggaassa Maqaa Daldalaa",
      "description": null,
      "serviceId": "952fe9ae-b0c7-4e7c-89e3-be4914fb40b7",
    },
    {
      "id": "d83caf71-578c-4be4-afad-092e35b6a502",
      "name": "Ragaa Sadarkessa Piroojektii fi Marii Hawaasa Naannoo Piroojektichaa Agarsiisu",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "d8c7193f-e5d3-492a-8b09-6c6f47a162c0",
      "name": "xalayaa Waajjira Poolisii Irraa Dhiheeffachuu",
      "description": null,
      "serviceId": "d78c9717-9361-4383-8009-ff4b4766efbf",
    },
    {
      "id": "da10c482-7629-4712-9159-2c15ad7c9efe",
      "name": "Caalbaasii Mo'achu Isaa Kan Xalayaan Dhufu Qaba",
      "description": null,
      "serviceId": "1be5cfba-dcd7-46a4-bfee-a5f7b1abbb20",
    },
    {
      "id": "db851857-e31c-44e2-815d-97c6684c3d30",
      "name": "Xalayaaa Mana Murtii Dhiyeefachuu",
      "description": null,
      "serviceId": "824e2b8b-e831-4541-9a45-2a54ae9b0c4c",
    },
    {
      "id": "dc1bdafb-3d78-4848-8bb4-a7abfe9306f3",
      "name": "Ragaa Dhunfaa Seera Guttattee",
      "description": null,
      "serviceId": "d1a85619-efba-497c-b854-a47a8c66b3c2",
    },
    {
      "id": "dc8c116b-4949-41b4-9fbb-5c2273a58d8d",
      "name": "Gazeexaa  Beeksifni Iratti Bahe",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "dcfedc37-66ef-45a7-8c30-08f5b1a2e398",
      "name": "Xalayaa Gaaffanno",
      "description": null,
      "serviceId": "a4172090-d35f-44d6-9c8f-a4fe62dfcbb7",
    },
    {
      "id": "df15f414-7f90-4dac-9d06-ffa0e74bdd54",
      "name": "Baajata Qabaachuu",
      "description": null,
      "serviceId": "4654175b-4cef-4637-9803-77fcdfbe2cf8",
    },
    {
      "id": "df2d3419-cbd5-43fd-a89a-01e2f2ba2251",
      "name": "Konkolaataan  Qaaman Dhiyaatu  ; inshuraansii fi Abbaan Dhimmaa Kuusaa Isaa Baasu Qaba",
      "description": null,
      "serviceId": "928edd8e-1ed2-4b28-a73e-6f1a12028b2d",
    },
    {
      "id": "e0231270-2396-442c-b9e1-d2c79068ba2f",
      "name": "Xalayaa Iyyanno Waldaa",
      "description": null,
      "serviceId": "39b83cb7-dabf-4bcd-8903-34c535d9fa81",
    },
    {
      "id": "e3e5900c-8a90-4a6a-aba0-71d1585164ac",
      "name": "Hayyama Daldalaa Dhiyeffachuu Qaba",
      "description": null,
      "serviceId": "928edd8e-1ed2-4b28-a73e-6f1a12028b2d",
    },
    {
      "id": "e44495d0-9cdc-4cd9-8b47-e3afbeb9ba63",
      "name": "Hayyamma Oggessotaa Dhaabbattichaaf Hojjattan Kan Haaroomfame",
      "description": null,
      "serviceId": "13222ab3-b1e9-4c42-bc13-1ec42a00f89a",
    },
    {
      "id": "e4bdb5b8-e1b5-46e0-ae69-57187d7e748c",
      "name": "Ragaa Qabbiyyumma Konkolaataa /Libree Koopii",
      "description": null,
      "serviceId": "36830254-7603-49f4-80ac-14c0b9ca121c",
    },
    {
      "id": "e4d79146-18e3-4412-a57e-345a090eb0db",
      "name": "Invoice %2",
      "description": null,
      "serviceId": "c7e20280-6746-4edb-9a7c-8ff29c324eea",
    },
    {
      "id": "e5eff8ac-e262-4194-90fe-b5285f4d0af2",
      "name": "Gaaffi Itti Fayyadama Qabeenya Bishaanif Dhiyeessu",
      "description": null,
      "serviceId": "bd07182b-e95c-426f-9ddc-522c6c851b5b",
    },
    {
      "id": "e62b584a-9abd-4194-818f-7ac60ab4f05c",
      "name": "Barrefama Hundefamaa fi Dambii Ittin Bulmaataa",
      "description": null,
      "serviceId": "392c931c-c5e1-47db-ae80-186d2a96cce5",
    },
    {
      "id": "e6496a9f-0fde-4c83-8749-758ac206cb9b",
      "name": "Ragaa Dirree Irratti Dhiyaate",
      "description": null,
      "serviceId": "e8f0a7bd-a60d-4e68-9224-6876b38cad7c",
    },
    {
      "id": "e73645d8-956e-45b1-9468-31d309c04764",
      "name": "Xalayaa Jijjirra Maqaa",
      "description": null,
      "serviceId": "d1a85619-efba-497c-b854-a47a8c66b3c2",
    },
    {
      "id": "e7672a17-3842-4e1d-9b90-1f617ae66bb0",
      "name": "Karoora Hojii fi Bajataa",
      "description": null,
      "serviceId": "36830254-7603-49f4-80ac-14c0b9ca121c",
    },
    {
      "id": "eaa421d8-0fd7-4132-a4c1-ee2693e00ae0",
      "name": "Gaaffi Qorranno Qulqullina Bishaanii",
      "description": null,
      "serviceId": "c8f335a2-25f3-479a-b8c9-50e5297f8a34",
    },
    {
      "id": "ec44cef7-ded5-4371-98f7-2d2a28b26c78",
      "name": "Muxxannoo Lenjjissummaa Waggaa 2",
      "description": null,
      "serviceId": "8dae1245-4642-4d15-a338-52e88e21bc18",
    },
    {
      "id": "ed073e58-f925-4afd-976c-bc8cea1e88ad",
      "name": "Xalayaa Qabatanii Dhiyaachuu",
      "description": null,
      "serviceId": "824e2b8b-e831-4541-9a45-2a54ae9b0c4c",
    },
    {
      "id": "ed95a45b-1e6e-4e71-86c6-3b81adc1c9c4",
      "name": "waraqaa enyummaa ganda",
      "description": null,
      "serviceId": "e6fff1c2-a36a-414c-9256-1dafa2a979be",
    },
    {
      "id": "ef152066-1ac4-4ded-93fa-6a54c7374ae2",
      "name": "xalayaa Dhorkaa Qaama Aangoo Dhorkuu   Qabu Irraa Barra'ee",
      "description": null,
      "serviceId": "aa46f53c-01b5-4b51-a0bb-0d4e255e8164",
    },
    {
      "id": "ef6d7af6-8108-4558-a86a-d4c62a1b4d91",
      "name": "Baay'inna Ummataa",
      "description": null,
      "serviceId": "a4172090-d35f-44d6-9c8f-a4fe62dfcbb7",
    },
    {
      "id": "efba713b-4ca9-44ce-9d5d-de8a8d8186d7",
      "name": "Dizaayini Sirri Ta'ee Qabatanii Dhiyaachu",
      "description": null,
      "serviceId": "360087c9-2136-411d-a8f0-22df4d81bafa",
    },
    {
      "id": "f1556ad4-c887-43ba-9ea3-056ea859c1f9",
      "name": "Kiliraansii Waajjira Galii fi Waldaa Dhiyyessu ; Abbaan Dhimmaa kuusa Isaa ni Baasa fi Bolloo Baraa  kan godhate  tahuu Qaba",
      "description": null,
      "serviceId": "e0408764-e6bd-4c00-bd69-074fdd206c15",
    },
    {
      "id": "f18f0850-e0be-4179-8eef-183bc790640a",
      "name": "Karoora Hojii fi Bajataa",
      "description": null,
      "serviceId": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
    },
    {
      "id": "f1b84ef7-19b0-4346-bbbd-10d8113cdc2f",
      "name": "Waraqaa Lenjissummaa DhiraafDaani 3ffaa fi Isaa Ol Dubaraaf 2ffaafi Isaa Ol",
      "description": null,
      "serviceId": "8dae1245-4642-4d15-a338-52e88e21bc18",
    },
    {
      "id": "f1cb5274-71f6-41ae-9ac1-7168654a2562",
      "name": "Ssanadichi Taatewwan Qabaachut Irraa Eggamma",
      "description": null,
      "serviceId": "fbbb1ad5-98bc-495e-8d8a-029fb908291c",
    },
    {
      "id": "f213d318-a3a3-4fe9-8057-2c0bf1ead765",
      "name": "Bu'aa Odiitii",
      "description": null,
      "serviceId": "355b1c52-08e5-461c-a4fb-fa0d0e0fa940",
    },
    {
      "id": "f2319602-ef1a-407e-899b-c93f73544fba",
      "name": "Qaboo Ya'ii Koree Qindessittu Sadarkaa Sadarkaan Jiran Irra Dhufee",
      "description": null,
      "serviceId": "1b87687c-254a-4160-a2da-a518520c19ae",
    },
    {
      "id": "f2505ff4-bbe8-4853-9bf6-c24d21af322a",
      "name": "Xalayaa",
      "description": null,
      "serviceId": "976f2107-33f7-4529-a1a9-da874364f973",
    },
    {
      "id": "f3cfce25-e841-47b4-8835-77789e9a6400",
      "name": "Unkaa To'anno Aaanaa Dhabbattichi Itti  Argamu Irraa Gutame",
      "description": null,
      "serviceId": "86f3511e-648a-4e91-a791-9401dc15eab1",
    },
    {
      "id": "f4d6dbb0-efb4-409f-bdda-7e880a9931ee",
      "name": "Iyyata  Barrefamaa fi Afaani",
      "description": null,
      "serviceId": "c5f0fb23-c51a-48e8-a5aa-88965a3144a7",
    },
    {
      "id": "f511ca6d-82cf-48de-8abc-039aabcd1f42",
      "name": "Xalayaa Fedhii Dizaayiini Ibsu",
      "description": null,
      "serviceId": "57e54c18-bf04-4052-8156-686b4cf06687",
    },
    {
      "id": "f54bc128-c1dd-41fb-a208-8a7906d4bf0f",
      "name": "Ragaa Orijinaala Akka Mirkana'uu Barbaadamu",
      "description": null,
      "serviceId": "8529fa35-d948-48c0-85ad-7f1723ca7293",
    },
    {
      "id": "f6474ac4-17ad-4252-ab11-989c8f6f44e5",
      "name": "Baay;ina Miseensa Waldaa",
      "description": null,
      "serviceId": "39b83cb7-dabf-4bcd-8903-34c535d9fa81",
    },
    {
      "id": "f66b2d9f-9af9-46d0-b46d-ee04df4ee741",
      "name": "Xalayaa Seera Qabessa  Ta'een Gaafachuu",
      "description": null,
      "serviceId": "360087c9-2136-411d-a8f0-22df4d81bafa",
    },
    {
      "id": "f75cd373-9263-4823-bcd0-831eda12bcad",
      "name": "Lakk Baankii",
      "description": null,
      "serviceId": "39b83cb7-dabf-4bcd-8903-34c535d9fa81",
    },
    {
      "id": "f8756121-c721-4582-9005-89ee2e6109ba",
      "name": "Baay'ina Ummataa, Fageenya Humna Ibsaa EEU Irraa jiruu fi Teknoolojii Barbaadamuu",
      "description": null,
      "serviceId": "326d9f37-c2b5-4e91-89c1-e6d0cc9afa32",
    },
    {
      "id": "fa00117e-39a1-43f4-b708-0f62e8921edb",
      "name": "Gabaasa Hojii fi Bajataa",
      "description": null,
      "serviceId": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
    },
    {
      "id": "fae1b40b-1aa6-40a0-b552-6cd5e1d981d3",
      "name": "Ragaa Yakkoot Armaan Olii Waliin Hidhata Qabu",
      "description": null,
      "serviceId": "b0ffb9b2-83f1-4d29-aa51-728eb37c7cc5",
    },
    {
      "id": "fb0c81de-d735-4d87-b414-8388a7f113bc",
      "name": "Qorranno Piroojaktii",
      "description": null,
      "serviceId": "88a011fc-6c83-4a49-b750-5a61d06dc797",
    },
    {
      "id": "fb289957-631d-46ad-aa84-538bdcd32f7d",
      "name": "Dhimma Mana Hojii Oditara Muummichaattin Qabamee fi Qoratamaa Jiruu Irratti Kan Hin Taane Ta'uu Qaba",
      "description": null,
      "serviceId": "e00f6d6f-3a4a-4e55-8ddd-6f5b2727a5cd",
    },
    {
      "id": "fc2107d9-f0cb-4db5-b038-cec2fa192b7e",
      "name": "Ragaa Baasii fi Galii",
      "description": null,
      "serviceId": "549854a7-c1ae-4899-93a7-89854f339890",
    },
    {
      "id": "fc7d4b01-bce7-465e-a359-94f70bcd9b4e",
      "name": "Gosa Paampii Suphamuu",
      "description": null,
      "serviceId": "976f2107-33f7-4529-a1a9-da874364f973",
    },
    {
      "id": "fc896e69-61db-4da5-90b4-1b58ae547f08",
      "name": "Gosa Barnootaa",
      "description": null,
      "serviceId": "be39f394-53ee-497f-b39d-4d191bcaf357",
    },
    {
      "id": "fcb8b239-43ae-465a-aaef-cd0ac2ed45e6",
      "name": "Performance Garanti Dhiyeessu Qaba",
      "description": null,
      "serviceId": "1be5cfba-dcd7-46a4-bfee-a5f7b1abbb20",
    },
    {
      "id": "fe06388a-907d-4f24-bab5-26e931723a29",
      "name": "Karoora Hojii fi Bajata Qaboo Ya'ii",
      "description": null,
      "serviceId": "392c931c-c5e1-47db-ae80-186d2a96cce5",
    },
    {
      "id": "fee934b1-0302-4b3f-a136-4e92c733ebfa",
      "name": "Abbaan Dhimma Xalayaa Waajjira Poolisii Irraa Dhiyyessuu fi Kuusaa Isaa ni Baasa",
      "description": null,
      "serviceId": "e0408764-e6bd-4c00-bd69-074fdd206c15",
    }
  ],
  "serviceFor": [
    {
      "id": "04f19101-6b94-4b4f-b17d-c65664555238",
      "name": "Abbaa Dhimmaa Dhunfaa",
      "description": null,
      "serviceId": "824e2b8b-e831-4541-9a45-2a54ae9b0c4c",
    },
    {
      "id": "088ab78a-ceab-478d-bc60-857c45af8dd5",
      "name": "Waldaalee",
      "description": null,
      "serviceId": "392c931c-c5e1-47db-ae80-186d2a96cce5",
    },
    {
      "id": "0e26ab3d-09ed-449c-87d3-15626646baa6",
      "name": "Aanootaa fi Magaaloota G/Shawaa Bahaa Jalatti Argaman",
      "description": null,
      "serviceId": "a4172090-d35f-44d6-9c8f-a4fe62dfcbb7",
    },
    {
      "id": "105decf2-8771-44bf-b6f6-6476ffc0fe8a",
      "name": "Hojjattaa Fayyaa Sadarkaa Godinaa Irraa Hanga Kellaa fayya Jiran",
      "description": null,
      "serviceId": "c17b9a58-3905-4aaa-ad84-96d017177013",
    },
    {
      "id": "113ff3a5-a9ed-4f62-a874-1f938b0d68cf",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "dbc68074-704e-4de2-9510-e34f3cc50ca8",
    },
    {
      "id": "1189c257-85a7-4456-8a09-1167e05373a4",
      "name": "Aanoota fi Magaaloota G/shawa Bahaa Jalatti Argaman",
      "description": null,
      "serviceId": "bd07182b-e95c-426f-9ddc-522c6c851b5b",
    },
    {
      "id": "13c47905-7f71-40be-b389-8471ac7aa0d3",
      "name": "Abbaa dhimmaa",
      "description": null,
      "serviceId": "f8408180-afba-428f-be89-069f699e128e",
    },
    {
      "id": "16d5eef4-8bf3-490f-915b-c2f58f4ba88c",
      "name": "Aanoota fi Magaaloota G/shawaa Bahaa Jalatti Argaman fi Akkasumas Sektaroota",
      "description": null,
      "serviceId": "0851495e-b516-4e2b-a490-0f5e685f3b68",
    },
    {
      "id": "1ba34c16-5259-43a3-81e9-378450bebd4d",
      "name": "Heyyama Dhaabbilee Yoo THee Dhaabbilee Qofaatu Haaromsuu Danda'aa",
      "description": null,
      "serviceId": "fdbf28c0-c9c1-4327-b884-221bfbdd7cbb",
    },
    {
      "id": "1c938826-72d4-4f38-8604-9735f897b30d",
      "name": "Aanoota fi Magaaloota G/shawaa Bahaa Jalatti Argaman Akkasumas Sektaroota",
      "description": null,
      "serviceId": "fbbb1ad5-98bc-495e-8d8a-029fb908291c",
    },
    {
      "id": "264480ee-0450-450b-8ac9-a07a94944373",
      "name": "Daareektara Dhaabbattichaa",
      "description": null,
      "serviceId": "13222ab3-b1e9-4c42-bc13-1ec42a00f89a",
    },
    {
      "id": "278b6498-2460-4c72-a14c-c3be5b30dcfe",
      "name": "Abbaa Dhimma Dhunfaa ;Dhabbilee Adda Addaa fi Qaama Moottummaa",
      "description": null,
      "serviceId": "e0408764-e6bd-4c00-bd69-074fdd206c15",
    },
    {
      "id": "279b4bb7-d2de-4b20-9154-21c4d07fa815",
      "name": "Hojjataa",
      "description": null,
      "serviceId": "2f8c6004-33ed-4115-a425-f4ba9c019409",
    },
    {
      "id": "285751ef-2b83-4871-bf40-f5a09570ed66",
      "name": "Waldaalee",
      "description": null,
      "serviceId": "36830254-7603-49f4-80ac-14c0b9ca121c",
    },
    {
      "id": "2ac6b6bd-c796-40b0-a284-a271252486ca",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "4d846a21-e5f8-49f2-a967-d3a94fdf8864",
    },
    {
      "id": "2b7c98d8-a4d9-450b-a77e-40235dfb8c08",
      "name": "Qaamolee Nageenyaa  Hundaaf",
      "description": null,
      "serviceId": "06659662-1aae-43dd-972a-260dee1f3ed8",
    },
    {
      "id": "2e930a31-244a-4f2e-b7f9-224d7a302a86",
      "name": "dubartootaaf",
      "description": null,
      "serviceId": "4f58f171-0956-48f5-a997-f1e50bf6a311",
    },
    {
      "id": "387c1653-fc29-4449-9b54-43ddc6c4cdb6",
      "name": "Abbaaa Dhimmaa",
      "description": null,
      "serviceId": "b527d5a0-1f08-4c9b-b905-9ae5b431b70c",
    },
    {
      "id": "39e93d45-f130-4d77-b3c4-b0cbe846d376",
      "name": "Aanoota fi Magaaloota G/shawaa Bahaa Jalatti Argaman",
      "description": null,
      "serviceId": "326d9f37-c2b5-4e91-89c1-e6d0cc9afa32",
    },
    {
      "id": "3b29a111-95a5-4a76-9fee-214c5303d4e1",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "cc35c70f-05df-4e13-bdd2-8d3cccde6fa0",
    },
    {
      "id": "3c952071-04ed-4751-93d0-a699fe8de2f5",
      "name": "Waldaalee Interpiraayizii Ijaarsa Irratti Gurmaa'ana",
      "description": null,
      "serviceId": "01f10b33-2c44-40c1-94d5-e8601272d08a",
    },
    {
      "id": "3cf9a5b6-727b-4531-a84c-9b15bc84da4c",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "26190bdc-9647-4d42-b06c-3f0b0fee3441",
    },
    {
      "id": "3ee16b29-0957-4e99-a6d3-a8cada47ad52",
      "name": "Abbaa Dhimmaa DHunfaa",
      "description": null,
      "serviceId": "514a02c8-6986-4155-a199-edfd734ae0f8",
    },
    {
      "id": "40dd239f-26f1-4016-8129-d13c34d5cbd4",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "c6554f1b-3970-45ca-9d1a-f4a0f92de745",
    },
    {
      "id": "471836f1-d70b-471f-aeb5-a6e4ff9bd58c",
      "name": "Abbaa Dhimmaa Dhunfaa",
      "description": null,
      "serviceId": "209fd0ea-5389-43aa-ad45-30eddd0c32ce",
    },
    {
      "id": "48205623-bccb-4212-bdb9-5e99640c2daa",
      "name": "Oggeessa Fayyaa",
      "description": null,
      "serviceId": "845ed3fe-f137-4693-b80b-652b10249918",
    },
    {
      "id": "4a354783-d0a0-465b-87d0-576191bded70",
      "name": "Waldaalee",
      "description": null,
      "serviceId": "3a1c11e9-3d92-4b55-85a7-aa0e8812d725",
    },
    {
      "id": "4fe83bbd-ebe6-4d99-ad56-78fa066f0261",
      "name": "Nama dhunfaa",
      "description": null,
      "serviceId": "c7e20280-6746-4edb-9a7c-8ff29c324eea",
    },
    {
      "id": "529b253f-8bee-4a72-88dc-f9bda13087f0",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "450a78c4-1776-4dc5-9850-8f5062013f5b",
    },
    {
      "id": "52e9ffc1-3727-4a2c-b435-105f6cdcfe03",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "355b1c52-08e5-461c-a4fb-fa0d0e0fa940",
    },
    {
      "id": "5657b374-ea78-4c1e-930b-b25ec9268322",
      "name": "Dhaabbilee mootummaa fi miti Mootummaa",
      "description": null,
      "serviceId": "c7e20280-6746-4edb-9a7c-8ff29c324eea",
    },
    {
      "id": "58bc2152-e41f-4d47-8be7-6d4308551059",
      "name": "hojjataaf",
      "description": null,
      "serviceId": "86396516-cf9c-4876-9bd7-4af29ca82637",
    },
    {
      "id": "5a01b124-4033-46b5-b2d3-81c919c5c59b",
      "name": "Waldaalee Interpiraayizii",
      "description": null,
      "serviceId": "66ab7e77-f7a4-4b6c-8200-6941164d4fc0",
    },
    {
      "id": "63b29e91-dd48-490b-ab5e-2d584accf913",
      "name": "Hojataa motummatif",
      "description": null,
      "serviceId": "03861060-a202-432f-810e-3aab203188e1",
    },
    {
      "id": "673a5a9c-020f-4980-859c-e4caa2908cf3",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "9f9afed5-a7e0-463e-8c63-e37c3ed27f74",
    },
    {
      "id": "682d5754-212d-40c2-b134-0bb5d9ce9268",
      "name": "Abbaa Dhimmaa Kamuu",
      "description": null,
      "serviceId": "39b83cb7-dabf-4bcd-8903-34c535d9fa81",
    },
    {
      "id": "6aea0fae-f6da-45e5-8301-e3e11fe7e03f",
      "name": "Kaffaltoota Gibiraa",
      "description": null,
      "serviceId": "9a8ac3f2-0606-4c3b-bb05-217248b68f89",
    },
    {
      "id": "6b82fe72-f1ba-43de-b759-bbc29b49ba59",
      "name": "Kaffaltoota Gibiraa",
      "description": null,
      "serviceId": "d15e78a5-15da-47f8-a165-aa7a1f61657c",
    },
    {
      "id": "6d2c45cd-e622-42f9-9069-1f4c5d1a8979",
      "name": "Abbaa Dhimmaa  Hundaafuu",
      "description": null,
      "serviceId": "43ca0fb2-44c7-4a33-a447-02ab02a49663",
    },
    {
      "id": "6e9c079f-4322-42c7-8a89-14590c1b66c7",
      "name": "Abbaa Dhimma  Dhunfaa ; Dhaabbilee Adda Addaa fi Qaamolee Mootummaa",
      "description": null,
      "serviceId": "928edd8e-1ed2-4b28-a73e-6f1a12028b2d",
    },
    {
      "id": "6ef43343-a5c0-49c1-9bbd-921d81dd7d36",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "964a9011-c8e8-4b27-b773-67f83af9aff6",
    },
    {
      "id": "768548e6-2591-4883-bbd2-cb4d42dfe729",
      "name": "Hawaasa Hundaaf",
      "description": null,
      "serviceId": "c13f72f3-4334-4047-8d2f-a3999f412b85",
    },
    {
      "id": "769a7ba6-6b46-40d0-8a9c-b1d9e3a21a7c",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "e00f6d6f-3a4a-4e55-8ddd-6f5b2727a5cd",
    },
    {
      "id": "77e3cb03-c8d3-42f0-b13e-0db99b28d083",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "b0ffb9b2-83f1-4d29-aa51-728eb37c7cc5",
    },
    {
      "id": "793e2f61-571e-4807-920a-748a8a3abce5",
      "name": "Nama Dhunfaa Dhaabbilee Mootumma fi miti Mootummaa",
      "description": null,
      "serviceId": "fdbf28c0-c9c1-4327-b884-221bfbdd7cbb",
    },
    {
      "id": "7e0eb43d-be72-4649-80fc-7bff5b190afd",
      "name": "Aanoota fi Magaaloota G/shawaa Bahaa Jalatti Argaman Akkasumas Sektaroota",
      "description": null,
      "serviceId": "84352a7b-79a1-444e-a100-22d5c4dabb46",
    },
    {
      "id": "80b90d7d-e7fd-4a0f-9bb3-7a5bb6790de1",
      "name": "Abbaa Dhimmaa Dhunfaa",
      "description": null,
      "serviceId": "391e9e71-1fd9-4d94-8d8d-587ac3095c6a",
    },
    {
      "id": "86b4c656-468f-40c6-8b60-912ca9568747",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "aa46f53c-01b5-4b51-a0bb-0d4e255e8164",
    },
    {
      "id": "87d56a00-044c-462d-af94-bd691e4f1dbd",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "e8f0a7bd-a60d-4e68-9224-6876b38cad7c",
    },
    {
      "id": "890312cc-b783-40f2-a519-393f53675820",
      "name": "Gandootaa fi magalootaaf",
      "description": null,
      "serviceId": "f944d9a0-64b7-4056-b8f7-f0ba50fe2c73",
    },
    {
      "id": "89caf65c-211b-486a-ab43-f17c9622fd9d",
      "name": "Kaffaltoota Gibiraa",
      "description": null,
      "serviceId": "e56aadd7-c402-4428-a302-acb1fc4e87eb",
    },
    {
      "id": "8b530169-d4fc-41ed-9732-fe21e1131f2d",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "976f2107-33f7-4529-a1a9-da874364f973",
    },
    {
      "id": "8c6032c4-7d8b-42a4-9fd3-3b4b06ec33ab",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "8529fa35-d948-48c0-85ad-7f1723ca7293",
    },
    {
      "id": "8cdfa86e-a708-4a74-86fd-e5b4d2407237",
      "name": "Sektaroota Kessodhaaf",
      "description": null,
      "serviceId": "6695f1d1-d96b-49cd-bda2-1bc4a9caaee0",
    },
    {
      "id": "8d9771ad-844f-4027-bed3-af6cb231b878",
      "name": "Abbaa Dhimma Hundaafu",
      "description": null,
      "serviceId": "22adc289-c497-4075-a931-35be5bc9f931",
    },
    {
      "id": "8e9e9d79-25f7-4ffc-a993-4aef9594be01",
      "name": "Kaffaltoota Gibiraa fi Namoota Dhunfaa",
      "description": null,
      "serviceId": "8cc00cb2-c8a4-47c0-8849-32ce6291f8bc",
    },
    {
      "id": "96bb20ef-d583-43ed-94f2-95ef6d23a5b6",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "65e1c5c6-dd89-4fba-b71b-666b0581a236",
    },
    {
      "id": "9a5030a3-03a2-4955-bcd7-188ced026196",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "5d7158db-5005-48de-87e3-41de50e24521",
    },
    {
      "id": "9b660560-37cc-47f9-88bb-c19c485d1285",
      "name": "Abbaa Dhimmaa Dhunfaa",
      "description": null,
      "serviceId": "d78c9717-9361-4383-8009-ff4b4766efbf",
    },
    {
      "id": "a2894801-a43b-4402-9ced-76afd3e205f9",
      "name": "dubbartotaf",
      "description": null,
      "serviceId": "e6fff1c2-a36a-414c-9256-1dafa2a979be",
    },
    {
      "id": "a2e2a94c-92e8-4adb-a696-80c33dc84540",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "ed7c6c1c-448b-423a-88a3-d98f6f734ebe",
    },
    {
      "id": "a3424d4b-5087-4085-9a7f-82effb11d299",
      "name": "Nama Dhu nfaa ,Dhaabbilee Mootummmaa fi miiti Mootummaa",
      "description": null,
      "serviceId": "95f58ca9-0fae-4aba-a5f3-f1a8819ac173",
    },
    {
      "id": "a42eebe6-e4c7-41d6-85b2-80526ce1724c",
      "name": "Aanoota fi Magaaloota G/shawaa Bahaa Jalatti Argaman",
      "description": null,
      "serviceId": "18c5c8f5-baa4-4e9b-bad7-7b49acd8ac62",
    },
    {
      "id": "a4c9ab70-fa68-4f4a-bd2d-db6ecbb59dfa",
      "name": "Waldaalee Interpiraayizii Gurmaa'an",
      "description": null,
      "serviceId": "952fe9ae-b0c7-4e7c-89e3-be4914fb40b7",
    },
    {
      "id": "a584cdfc-22ca-48c4-8741-347ca2df1a9a",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "360087c9-2136-411d-a8f0-22df4d81bafa",
    },
    {
      "id": "adcd36ac-fc60-41f6-b0a1-dc949e8ab27e",
      "name": "Aanoota fi Magaaloota G/shawaa Bahaa Jalatti Argaman",
      "description": null,
      "serviceId": "4b6c3fc8-d4f9-4d78-8975-8fe6ceb70e92",
    },
    {
      "id": "ade72c5c-4445-4831-8ff5-c1002082c368",
      "name": "Abbaa Dhimma Dhunfaa ; Dhaabbilee Adda Addaa fi Qaama Mootumma",
      "description": null,
      "serviceId": "6fdde07d-81f5-4040-be9b-767cc0215f40",
    },
    {
      "id": "b060e2f9-e6df-44da-b40a-0b967d2a1b6d",
      "name": "dubbartotaf",
      "description": null,
      "serviceId": "c0b7148a-2d2b-4341-bc17-c9d60b460047",
    },
    {
      "id": "b9879493-4c4c-4684-9fc9-87a663c4260a",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "28a3145d-6b17-4c63-a002-b0ccac96493e",
    },
    {
      "id": "bc84c43b-d61c-42ac-8e9b-413eb6333a22",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "549854a7-c1ae-4899-93a7-89854f339890",
    },
    {
      "id": "bd9bc857-0ebe-4195-af19-879584a7553d",
      "name": "Aanoota fi Magaaloota G/shawaa Bahaa Jalatti Argaman",
      "description": null,
      "serviceId": "65e1c5c6-dd89-4fba-b71b-666b0581a236",
    },
    {
      "id": "be2e17a8-2241-41bc-a246-67da7fbd5c38",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "cb0b7afc-8097-46bf-9572-00de031d8e64",
    },
    {
      "id": "bea24f8d-9d7a-41e0-b8d5-cb95ba119901",
      "name": "Aanoota fi Magaaloota G/shawa Bahaa Jalatti Argaman",
      "description": null,
      "serviceId": "c8f335a2-25f3-479a-b8c9-50e5297f8a34",
    },
    {
      "id": "bfd90e30-65da-40fe-a16d-de8f38efc40d",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "7bbfae6e-b6ff-403b-82bb-6d5b12319158",
    },
    {
      "id": "c032bbb5-9c30-4c81-9651-170b8f70b476",
      "name": "Aanoota fi Magaaloota G/shawaa Bahaa Jalatti Argaman Akkasumas Sektaroota",
      "description": null,
      "serviceId": "82e60402-e65b-48c5-acc1-e95cb62186f9",
    },
    {
      "id": "c1054b6c-b80c-406a-9b49-9a9a6f4fb3e6",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "1be5cfba-dcd7-46a4-bfee-a5f7b1abbb20",
    },
    {
      "id": "c1d5eb0c-5b95-4fd5-89eb-759a080a56cd",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "8dae1245-4642-4d15-a338-52e88e21bc18",
    },
    {
      "id": "c2773e6d-2e38-49c6-a96b-832c42568b7a",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "2dd72ac4-5d84-4aa7-9797-fce1fdcc8d8c",
    },
    {
      "id": "c574f30c-bf94-464c-8cce-dd8fb9e8b9b2",
      "name": "Waldaa Hojii Gamtaa",
      "description": null,
      "serviceId": "601e4598-e1aa-4804-abc8-6d0b7cc08fd6",
    },
    {
      "id": "c77802a4-e360-4856-b0c6-f855361e7308",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "f473e8c7-80cf-4787-9e10-6dbd79d5877d",
    },
    {
      "id": "c9e22cb1-abe4-4658-8b76-065224539303",
      "name": "Waldaalee Interpiraayizii Gurmaa'an",
      "description": null,
      "serviceId": "29bedd98-d936-4203-984f-d1797be4ef0b",
    },
    {
      "id": "ce9b8cb1-ece6-4981-8241-70fa81b9c2a4",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "9d4a7897-4c04-4626-92cf-e772d4776368",
    },
    {
      "id": "cecbc42f-8c08-48e0-9c49-f6f61c853b0b",
      "name": "Nama Dhunfaa , Dhaabbilee Mootummaa fi miti Mootummaa",
      "description": null,
      "serviceId": "5b83e2e7-aa86-480b-8b57-eeec355d1b03",
    },
    {
      "id": "d2de95ee-a891-4eb0-8dd1-40cda364f6fc",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "58edfa34-0e84-419e-95fe-f4af36bc1099",
    },
    {
      "id": "d54346ad-3355-40e5-aa70-1266a8ee0888",
      "name": "hojetaa mottumaa",
      "description": null,
      "serviceId": "081af485-b176-46f4-8ec3-29bcc49508c9",
    },
    {
      "id": "d68a4f9e-daf4-4ee3-bb4f-d5f660d51c32",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "4eff135e-2db7-40b7-acaa-98ab47190114",
    },
    {
      "id": "d7949080-6d7f-4cef-86a1-5043090480c6",
      "name": "Harka qalayiif",
      "description": null,
      "serviceId": "c0b7148a-2d2b-4341-bc17-c9d60b460047",
    },
    {
      "id": "d87dd75a-263d-4e4e-9cd7-578c18e6d485",
      "name": "Waldaa Hojii Gamtaa Tahuu Qaba",
      "description": null,
      "serviceId": "a61909fb-89ff-4e99-923f-922b36c0f8db",
    },
    {
      "id": "d8e5c996-a2d4-41c3-8c9f-7fd18b567b71",
      "name": "Hawaasa Hundaa",
      "description": null,
      "serviceId": "c5f0fb23-c51a-48e8-a5aa-88965a3144a7",
    },
    {
      "id": "de6649da-f99c-4dd6-b7c8-24077d7cc591",
      "name": "Kaffalaa Gibiraa",
      "description": null,
      "serviceId": "514a02c8-6986-4155-a199-edfd734ae0f8",
    },
    {
      "id": "e06a4dd4-bc17-4529-ba1c-5f682b283e9d",
      "name": "Hoggansa",
      "description": null,
      "serviceId": "1b87687c-254a-4160-a2da-a518520c19ae",
    },
    {
      "id": "e29cdb3c-37ac-4705-8d66-47775820a24c",
      "name": "Waldaalee IMX",
      "description": null,
      "serviceId": "514a02c8-6986-4155-a199-edfd734ae0f8",
    },
    {
      "id": "e2cfd8dd-1d6b-4dd9-9c40-ac28d9056d7c",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "dbf0a495-0321-4d28-8b87-7770642faa02",
    },
    {
      "id": "e33af99a-6db1-4238-b2fa-0022c4944a03",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "d1a85619-efba-497c-b854-a47a8c66b3c2",
    },
    {
      "id": "e3ac5a78-98b9-4fdb-9bb2-5625f3d013a4",
      "name": "Aanoota , Magaaloota fi Seektaroota Moottummaa Godina Shawaa Bahaa Jala Jiran",
      "description": null,
      "serviceId": "57e54c18-bf04-4052-8156-686b4cf06687",
    },
    {
      "id": "e3c515c3-eace-491f-a31f-be1e5346bee4",
      "name": "Aanoota fi Magaaloota G/shawaa Bahaa Jalatti Argaman Akkasumas Sektaroota",
      "description": null,
      "serviceId": "7472e7c7-c839-484c-bf6e-49b4a5fdc864",
    },
    {
      "id": "e5a2fb65-54cc-4596-8f32-19955a5d1b59",
      "name": "Kaffaltoota Gibiraa",
      "description": null,
      "serviceId": "29f44708-f88f-4232-802a-95027d7de1fa",
    },
    {
      "id": "e62d8dbc-538f-4474-a6bf-145449907d15",
      "name": "Dhaabbille Dhunfaa",
      "description": null,
      "serviceId": "514a02c8-6986-4155-a199-edfd734ae0f8",
    },
    {
      "id": "e751c162-0da4-4d06-8dfd-f964e81679b5",
      "name": "Mannen Hojii",
      "description": null,
      "serviceId": "4654175b-4cef-4637-9803-77fcdfbe2cf8",
    },
    {
      "id": "e7537036-afa2-4a61-8bea-e4fa60a5cdde",
      "name": "Oggessa Hayyama Dhabbatichaaf Baasee",
      "description": null,
      "serviceId": "86f3511e-648a-4e91-a791-9401dc15eab1",
    },
    {
      "id": "edde60be-3ae1-4c01-ae46-c76cac4a7b0c",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "71e8c566-9c54-4933-b8a8-a89ed4b2a99d",
    },
    {
      "id": "f427172a-383e-4725-8303-895b5e6e52b8",
      "name": "Leenji'aa",
      "description": null,
      "serviceId": "18c5c8f5-baa4-4e9b-bad7-7b49acd8ac62",
    },
    {
      "id": "f513db8b-ad08-4638-9f88-f8f4c1391948",
      "name": "Qaama Moottummaa fi Kontiraaktara",
      "description": null,
      "serviceId": "179f8fae-275e-49c1-8ad9-ef10b33854c7",
    },
    {
      "id": "f6095da6-760d-4b2e-ac7e-e639bfbf5bc5",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "88a011fc-6c83-4a49-b750-5a61d06dc797",
    },
    {
      "id": "f86fabc7-2f04-4be8-afb8-a5ff3efd6d5e",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "eca2a955-dbff-4cc6-876d-b60044be9f67",
    },
    {
      "id": "f8c548bf-e8d9-4b6d-aa7e-1358ab519638",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "6b291339-4335-45fd-af55-0c7ecbd60474",
    },
    {
      "id": "faabb24f-a52c-4931-b0f9-3dd3a9307fe8",
      "name": "Abbaa Dhimmaa",
      "description": null,
      "serviceId": "1de5f168-0255-4599-8c53-c101ad0cdc96",
    },
    {
      "id": "fab75d5f-b165-4043-b0d1-4491dbaa547f",
      "name": "Nama Dhunfaa ,Dhaabbilee Mootumma fi Miti Mootummaa",
      "description": null,
      "serviceId": "4d5c048b-8d64-46e1-90a4-1bd904943795",
    },
    {
      "id": "fde78712-9422-4254-acd8-eed17b2dab12",
      "name": "Magaaloota",
      "description": null,
      "serviceId": "0a8f009c-be2b-4176-b348-823d62060fc6",
    },
    {
      "id": "fdf9761a-b37f-4aab-a1a7-db195caaf49a",
      "name": "Abbaa Dhimmaa Dhunfaa",
      "description": null,
      "serviceId": "94fe6660-e196-4d3f-a3b6-1c614d41f439",
    }
  ],
  "serviceStaffAssignment": [
    {
      "id": "182837a9-dcf8-4a8b-9f12-90578e1d8553",
      "serviceId": "86396516-cf9c-4876-9bd7-4af29ca82637",
      "staffId": "cmiwlcme80002jsp6pgv7h46q",
    },
    {
      "id": "1c000db6-72e7-42c4-862e-6a30055a3353",
      "serviceId": "4f58f171-0956-48f5-a997-f1e50bf6a311",
      "staffId": "b01174d5-8c27-4ba1-942f-2c76506a4862",
    },
    {
      "id": "80e7b317-1555-4c0d-bdef-d1a13e036960",
      "serviceId": "22adc289-c497-4075-a931-35be5bc9f931",
      "staffId": "cmiwlcme80002jsp6pgv7h46q",
    },
    {
      "id": "85e64973-1587-4d2c-8e82-16615bb6551e",
      "serviceId": "13222ab3-b1e9-4c42-bc13-1ec42a00f89a",
      "staffId": "6b414f29-cc4e-420c-adb5-fb2887b37a6a",
    },
    {
      "id": "b5af7edc-0e8f-4e94-9e1c-07abc032b2f4",
      "serviceId": "86f3511e-648a-4e91-a791-9401dc15eab1",
      "staffId": "6b414f29-cc4e-420c-adb5-fb2887b37a6a",
    }
  ],
  "gallery": [
    {
      "id": "10ad83ac-b82f-4325-9068-fbabc2826f1b",
      "name": "wajjirra mummee",
      "description": null,
    },
    {
      "id": "1d0a8227-3d7d-457b-87ec-f1de193a91b6",
      "name": "Falasama Eda 'amuu",
      "description": null,
    },
    {
      "id": "20381b1d-fb9f-4aa2-bc77-5173be4c9f6a",
      "name": "awash park ",
      "description": "",
    },
    {
      "id": "510265aa-b528-4b80-9c43-fd76fa747f66",
      "name": "Horsiisaa Lukkuu fi han qaquuu",
      "description": "",
    },
    {
      "id": "6f7823b9-687b-48ad-a485-e017131f485a",
      "name": "misoma Qamadii",
      "description": "",
    },
    {
      "id": "886e4c94-1f89-4c9d-94c2-65437872f7ff",
      "name": "Aadaa Karrayyuu",
      "description": "",
    },
    {
      "id": "b3731871-d615-4179-b9a5-c7dfb5f10b96",
      "name": "Arraddaa  Benunaa",
      "description": "",
    },
    {
      "id": "b4ebf08c-f5bf-4fba-b2b3-74ec763741cc",
      "name": "Misomaa Kuduraa fi Fuduraa",
      "description": null,
    },
    {
      "id": "de4ce9ad-863d-4465-85eb-55496ed26fea",
      "name": "Qonna Ammayaaa",
      "description": null,
    },
    {
      "id": "e3bc6014-ad39-46e9-8eb2-83f2c0ef59ac",
      "name": "asharaa magarisa",
      "description": "",
    },
    {
      "id": "eca9a846-d8fe-4e05-8751-3af37886d323",
      "name": "godinaa shawa bahaa ti hojjiwwan gurguddo",
      "description": "",
    },
    {
      "id": "f9a9ea29-d42d-4d2e-a901-494faf8d4129",
      "name": "East showa zone",
      "description": null,
    },
    {
      "id": "fc9924be-fcd4-4962-b0b0-68b975d0b400",
      "name": "Busaa Gonofaaa",
      "description": null,
    }
  ],
  "galleryImage": [
    {
      "id": "03124fbc-abe7-4e43-bf4e-7459a3236cb2",
      "galleryId": "20381b1d-fb9f-4aa2-bc77-5173be4c9f6a",
      "filename": "1765433147651-67231.jpg",
      "order": 0,
    },
    {
      "id": "05d199f2-26e4-4777-b112-9a3d505321aa",
      "galleryId": "b4ebf08c-f5bf-4fba-b2b3-74ec763741cc",
      "filename": "1767476887396-69112.jpg",
      "order": 2,
    },
    {
      "id": "09188b43-9c7b-46f3-b670-d2f784df4a71",
      "galleryId": "de4ce9ad-863d-4465-85eb-55496ed26fea",
      "filename": "1767477185608-41157.jpg",
      "order": 2,
    },
    {
      "id": "095943b8-eeb8-456b-be81-654f004f8970",
      "galleryId": "886e4c94-1f89-4c9d-94c2-65437872f7ff",
      "filename": "1765433251639-19384.jpg",
      "order": 0,
    },
    {
      "id": "1552f650-b318-487c-a088-18a6f92100ad",
      "galleryId": "510265aa-b528-4b80-9c43-fd76fa747f66",
      "filename": "1767477129768-55430.jpg",
      "order": 1,
    },
    {
      "id": "162dc432-a0ba-4c4c-91ce-6f269ff68f75",
      "galleryId": "b4ebf08c-f5bf-4fba-b2b3-74ec763741cc",
      "filename": "1767476926693-53141.jpg",
      "order": 8,
    },
    {
      "id": "18d7d183-a42f-4d7d-a035-a6be4af07933",
      "galleryId": "e3bc6014-ad39-46e9-8eb2-83f2c0ef59ac",
      "filename": "1767507478031-60154.jpg",
      "order": 1,
    },
    {
      "id": "1a35b818-fccd-4a32-9c49-af3e1a864815",
      "galleryId": "b4ebf08c-f5bf-4fba-b2b3-74ec763741cc",
      "filename": "1767476887468-27002.jpg",
      "order": 4,
    },
    {
      "id": "1a90f392-412d-4f1f-940a-53232407a8fb",
      "galleryId": "1d0a8227-3d7d-457b-87ec-f1de193a91b6",
      "filename": "1767507273989-79417.jpg",
      "order": 0,
    },
    {
      "id": "1d376f54-70b0-463f-82f7-055b7fda5934",
      "galleryId": "e3bc6014-ad39-46e9-8eb2-83f2c0ef59ac",
      "filename": "1767507478201-9387.jpg",
      "order": 4,
    },
    {
      "id": "1e200ec4-6dd7-47af-903b-cd6ade25c77d",
      "galleryId": "b4ebf08c-f5bf-4fba-b2b3-74ec763741cc",
      "filename": "1767476887440-30999.jpg",
      "order": 3,
    },
    {
      "id": "23661294-6c17-42d4-989b-aa346d89bfa4",
      "galleryId": "f9a9ea29-d42d-4d2e-a901-494faf8d4129",
      "filename": "1767507561871-72157.jpg",
      "order": 4,
    },
    {
      "id": "2802150f-62d4-45b9-a6ff-77d9295523d7",
      "galleryId": "510265aa-b528-4b80-9c43-fd76fa747f66",
      "filename": "1767477129734-77338.jpg",
      "order": 0,
    },
    {
      "id": "3083fab1-6579-4b04-99d6-478b1daa087e",
      "galleryId": "1d0a8227-3d7d-457b-87ec-f1de193a91b6",
      "filename": "1767507274044-65564.jpg",
      "order": 2,
    },
    {
      "id": "32073b9a-c4a3-4368-a6bd-65c24e14ce29",
      "galleryId": "e3bc6014-ad39-46e9-8eb2-83f2c0ef59ac",
      "filename": "1767507478076-96255.jpg",
      "order": 2,
    },
    {
      "id": "353ea998-a022-4d7e-9ae0-bfeaba993669",
      "galleryId": "b4ebf08c-f5bf-4fba-b2b3-74ec763741cc",
      "filename": "1767476887496-1353.jpg",
      "order": 5,
    },
    {
      "id": "368250eb-0c6e-461d-b18a-5eaac4a32af9",
      "galleryId": "de4ce9ad-863d-4465-85eb-55496ed26fea",
      "filename": "1767477185566-14349.jpg",
      "order": 1,
    },
    {
      "id": "3b81a4db-7328-4f3a-8788-bc449d13dd7c",
      "galleryId": "eca9a846-d8fe-4e05-8751-3af37886d323",
      "filename": "1767507330235-11500.jpg",
      "order": 1,
    },
    {
      "id": "3bc36762-b2d6-4d99-87b3-e5c7bd5d1e9e",
      "galleryId": "b4ebf08c-f5bf-4fba-b2b3-74ec763741cc",
      "filename": "1767476887349-41986.jpg",
      "order": 1,
    },
    {
      "id": "428ce9e1-0e3f-4d76-9304-4a19d50f9c2e",
      "galleryId": "f9a9ea29-d42d-4d2e-a901-494faf8d4129",
      "filename": "1767507561806-18078.jpg",
      "order": 2,
    },
    {
      "id": "49fd2246-e801-4c11-9781-96ff6e4b0ecd",
      "galleryId": "f9a9ea29-d42d-4d2e-a901-494faf8d4129",
      "filename": "1767507561736-80639.jpg",
      "order": 0,
    },
    {
      "id": "4d50b8cf-0774-4961-9c5d-e80e6cdfbc87",
      "galleryId": "eca9a846-d8fe-4e05-8751-3af37886d323",
      "filename": "1767507330261-32868.jpg",
      "order": 2,
    },
    {
      "id": "5376fe49-6b46-4093-a58f-890e02b821e2",
      "galleryId": "b4ebf08c-f5bf-4fba-b2b3-74ec763741cc",
      "filename": "1767476887524-25827.jpg",
      "order": 6,
    },
    {
      "id": "53d4feb7-c3da-4ae0-b459-8daf50fbeacd",
      "galleryId": "1d0a8227-3d7d-457b-87ec-f1de193a91b6",
      "filename": "1767507274071-65154.jpg",
      "order": 3,
    },
    {
      "id": "571c9e21-3f02-429e-9015-9257a96e3bb6",
      "galleryId": "10ad83ac-b82f-4325-9068-fbabc2826f1b",
      "filename": "1765433416288-65257.jpg",
      "order": 1,
    },
    {
      "id": "675f28ea-919a-4498-b28e-e7461885a456",
      "galleryId": "f9a9ea29-d42d-4d2e-a901-494faf8d4129",
      "filename": "1767507561905-57138.jpg",
      "order": 5,
    },
    {
      "id": "69d17879-4676-401e-93e1-bf8610c090b5",
      "galleryId": "e3bc6014-ad39-46e9-8eb2-83f2c0ef59ac",
      "filename": "1767507478160-58703.jpg",
      "order": 3,
    },
    {
      "id": "770a1bde-cf13-4569-83e2-39979e475e53",
      "galleryId": "b3731871-d615-4179-b9a5-c7dfb5f10b96",
      "filename": "1765437261136-55759.jpg",
      "order": 1,
    },
    {
      "id": "77abd2bb-4bc9-4233-9cb9-fe435b9e3665",
      "galleryId": "10ad83ac-b82f-4325-9068-fbabc2826f1b",
      "filename": "1765433416286-58356.jpg",
      "order": 0,
    },
    {
      "id": "793c3ea3-9589-4c3c-9f39-eae2668f5c4b",
      "galleryId": "e3bc6014-ad39-46e9-8eb2-83f2c0ef59ac",
      "filename": "1765437246179-47767.jpg",
      "order": 0,
    },
    {
      "id": "86be64ab-2730-4a4e-b704-cb42d582a6f0",
      "galleryId": "fc9924be-fcd4-4962-b0b0-68b975d0b400",
      "filename": "1767477107237-26353.jpg",
      "order": 2,
    },
    {
      "id": "89fb6d3a-224b-44cb-a5d3-c586272aa290",
      "galleryId": "6f7823b9-687b-48ad-a485-e017131f485a",
      "filename": "1765437355677-55310.jpg",
      "order": 0,
    },
    {
      "id": "8e0ed570-26ef-4bff-b936-0a8e1261294b",
      "galleryId": "eca9a846-d8fe-4e05-8751-3af37886d323",
      "filename": "1767507330323-10043.jpg",
      "order": 4,
    },
    {
      "id": "9268d8ec-3709-44b7-82a4-dfb74840ca73",
      "galleryId": "f9a9ea29-d42d-4d2e-a901-494faf8d4129",
      "filename": "1767507561839-2973.jpg",
      "order": 3,
    },
    {
      "id": "9708c5e1-80f7-447c-b9ee-7aa27ede63f9",
      "galleryId": "fc9924be-fcd4-4962-b0b0-68b975d0b400",
      "filename": "1767477107215-61146.jpg",
      "order": 1,
    },
    {
      "id": "9b58a67e-6526-4646-8245-8a64de841048",
      "galleryId": "1d0a8227-3d7d-457b-87ec-f1de193a91b6",
      "filename": "1767507274019-6578.jpg",
      "order": 1,
    },
    {
      "id": "a9169233-41e3-4553-a39b-d42dfe25bde9",
      "galleryId": "eca9a846-d8fe-4e05-8751-3af37886d323",
      "filename": "1767507330292-27197.jpg",
      "order": 3,
    },
    {
      "id": "be4c2d22-511c-4643-a0d6-edc0c5b3d380",
      "galleryId": "eca9a846-d8fe-4e05-8751-3af37886d323",
      "filename": "1767507330386-63250.jpg",
      "order": 6,
    },
    {
      "id": "c16d748c-69d4-4037-957b-a37aa38e124f",
      "galleryId": "b4ebf08c-f5bf-4fba-b2b3-74ec763741cc",
      "filename": "1767476926663-25485.jpg",
      "order": 7,
    },
    {
      "id": "d9e7378e-9ceb-4ac8-8b2e-04aa5e7e583d",
      "galleryId": "f9a9ea29-d42d-4d2e-a901-494faf8d4129",
      "filename": "1767507561772-49731.jpg",
      "order": 1,
    },
    {
      "id": "db70228a-c987-41e5-ac47-6ed15dd94fad",
      "galleryId": "de4ce9ad-863d-4465-85eb-55496ed26fea",
      "filename": "1767477185534-88350.jpg",
      "order": 0,
    },
    {
      "id": "ecb61518-0989-4c6d-b997-1721ce76d4d9",
      "galleryId": "b4ebf08c-f5bf-4fba-b2b3-74ec763741cc",
      "filename": "1767476887317-46028.jpg",
      "order": 0,
    },
    {
      "id": "efefb7aa-7a85-4efa-9eba-559f6b7c86d0",
      "galleryId": "b3731871-d615-4179-b9a5-c7dfb5f10b96",
      "filename": "1765433173898-16903.jpg",
      "order": 0,
    },
    {
      "id": "f0e4b418-5902-470a-ab45-396eb5da4119",
      "galleryId": "fc9924be-fcd4-4962-b0b0-68b975d0b400",
      "filename": "1767477107179-97846.jpg",
      "order": 0,
    },
    {
      "id": "f61ce566-48e9-40ea-bdab-97900c6748ec",
      "galleryId": "eca9a846-d8fe-4e05-8751-3af37886d323",
      "filename": "1767507330205-50713.jpg",
      "order": 0,
    },
    {
      "id": "f7807607-735b-42fa-a502-5106cc3da307",
      "galleryId": "eca9a846-d8fe-4e05-8751-3af37886d323",
      "filename": "1767507330357-39190.jpg",
      "order": 5,
    },
    {
      "id": "f9719a3b-ef79-4cfa-aec1-b0805518c95b",
      "galleryId": "e3bc6014-ad39-46e9-8eb2-83f2c0ef59ac",
      "filename": "1767507478323-7779.jpg",
      "order": 5,
    },
    {
      "id": "fe2aaa7e-b11b-4fda-bdba-a209a3973498",
      "galleryId": "510265aa-b528-4b80-9c43-fd76fa747f66",
      "filename": "1767477129794-57696.jpg",
      "order": 2,
    }
  ],
  "administration": [
    {
      "id": "d3369d1a-c5e1-4d9a-a49e-f210cc92aebd",
      "name": "Ababu Waqoo",
      "description": null,
      "image": "1767507891333-61510.jpg",
    }
  ],
  "report": [
    {
      "id": "cmiy3n28b0001jsc7tv614agp",
      "name": "Test ",
      "description": "Test ",
      "reportSentTo": "7c77f8b4-a145-48a9-99c2-1d3c9ca71f04",
      "receiverStatus": "pending",
      "reportSentBy": "ee9819f5-23a8-465b-8d99-13600a7a4b15",
    },
    {
      "id": "cmj1uy22l0001jswsogswpt5i",
      "name": "Hanae Gibbs",
      "description": "Non laboris sunt lor",
      "reportSentTo": "aacf0873-50a6-4204-b2a8-29621f8e68be",
      "receiverStatus": "pending",
      "reportSentBy": "8de91ac8-7ba0-4c33-b5c6-aab17504d91b",
    },
    {
      "id": "cmj4n56uk0001jsy71iwdrqzg",
      "name": "December report",
      "description": "This is a report for decenlmber month",
      "reportSentTo": "aacf0873-50a6-4204-b2a8-29621f8e68be",
      "receiverStatus": "pending",
      "reportSentBy": "8de91ac8-7ba0-4c33-b5c6-aab17504d91b",
    },
    {
      "id": "cmj652s7r0001js060e9ul6kg",
      "name": "gabaasa",
      "description": "ji'aa1ffa",
      "reportSentTo": "8de91ac8-7ba0-4c33-b5c6-aab17504d91b",
      "receiverStatus": "pending",
      "reportSentBy": "bd2a28a1-bef5-46d1-96ab-7b35e1d6bce9",
    },
    {
      "id": "cmj65arv60003js06uapq7qwu",
      "name": "wajjira dhimma Dubartoota",
      "description": "WDDA",
      "reportSentTo": "aacf0873-50a6-4204-b2a8-29621f8e68be",
      "receiverStatus": "read",
      "reportSentBy": "8de91ac8-7ba0-4c33-b5c6-aab17504d91b",
    }
  ]
};

/** ISO string -> Date. Every timestamp in the dataset is already ISO/UTC. */
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
      update: { code: r.code, name: r.name, description: r.description },
      create: {
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
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
      },
    }),
  );

  await seed("users", data.user, (r: any) =>
    prisma.user.upsert({
      where: { id: r.id },
      update: {
        username: r.username,
        phoneNumber: r.phoneNumber,
        password: hashedPassword,
        roleId: r.roleId,
        isActive: r.isActive,
        phoneVerified: r.phoneVerified,
      },
      create: {
        id: r.id,
        username: r.username,
        phoneNumber: r.phoneNumber,
        password: hashedPassword,
        roleId: r.roleId,
        isActive: r.isActive,
        phoneVerified: r.phoneVerified,
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
      },
    }),
  );

  const total = Object.values(data).reduce((n, rows) => n + rows.length, 0);
  console.log(
    `\n🎉 Seed complete — ${total} rows across ${Object.keys(data).length} tables.`,
  );
  console.log(`   Every user's password is "${SEED_PASSWORD}" (stored bcrypt-hashed).`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
