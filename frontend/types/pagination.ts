/**
 * Standard pagination metadata for all API responses
 */
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Standard paginated API response
 */
export interface PaginatedResponse<T> {
  success?: boolean;
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Pagination request parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
