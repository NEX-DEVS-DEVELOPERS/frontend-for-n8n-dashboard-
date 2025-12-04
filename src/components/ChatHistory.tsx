import React from 'react';
import { ChatMessage, PlanTier } from '../types';
import { ClockIcon, ChatBubbleIcon } from './icons';
import { cn } from './ui';

export interface ChatSession {
    id: string;
    timestamp: number;
    title: string;
    messages: ChatMessage[];
}

interface ChatHistoryProps {
    sessions: ChatSession[];
    onSelectSession: (session: ChatSession) => void;
    userPlan: PlanTier;
    onClose: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ sessions, onSelectSession, userPlan, onClose }) => {
    // Filter sessions based on plan
    const getFilteredSessions = () => {
        const now = Date.now();
        let maxHours = 0;
        let maxChats = 0;

        if (userPlan === 'enterprise') {
            maxHours = 5;
            maxChats = 20;
        } else if (userPlan === 'pro') {
            maxHours = 2; // "1-2 hours" -> let's go with 2
            maxChats = 5;
        } else {
            // Free plan - maybe very limited?
            // "only 3-5 chats only for pro version" implies free might have none or 1.
            // Let's assume free has 0 or 1 current session.
            // But if they have history, maybe show last 1?
            return [];
        }

        const timeLimit = now - (maxHours * 60 * 60 * 1000);

        return sessions
            .filter(s => s.timestamp > timeLimit)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, maxChats);
    };

    const filteredSessions = getFilteredSessions();

    return (
        <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border/10">
                <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Chat History</h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/20 transition-colors"
                >
                    Close
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                        <ClockIcon className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">No recent history available.</p>
                        {userPlan === 'free' && (
                            <p className="text-xs mt-2 opacity-70">Upgrade to Pro to save chat history.</p>
                        )}
                    </div>
                ) : (
                    filteredSessions.map(session => (
                        <button
                            key={session.id}
                            onClick={() => onSelectSession(session)}
                            className="w-full text-left p-3 rounded-lg hover:bg-muted/30 border border-transparent hover:border-border/20 transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1 p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                    <ChatBubbleIcon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {session.title || "New Chat"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {' • '}
                                        {session.messages.length} messages
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {userPlan === 'free' && (
                <div className="p-4 border-t border-border/10 bg-muted/5">
                    <div className="text-xs text-center text-muted-foreground">
                        <p>History is limited on Free plan.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHistory;
