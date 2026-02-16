import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface SupportRequest {
    id: string;
    user_id: string;
    username: string;
    email: string;
    subject: string;
    message: string;
    status: 'pending' | 'completed';
    submitted_at: string;
}

interface AdminSupportRequestsProps {
    adminPassword: string;
}

const AdminSupportRequests: React.FC<AdminSupportRequestsProps> = ({ adminPassword }) => {
    const [requests, setRequests] = useState<SupportRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            // Get password from session if not provided prop
            const session = localStorage.getItem('nexdev_admin_session');
            const pwd = adminPassword || (session ? JSON.parse(session).password : '');

            const response = await fetch(`${API_BASE_URL}/admin/support-requests`, {
                headers: {
                    'x-admin-password': pwd
                }
            });
            const data = await response.json();
            if (data.success) {
                setRequests(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch support requests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkComplete = async (requestId: string) => {
        try {
            const session = localStorage.getItem('nexdev_admin_session');
            const pwd = adminPassword || (session ? JSON.parse(session).password : '');

            const response = await fetch(`${API_BASE_URL}/admin/support-requests/${requestId}/complete`, {
                method: 'POST',
                headers: {
                    'x-admin-password': pwd
                }
            });

            if (response.ok) {
                setRequests(requests.map(req =>
                    req.id === requestId ? { ...req, status: 'completed' } : req
                ));
            }
        } catch (error) {
            console.error('Failed to update request status:', error);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">Support Requests</h2>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#449b96]" />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-black/40 backdrop-blur-md border border-[#449b96]/30 rounded-lg focus:ring-1 focus:ring-[#449b96] outline-none w-full sm:w-64 text-slate-200 placeholder-slate-600 shadow-[0_0_10px_rgba(68,155,150,0.05)]"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#449b96]" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-9 pr-8 py-2 bg-black/40 backdrop-blur-md border border-[#449b96]/30 rounded-lg focus:ring-1 focus:ring-[#449b96] outline-none appearance-none text-slate-200 cursor-pointer shadow-[0_0_10px_rgba(68,155,150,0.05)]"
                        >
                            <option value="all" className="bg-black text-slate-200">All Status</option>
                            <option value="pending" className="bg-black text-slate-200">Pending</option>
                            <option value="completed" className="bg-black text-slate-200">Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-xl shadow-lg border border-[#449b96]/20 overflow-hidden ring-1 ring-[#449b96]/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-[#449b96]/20">
                                <th className="px-6 py-4 text-xs font-semibold text-[#449b96] uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#449b96] uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#449b96] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#449b96] uppercase tracking-wider">Submitted</th>
                                <th className="px-6 py-4 text-xs font-semibold text-[#449b96] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#449b96]/10">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-[#449b96] border-t-transparent rounded-full animate-spin"></div>
                                            Loading requests...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No support requests found</td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-[#449b96]/10 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-900/50 flex items-center justify-center text-[#449b96] font-medium text-sm border border-[#449b96]/30 group-hover:border-[#449b96]/50 transition-colors">
                                                    {req.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200 group-hover:text-[#449b96] transition-colors">{req.username}</p>
                                                    <p className="text-xs text-slate-500">{req.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs">
                                                <p className="text-sm font-medium text-slate-200 truncate" title={req.subject}>{req.subject}</p>
                                                <p className="text-xs text-slate-500 truncate" title={req.message}>{req.message}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                                                ${req.status === 'completed'
                                                    ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
                                                    : 'bg-amber-950/30 text-amber-400 border-amber-900/50'}`}>
                                                {req.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(req.submitted_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === 'pending' && (
                                                <button
                                                    onClick={() => handleMarkComplete(req.id)}
                                                    className="text-xs font-medium bg-[#449b96]/20 text-[#449b96] border border-[#449b96]/50 px-3 py-1.5 rounded-lg hover:bg-[#449b96]/40 transition-colors"
                                                >
                                                    Mark Complete
                                                </button>
                                            )}
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

export default AdminSupportRequests;
