
import React, { useMemo } from 'react';
import { Agent, AgentStatus } from '../types';
import { ChartPieIcon, CheckCircleIcon, ExclamationCircleIcon, PlayCircleIcon, ClockIcon, InformationCircleIcon, StopIcon } from './icons';
import { Card, CardContent, CardHeader, CardTitle } from './ui';

interface DashboardStatsProps {
    agents: Agent[];
}

// Reduced shadow opacity from 0.3 to 0.15 and blur radius for a sharper look
const statusIcons: Record<AgentStatus, { icon: React.ReactNode, label: string, text: string, glow: string }> = {
    [AgentStatus.Running]: { 
        icon: <PlayCircleIcon className="h-6 w-6 text-yellow-400" />, 
        label: 'Running', 
        text: 'text-yellow-400',
        glow: 'shadow-[0_0_10px_-4px_rgba(234,179,8,0.2)]'
    },
    [AgentStatus.Scheduled]: { 
        icon: <ClockIcon className="h-6 w-6 text-blue-400" />, 
        label: 'Scheduled', 
        text: 'text-blue-400',
        glow: 'shadow-[0_0_10px_-4px_rgba(59,130,246,0.2)]'
    },
    [AgentStatus.Completed]: { 
        icon: <CheckCircleIcon className="h-6 w-6 text-green-400" />, 
        label: 'Completed', 
        text: 'text-green-400',
        glow: 'shadow-[0_0_10px_-4px_rgba(34,197,94,0.2)]'
    },
    [AgentStatus.Error]: { 
        icon: <ExclamationCircleIcon className="h-6 w-6 text-red-400" />, 
        label: 'Error', 
        text: 'text-red-400',
        glow: 'shadow-[0_0_10px_-4px_rgba(239,68,68,0.2)]'
    },
    [AgentStatus.Idle]: { 
        icon: <InformationCircleIcon className="h-6 w-6 text-gray-400" />, 
        label: 'Idle', 
        text: 'text-gray-400',
        glow: 'shadow-none'
    },
    [AgentStatus.Cancelled]: { 
        icon: <StopIcon className="h-6 w-6 text-gray-500" />, 
        label: 'Cancelled', 
        text: 'text-gray-500',
        glow: 'shadow-none'
    },
};


const DashboardStats: React.FC<DashboardStatsProps> = ({ agents }) => {
    const stats = useMemo(() => {
        const counts = agents.reduce((acc, agent) => {
            acc[agent.status] = (acc[agent.status] || 0) + 1;
            return acc;
        }, {} as Record<AgentStatus, number>);
        
        return {
            total: agents.length,
            ...counts,
        };
    }, [agents]);

    return (
        <Card className="dashboard-card-animation border-border/20 bg-card/60">
            <CardHeader className="flex-row items-center gap-3 pb-6 border-b border-border/10">
                <div className="p-2 rounded-lg bg-muted/20 border border-border/20">
                    <ChartPieIcon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Dashboard Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="col-span-2 md:col-span-4 lg:col-span-1 flex flex-col items-center justify-center p-5 bg-card/60 rounded-xl border border-primary/50 shadow-[0_0_10px_-4px_rgba(72,168,163,0.2)] transition-transform hover:scale-105">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Total Agents</p>
                        <p className="font-bold text-4xl text-foreground">{stats.total}</p>
                    </div>
                     {Object.entries(statusIcons).map(([status, {icon, label, text, glow}]) => (
                        <div key={status} className={`flex flex-col items-center justify-center p-4 bg-card/60 rounded-xl border border-primary/50 ${glow} transition-all hover:scale-105 hover:bg-muted/20`}>
                            {icon}
                            <p className={`mt-3 text-2xl font-bold ${text}`}>{stats[status as AgentStatus] || 0}</p>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60 mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default DashboardStats;
