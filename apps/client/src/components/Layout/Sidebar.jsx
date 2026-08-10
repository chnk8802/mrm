import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import OrgSelector from '../common/OrgSelector';
import {
    LayoutDashboard, Users, UserCog, Wrench,
    Truck, Settings, X, CreditCard, HardHat,
    ChartArea, Building2, ChevronLeft, ChevronRight,
    ChevronDown, ArrowDownLeft, ArrowUpRight, Building, User,
    Briefcase,
} from 'lucide-react';

// ─── Menu config ────────────────────────────────────────────────────────────
// Items can nest to any depth via `children`. A leaf with no `path` query
// param acts as a normal route; a leaf with `match` links to a parent's base
// path + query string (e.g. Payments -> Receivable). `minRole` filters the
// whole subtree — if a parent fails its role check, its children never render.
//
// Superadmin gets Organizations + Users promoted to top-level (cross-org,
// platform-level data) and all org-scoped business items folded into a single
// "Business" group. Admin/Manager/Staff keep the original flat layout.

const businessChildren = [
    { icon: Wrench, label: 'Repairs', path: '/app/repairs', minRole: null },
    {
        icon: CreditCard, label: 'Payments', path: '/app/payments', minRole: 'manager',
        children: [
            { icon: ArrowDownLeft, label: 'Receivable', path: '/app/payments?type=receivable', match: { type: 'receivable' } },
            { icon: ArrowUpRight, label: 'Payable', path: '/app/payments?type=payable', match: { type: 'payable' } },
        ],
    },
    {
        icon: Users, label: 'Customers', path: '/app/customers', minRole: 'manager',
        children: [
            { icon: Building, label: 'Business', path: '/app/customers?type=business', match: { type: 'business' } },
            { icon: User, label: 'Individual', path: '/app/customers?type=individual', match: { type: 'individual' } },
        ],
    },
    { icon: Truck, label: 'Suppliers', path: '/app/suppliers', minRole: 'manager' },
    { icon: HardHat, label: 'Technicians', path: '/app/technicians', minRole: 'manager' },
    { icon: ChartArea, label: 'Reports', path: '/app/reports', minRole: 'admin' },
];

const flatMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app', minRole: null },
    ...businessChildren,
    { icon: UserCog, label: 'Users', path: '/app/users', minRole: 'admin' },
    { icon: Settings, label: 'Settings', path: '/app/settings', minRole: null },
];

const superadminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app', minRole: null },
    { icon: Building2, label: 'Organizations', path: '/app/organizations', minRole: 'superadmin' },
    { icon: UserCog, label: 'Users', path: '/app/users', minRole: 'superadmin' },
    { icon: Briefcase, label: 'Business', path: '/app/repairs', minRole: null, children: businessChildren },
    { icon: Settings, label: 'Settings', path: '/app/settings', minRole: null },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const flattenPaths = (items) => {
    const paths = [];
    items.forEach((item) => {
        paths.push(item.path);
        if (item.children) paths.push(...flattenPaths(item.children));
    });
    return paths;
};

const filterByRole = (items, hasRole) =>
    items
        .filter((item) => !item.minRole || hasRole(item.minRole))
        .map((item) => (item.children ? { ...item, children: filterByRole(item.children, hasRole) } : item));

