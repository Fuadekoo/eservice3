import AuditLogList from "@/components/audit/audit-log-list";
import { ProtectedRoute } from "@/components/auth/protected-route";

export const metadata = {
  title: "Audit Logs",
};

export default function Page() {
  // This is a client component down-tree (AuditLogList uses "use client").
  return (
    <ProtectedRoute requiredPermission="audit_logs.view">
      <div className="p-6">
        <AuditLogList />
      </div>
    </ProtectedRoute>
  );
}
