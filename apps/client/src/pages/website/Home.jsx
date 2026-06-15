import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';

const Home = () => {
    const { user } = useAuth();
    const { theme, toggle } = useTheme(); // Consuming your custom theme state
    const navigate = useNavigate();

    const ActionButton = ({ variant = 'primary' }) => {
        if (user) {
            return (
                <Button 
                    onClick={() => navigate('/app')} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-md shadow-sm transition-colors dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                    Go to Dashboard
                </Button>
            );
        }

        return variant === 'primary' ? (
            <Button 
                onClick={() => navigate('/login')} 
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-2 rounded-md shadow-sm transition-colors dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
            >
                Login to Account
            </Button>
        ) : (
            <Button 
                onClick={() => navigate('/login')} 
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 font-medium px-6 py-2 rounded-md transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
                Get Started
            </Button>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
            
            {/* ─── NAVIGATION HEADER ─── */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
                            <span className="text-white font-black text-xl tracking-tighter">Ω</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">MRM</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
                        <a href="#services" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Services</a>
                        <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {/* ☀️ / 🌙 THEME TOGGLE BUTTON */}
                        <button
                            onClick={toggle}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                // Sun Icon
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                            ) : (
                                // Moon Icon
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                            )}
                        </button>

                        <ActionButton variant="primary" />
                    </div>
                </div>
            </header>

            {/* ─── HERO SECTION ─── */}
            <main className="flex-grow">
                <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mb-6 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-500/20">
                            Streamline Your Workflows
                        </span>
                        
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-3xl mx-auto leading-[1.15]">
                            Smart Management for Modern <span className="text-indigo-600 dark:text-indigo-400">Repair Operations</span>
                        </h1>
                        
                        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Track repair cycles, balance payments, organize client records, and assign technicians seamlessly—all from a single intuitive platform ecosystem.
                        </p>
                        
                        <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
                            <ActionButton variant="primary" />
                            {!user && <ActionButton variant="secondary" />}
                        </div>
                    </div>
                    
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
                </section>

                <hr className="border-slate-200 dark:border-slate-800 max-w-7xl mx-auto" />

                {/* ─── FEATURES GRID SECTION ─── */}
                <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                            Everything your business needs to scale
                        </h2>
                        <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
                            Ditch messy spreadsheets. Our platform brings end-to-end data accuracy directly to your dashboard operations.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-5">
                                🛠️
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Order Tracking</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Create, audit, and trace repair tickets cleanly. Follow milestones from initial drop-off to final delivery handshakes.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold mb-5">
                                💳
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Ledger Management</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Handle invoices, track inbound client down-payments, and view clear balances without manual accounting gaps.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold mb-5">
                                👥
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Multi-Role Controls</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Tailor granular operational limits dynamically across Superadmins, Administrators, Managers, and Floor Staff.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* ─── FOOTER ─── */}
            <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white tracking-tight">MRM</span>
                        <span>© {new Date().getFullYear()} All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Contact Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;