import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Agent, ChatMessage, MessageAuthor, LogEntry, PlanTier } from '../types';
import { ArrowUpIcon, ChatBubbleIcon, QuestionMarkCircleIcon, WrenchScrewdriverIcon, XIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, RefreshCwIcon, SparklesIcon, BriefcaseIcon, ClockIcon } from './icons';
import { Card, CardContent, CardFooter } from './ui';
import { sendMessageToBackend, getChatbotConfig } from '../services/chatbotApi';
import ChatHistory, { ChatSession } from './ChatHistory';
import { v4 as uuidv4 } from 'uuid';

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const cleanedText = text
        .replace(/^##\s+/gm, '') // Remove markdown headers
        .replace(/(\*\*|__)(.*?)\1/g, '$2'); // Remove **bold** and __bold__, keeping the text

    const html = cleanedText
        .replace(/```([\s\S]*?)```/g, (match, p1) => `<pre class="bg-black/5 dark:bg-black/50 p-3 my-2 rounded-lg text-sm text-cyan-600 dark:text-cyan-300 font-mono overflow-x-auto border border-border/50"><code>${p1.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
        .replace(/`([^`]+)`/g, '<code class="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-mono text-xs border border-primary/20">$1</code>')
        .replace(/\*(.*?)\*/g, '<strong class="text-foreground font-semibold">$1</strong>') // Use single asterisks for bold
        .replace(/\n/g, '<br />');

    return <div className="prose prose-invert prose-base max-w-none leading-relaxed text-foreground/90 text-[15px]" dangerouslySetInnerHTML={{ __html: html }} />;
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

const Chatbot: React.FC<ChatbotProps> = ({ agentData, logs, onClose, isCentered, onToggleCenter, isMobile, userPlan }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const currentSessionIdRef = useRef(currentSessionId);

    useEffect(() => {
        currentSessionIdRef.current = currentSessionId;
    }, [currentSessionId]);

    // Initialize sessions and current chat
    useEffect(() => {
        const loadSessions = async () => {
            const storedSessionsRaw = localStorage.getItem(CHAT_SESSIONS_KEY);
            let loadedSessions: ChatSession[] = storedSessionsRaw ? JSON.parse(storedSessionsRaw) : [];
            setSessions(loadedSessions);

            if (loadedSessions.length > 0) {
                const lastSession = loadedSessions[0]; // Assuming sorted by new
                setCurrentSessionId(lastSession.id);
                setMessages(lastSession.messages);
            } else {
                startNewSession();
            }
        };

        loadSessions();
    }, []);

    // Save sessions to local storage whenever they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
        }
    }, [sessions]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollContainerRef.current) {
            gsap.to(scrollContainerRef.current, {
                scrollTop: scrollContainerRef.current.scrollHeight,
                duration: isStreaming ? 0.05 : 0.5,
                ease: "power2.out",
                overwrite: true
            });
        }
    }, [messages, isLoading, isStreaming]);

    const startNewSession = async () => {
        const newId = uuidv4();
        let welcomeMessage = "Hello! I'm Zappy. How can I help you today?";
        try {
            const config = await getChatbotConfig();
            welcomeMessage = config.welcomeMessage;
        } catch (e) {
            console.error("Failed to fetch config", e);
        }

        const initialMessage: ChatMessage = {
            author: MessageAuthor.Assistant,
            text: welcomeMessage
        };

        const newSession: ChatSession = {
            id: newId,
            timestamp: Date.now(),
            title: 'New Conversation',
            messages: [initialMessage]
        };

        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newId);
        setMessages([initialMessage]);
    };

    const updateCurrentSession = (updatedMessages: ChatMessage[]) => {
        setSessions(prev => prev.map(session => {
            if (session.id === currentSessionId) {
                // Update title based on first user message if it's "New Conversation"
                let title = session.title;
                const firstUserMsg = updatedMessages.find(m => m.author === MessageAuthor.User);
                if (session.title === 'New Conversation' && firstUserMsg) {
                    title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
                }

                return {
                    ...session,
                    messages: updatedMessages,
                    timestamp: Date.now(),
                    title
                };
            }
            return session;
        }).sort((a, b) => b.timestamp - a.timestamp)); // Keep sorted
    };

    const streamResponse = async (fullText: string) => {
        const targetSessionId = currentSessionIdRef.current;
        setIsStreaming(true);

        // Add placeholder
        setMessages(prev => [...prev, { author: MessageAuthor.Assistant, text: '' }]);

        const chunks = fullText.split(/(\s+)/);
        let currentText = '';

        for (let i = 0; i < chunks.length; i++) {
            // Check if user switched sessions
            if (currentSessionIdRef.current !== targetSessionId) {
                setIsStreaming(false);
                return;
            }

            currentText += chunks[i];

            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0) {
                    newMessages[newMessages.length - 1] = {
                        ...newMessages[newMessages.length - 1],
                        text: currentText
                    };
                }
                return newMessages;
            });

            const delay = chunks[i].match(/^\s+$/) ? 20 : 50;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Final update
        if (currentSessionIdRef.current === targetSessionId) {
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0) {
                    newMessages[newMessages.length - 1] = {
                        ...newMessages[newMessages.length - 1],
                        text: fullText
                    };
                }
                updateCurrentSession(newMessages);
                return newMessages;
            });
        }

        setIsStreaming(false);
    };

    const sendMessage = async (messageText: string) => {
        if (isLoading || isStreaming || !messageText.trim()) return;

        setIsLoading(true);
        const userMessage: ChatMessage = { author: MessageAuthor.User, text: messageText };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        updateCurrentSession(newMessages);

        try {
            const responseText = await sendMessageToBackend(messageText, newMessages);
            setIsLoading(false); // Stop loading before streaming
            await streamResponse(responseText);

        } catch (error) {
            console.error("Chat Error:", error);
            setIsLoading(false);
            const errorMessage: ChatMessage = {
                author: MessageAuthor.Assistant,
                text: "I'm having trouble connecting to the server. Please try again later."
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const handleSend = () => {
        sendMessage(input);
        setInput('');
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
        sendMessage(suggestion);
        setInput('');
    };

    const handleSelectSession = (session: ChatSession) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages);
        setShowHistory(false);
    };

    const suggestionPrompts = [
        { icon: <WrenchScrewdriverIcon className="h-3.5 w-3.5" />, text: "How do I set up my workflow?" },
        { icon: <QuestionMarkCircleIcon className="h-3.5 w-3.5" />, text: "My webhook test is failing, why?" },
    ];

    const getHeaderBadge = () => {
        if (userPlan === 'enterprise') {
            return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 rounded text-[10px] font-medium text-purple-400 border border-purple-500/20">
                    <BriefcaseIcon className="h-3 w-3" />
                    <span>ENT</span>
                </div>
            );
        }
        if (userPlan === 'pro') {
            return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded text-[10px] font-medium text-primary border border-primary/20">
                    <SparklesIcon className="h-3 w-3" />
                    <span>PRO</span>
                </div>
            );
        }
        return null;
    }

    return (
        <Card className={`flex flex-col w-full h-full overflow-hidden bg-card/95 backdrop-blur-2xl rounded-2xl border shadow-2xl ${userPlan === 'enterprise' ? 'border-purple-500/20' : 'border-border/40'}`}>
            {/* Header */}
            <header className="flex-shrink-0 h-14 bg-background/50 backdrop-blur-md border-b border-border/10 flex items-center justify-between px-4 z-30 relative">
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${userPlan === 'enterprise' ? 'bg-purple-500/10 text-purple-400' : 'bg-primary/10 text-primary'}`}>
                        {userPlan === 'enterprise' ? <BriefcaseIcon className="h-4 w-4" /> : <ChatBubbleIcon className="h-4 w-4" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-foreground">Zappy</h3>
                            {getHeaderBadge()}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`p-2 rounded-md transition-colors ${showHistory ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                        title="History"
                    >
                        <ClockIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={startNewSession}
                        className="p-2 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                        title="New Chat"
                    >
                        <RefreshCwIcon className="h-4 w-4" />
                    </button>
                    {!isMobile && (
                        <button onClick={onToggleCenter} className="p-2 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors" title={isCentered ? 'Dock' : 'Center'}>
                            {isCentered ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="relative flex-grow flex flex-col min-h-0 overflow-hidden">
                {/* Chat History Overlay */}
                {showHistory && (
                    <ChatHistory
                        sessions={sessions}
                        onSelectSession={handleSelectSession}
                        userPlan={userPlan}
                        onClose={() => setShowHistory(false)}
                    />
                )}

                <CardContent ref={scrollContainerRef} className="flex-grow p-4 overflow-y-auto space-y-5 bg-background/20">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.author === MessageAuthor.User ? 'justify-end' : ''}`}>
                            {msg.author === MessageAuthor.Assistant && (
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${userPlan === 'enterprise' ? 'bg-purple-500/10 text-purple-400' : 'bg-primary/10 text-primary'}`}>
                                    {userPlan === 'enterprise' ? <BriefcaseIcon className="h-3.5 w-3.5" /> : <ChatBubbleIcon className="h-3.5 w-3.5" />}
                                </div>
                            )}
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.author === MessageAuthor.User
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-card border border-border/40 rounded-tl-sm'
                                }`}>
                                <SimpleMarkdown text={msg.text} />
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${userPlan === 'enterprise' ? 'bg-purple-500/10 text-purple-400' : 'bg-primary/10 text-primary'}`}>
                                {userPlan === 'enterprise' ? <BriefcaseIcon className="h-3.5 w-3.5" /> : <ChatBubbleIcon className="h-3.5 w-3.5" />}
                            </div>
                            <div className="bg-card border border-border/40 rounded-tl-sm px-4 py-3 rounded-2xl">
                                <div className="flex items-center space-x-1">
                                    <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-3 flex-col gap-2 border-t border-border/10 bg-card/30 backdrop-blur-sm">
                    {messages.length <= 1 && (
                        <div className="flex gap-2 overflow-x-auto w-full pb-2 no-scrollbar">
                            {suggestionPrompts.map((prompt, i) => (
                                <button key={i} onClick={() => handleSuggestionClick(prompt.text)} className="flex-shrink-0 px-3 py-2 bg-muted/30 border border-border/30 hover:bg-primary/5 hover:border-primary/20 rounded-lg text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 transition-all whitespace-nowrap">
                                    {prompt.icon}
                                    <span>{prompt.text}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="relative w-full">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Type your question..."
                            className="w-full bg-muted/30 border border-border/30 rounded-xl px-4 py-3 pr-10 text-foreground focus:ring-1 focus:ring-primary/30 focus:border-primary/30 outline-none transition-all resize-none placeholder:text-muted-foreground/50 text-sm"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || isStreaming || !input.trim()}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200
                            ${isLoading || isStreaming || !input.trim()
                                    ? 'text-muted-foreground/30 cursor-not-allowed'
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                                }
                        `}
                        >
                            <ArrowUpIcon className="h-4 w-4" />
                        </button>
                    </div>
                </CardFooter>
            </div>
        </Card>
    );
};

export default Chatbot;
