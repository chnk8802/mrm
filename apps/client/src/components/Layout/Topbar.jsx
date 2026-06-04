import { Bell, ChevronDown, LogOut, User, Settings, Menu, Sun, Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/getInitials';

const Topbar = ({ sidebarOpen, onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <div className="h-12 bg-[hsl(var(--topbar-bg))] border-b border-border flex items-center px-4 gap-3 sticky top-0 z-50">

            {/* Sidebar Toggle */}
            <button
                onClick={onToggleSidebar}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
                {sidebarOpen
                    ? <PanelLeftClose className="w-4 h-4" />
                    : <PanelLeftOpen className="w-4 h-4" />
                }
            </button>

            {/* Brand */}
            <span className="font-bold text-sm tracking-tight text-foreground">MRM</span>

            <div className="flex-1" />

            {/* Theme Toggle */}
            <button
                onClick={toggle}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
                <Bell className="w-4 h-4" />
            </button>

            {/* Profile */}
            <div className="relative">
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                    <Avatar className="w-6 h-6">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="text-xs">{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium">{user?.name}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>

                {isProfileOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                        <div className="absolute top-full right-0 mt-1.5 w-44 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
                            <div className="px-3 py-2 border-b border-border mb-1">
                                <p className="text-sm font-medium truncate">{user?.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={toggle}
                                className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-muted transition-colors"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                Toggle Dark Mode
                            </button>
                            <button
                                onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                                className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-muted transition-colors"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Settings
                            </button>
                            <div className="border-t border-border mt-1 pt-1">
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm text-red-500 hover:bg-muted transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Topbar;