import React, { useMemo, useState, useEffect } from 'react';
import { PlanTier, PlanFeatures } from '../types';
import {
    CreditCardIcon,
    ClockIcon,
    ShieldCheckIcon,
    EnvelopeIcon,
    WrenchScrewdriverIcon,
    NewspaperIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    PencilSquareIcon,
    RefreshCwIcon,
    LockClosedIcon,
    FileTextIcon,
    QuestionMarkCircleIcon
} from './icons';
import { Card, CardContent, CardHeader, CardTitle, Button, cn } from './ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import RequestChangeModal from './RequestChangeModal';
import SupportFormModal from './SupportFormModal';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import { dashboardApi } from '../services/api';

interface PlanDashboardProps {
    currentPlan: PlanTier;
    has247Addon: boolean;
    usageCount: number;
    usageLimit: number | 'Unlimited';
    onNavigateToPricing: () => void;
    username: string;
    email?: string;
    onOpenChatbot?: () => void;
    onAddSupportRequest?: () => void;
    nextSupportTicketExpiresAt?: Date | null;
}

interface ActivityEntry {
    id: string;
    action: string;
    description: string;
    createdAt: string;
}

interface ChangelogEntry {
    id: string;
    title: string;
    description: string;
    version: string;
    createdAt: string;
}

interface DevCreditLog {
    id: string;
    title: string;
    description: string;
    hoursUsed: number;
    status: string;
    category: string;
    createdAt: string;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: string;
    currency: string;
    status: string;
    planName: string;
    billingStart: string;
    billingEnd: string;
    createdAt: string;
}

