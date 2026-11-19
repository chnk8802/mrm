import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const handler = (message) => (req, res) =>
    res.status(429).json({ success: false, message });

// Loose, app-wide
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    handler: handler('Too many requests, please try again later.'),
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: handler('Too many registrations from this IP, try again later.'),
});

// Strict, for login (and later forgot-password)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || (process.env.NODE_ENV === 'production' ? 10 : 100),
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) =>
        `${ipKeyGenerator(req.ip)}:${req.body?.email?.toLowerCase() ?? ''}`,
    handler: handler('Too many login attempts, please try again in 15 minutes.'),
});