
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
    UserIcon
} from './icons';
import ThemeToggle from './ThemeToggle';
import { cn } from './ui';

// --- Sub-Components ---

const SupportTimer: React.FC<{ expiresAt: Date; compact?: boolean }> = ({ expiresAt, compact }) => {
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
                Your assistant will assist you in under 2 hours.

                <div className={cn(
                    "absolute bottom-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-foreground/90",
                    compact ? "right-2" : "left-1/2 -translate-x-1/2"
                )}></div>
            </div>
        </div>
    );
};

const CompactStats: React.FC<{ count: number; limit: number | 'Unlimited'; expiresAt: Date | null }> = ({ count, limit, expiresAt }) => (
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
                <SupportTimer expiresAt={expiresAt} compact />
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
    nextSupportTicketExpiresAt
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

            <header className="bg-card/90 backdrop-blur-xl border-b border-border/30 sticky top-0 z-50 transition-all duration-300 shadow-sm">
                <div className="container mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
                    {/* Logo Section */}
                    <button onClick={onNavigateToDashboard} className="flex items-center gap-3 group z-10">
                        <div className="bg-primary/10 border border-primary/30 h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-lg shadow-primary/10">
                            <N8nLogo className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        </div>
                        <h1 className="text-lg md:text-xl font-bold text-foreground tracking-wide group-hover:text-primary transition-colors">
                            <span className="md:hidden">N8N Dashboard</span>
                            <span className="hidden md:inline">N8N Agent Dashboard</span>
                        </h1>
                    </button>

                    {/* Desktop Navigation & Stats (Visible on LG+) */}
                    <div className="hidden lg:flex items-center gap-4">
                        <nav className="flex items-center gap-1 text-sm font-medium bg-muted/10 p-1 rounded-xl border border-border/20">
                            <button
                                onClick={onNavigateToSubscription}
                                className="text-muted-foreground hover:text-foreground hover:bg-card px-3 py-1.5 rounded-lg transition-all duration-300 flex items-center gap-2 hover:scale-105"
                            >
                                My Plan
                            </button>
                            <button
                                onClick={onNavigateToPricing}
                                className="text-muted-foreground hover:text-foreground hover:bg-card px-3 py-1.5 rounded-lg transition-all duration-300 flex items-center gap-2 hover:scale-105"
                            >
                                Pricing
                            </button>
                            <div className="w-px h-4 bg-border/40 mx-1"></div>
                            <button
                                onClick={onNavigateToHowToUse}
                                className="text-muted-foreground hover:text-foreground hover:bg-card px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105"
                            >
                                How to use
                            </button>
                            <button
                                onClick={onNavigateToSupport}
                                className="text-muted-foreground hover:text-foreground hover:bg-card px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105"
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
                                    <SupportTimer expiresAt={nextSupportTicketExpiresAt} />
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pl-3 border-l border-border/20">
                            <ThemeToggle />

                            <button
                                onClick={onOpenUserDashboard}
                                className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 flex items-center justify-center text-primary transition-all hover:scale-105 active:scale-95"
                                title="User Dashboard"
                            >
                                <UserIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Tablet/Mobile Controls (Visible < LG) */}
                    <div className="flex lg:hidden items-center gap-3">
                        {/* Clean, Organized Stats Pill */}
                        <CompactStats count={supportRequestCount} limit={weeklySupportLimit} expiresAt={nextSupportTicketExpiresAt} />

                        <button
                            onClick={onOpenUserDashboard}
                            className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"
                        >
                            <UserIcon className="h-5 w-5" />
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
        </>
    );
};

export default Header;
