import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import {
    UserIcon,
    LogOutIcon,
    CreditCardIcon,
    ShieldCheckIcon,
    ServerStackIcon,
    XIcon,
    Cog6ToothIcon,
    QuestionMarkCircleIcon,
    EnvelopeIcon,
    ClockIcon
} from './icons';
import { Agent, AgentStatus, PlanTier } from '../types';
import { Button } from './ui';
import { settingsApi } from '../services/api';

interface UserDashboardPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    userPlan: PlanTier;
    agents: Agent[];
    onNavigateToSupport: () => void;
    onNavigateToPricing: () => void;
}

type TabType = 'overview' | 'settings' | 'security' | 'system' | 'support';

interface UserPreferences {
    emailNotifications: boolean;
    agentStatusNotifications: boolean;
    weeklyReports: boolean;
}

const UserDashboardPopup: React.FC<UserDashboardPopupProps> = ({
    isOpen,
    onClose,
    onLogout,
    userPlan,
    agents,
    onNavigateToSupport,
    onNavigateToPricing
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Settings state
    const [preferences, setPreferences] = useState<UserPreferences>({
        emailNotifications: true,
        agentStatusNotifications: true,
        weeklyReports: false
    });
    const [uptime, setUptime] = useState<{ uptime: number; uptimeFormatted: string } | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [preferencesMessage, setPreferencesMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch user data from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUserData({
                    name: parsed.username || 'User',
                    email: parsed.email || 'user@example.com'
                });
            } catch (e) {
                setUserData({ name: 'User', email: 'user@example.com' });
            }
        } else {
            setUserData({ name: 'User', email: 'user@example.com' });
        }
    }, [isOpen]);

    // Fetch preferences when settings tab is opened
    useEffect(() => {
        if (activeTab === 'settings' && isOpen) {
            loadPreferences();
        }
    }, [activeTab, isOpen]);

    // Fetch uptime when system tab is opened and poll every 10 seconds
    useEffect(() => {
        if (activeTab === 'system' && isOpen) {
            loadUptime();
            const interval = setInterval(loadUptime, 10000);
            return () => clearInterval(interval);
        }
    }, [activeTab, isOpen]);

    const loadPreferences = async () => {
        const response = await settingsApi.getPreferences();
        if (response.success && response.data) {
            setPreferences({
                emailNotifications: response.data.data.emailNotifications,
                agentStatusNotifications: response.data.data.agentStatusNotifications,
                weeklyReports: response.data.data.weeklyReports
            });
        }
    };

    const loadUptime = async () => {
        const response = await settingsApi.getUptime();
        if (response.success && response.data) {
            setUptime({
                uptime: response.data.data.uptime,
                uptimeFormatted: response.data.data.uptimeFormatted
            });
        }
    };

    // Opening animation
    useEffect(() => {
        if (isOpen) {
            gsap.set(overlayRef.current, { autoAlpha: 0 });
            gsap.set(popupRef.current, { autoAlpha: 0, y: 50, scale: 0.95 });

            const tl = gsap.timeline();
            tl.to(overlayRef.current, {
                autoAlpha: 1,
                duration: 0.3,
                ease: 'power2.out'
            })
                .to(popupRef.current, {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.5,
                    ease: 'back.out(1.4)'
                }, '-=0.15');
        } else if (popupRef.current && overlayRef.current) {
            const tl = gsap.timeline();
            tl.to(popupRef.current, {
                autoAlpha: 0,
                y: 30,
                scale: 0.95,
                duration: 0.25,
                ease: 'power2.in'
            })
                .to(overlayRef.current, {
                    autoAlpha: 0,
                    duration: 0.2
                }, '-=0.1');
        }
    }, [isOpen]);

    // Tab switch animation
    const handleTabChange = useCallback((tab: TabType) => {
        if (tab === activeTab) return;

        // Animate out current content
        gsap.to(contentRef.current, {
            autoAlpha: 0,
            x: -20,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                setActiveTab(tab);
                // Animate in new content
                gsap.fromTo(contentRef.current,
                    { autoAlpha: 0, x: 20 },
                    {
                        autoAlpha: 1,
                        x: 0,
                        duration: 0.3,
                        ease: 'power2.out'
                    }
                );
            }
        });
    }, [activeTab]);

    const handleCancelPlan = async () => {
        const response = await settingsApi.cancelPlan();
        if (response.success) {
            setShowCancelConfirm(false);
            // Refresh page to update plan
            window.location.reload();
        }
    };

    const handleSavePreferences = async () => {
        const response = await settingsApi.updatePreferences(preferences);
        if (response.success) {
            setPreferencesMessage({ type: 'success', text: 'Preferences saved successfully!' });
            setTimeout(() => setPreferencesMessage(null), 3000);
        } else {
            setPreferencesMessage({ type: 'error', text: 'Failed to save preferences' });
        }
    };

    const handleChangePassword = async () => {
        setPasswordMessage(null);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        const response = await settingsApi.changePassword({
            currentPassword,
            newPassword
        });

        if (response.success) {
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordMessage(null), 3000);
        } else {
            setPasswordMessage({ type: 'error', text: response.error || 'Failed to change password' });
        }
    };

    if (!isOpen) return null;

    const runningAgents = agents.filter(a => a.status === AgentStatus.Running);

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: UserIcon },
        { id: 'settings' as TabType, label: 'Settings', icon: Cog6ToothIcon },
        { id: 'security' as TabType, label: 'Security', icon: ShieldCheckIcon },
        { id: 'system' as TabType, label: 'System Status', icon: ClockIcon },
        { id: 'support' as TabType, label: 'Support', icon: QuestionMarkCircleIcon }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div
                ref={popupRef}
                className="relative w-full max-w-4xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex max-h-[85vh]"
            >
                {/* Left Sidebar - Tabs */}
                <div className="w-64 bg-muted/5 border-r border-border/30 p-4 flex flex-col">
                    {/* User Info Header */}
                    <div className="mb-6 pb-4 border-b border-border/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                <UserIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base font-bold text-foreground leading-tight truncate">
                                    {userData?.name}
                                </h2>
                                <p className="text-xs text-muted-foreground truncate">{userData?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Current Plan</span>
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase border border-primary/20">
                                {userPlan}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex-1 space-y-1">
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => handleTabChange(id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === id
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Sign Out Button */}
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all text-sm font-bold mt-4"
                    >
                        <LogOutIcon className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col">
                    {/* Close Button */}
                    <div className="absolute top-4 right-4 z-10">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <XIcon className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Content */}
                    <div ref={contentRef} className="p-6 overflow-y-auto flex-1">
                        {activeTab === 'overview' && (
                            <div className="space-y-6 max-w-2xl">
                                <h3 className="text-2xl font-bold text-foreground mb-4">Account Overview</h3>

                                {/* Plan Section */}
                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                            <CreditCardIcon className="h-5 w-5 text-primary" />
                                            Subscription Plan
                                        </h4>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                                onClose();
                                                onNavigateToPricing();
                                            }}
                                        >
                                            Upgrade Plan
                                        </Button>
                                        {userPlan !== 'free' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                                onClick={() => setShowCancelConfirm(true)}
                                            >
                                                Cancel Plan
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Running Agents */}
                                <div>
                                    <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <ServerStackIcon className="h-5 w-5 text-blue-400" />
                                        Active Agents
                                    </h4>
                                    {runningAgents.length > 0 ? (
                                        <div className="space-y-2">
                                            {runningAgents.map(agent => (
                                                <div key={agent.id} className="flex items-center justify-between p-4 bg-muted/10 rounded-lg border border-border/20">
                                                    <span className="text-sm font-medium">{agent.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                        </span>
                                                        <span className="text-xs text-green-400 font-medium">Running</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 bg-muted/5 rounded-lg border border-border/10 text-sm text-muted-foreground">
                                            No agents currently running
                                        </div>
                                    )}
                                </div>

                                {/* Support Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onNavigateToSupport();
                                        }}
                                        className="p-4 rounded-xl bg-muted/10 hover:bg-muted/20 border border-border/20 transition-all text-left group"
                                    >
                                        <QuestionMarkCircleIcon className="h-6 w-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                                        <div className="text-sm font-semibold mb-1">Support Center</div>
                                        <div className="text-xs text-muted-foreground">Get help fast</div>
                                    </button>
                                    <button className="p-4 rounded-xl bg-muted/10 hover:bg-muted/20 border border-border/20 transition-all text-left group">
                                        <EnvelopeIcon className="h-6 w-6 text-orange-400 mb-3 group-hover:scale-110 transition-transform" />
                                        <div className="text-sm font-semibold mb-1">Contact Us</div>
                                        <div className="text-xs text-muted-foreground">Email support</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-6 max-w-2xl">
                                <h3 className="text-2xl font-bold text-foreground mb-4">Notification Settings</h3>

                                {preferencesMessage && (
                                    <div className={`p-3 rounded-lg text-sm ${preferencesMessage.type === 'success'
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                        }`}>
                                        {preferencesMessage.text}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-lg border border-border/20">
                                        <div>
                                            <div className="text-sm font-medium mb-1">Email Notifications</div>
                                            <div className="text-xs text-muted-foreground">Receive updates via email</div>
                                        </div>
                                        <button
                                            onClick={() => setPreferences(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.emailNotifications ? 'bg-primary' : 'bg-muted'
                                                }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-lg border border-border/20">
                                        <div>
                                            <div className="text-sm font-medium mb-1">Agent Status Notifications</div>
                                            <div className="text-xs text-muted-foreground">Get notified when agents change status</div>
                                        </div>
                                        <button
                                            onClick={() => setPreferences(prev => ({ ...prev, agentStatusNotifications: !prev.agentStatusNotifications }))}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.agentStatusNotifications ? 'bg-primary' : 'bg-muted'
                                                }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.agentStatusNotifications ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-lg border border-border/20">
                                        <div>
                                            <div className="text-sm font-medium mb-1">Weekly Reports</div>
                                            <div className="text-xs text-muted-foreground">Receive weekly activity summaries</div>
                                        </div>
                                        <button
                                            onClick={() => setPreferences(prev => ({ ...prev, weeklyReports: !prev.weeklyReports }))}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.weeklyReports ? 'bg-primary' : 'bg-muted'
                                                }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>
                                </div>

                                <Button onClick={handleSavePreferences} className="w-full">
                                    Save Preferences
                                </Button>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 max-w-2xl">
                                <h3 className="text-2xl font-bold text-foreground mb-4">Security Settings</h3>

                                {passwordMessage && (
                                    <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success'
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                        }`}>
                                        {passwordMessage.text}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-2 bg-muted/20 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="Enter current password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-2 bg-muted/20 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="Enter new password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-2 bg-muted/20 border border-border/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>

                                <Button onClick={handleChangePassword} className="w-full">
                                    Change Password
                                </Button>
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="space-y-6 max-w-2xl">
                                <h3 className="text-2xl font-bold text-foreground mb-4">System Status</h3>

                                <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl p-6 border border-border/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <ClockIcon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold">Backend Uptime</h4>
                                            <p className="text-xs text-muted-foreground">Server has been running continuously</p>
                                        </div>
                                    </div>

                                    {uptime ? (
                                        <div className="bg-muted/20 rounded-lg p-4 border border-border/20">
                                            <div className="text-3xl font-bold text-primary mb-2">
                                                {uptime.uptimeFormatted}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Total uptime: {uptime.uptime} seconds
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-muted/20 rounded-lg p-4 border border-border/20 text-center text-sm text-muted-foreground">
                                            Loading uptime data...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'support' && (
                            <div className="space-y-6 max-w-2xl">
                                <h3 className="text-2xl font-bold text-foreground mb-4">Support & Help</h3>

                                <div className="grid gap-4">
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onNavigateToSupport();
                                        }}
                                        className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:from-purple-500/15 hover:to-purple-500/10 border border-purple-500/20 transition-all text-left group"
                                    >
                                        <QuestionMarkCircleIcon className="h-8 w-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                                        <div className="text-lg font-semibold mb-2">Support Center</div>
                                        <div className="text-sm text-muted-foreground">Access our comprehensive help documentation and submit support tickets</div>
                                    </button>

                                    <button className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 hover:from-orange-500/15 hover:to-orange-500/10 border border-orange-500/20 transition-all text-left group">
                                        <EnvelopeIcon className="h-8 w-8 text-orange-400 mb-4 group-hover:scale-110 transition-transform" />
                                        <div className="text-lg font-semibold mb-2">Email Support</div>
                                        <div className="text-sm text-muted-foreground">Contact our team directly via email for personalized assistance</div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cancel Plan Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCancelConfirm(false)}
                    />
                    <div className="relative bg-card border border-border/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Cancel Subscription?</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to cancel your {userPlan} plan? You will be downgraded to the free tier and lose access to premium features.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowCancelConfirm(false)}
                            >
                                Keep Plan
                            </Button>
                            <Button
                                variant="ghost"
                                className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                onClick={handleCancelPlan}
                            >
                                Cancel Plan
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboardPopup;
