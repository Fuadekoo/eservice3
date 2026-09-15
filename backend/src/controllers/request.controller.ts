import type { Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db.js";
import type { Prisma } from "../lib/prisma-client.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createRequestSchema,
  updateRequestSchema,
  approveRequestByStaffSchema,
  approveRequestByAdminSchema,
  rejectRequestSchema,
  buildValidationError,
} from "../validators/request.validator.js";
import {
  generateRequestNumber,
  isRequestNumber,
  normalizeRequestNumber,
} from "../utils/notification.js";
import { sendSMS } from "../services/sms.service.js";
import { dispatch } from "../services/notification.service.js";
import {
  notifyRequestApprovedByManager,
  notifyRequestApprovedByStaff,
  notifyRequestRejected,
  notifyRequestSubmitted,
} from "../services/notification-events.js";
import {
  applyManagerApproval,
  applyRejection,
  applyStaffApproval,
  loadDecisionContext,
  resolveRequestRef,
  type DecisionActor,
  type DecisionContext,
  type RequestRef,
} from "../services/request-decisions.js";
import { mergeRequestSchema } from "../validators/request.validator.js";

/**
 * Request response include configuration
 */
const requestInclude = {
  user: {
    select: {
      id: true,
      username: true,
      phoneNumber: true,
    },
  },
  service: {
    include: {
      office: {
        select: {
          id: true,
          name: true,
          roomNumber: true,
          address: true,
          status: true,
        },
      },
    },
  },
  approveStaff: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          // The dashboard names whoever decided, so it needs the person's
          // name and not only their login handle.
          name: true,
          phoneNumber: true,
        },
      },
    },
  },
  approveManager: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  },
  mergedBy: {
    select: {
      id: true,
      user: { select: { id: true, username: true } },
    },
  },
  mergedInto: {
    select: { id: true, requestNumber: true },
  },
  // Duplicates folded into this one, so the desk can see at a glance what it
  // absorbed rather than having to search for the numbers it no longer shows.
  mergedDuplicates: {
    select: { id: true, requestNumber: true, createdAt: true },
  },
  fileData: true,
  appointments: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          phoneNumber: true,
        },
      },
      approveStaff: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  },
  customerSatisfaction: {
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

/**
 * Format request response with ISO date strings
 */
/**
 * What a `requestForOther` row needs loaded to be shown alongside an
 * ordinary request.
 */
const requestForOtherInclude = {
  user: { select: { id: true, username: true, phoneNumber: true } },
  service: {
    include: {
      office: {
        select: {
          id: true,
          name: true,
          roomNumber: true,
          address: true,
          status: true,
        },
      },
    },
  },
  approveStaff: {
    include: {
      user: { select: { id: true, username: true, name: true, phoneNumber: true } },
    },
  },
  approveManager: {
    include: {
      user: { select: { id: true, username: true, name: true, phoneNumber: true } },
    },
  },
  fileData: true,
  appointments: true,
} as const;

/**
 * Present a `requestForOther` row in the same shape as an ordinary request,
 * so one list can carry both.
 *
 * The two tables differ in three ways, reconciled here: a dependent request
 * has no reference number, carries a single `status` rather than the separate
 * staff/admin ones, and holds the beneficiary inline. Every row — of either
 * kind — comes back with `beneficiary`, which is null when the applicant
 * applied for themselves.
 */
function formatRequestForOther(row: any) {
  return {
    id: row.id,
    // Dependent requests are issued numbers from the same series now. Rows
    // created before that keep an empty string, which is what the UI already
    // renders as "no reference".
    requestNumber: row.requestNumber ?? "",
    // Says which table this row came from, so a client that needs to know —
    // the merge action, for instance — does not have to guess from shape.
    beneficiaryType: "other" as const,
    user: row.user,
    service: row.service,
    currentAddress: row.currentAddress,
    date: row.date.toISOString(),
    // The dependent request now goes through the same two gates as an
    // ordinary one, so these are real columns rather than a single status
    // mirrored twice.
    statusbystaff: row.statusbystaff ?? row.status,
    statusbyadmin: row.statusbyadmin ?? row.status,
    approveStaff: row.approveStaff ?? null,
    approveManager: row.approveManager ?? null,
    approveNote: row.approveNote ?? null,
    rejectionReason: row.rejectionReason ?? null,
    decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
    mergedInto: null,
    mergedDuplicates: [],
    mergedAt: null,
    mergeNote: null,
    beneficiary: {
      name: row.name,
      phoneNumber: row.phoneNumber,
      relationship: row.relationship,
    },
    fileData:
      row.fileData?.map((file: any) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })) || [],
    appointments:
      row.appointments?.map((apt: any) => ({
        ...apt,
        date: apt.date.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
      })) || [],
    customerSatisfaction: null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function formatRequest(req: any) {
  return {
    ...req,
    // Explicitly null rather than absent: "applied for themselves" is a fact
    // the list shows, not something the client should infer from a gap.
    beneficiary: null,
    beneficiaryType: "self" as const,
    // The reason a request was turned down, and when the decision was taken.
    // Both are shown to the customer — a rejection they cannot act on is
    // worse than no answer at all — so they travel with every read.
    rejectionReason: req.rejectionReason ?? null,
    decidedAt: req.decidedAt ? req.decidedAt.toISOString() : null,
    mergedAt: req.mergedAt ? req.mergedAt.toISOString() : null,
    mergedDuplicates:
      req.mergedDuplicates?.map((duplicate: any) => ({
        ...duplicate,
        createdAt: duplicate.createdAt.toISOString(),
      })) ?? [],
    date: req.date.toISOString(),
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
    fileData:
      req.fileData?.map((file: any) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })) || [],
    appointments:
      req.appointments?.map((apt: any) => ({
        ...apt,
        date: apt.date.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
      })) || [],
  };
}

