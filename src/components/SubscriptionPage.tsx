
import React, { useMemo, useState } from 'react';
import { PlanTier, PlanFeatures } from '../types';
import { CreditCardIcon, CheckBadgeIcon, RocketIcon, StarIcon, ShieldCheckIcon, CheckCircleIcon, InformationCircleIcon, WrenchScrewdriverIcon, PencilSquareIcon, SparklesIcon, CalendarIcon, ActivityIcon, ClockIcon, TrendingUpIcon, DownloadIcon, LockClosedIcon, QuestionMarkCircleIcon } from './icons';
import { Card, CardContent, CardHeader, CardTitle, Button, cn } from './ui';
import RequestChangeModal from './RequestChangeModal';

interface SubscriptionPageProps {
    currentPlan: PlanTier;
    has247Addon: boolean;
    usageCount: number;
    usageLimit: number | 'Unlimited';
    onNavigateToPricing: () => void;
}

const getPlanDetails = (plan: PlanTier, hasAddon: boolean): PlanFeatures => {
    const base = {
        requestLimit: 10,
        healthCheck: false,
        securityAudit: false,
        freeFixesHours: 0,
        uptimeMonitoring: false,
        dedicatedEngineer: false,
        true247Support: false,
    };

    switch (plan) {
        case 'enterprise':
            return {
                id: 'enterprise',
                name: 'Enterprise',
                price: 99,
                priceString: '$99/mo',
                requestLimit: 'Unlimited',
                responseTimeBusiness: 'Under 15 minutes',
                responseTimeEvening: 'Under 1 hour',
                channels: ['Dashboard', 'Email', 'WhatsApp', 'Slack', 'Phone'],
                aiCapability: 'Full + Custom Training',
                priority: 'Highest',
                ...base,
                healthCheck: true,
                securityAudit: true,
                freeFixesHours: 15,
                uptimeMonitoring: true,
                dedicatedEngineer: true,
                true247Support: true,
            };
        case 'pro':
            return {
                id: 'pro',
                name: 'Pro',
                price: 29 + (hasAddon ? 10 : 0),
                priceString: hasAddon ? '$39/mo' : '$29/mo',
                requestLimit: 'Unlimited',
                responseTimeBusiness: 'Under 1 hour',
                responseTimeEvening: hasAddon ? 'Under 1 hour' : 'Under 4 hours',
                channels: ['Dashboard', 'Email', 'WhatsApp'],
                aiCapability: 'Full Power',
                priority: 'High',
                ...base,
                healthCheck: true,
                securityAudit: true,
                freeFixesHours: 3,
                uptimeMonitoring: true,
                true247Support: hasAddon,
            };
        default: // Free
            return {
                id: 'free',
                name: 'Free',
                price: 0,
                priceString: '$0/mo',
                requestLimit: 10,
                responseTimeBusiness: 'Up to 4 hours',
                responseTimeEvening: 'Next Business Day',
                channels: ['Dashboard Only'],
                aiCapability: 'Basic',
                priority: 'Normal',
                ...base,
            };
    }
};

