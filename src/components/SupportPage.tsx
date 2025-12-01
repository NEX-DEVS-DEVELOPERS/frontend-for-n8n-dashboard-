
import React, { useState } from 'react';
import { MailIcon, QuestionMarkCircleIcon, ChevronDownIcon } from './icons';
import { Card, CardContent } from './ui';
import SupportFormModal from './SupportFormModal';

const FaqItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => (
    <details className="bg-card border border-border rounded-xl group overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-md shadow-sm">
        <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-muted/20 transition-colors">
            <h4 className="font-bold text-xl text-foreground">{question}</h4>
            <ChevronDownIcon className="h-6 w-6 text-muted-foreground group-open:rotate-180 transition-transform duration-300" />
        </summary>
        <div className="p-6 pt-4 text-muted-foreground text-lg leading-relaxed border-t border-border/60 bg-muted/5">
            {children}
        </div>
    </details>
);

interface SupportPageProps {
    onOpenChatbot: () => void;
    onAddSupportRequest: () => void;
    requestCount: number;
    requestLimit: number;
    nextSupportTicketExpiresAt: Date | null;
}

const SupportPage: React.FC<SupportPageProps> = ({ onOpenChatbot, onAddSupportRequest, requestCount, requestLimit, nextSupportTicketExpiresAt }) => {
    const [showSupportModal, setShowSupportModal] = useState(false);

    return (
        <>
            {showSupportModal && (
                <SupportFormModal
                    onClose={() => setShowSupportModal(false)}
                    onOpenChatbot={onOpenChatbot}
                    onAddSupportRequest={onAddSupportRequest}
                    requestCount={requestCount}
                    requestLimit={requestLimit}
                    nextSupportTicketExpiresAt={nextSupportTicketExpiresAt}
                />
            )}
            <div className="w-full max-w-4xl mx-auto animate-fade-in space-y-8 pb-12">
                <header className="text-center space-y-3 py-6">
                    <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-2 border border-primary/20 shadow-[0_0_20px_rgba(72,168,163,0.2)]">
                        <QuestionMarkCircleIcon className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-wide text-foreground drop-shadow-lg">Support & Assistance</h1>
                    <p className="text-base text-muted-foreground">
                        Get help with configuration and troubleshoot common issues.
                    </p>
                </header>

                <Card className="text-center border-border/60 bg-card shadow-lg">
                    <CardContent className="p-8 pt-8 space-y-4">
                        <h3 className="font-bold text-xl text-foreground">Contact Support</h3>
                        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                            If you can't find an answer in the FAQ, feel free to reach out to our support team for configuration assistance.
                        </p>
                        <button
                            onClick={() => setShowSupportModal(true)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-bold rounded-xl transition-all bg-primary hover:bg-n8n-dark text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                        >
                            <MailIcon className="h-5 w-5" />
                            Contact Support
                        </button>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h3 className="font-bold text-xl text-foreground text-center pb-2">Frequently Asked Questions</h3>
                    <FaqItem question="Why does the webhook 'Test' fail?">
                        <div className="space-y-2">
                            <p>A failed test connection is almost always due to one of these issues:</p>
                            <ul className="list-disc list-inside pl-4 space-y-1">
                                <li><strong className="text-foreground">Incorrect URL:</strong> Double-check that the webhook URL is copied correctly from your n8n workflow.</li>
                                <li><strong className="text-foreground">n8n Instance Not Running:</strong> Ensure your n8n instance is active and accessible from your browser.</li>
                                <li><strong className="text-foreground">CORS Policy:</strong> This is the most common issue. Make sure you have set the `N8N_CORS_ALLOWED_ORIGINS` environment variable correctly in your n8n configuration and have restarted the instance. Check the browser's developer console (F12) for specific CORS error messages.</li>
                            </ul>
                        </div>
                    </FaqItem>
                    <FaqItem question="Why don't I see any logs in the terminal after triggering an agent?">
                        <div className="space-y-2">
                            <p>If the agent triggers but no logs appear, it's likely an issue with the data stream.</p>
                            <ul className="list-disc list-inside pl-4 space-y-1">
                                <li><strong className="text-foreground">Webhook Response:</strong> Verify that your Webhook node is set to "Respond Immediately" and that the "Response Body" contains the correct expression to generate the `sseUrl`. An incorrect response means the dashboard doesn't know where to listen for logs.</li>
                                <li><strong className="text-foreground">Server-Sent Events (SSE) Node:</strong> Ensure you have an active SSE node in your workflow that is configured to receive events and stream them.</li>
                            </ul>
                        </div>
                    </FaqItem>
                    <FaqItem question="My agent status becomes 'Error' shortly after running. What's wrong?">
                        <p>
                            This indicates that an error occurred within your n8n workflow *after* it was successfully triggered. The dashboard's terminal should display the exact error message sent from your workflow. Use this message to debug the failing node within your n8n editor.
                        </p>
                    </FaqItem>
                    <FaqItem question="Does scheduling work if I close the browser tab?">
                        <p>
                            No. The scheduling mechanism is handled by the browser and is only active while the dashboard tab is open and running. For persistent, server-side scheduling, you should use n8n's built-in "Schedule" trigger node instead.
                        </p>
                    </FaqItem>
                </div>
            </div>
        </>
    );
};

export default SupportPage;
