import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import {
    LayoutDashboard, Users, UserCog, Wrench,
    Truck, Settings, X, CreditCard, HardHat,
    ChartArea, Building2, ChevronLeft, ChevronRight
} from 'lucide-react';

const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app', minRole: null },
    { icon: Wrench, label: 'Repairs', path: '/app/repairs', minRole: null },
    { icon: CreditCard, label: 'Payments', path: '/app/payments', minRole: 'manager' },
    { icon: Users, label: 'Customers', path: '/app/customers', minRole: 'manager' },
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

    const menuItems = allMenuItems.filter(item =>
        !item.minRole || hasRole(item.minRole)
    );

    // Mobile never collapses to icon-rail — only desktop does
    const isCollapsed = collapsed && !isMobile;

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
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
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
                                    {/* Active accent bar */}
                                    <span
                                        className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary transition-opacity ${
                                            isActive ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    />
                                    <item.icon className="w-4 h-4 shrink-0" />
                                    {!isCollapsed && (
                                        <span className="whitespace-nowrap">{item.label}</span>
                                    )}

                                    {/* Collapsed tooltip */}
                                    {isCollapsed && (
                                        <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md bg-foreground text-background text-xs font-medium px-2 py-1 opacity-0 scale-95 origin-left group-hover:opacity-100 group-hover:scale-100 transition-all">
                                            {item.label}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
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