// Dynamic Date Helpers
const getRenewalDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getLastHealthCheckTime = () => {
    const d = new Date();
    d.setHours(4, 0, 0, 0);
    // Format: Oct 22, 04:00 AM
    return d.toLocaleTimeString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const UsageCircular: React.FC<{ current: number; limit: number | 'Unlimited' }> = ({ current, limit }) => {
    const percentage = limit === 'Unlimited' ? 100 : Math.min(100, (current / (limit as number)) * 100);
    const radius = 34; // Slightly larger
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const isUnlimited = limit === 'Unlimited';
    const isApproachingLimit = !isUnlimited && percentage > 80;

    return (
        <div className="relative flex items-center justify-center w-28 h-28">
            <svg className="transform -rotate-90 w-28 h-28">
                <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-muted/20"
                />
                <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${isApproachingLimit ? 'text-red-500' : 'text-primary'}`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <span className="text-2xl font-bold tabular-nums leading-none text-foreground">{current}</span>
                <span className="text-[10px] text-muted-foreground uppercase mt-1 font-bold tracking-wide">{isUnlimited ? 'Unltd' : `of ${limit}`}</span>
            </div>
        </div>
    );
};

const InfoTooltip: React.FC<{ content: string }> = ({ content }) => (
    <div className="relative group ml-2 inline-flex items-center">
        <QuestionMarkCircleIcon className="h-4 w-4 text-muted-foreground/40 hover:text-primary transition-colors cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-[#1a1a1a] border border-white/10 text-white text-xs font-medium rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-90 group-hover:scale-100 text-center leading-relaxed backdrop-blur-xl z-[100]">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1a1a1a]"></div>
        </div>
    </div>
);

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ currentPlan, has247Addon, usageCount, usageLimit, onNavigateToPricing }) => {
    const [showRequestModal, setShowRequestModal] = useState(false);
    const details = useMemo(() => getPlanDetails(currentPlan, has247Addon), [currentPlan, has247Addon]);

    const isFree = currentPlan === 'free';
    const renewalDate = getRenewalDate();
    const healthCheckTime = getLastHealthCheckTime();

    return (
        <>
            {showRequestModal && <RequestChangeModal onClose={() => setShowRequestModal(false)} userPlan={currentPlan} />}

            <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                            Client Dashboard <span className="text-[10px] font-normal text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded-full border border-border/40">v2.5</span>
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">Overview of your subscription, usage, and system health.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onNavigateToPricing} className="h-8 text-xs border-primary/20 hover:bg-primary/5 text-primary">
                            {isFree ? 'Upgrade Plan' : 'Manage Plan'}
                        </Button>
                        <Button onClick={() => setShowRequestModal(true)} className="h-8 text-xs bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                            <WrenchScrewdriverIcon className="h-3 w-3 mr-1.5" />
                            Request Change
                        </Button>
                    </div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* 1. Plan Identity Card - Polished Black Box */}
                    <Card className={cn("relative border-2 shadow-xl flex flex-col justify-between h-full bg-[#020202]",
                        currentPlan === 'enterprise' ? "border-purple-500 shadow-purple-900/20" :
                            currentPlan === 'pro' ? "border-primary shadow-primary/20" :
                                "border-border shadow-none bg-card"
                    )}>
                        {/* Inner container for clipping background effects, allowing tooltips to overflow parent */}
                        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                            {currentPlan !== 'free' && (
                                <div className={cn("absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] opacity-20",
                                    currentPlan === 'enterprise' ? "bg-purple-600" : "bg-primary"
                                )}></div>
                            )}
                        </div>

                        <CardContent className="p-5 pt-5 relative z-10 h-full flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                    <CreditCardIcon className={cn("h-6 w-6",
                                        currentPlan === 'enterprise' ? "text-purple-400" :
                                            currentPlan === 'pro' ? "text-primary" : "text-muted-foreground"
                                    )} />
                                </div>
                                <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm",
                                    currentPlan === 'enterprise' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                        currentPlan === 'pro' ? "bg-primary/10 text-primary border-primary/20" :
                                            "bg-muted/10 text-muted-foreground border-border/20"
                                )}>
                                    {currentPlan === 'free' ? 'Basic Tier' : 'Active'}
                                </span>
                            </div>
                            <div className="mt-auto">
                                <div className="flex items-center mb-1">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current Plan</p>
                                    <InfoTooltip content="Your active subscription tier, pricing, and next renewal date." />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">{details.name}</h2>
                                <div className="flex items-baseline gap-1.5">
                                    <p className="text-lg text-white/90 font-medium">{details.priceString}</p>
                                    {!isFree && <span className="text-[10px] text-muted-foreground">billed monthly</span>}
                                </div>
                                {!isFree && (
                                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <ClockIcon className="h-3 w-3" />
                                        <span>Renews on <span className="text-white font-medium">{renewalDate}</span></span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Usage Statistics */}
                    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2 border-b border-border/10">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                                <ActivityIcon className="h-3.5 w-3.5 mr-1.5" /> Support Usage
                                <InfoTooltip content="Tracks your weekly support requests against your plan limit." />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 flex items-center justify-between h-[calc(100%-45px)]">
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-foreground">{usageCount} <span className="text-base text-muted-foreground font-normal">/ {usageLimit === 'Unlimited' ? '∞' : usageLimit}</span></p>
                                <p className="text-[10px] text-muted-foreground font-medium">Requests this week</p>
                                <div className="pt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                                    {usageLimit === 'Unlimited' ? 'Unlimited Access' : 'Standard Limit'}
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-3">
                                <UsageCircular current={usageCount} limit={usageLimit} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Development Credits */}
                    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-2 border-b border-border/10">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                                <PencilSquareIcon className="h-3.5 w-3.5 mr-1.5" /> Dev Credits
                                <InfoTooltip content="Hours available for minor website tweaks, adjustments, and fixes." />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 flex flex-col justify-center h-[calc(100%-45px)]">
                            {isFree ? (
                                <div className="text-center py-1">
                                    <div className="inline-flex p-3 rounded-full bg-muted/30 text-muted-foreground mb-3 border border-border/50">
                                        <LockClosedIcon className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-bold text-foreground">Credits Locked</p>
                                    <p className="text-xs text-muted-foreground mt-1">Upgrade to Pro for 3 free hours/mo</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-2xl font-bold text-purple-500">{details.freeFixesHours} <span className="text-sm text-foreground font-normal">hrs</span></span>
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Remaining</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full w-full bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase">
                                            <span>Used: 0h</span>
                                            <span>Total: {details.freeFixesHours}h</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">Use for minor tweaks, adjustments, & fixes.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 4. System Health & Features (Span 2 Columns) */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-border/40 bg-card/50 backdrop-blur-sm flex flex-col">
                            <CardHeader className="pb-3 bg-muted/5 border-b border-border/10">
                                <CardTitle className="text-sm font-bold flex items-center">
                                    <ShieldCheckIcon className="h-3.5 w-3.5 text-green-500 mr-2" /> System Status
                                    <InfoTooltip content="Real-time monitoring of your system's uptime, health checks, and security audits." />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-grow">
                                <div className="divide-y divide-border/10">
                                    <div className="flex justify-between items-center p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 rounded bg-green-500/10 text-green-500"><ActivityIcon className="h-3.5 w-3.5" /></div>
                                            <span className="text-xs font-medium">Uptime Monitor</span>
                                        </div>
                                        {details.uptimeMonitoring ? (
                                            <span className="text-[10px] font-bold text-green-400 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10 shadow-sm">99.99% Online</span>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground">Not Active</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 rounded bg-blue-500/10 text-blue-500"><CalendarIcon className="h-3.5 w-3.5" /></div>
                                            <span className="text-xs font-medium">Last Health Check</span>
                                        </div>
                                        {details.healthCheck ? (
                                            <span className="text-[10px] font-mono text-foreground font-medium">{healthCheckTime}</span>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground">--</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 rounded bg-purple-500/10 text-purple-500"><ShieldCheckIcon className="h-3.5 w-3.5" /></div>
                                            <span className="text-xs font-medium">Security Audit</span>
                                        </div>
                                        {details.securityAudit ? (
                                            <span className="text-[10px] font-bold text-green-400">Passed</span>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground">--</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/40 bg-card/50 backdrop-blur-sm flex flex-col">
                            <CardHeader className="pb-3 bg-muted/5 border-b border-border/10">
                                <CardTitle className="text-sm font-bold flex items-center">
                                    <StarIcon className="h-3.5 w-3.5 text-yellow-500 mr-2" /> Plan Capabilities
                                    <InfoTooltip content="Key features and SLA guarantees included in your current plan." />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-grow">
                                <div className="divide-y divide-border/10">
                                    <div className="p-3.5 flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">AI Assistant Level</span>
                                        <span className="text-xs font-semibold text-foreground">{details.aiCapability}</span>
                                    </div>
                                    <div className="p-3.5 flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">SLA Response Time</span>
                                        <span className="text-xs font-semibold text-foreground">{details.responseTimeBusiness}</span>
                                    </div>
                                    <div className="p-3.5 flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Priority Queue</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${details.priority === 'Highest' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                details.priority === 'High' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-muted text-muted-foreground border border-border/20'
                                            }`}>{details.priority}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 5. Add-ons & Extras (Col-span-1) - Centered Content */}
                    <Card className="border-border/40 bg-card/50 backdrop-blur-sm flex flex-col">
                        <CardHeader className="pb-3 bg-muted/5 border-b border-border/10">
                            <CardTitle className="text-sm font-bold flex items-center">
                                Extras
                                <InfoTooltip content="Active add-on services like 24/7 support or dedicated engineering." />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex flex-col items-center justify-center flex-grow gap-4">
                            {has247Addon || details.true247Support ? (
                                <div className="w-full p-4 rounded-xl bg-green-500/5 border border-green-500/20 flex flex-col items-center text-center gap-2 shadow-[0_0_15px_-5px_rgba(34,197,94,0.1)]">
                                    <div className="p-2 bg-green-500/10 rounded-full text-green-500 mb-0.5"><CheckBadgeIcon className="h-6 w-6" /></div>
                                    <div>
                                        <p className="font-bold text-green-400 text-base">24/7 Support Active</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Engineering team is on standby.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col items-center text-center gap-2">
                                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-400 mb-0.5"><ShieldCheckIcon className="h-6 w-6" /></div>
                                    <div>
                                        <p className="font-bold text-blue-400 text-base mb-0.5">24/7 Support Available</p>
                                        <p className="text-xs text-muted-foreground mb-3">Get peace of mind overnight.</p>
                                        <Button onClick={onNavigateToPricing} variant="outline" size="sm" className="w-full max-w-[120px] h-8 text-[10px] border-blue-500/30 hover:bg-blue-500/10 text-blue-300">View Add-on</Button>
                                    </div>
                                </div>
                            )}
                            <div className="w-full pt-4 border-t border-border/10 mt-auto">
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="text-muted-foreground">Next Billing Date</span>
                                    <span className="font-mono text-foreground">{isFree ? '--' : renewalDate}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Billing History Table */}
                <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/10">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            Invoice History
                            <InfoTooltip content="A record of your past payments and downloadable invoices." />
                        </CardTitle>
                        {!isFree && <Button variant="ghost" size="sm" className="text-xs h-8"><DownloadIcon className="h-3.5 w-3.5 mr-2" /> Export CSV</Button>}
                    </CardHeader>
                    <CardContent className="p-0">
                        {isFree ? (
                            <div className="py-16 text-center">
                                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/30">
                                    <InformationCircleIcon className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-foreground font-semibold text-lg">No Billing History</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Upgrade to a paid plan to see your invoices and payment history here.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/10">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Invoice ID</th>
                                            <th className="px-6 py-4 font-medium">Date</th>
                                            <th className="px-6 py-4 font-medium">Amount</th>
                                            <th className="px-6 py-4 font-medium">Status</th>
                                            <th className="px-6 py-4 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10">
                                        <tr className="bg-card/20 hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4 font-mono text-foreground/80">#INV-2023-001</td>
                                            <td className="px-6 py-4 text-muted-foreground">Oct 01, 2023</td>
                                            <td className="px-6 py-4 font-medium text-foreground">{details.priceString}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm">
                                                    Paid
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-primary hover:underline text-xs font-medium font-mono">Download PDF</button>
                                            </td>
                                        </tr>
                                        <tr className="bg-card/20 hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4 font-mono text-foreground/80">#INV-2023-000</td>
                                            <td className="px-6 py-4 text-muted-foreground">Sep 01, 2023</td>
                                            <td className="px-6 py-4 font-medium text-foreground">{details.priceString}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm">
                                                    Paid
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-primary hover:underline text-xs font-medium font-mono">Download PDF</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default SubscriptionPage;
