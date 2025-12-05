import React from 'react';
import { LayoutDashboard, Users, MessageSquare, GitPullRequest, LogOut, Shield, UserPlus } from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
    currentPage: string;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPage, onNavigate, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/nexdev/dashboard' },
        { id: 'users', label: 'All Users', icon: Users, path: '/nexdev/users' },
        { id: 'add-user', label: 'Add User', icon: UserPlus, path: '/nexdev/add-user' },
        { id: 'support', label: 'Support Requests', icon: MessageSquare, path: '/nexdev/support' },
        { id: 'changes', label: 'Change Requests', icon: GitPullRequest, path: '/nexdev/changes' },
    ];

    return (
        <div className="flex h-screen bg-black text-slate-200 font-sans selection:bg-cyan-500/30">
            {/* Sidebar */}
            <aside className="w-64 bg-black border-r border-cyan-900/20 flex flex-col shadow-xl z-20 relative">
                {/* Glow effect */}
                <div className="absolute top-0 left-0 w-full h-32 bg-cyan-500/5 blur-[100px] pointer-events-none" />

                <div className="p-6 border-b border-cyan-900/20 flex items-center gap-3 relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-full" />
                        <Shield className="w-8 h-8 text-cyan-500 relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">NexDevs</h1>
                        <p className="text-xs text-cyan-400/70 font-medium tracking-wide">ADMIN PANEL</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative z-10">
                    {menuItems.map((item) => {
                        const isActive = currentPage === item.path || (item.id === 'users' && currentPage.startsWith('/nexdev/users/'));
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-cyan-950/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)] border border-cyan-900/30'
                                        : 'text-slate-400 hover:bg-zinc-900/50 hover:text-cyan-300 hover:translate-x-1'}`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                                <span className="font-medium">{item.label}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-cyan-900/20 relative z-10">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-950/10 hover:text-red-300 transition-all duration-200 group border border-transparent hover:border-red-900/20"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background ambient glow */}
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[150px] pointer-events-none" />

                {/* Header */}
                <header className="h-16 bg-black/80 backdrop-blur-md border-b border-cyan-900/20 flex items-center justify-between px-8 z-10">
                    <h2 className="text-lg font-semibold text-white tracking-wide">
                        {menuItems.find(item => currentPage === item.path)?.label || 'Admin Panel'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-cyan-900/20">
                            <div className="w-8 h-8 rounded-full bg-cyan-950 flex items-center justify-center text-cyan-400 font-bold text-xs border border-cyan-900/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                                A
                            </div>
                            <div className="text-sm hidden sm:block pr-2">
                                <p className="font-medium text-white">Admin User</p>
                                <p className="text-[10px] text-cyan-400/70 leading-none">Super Admin</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8 relative z-0 scrollbar-thin scrollbar-thumb-cyan-900/30 scrollbar-track-transparent">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
