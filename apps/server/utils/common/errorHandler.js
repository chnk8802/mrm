import { ZodError } from 'zod';

export const handleError = (err, req, res, next) => {
    // 0. Detailed zod errors
    if (err instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    }
    //  1. Format Zod Errors into clean key-value pairs (e.g., { email: ["Invalid email format"] })
    // if (err instanceof ZodError) {
    //     return res.status(400).json({ 
    //         success: false, 
    //         message: 'Validation error', 
    //         errors: err.flatten().fieldErrors 
    //     });
    // }
    // 2. Handle Custom App Errors created via createError()
    if (err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    // 3. Fallback for unexpected system/code crashes
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
};

export const createError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};