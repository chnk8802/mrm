import { Bell, ChevronDown, LogOut, Settings, Sun, Moon, PanelLeftClose, PanelLeftOpen, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/getInitials';
import Logo from '../common/Logo';

const Topbar = () => {
    const { user, organization, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <div className="sticky top-0 z-50">
            {/* Trial Banner */}
            {organization?.plan === 'trial' && (
                <div className="h-6 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-center px-4">
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        You're on the Trial plan, pricing/plans will apply later
                    </span>
                </div>
            )}

            <div className="h-12 bg-[hsl(var(--topbar-bg))] border-b border-border flex items-center px-4 gap-3">

                {/* Brand */}
                <Logo/>
                <span className="font-bold text-sm tracking-tight text-foreground"></span>

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
                            <div className="absolute top-full right-0 mt-1.5 w-52 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
                                <div className="px-3 py-2 border-b border-border mb-1">
                                    <p className="text-sm font-medium truncate">{user?.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                    {organization && (
                                        <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border/50">
                                            <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                            <span className="text-xs text-muted-foreground truncate">{organization.name}</span>
                                            <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize shrink-0">
                                                {organization.plan}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setIsProfileOpen(false); navigate('/'); }}
                                    className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-muted transition-colors text-slate-700 dark:text-slate-300"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                                    Go to Website
                                </button>
                                <button
                                    onClick={() => { setIsProfileOpen(false); navigate('/app/settings'); }}
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
        </div>
    );
};

export default Topbar;