/**
 * Create a request, claiming the next free request number.
 *
 * `generateRequestNumber` allocates from an atomic per-day counter, so under
 * normal operation the number is already unique and this succeeds first time.
 * The retry exists for the one case the counter cannot cover: a number written
 * outside this path (a restored backup, a manual insert) occupying a slot the
 * counter has not passed yet. Retrying re-allocates rather than reusing, and is
 * bounded so an unrelated unique conflict cannot spin forever.
 */
const REQUEST_NUMBER_MAX_ATTEMPTS = 5;

function isRequestNumberConflict(error: unknown): boolean {
  if ((error as { code?: string } | null)?.code !== "P2002") return false;

  // Where the offending column is reported depends on the driver: the classic
  // engine fills `meta.target`, while the MariaDB adapter nests it under
  // `meta.driverAdapterError.cause` (constraint index / MySQL error 1062 text).
  // Scanning the whole `meta` payload keeps this working across both.
  const meta = (error as { meta?: unknown }).meta;
  if (!meta) return false;

  try {
    const seen = new WeakSet<object>();
    const described = JSON.stringify(meta, (_key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      return value instanceof Error ? value.message : value;
    });
    return described?.includes("requestNumber") ?? false;
  } catch {
    return false;
  }
}

async function createRequestWithNumber(
  data: Omit<Prisma.requestUncheckedCreateInput, "requestNumber">,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < REQUEST_NUMBER_MAX_ATTEMPTS; attempt++) {
    const requestNumber = await generateRequestNumber();
    try {
      return await prisma.request.create({
        data: { ...data, requestNumber },
        include: requestInclude,
      });
    } catch (error) {
      if (!isRequestNumberConflict(error)) throw error;
      lastError = error;
      console.warn(
        `Request number ${requestNumber} was taken concurrently; retrying (${attempt + 1}/${REQUEST_NUMBER_MAX_ATTEMPTS})`,
      );
    }
  }

  throw lastError;
}

/**
 * Get user role
 */
async function getUserRole(userId: string): Promise<string> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  return dbUser?.role?.name?.toLowerCase() || "";
}

/**
 * Get manager's office
 */
async function getManagerOffice(userId: string): Promise<string | null> {
  const staff = await prisma.staff.findFirst({
    where: { userId },
    select: { officeId: true },
  });
  return staff?.officeId || null;
}

/**
 * Get staff record
 */
async function getStaffRecord(userId: string): Promise<{ id: string } | null> {
  return prisma.staff.findFirst({
    where: { userId },
    select: { id: true },
  });
}

/**
 * Get all managers for a given office
 */
async function getOfficeManagers(officeId: string) {
  return prisma.staff.findMany({
    where: {
      officeId,
      user: { role: { name: "manager" } },
    },
    include: {
      user: { select: { username: true, phoneNumber: true } },
    },
  });
}

/**
 * The overall status of a request, as a Prisma filter.
 *
 * What a person sees on a row is a function of both approval columns, so a
 * filter for it has to be written against the pair. Spelling the four states
 * out in one place keeps the list and the counts in agreement, and is what
 * makes "processing" — past staff review, waiting on the manager — filterable
 * at all: it used to be compared against the columns as a literal value, which
 * no row can ever hold, so that tab always came back empty.
 *
 * Returns null for anything that is not one of the four, which callers treat
 * as "no status filter" rather than as a filter matching nothing.
 */
function overallStatusClause(status: string): Record<string, unknown> | null {
  switch (status) {
    case "pending":
      // Nobody has decided yet. A rejection writes "rejected" to both columns,
      // so a staff column still reading "pending" cannot belong to a closed
      // request and there is nothing further to exclude.
      return { statusbystaff: "pending" };
    case "processing":
      return { statusbystaff: "approved", statusbyadmin: "pending" };
    case "approved":
      return { statusbystaff: "approved", statusbyadmin: "approved" };
    case "rejected":
      return {
        OR: [{ statusbystaff: "rejected" }, { statusbyadmin: "rejected" }],
      };
    default:
      return null;
  }
}

/** Free-text search across an ordinary request and the rows it hangs off. */
function requestSearchClause(search: string) {
  return {
    OR: [
      // Listed first so quoting a reference number is the fastest path —
      // `contains` also matches a partial number like "00042".
      { requestNumber: { contains: search } },
      { service: { name: { contains: search } } },
      { service: { office: { name: { contains: search } } } },
      { user: { username: { contains: search } } },
      { currentAddress: { contains: search } },
    ],
  };
}

/** The same search, against the columns a dependent request actually has. */
function requestForOtherSearchClause(search: string) {
  return {
    OR: [
      { requestNumber: { contains: search } },
      { name: { contains: search } },
      { phoneNumber: { contains: search } },
      { currentAddress: { contains: search } },
      { service: { name: { contains: search } } },
      { service: { office: { name: { contains: search } } } },
      { user: { username: { contains: search } } },
    ],
  };
}

