import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard, Users, UserCog, Wrench,
    Package, Truck, Settings, X, CreditCard, HardHat,
    ChartArea,
    Link,
    Plug
} from 'lucide-react';

const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: null },
    { icon: Wrench, label: 'Repairs', path: '/repairs', roles: null },
    { icon: CreditCard, label: 'Payments', path: '/payments', roles: null },
    { icon: Users, label: 'Customers', path: '/customers', roles: null },
    { icon: Truck, label: 'Suppliers', path: '/suppliers', roles: null },
    { icon: HardHat, label: 'Technicians', path: '/technicians', roles: null },
    { icon: UserCog, label: 'Users', path: '/users', roles: ['superadmin', 'admin'] },
    { icon: ChartArea, label: 'Reports', path: '/reports', roles: null },
    { icon: Settings, label: 'Settings', path: '/settings', roles: null },
    { icon: Plug, label: 'Integrations', path: '/integrations', roles: null },
];

const Sidebar = ({ isMobile = false, onClose = null }) => {
    const { user } = useAuth();

    const menuItems = allMenuItems.filter(item =>
        !item.roles || item.roles.includes(user?.role)
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
                            end={item.path === '/'}
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
                    MRM v{__APP_VERSION__} · {user?.role}
                </p>
            </div>
        </div>
    );
};

export default Sidebar;