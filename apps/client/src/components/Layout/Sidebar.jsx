import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import {
    LayoutDashboard, Users, UserCog, Wrench,
    Truck, Settings, X, CreditCard, HardHat,
    ChartArea, Building2, ChevronLeft, ChevronRight,
    ChevronDown, ArrowDownLeft, ArrowUpRight, Building, User,
} from 'lucide-react';

// ─── Menu config ────────────────────────────────────────────────────────────
// `children` items link to the same base path with a query string. `match`
// tells us how to detect "this child is active" since NavLink's own active
// state only looks at pathname, not search params.

const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app', minRole: null },
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
    { icon: UserCog, label: 'Users', path: '/app/users', minRole: 'admin' },
    { icon: Building2, label: 'Organizations', path: '/app/organizations', minRole: 'superadmin' },
    { icon: ChartArea, label: 'Reports', path: '/app/reports', minRole: 'admin' },
    { icon: Settings, label: 'Settings', path: '/app/settings', minRole: null },
];

const Sidebar = ({ isMobile = false, onClose = null, collapsed = false, onToggleCollapse}) => {
    const { user } = useAuth();
    const { hasRole } = usePermission();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = allMenuItems.filter(item =>
        !item.minRole || hasRole(item.minRole)
    );

    // Mobile never collapses to icon-rail — only desktop does
    const isCollapsed = collapsed && !isMobile;

    // Which parent items are expanded. Auto-expand a parent if the current
    // URL matches its base path (e.g. landing on /app/payments directly).
    const [openMenus, setOpenMenus] = useState(() => {
        const initial = {};
        allMenuItems.forEach((item) => {
            if (item.children && location.pathname === item.path) initial[item.path] = true;
        });
        return initial;
    });

    useEffect(() => {
        // Keep the relevant parent open as the route changes, don't force-close others.
        allMenuItems.forEach((item) => {
            if (item.children && location.pathname === item.path) {
                setOpenMenus((prev) => (prev[item.path] ? prev : { ...prev, [item.path]: true }));
            }
        });
    }, [location.pathname]);

    const toggleMenu = (path) => {
        setOpenMenus((prev) => ({ ...prev, [path]: !prev[path] }));
    };

    const isChildActive = (parentPath, child) => {
        if (location.pathname !== parentPath) return false;
        const params = new URLSearchParams(location.search);
        return Object.entries(child.match).every(([k, v]) => params.get(k) === v);
    };

    const isParentActive = (item) => {
        if (location.pathname !== item.path) return false;
        if (!item.children) return true;
        // Base path with no matching query (e.g. /app/payments with no ?type=)
        // still counts the parent as active/highlighted.
        return !item.children.some((c) => isChildActive(item.path, c));
    };

    const handleParentClick = (item) => {
        navigate(item.path);
        // Landing on the base path auto-expands via the effect above; also
        // expand immediately so it doesn't wait a render behind navigation.
        if (!isCollapsed) {
            setOpenMenus((prev) => ({ ...prev, [item.path]: true }));
        }
        if (isMobile && onClose) onClose();
    };

    const handleChevronClick = (e, path) => {
        e.stopPropagation();
        toggleMenu(path);
    };

    const handleChildClick = (path) => {
        navigate(path);
        if (isMobile && onClose) onClose();
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
                {!isCollapsed && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 whitespace-nowrap">
                        Menu
                    </p>
                )}
                <nav className="space-y-0.5">
                    {menuItems.map((item) => {
                        const hasChildren = !!item.children?.length;
                        const parentActive = isParentActive(item);
                        const isOpen = !isCollapsed && !!openMenus[item.path];

                        return (
                            <div key={item.path}>
                                {hasChildren ? (
                                    // ── Parent with children: the row itself navigates to the base
                                    //    path (like any other menu item). A separate chevron button
                                    //    toggles the submenu without triggering navigation.
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleParentClick(item)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleParentClick(item); }}
                                        title={isCollapsed ? item.label : undefined}
                                        className={`group relative w-full flex items-center gap-3 py-2.5 rounded-lg transition-all text-sm font-medium cursor-pointer ${
                                            isCollapsed ? 'px-0 justify-center' : 'px-3'
                                        } ${parentActive
                                            ? 'text-primary bg-primary/10'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <span
                                            className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary transition-opacity ${
                                                parentActive ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        />
                                        <item.icon className="w-4 h-4 shrink-0" />
                                        {!isCollapsed && (
                                            <>
                                                <span className="whitespace-nowrap flex-1 text-left">{item.label}</span>
                                                <button
                                                    onClick={(e) => handleChevronClick(e, item.path)}
                                                    aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                                                    className="shrink-0 p-1 -m-1 rounded hover:bg-muted/80 transition-colors"
                                                >
                                                    <ChevronDown
                                                        className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                    />
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
                                    // ── Plain leaf item ──
                                    <NavLink
                                        to={item.path}
                                        end={item.path === '/app'}
                                        onClick={isMobile ? onClose : undefined}
                                        title={isCollapsed ? item.label : undefined}
                                        className={({ isActive }) =>
                                            `group relative flex items-center gap-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                                                isCollapsed ? 'px-0 justify-center' : 'px-3'
                                            } ${isActive
                                                ? 'text-primary bg-primary/10'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span
                                                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary transition-opacity ${
                                                        isActive ? 'opacity-100' : 'opacity-0'
                                                    }`}
                                                />
                                                <item.icon className="w-4 h-4 shrink-0" />
                                                {!isCollapsed && (
                                                    <span className="whitespace-nowrap">{item.label}</span>
                                                )}
                                                {isCollapsed && (
                                                    <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md bg-foreground text-background text-xs font-medium px-2 py-1 opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all">
                                                        {item.label}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                )}

                                {/* ── Submenu ── */}
                                {hasChildren && isOpen && (
                                    <div className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5">
                                        {item.children.map((child) => {
                                            const active = isChildActive(item.path, child);
                                            return (
                                                <button
                                                    key={child.path}
                                                    onClick={() => handleChildClick(child.path)}
                                                    className={`w-full flex items-center gap-2 py-2 px-2.5 rounded-lg transition-all text-sm ${
                                                        active
                                                            ? 'text-primary bg-primary/10 font-medium'
                                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                    }`}
                                                >
                                                    <child.icon className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="whitespace-nowrap">{child.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Collapse toggle — desktop only */}
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