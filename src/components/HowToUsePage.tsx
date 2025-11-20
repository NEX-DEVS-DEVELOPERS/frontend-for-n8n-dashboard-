
import React from 'react';
import { BookOpenIcon, ShieldCheckIcon, WrenchScrewdriverIcon, CpuChipIcon, CodeBracketIcon, TerminalIcon } from './icons';
import WorkflowDiagram from './WorkflowDiagram';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui';

// A reusable component for a consistent section layout
const GuideSection: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
    <Card className="animate-fade-in border-border/40 bg-card/50 backdrop-blur-sm transition-colors duration-300">
        <CardHeader className="flex flex-col md:flex-row items-start gap-6 space-y-0 pb-6">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex-shrink-0 shadow-[0_0_20px_rgba(72,168,163,0.15)]">
                {icon}
            </div>
            <div>
                <CardTitle className="text-3xl text-foreground mb-2">{title}</CardTitle>
                <CardDescription className="text-lg leading-relaxed text-muted-foreground">{description}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="space-y-6 pl-4 md:pl-24 text-muted-foreground text-lg leading-relaxed">
            {children}
        </CardContent>
    </Card>
);

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-zinc-950 text-cyan-300 p-5 rounded-xl text-base font-mono overflow-x-auto border border-primary/10 shadow-inner">
        <code>{children}</code>
    </pre>
);

const HowToUsePage: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 pb-20">
        <header className="text-center space-y-4 animate-fade-in py-8">
            <div className="inline-flex justify-center items-center p-4 bg-primary/10 rounded-full mb-4 border border-primary/20">
                <BookOpenIcon className="h-14 w-14 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-wide text-foreground drop-shadow-lg">Dashboard Integration Guide</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Connect your n8n workflows for secure, real-time monitoring and execution.
            </p>
        </header>
        
        <GuideSection 
            icon={<CpuChipIcon className="h-10 w-10 text-primary"/>}
            title="Overview: A Robust Frontend for n8n"
            description="This dashboard provides a powerful, secure interface to manage and observe your n8n agentic workflows."
        >
            <p>
                Built on an enterprise-grade stack, this frontend acts as a secure control panel for your n8n backend. It initiates workflows via webhooks and listens for real-time progress using Server-Sent Events (SSE), providing immediate insight into every step of your automation. All communication is encrypted, and no sensitive workflow data is ever stored on the dashboard.
            </p>
        </GuideSection>

        <GuideSection 
            icon={<ShieldCheckIcon className="h-10 w-10 text-primary"/>}
            title="Step 1: Enforce Security with CORS"
            description="Your first step is to explicitly authorize this dashboard to communicate with your n8n instance."
        >
            <p>
                For your protection, web browsers enforce a Cross-Origin Resource Sharing (CORS) policy. You must add this dashboard's origin URL to your n8n instance's allowlist. This ensures that only authorized frontends can interact with your workflows.
            </p>
            <p>
                Add the following environment variable to your n8n setup (e.g., in `docker-compose.yml` or n8n Cloud settings) and restart the service:
            </p>
            <CodeBlock>
                N8N_CORS_ALLOWED_ORIGINS=https://aistudio.google.com
            </CodeBlock>
        </GuideSection>
        
        <GuideSection
            icon={<CodeBracketIcon className="h-10 w-10 text-primary"/>}
            title="Step 2: Core Workflow Configuration"
            description="The dashboard requires a specific two-node setup in n8n for real-time communication."
        >
             <h4 className="font-bold text-2xl text-foreground">Communication Architecture</h4>
            <p>The entire system is designed for a robust, one-way data flow from n8n to the dashboard, ensuring your backend logic remains secure and isolated.</p>
            <div className="my-6">
                <WorkflowDiagram />
            </div>
            
            <h4 className="font-bold text-2xl text-foreground pt-6">Webhook Node Setup (The Trigger)</h4>
            <p>
              Your workflow must begin with a <strong>Webhook</strong> node. This node acts as the entry point that the dashboard calls to start a workflow execution. It must be configured to respond *immediately* with the location of the log stream.
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Set the <strong>Respond</strong> option to "Immediately".</li>
                <li>In the <strong>Response Body</strong> field, use the following expression. This tells the dashboard which SSE stream to listen to for this specific workflow run.</li>
            </ul>
            <CodeBlock>
                {`{{ { "sseUrl": $json.env["N8N_SSE_URL_CALLBACK_"] + "?workflowId=" + $workflow.id } }}`}
            </CodeBlock>

            <h4 className="font-bold text-2xl text-foreground pt-6">Server-Sent Events Node (The Streamer)</h4>
             <p>
                Further down your workflow, add a <strong>Server-Sent Events (SSE)</strong> node. This node is responsible for sending log messages back to the dashboard. Configure it to emit events that the dashboard can parse, such as status updates, logs, or completion signals.
            </p>
            <p className="text-sm bg-muted/40 p-3 rounded-lg border border-border/40 text-foreground/80">
                Refer to the Welcome Guide (visible on first load or page refresh) for examples of how to format messages from your SSE node.
            </p>
        </GuideSection>

        <GuideSection 
            icon={<TerminalIcon className="h-10 w-10 text-primary"/>}
            title="Step 3: Add & Monitor Your Agent"
            description="With your n8n workflow configured, you can now securely add it to the dashboard."
        >
            <ol className="list-decimal list-inside space-y-3">
                <li>Navigate back to the main dashboard page.</li>
                <li>Click the <strong>"Add Agent"</strong> button to open the configuration modal.</li>
                <li>Provide a descriptive name and paste your n8n webhook URL.</li>
                <li>Click <strong>"Test"</strong>. This performs a crucial pre-flight check to confirm that the webhook is reachable and the CORS policy is correctly configured.</li>
                <li>Upon a successful test, the "Add Agent" button will become active. Click it to save your agent.</li>
                <li>You can now trigger your workflow manually from the "Managed Agents" panel or set a future execution time. All logs will appear in the terminal in real-time.</li>
            </ol>
        </GuideSection>

        <GuideSection
            icon={<WrenchScrewdriverIcon className="h-10 w-10 text-primary"/>}
            title="Security & Reliability"
            description="This platform is built with enterprise security and reliability as a top priority."
        >
             <ul className="list-disc list-inside space-y-3">
                <li>
                    <strong className="text-foreground">Secure by Design:</strong> The dashboard operates within a secure environment, adhering to principles aligned with standards like SOC 2 Type II to ensure data integrity and protection.
                </li>
                 <li>
                    <strong className="text-foreground">Robust n8n Backend:</strong> Your core logic is executed on your own powerful and flexible n8n instance, which you control completely.
                </li>
                <li>
                    <strong className="text-foreground">Encrypted Communication:</strong> All data in transit between this dashboard and your n8n instance is encrypted using industry-standard HTTPS.
                </li>
                 <li>
                    <strong className="text-foreground">Stateless Frontend:</strong> The dashboard is stateless. It does not store any of your sensitive workflow data, API keys, or execution logs. It is purely a real-time monitor and trigger mechanism.
                </li>
             </ul>
             <p className="pt-4 text-base">For any issues, please visit the <strong>Support</strong> page for FAQs and contact information.</p>
        </GuideSection>
    </div>
  );
};

export default HowToUsePage;
