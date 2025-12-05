import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, MessageSquare, GitPullRequest, Clock } from 'lucide-react';

interface User {
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

interface AdminAllUsersProps {
    adminPassword: string;
}

const AdminAllUsers: React.FC<AdminAllUsersProps> = ({ adminPassword }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlan, setFilterPlan] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // Get password from session if not provided prop (though prop should be there)
            const session = localStorage.getItem('nexdev_admin_session');
            const pwd = adminPassword || (session ? JSON.parse(session).password : '');

            const response = await fetch('http://localhost:3001/api/admin/users-list', {
                headers: {
                    'x-admin-password': pwd
                }
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlan = filterPlan === 'all' || user.plan_tier === filterPlan;
        return matchesSearch && matchesPlan;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">All Users</h2>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-black border border-cyan-900/30 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none w-full sm:w-64 text-slate-200 placeholder-slate-600 shadow-[0_0_10px_rgba(6,182,212,0.05)]"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                        <select
                            value={filterPlan}
                            onChange={(e) => setFilterPlan(e.target.value)}
                            className="pl-9 pr-8 py-2 bg-black border border-cyan-900/30 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none appearance-none text-slate-200 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.05)]"
                        >
                            <option value="all">All Plans</option>
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-black rounded-xl shadow-lg border border-cyan-900/20 overflow-hidden ring-1 ring-cyan-900/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-cyan-900/20">
                                <th className="px-6 py-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">Requests</th>
                                <th className="px-6 py-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">Last Activity</th>
                                <th className="px-6 py-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-900/10">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                            Loading users...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users found matching your criteria</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-cyan-950/10 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-cyan-500 font-medium text-sm border border-cyan-900/30 group-hover:border-cyan-500/50 transition-colors">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">{user.username}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                                                ${user.plan_tier === 'enterprise' ? 'bg-purple-950/30 text-purple-400 border-purple-900/50' :
                                                    user.plan_tier === 'pro' ? 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50' :
                                                        'bg-zinc-800 text-slate-400 border-zinc-700'}`}>
                                                {user.plan_tier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                <div className="flex items-center gap-1" title="Support Requests">
                                                    <MessageSquare className="w-4 h-4 text-amber-500" />
                                                    <span>{user.support_requests_count}</span>
                                                </div>
                                                <div className="flex items-center gap-1" title="Change Requests">
                                                    <GitPullRequest className="w-4 h-4 text-purple-500" />
                                                    <span>{user.change_requests_count}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {user.last_activity ? (
                                                <span className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(user.last_activity).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    window.history.pushState({}, '', `/nexdev/users/${user.id}`);
                                                    window.dispatchEvent(new PopStateEvent('popstate'));
                                                }}
                                                className="text-slate-500 hover:text-cyan-400 transition-colors p-2 hover:bg-cyan-950/30 rounded-lg"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAllUsers;