/**
 * The rows a caller is allowed to see, as a pair of where clauses — one for
 * ordinary requests, one for those filed on behalf of a family member.
 *
 * Returns null when the role has no queue at all (a manager without an office,
 * a staff member with no assigned services), which callers answer with an
 * empty result rather than with the whole table.
 */
async function buildRequestScope(
  userId: string,
  officeId: string,
): Promise<{ where: any; otherWhere: any } | null> {
  const roleName = await getUserRole(userId);
  const isAdmin = ["admin", "administrator"].includes(roleName);
  const isManager = roleName === "manager";
  const isStaff = roleName === "staff";
  const isCustomer = roleName === "customer";

  const where: any = {};

  // A duplicate that has been folded into another request is finished work.
  // The office still reaches it by reference number, and the customer still
  // sees it on their own list, but it must not sit in the queue asking for a
  // second decision on something already being handled.
  if (!isCustomer) {
    where.mergedIntoId = null;
  }

  if (isCustomer) {
    where.userId = userId;
  } else if (isManager) {
    const managerOfficeId = await getManagerOffice(userId);
    if (!managerOfficeId) return null;
    where.service = { officeId: managerOfficeId };
  } else if (isStaff) {
    const staffRecord = await getStaffRecord(userId);
    if (!staffRecord) return null;

    const assignedServices = await prisma.serviceStaffAssignment.findMany({
      where: { staffId: staffRecord.id },
      select: { serviceId: true },
    });

    const serviceIds = assignedServices.map((a) => a.serviceId);
    if (serviceIds.length === 0) return null;

    where.serviceId = { in: serviceIds };
  }

  // Office filter (admin only)
  if (isAdmin && officeId) {
    where.service = { officeId };
  }

  // ── Requests submitted on behalf of a family member ────────────────
  // They live in their own table, so the same scope has to be expressed
  // against its columns: it has no requestNumber, a single `status`, and
  // its own denormalised officeId.
  const otherWhere: any = {};

  if (isCustomer) {
    otherWhere.userId = userId;
  } else if (isManager) {
    otherWhere.service = where.service;
  } else if (isStaff) {
    otherWhere.serviceId = where.serviceId;
  }

  if (isAdmin && officeId) {
    otherWhere.service = { officeId };
  }

  return { where, otherWhere };
}

/**
 * GET - Counts per overall status for the caller's queue.
 *
 * The dashboard used to tally whichever page it happened to be showing, so a
 * desk with sixty pending requests read "10 pending" — and the number moved
 * every time someone paged. These counts cover the whole queue, under the same
 * scope and search the list endpoint applies, so the tabs and the tiles say
 * what is actually there.
 */
export async function requestStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const search = (req.query.search as string) || "";
    const officeId = (req.query.officeId as string) || "";

    const empty = {
      total: 0,
      pending: 0,
      processing: 0,
      approved: 0,
      rejected: 0,
    };

    const scope = await buildRequestScope(userId, officeId);
    if (!scope) {
      return res.status(200).json({ success: true, data: empty });
    }

    const where = { ...scope.where };
    const otherWhere = { ...scope.otherWhere };

    if (search) {
      where.AND = [requestSearchClause(search)];
      otherWhere.AND = [requestForOtherSearchClause(search)];
    }

    const [selfGroups, otherGroups] = await Promise.all([
      prisma.request.groupBy({
        by: ["statusbystaff", "statusbyadmin"],
        where,
        _count: { _all: true },
      }),
      prisma.requestForOther.groupBy({
        by: ["statusbystaff", "statusbyadmin"],
        where: otherWhere,
        _count: { _all: true },
      }),
    ]);

    const counts = { ...empty };

    // The same fold the rows themselves go through, so a tile can never
    // disagree with the tab above it.
    for (const group of [...selfGroups, ...otherGroups]) {
      const count = group._count._all;
      counts.total += count;

      if (
        group.statusbystaff === "rejected" ||
        group.statusbyadmin === "rejected"
      ) {
        counts.rejected += count;
      } else if (
        group.statusbystaff === "approved" &&
        group.statusbyadmin === "approved"
      ) {
        counts.approved += count;
      } else if (group.statusbystaff === "approved") {
        counts.processing += count;
      } else {
        counts.pending += count;
      }
    }

    return res.status(200).json({ success: true, data: counts });
  } catch (error: any) {
    console.error("❌ Error counting requests:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to count requests",
    });
  }
}

/**
 * GET - List all requests (role-based access)
 */
