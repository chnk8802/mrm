import { usePermission } from '@/hooks/usePermission';

/**
 * <Can> — conditionally renders children based on role.
 *
 * Two mutually exclusive ways to use it:
 *
 * 1. Hierarchical:
 *    <Can role="manager">...</Can>
 *    → renders for manager, admin, superadmin (manager or above)
 *
 * 2. Exact list (for staff-only or other non-hierarchical cases):
 *    <Can roles={['staff']}>...</Can>
 *    → renders only for staff, nobody else
 *
 * Optional `fallback` renders instead of nothing when the check fails.
 */
const Can = ({ role, roles, fallback = null, children }) => {
  const { hasRole, hasExactRole } = usePermission();

  let allowed = true;
  if (role) allowed = hasRole(role);
  else if (roles) allowed = hasExactRole(roles);

  return allowed ? children : fallback;
};

export default Can;