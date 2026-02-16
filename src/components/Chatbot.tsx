import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Agent, ChatMessage, MessageAuthor, LogEntry, PlanTier } from '../types';
import { ArrowUpIcon, ChatBubbleIcon, QuestionMarkCircleIcon, WrenchScrewdriverIcon, XIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, RefreshCwIcon, SparklesIcon, BriefcaseIcon, ClockIcon, StopIcon } from './icons';
import { Card, CardContent, CardFooter } from './ui';
import { sendMessageToBackend, getChatbotConfig, createChatSession } from '../services/chatbotApi';
import ChatHistory, { ChatSession } from './ChatHistory';
import { v4 as uuidv4 } from 'uuid';
import gsap from 'gsap';

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const cleanedText = text
        .replace(/^##\s+/gm, '')
        .replace(/(\*\*|__)(.*?)\1/g, '$2');

    const html = cleanedText
        .replace(/```([\s\S]*?)```/g, (_, p1) => `<pre class="bg-black/10 dark:bg-black/30 p-3 my-2 rounded-lg text-[13px] text-cyan-700 dark:text-cyan-300 font-mono overflow-x-auto"><code>${p1.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
        .replace(/`([^`]+)`/g, '<code class="bg-cyan-500/10 px-1.5 py-0.5 rounded text-cyan-600 dark:text-cyan-400 font-mono text-[13px]">$1</code>')
        .replace(/\*(.*?)\*/g, '<strong class="font-medium">$1</strong>')
        .replace(/\n/g, '<br />');

    return <div className="max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
};

interface ChatbotProps {
    agentData: Agent[];
    logs: LogEntry[];
    onClose: () => void;
    isCentered: boolean;
    onToggleCenter: () => void;
    isMobile: boolean;
    userPlan: PlanTier;
}

const CHAT_SESSIONS_KEY = 'zappy_chat_sessions';

const Chatbot: React.FC<ChatbotProps> = ({ onClose, isCentered, onToggleCenter, isMobile, userPlan }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const currentSessionIdRef = useRef(currentSessionId);
    const streamingRef = useRef<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        currentSessionIdRef.current = currentSessionId;
    }, [currentSessionId]);

    // Entrance animation
    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(cardRef.current,
                { opacity: 0, y: 20, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' }
            );
        }
    }, []);

    useEffect(() => {
        const loadSessions = async () => {
            const storedSessionsRaw = localStorage.getItem(CHAT_SESSIONS_KEY);
            let loadedSessions: ChatSession[] = storedSessionsRaw ? JSON.parse(storedSessionsRaw) : [];
            setSessions(loadedSessions);

            if (loadedSessions.length > 0) {
                const lastSession = loadedSessions[0];
                setCurrentSessionId(lastSession.id);
                setMessages(lastSession.messages);
            } else {
                startNewSession();
            }
        };

        loadSessions();
    }, []);

    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
        }
    }, [sessions]);

    const scrollToBottom = useCallback(() => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            requestAnimationFrame(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: isStreaming ? 'auto' : 'smooth'
                });
            });
        }
    }, [isStreaming]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    const startNewSession = async () => {
        const newId = uuidv4();
        let welcomeMessage = "Hello! I'm Zappy. How can I help you today?";
        let newBackendSessionId: string | null = null;

        try {
            const sessionResult = await createChatSession();
            if (sessionResult) {
                newBackendSessionId = sessionResult.session.id;
                setBackendSessionId(newBackendSessionId);
                welcomeMessage = sessionResult.welcomeMessage;
            } else {
                const config = await getChatbotConfig();
                welcomeMessage = config.welcomeMessage;
            }
        } catch (e) {
            console.error("Failed to create session", e);
        }

        const initialMessage: ChatMessage = {
            author: MessageAuthor.Assistant,
            text: welcomeMessage
        };

        const newSession: ChatSession = {
            id: newId,
            timestamp: Date.now(),
            title: 'New Conversation',
            messages: [initialMessage],
            backendSessionId: newBackendSessionId || undefined
        };

        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newId);
        setMessages([initialMessage]);
    };

    const updateCurrentSession = useCallback((updatedMessages: ChatMessage[]) => {
        setSessions(prev => prev.map(session => {
            if (session.id === currentSessionId) {
                let title = session.title;
                const firstUserMsg = updatedMessages.find(m => m.author === MessageAuthor.User);
                if (session.title === 'New Conversation' && firstUserMsg) {
                    title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
                }

                return {
                    ...session,
                    messages: updatedMessages,
                    timestamp: Date.now(),
                    title,
                    backendSessionId: backendSessionId || session.backendSessionId
                };
            }
            return session;
        }).sort((a, b) => b.timestamp - a.timestamp));
    }, [currentSessionId, backendSessionId]);

    const stopStreaming = useCallback(() => {
        streamingRef.current = false;
        setIsStreaming(false);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const sendMessage = async (messageText: string) => {
        if (isLoading || isStreaming || !messageText.trim()) return;

        setIsLoading(true);
        abortControllerRef.current = new AbortController();

        const userMessage: ChatMessage = { author: MessageAuthor.User, text: messageText };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        updateCurrentSession(newMessages);

        try {
            const currentSession = sessions.find(s => s.id === currentSessionId);
            const sessionIdToUse = backendSessionId || currentSession?.backendSessionId;

            const response = await sendMessageToBackend(
                messageText,
                messages, // Send existing history
                sessionIdToUse || undefined
            );

            setIsLoading(false);
            setIsStreaming(true);
            streamingRef.current = true;

            // Add Assistant message placeholder
            setMessages(prev => [...prev, { author: MessageAuthor.Assistant, text: '' }]);

            let fullAssistantText = '';

            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    // Decode the plain text chunk
                    const chunk = decoder.decode(value, { stream: true });
                    fullAssistantText += chunk;

                    // Update the message with the accumulated text
                    setMessages(prev => {
                        const updated = [...prev];
                        if (updated.length > 0) {
                            updated[updated.length - 1] = {
                                ...updated[updated.length - 1],
                                text: fullAssistantText
                            };
                        }
                        return updated;
                    });
                }
            }

            // Finalize session
            setMessages(prev => {
                updateCurrentSession(prev);
                return prev;
            });
            setIsStreaming(false);

        } catch (error) {
            console.error("Chat Error:", error);
            setIsLoading(false);
            setIsStreaming(false);
            const errorMessage: ChatMessage = {
                author: MessageAuthor.Assistant,
                text: "I'm having trouble connecting. Please try again."
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const handleSend = () => {
        sendMessage(input);
        setInput('');
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    const handleSelectSession = (session: ChatSession) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages);
        setBackendSessionId(session.backendSessionId || null);
        setShowHistory(false);
    };

    const handleDeleteSession = (sessionId: string) => {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
    };

    // Animated close
    const handleClose = () => {
        if (cardRef.current) {
            gsap.to(cardRef.current, {
                opacity: 0,
                y: 20,
                scale: 0.98,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: onClose
            });
        } else {
            onClose();
        }
    };

    const suggestionPrompts = [
        { icon: <WrenchScrewdriverIcon className="h-3.5 w-3.5" />, text: "How do I set up my workflow?" },
        { icon: <QuestionMarkCircleIcon className="h-3.5 w-3.5" />, text: "My webhook test is failing, why?" },
    ];

    return (
        <Card
            ref={cardRef}
            className="flex flex-col w-full h-full overflow-hidden rounded-2xl border border-cyan-500/30 shadow-2xl bg-white dark:bg-[#0c0c0e]"
            style={{
                boxShadow: '0 0 40px -10px rgba(6, 182, 212, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
        >
            {/* Header */}
            <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 z-30 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#0c0c0e]">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${userPlan === 'enterprise' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'}`}>
                        {userPlan === 'enterprise' ? <BriefcaseIcon className="h-4 w-4" /> : <ChatBubbleIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Zappy</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${userPlan === 'enterprise' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400' : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                            }`}>
                            {userPlan === 'enterprise' ? 'ENT' : userPlan === 'pro' ? 'PRO' : 'FREE'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`p-2 rounded-lg transition-all ${showHistory ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white/70'}`}
                    >
                        <ClockIcon className="h-4 w-4" />
                    </button>
                    <button onClick={startNewSession} className="p-2 rounded-lg text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white/70 transition-all">
                        <RefreshCwIcon className="h-4 w-4" />
                    </button>
                    {!isMobile && (
                        <button onClick={onToggleCenter} className="p-2 rounded-lg text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white/70 transition-all">
                            {isCentered ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
                        </button>
                    )}
                    <button onClick={handleClose} className="p-2 rounded-lg text-gray-500 dark:text-white/40 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all">
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="relative flex-grow flex flex-col min-h-0 overflow-hidden bg-white dark:bg-[#0c0c0e]">
                {showHistory && (
                    <ChatHistory
                        sessions={sessions}
                        onSelectSession={handleSelectSession}
                        userPlan={userPlan}
                        onClose={() => setShowHistory(false)}
                        onDeleteSession={handleDeleteSession}
                    />
                )}

                {/* Chat messages */}
                <CardContent
                    ref={scrollContainerRef}
                    className="flex-grow px-5 pt-6 pb-4 overflow-y-auto space-y-4"
                    style={{
                        scrollBehavior: 'auto',
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.author === MessageAuthor.User ? 'justify-end' : ''}`}>
                            {msg.author === MessageAuthor.Assistant && (
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${userPlan === 'enterprise' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                                    }`}>
                                    {userPlan === 'enterprise' ? <BriefcaseIcon className="h-4 w-4" /> : <ChatBubbleIcon className="h-4 w-4" />}
                                </div>
                            )}
                            <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.author === MessageAuthor.User
                                ? 'bg-cyan-500 text-white rounded-tr-md'
                                : 'bg-gray-100 dark:bg-white/[0.03] text-gray-900 dark:text-white/90 rounded-tl-md'
                                }`}
                                style={{ fontSize: '15px', lineHeight: '1.6' }}
                            >
                                <SimpleMarkdown text={msg.text} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${userPlan === 'enterprise' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                                }`}>
                                {userPlan === 'enterprise' ? <BriefcaseIcon className="h-4 w-4" /> : <ChatBubbleIcon className="h-4 w-4" />}
                            </div>
                            <div className="bg-gray-100 dark:bg-white/[0.03] rounded-tl-md px-4 py-3 rounded-2xl">
                                <div className="flex items-center space-x-1.5">
                                    <span className="h-2 w-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-gray-400 dark:bg-white/30 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>

                {/* Footer */}
                <CardFooter className="p-4 flex-col gap-3 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#0c0c0e]">
                    {/* Suggestion prompts */}
                    {messages.length <= 1 && (
                        <div className="flex gap-2 overflow-x-auto w-full pb-1 no-scrollbar">
                            {suggestionPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(prompt.text)}
                                    className="flex-shrink-0 px-3 py-2 bg-gray-100 dark:bg-white/[0.03] hover:bg-gray-200 dark:hover:bg-white/[0.06] rounded-xl text-[13px] text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-all whitespace-nowrap"
                                >
                                    {prompt.icon}
                                    <span>{prompt.text}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input bar */}
                    <div className="relative w-full flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Type your question..."
                                className="w-full h-12 bg-gray-100 dark:bg-white/[0.03] rounded-xl px-4 text-gray-900 dark:text-white text-[15px] focus:ring-1 focus:ring-cyan-500/30 focus:bg-gray-50 dark:focus:bg-white/[0.05] outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-white/25"
                            />
                        </div>

                        {/* Stop button */}
                        {isStreaming && (
                            <button
                                onClick={stopStreaming}
                                className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 transition-all"
                                title="Stop generating"
                            >
                                <StopIcon className="h-5 w-5" />
                            </button>
                        )}

                        {/* Send button */}
                        <button
                            onClick={handleSend}
                            disabled={isLoading || isStreaming || !input.trim()}
                            className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 ${isLoading || isStreaming || !input.trim()
                                ? 'bg-gray-100 dark:bg-white/[0.03] text-gray-300 dark:text-white/20 cursor-not-allowed'
                                : 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
                                }`}
                        >
                            <ArrowUpIcon className="h-5 w-5" />
                        </button>
                    </div>
                </CardFooter>
            </div>
        </Card>
    );
};

export default Chatbot;
