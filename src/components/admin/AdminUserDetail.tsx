import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Calendar, Shield, Activity, Save, Clock, MessageSquare, GitPullRequest } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface UserDetail {
    id: string;
    username: string;
    email: string;
    plan_tier: string;
    created_at: string;
    updated_at: string;
    support_requests_count: number;
    change_requests_count: number;
    last_activity: string | null;
}

interface DashboardData {
    support_timer: string | null;
    security_check: boolean;
    last_updated: string;
}

interface AdminUserDetailProps {
    userId: string;
    adminPassword: string;
    onBack: () => void;
}

const AdminUserDetail: React.FC<AdminUserDetailProps> = ({ userId, adminPassword, onBack }) => {
    const [user, setUser] = useState<UserDetail | null>(null);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [supportTimer, setSupportTimer] = useState('');
    const [securityCheck, setSecurityCheck] = useState(false);

    useEffect(() => {
        fetchUserDetails();
    }, [userId]);

    const fetchUserDetails = async () => {
        try {
            const session = localStorage.getItem('nexdev_admin_session');
            const pwd = adminPassword || (session ? JSON.parse(session).password : '');

            // Fetch user basic info
            const userResponse = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                headers: { 'x-admin-password': pwd }
            });
            const userData = await userResponse.json();

            if (userData.success) {
                setUser(userData.data);
            }

            // Fetch dashboard data
            const dashboardResponse = await fetch(`${API_BASE_URL}/admin/users/${userId}/dashboard`, {
                headers: { 'x-admin-password': pwd }
            });
            const dashData = await dashboardResponse.json();

            if (dashData.success && dashData.data) {
                setDashboardData(dashData.data);
                setSupportTimer(dashData.data.support_timer || '');
                setSecurityCheck(dashData.data.security_check || false);
            }
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveDashboard = async () => {
        setIsSaving(true);
        try {
            const session = localStorage.getItem('nexdev_admin_session');
            const pwd = adminPassword || (session ? JSON.parse(session).password : '');

            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/dashboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': pwd
                },
                body: JSON.stringify({
                    supportTimer: supportTimer || null,
                    securityCheck
                })
            });

            const data = await response.json();
            if (data.success) {
                // Show success message or toast
                fetchUserDetails(); // Refresh data
            }
        } catch (error) {
            console.error('Failed to update dashboard data:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading user details...
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">User not found</p>
                <button onClick={onBack} className="mt-4 text-cyan-400 hover:text-cyan-300">Go Back</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Users
            </button>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-cyan-500 text-2xl font-bold border border-cyan-900/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            {user.email}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize border
                        ${user.plan_tier === 'enterprise' ? 'bg-purple-950/30 text-purple-400 border-purple-900/50' :
                            user.plan_tier === 'pro' ? 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50' :
                                'bg-zinc-800 text-slate-400 border-zinc-700'}`}>
                        {user.plan_tier} Plan
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info Card */}
                <div className="bg-black rounded-xl shadow-lg border border-cyan-900/20 p-6 ring-1 ring-cyan-900/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-cyan-500" />
                        Account Details
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-cyan-900/10">
                            <span className="text-slate-500">User ID</span>
                            <span className="text-slate-300 font-mono text-xs">{user.id}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-cyan-900/10">
                            <span className="text-slate-500">Joined</span>
                            <span className="text-slate-300 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(user.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-cyan-900/10">
                            <span className="text-slate-500">Last Activity</span>
                            <span className="text-slate-300 flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" />
                                {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Activity Stats */}
                <div className="bg-black rounded-xl shadow-lg border border-cyan-900/20 p-6 ring-1 ring-cyan-900/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-500" />
                        Activity Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900/50 p-4 rounded-lg border border-cyan-900/10">
                            <div className="flex items-center gap-2 text-amber-500 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm font-medium">Support</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{user.support_requests_count}</p>
                            <p className="text-xs text-slate-500">Total Requests</p>
                        </div>
                        <div className="bg-zinc-900/50 p-4 rounded-lg border border-cyan-900/10">
                            <div className="flex items-center gap-2 text-purple-500 mb-2">
                                <GitPullRequest className="w-4 h-4" />
                                <span className="text-sm font-medium">Changes</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{user.change_requests_count}</p>
                            <p className="text-xs text-slate-500">Total Requests</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Controls */}
                <div className="bg-black rounded-xl shadow-lg border border-cyan-900/20 p-6 ring-1 ring-cyan-900/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-cyan-500" />
                        Dashboard Controls
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Support Timer (Target Date)
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                <input
                                    type="datetime-local"
                                    value={supportTimer}
                                    onChange={(e) => setSupportTimer(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-cyan-900/30 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none text-white text-sm"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Set cooldown timer for support tickets</p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-cyan-900/10">
                            <span className="text-sm font-medium text-slate-300">Security Check Passed</span>
                            <button
                                onClick={() => setSecurityCheck(!securityCheck)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-black
                                    ${securityCheck ? 'bg-cyan-600' : 'bg-zinc-700'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                        ${securityCheck ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>

                        <button
                            onClick={handleSaveDashboard}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserDetail;
