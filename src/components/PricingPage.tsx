
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { PlanTier, PricingPlan } from '../types';
import { CheckCircleIcon, XIcon, StarIcon, RocketIcon, ShieldCheckIcon, ClockIcon, GiftIcon, UserGroupIcon, BriefcaseIcon, SparklesIcon } from './icons';
import { Button, Card, CardContent, CardHeader, CardTitle } from './ui';

interface PricingPageProps {
    currentPlan: PlanTier;
    has247Addon: boolean;
    onSelectPlan: (plan: PlanTier) => void;
    onToggleAddon: () => void;
}

const plans: PricingPlan[] = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        description: 'Essential tools for testing and solo developers.',
        color: 'border-gray-500/30',
        features: [
            '10 Support Requests / Week',
            'Response: Up to 4 hours (Biz Hours)',
            'Response: Next business day (Evenings)',
            'Dashboard Support Channel Only',
            'Basic AI Assistant'
        ],
        notIncluded: [
            'Dedicated Engineer',
            'Weekly Health Checks',
            'Security Audits',
            'Free Minor Fixes',
            'Uptime Monitoring'
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29',
        description: 'Perfect for most clients and active workflows.',
        popular: true,
        color: 'border-primary/60 shadow-[0_0_30px_-10px_rgba(72,168,163,0.3)]',
        features: [
            'Unlimited Support Requests',
            'Response: Under 1 hour (Biz Hours)',
            'Response: Under 4 hours (Evenings)',
            'Dashboard + Email + WhatsApp',
            'Full Power AI Assistant (Can open tickets)',
            'Weekly Quick Health Check',
            'Monthly Security & Update Audit',
            '3 Hours Free Minor Fixes/Month',
            'High Priority Queue',
            'Uptime Monitoring + Auto-Restarts'
        ],
        notIncluded: [
            'Dedicated Engineer',
            '24/7/365 Coverage (Available as Add-on)',
            '15 min response time',
            'Detailed Screenshot Reports'
        ]
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '$99',
        description: 'Mission-critical support for zero downtime.',
        color: 'border-purple-500/60 shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)]',
        features: [
            'Everything in Pro +',
            'Unlimited Support Requests',
            'True 24/7/365 Support Included',
            'Dedicated Named Engineer',
            'Response: Under 15 minutes (Biz Hours)',
            'Response: Under 1 hour (Evenings/Weekends)',
            'All Channels + Slack/Phone/Direct WA',
            'AI Trained on your specific history',
            'Detailed Screenshot Reports',
            'Auto-fixes & Recommendations',
            '15 Hours Free Minor Fixes/Month',
            'Highest Priority - Instant Jump'
        ],
        notIncluded: []
    }
];

