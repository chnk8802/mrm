const MANAGEABLE = {
  superadmin: ['admin', 'manager', 'staff'],
  admin: ['manager', 'staff'],
};

// Mirrors canManageUser in user.controller.js. Keep both in sync.
export const canManageUser = (me, target) =>
  !!me && !!target &&
  (me._id === target._id || (MANAGEABLE[me.role] || []).includes(target.role));