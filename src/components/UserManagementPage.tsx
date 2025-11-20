import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../services/api';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from './ui';
import { UserIcon, KeyIcon, MailIcon, ShieldCheckIcon, XIcon } from './icons';
import gsap from 'gsap';
import ParticleBackground from './ParticleBackground';

type PlanTier = 'free' | 'pro' | 'enterprise';

interface NewUserForm {
    username: string;
    password: string;
    email: string;
    plan: PlanTier;
}

const UserManagementPage: React.FC = () => {
    const [isAdminVerified, setIsAdminVerified] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [newUser, setNewUser] = useState<NewUserForm>({
        username: '',
        password: '',
        email: '',
        plan: 'free'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const cardRef = useRef<HTMLDivElement>(null);

    // Animation on mount
    useEffect(() => {
        const card = cardRef.current;
        if (card) {
            gsap.set(card, { autoAlpha: 0, y: 30, scale: 0.95 });
            gsap.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out', force3D: true });
        }
    }, [isAdminVerified]);

    const handleAdminVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await adminApi.verifyPassword(adminPassword);
            if (response.success) {
                setIsAdminVerified(true);
                setAdminPassword(''); // Clear for security
            } else {
                setError(response.error || 'Invalid admin password');
            }
        } catch (error) {
            setError('Failed to verify admin password');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await adminApi.createUser({
                ...newUser,
                adminPassword: adminPassword || '' // Reuse stored password
            });

            if (response.success && response.data) {
                setSuccess(`User "${newUser.username}" created successfully with ${newUser.plan} plan!`);
                // Clear form
                setNewUser({
                    username: '',
                    password: '',
                    email: '',
                    plan: 'free'
                });
            } else {
                setError(response.error || 'Failed to create user');
            }
        } catch (error) {
            setError('Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToDashboard = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden">
            <ParticleBackground />

            <Card ref={cardRef} className="w-full max-w-2xl z-10 bg-card/95 backdrop-blur-xl border border-primary/40 shadow-[0_0_30px_-5px_rgba(72,168,163,0.4)]">
                <CardHeader className="text-center pb-6 border-b border-border/20">
                    <div className="mx-auto bg-primary/10 border border-primary/30 h-16 w-16 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(72,168,163,0.2)]">
                        <ShieldCheckIcon className="h-9 w-9 text-primary" />
                    </div>
                    <CardTitle className="text-3xl tracking-wide text-foreground">Admin Panel</CardTitle>
                    <p className="text-muted-foreground mt-2">User Management System</p>
                </CardHeader>

                <CardContent className="pt-8 pb-8">
                    {!isAdminVerified ? (
                        <form onSubmit={handleAdminVerification} className="space-y-6">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-semibold text-foreground mb-2">Admin Authentication Required</h3>
                                <p className="text-sm text-muted-foreground">
                                    Enter the admin panel password to access user management
                                </p>
                            </div>

                            <div className="relative group">
                                <KeyIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors z-10" />
                                <Input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="Admin Password"
                                    required
                                    className="pl-12 bg-muted/30 dark:bg-black/30 border-border/60"
                                    aria-label="Admin Password"
                                />
                            </div>

                            {error && (
                                <p className="text-base font-medium text-red-500 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                                    {error}
                                </p>
                            )}

                            <Button type="submit" size="lg" className="w-full" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify Admin Access'}
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                size="lg"
                                className="w-full"
                                onClick={handleBackToDashboard}
                            >
                                Back to Dashboard
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-semibold text-foreground mb-2">Create New User</h3>
                                <p className="text-sm text-muted-foreground">
                                    Add users to the database with specific plan configurations
                                </p>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-6">
                                {/* Username */}
                                <div className="relative group">
                                    <Label htmlFor="username" className="text-base mb-2 block">Username</Label>
                                    <UserIcon className="absolute left-4 top-[2.75rem] -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors z-10" />
                                    <Input
                                        id="username"
                                        type="text"
                                        value={newUser.username}
                                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                        placeholder="e.g., johndoe"
                                        required
                                        className="pl-12 bg-muted/30 dark:bg-black/30 border-border/60"
                                    />
                                </div>

                                {/* Password */}
                                <div className="relative group">
                                    <Label htmlFor="password" className="text-base mb-2 block">Password</Label>
                                    <KeyIcon className="absolute left-4 top-[2.75rem] -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors z-10" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="Minimum 8 characters"
                                        required
                                        minLength={8}
                                        className="pl-12 bg-muted/30 dark:bg-black/30 border-border/60"
                                    />
                                </div>

                                {/* Email */}
                                <div className="relative group">
                                    <Label htmlFor="email" className="text-base mb-2 block">Email (Optional)</Label>
                                    <MailIcon className="absolute left-4 top-[2.75rem] -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors z-10" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="user@example.com"
                                        className="pl-12 bg-muted/30 dark:bg-black/30 border-border/60"
                                    />
                                </div>

                                {/* Plan Selection */}
                                <div>
                                    <Label className="text-base mb-3 block">Plan Tier</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['free', 'pro', 'enterprise'] as PlanTier[]).map((plan) => (
                                            <label
                                                key={plan}
                                                className={`cursor-pointer block p-4 rounded-xl border-2 text-center transition-all ${newUser.plan === plan
                                                        ? 'border-primary bg-primary/20'
                                                        : 'border-border/40 bg-muted/20 hover:border-primary/50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="plan"
                                                    value={plan}
                                                    checked={newUser.plan === plan}
                                                    onChange={(e) => setNewUser({ ...newUser, plan: e.target.value as PlanTier })}
                                                    className="sr-only"
                                                />
                                                <span className="font-bold text-lg capitalize">{plan}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-base font-medium text-red-500 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                                        {error}
                                    </p>
                                )}

                                {success && (
                                    <p className="text-base font-medium text-green-500 text-center bg-green-500/10 py-2 rounded-lg border border-green-500/20">
                                        {success}
                                    </p>
                                )}

                                <div className="flex gap-3">
                                    <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                                        {loading ? 'Creating User...' : 'Create User'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="lg"
                                        onClick={handleBackToDashboard}
                                    >
                                        Dashboard
                                    </Button>
                                </div>
                            </form>

                            <div className="pt-4 border-t border-border/20">
                                <p className="text-xs text-muted-foreground text-center">
                                    Created users can immediately login with their credentials
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UserManagementPage;
