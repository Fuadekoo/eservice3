import type { Request } from "express";

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function parsePaginationParams(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  const pageSize = Math.min(
    10000, // Increased limit for large queries like roster
    Math.max(
      1,
      parseInt(String(req.query.pageSize || req.query.limit || "10"), 10) || 10,
    ),
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  paginationParams: PaginationParams,
): PaginatedResponse<T> {
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / paginationParams.pageSize),
  );

  return {
    data,
    pagination: {
      page: paginationParams.page,
      pageSize: paginationParams.pageSize,
      totalItems,
      totalPages,
      hasNextPage: paginationParams.page < totalPages,
      hasPreviousPage: paginationParams.page > 1,
    },
  };
}
