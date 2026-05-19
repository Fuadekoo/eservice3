export const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Global error middleware (in app.ts)
export const globalErrorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).json({
        status: "error",
        message: err.message || "Something went wrong",
    });
};
//# sourceMappingURL=errorHandler.js.map