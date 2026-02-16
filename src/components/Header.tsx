
import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import {
    N8nLogo,
    LogOutIcon,
    ClockIcon,
    HamburgerIcon,
    XIcon,
    ChartPieIcon,
    BookOpenIcon,
    QuestionMarkCircleIcon,
    ShieldCheckIcon,
    CreditCardIcon,
    CheckBadgeIcon,
    WrenchScrewdriverIcon,
    UserIcon,
    BellIcon
} from './icons';
import NotificationDropdown, { Notification } from './NotificationDropdown';
import ThemeToggle from './ThemeToggle';
import { cn } from './ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { notificationApi } from '../services/api';
import { ScrollArea } from './ui/scroll-area';
import { Clock } from 'lucide-react';

// --- Sub-Components ---

import { PlanTier } from '../types';

const SupportTimer: React.FC<{ expiresAt: Date; compact?: boolean; plan?: PlanTier }> = ({ expiresAt, compact, plan }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [colorClass, setColorClass] = useState('text-green-400');

    useEffect(() => {
        const calculateTime = () => {
            const difference = +new Date(expiresAt) - +new Date();
            if (difference > 0) {
                const totalSeconds = difference / 1000;

                if (totalSeconds > 3600) {
                    setColorClass('text-green-400');
                } else if (totalSeconds > 1200) {
                    setColorClass('text-yellow-400');
                } else {
                    setColorClass('text-red-400');
                }

                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                if (compact) {
                    if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}`;
                    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                }

                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
            return '';
        };

        const timer = setInterval(() => {
            const newTimeLeft = calculateTime();
            if (!newTimeLeft) {
                clearInterval(timer);
                setTimeLeft('');
            } else {
                setTimeLeft(newTimeLeft);
            }
        }, 1000);

        setTimeLeft(calculateTime());

        return () => clearInterval(timer);
    }, [expiresAt, compact]);

    if (!timeLeft) return null;

    return (
        <div className="relative group cursor-help">
            <div className={cn(
                "flex items-center gap-1.5 font-mono rounded-md transition-colors",
                colorClass,
                compact ? "text-xs font-semibold bg-transparent" : "text-sm bg-card/40 px-2 py-1 border border-border/30"
            )}>
                <ClockIcon className={compact ? "h-3 w-3" : "h-4 w-4"} />
                <span>{compact ? '' : 'ETA: '}{timeLeft}</span>
            </div>

            <div className={cn(
                "absolute top-full mt-3 w-max max-w-[180px] p-3 rounded-xl bg-foreground/90 text-background backdrop-blur-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 translate-y-2 group-hover:translate-y-0 text-center text-xs font-semibold leading-relaxed border border-background/20",
                compact ? "right-0 origin-top-right" : "left-1/2 -translate-x-1/2 origin-top"
            )}>
                Your assistant will assist you in under {plan === 'enterprise' ? '15 minutes' : plan === 'pro' ? '1 hour' : '2 hours'}.
                <div className={cn(
                    "absolute bottom-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-foreground/90",
                    compact ? "right-2" : "left-1/2 -translate-x-1/2"
                )}></div>
            </div>
        </div>
    );
};

const CompactStats: React.FC<{ count: number; limit: number | 'Unlimited'; expiresAt: Date | null; plan?: PlanTier }> = ({ count, limit, expiresAt, plan }) => (
    <div className="flex items-center gap-3 bg-muted/10 backdrop-blur-sm border border-border/20 rounded-full pl-3 pr-2 py-1.5 shadow-sm hover:bg-muted/20 transition-colors">
        <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-muted-foreground" title="Support Requests Used">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-primary/80" />
            <span className={limit !== 'Unlimited' && count >= limit ? "text-red-400" : "text-foreground"}>
                {count}/{limit === 'Unlimited' ? <span className="text-xl leading-none">∞</span> : limit}
            </span>
        </div>

        {expiresAt && (
            <>
                <div className="h-3 w-px bg-border/30"></div>
                <SupportTimer expiresAt={expiresAt} compact plan={plan} />
            </>
        )}
    </div>
);

interface MobileNavMenuProps {
    onClose: () => void;
    onNavigate: (page: 'dashboard' | 'howToUse' | 'support' | 'pricing' | 'subscription') => void;
    onLogout: () => void;
    supportRequestCount: number;
    weeklySupportLimit: number | 'Unlimited';
}

const MobileNavMenu: React.FC<MobileNavMenuProps> = ({ onClose, onNavigate, onLogout, supportRequestCount, weeklySupportLimit }) => {
    const backdropRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const handleClose = useCallback(() => {
        if (!panelRef.current || !backdropRef.current) return;
        const tl = gsap.timeline({ onComplete: onClose });
        tl.to(panelRef.current, { autoAlpha: 0, scale: 0.95, duration: 0.3, ease: 'expo.in' })
            .to(backdropRef.current, { autoAlpha: 0, duration: 0.3 }, "<");
    }, [onClose]);

    useEffect(() => {
        if (!panelRef.current || !backdropRef.current) return;
        gsap.set([backdropRef.current, panelRef.current], { autoAlpha: 0 });
        gsap.to(backdropRef.current, { autoAlpha: 1, duration: 0.4 });
        gsap.fromTo(
            panelRef.current,
            { autoAlpha: 0, scale: 0.95, y: -10 },
            { autoAlpha: 1, scale: 1, y: 0, duration: 0.4, ease: 'expo.out', transformOrigin: 'top right' }
        );
    }, []);

    const handleNavClick = (page: 'dashboard' | 'howToUse' | 'support' | 'pricing' | 'subscription') => {
        handleClose();
        setTimeout(() => onNavigate(page), 300);
    };

    const handleLogoutClick = () => {
        handleClose();
        setTimeout(onLogout, 300);
    }

    return (
        <div className="fixed inset-0 z-[100] lg:hidden">
            <div ref={backdropRef} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>
            <div
                ref={panelRef}
                className="absolute top-4 right-4 w-[calc(100%-2rem)] max-w-[300px] bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b border-border/30 bg-muted/5">
                    <span className="font-bold text-foreground tracking-wide">Menu</span>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-full hover:bg-muted transition-colors"
                    >
                        <XIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <nav className="flex flex-col p-2 gap-1">
                    <button onClick={() => handleNavClick('dashboard')} className="flex items-center gap-3 w-full text-left p-3 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors group">
                        <ChartPieIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        Dashboard
                    </button>
                    <button onClick={() => handleNavClick('subscription')} className="flex items-center gap-3 w-full text-left p-3 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors group">
                        <CheckBadgeIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        My Plan
                    </button>
                    <button onClick={() => handleNavClick('pricing')} className="flex items-center gap-3 w-full text-left p-3 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors group">
                        <CreditCardIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        Pricing
                    </button>
                    <button onClick={() => handleNavClick('howToUse')} className="flex items-center gap-3 w-full text-left p-3 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors group">
                        <BookOpenIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        How to use
                    </button>
                    <button onClick={() => handleNavClick('support')} className="flex items-center gap-3 w-full text-left p-3 text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary rounded-xl transition-colors group">
                        <QuestionMarkCircleIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        Support
                    </button>
                </nav>

                <div className="px-4 py-3">
                    <div className="bg-muted/20 rounded-xl p-3 border border-border/30">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1.5 font-semibold">
                                <ShieldCheckIcon className="h-3.5 w-3.5 text-primary" />
                                Support Usage
                            </span>
                            <span className={cn("font-mono", weeklySupportLimit !== 'Unlimited' && supportRequestCount >= weeklySupportLimit ? "text-red-400 font-bold" : "text-foreground")}>
                                {supportRequestCount} / {weeklySupportLimit === 'Unlimited' ? '∞' : weeklySupportLimit}
                            </span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-500", weeklySupportLimit !== 'Unlimited' && supportRequestCount >= weeklySupportLimit ? "bg-red-500" : "bg-primary")}
                                style={{ width: `${weeklySupportLimit === 'Unlimited' ? 100 : Math.min(100, (supportRequestCount / weeklySupportLimit) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border/30 p-3 flex items-center gap-3 bg-muted/10">
                    <div className="flex-grow flex justify-start">
                        <ThemeToggle />
                    </div>
                    <button onClick={handleLogoutClick} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all text-xs font-bold uppercase tracking-wide shadow-sm">
                        <LogOutIcon className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

interface HeaderProps {
    onNavigateToDashboard: () => void;
    onNavigateToHowToUse: () => void;
    onNavigateToSupport: () => void;
    onNavigateToPricing: () => void;
    onNavigateToSubscription: () => void;
    onRequestChange: () => void;
    onLogout: () => void;
    onOpenUserDashboard: () => void;
    supportRequestCount: number;
    weeklySupportLimit: number | 'Unlimited';
    nextSupportTicketExpiresAt: Date | null;
    username?: string;
    userPlan?: PlanTier;
    notifications: Notification[];
    onMarkNotificationRead: (id: string) => void;
    onMarkAllNotificationsRead: () => void;
    showNotificationDropdown: boolean;
    setShowNotificationDropdown: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
    onNavigateToDashboard,
    onNavigateToHowToUse,
    onNavigateToSupport,
    onNavigateToPricing,
    onNavigateToSubscription,
    onLogout,
    onOpenUserDashboard,
    supportRequestCount,
    weeklySupportLimit,
    nextSupportTicketExpiresAt,
    username,
    userPlan,
    notifications,
    onMarkNotificationRead,
    onMarkAllNotificationsRead,
    showNotificationDropdown,
    setShowNotificationDropdown
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showFullNotifications, setShowFullNotifications] = useState(false);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleViewAll = () => {
        setShowNotificationDropdown(false);
        setShowFullNotifications(true);
    };

    const handleMobileNavigate = (page: 'dashboard' | 'howToUse' | 'support' | 'pricing' | 'subscription') => {
        if (page === 'dashboard') onNavigateToDashboard();
        if (page === 'howToUse') onNavigateToHowToUse();
        if (page === 'support') onNavigateToSupport();
        if (page === 'pricing') onNavigateToPricing();
        if (page === 'subscription') onNavigateToSubscription();
    };

    return (
        <>
            {isMobileMenuOpen && (
                <MobileNavMenu
                    onClose={() => setIsMobileMenuOpen(false)}
                    onNavigate={handleMobileNavigate}
                    onLogout={onLogout}
                    supportRequestCount={supportRequestCount}
                    weeklySupportLimit={weeklySupportLimit}
                />
            )}

            <header className="bg-card/90 backdrop-blur-xl border-b border-border/30 fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-sm">
                <div className="container mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
                    {/* Logo Section */}
                    <button onClick={onNavigateToDashboard} className="flex items-center gap-4 group z-10">
                        <div className="flex flex-col items-center">
                            <div className="bg-primary/5 border border-primary/20 h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-primary/5 duration-500">
                                <N8nLogo className="h-6 w-6 md:h-8 md:w-8 text-black dark:text-white" />
                            </div>
                            <span className="text-[8px] md:text-[9px] font-black text-primary/60 tracking-[0.2em] mt-1 uppercase">Nex-Devs</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg md:text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors leading-none">
                                N8N DASHBOARD
                            </h1>
                            <span className="text-[10px] md:text-xs text-muted-foreground font-medium tracking-wide">Automation Control Center</span>
                        </div>
                    </button>

                    {/* Desktop Navigation & Stats (Visible on LG+) */}
                    <div className="hidden lg:flex items-center gap-6">
                        <nav className="flex items-center gap-1 text-sm font-medium bg-black text-white p-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                            <button
                                onClick={onNavigateToSubscription}
                                className="text-white/70 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-2 hover:scale-105"
                            >
                                My Plan
                            </button>
                            <button
                                onClick={onNavigateToPricing}
                                className="text-white/70 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-2 hover:scale-105"
                            >
                                Pricing
                            </button>
                            <div className="h-4 w-px bg-white/20 mx-1"></div>
                            <button
                                onClick={onNavigateToHowToUse}
                                className="text-white/70 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-2 hover:scale-105"
                            >
                                How to use
                            </button>
                            <button
                                onClick={onNavigateToSupport}
                                className="text-white/70 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-2 hover:scale-105"
                            >
                                Support
                            </button>
                        </nav>

                        <div className="flex items-center gap-3 bg-card/50 px-3 py-1.5 rounded-full border border-border/30 shadow-sm">
                            <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-2">
                                <ShieldCheckIcon className="h-4 w-4 text-primary/70" />
                                <span>Support: <strong className="text-foreground">
                                    {supportRequestCount}/{weeklySupportLimit === 'Unlimited' ? '∞' : weeklySupportLimit}
                                </strong></span>
                            </div>
                            {nextSupportTicketExpiresAt && (
                                <>
                                    <div className="h-4 w-px bg-border/40"></div>
                                    <SupportTimer expiresAt={nextSupportTicketExpiresAt} plan={userPlan} />
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pl-3 border-l border-border/20 relative">
                            <ThemeToggle />

                            <div className="h-9 w-9 relative">
                                <button
                                    onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                                    className={cn(
                                        "h-full w-full rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 border",
                                        showNotificationDropdown
                                            ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]"
                                            : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                    title="Notifications"
                                >
                                    <BellIcon className="h-4.5 w-4.5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                <NotificationDropdown
                                    isOpen={showNotificationDropdown}
                                    notifications={notifications}
                                    onMarkRead={onMarkNotificationRead}
                                    onMarkAllRead={onMarkAllNotificationsRead}
                                    onClose={() => setShowNotificationDropdown(false)}
                                    onViewAll={handleViewAll}
                                />
                            </div>

                            <button
                                onClick={onOpenUserDashboard}
                                className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 flex items-center justify-center text-primary transition-all hover:scale-105 active:scale-95 overflow-hidden"
                                title="User Dashboard"
                            >
                                {username ? (
                                    <span className="text-[10px] font-bold uppercase select-none">{username.charAt(0)}</span>
                                ) : (
                                    <UserIcon className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Tablet/Mobile Controls (Visible < LG) */}
                    <div className="flex lg:hidden items-center gap-3">
                        {/* Clean, Organized Stats Pill */}
                        <CompactStats count={supportRequestCount} limit={weeklySupportLimit} expiresAt={nextSupportTicketExpiresAt} plan={userPlan} />

                        <div className="relative">
                            <button
                                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                                className={cn(
                                    "h-9 w-9 rounded-full flex items-center justify-center border",
                                    showNotificationDropdown
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "bg-muted/30 border-border/30 text-muted-foreground"
                                )}
                            >
                                <BellIcon className="h-4.5 w-4.5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-background">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            <NotificationDropdown
                                isOpen={showNotificationDropdown}
                                notifications={notifications}
                                onMarkRead={onMarkNotificationRead}
                                onMarkAllRead={onMarkAllNotificationsRead}
                                onClose={() => setShowNotificationDropdown(false)}
                                isMobile={true}
                                onViewAll={handleViewAll}
                            />
                        </div>

                        <button
                            onClick={onOpenUserDashboard}
                            className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary overflow-hidden"
                        >
                            {username ? (
                                <span className="text-xs font-bold uppercase select-none">{username.charAt(0)}</span>
                            ) : (
                                <UserIcon className="h-5 w-5" />
                            )}
                        </button>

                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 rounded-lg bg-card border border-border/40 text-foreground shadow-sm active:scale-95 transition-all hover:bg-muted/20"
                            aria-label="Open Menu"
                        >
                            <HamburgerIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Full Screen Notifications Dialog */}
            <Dialog open={showFullNotifications} onOpenChange={setShowFullNotifications}>
                <DialogContent className="max-w-2xl w-[95vw] h-[80vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-2xl">
                    <DialogHeader className="p-6 border-b border-border/30">
                        <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                            <BellIcon className="h-6 w-6 text-primary" />
                            Activity Logs
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-6">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-40 py-20">
                                <BellIcon className="h-16 w-16 mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all cursor-pointer group",
                                            !notification.is_read
                                                ? "bg-primary/5 border-primary/20 shadow-sm shadow-primary/5"
                                                : "bg-muted/5 border-border/20 hover:bg-muted/10"
                                        )}
                                        onClick={() => !notification.is_read && onMarkNotificationRead(notification.id)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-sm text-foreground">{notification.title}</h4>
                                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(notification.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {notification.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-4 border-t border-border/30 bg-muted/5 flex justify-between items-center px-8">
                        <span className="text-xs text-muted-foreground font-medium">
                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </span>
                        {notifications.length > 0 && (
                            <button
                                onClick={onMarkAllNotificationsRead}
                                className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Header;
