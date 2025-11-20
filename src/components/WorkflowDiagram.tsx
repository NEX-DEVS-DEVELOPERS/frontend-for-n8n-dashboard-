
import React from 'react';
import { ServerIcon, CodeBracketIcon, TerminalIcon } from './icons';

interface StepProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    isLast?: boolean;
}

const Step: React.FC<StepProps> = ({ icon, title, description, isLast = false }) => (
    <div className="flex">
        <div className="flex flex-col items-center mr-4">
            <div className="bg-primary/20 border border-border rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            {!isLast && <div className="w-px h-16 bg-border/50 border-dashed border-l-2" />}
        </div>
        <div className="pt-2">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-muted-foreground text-sm">{description}</p>
        </div>
    </div>
);

const WorkflowDiagram: React.FC = () => {
    return (
        <div className="p-4 bg-input rounded-lg border border-border">
            <div className="flex flex-col">
                <Step 
                    icon={<ServerIcon className="h-6 w-6 text-primary" />} 
                    title="1. Trigger Agent"
                    description="User clicks 'Trigger' in the dashboard UI."
                />
                <Step 
                    icon={<CodeBracketIcon className="h-6 w-6 text-primary" />} 
                    title="2. Webhook Request"
                    description="A POST request is sent to the n8n webhook URL."
                />
                 <Step 
                    icon={<CodeBracketIcon className="h-6 w-6 text-primary" />} 
                    title="3. Webhook Response"
                    description="n8n responds immediately with a JSON object: { sseUrl: '...' }."
                />
                <Step 
                    icon={<TerminalIcon className="h-6 w-6 text-primary" />} 
                    title="4. Connect to SSE Stream"
                    description="The dashboard connects to the provided sseUrl to listen for events."
                />
                <Step 
                    icon={<TerminalIcon className="h-6 w-6 text-primary" />} 
                    title="5. Receive Live Logs"
                    description="As the n8n workflow runs, it sends log data through the SSE connection, which appears in the terminal."
                    isLast
                />
            </div>
        </div>
    );
};

export default WorkflowDiagram;