export async function listRequests(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = (req.query.search as string) || "";
    const officeId = (req.query.officeId as string) || "";
    const status = (req.query.status as string) || "";

    const scope = await buildRequestScope(userId, officeId);
    if (!scope) {
      // The role has no queue — a manager without an office, or a staff member
      // with nothing assigned. An empty page, not the whole table.
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
      });
    }

    const where: any = { ...scope.where };
    const otherWhere: any = { ...scope.otherWhere };

    // Status and search are combined under a single AND list.
    //
    // They used to be written straight onto `where`, and the search branch
    // reconciled a clash with `where.AND = [where, searchConditions]` — which
    // makes `where` an element of itself. Prisma then recurses through the
    // cycle until the stack runs out, so filtering by status *and* searching
    // at the same time answered 500 rather than a result set. Building the
    // clauses in a list and assigning once cannot produce a cycle.
    const clauses: any[] = [];
    const otherClauses: any[] = [];

    // The two tables carry the same pair of approval columns, so one clause
    // serves both.
    const statusClause = status ? overallStatusClause(status) : null;
    if (statusClause) {
      clauses.push(statusClause);
      otherClauses.push(statusClause);
    }

    if (search) {
      clauses.push(requestSearchClause(search));
      otherClauses.push(requestForOtherSearchClause(search));
    }

    if (clauses.length > 0) {
      where.AND = clauses;
    }

    if (otherClauses.length > 0) {
      otherWhere.AND = otherClauses;
    }

    const skip = (page - 1) * pageSize;

    // Page N of the merged list can only be drawn from the first N pages of
    // either source, so taking that many from each and slicing afterwards
    // gives exactly the same rows a single sorted table would — no estimate.
    const upperBound = skip + pageSize;

    const [selfRows, otherRows, selfTotal, otherTotal] = await Promise.all([
      prisma.request.findMany({
        where,
        include: requestInclude,
        orderBy: { createdAt: "desc" },
        take: upperBound,
      }),
      prisma.requestForOther.findMany({
        where: otherWhere,
        include: requestForOtherInclude,
        orderBy: { createdAt: "desc" },
        take: upperBound,
      }),
      prisma.request.count({ where }),
      prisma.requestForOther.count({ where: otherWhere }),
    ]);

    const total = selfTotal + otherTotal;

    const merged = [
      ...selfRows.map(formatRequest),
      ...otherRows.map(formatRequestForOther),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(skip, skip + pageSize);

    return res.status(200).json({
      success: true,
      data: merged,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching requests:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch requests",
    });
  }
}

/**
 * GET - Get a specific request
 */
