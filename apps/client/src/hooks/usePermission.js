import { useAuth } from '@/context/AuthContext';

// Mirrors backend ROLE_LEVELS in rbac.middleware.js — keep these in sync.
const ROLE_LEVELS = {
  superadmin: 5,
  admin: 4,
  manager: 3,
  staff: 2,
  guest: 1,
};

/**
 * usePermission — small role-check helper for the frontend.
 *
 * hasRole(role)        → true if current user's role is exactly `role` or above
 *                         e.g. hasRole('manager') is true for manager, admin, superadmin
 * hasExactRole(roles)   → true if current user's role is literally in the given list
 *                         e.g. hasExactRole(['staff']) is true only for staff
 * isAtLeast(role)       → alias of hasRole, reads better in some call sites
 */
export const usePermission = () => {
  const { user } = useAuth();
  const userLevel = ROLE_LEVELS[user?.role] ?? 0;

  const hasRole = (role) => userLevel >= (ROLE_LEVELS[role] ?? Infinity);

  const hasExactRole = (roles) => {
    if (!user?.role) return false;
    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(user.role);
  };

  return {
    role: user?.role,
    hasRole,
    isAtLeast: hasRole,
    hasExactRole,
  };
};