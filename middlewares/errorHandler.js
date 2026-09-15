module.exports = (err, req, res, next) => {
    const statusCode =
        err.statusCode ||
        err.status ||
        (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500);

    const safeStatus = err.code === 11000 ? 409 : statusCode;
    const isServerError = safeStatus >= 500;

    console.error(`[${req.method} ${req.originalUrl}]`, err.message || err);

    return res.status(safeStatus).json({
        success: false,
        message:
            err.code === 11000
                ? "A record with the same unique value already exists"
                : isServerError && process.env.NODE_ENV === "production"
                    ? "Internal Server Error"
                    : err.message || "Internal Server Error"
    });
};