export async function getRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Accept either the internal id or the reference number the customer was
    // given, so a support agent can paste "REQ-20260825-00001" straight in.
    const identifier = (req.params.id as string) ?? "";

    const request = await prisma.request.findUnique({
      where: isRequestNumber(identifier)
        ? { requestNumber: normalizeRequestNumber(identifier) }
        : { id: identifier },
      include: requestInclude,
    });

    if (!request) {
      // The list mixes both kinds, so an id taken from it may belong to a
      // request submitted for a family member. Looking only in `request` is
      // what made those rows unreachable from every detail view.
      const proxy = await prisma.requestForOther.findUnique({
        where: isRequestNumber(identifier)
          ? { requestNumber: normalizeRequestNumber(identifier) }
          : { id: identifier },
        include: requestForOtherInclude,
      });

      if (proxy) {
        const proxyRole = await getUserRole(userId);
        const proxyIsAdmin = ["admin", "administrator"].includes(proxyRole);
        const allowed =
          proxyIsAdmin ||
          proxy.userId === userId ||
          (proxyRole !== "customer" &&
            (await getManagerOffice(userId)) === proxy.officeId);

        if (!allowed) {
          return res.status(403).json({ success: false, error: "Unauthorized" });
        }

        return res.status(200).json({
          success: true,
          data: formatRequestForOther(proxy),
        });
      }

      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Check authorization
    const roleName = await getUserRole(userId);
    const isAdmin = ["admin", "administrator"].includes(roleName);

    if (!isAdmin && request.userId !== userId) {
      const isManager = roleName === "manager";
      if (isManager) {
        const managerOfficeId = await getManagerOffice(userId);
        if (request.service.officeId !== managerOfficeId) {
          return res.status(403).json({
            success: false,
            error: "Unauthorized",
          });
        }
      } else if (roleName === "staff") {
        const staffRecord = await getStaffRecord(userId);
        if (!staffRecord) {
          return res.status(403).json({
            success: false,
            error: "Unauthorized",
          });
        }

        const assignedServices = await prisma.serviceStaffAssignment.findMany({
          where: { staffId: staffRecord.id },
          select: { serviceId: true },
        });

        const serviceIds = assignedServices.map((a) => a.serviceId);
        if (!serviceIds.includes(request.serviceId)) {
          return res.status(403).json({
            success: false,
            error: "Unauthorized",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          error: "Unauthorized",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: formatRequest(request),
    });
  } catch (error: any) {
    console.error("❌ Error fetching request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch request",
    });
  }
}

/**
 * POST - Create a new request
 */
export async function createRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Validate request body
    const validation = createRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { serviceId, currentAddress, date, notes, files } = validation.data;

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { office: true },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    // Create the request together with its reference number, so the number the
    // customer is told is the one stored on the row and can be searched for.
    const newRequest = await createRequestWithNumber({
      id: randomUUID(),
      userId,
      serviceId,
      // Denormalised so the office can be filtered and counted without joining
      // through the service on every read.
      officeId: service.officeId,
      currentAddress,
      date: new Date(date),
      statusbystaff: "pending",
      statusbyadmin: "pending",
      ...(files.length > 0
        ? {
            fileData: {
              create: files.map((file) => ({
                id: randomUUID(),
                name: file.name,
                filepath: file.filepath,
                description: file.description || notes || null,
              })),
            },
          }
        : {}),
    });

    const requestNumber = newRequest.requestNumber;

    console.log(`✅ Created request: ${newRequest.id} (${requestNumber})`);

    // In-app + web push, to the customer, the assigned staff and the managers.
    // Fire-and-forget: the request is already saved, and a push service being
    // slow or down must never turn a successful application into an error.
    dispatch(
      notifyRequestSubmitted({
        requestId: newRequest.id,
        requestNumber,
        customerUserId: userId,
        customerName: newRequest.user.username,
        serviceId,
        serviceName: service.name,
        officeId: service.officeId,
        officeName: service.office.name,
        appointmentDate: date,
      }),
    );

    // Send notifications (fire-and-forget — never block the response)
    (async () => {
      try {
        const assignedStaff = await prisma.serviceStaffAssignment.findMany({
          where: { serviceId },
          include: {
            staff: {
              include: {
                user: { select: { id: true, phoneNumber: true, username: true } },
              },
            },
          },
        });

        const customerName = newRequest.user.username;
        const customerPhone = newRequest.user.phoneNumber ?? "N/A";
        const requestDate = new Date(date).toLocaleDateString("en-GB");

        // --- Confirm receipt to the customer ---
        if (newRequest.user.phoneNumber) {
          const customerMsg =
            `Dear ${customerName},\n\n` +
            `Thank you for applying for "${service.name}" at ${service.office.name}.\n\n` +
            `Your request has been received and is now under review. Please wait while our team processes it.\n\n` +
            `Request No: ${requestNumber}`;

          sendSMS(newRequest.user.phoneNumber, customerMsg).catch((e) =>
            console.error(
              `SMS to customer ${newRequest.user.phoneNumber} failed:`,
              e,
            ),
          );
        }

        // --- Notify each assigned staff ---
        for (const assignment of assignedStaff) {
          const staffPhone = assignment.staff.user.phoneNumber;
          if (!staffPhone) continue;

          const staffMsg =
            `New service request received.\n\n` +
            `Service: ${service.name}\n` +
            `Customer: ${customerName}\n` +
            `Phone: ${customerPhone}\n` +
            `Address: ${currentAddress}\n` +
            `Date: ${requestDate}\n` +
            `Request No: ${requestNumber}\n\n` +
            `Office: ${service.office.name} - Room ${service.office.roomNumber}\n\n` +
            `Please login to review and process this request.`;

          sendSMS(staffPhone, staffMsg).catch((e) =>
            console.error(`SMS to staff ${staffPhone} failed:`, e),
          );
        }

        // --- Notify manager(s) of the office ---
        const managers = await getOfficeManagers(service.officeId);
        const staffNames =
          assignedStaff.map((a) => a.staff.user.username).join(", ") || "None";

        for (const manager of managers) {
          const managerPhone = manager.user.phoneNumber;
          if (!managerPhone) continue;

          const managerMsg =
            `New service request received.\n\n` +
            `Service: ${service.name}\n` +
            `Customer: ${customerName}\n` +
            `Phone: ${customerPhone}\n` +
            `Date: ${requestDate}\n` +
            `Request No: ${requestNumber}\n\n` +
            `Assigned staff: ${staffNames}\n\n` +
            `Please review on the dashboard.`;

          sendSMS(managerPhone, managerMsg).catch((e) =>
            console.error(`SMS to manager ${managerPhone} failed:`, e),
          );
        }
      } catch (notificationError) {
        console.error("Failed to send request notifications:", notificationError);
      }
    })();

    return res.status(201).json({
      success: true,
      data: {
        ...formatRequest(newRequest),
        requestNumber,
      },
      message: "Request created successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create request",
    });
  }
}

/**
 * PATCH - Update a request
 */
export async function updateRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.id as string;

    // Validate request body
    const validation = updateRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    // The list mixes ordinary and family requests, so the id may belong to
    // either table — see `requireRequestRef`.
    const ref = await resolveRequestRef(requestId);
    const existingRequest = ref ? await loadDecisionContext(ref) : null;

    if (!ref || !existingRequest) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Check authorization (only customer or admin)
    const roleName = await getUserRole(userId);
    const isAdmin = ["admin", "administrator"].includes(roleName);

    if (!isAdmin && existingRequest.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Prevent updates once the office has finished deciding.
    if (
      existingRequest.statusbystaff === "approved" &&
      existingRequest.statusbyadmin === "approved"
    ) {
      return res.status(400).json({
        success: false,
        error: "Cannot update approved request",
      });
    }

    const { currentAddress, date } = validation.data;
    const updateData: any = {};

    if (currentAddress) updateData.currentAddress = currentAddress;
    if (date) updateData.date = new Date(date);

    if (ref.kind === "self") {
      await prisma.request.update({
        where: { id: ref.id },
        data: updateData,
        include: requestInclude,
      });
    } else {
      await prisma.requestForOther.update({
        where: { id: ref.id },
        data: updateData,
      });
    }

    return res.status(200).json({
      success: true,
      data: await readDecided(ref),
      message: "Request updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update request",
    });
  }
}

/**
 * Resolve the id in the URL to whichever table owns it, or answer 404.
 *
 * The dashboard lists ordinary requests and requests submitted for a family
 * member in one table, so the id arriving here belongs to either. Looking only
 * in `request` is what made approving a family request fail with
 * "Request not found".
 */
