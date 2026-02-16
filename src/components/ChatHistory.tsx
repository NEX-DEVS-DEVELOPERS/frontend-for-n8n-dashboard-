import React, { useEffect, useState, useRef } from 'react';
import { ChatMessage, PlanTier, MessageAuthor } from '../types';
import { ClockIcon, ChatBubbleIcon, TrashIcon, XIcon, SparklesIcon, BriefcaseIcon } from './icons';
import { getChatSessions, deleteChatSession, BackendSession } from '../services/chatbotApi';
import gsap from 'gsap';

export interface ChatSession {
    id: string;
    timestamp: number;
    title: string;
    messages: ChatMessage[];
    backendSessionId?: string;
}

interface ChatHistoryProps {
    sessions: ChatSession[];
    onSelectSession: (session: ChatSession) => void;
    userPlan: PlanTier;
    onClose: () => void;
    onDeleteSession?: (sessionId: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
    sessions,
    onSelectSession,
    userPlan,
    onClose,
    onDeleteSession
}) => {
    const [backendSessions, setBackendSessions] = useState<BackendSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Slide-up entrance animation
    useEffect(() => {
        if (containerRef.current && contentRef.current) {
            const tl = gsap.timeline();

            // Fade in backdrop
            tl.fromTo(containerRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.2, ease: 'power2.out' }
            );

            // Slide up content
            tl.fromTo(contentRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' },
                '-=0.1'
            );
        }
    }, []);

    // Animated close
    const handleClose = () => {
        if (containerRef.current && contentRef.current) {
            const tl = gsap.timeline({
                onComplete: onClose
            });

            tl.to(contentRef.current, {
                y: 20,
                opacity: 0,
                duration: 0.2,
                ease: 'power2.in'
            });

            tl.to(containerRef.current, {
                opacity: 0,
                duration: 0.15,
                ease: 'power2.in'
            }, '-=0.1');
        } else {
            onClose();
        }
    };

    useEffect(() => {
        const fetchSessions = async () => {
            if (userPlan === 'free') {
                setLoading(false);
                return;
            }

            try {
                const sessions = await getChatSessions();
                setBackendSessions(sessions);
            } catch (error) {
                console.error('Failed to fetch sessions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, [userPlan]);

    const getFilteredLocalSessions = () => {
        const now = Date.now();
        let maxHours = 0;
        let maxChats = 0;

        if (userPlan === 'enterprise') {
            maxHours = 168;
            maxChats = 20;
        } else if (userPlan === 'pro') {
            maxHours = 72;
            maxChats = 5;
        } else {
            return [];
        }

        const timeLimit = now - (maxHours * 60 * 60 * 1000);

        return sessions
            .filter(s => {
                const hasUserMessage = s.messages.some(m => m.author === MessageAuthor.User);
                return hasUserMessage && s.timestamp > timeLimit;
            })
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, maxChats);
    };

    const filteredSessions = getFilteredLocalSessions();

    const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setDeletingId(sessionId);

        try {
            await deleteChatSession(sessionId);
            setBackendSessions(prev => prev.filter(s => s.id !== sessionId));
            onDeleteSession?.(sessionId);
        } catch (error) {
            console.error('Failed to delete session:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const formatTimestamp = (timestamp: number | string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center h-full py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                <ClockIcon className="h-7 w-7 text-gray-400 dark:text-white/20" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-white/60 mb-1">No Chat History</p>
            <p className="text-xs text-gray-400 dark:text-white/30 text-center max-w-[200px]">
                {userPlan === 'free'
                    ? 'Upgrade to Pro to save history'
                    : 'Start a conversation to see history here'
                }
            </p>
        </div>
    );

    const renderSessionItem = (session: ChatSession | BackendSession, isBackendSession: boolean = false) => {
        const id = session.id;
        const timestamp = isBackendSession
            ? new Date((session as BackendSession).updatedAt).getTime()
            : (session as ChatSession).timestamp;
        const title = session.title || 'Chat';
        const messageCount = isBackendSession
            ? (session as BackendSession).messageCount
            : (session as ChatSession).messages.length;
        const preview = isBackendSession
            ? (session as BackendSession).firstUserMessagePreview
            : (session as ChatSession).messages.find(m => m.author === MessageAuthor.User)?.text?.substring(0, 60);

        return (
            <button
                key={id}
                onClick={() => {
                    if (!isBackendSession) {
                        onSelectSession(session as ChatSession);
                    }
                }}
                className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all duration-200 group relative"
            >
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${userPlan === 'enterprise'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                        }`}>
                        <ChatBubbleIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                        <p className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">
                            {title}
                        </p>
                        {preview && (
                            <p className="text-xs text-gray-500 dark:text-white/40 truncate mt-1">
                                {preview}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] text-gray-400 dark:text-white/30">
                                {formatTimestamp(timestamp)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20"></span>
                            <span className="text-[11px] text-gray-400 dark:text-white/30">
                                {messageCount} messages
                            </span>
                        </div>
                    </div>
                </div>

                {/* Delete button */}
                <button
                    onClick={(e) => handleDelete(e, id)}
                    disabled={deletingId === id}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
                >
                    {deletingId === id ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <TrashIcon className="h-4 w-4" />
                    )}
                </button>
            </button>
        );
    };

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl"
        >
            <div ref={contentRef} className="flex flex-col h-full">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${userPlan === 'enterprise'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                            }`}>
                            <ClockIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Chat History</h3>
                            <p className="text-[11px] text-gray-500 dark:text-white/40 mt-0.5">
                                {userPlan === 'enterprise'
                                    ? 'Last 7 days • Up to 20 chats'
                                    : userPlan === 'pro'
                                        ? 'Last 3 days • Up to 5 chats'
                                        : 'Upgrade to access'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {userPlan !== 'free' && (
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${userPlan === 'enterprise'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                                }`}>
                                {userPlan === 'enterprise' ? 'Enterprise' : 'Pro'}
                            </span>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                        >
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
                    style={{
                        scrollBehavior: 'smooth',
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3">
                            <div className={`h-5 w-5 border-2 border-t-transparent rounded-full animate-spin ${userPlan === 'enterprise' ? 'border-purple-500' : 'border-cyan-500'
                                }`} />
                            <span className="text-xs text-gray-500 dark:text-white/40">Loading history...</span>
                        </div>
                    ) : filteredSessions.length === 0 && backendSessions.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <>
                            {filteredSessions.map(session => renderSessionItem(session, false))}
                            {backendSessions.map(session => renderSessionItem(session, true))}
                        </>
                    )}
                </div>

                {/* Footer for free users */}
                {userPlan === 'free' && (
                    <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-50 dark:bg-cyan-500/5">
                            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-500/10">
                                <SparklesIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-900 dark:text-white">Unlock Chat History</p>
                                <p className="text-[11px] text-gray-500 dark:text-white/40">Upgrade to Pro to save conversations</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHistory;