const Sidebar = ({ isMobile = false, onClose = null, collapsed = false, onToggleCollapse }) => {
    const { user } = useAuth();
    const { hasRole } = usePermission();
    const location = useLocation();
    const navigate = useNavigate();

    const isSuperadmin = user?.role === 'superadmin';
    const rawMenuItems = isSuperadmin ? superadminMenuItems : flatMenuItems;
    const menuItems = filterByRole(rawMenuItems, hasRole);

    // Mobile never collapses to icon-rail — only desktop does
    const isCollapsed = collapsed && !isMobile;

    // Which parent paths are expanded, at any depth. Auto-expand a parent if
    // the current URL sits under its subtree (e.g. landing on /app/payments
    // directly, or on any descendant path under /app/repairs for Business).
    const isPathInSubtree = (item) => {
        if (location.pathname === item.path) return true;
        if (!item.children) return false;
        return item.children.some((c) => isPathInSubtree(c));
    };

    const [openMenus, setOpenMenus] = useState(() => {
        const initial = {};
        const seed = (items) => {
            items.forEach((item) => {
                if (item.children && isPathInSubtree(item)) initial[item.path] = true;
                if (item.children) seed(item.children);
            });
        };
        seed(menuItems);
        return initial;
    });

    useEffect(() => {
        // Keep the relevant parent chain open as the route changes, don't force-close others.
        const walk = (items) => {
            items.forEach((item) => {
                if (item.children && isPathInSubtree(item)) {
                    setOpenMenus((prev) => (prev[item.path] ? prev : { ...prev, [item.path]: true }));
                    walk(item.children);
                }
            });
        };
        walk(menuItems);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const toggleMenu = (path) => {
        setOpenMenus((prev) => ({ ...prev, [path]: !prev[path] }));
    };

    const isChildActive = (parentPath, child) => {
        if (location.pathname !== parentPath) return false;
        const params = new URLSearchParams(location.search);
        return Object.entries(child.match).every(([k, v]) => params.get(k) === v);
    };

    // A parent is "active" if the route is its own path (with no more specific
    // child match), OR any descendant in its subtree is active — so "Business"
    // lights up when you're three levels deep on Payments > Receivable too.
    const isItemActive = (item) => {
        if (item.match) return isChildActive(item._parentPath, item);
        if (item.children?.length) {
            const childActive = item.children.some((c) => isItemActive({ ...c, _parentPath: item.path }));
            if (childActive) return true;
            return location.pathname === item.path && !item.children.some((c) => c.match && isChildActive(item.path, c));
        }
        return location.pathname === item.path;
    };

    const handleParentClick = (item) => {
        navigate(item.path);
        if (!isCollapsed) {
            setOpenMenus((prev) => ({ ...prev, [item.path]: true }));
        }
        if (isMobile && onClose) onClose();
    };

    const handleChevronClick = (e, path) => {
        e.stopPropagation();
        toggleMenu(path);
    };

    const handleLeafClick = (path) => {
        navigate(path);
        if (isMobile && onClose) onClose();
    };

    // ─── Recursive row renderer ──────────────────────────────────────────────
    // depth 0 = top-level (icon rail collapses here), depth 1+ = indented
    // submenu rows regardless of how deep they go.

    const renderItem = (item, depth = 0) => {
        const hasChildren = !!item.children?.length;
        const active = isItemActive(item);
        const isOpen = !isCollapsed && !!openMenus[item.path];

        if (item.match) {
            // Query-param leaf (e.g. Receivable / Payable)
            return (
                <button
                    key={item.path}
                    onClick={() => handleLeafClick(item.path)}
                    className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-lg transition-all text-sm ${
                        active ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                </button>
            );
        }

        if (!hasChildren && depth > 0) {
            // Plain leaf inside a submenu (e.g. Suppliers under Business)
            return (
                <button
                    key={item.path}
                    onClick={() => handleLeafClick(item.path)}
                    className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-lg transition-all text-sm ${
                        active ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                </button>
            );
        }

        if (!hasChildren && depth === 0) {
            // Top-level plain leaf (Dashboard, Organizations, Users, Settings)
            return (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/app'}
                    onClick={isMobile ? onClose : undefined}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                        `group relative flex items-center gap-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                            isCollapsed ? 'px-0 justify-center' : 'px-3'
                        } ${isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                            <item.icon className="w-4 h-4 shrink-0" />
                            {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                            {isCollapsed && (
                                <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md bg-foreground text-background text-xs font-medium px-2 py-1 opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all">
                                    {item.label}
                                </span>
                            )}
                        </>
                    )}
                </NavLink>
            );
        }

        // Parent with children, any depth
        return (
            <div key={item.path}>
                {depth === 0 ? (
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleParentClick(item)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleParentClick(item); }}
                        title={isCollapsed ? item.label : undefined}
                        className={`group relative w-full flex items-center gap-3 py-2.5 rounded-lg transition-all text-sm font-medium cursor-pointer ${
                            isCollapsed ? 'px-0 justify-center' : 'px-3'
                        } ${active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                    >
                        <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!isCollapsed && (
                            <>
                                <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                                <button
                                    onClick={(e) => handleChevronClick(e, item.path)}
                                    aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                                    className="shrink-0 p-1 -m-1 rounded hover:bg-muted/80 transition-colors"
                                >
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </>
                        )}
                        {isCollapsed && (
                            <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md bg-foreground text-background text-xs font-medium px-2 py-1 opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all">
                                {item.label}
                            </span>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => toggleMenu(item.path)}
                        className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-lg transition-all text-sm ${
                            active ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                    >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}

                {isOpen && (
                    <div className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5">
                        {item.children.map((child) => renderItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className={`h-full bg-[hsl(var(--sidebar-bg))] border-r border-border flex flex-col transition-[width] duration-200 ease-out ${
                isCollapsed ? 'w-16' : 'w-60'
            }`}
        >
            {isMobile && (
                <div className="flex justify-end p-3">
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="px-3 py-4 flex-1 overflow-y-auto overflow-x-hidden">
                {!isCollapsed && <OrgSelector />}
                {!isCollapsed && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 whitespace-nowrap">
                        Menu
                    </p>
                )}
                <nav className="space-y-0.5">
                    {menuItems.map((item) => renderItem(item, 0))}
                </nav>
            </div>

            {!isMobile && (
                <button
                    onClick={onToggleCollapse}
                    className="mx-3 mb-2 flex items-center justify-center gap-2 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs font-medium"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> Collapse</>}
                </button>
            )}

            <div className={`px-3 py-4 border-t border-border ${isCollapsed ? 'flex justify-center' : ''}`}>
                {isCollapsed ? (
                    <div
                        title={`${user.name} - ${user?.role}`}
                        className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center"
                    >
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground px-3 truncate">
                        {user.name} - {user?.role}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Sidebar;