async function requireRequestRef(
  req: AuthRequest,
  res: Response,
): Promise<{ ref: RequestRef; context: DecisionContext } | null> {
  const identifier = (req.params.id as string) ?? "";
  const ref = await resolveRequestRef(identifier);

  if (!ref) {
    res.status(404).json({
      success: false,
      error: "Request not found",
    });
    return null;
  }

  const context = await loadDecisionContext(ref);
  if (!context) {
    res.status(404).json({
      success: false,
      error: "Request not found",
    });
    return null;
  }

  return { ref, context };
}

/**
 * Refuse a decision on a request belonging to another office.
 *
 * The route guards decide who may reach the endpoint; they cannot know which
 * office a given row belongs to. Without this a staff member holding
 * `request:approve-staff` could approve any office's request by id.
 *
 * Administrators are exempt, and so is the case where the office genuinely
 * cannot be determined — refusing on missing data would break decisions on
 * older rows rather than protect anything.
 */
async function officeMismatch(
  req: AuthRequest,
  context: DecisionContext,
): Promise<boolean> {
  if (req.isAdmin) return false;

  const actorOfficeId = req.user?.staff?.officeId;
  if (!actorOfficeId || !context.officeId) return false;

  return actorOfficeId !== context.officeId;
}

/** The staff record behind an id, used to attribute a decision to a person. */
async function resolveActor(staffId: string): Promise<DecisionActor | null> {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, user: { select: { username: true, name: true } } },
  });

  if (!staff) return null;

  return {
    staffId: staff.id,
    label: staff.user.name ?? staff.user.username,
  };
}

/** Read a decided request back in its API shape, whichever table it is in. */
async function readDecided(ref: RequestRef) {
  if (ref.kind === "self") {
    const row = await prisma.request.findUnique({
      where: { id: ref.id },
      include: requestInclude,
    });
    return row ? formatRequest(row) : null;
  }

  const row = await prisma.requestForOther.findUnique({
    where: { id: ref.id },
    include: requestForOtherInclude,
  });
  return row ? formatRequestForOther(row) : null;
}

/** The reference to quote back to the customer, when the row has one. */
function referenceSuffix(requestNumber: string | null): string {
  return requestNumber ? "\n\nRequest No: " + requestNumber : "";
}

/**
 * PATCH - Approve request by staff
 *
 * Works for both ordinary and dependent requests; see `requireRequestRef`.
 */
export async function approveRequestByStaff(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const validation = approveRequestByStaffSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { staffId, notes } = validation.data;

    const resolved = await requireRequestRef(req, res);
    if (!resolved) return;
    const { ref, context } = resolved;

    if (await officeMismatch(req, context)) {
      return res.status(403).json({
        success: false,
        error: "This request belongs to another office.",
      });
    }

    if (context.mergedIntoId) {
      return res.status(400).json({
        success: false,
        error:
          "This request was merged into another one. Decide on the request it was merged into.",
      });
    }

    if (context.statusbystaff !== "pending") {
      return res.status(400).json({
        success: false,
        error:
          "This request has already been " +
          context.statusbystaff +
          " at staff level.",
      });
    }

    const actor = await resolveActor(staffId);
    if (!actor) {
      return res.status(404).json({
        success: false,
        error: "Staff not found",
      });
    }

    await applyStaffApproval(ref, actor, notes);

    // Customer hears it moved forward; the office managers hear it now needs
    // their decision.
    dispatch(
      notifyRequestApprovedByStaff({
        requestId: ref.id,
        customerUserId: context.userId,
        requestNumber: context.requestNumber,
        customerName: context.customerName,
        serviceName: context.serviceName,
        officeId: context.officeId,
        actorStaffId: actor.staffId,
        note: notes ?? null,
      }),
    );

    if (context.customerPhone) {
      const customerMsg =
        "Dear " + context.customerName + ",\n\n" +
        "Your request for \"" + context.serviceName + "\" has been reviewed " +
        "and approved by staff.\n\n" +
        "It is now pending manager approval. You will be notified once fully approved." +
        (notes ? "\n\nNote: " + notes : "") +
        referenceSuffix(context.requestNumber);

      sendSMS(context.customerPhone, customerMsg).catch((e) =>
        console.error("Customer SMS (staff approval) failed:", e),
      );
    }

    return res.status(200).json({
      success: true,
      data: await readDecided(ref),
      message: "Request approved by staff successfully",
    });
  } catch (error: any) {
    console.error("❌ Error approving request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to approve request",
    });
  }
}

/**
 * PATCH - Approve request by admin/manager
 */
