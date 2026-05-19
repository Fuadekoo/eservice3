export function parsePaginationParams(req) {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = Math.min(10000, // Increased limit for large queries like roster
    Math.max(1, parseInt(String(req.query.pageSize || req.query.limit || "10"), 10) || 10));
    return {
        page,
        pageSize,
        skip: (page - 1) * pageSize,
        take: pageSize,
    };
}
export function createPaginatedResponse(data, totalItems, paginationParams) {
    const totalPages = Math.max(1, Math.ceil(totalItems / paginationParams.pageSize));
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
//# sourceMappingURL=pagination.js.map