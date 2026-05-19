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
export declare function parsePaginationParams(req: Request): PaginationParams;
export declare function createPaginatedResponse<T>(data: T[], totalItems: number, paginationParams: PaginationParams): PaginatedResponse<T>;
//# sourceMappingURL=pagination.d.ts.map