export async function approveRequestByAdmin(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const validation = approveRequestByAdminSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { approverId, notes } = validation.data;

    const resolved = await requireRequestRef(req, res);
    if (!resolved) return;
    const { ref, context } = resolved;

    if (await officeMismatch(req, context)) {
      return res.status(403).json({
        success: false,
        error: "This request belongs to another office.",
      });
    }

    if (context.mergedIntoId) {
      return res.status(400).json({
        success: false,
        error:
          "This request was merged into another one. Decide on the request it was merged into.",
      });
    }

    if (context.statusbyadmin !== "pending") {
      return res.status(400).json({
        success: false,
        error: "This request has already been " + context.statusbyadmin + ".",
      });
    }

    // Manager sign-off is the second gate, so the first has to have been
    // passed. Approving out of order would leave a request approved overall
    // with nobody recorded as having checked it.
    //
    // Administrators are exempt: this endpoint is also how an admin decides a
    // request outright, and that route existed before the ordering rule did.
    // Refusing them here would take away a working path rather than protect
    // anything — an admin approval is itself an accountable, recorded act.
    if (!req.isAdmin && context.statusbystaff !== "approved") {
      return res.status(400).json({
        success: false,
        error: "This request is still awaiting staff review.",
      });
    }

    const actor = await resolveActor(approverId);
    if (!actor) {
      return res.status(404).json({
        success: false,
        error: "Approver not found",
      });
    }

    await applyManagerApproval(ref, actor, notes);

    // Final approval — the customer's notification carries the address,
    // because "where do I go now?" is the only thing left to answer.
    dispatch(
      notifyRequestApprovedByManager({
        requestId: ref.id,
        customerUserId: context.userId,
        requestNumber: context.requestNumber,
        customerName: context.customerName,
        serviceName: context.serviceName,
        officeName: context.officeName,
        roomNumber: context.officeRoomNumber,
        address: context.officeAddress,
        actorStaffId: actor.staffId,
        note: notes ?? null,
      }),
    );

    if (context.customerPhone) {
      const customerMsg =
        "Dear " + context.customerName + ",\n\n" +
        "Your request for \"" + context.serviceName + "\" has been approved.\n\n" +
        "Please visit " + context.officeName + " (Room " +
        context.officeRoomNumber + ", " + context.officeAddress +
        ") for further assistance." +
        (notes ? "\n\nNote: " + notes : "") +
        referenceSuffix(context.requestNumber);

      sendSMS(context.customerPhone, customerMsg).catch((e) =>
        console.error("Customer SMS (manager approval) failed:", e),
      );
    }

    return res.status(200).json({
      success: true,
      data: await readDecided(ref),
      message: "Request approved by admin successfully",
    });
  } catch (error: any) {
    console.error("❌ Error approving request by admin:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to approve request",
    });
  }
}

/**
 * PATCH - Reject a request
 *
 * The reason is written to the row, not only sent out. It used to live purely
 * inside the SMS and the push notification, so a customer who missed both saw
 * "Rejected" in the portal with no way to find out why.
 */
export async function rejectRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const validation = rejectRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { rejectionReason } = validation.data;

    const resolved = await requireRequestRef(req, res);
    if (!resolved) return;
    const { ref, context } = resolved;

    if (await officeMismatch(req, context)) {
      return res.status(403).json({
        success: false,
        error: "This request belongs to another office.",
      });
    }

    // Record who made the decision, on the same column the approval path uses
    // for that role. Without it a rejection is anonymous, and the per-staff
    // figures on the overview pages can only ever count approvals.
    const [roleName, actorStaff] = await Promise.all([
      getUserRole(userId),
      getStaffRecord(userId),
    ]);

    const actor: DecisionActor | null = actorStaff
      ? await resolveActor(actorStaff.id)
      : null;

    await applyRejection(ref, actor, rejectionReason, roleName === "staff");

    // The reason travels with the notification too — one copy for the person
    // reading their phone, one for the person reading the portal later.
    dispatch(
      notifyRequestRejected({
        requestId: ref.id,
        customerUserId: context.userId,
        requestNumber: context.requestNumber,
        customerName: context.customerName,
        serviceName: context.serviceName,
        serviceId: context.serviceId,
        reason: rejectionReason,
      }),
    );

    if (context.customerPhone) {
      const customerMsg =
        "Dear " + context.customerName + ",\n\n" +
        "Your request for \"" + context.serviceName + "\" has been rejected.\n\n" +
        "Reason: " + rejectionReason + "\n\n" +
        "For more information, please contact us." +
        referenceSuffix(context.requestNumber);

      sendSMS(context.customerPhone, customerMsg).catch((e) =>
        console.error("Customer SMS (rejection) failed:", e),
      );
    }

    return res.status(200).json({
      success: true,
      data: await readDecided(ref),
      message: "Request rejected successfully",
    });
  } catch (error: any) {
    console.error("❌ Error rejecting request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to reject request",
    });
  }
}

/**
 * POST - Merge duplicate requests into this one.
 *
 * Customers routinely apply twice — the first submission appears not to have
 * worked, or a second family member files the same thing — and the office had
 * no way to say so. Both copies stayed in the queue, each needing its own
 * decision, and every count included them twice.
 *
 * Merging keeps every row. The duplicates are marked as merged into the one
 * the office is keeping, their attachments are re-pointed at it so nothing the
 * customer uploaded is lost, and they are closed with a note naming the
 * survivor. The reference numbers the customers were given therefore keep
 * working, and still lead to wherever the work actually continued.
 */
