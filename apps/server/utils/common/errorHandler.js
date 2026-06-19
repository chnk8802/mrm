import { ZodError } from 'zod';

export const handleError = (err, req, res, next) => {
    if (err instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    }

    if (err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
};

export const createError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};