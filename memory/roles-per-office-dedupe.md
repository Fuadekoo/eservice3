---
name: roles-per-office-dedupe
description: Role names are non-unique/per-office; dedupe role dropdowns by name and filter/assign by roleName
metadata:
  type: project
---

The `role` table (backend/prisma/schema.prisma) has a non-unique `name` and an optional `officeId`, so the same logical role (e.g. "MANAGER") exists once per office plus an optional global copy (officeId null), often with mixed casing ("manager" vs "MANAGER"). Listing roles raw produces duplicated dropdown entries.

**Convention:** In any role *filter* or *assignment* dropdown, dedupe by name with `dedupeRolesByName` from `frontend/lib/roles.ts` (returns `{ key: lowercased-name, label: Title-Cased }`), and send the selected value to the API as `roleName` (not `roleId`). Backends resolve `roleName` case-insensitively. Applied in: users/page, staff/page (filters); user-create-dialog, staff-create-dialog (assignment). Do NOT dedupe in role-management surfaces (office-access-tab, role-catalog, role/permission pages) where each role record is an individually-managed entity.

**Why:** The user reported the users-page role filter showing repeated names and asked for it fixed everywhere.

**How to apply:** Backend `listUsers` accepts `roleName`; `listStaff` accepts `roleName`; user create/update resolves via `resolveRoleIdByName` (prefers global officeId:null role); staff create/update `resolveRoleId` prefers office-scoped then global.

**MySQL note:** datasource provider is `mysql` — Prisma's `StringFilter` has NO `mode: "insensitive"` property (it type-errors on strongly-typed where clauses; it only slipped past in code using `any[]` filters). MySQL's default collation is already case-insensitive, so plain `equals` suffices — never add `mode` here.