interface ActiveRequest {
    id: string;
    title: string;
    description: string;
    status: string;
    type: 'support' | 'change';
    createdAt: string;
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
                priceString: '$99.00',
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
                priceString: hasAddon ? '$39.00' : '$29.00',
                requestLimit: 'Unlimited',
                responseTimeBusiness: 'Under 40 minutes',
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
                priceString: '$0.00',
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
    return d.toLocaleTimeString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const PlanDashboard: React.FC<PlanDashboardProps> = ({
    currentPlan,
    has247Addon,
    usageCount,
    usageLimit,
    onNavigateToPricing,
    username,
    email,
    onOpenChatbot = () => { },
    onAddSupportRequest = () => { },
    nextSupportTicketExpiresAt = null
}) => {
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [devCredits, setDevCredits] = useState<{ used: number; total: number } | null>(null);
    const [devCreditLogs, setDevCreditLogs] = useState<DevCreditLog[]>([]);
    const [isLoadingCredits, setIsLoadingCredits] = useState(false);
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [activeRequests, setActiveRequests] = useState<ActiveRequest[]>([]);
    const [nextTicketAt, setNextTicketAt] = useState<Date | null>(nextSupportTicketExpiresAt);

    const details = useMemo(() => getPlanDetails(currentPlan, has247Addon), [currentPlan, has247Addon]);

    const isFree = currentPlan === 'free';
    const renewalDate = getRenewalDate();
    const healthCheckTime = getLastHealthCheckTime();

    const memberSince = useMemo(() => {
        if (invoices.length > 0) {
            const dates = invoices.map(inv => new Date(inv.createdAt).getTime());
            return new Date(Math.min(...dates)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [invoices]);

    const fetchDevCredits = async () => {
        setIsLoadingCredits(true);
        try {
            const response = await dashboardApi.getDevCredits();
            if (response.success && response.data) {
                if (response.data.summary) {
                    setDevCredits({
                        used: response.data.summary.usedHours,
                        total: response.data.summary.totalHours
                    });
                }
                if (response.data.logs) {
                    setDevCreditLogs(response.data.logs);
                }
            } else {
                setDevCredits({ used: 0, total: details.freeFixesHours });
            }
        } catch (error) {
            console.error("Failed to fetch dev credits", error);
            setDevCredits({ used: 0, total: details.freeFixesHours });
        } finally {
            setIsLoadingCredits(false);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const [activityRes, changelogRes, invoicesRes, requestsRes] = await Promise.all([
                dashboardApi.getActivity(5),
                dashboardApi.getChangelog(3),
                dashboardApi.getInvoices(),
                dashboardApi.getRequests()
            ]);

            if (activityRes.success && activityRes.data?.activity) {
                setActivities(activityRes.data.activity);
            }
            if (changelogRes.success && changelogRes.data?.entries) {
                setChangelog(changelogRes.data.entries);
            }
            if (invoicesRes.success && invoicesRes.data?.invoices) {
                setInvoices(invoicesRes.data.invoices);
            }
            if (requestsRes.success && requestsRes.data) {
                if (requestsRes.data.requests) {
                    setActiveRequests(requestsRes.data.requests);
                }
                if (requestsRes.data.nextTicketAt) {
                    setNextTicketAt(new Date(requestsRes.data.nextTicketAt));
                }
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        }
    };

    useEffect(() => {
        fetchDevCredits();
        fetchDashboardData();
    }, [currentPlan, details.freeFixesHours]);

    const downloadInvoice = (invoice: Invoice) => {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Invoice ${invoice.invoiceNumber}</title>
                    <style>
                        body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #111; }
                        h1 { font-size: 24px; margin-bottom: 20px; }
                        p { margin-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f4f4f4; }
                    </style>
                </head>
                <body>
                    <h1>Invoice ${invoice.invoiceNumber}</h1>
                    <p>Amount: $${invoice.amount}</p>
                    <p>Date: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                </body>
            </html>
        `;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <TooltipProvider>
            {showRequestModal && <RequestChangeModal onClose={() => setShowRequestModal(false)} userPlan={currentPlan} />}
            {showSupportModal && (
                <SupportFormModal
                    onClose={() => setShowSupportModal(false)}
                    onOpenChatbot={onOpenChatbot}
                    onAddSupportRequest={onAddSupportRequest}
                    requestCount={usageCount}
                    requestLimit={typeof usageLimit === 'number' ? usageLimit : 9999}
                    nextSupportTicketExpiresAt={nextTicketAt}
                />
            )}
            {selectedInvoice && (
                <InvoiceDetailsModal
                    invoice={{
                        id: selectedInvoice.invoiceNumber,
                        date: new Date(selectedInvoice.createdAt).toLocaleDateString(),
                        amount: `$${selectedInvoice.amount}`,
                        planName: selectedInvoice.planName,
                        status: selectedInvoice.status
                    }}
                    onClose={() => setSelectedInvoice(null)}
                    onDownload={() => downloadInvoice(selectedInvoice)}
                />
            )}

            <div className="w-full max-w-7xl mx-auto space-y-8 pb-20 px-6 py-8 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-border/40">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Plan</h1>
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border shadow-sm",
                                currentPlan === 'enterprise' ? "bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800" :
                                    currentPlan === 'pro' ? "bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800" :
                                        "bg-muted text-muted-foreground border-border"
                            )}>
                                {currentPlan}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            Manage your subscription, credits, and support requests.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={onNavigateToPricing} size="sm" className="h-9">
                            Manage Subscription
                        </Button>
                        <Button onClick={() => setShowRequestModal(true)} size="sm" className="h-9">
                            <WrenchScrewdriverIcon className="h-3.5 w-3.5 mr-2" />
                            Request Change
                        </Button>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* 1. Active Plan Details (Full Width) */}
                    <Card className="md:col-span-3 shadow-md border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <CreditCardIcon className="h-32 w-32 text-primary" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg font-semibold tracking-tight text-primary">Current Plan Details</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <QuestionMarkCircleIcon className="h-4 w-4 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Comprehensive overview of your active subscription and benefits.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-xs font-semibold uppercase tracking-wide">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Active
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Plan</p>
                                        <div className="flex items-baseline gap-2">
                                            <h2 className="text-4xl font-bold text-foreground tracking-tight">{details.name}</h2>
                                            <span className="text-xl text-muted-foreground font-medium">{details.priceString}<span className="text-sm font-normal">/mo</span></span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <ClockIcon className="h-4 w-4" />
                                            <span>Member since <span className="font-medium text-foreground">{memberSince}</span></span>
                                        </div>
                                        {!isFree && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <RefreshCwIcon className="h-4 w-4" />
                                                <span>Renews on <span className="font-medium text-foreground">{renewalDate}</span></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Features</p>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-center gap-2">
                                            <CheckCircleIcon className="h-4 w-4 text-primary" />
                                            <span>{details.aiCapability} AI Capabilities</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircleIcon className="h-4 w-4 text-primary" />
                                            <span>{details.requestLimit === 'Unlimited' ? 'Unlimited' : details.requestLimit} Requests/Week</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircleIcon className="h-4 w-4 text-primary" />
                                            <span>{details.priority} Priority Support</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-background/50 rounded-lg p-4 border border-border/40 flex flex-col justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Legal & Billing</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Your subscription is subject to our Terms of Service and Privacy Policy.
                                            Automatic renewal applies unless cancelled 24 hours before the renewal date.
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border/20 flex gap-4 text-xs font-medium text-primary cursor-pointer hover:underline">
                                        <span>Terms of Service</span>
                                        <span>Privacy Policy</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Row 2: Stats (Credits, Health, Support) */}

                    {/* Dev Credits */}
                    <Card className="shadow-sm border border-border/60 hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold tracking-tight">Dev Credits</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <QuestionMarkCircleIcon className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Development hours allocated for custom feature requests and fixes.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/60 hover:text-foreground" onClick={fetchDevCredits} disabled={isLoadingCredits}>
                                <RefreshCwIcon className={cn("h-3.5 w-3.5", isLoadingCredits && "animate-spin")} />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isFree ? (
                                <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
                                    <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                                        <LockClosedIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Credits Locked</p>
                                        <p className="text-xs text-muted-foreground mt-1">Upgrade to Pro for dev hours.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-4xl font-bold tracking-tight text-foreground">
                                            {devCredits ? (devCredits.total - devCredits.used) : details.freeFixesHours}
                                        </span>
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border px-2 py-0.5 rounded-full bg-secondary/50">Hours Available</span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                            <span>Used</span>
                                            <span>Total {devCredits ? devCredits.total : details.freeFixesHours}h</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/90 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${devCredits ? ((devCredits.total - devCredits.used) / devCredits.total) * 100 : 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* System Health */}
                    <Card className="shadow-sm border border-border/60 hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold tracking-tight">System Health</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <QuestionMarkCircleIcon className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Operational status and uptime metrics of your system.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <ShieldCheckIcon className="h-4 w-4 text-green-600 dark:text-green-500" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <span className="text-muted-foreground">Uptime</span>
                                    <span className="font-mono font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded text-xs">99.99%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <span className="text-muted-foreground">Last Check</span>
                                    <span className="font-medium text-foreground">{healthCheckTime}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <span className="text-muted-foreground">Security Status</span>
                                    <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                        <CheckCircleIcon className="h-3.5 w-3.5" /> Passed
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Support Hub */}
                    <Card className="shadow-sm border border-border/60 hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold tracking-tight">Support Hub</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <QuestionMarkCircleIcon className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Manage support tickets and monitor your weekly request usage.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <EnvelopeIcon className="h-4 w-4 text-muted-foreground/60" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">Weekly Usage</span>
                                        <span className="text-foreground font-bold font-mono">{usageCount} / {usageLimit}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-500",
                                                usageCount > 8 ? "bg-red-500" : "bg-blue-500"
                                            )}
                                            style={{ width: `${usageLimit === 'Unlimited' ? (usageCount > 0 ? 5 : 0) : Math.min(100, (usageCount / (usageLimit as number)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <Button onClick={() => setShowSupportModal(true)} className="w-full font-medium" size="sm" variant="secondary">
                                    Open New Ticket
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Row 3: Updates & Active Requests */}

                    {/* Updates */}
                    <Card className="shadow-sm border border-border/60 hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold tracking-tight">Updates</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <QuestionMarkCircleIcon className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Recent changelogs and system improvements.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <NewspaperIcon className="h-4 w-4 text-muted-foreground/60" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            {changelog.length > 0 ? (
                                <div className="space-y-4">
                                    {changelog.slice(0, 3).map((entry) => (
                                        <div key={entry.id} className="pb-3 border-b border-border/40 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-medium text-foreground line-clamp-1">{entry.title}</h4>
                                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">{entry.version}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{entry.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-xs text-muted-foreground">No recent system updates.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Requests Tracker (Span 2) */}
                    <Card className="md:col-span-2 shadow-sm border border-border/60 hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold tracking-tight">Active Requests</CardTitle>
                                <span className="bg-secondary text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">{activeRequests.length}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <QuestionMarkCircleIcon className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Track the status of your ongoing support and feature requests.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-muted-foreground/60" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            {activeRequests.length > 0 ? (
                                <div className="rounded-lg border border-border/40 overflow-hidden">
                                    <div className="grid grid-cols-12 bg-muted/40 p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40">
                                        <div className="col-span-12 md:col-span-6">Request Details</div>
                                        <div className="col-span-6 md:col-span-2 hidden md:block">Type</div>
                                        <div className="col-span-6 md:col-span-2 hidden md:block">Status</div>
                                        <div className="col-span-6 md:col-span-2 hidden md:block text-right">Submitted</div>
                                    </div>
                                    <div className="divide-y divide-border/20 bg-card/50">
                                        {activeRequests.map((req) => (
                                            <div key={req.id} className="grid grid-cols-12 p-4 items-center gap-4 hover:bg-muted/5 transition-colors">
                                                <div className="col-span-12 md:col-span-6 flex gap-3">
                                                    <div className={cn("mt-0.5 h-8 w-8 rounded-md flex items-center justify-center border shrink-0",
                                                        req.type === 'support' ? "bg-blue-500/5 border-blue-200 text-blue-600 dark:border-blue-900" : "bg-purple-500/5 border-purple-200 text-purple-600 dark:border-purple-900"
                                                    )}>
                                                        {req.type === 'support' ? <EnvelopeIcon className="h-4 w-4" /> : <WrenchScrewdriverIcon className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-foreground">{req.title}</h4>
                                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{req.description}</p>

                                                        {/* Mobile only details */}
                                                        <div className="flex md:hidden items-center gap-2 mt-2">
                                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium uppercase",
                                                                req.status === 'pending' ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                                                            )}>{req.status.replace('_', ' ')}</span>
                                                            <span className="text-[10px] text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 hidden md:block">
                                                    <span className="text-[11px] font-medium text-muted-foreground border border-border/60 px-2 py-0.5 rounded capitalize">
                                                        {req.type}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 hidden md:block">
                                                    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide",
                                                        req.status === 'pending' ? "text-yellow-600 dark:text-yellow-500" :
                                                            req.status === 'in_progress' ? "text-blue-600 dark:text-blue-500" :
                                                                "text-gray-500"
                                                    )}>
                                                        <span className={cn("h-1.5 w-1.5 rounded-full",
                                                            req.status === 'pending' ? "bg-yellow-500" :
                                                                req.status === 'in_progress' ? "bg-blue-500" :
                                                                    "bg-gray-500"
                                                        )}></span>
                                                        {req.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 hidden md:block text-right text-xs text-muted-foreground font-mono">
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-border/60 bg-muted/10">
                                    <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                        <CheckCircleIcon className="h-6 w-6 text-muted-foreground/40" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">No active requests</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">You're all caught up! Use the "Request Change" button to start a new task.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 7. Change History (Full Width) */}
                    <Card className="md:col-span-3 shadow-sm border border-border/60 hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold tracking-tight">Recent Changes & Credits</CardTitle>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <QuestionMarkCircleIcon className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Log of your credit usage and completed work history.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <FileTextIcon className="h-4 w-4 text-muted-foreground/60" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                {devCreditLogs.length > 0 ? (
                                    devCreditLogs.map((log) => (
                                        <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-muted/5 transition-colors gap-4">
                                            <div className="flex gap-4">
                                                <div className="mt-1 h-8 w-8 rounded-md bg-secondary/50 flex items-center justify-center shrink-0">
                                                    <PencilSquareIcon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-foreground">{log.title}</h4>
                                                    <p className="text-xs text-muted-foreground mb-1 mt-0.5">{log.description}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 uppercase tracking-wide">{log.category}</span>
                                                        <span className="text-[10px] text-muted-foreground">•</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-6 pl-12 md:pl-0">
                                                <div className="text-right">
                                                    <span className="block text-sm font-bold text-foreground">-{log.hoursUsed} hrs</span>
                                                    <span className="text-[10px] text-muted-foreground">Debited</span>
                                                </div>
                                                <span className={cn("text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded-full border",
                                                    log.status === 'completed' ? "bg-green-500/5 text-green-600 border-green-200 dark:border-green-900" :
                                                        "bg-muted text-muted-foreground border-border"
                                                )}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 rounded-lg border border-dashed border-border/60 bg-muted/10">
                                        <p className="text-sm text-muted-foreground">No recent history available.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </TooltipProvider>
    );
};

export default PlanDashboard;
