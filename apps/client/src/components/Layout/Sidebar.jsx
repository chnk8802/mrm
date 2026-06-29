import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import {
    LayoutDashboard, Users, UserCog, Wrench,
    Truck, Settings, X, CreditCard, HardHat,
    ChartArea,
    Building2
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
    { icon: ChartArea, label: 'Reports', path: '/app/reports', minRole: 'manager' },
    { icon: Settings, label: 'Settings', path: '/app/settings', minRole: null },
];

const Sidebar = ({ isMobile = false, onClose = null }) => {
    const { user } = useAuth();
    const { hasRole } = usePermission();

    const menuItems = allMenuItems.filter(item =>
        !item.minRole || hasRole(item.minRole)
    );

    return (
        <div className="w-60 h-full bg-[hsl(var(--sidebar-bg))] border-r border-border flex flex-col">
            {isMobile && (
                <div className="flex justify-end p-3">
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="px-3 py-4 flex-1 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                    Menu
                </p>
                <nav className="space-y-0.5">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/app'}
                            onClick={isMobile ? onClose : undefined}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`
                            }
                        >
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="px-3 py-4 border-t border-border">
                <p className="text-xs text-muted-foreground px-3">
                   {user.name} - {user?.role}
                </p>
            </div>
        </div>
    );
};

export default Sidebar;