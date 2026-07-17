import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    useDocumentTitle('Ohmic — Next-Gen Repair OS');

    const primaryDestination = user ? '/app' : '/login';
    const primaryLabel = user ? 'Go to Dashboard' : 'Get Started Free';

    return (
        <div className="relative w-full overflow-hidden bg-[#060913] font-sans text-[#f1f5f9] antialiased selection:bg-blue-600 selection:text-white">
            
            {/* Background Light Effects */}
            <div className="absolute inset-0 max-w-full overflow-hidden pointer-events-none z-0">
                <div className="absolute right-[-10%] top-[-20%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[150px]" />
                <div className="absolute left-[-15%] top-[30%] h-[700px] w-[700px] rounded-full bg-cyan-500/15 blur-[160px]" />
                <div className="absolute right-[10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-blue-700/15 blur-[140px]" />
            </div>
            
            {/* Subtle Tech Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Header Navigation */}
            <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060913]/70 backdrop-blur-xl">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <div 
                        className="group flex items-center gap-3 text-xl font-bold tracking-tight cursor-pointer" 
                        onClick={() => navigate('/')}
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/10 transition-all duration-300 group-hover:bg-blue-600/20 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                            <span className="font-extrabold text-blue-500">Ω</span>
                        </span>
                        <span className="bg-gradient-to-r from-white via-[#e2e8f0] to-[#94a3b8] bg-clip-text text-transparent">Ohmic</span>
                    </div>
                    
                    <nav className="hidden md:flex items-center gap-10">
                        <a href="#features" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">Features</a>
                        <a href="#workflow" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">How It Works</a>
                        <a href="#management" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">Shop Control</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {!user && (
                            <button 
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.08] px-4 text-sm font-semibold text-slate-300 transition-colors hover:border-white/20 hover:bg-white/5" 
                                onClick={() => navigate('/login')}
                            >
                                Sign In
                            </button>
                        )}
                        <button 
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-500 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]" 
                            onClick={() => navigate(primaryDestination)}
                        >
                            {primaryLabel}
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-12 pb-20 md:pt-16 md:pb-24 lg:grid-cols-2 lg:gap-16 lg:px-8 items-start">
                    {/* Left Column: Text and Actions */}
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left pt-4">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-medium text-blue-400 backdrop-blur-md">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#2563eb] animate-pulse" /> 
                            Built Specifically for Repair Shop Owners
                        </div>
                        
                        <h1 className="max-w-xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl leading-tight sm:leading-tight lg:leading-[1.1] text-white">
                            Every device tells you what's wrong. <br />
                            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-white bg-clip-text text-transparent">
                                Ohmic handles the rest.
                            </span>
                        </h1>
                        
                        <p className="mt-6 max-w-lg text-base text-slate-400 sm:text-lg leading-relaxed">
                            Stop losing track of customer drop-offs and parts orders. Run your counter, manage your technicians, track cash balances, and look professional from day one.
                        </p>
                        
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <button 
                                className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-500 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]" 
                                onClick={() => navigate(primaryDestination)}
                            >
                                Setup Your Counter
                            </button>
                            <a 
                                href="#workflow" 
                                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-8 text-base font-semibold text-slate-200 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.06]"
                            >
                                See How It Works
                            </a>
                        </div>
                    </div>

                    {/* Right Column: Premium Glassmorphic Ticket Card */}
                    <div className="flex justify-center lg:justify-end w-full lg:pt-4">
                        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d1527]/40 p-8 backdrop-blur-xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative group">
                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            
                            <div className="flex items-center justify-between">
                                <div className="text-sm">
                                    <span className="text-slate-400 font-medium">TICKET</span> <strong className="font-bold text-white">#00482</strong>
                                </div>
                                <div className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                                    On the Bench
                                </div>
                            </div>
                            
                            <div className="my-6 h-px bg-white/[0.06]" />
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Customer</span>
                                    <span className="text-sm font-medium text-slate-200">R. Kapoor</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Device</span>
                                    <span className="text-sm font-medium text-slate-200">iPhone 13 Pro</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Repair Details</span>
                                    <span className="text-sm font-medium text-slate-200">Screen + Battery Swap</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Amount Owed</span>
                                    <span className="text-sm font-bold text-cyan-400">₹1,450</span>
                                </div>
                            </div>

                            <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-center">
                                <div className="flex justify-center gap-4 text-xs font-bold tracking-widest text-blue-400">
                                    <span>READY FOR CUSTOMER PICKUP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Shop Benefits Strip */}
                <section className="mb-24 border-y border-white/[0.04] bg-[#080d1a] py-8">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
                            {[
                                { title: 'Zero Lost Jobs', desc: 'Every repair tracked from intake to cash collection.' },
                                { title: 'No Complex Math', desc: 'Track partial down-payments and remaining balances instantly.' },
                                { title: 'Clear Staff Views', desc: 'Technicians see only their repairs and diagnostics checklists.' },
                                { title: 'Multi-Location Ready', desc: 'Manage one storefront or five from a single dashboard.' }
                            ].map((spec, idx) => (
                                <div key={idx} className="text-sm text-slate-400">
                                    <strong className="block font-semibold text-slate-200 mb-1">{spec.title}</strong>
                                    {spec.desc}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Layout */}
                <section id="features" className="mx-auto max-w-7xl mb-24 px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Core Features</span>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-white">Everything you need to run your shop floor</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {[
                            { glow: 'group-hover:bg-blue-600/10', num: '01', title: 'Smart Ticket Tracker', text: 'Know exactly where every phone, laptop, or tablet is right now. See what\'s waiting for parts, what\'s currently on a technician\'s bench, and what\'s done.' },
                            { glow: 'group-hover:bg-cyan-600/10', num: '02', title: 'Payments & Ledgers', text: 'Stop keeping up with tabs or paper receipts. Log advances, accept down-payments for parts, and settle the final balance when the client picks up the hardware.' },
                            { glow: 'group-hover:bg-indigo-600/10', num: '03', title: 'Technician Hub', text: 'Keep your repair staff focused. Technicians get a clean list of jobs assigned to them, allowing them to instantly update problem logs and completion times.' },
                            { glow: 'group-hover:bg-blue-600/10', num: '04', title: 'Business Reporting', text: 'Track daily profits, monitor technician repair speeds, and see exactly which devices bring in the most money for your business.' }
                        ].map((card, idx) => (
                            <div key={idx} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d1527]/30 p-10 transition-all duration-300 hover:border-blue-500/30">
                                <div className={`absolute -right-16 -top-16 h-32 w-32 rounded-full bg-transparent blur-xl transition-all duration-500 ${card.glow}`} />
                                <div className="text-xs font-bold text-blue-400 mb-6">{card.num}</div>
                                <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{card.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Workflow Cards */}
                <section id="workflow" className="mx-auto max-w-7xl mb-24 px-6 lg:px-8">
                    <div className="max-w-xl mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-500">The Counter Process</span>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-white">A flawless pipeline for your front desk</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { num: '01', title: 'Intake at Counter', desc: 'Quickly record client info, serial numbers, hardware models, and custom notes.' },
                            { num: '02', title: 'Diagnostic Pass', desc: 'Technicians check the issues, select what needs a fix, and quote target repair prices.' },
                            { num: '03', title: 'Active Bench Fix', desc: 'Fix the device while logging parts used and time spent on the workstation.' },
                            { num: '04', title: 'Cash-out & Handoff', desc: 'Collect the remaining balance, print clear logs, and close out the job.' }
                        ].map((step, idx) => (
                            <div key={idx} className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0d1527]/50 to-transparent p-8">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-sm font-bold text-blue-400 mb-6">
                                    {step.num}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Role Tiers Grid - Rephrased for clear Business Operations */}
                <section id="management" className="mx-auto max-w-7xl mb-24 px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Staff Management</span>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-white">Give every employee the perfect layout</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { role: 'Shop Owner', title: 'Total Control', desc: 'Check total store revenue, review performance audits, manage pricing configurations, and track staff payroll metrics.' },
                            { role: 'Store Manager', title: 'Floor Supervisor', desc: 'Assign repair orders to specific staff members, adjust active bench queues, and handle daily client handoffs.' },
                            { role: 'Technician', title: 'Bench Worker', desc: 'A clean screen showing just their assigned daily repair tasks, target device issues, and fast checkoff lists.' },
                            { role: 'Front Desk', title: 'Customer Support', desc: 'Fast intake options optimized to process oncoming customer drop-offs and hardware lookups without delays.' }
                        ].map((profile, idx) => (
                            <div key={idx} className="rounded-2xl border border-white/[0.06] bg-[#0d1527]/30 p-8 transition-all duration-300 hover:border-blue-500/20 hover:bg-[#0d1527]/50">
                                <div className="inline-block rounded-lg border border-blue-500/30 bg-blue-500/5 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-blue-400 uppercase mb-5">
                                    {profile.role}
                                </div>
                                <h4 className="text-lg font-semibold text-white mb-2">{profile.title}</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">{profile.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Call To Action Block */}
                <section className="mx-auto max-w-7xl mb-24 px-6 lg:px-8">
                    <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0d1527]/80 to-[#060913]/90 px-6 py-16 text-center shadow-[0_40px_80px_rgba(0,0,0,0.5)] md:px-12 overflow-hidden group">
                        <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none group-hover:bg-blue-600/20 transition-all duration-500" />
                        
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">Ready to fix your shop operations?</h2>
                        <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
                            Create your store account today and get your front desk and technical workbenches organized completely.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                            <button 
                                className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-500 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]" 
                                onClick={() => navigate(primaryDestination)}
                            >
                                Launch Store Dashboard
                            </button>
                            <a 
                                href="mailto:support@ohmic.io" 
                                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.01] px-8 text-base font-semibold text-slate-300 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                            >
                                Talk with Support
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/[0.04] py-12">
                <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-6 px-6 text-xs text-slate-500 lg:px-8">
                    <div>
                        <strong className="font-semibold text-slate-400">Ohmic</strong> — The Ultimate Repair Shop Management Platform · © 2026
                    </div>
                    <div className="flex gap-8">
                        <a href="#privacy" className="transition-colors hover:text-slate-300">Privacy Policy</a>
                        <a href="#terms" className="transition-colors hover:text-slate-300">Terms of Service</a>
                        <a href="#support" className="transition-colors hover:text-slate-300">Get Help</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;