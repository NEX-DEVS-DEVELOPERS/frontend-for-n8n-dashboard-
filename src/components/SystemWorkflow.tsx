
import React from 'react';
import { BookOpenIcon, ServerIcon, CloudIcon, MailIcon, ShieldCheckIcon, N8nLogo } from './icons';
import { Card, CardContent, CardHeader, CardTitle } from './ui';

const SystemWorkflow: React.FC = () => {

    const supportEmail = "nex-devs@gmail.com";
    const emailSubject = "n8n Dashboard Configuration Assistance";
    const emailBody = "Hello,\n\nI need help configuring my n8n instance to work with the dashboard. Please assist.\n\nThanks,";

    const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    const workflowItems = [
        {
            icon: <ServerIcon className="h-6 w-6 text-primary" />,
            title: "Layer 1: Dashboard UI",
            description: "Frontend Interface",
        },
        {
            icon: <N8nLogo className="h-6 w-6 text-primary" />,
            title: "Layer 2: n8n Engine",
            description: "Workflow Execution Backend",
        },
        {
            icon: <CloudIcon className="h-6 w-6 text-primary" />,
            title: "Layer 3: External APIs",
            description: "Third-party Services",
        }
    ];

    return (
        <Card className="dashboard-card-animation border-border/20 bg-card/60">
            <CardHeader className="flex-row items-center gap-3 pb-4 border-b border-border/10">
                <BookOpenIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">System Architecture</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4 pt-4">

                <div className="flex flex-col relative">
                    {/* Connecting Line Background */}
                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-primary/10 hidden md:block"></div>

                    {workflowItems.map((item, index) => (
                        <div key={index} className="relative z-10 flex items-center gap-3 mb-4 last:mb-0 group">
                            {/* Reduced shadow intensity from 0.15 to 0.08 and spread */}
                            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl border border-primary/30 bg-card shadow-[0_0_10px_rgba(72,168,163,0.08)] backdrop-blur-sm transition-transform group-hover:scale-110">
                                {React.cloneElement(item.icon as React.ReactElement, { className: "h-5 w-5 text-primary" })}
                            </div>
                            <div className="flex-grow p-2 rounded-lg border border-border/10 bg-muted/10 hover:bg-muted/20 transition-colors">
                                <h4 className="font-semibold text-foreground text-xs">{item.title}</h4>
                                <p className="text-muted-foreground text-[10px] mt-0.5">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="!mt-4 flex items-start gap-2 p-2.5 bg-primary/5 border border-primary/10 rounded-lg">
                    <ShieldCheckIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-primary text-[10px] uppercase tracking-wide">Secure Connection</h4>
                        <p className="text-muted-foreground text-[10px] mt-0.5">End-to-end encrypted event stream (SSE) for real-time monitoring.</p>
                    </div>
                </div>

                <div className="pt-1">
                    <a
                        href={mailtoLink}
                        className="flex items-center justify-center gap-2 w-full p-2 rounded-lg bg-muted/20 hover:bg-muted/30 border border-border/20 text-xs font-medium text-muted-foreground hover:text-foreground transition-all group"
                    >
                        <MailIcon className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                        Need Configuration Help?
                    </a>
                </div>
            </CardContent>
        </Card>
    );
};

export default SystemWorkflow;
