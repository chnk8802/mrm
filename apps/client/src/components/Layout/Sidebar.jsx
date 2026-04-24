import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Smartphone, 
  Settings, 
  HelpCircle, 
  LogOut,
  Users,
  UserCog,
  X,
  Wrench,
  Package,
  Truck
} from 'lucide-react';

const Sidebar = ({ isMobile = false, onClose = null }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: UserCog, label: 'Users', path: '/users' },
    { icon: Wrench, label: 'Repairs', path: '/repairs' },
    { icon: Package, label: 'Spare Parts', path: '/spare-parts' },
    { icon: Truck, label: 'Suppliers', path: '/suppliers' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help', path: '/help' },
  ];

  return (
    <div className={`w-full bg-white border-r border-gray-200 p-4 flex flex-col ${isMobile ? 'h-full' : 'hidden md:flex'}`}>
      {/* Mobile Close Button */}
      {isMobile && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* <div className="pt-4 border-t border-gray-200">
        <button
          onClick={async () => {
            try {
              await axios.post('/api/auth/logout', {}, {
                withCredentials: true
              });
            } catch (err) {
              console.error('Logout failed:', err);
            }
            window.location.reload();
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div> */}
    </div>
  );
};

export default Sidebar;
