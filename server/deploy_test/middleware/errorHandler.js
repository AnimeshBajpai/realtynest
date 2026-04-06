export class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
export const errorHandler = (err, _req, res, _next) => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof AppError ? err.message : 'Internal Server Error';
    const response = {
        error: {
            message,
            statusCode,
        },
    };
    if (process.env.NODE_ENV === 'development') {
        response.error.stack = err.stack;
    }
    res.status(statusCode).json(response);
};
