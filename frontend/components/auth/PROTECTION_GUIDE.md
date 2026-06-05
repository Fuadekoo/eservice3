# Permission & Role Protection Guide

This guide explains how to protect pages and actions based on user roles and permissions.

## Components Available

### 1. `ProtectedRoute` - Protect Entire Pages
Use this to protect entire pages/routes based on permissions or roles.

```tsx
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function StudentsPage() {
  return (
    <ProtectedRoute requiredPermission="students.view">
      {/* Page content */}
    </ProtectedRoute>
  );
}
```

**Props:**
- `requiredPermission?: string` - Single permission required
- `requiredPermissions?: string[]` - Multiple permissions (any or all)
- `requireAll?: boolean` - If true, requires ALL permissions; if false, requires ANY
- `allowedRoles?: string[]` - Roles that can access (e.g., ["ADMIN", "MANAGER"])
- `redirectTo?: string` - Where to redirect if no access (default: "/overview")
- `showError?: boolean` - Show error message or just redirect (default: true)

**Examples:**
```tsx
// Require single permission
<ProtectedRoute requiredPermission="students.view">

// Require any of multiple permissions
<ProtectedRoute requiredPermissions={["students.view", "students.create"]}>

// Require all permissions
<ProtectedRoute 
  requiredPermissions={["students.view", "students.update"]} 
  requireAll={true}
>

// Role-based access
<ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>

// Combined role and permission
<ProtectedRoute 
  allowedRoles={["ADMIN"]}
  requiredPermission="students.delete"
>
```

### 2. `PermissionGuard` - Protect Sections of Content
Use this to conditionally show/hide sections within a page.

```tsx
import { PermissionGuard } from "@/components/auth/permission-guard";

export default function StudentsPage() {
  return (
    <div>
      <h1>Students</h1>
      
      <PermissionGuard requiredPermission="students.create">
        <Button>Add New Student</Button>
      </PermissionGuard>
      
      <PermissionGuard 
        requiredPermission="students.delete"
        fallback={<p>You cannot delete students</p>}
      >
        <Button variant="destructive">Delete</Button>
      </PermissionGuard>
    </div>
  );
}
```

**Props:**
- Same as `ProtectedRoute` but doesn't redirect
- `fallback?: ReactNode` - What to show if no permission (default: null)
- `showError?: boolean` - Show error alert or just hide content

### 3. `ProtectedButton` - Protect Action Buttons
Use this for buttons that should be disabled if user lacks permission.

```tsx
import { ProtectedButton } from "@/components/auth/protected-button";

<ProtectedButton
  requiredPermission="students.create"
  onClick={handleCreate}
  tooltipMessage="You need 'students.create' permission"
>
  Create Student
</ProtectedButton>
```

**Props:**
- All standard Button props
- `requiredPermission?: string`
- `requiredPermissions?: string[]`
- `requireAll?: boolean`
- `tooltipMessage?: string` - Tooltip shown when disabled

### 4. `RoleGuard` - Protect Based on Roles
Use this for role-based access control.

```tsx
import { RoleGuard } from "@/components/auth/role-guard";

<RoleGuard allowedRoles={["ADMIN"]}>
  <AdminOnlyContent />
</RoleGuard>
```

## Using the `usePermissions` Hook

For custom logic, use the hook directly:

```tsx
import { usePermissions } from "@/lib/hooks/use-permissions";

function MyComponent() {
  const {
    permissions,
    role,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager,
  } = usePermissions();

  if (isLoading) return <div>Loading...</div>;

  if (!hasPermission("students.view")) {
    return <div>No access</div>;
  }

  return (
    <div>
      {isAdmin && <AdminPanel />}
      {hasPermission("students.create") && (
        <Button>Create Student</Button>
      )}
    </div>
  );
}
```

## Permission Codes Reference

Common permissions (see `frontend/lib/utils/permissions.ts` for full list):

### Students
- `students.view` - View students
- `students.create` - Create students
- `students.update` - Update students
- `students.delete` - Delete students
- `students.register` - Register new enrollments

### Staff
- `staff.view` - View staff
- `staff.create` - Create staff
- `staff.update` - Update staff
- `staff.delete` - Delete staff

### Schools & Branches
- `schools.view`, `schools.create`, `schools.update`, `schools.delete`
- `branches.view`, `branches.create`, `branches.update`, `branches.delete`

### Academic
- `academic_years.view`, `academic_years.create`, `academic_years.update`, `academic_years.delete`
- `sections.view`, `sections.create`, `sections.update`, `sections.delete`
- `classrooms.view`, `classrooms.create`, `classrooms.update`, `classrooms.delete`

### Financial
- `payments.view`, `payments.create`, `payments.update`, `payments.delete`
- `fees.create`, `fees.delete`
- `discounts.view`, `discounts.create`, `discounts.update`, `discounts.delete`

### Security
- `roles.view`, `roles.create`, `roles.update`, `roles.delete`
- `permissions.view`, `permissions.create`, `permissions.update`, `permissions.delete`

## Examples

### Example 1: Protect a Page
```tsx
// app/(dashboard)/students/page.tsx
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function StudentsPage() {
  return (
    <ProtectedRoute requiredPermission="students.view">
      <div>
        <h1>Students</h1>
        {/* Page content */}
      </div>
    </ProtectedRoute>
  );
}
```

### Example 2: Conditional Actions
```tsx
import { PermissionGuard } from "@/components/auth/permission-guard";
import { ProtectedButton } from "@/components/auth/protected-button";

export function StudentsList() {
  return (
    <div>
      <PermissionGuard requiredPermission="students.create">
        <Button onClick={handleCreate}>Add Student</Button>
      </PermissionGuard>
      
      <Table>
        {students.map(student => (
          <Row key={student.id}>
            <Cell>{student.name}</Cell>
            <Cell>
              <ProtectedButton
                requiredPermission="students.update"
                onClick={() => editStudent(student.id)}
              >
                Edit
              </ProtectedButton>
              <ProtectedButton
                requiredPermission="students.delete"
                variant="destructive"
                onClick={() => deleteStudent(student.id)}
              >
                Delete
              </ProtectedButton>
            </Cell>
          </Row>
        ))}
      </Table>
    </div>
  );
}
```

### Example 3: Admin-Only Section
```tsx
import { RoleGuard } from "@/components/auth/role-guard";

export function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      
      {/* Everyone can see this */}
      <ProfileSettings />
      
      {/* Only admins */}
      <RoleGuard allowedRoles={["ADMIN"]}>
        <AdminSettings />
      </RoleGuard>
    </div>
  );
}
```

## Best Practices

1. **Protect at the Page Level**: Use `ProtectedRoute` for entire pages
2. **Protect Actions**: Use `ProtectedButton` or `PermissionGuard` for buttons/actions
3. **Show/Hide vs Disable**: 
   - Use `PermissionGuard` to completely hide content
   - Use `ProtectedButton` to disable but show (with tooltip)
4. **Combine Checks**: You can combine role and permission checks
5. **Fallbacks**: Always provide meaningful fallbacks or error messages

## Notes

- ADMIN and MANAGER roles have ALL permissions by default
- Permissions are fetched from `/api/auth/me` endpoint
- Permissions are cached in the hook and refreshed on session change
- All components handle loading states automatically

