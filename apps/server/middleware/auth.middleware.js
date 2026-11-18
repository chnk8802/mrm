import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import User from '../models/user.model.js';
import { requestContext } from '../utils/common/requestContext.js';

const protect = async (req, res, next) => {
    let token;

    if (req.cookies?.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });
        req.user = user;

        if (user.mustChangePassword) {
            const path = req.originalUrl.split('?')[0];
            const allowed =
                (req.method === 'PATCH' && path === '/api/auth/profile/password') ||
                (req.method === 'GET' && path === '/api/auth/profile');
            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    code: 'PASSWORD_CHANGE_REQUIRED',
                    message: 'You must change your password before continuing.',
                });
            }
        }

        const selectedOrgId = user.role === 'superadmin' ? req.headers['x-org-id'] : undefined;

        requestContext.run({ orgId: selectedOrgId || user.orgId, role: user.role }, () => {
            next();
        });

    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export { protect };