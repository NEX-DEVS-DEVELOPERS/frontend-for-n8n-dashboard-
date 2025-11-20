
import React, { useState, useEffect } from 'react';
import { Agent, AgentStatus, TerminalSession } from '../types';
import { ClockIcon, PlayIcon, PlusCircleIcon, StopIcon, TrashIcon, ChevronDownIcon } from './icons';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui';

interface AgentManagerProps {
    agents: Agent[];
    terminalSessions: TerminalSession[];
    onShowAddAgentModal: () => void;
    onDeleteAgent: (agentId: string) => void;
    onTriggerAgent: (agentId: string) => void;
    onStopAgent: (agentId: string) => void;
}

// Significantly reduced glow intensity for a cleaner, less fuzzy look
const statusConfig: Record<AgentStatus, { color: string; text: string; glow: string }> = {
    [AgentStatus.Idle]: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', text: 'Idle', glow: 'shadow-none' },
    [AgentStatus.Scheduled]: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', text: 'Scheduled', glow: 'shadow-[0_0_6px_rgba(59,130,246,0.15)]' },
    [AgentStatus.Running]: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse', text: 'Running', glow: 'shadow-[0_0_6px_rgba(234,179,8,0.15)]' },
    [AgentStatus.Completed]: { color: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'Completed', glow: 'shadow-[0_0_6px_rgba(34,197,94,0.15)]' },
    [AgentStatus.Error]: { color: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'Error', glow: 'shadow-[0_0_6px_rgba(239,68,68,0.15)]' },
    [AgentStatus.Cancelled]: { color: 'bg-gray-600/20 text-gray-400 border-gray-600/30', text: 'Cancelled', glow: 'shadow-none' },
};

const ITEMS_PER_PAGE = 4;

const AgentManager: React.FC<AgentManagerProps> = ({ agents, terminalSessions, onShowAddAgentModal, onDeleteAgent, onTriggerAgent, onStopAgent }) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(agents.length / ITEMS_PER_PAGE);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [agents.length, totalPages, currentPage]);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const displayedAgents = agents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    return (
        <Card className="dashboard-card-animation border-border/20 bg-card/60 h-full flex flex-col">
            <CardHeader className="relative flex items-center justify-center pb-4 border-b border-border/10 flex-shrink-0 min-h-[70px]">
                <div className="flex flex-col items-center text-center z-10">
                    <CardTitle className="text-lg">Managed Agents</CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Control your active workflows</p>
                </div>
                {agents.length > 0 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Button
                            size="sm"
                            onClick={onShowAddAgentModal}
                            className="shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all group h-8 text-xs px-3"
                        >
                            <PlusCircleIcon className="h-3 w-3 mr-1.5 group-hover:animate-pulse" />
                            Add Agent
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="pt-3 flex-grow flex flex-col min-h-[350px]">
                {agents.length > 0 ? (
                    <>
                        <div className="space-y-2 flex-grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted/50 scrollbar-track-transparent">
                            {displayedAgents.map(agent => {
                                const isThisAgentRunning = terminalSessions.some(s => s.agentId === agent.id && s.status === AgentStatus.Running);

                                let displayStatus = agent.status;
                                if (isThisAgentRunning) {
                                    displayStatus = AgentStatus.Running;
                                }

                                const status = statusConfig[displayStatus] || statusConfig.Idle;

                                return (
                                    <div key={agent.id} className="group p-3 bg-gradient-to-br from-muted/20 to-muted/5 border border-border/20 rounded-xl flex items-center justify-between gap-3 animate-fade-in hover:border-primary/20 hover:shadow-[0_0_15px_-5px_rgba(72,168,163,0.1)] transition-all duration-300">
                                        <div className="flex flex-col flex-grow overflow-hidden">
                                            <p className="font-semibold truncate text-foreground text-sm group-hover:text-primary transition-colors">{agent.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${status.color} ${status.glow}`}>
                                                    {status.text}
                                                </span>
                                            </div>
                                            {agent.schedule && new Date(agent.schedule) > new Date() && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1.5">
                                                    <ClockIcon className="h-2.5 w-2.5 text-blue-400" />
                                                    <span>{new Date(agent.schedule).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                            {isThisAgentRunning ? (
                                                <button
                                                    onClick={() => onStopAgent(agent.id)}
                                                    title="Stop Agent"
                                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <StopIcon className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onTriggerAgent(agent.id)}
                                                    title="Trigger Manually"
                                                    className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <PlayIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDeleteAgent(agent.id)}
                                                disabled={isThisAgentRunning}
                                                title="Delete Agent"
                                                className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/20 text-muted-foreground hover:text-red-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-3 mt-auto border-t border-border/10">
                                <span className="text-[10px] text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <div className="flex gap-1.5">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="h-7 w-7 p-0"
                                    >
                                        <ChevronDownIcon className="h-3 w-3 rotate-90" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="h-7 w-7 p-0"
                                    >
                                        <ChevronDownIcon className="h-3 w-3 -rotate-90" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-grow py-8 text-center border-2 border-dashed border-border/20 rounded-xl bg-muted/5 group hover:border-primary/20 hover:bg-muted/10 transition-all duration-300">
                        <div className="relative p-4 bg-card rounded-full mb-4 shadow-xl shadow-black/50 group-hover:scale-110 transition-transform duration-300">
                            {/* No blur effect, clean pulse on hover */}
                            <PlusCircleIcon className="relative z-10 h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:animate-pulse transition-all duration-300" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">No agents configured</h3>
                        <p className="text-xs text-muted-foreground max-w-[200px] mb-6 leading-relaxed">
                            Get started by adding your first n8n agent workflow to the dashboard.
                        </p>
                        <Button onClick={onShowAddAgentModal} size="default" className="shadow-lg shadow-primary/20 group h-9 text-sm">
                            <PlusCircleIcon className="h-4 w-4 mr-2 animate-pulse" />
                            Add First Agent
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AgentManager;