export async function mergeRequests(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const validation = mergeRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: buildValidationError(validation.error),
      });
    }

    const { duplicateIds, note } = validation.data;

    const primaryRef = await resolveRequestRef((req.params.id as string) ?? "");

    if (!primaryRef) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }

    if (primaryRef.kind !== "self") {
      // Dependent requests live in their own table with no merge column, so
      // one can be folded into an ordinary request but never be the survivor.
      return res.status(400).json({
        success: false,
        error:
          "A request submitted for a family member cannot be the surviving request in a merge.",
      });
    }

    const primaryContext = await loadDecisionContext(primaryRef);
    if (!primaryContext) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }

    if (await officeMismatch(req, primaryContext)) {
      return res.status(403).json({
        success: false,
        error: "This request belongs to another office.",
      });
    }

    if (primaryContext.mergedIntoId) {
      return res.status(400).json({
        success: false,
        error: "This request has itself been merged into another one.",
      });
    }

    // Resolve every duplicate before writing anything, so one bad id fails the
    // whole merge rather than leaving it half applied.
    const resolvedDuplicates: { ref: RequestRef; context: DecisionContext }[] = [];

    for (const duplicateId of duplicateIds) {
      const ref = await resolveRequestRef(duplicateId);
      if (!ref) {
        return res.status(404).json({
          success: false,
          error: "Request " + duplicateId + " was not found.",
        });
      }

      if (ref.kind === primaryRef.kind && ref.id === primaryRef.id) {
        return res.status(400).json({
          success: false,
          error: "A request cannot be merged into itself.",
        });
      }

      const context = await loadDecisionContext(ref);
      if (!context) {
        return res.status(404).json({
          success: false,
          error: "Request " + duplicateId + " was not found.",
        });
      }

      const label = context.requestNumber ?? duplicateId;

      if (await officeMismatch(req, context)) {
        return res.status(403).json({
          success: false,
          error: "Request " + label + " belongs to another office.",
        });
      }

      // Merging across customers would silently hand one person's documents
      // to another, so the applicant has to match.
      if (context.userId !== primaryContext.userId) {
        return res.status(400).json({
          success: false,
          error:
            "Only requests from the same customer can be merged. " +
            label + " belongs to someone else.",
        });
      }

      if (context.mergedIntoId) {
        return res.status(400).json({
          success: false,
          error: "Request " + label + " has already been merged.",
        });
      }

      resolvedDuplicates.push({ ref, context });
    }

    const actorStaff = await getStaffRecord(userId);
    const mergedAt = new Date();
    const mergeNote =
      note?.trim() ||
      "Merged into " + (primaryContext.requestNumber ?? primaryRef.id) + ".";

    await prisma.$transaction(async (tx) => {
      for (const { ref } of resolvedDuplicates) {
        if (ref.kind === "self") {
          // Attachments follow the work, so the surviving request carries
          // everything the customer ever sent about this matter.
          await tx.fileData.updateMany({
            where: { requestId: ref.id },
            data: { requestId: primaryRef.id },
          });

          await tx.request.update({
            where: { id: ref.id },
            data: {
              mergedIntoId: primaryRef.id,
              mergedAt,
              mergedById: actorStaff?.id ?? null,
              mergeNote,
              // Closed rather than left pending: a merged duplicate must stop
              // appearing as work somebody still owes a decision on.
              statusbystaff: "rejected",
              statusbyadmin: "rejected",
              rejectionReason: mergeNote,
              decidedAt: mergedAt,
            },
          });
          continue;
        }

        await tx.fileData.updateMany({
          where: { requestForOtherId: ref.id },
          data: { requestForOtherId: null, requestId: primaryRef.id },
        });

        await tx.requestForOther.update({
          where: { id: ref.id },
          data: {
            statusbystaff: "rejected",
            statusbyadmin: "rejected",
            status: "rejected",
            rejectionReason: mergeNote,
            decidedAt: mergedAt,
          },
        });
      }
    });

    console.log(
      "✅ Merged " + resolvedDuplicates.length + " request(s) into " +
        (primaryContext.requestNumber ?? primaryRef.id),
    );

    return res.status(200).json({
      success: true,
      data: await readDecided(primaryRef),
      mergedCount: resolvedDuplicates.length,
      message:
        resolvedDuplicates.length + " duplicate request(s) merged successfully",
    });
  } catch (error: any) {
    console.error("❌ Error merging requests:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to merge requests",
    });
  }
}

/**
 * DELETE - Delete a request
 */
export async function deleteRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const requestId = req.params.id as string;

    // Family requests live in their own table; withdrawing one has to work
    // from the same list the customer withdrew an ordinary one from.
    const ref = await resolveRequestRef(requestId);
    const existingRequest = ref ? await loadDecisionContext(ref) : null;

    if (!ref || !existingRequest) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Check authorization (only customer or admin)
    const roleName = await getUserRole(userId);
    const isAdmin = ["admin", "administrator"].includes(roleName);

    if (!isAdmin && existingRequest.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Prevent deletion once either gate has approved it.
    if (
      existingRequest.statusbystaff === "approved" ||
      existingRequest.statusbyadmin === "approved"
    ) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete approved request",
      });
    }

    if (ref.kind === "self") {
      // Attachments first: `fileData.requestId` has no cascade, so deleting
      // the request without them leaves orphaned rows pointing at nothing.
      await prisma.fileData.deleteMany({ where: { requestId: ref.id } });
      await prisma.request.delete({ where: { id: ref.id } });
    } else {
      await prisma.fileData.deleteMany({
        where: { requestForOtherId: ref.id },
      });
      await prisma.requestForOther.delete({ where: { id: ref.id } });
    }

    return res.status(200).json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting request:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to delete request",
    });
  }
}
