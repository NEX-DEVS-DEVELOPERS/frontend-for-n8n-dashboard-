import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, GitPullRequest, Activity, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, cn } from '../ui';
import { API_BASE_URL } from '../../services/api';

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

            const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
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
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
                    <p className="text-slate-400 mt-1">Welcome back, Administrator. Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-medium text-green-400 uppercase tracking-wider">System Live</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Total Users Card */}
                <Card className="bg-black/40 backdrop-blur-md border border-[#449b96]/20 shadow-lg hover:shadow-[#449b96]/10 transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-[#449b96]/10 rounded-xl border border-[#449b96]/20 group-hover:bg-[#449b96]/20 transition-colors">
                                <Users className="w-6 h-6 text-[#449b96]" />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-semibold text-[#449b96] bg-[#449b96]/10 px-2 py-1 rounded-full border border-[#449b96]/30">
                                <ArrowUpRight className="w-3 h-3" /> 12%
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{isLoading ? '-' : stats.totalUsers}</h3>
                        <p className="text-sm font-medium text-slate-400">Total Active Users</p>
                    </CardContent>
                </Card>

                {/* Support Requests Card */}
                <Card className="bg-black/40 backdrop-blur-md border border-amber-900/20 shadow-lg hover:shadow-amber-900/10 transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                                <MessageSquare className="w-6 h-6 text-amber-500" />
                            </div>
                            <span className="text-xs font-semibold text-amber-500 bg-amber-950/30 px-2 py-1 rounded-full border border-amber-900/30">
                                Action Required
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{isLoading ? '-' : stats.pendingSupport}</h3>
                        <p className="text-sm font-medium text-slate-400">Pending Support Tickets</p>
                    </CardContent>
                </Card>

                {/* Change Requests Card */}
                <Card className="bg-black/40 backdrop-blur-md border border-purple-900/20 shadow-lg hover:shadow-purple-900/10 transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                                <GitPullRequest className="w-6 h-6 text-purple-500" />
                            </div>
                            <span className="text-xs font-semibold text-purple-400 bg-purple-950/30 px-2 py-1 rounded-full border border-purple-900/30">
                                New Request
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{isLoading ? '-' : stats.pendingChanges}</h3>
                        <p className="text-sm font-medium text-slate-400">Pending Changes</p>
                    </CardContent>
                </Card>

                {/* System Health Card */}
                <Card className="bg-black/40 backdrop-blur-md border border-emerald-900/20 shadow-lg hover:shadow-emerald-900/10 transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                                <Activity className="w-6 h-6 text-emerald-500" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-900/30">
                                Optimal
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">{stats.systemUptime}</h3>
                        <p className="text-sm font-medium text-slate-400">System Uptime</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Section - Redesigned */}
            <Card className="bg-black/40 backdrop-blur-xl border border-[#449b96]/20 shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#449b96]" /> Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        {stats.recentActivity.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                                <div className="p-4 rounded-full bg-white/5 mb-4">
                                    <ShieldCheck className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="font-medium text-slate-400">No recent activity</p>
                                <p className="text-sm text-slate-600 mt-1">All quiet on the western front.</p>
                            </div>
                        ) : (
                            stats.recentActivity.map((activity, i) => (
                                <div key={i} className="p-5 flex items-start gap-4 hover:bg-white/5 transition-colors group">
                                    <div className={cn("mt-1 p-2 rounded-lg border transition-colors",
                                        activity.type === 'support'
                                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:bg-amber-500/20"
                                            : "bg-purple-500/10 text-purple-500 border-purple-500/20 group-hover:bg-purple-500/20"
                                    )}>
                                        {activity.type === 'support' ? <MessageSquare className="w-5 h-5" /> : <GitPullRequest className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-medium text-slate-200">
                                                User <span className="text-[#449b96] font-bold">{activity.username}</span> submitted a {activity.type === 'support' ? 'support ticket' : 'change request'}
                                            </p>
                                            <span className="text-xs text-slate-500 font-mono">
                                                {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={cn("text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold",
                                                activity.type === 'support'
                                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                            )}>
                                                {activity.type}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(activity.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboard;
