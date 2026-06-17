const ROLE_LEVELS = {
  superadmin: 5,
  admin: 4,
  manager: 3,
  staff: 2,
  guest: 1,
};

// Usage: authorize('admin') — allows admin and above
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userLevel = ROLE_LEVELS[req.user.role];
    const hasAccess = roles.some(role => userLevel >= ROLE_LEVELS[role]);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required: ${roles.join(' or ')} or above.`
      });
    }

    next();
  };
};

export default authorize;