const PricingPage: React.FC<PricingPageProps> = ({ currentPlan, has247Addon, onSelectPlan, onToggleAddon }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const cards = containerRef.current.querySelectorAll('.pricing-card');
            const banner = containerRef.current.querySelector('.gift-banner');

            const tl = gsap.timeline({ defaults: { ease: 'back.out(1.2)' } });

            tl.fromTo(banner, { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.6 })
                .fromTo(cards,
                    { autoAlpha: 0, y: 30, scale: 0.95 },
                    { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15 },
                    "-=0.3"
                );
        }
    }, []);

    return (
        <div ref={containerRef} className="w-full max-w-7xl mx-auto pb-20 space-y-10">
            {/* Free Gifts Banner */}
            <div className="gift-banner bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                            <GiftIcon className="h-8 w-8 text-pink-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold text-foreground">Free Gifts With Every Paid Plan</h3>
                            <p className="text-sm text-muted-foreground">No contracts. Cancel anytime.</p>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-white/10 hidden md:block"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span>First month of <strong>Pro is FREE</strong> for new clients</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                            <span>Enterprise: First <strong>3 months of 24/7 + Engineer</strong> free</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center space-y-3 py-4 animate-fade-in">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Choose Your Power Level</h1>
                <p className="text-base text-muted-foreground max-w-xl mx-auto">
                    Scale your support as your automation needs grow.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {plans.map((plan) => {
                    const isCurrent = currentPlan === plan.id;
                    return (
                        <div key={plan.id} className={`pricing-card relative flex flex-col h-full ${plan.popular ? 'lg:-mt-4 lg:mb-4 z-10' : ''}`}>
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg z-20 border border-primary-foreground/20 flex items-center gap-1.5">
                                    <StarIcon className="h-3.5 w-3.5 fill-current" />
                                    Most Popular
                                </div>
                            )}

                            <Card className={`h-full flex flex-col relative overflow-hidden border-2 ${plan.color} ${plan.popular ? 'bg-card/90 backdrop-blur-xl' : 'bg-card/60'}`}>
                                {plan.id === 'enterprise' && (
                                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-purple-500/20 blur-3xl rounded-full pointer-events-none"></div>
                                )}

                                <CardHeader className="text-center pb-2 border-b border-border/10">
                                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                    <div className="mt-3 mb-1">
                                        <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                                        {plan.price !== '$0' && <span className="text-muted-foreground ml-1 text-sm">/ month</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground h-8 flex items-center justify-center px-4">{plan.description}</p>
                                </CardHeader>

                                <CardContent className="flex-grow pt-4 space-y-4">
                                    <ul className="space-y-2 text-sm">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <CheckCircleIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.id === 'enterprise' ? 'text-purple-400' : 'text-green-400'}`} />
                                                <span className="text-foreground/90 leading-snug text-xs">{feature}</span>
                                            </li>
                                        ))}
                                        {plan.notIncluded.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2.5 opacity-50">
                                                <XIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                                <span className="text-muted-foreground leading-snug decoration-slate-500/50 text-xs">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <div className="p-4 pt-0 mt-auto">
                                    <Button
                                        onClick={() => onSelectPlan(plan.id)}
                                        className={`w-full h-10 text-base font-semibold shadow-lg transition-all ${isCurrent
                                            ? 'bg-muted/20 text-muted-foreground cursor-default border border-border hover:bg-muted/20'
                                            : plan.id === 'enterprise'
                                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                                                : 'shadow-primary/20'
                                            }`}
                                        disabled={isCurrent}
                                        variant={isCurrent ? 'secondary' : 'default'}
                                    >
                                        {isCurrent ? 'Current Plan' : (plan.price === '$0' ? 'Downgrade' : 'Upgrade Now')}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>

            {/* Dedicated Engineer Section Wrapper with Increased Spacing */}
            <div className="mt-20">
                <div className="pricing-card grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card className="h-full bg-card/40 backdrop-blur-xl border-white/10 hover:border-purple-500/20 transition-colors duration-500 group">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
                                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-[0_0_25px_-5px_rgba(168,85,247,0.2)] group-hover:shadow-[0_0_35px_-5px_rgba(168,85,247,0.4)] transition-shadow duration-500">
                                        <BriefcaseIcon className="h-8 w-8 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-foreground tracking-tight">Dedicated Engineer</h3>
                                        <p className="text-muted-foreground text-base mt-1">The ultimate VIP experience for Enterprise clients.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="flex gap-4 items-start">
                                        <div className="mt-1 p-1.5 rounded-lg bg-purple-500/5 text-purple-400 border border-purple-500/10">
                                            <UserGroupIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm mb-0.5">Same Person Every Time</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">No repeating yourself. You get their direct personal WhatsApp & email.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="mt-1 p-1.5 rounded-lg bg-purple-500/5 text-purple-400 border border-purple-500/10">
                                            <RocketIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm mb-0.5">Deep System Knowledge</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">They already know your API keys, workflows, and business logic inside-out.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="mt-1 p-1.5 rounded-lg bg-purple-500/5 text-purple-400 border border-purple-500/10">
                                            <ClockIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm mb-0.5">Instant Fixes</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">Can fix most issues in minutes instead of hours. Will jump on a screen-share instantly.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="mt-1 p-1.5 rounded-lg bg-purple-500/5 text-purple-400 border border-purple-500/10">
                                            <SparklesIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm mb-0.5">Proactive Monitoring</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">They message YOU if something looks off before it breaks.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Add-on Section */}
                    <Card className="bg-card/40 backdrop-blur-xl border-white/10 hover:border-blue-500/20 lg:col-span-1 transition-colors duration-500 group">
                        <CardContent className="p-8 flex flex-col h-full justify-center">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)] group-hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)] transition-shadow duration-500">
                                    <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">24/7 Add-On</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                Need peace of mind overnight? Add full 24/7/365 coverage to your Pro plan. <br /><span className="text-xs opacity-70">(Included in Enterprise)</span>
                            </p>
                            <div className="mt-auto">
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-3xl font-bold text-foreground">+$10</span>
                                    <span className="text-muted-foreground font-medium text-sm">/mo</span>
                                </div>
                                {currentPlan === 'enterprise' ? (
                                    <div className="w-full py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm font-bold text-center flex items-center justify-center gap-2">
                                        <CheckCircleIcon className="h-4 w-4" />
                                        Included in Enterprise
                                    </div>
                                ) : currentPlan === 'free' ? (
                                    <div className="text-xs text-muted-foreground text-center py-2 bg-muted/10 rounded-lg border border-white/5">
                                        Upgrade to Pro to enable
                                    </div>
                                ) : (
                                    <Button
                                        onClick={onToggleAddon}
                                        className={`w-full h-10 text-base ${has247Addon ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 shadow-none' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}
                                        variant={has247Addon ? 'destructive' : 'default'}
                                    >
                                        {has247Addon ? 'Remove Add-On' : 'Add to Plan'}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
