import React, { useState } from 'react';
import { UserPlus, Mail, Lock, Shield, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface AdminAddUserProps {
    adminPassword: string;
    onBack: () => void;
}

const AdminAddUser: React.FC<AdminAddUserProps> = ({ adminPassword, onBack }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        plan: 'free'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Get password from session if not provided prop
            const session = localStorage.getItem('nexdev_admin_session');
            const pwd = adminPassword || (session ? JSON.parse(session).password : '');

            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': pwd
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    plan: formData.plan,
                    adminPassword: pwd // Also send in body as backup
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('User created successfully!');
                setFormData({ username: '', email: '', password: '', plan: 'free' });
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.error || 'Failed to create user');
            }
        } catch (err) {
            setError('An error occurred while creating the user');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Users
            </button>

            <div className="bg-black rounded-xl shadow-lg border border-cyan-900/20 p-8 ring-1 ring-cyan-900/10 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] pointer-events-none" />

                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                        <UserPlus className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Add New User</h2>
                        <p className="text-slate-400">Create a new user account manually</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-lg flex items-center gap-3 text-emerald-400 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <p>{success}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Username</label>
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-cyan-900/30 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none text-white placeholder-slate-600 transition-all hover:border-cyan-900/50"
                                    placeholder="johndoe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-cyan-900/30 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none text-white placeholder-slate-600 transition-all hover:border-cyan-900/50"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-cyan-900/30 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none text-white placeholder-slate-600 transition-all hover:border-cyan-900/50"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Plan Tier</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                <select
                                    value={formData.plan}
                                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-cyan-900/30 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none text-white appearance-none cursor-pointer transition-all hover:border-cyan-900/50"
                                >
                                    <option value="free">Free Plan</option>
                                    <option value="pro">Pro Plan</option>
                                    <option value="enterprise">Enterprise Plan</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_25px_rgba(8,145,178,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating User...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Create User Account
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminAddUser;
