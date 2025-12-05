import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, GitPullRequest, Activity } from 'lucide-react';

interface DashboardStats {
    totalUsers: number;
    pendingSupport: number;
    pendingChanges: number;
    systemUptime: string;
    recentActivity: Array<{
        type: 'support' | 'change';
        username: string;
        created_at: string;
    }>;
}

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        pendingSupport: 0,
        pendingChanges: 0,
        systemUptime: '99.9%',
        recentActivity: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            // Get password from session
            const session = localStorage.getItem('nexdev_admin_session');
            if (!session) return;
            const { password } = JSON.parse(session);

            const response = await fetch('http://localhost:3001/api/admin/dashboard-stats', {
                headers: { 'x-admin-password': password }
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-black p-6 rounded-xl shadow-lg border border-cyan-900/20 ring-1 ring-cyan-900/10 hover:shadow-cyan-900/20 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-cyan-950/50 rounded-lg border border-cyan-900/50">
                            <Users className="w-6 h-6 text-cyan-400" />
                        </div>
                        <span className="text-xs font-medium text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded-full border border-cyan-900/50 shadow-[0_0_10px_rgba(34,211,238,0.1)]">+12%</span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{isLoading ? '-' : stats.totalUsers}</h3>
                    <p className="text-sm text-slate-400 mt-1">Total Users</p>
                </div>

                <div className="bg-black p-6 rounded-xl shadow-lg border border-cyan-900/20 ring-1 ring-cyan-900/10 hover:shadow-cyan-900/20 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-950/30 rounded-lg border border-amber-900/50">
                            <MessageSquare className="w-6 h-6 text-amber-500" />
                        </div>
                        <span className="text-xs font-medium text-amber-500 bg-amber-950/30 px-2 py-1 rounded-full border border-amber-900/50">
                            {isLoading ? '-' : stats.pendingSupport} Pending
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{isLoading ? '-' : stats.pendingSupport}</h3>
                    <p className="text-sm text-slate-400 mt-1">Support Requests</p>
                </div>

                <div className="bg-black p-6 rounded-xl shadow-lg border border-cyan-900/20 ring-1 ring-cyan-900/10 hover:shadow-cyan-900/20 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-950/30 rounded-lg border border-purple-900/50">
                            <GitPullRequest className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="text-xs font-medium text-purple-400 bg-purple-950/30 px-2 py-1 rounded-full border border-purple-900/50">
                            {isLoading ? '-' : stats.pendingChanges} New
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{isLoading ? '-' : stats.pendingChanges}</h3>
                    <p className="text-sm text-slate-400 mt-1">Change Requests</p>
                </div>

                <div className="bg-black p-6 rounded-xl shadow-lg border border-cyan-900/20 ring-1 ring-cyan-900/10 hover:shadow-cyan-900/20 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-900/50">
                            <Activity className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-xs font-medium text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-900/50">Healthy</span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stats.systemUptime}</h3>
                    <p className="text-sm text-slate-400 mt-1">System Uptime</p>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-black rounded-xl shadow-lg border border-cyan-900/20 ring-1 ring-cyan-900/10 overflow-hidden">
                <div className="p-6 border-b border-cyan-900/20">
                    <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-6">
                        {stats.recentActivity.length === 0 ? (
                            <p className="text-slate-500 text-center">No recent activity</p>
                        ) : (
                            stats.recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className={`w-2 h-2 mt-2 rounded-full shrink-0 shadow-[0_0_8px] 
                                        ${activity.type === 'support' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-purple-500 shadow-purple-500/50'}`}
                                    />
                                    <div>
                                        <p className="text-sm text-slate-200 font-medium">
                                            User "<span className="text-cyan-400">{activity.username}</span>" submitted a new {activity.type === 'support' ? 'support request' : 'change request'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(activity.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
