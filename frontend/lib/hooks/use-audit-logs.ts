"use client";
import { useEffect, useState } from "react";
import { axiosInstance, ApiError } from "@/lib/axios";

export type AuditLogRecord = {
  id: number;
  timestamp: string;
  actor: string;
  role?: string | null;
  action: string;
  resource: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
  user?: {
    firstName: string | null;
    fatherName: string | null;
    name: string | null;
    username: string;
  } | null;
};

export function useAuditLogs(opts?: {
  userId?: string;
  actor?: string;
  resource?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const { userId, actor, resource, status, page = 1, pageSize = 25 } = opts || {};

  useEffect(() => {
    let mounted = true;
    async function fetchLogs() {
      setIsLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = { 
          page: String(page), 
          pageSize: String(pageSize),
        };
        if (userId) params.userId = userId;
        if (actor) params.actor = actor;
        if (resource) params.resource = resource;
        if (status) params.status = status;

        const response = await axiosInstance.get("/security/audit-logs", { params });
        
        // Handle paginated response structure: { data: logs, total: 100, page: 1... }
        let items: AuditLogRecord[] = [];
        let paginationData: any = null;

        if (response && (response as any).data && Array.isArray((response as any).data)) {
          items = (response as any).data;
          paginationData = {
            total: (response as any).total || items.length,
            page: (response as any).page || page,
            pageSize: (response as any).pageSize || pageSize,
            totalPages: (response as any).totalPages || Math.ceil(((response as any).total || items.length) / pageSize),
          };
        } else if (Array.isArray(response)) {
          items = response;
        }

        if (mounted) {
          setLogs(items);
          setPagination(paginationData);
        }
      } catch (err: any) {
        console.error("Fetch audit logs failed:", err);
        if (err instanceof ApiError) setError(err);
        else setError(new ApiError(err?.message || "Unknown error", 0));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchLogs();
    return () => {
      mounted = false;
    };
  }, [userId, actor, resource, status, page, pageSize]);

  return { logs, pagination, isLoading, error };
}
