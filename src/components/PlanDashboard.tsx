import React, { useMemo, useState, useEffect } from 'react';
import { PlanTier, PlanFeatures } from '../types';
import { CreditCardIcon, CheckBadgeIcon, RocketIcon, StarIcon, ShieldCheckIcon, CheckCircleIcon, InformationCircleIcon, WrenchScrewdriverIcon, PencilSquareIcon, SparklesIcon, CalendarIcon, ActivityIcon, ClockIcon, TrendingUpIcon, DownloadIcon, LockClosedIcon, QuestionMarkCircleIcon, UserIcon, EnvelopeIcon, RefreshCwIcon, BellIcon, NewspaperIcon, EyeIcon, FileTextIcon, ChatBubbleLeftRightIcon } from './icons';
import { Card, CardContent, CardHeader, CardTitle, Button, cn } from './ui';
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
    // Format: Oct 22, 04:00 AM
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
                        body { 
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                            background-color: #050505; 
                            color: #e0e0e0; 
                            margin: 0; 
                            padding: 0; 
                            -webkit-print-color-adjust: exact; 
                        }
                        .invoice-container {
                            max-width: 800px;
                            margin: 0 auto;
                            background: #0a0a0a;
                            padding: 60px;
                            border: 1px solid #222;
                            box-shadow: 0 0 50px rgba(0,0,0,0.5);
                        }
                        .header { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: center; 
                            margin-bottom: 60px; 
                            border-bottom: 1px solid #333; 
                            padding-bottom: 30px; 
                        }
                        .logo { 
                            font-size: 24px; 
                            font-weight: 800; 
                            color: #fff; 
                            letter-spacing: -0.5px; 
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        .logo-icon {
                            color: #06b6d4; /* Cyan-500 */
                        }
                        .invoice-badge { 
                            background: rgba(6, 182, 212, 0.1); 
                            color: #06b6d4; 
                            padding: 8px 16px; 
                            border-radius: 6px; 
                            font-size: 14px; 
                            font-weight: 700; 
                            border: 1px solid rgba(6, 182, 212, 0.2);
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        .details-grid { 
                            display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            gap: 40px; 
                            margin-bottom: 60px; 
                        }
                        .label { 
                            font-size: 11px; 
                            text-transform: uppercase; 
                            color: #666; 
                            font-weight: 600; 
                            margin-bottom: 10px; 
                            letter-spacing: 0.5px;
                        }
                        .value { 
                            font-size: 16px; 
                            font-weight: 500; 
                            color: #fff;
                            line-height: 1.5;
                        }
                        .value.sub {
                            color: #888;
                            font-size: 14px;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-bottom: 40px; 
                        }
                        th { 
                            text-align: left; 
                            padding: 16px; 
                            background: #111; 
                            font-size: 11px; 
                            text-transform: uppercase; 
                            color: #888; 
                            font-weight: 600; 
                            border-bottom: 1px solid #333;
                        }
                        td { 
                            padding: 20px 16px; 
                            border-bottom: 1px solid #222; 
                            font-size: 14px; 
                            color: #ddd;
                        }
                        .amount-col {
                            text-align: right;
                            font-family: 'Courier New', monospace;
                            font-weight: 600;
                        }
                        .total-section { 
                            display: flex; 
                            justify-content: flex-end; 
                            margin-top: 40px; 
                        }
                        .total-box { 
                            background: #111; 
                            padding: 30px; 
                            border-radius: 12px; 
                            min-width: 300px; 
                            border: 1px solid #222;
                        }
                        .total-row { 
                            display: flex; 
                            justify-content: space-between; 
                            margin-bottom: 12px; 
                            font-size: 14px; 
                            color: #888;
                        }
                        .total-row.final { 
                            font-size: 24px; 
                            font-weight: 800; 
                            color: #06b6d4; 
                            border-top: 1px solid #333; 
                            padding-top: 20px; 
                            margin-top: 20px; 
                            margin-bottom: 0; 
                            align-items: center;
                        }
                        .footer { 
                            margin-top: 80px; 
                            text-align: center; 
                            color: #444; 
                            font-size: 12px; 
                            border-top: 1px solid #222; 
                            padding-top: 30px; 
                        }
                        .stamp {
                            position: fixed;
                            bottom: 100px;
                            right: 100px;
                            border: 3px solid #06b6d4;
                            color: #06b6d4;
                            padding: 10px 20px;
                            text-transform: uppercase;
                            font-weight: 900;
                            font-size: 20px;
                            transform: rotate(-15deg);
                            opacity: 0.3;
                            border-radius: 8px;
                            pointer-events: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                        <div class="stamp">NEX-DEVS VERIFIED</div>
                        
                        <div class="header">
                            <div class="logo">
                                <span class="logo-icon">⚡</span> N8N Agent Dashboard
                            </div>
                            <div class="invoice-badge">PAID</div>
                        </div>
                        
                        <div class="details-grid">
                            <div>
                                <div class="label">Billed To</div>
                                <div class="value">${username}</div>
                                <div class="value sub">${email || 'user@example.com'}</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="label">Invoice Details</div>
                                <div class="value">${invoice.invoiceNumber}</div>
                                <div class="value sub">${new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                        </div>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Billing Period</th>
                                    <th class="amount-col">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <strong style="color: #fff;">${invoice.planName} Plan Subscription</strong><br>
                                        <span style="color: #666; font-size: 12px;">Monthly recurring charge</span>
                                    </td>
                                    <td>
                                        ${new Date(invoice.billingStart).toLocaleDateString()} - ${new Date(invoice.billingEnd).toLocaleDateString()}
                                    </td>
                                    <td class="amount-col">$${invoice.amount}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="total-section">
                            <div class="total-box">
                                <div class="total-row">
                                    <span>Subtotal</span>
                                    <span>$${invoice.amount}</span>
                                </div>
                                <div class="total-row">
                                    <span>Tax (0%)</span>
                                    <span>$0.00</span>
                                </div>
                                <div class="total-row final">
                                    <span>Total</span>
                                    <span>$${invoice.amount}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>Thank you for your business! Questions? Contact support@n8n-dashboard.com</p>
                            <p>Generated on ${new Date().toLocaleString()}</p>
                            <p style="margin-top: 10px; font-weight: 600; color: #666;">POWERED BY NEX-DEVS</p>
                        </div>
                    </div>
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
        <>
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

            <div className="w-full max-w-[1400px] mx-auto space-y-8 pb-20 animate-fade-in px-6 md:px-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-foreground tracking-tight">Plan Dashboard</h1>
                            <span className={cn("px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm",
                                currentPlan === 'enterprise' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                    currentPlan === 'pro' ? "bg-primary/10 text-primary border-primary/20" :
                                        "bg-muted/10 text-muted-foreground border-border/20"
                            )}>
                                {currentPlan}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <span className="flex items-center gap-1.5">
                                Welcome back, <span className="text-foreground font-medium uppercase">{username}</span>
                            </span>
                            <span className="text-border/50">•</span>
                            <span className="flex items-center gap-1.5 text-muted-foreground/80">
                                {email || 'user@example.com'}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onNavigateToPricing} className="border-primary/20 hover:bg-primary/5 text-primary h-11 px-6">
                            Manage Plan
                        </Button>
                        <Button onClick={() => setShowRequestModal(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6">
                            <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                            Request Change
                        </Button>
                    </div>
                </div>

                {/* Main Grid Layout - 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* ROW 1: Active Plan (2 cols) + Dev Credits (1 col) */}

                    {/* 1. Active Plan Card - Compact & Premium */}
                    <Card className={cn("md:col-span-2 relative border-0 shadow-2xl flex flex-col justify-between overflow-hidden min-h-[280px] group",
                        currentPlan === 'enterprise' ? "bg-gradient-to-br from-[#1a0b2e] via-[#0d0d0d] to-[#000000]" :
                            currentPlan === 'pro' ? "bg-gradient-to-br from-[#051515] via-[#0d0d0d] to-[#000000]" :
                                "bg-card"
                    )}>
                        {/* Glass Overlay */}
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl z-0"></div>

                        {/* Decorative Blobs - Subtle */}
                        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                            <div className={cn("absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 transition-all duration-1000 group-hover:opacity-30",
                                currentPlan === 'enterprise' ? "bg-purple-600" : "bg-primary"
                            )}></div>
                        </div>

                        <CardContent className="p-10 relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md shadow-lg">
                                    <CreditCardIcon className={cn("h-6 w-6",
                                        currentPlan === 'enterprise' ? "text-purple-300" :
                                            currentPlan === 'pro' ? "text-primary" : "text-muted-foreground"
                                    )} />
                                </div>
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-500/30 bg-green-500/20 text-green-400 shadow-lg backdrop-blur-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                    Active
                                </span>
                            </div>

                            <div className="mt-6">
                                <p className="text-xs text-white/60 font-bold uppercase tracking-[0.2em] mb-2">Current Plan</p>
                                <div className="flex items-baseline gap-4 mb-6">
                                    <h2 className="text-5xl font-black tracking-tighter text-white drop-shadow-2xl">{details.name}</h2>
                                    <p className="text-3xl text-white/80 font-medium tracking-tight">{details.priceString}<span className="text-sm text-white/40 font-normal ml-1">/mo</span></p>
                                </div>

                                {!isFree && (
                                    <div className="pt-6 border-t border-white/10 flex items-center gap-6 text-sm text-white/70">
                                        <div className="flex items-center gap-2">
                                            <ClockIcon className="h-4 w-4 text-white/80" />
                                            <span>Renews <span className="text-white font-semibold">{renewalDate}</span></span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                                        <div className="flex items-center gap-2">
                                            <CheckBadgeIcon className="h-4 w-4 text-white/80" />
                                            <span>Auto-renewal active</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Dev Credits - Compact */}
                    <Card className="md:col-span-1 border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden shadow-lg flex flex-col">
                        <CardHeader className="pb-2 border-b border-border/10 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                                <PencilSquareIcon className="h-4 w-4 mr-2" /> Dev Credits
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={fetchDevCredits} disabled={isLoadingCredits}>
                                <RefreshCwIcon className={cn("h-3.5 w-3.5", isLoadingCredits && "animate-spin")} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 flex flex-col justify-center flex-grow">
                            {isFree ? (
                                <div className="text-center py-4">
                                    <LockClosedIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                                    <p className="text-base font-bold text-foreground">Credits Locked</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-end justify-between">
                                        <span className="text-5xl font-bold text-foreground tracking-tight">
                                            {devCredits ? (devCredits.total - devCredits.used) : details.freeFixesHours}
                                            <span className="text-lg text-muted-foreground font-normal ml-1">hrs</span>
                                        </span>
                                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 tracking-wider mb-1">
                                            AVAILABLE
                                        </span>
                                    </div>
                                    <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-1000"
                                            style={{ width: `${devCredits ? ((devCredits.total - devCredits.used) / devCredits.total) * 100 : 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Use credits for custom tweaks and fixes.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ROW 2: System Health, Support Hub, System Updates (1 col each) */}

                    {/* 3. System Health */}
                    <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
                        <CardHeader className="pb-4 bg-muted/5 border-b border-border/10">
                            <CardTitle className="text-base font-bold flex items-center">
                                <ShieldCheckIcon className="h-4 w-4 text-green-500 mr-2" /> System Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/10">
                                <div className="p-5 flex justify-between items-center hover:bg-muted/5 transition-colors">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Uptime</span>
                                    <span className="text-sm font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">99.99%</span>
                                </div>
                                <div className="p-5 flex justify-between items-center hover:bg-muted/5 transition-colors">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Check</span>
                                    <span className="text-sm font-bold text-foreground">{healthCheckTime}</span>
                                </div>
                                <div className="p-5 flex justify-between items-center hover:bg-muted/5 transition-colors">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Security</span>
                                    <span className="text-sm font-bold text-green-400">Passed</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Support Hub */}
                    <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
                        <CardHeader className="pb-4 bg-muted/5 border-b border-border/10">
                            <CardTitle className="text-base font-bold flex items-center">
                                <EnvelopeIcon className="h-4 w-4 mr-2" /> Support Hub
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Weekly Usage</span>
                                    <span className="font-bold text-foreground">{usageCount} / {usageLimit}</span>
                                </div>
                                <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(72,168,163,0.4)]"
                                        style={{ width: `${usageLimit === 'Unlimited' ? (usageCount > 0 ? 5 : 0) : Math.min(100, (usageCount / (usageLimit as number)) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <Button onClick={() => setShowSupportModal(true)} className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-10 font-bold">
                                Open New Ticket
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 5. System Updates */}
                    <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
                        <CardHeader className="pb-4 border-b border-border/10">
                            <CardTitle className="text-base font-bold flex items-center">
                                <NewspaperIcon className="h-4 w-4 mr-2" /> System Updates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {changelog.length > 0 ? (
                                <div className="divide-y divide-border/10">
                                    {changelog.map((entry) => (
                                        <div key={entry.id} className="p-4 hover:bg-muted/5 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-bold text-foreground">{entry.title}</h4>
                                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-white/5">{entry.version}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-muted-foreground text-xs">
                                    No recent updates.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ROW 3: Active Requests Tracker (Full Width) - NEW SECTION */}
                    <Card className="md:col-span-3 border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
                        <CardHeader className="pb-4 border-b border-border/10 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center">
                                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2 text-primary" /> Active Requests Tracker
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">Real-time Status</span>
                        </CardHeader>
                        <CardContent className="p-0">
                            {activeRequests.length > 0 ? (
                                <div className="divide-y divide-border/10">
                                    {activeRequests.map((req) => (
                                        <div key={req.id} className="p-5 flex items-start gap-4 hover:bg-muted/5 transition-colors group">
                                            <div className={cn("mt-1 p-2 rounded-lg border transition-colors",
                                                req.type === 'support' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                            )}>
                                                {req.type === 'support' ? <EnvelopeIcon className="h-4 w-4" /> : <WrenchScrewdriverIcon className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-sm font-bold text-foreground">{req.title}</h4>
                                                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border animate-pulse",
                                                        req.status === 'pending' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                            req.status === 'in_progress' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                                "bg-muted/10 text-muted-foreground border-border/20"
                                                    )}>
                                                        {req.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{req.description}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                                                    <span className="flex items-center gap-1">
                                                        <ClockIcon className="h-3 w-3" /> Submitted {new Date(req.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="uppercase text-[10px] font-bold opacity-70 border px-1 rounded">
                                                        {req.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center flex flex-col items-center justify-center text-muted-foreground">
                                    <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                        <CheckCircleIcon className="h-6 w-6 opacity-40 text-green-500" />
                                    </div>
                                    <p className="text-sm font-medium">All caught up!</p>
                                    <p className="text-xs opacity-60 mt-1">No active support tickets or change requests.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ROW 4: Recent Changes (Full Width) */}
                    <Card className="md:col-span-3 border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
                        <CardHeader className="pb-4 border-b border-border/10 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center">
                                <FileTextIcon className="h-4 w-4 mr-2 text-primary" /> Recent Website Changes
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">Last 30 days</span>
                        </CardHeader>
                        <CardContent className="p-0">
                            {devCreditLogs.length > 0 ? (
                                <div className="divide-y divide-border/10">
                                    {devCreditLogs.map((log) => (
                                        <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-muted/5 transition-colors group">
                                            <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                                <PencilSquareIcon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-sm font-bold text-foreground">{log.title}</h4>
                                                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                                                        log.status === 'completed' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                            log.status === 'in_progress' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                                "bg-muted/10 text-muted-foreground border-border/20"
                                                    )}>
                                                        {log.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{log.description}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                                                    <span className="flex items-center gap-1">
                                                        <ClockIcon className="h-3 w-3" /> {new Date(log.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <UserIcon className="h-3 w-3" /> {log.hoursUsed} hrs used
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center flex flex-col items-center justify-center text-muted-foreground">
                                    <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                        <FileTextIcon className="h-6 w-6 opacity-40" />
                                    </div>
                                    <p className="text-sm font-medium">No recent changes recorded.</p>
                                    <p className="text-xs opacity-60 mt-1">Changes made using Dev Credits will appear here.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ROW 5: Invoice History (Full Width) */}
                    <Card className="md:col-span-3 border-border/40 bg-card/50 backdrop-blur-sm shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/10">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                Invoice History
                            </CardTitle>
                            {!isFree && <Button variant="ghost" size="sm" className="text-xs h-8"><DownloadIcon className="h-3.5 w-3.5 mr-2" /> Export CSV</Button>}
                        </CardHeader>
                        <CardContent className="p-0">
                            {isFree && invoices.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/30">
                                        <InformationCircleIcon className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-foreground font-semibold text-lg">No Billing History</h3>
                                    <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Invoices will appear here once generated.</p>
                                </div>
                            ) : isFree ? (
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
                                            {invoices.map((invoice) => (
                                                <tr key={invoice.id} className="bg-card/20 hover:bg-muted/10 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-foreground/80">#{invoice.invoiceNumber}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 font-medium text-foreground">${invoice.amount}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm">
                                                            {invoice.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button
                                                                onClick={() => setSelectedInvoice(invoice)}
                                                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium flex items-center gap-1"
                                                            >
                                                                <EyeIcon className="h-3.5 w-3.5" /> Details
                                                            </button>
                                                            <button
                                                                onClick={() => downloadInvoice(invoice)}
                                                                className="text-primary hover:text-primary/80 transition-colors text-xs font-medium flex items-center gap-1"
                                                            >
                                                                <DownloadIcon className="h-3.5 w-3.5" /> Download
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default PlanDashboard;
