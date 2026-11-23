import { ZodError } from 'zod';

export const handleError = (err, req, res, next) => {
    if (err instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    }

    // Errors created with createError(): safe to show, we wrote the message
    if (err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
    }

    // Mongoose schema validation (e.g. a required field missing)
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors || {})[0]?.message || 'Validation error';
        return res.status(400).json({ success: false, message });
    }

    // Bad ObjectId or wrong type in a query
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid ID or value' });
    }

    // Unique index violation (e.g. duplicate repairId or email)
    if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'A record with this value already exists' });
    }

    // Anything else is unexpected: log the details on the server, show nothing to the client
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
};

export const createError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};