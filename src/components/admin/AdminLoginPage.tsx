import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import ParticleBackground from '../ParticleBackground';

interface AdminLoginPageProps {
    onLoginSuccess: (password: string) => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.success) {
                onLoginSuccess(password);
            } else {
                setError(data.error || 'Invalid password');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent p-4 selection:bg-[#449b96]/30 relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
                <ParticleBackground />
            </div>

            <div className="bg-black/60 backdrop-blur-xl w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#449b96]/20 ring-1 ring-[#449b96]/10 relative z-10">
                <div className="p-8 pb-6 text-center">
                    <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#449b96]/30 shadow-[0_0_15px_rgba(68,155,150,0.1)]">
                        <Shield className="w-8 h-8 text-[#449b96]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Admin Access</h1>
                    <p className="text-slate-400 mt-2">Enter your secure credentials to continue</p>
                </div>

                <div className="p-8 pt-0">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Admin Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#449b96]" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-[#449b96]/30 rounded-lg focus:ring-1 focus:ring-[#449b96] focus:border-[#449b96] outline-none transition-all text-white placeholder-slate-600 hover:border-[#449b96]/50"
                                    placeholder="••••••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 p-3 rounded-lg border border-red-900/50 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#449b96] hover:bg-[#357a76] text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(68,155,150,0.3)] hover:shadow-[0_0_25px_rgba(68,155,150,0.5)]"
                        >
                            {isLoading ? 'Verifying...' : 'Access Dashboard'}
                            {!isLoading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>
                </div>

                <div className="bg-zinc-950/30 p-4 text-center text-xs text-slate-500 border-t border-[#449b96]/10">
                    NexDevs Secure Admin Panel • v1.0.0
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
