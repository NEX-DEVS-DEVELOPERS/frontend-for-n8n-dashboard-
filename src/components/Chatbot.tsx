
import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Agent, ChatMessage, MessageAuthor, LogEntry, PlanTier } from '../types';
import { ArrowUpIcon, ChatBubbleIcon, LightBulbIcon, QuestionMarkCircleIcon, WrenchScrewdriverIcon, XIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, RefreshCwIcon, SparklesIcon, BriefcaseIcon } from './icons';
import { Card, CardContent, CardFooter } from './ui';
import { sendMessageToBackend } from '../services/chatbotApi';

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const cleanedText = text
        .replace(/^##\s+/gm, '') // Remove markdown headers
        .replace(/(\*\*|__)(.*?)\1/g, '$2'); // Remove **bold** and __bold__, keeping the text

    const html = cleanedText
        .replace(/```([\s\S]*?)```/g, (match, p1) => `<pre class="bg-black/5 dark:bg-black/50 p-3 my-2 rounded-lg text-sm text-cyan-600 dark:text-cyan-300 font-mono overflow-x-auto border border-border/50"><code>${p1.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
        .replace(/`([^`]+)`/g, '<code class="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-mono text-xs border border-primary/20">$1</code>')
        .replace(/\*(.*?)\*/g, '<strong class="text-foreground font-semibold">$1</strong>') // Use single asterisks for bold
        .replace(/\n/g, '<br />');

    return <div className="prose prose-invert prose-base max-w-none leading-relaxed text-foreground/90 text-[16px]" dangerouslySetInnerHTML={{ __html: html }} />;
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

const CHAT_HISTORY_KEY = 'zappy_chat_history';

const Chatbot: React.FC<ChatbotProps> = ({ agentData, logs, onClose, isCentered, onToggleCenter, isMobile, userPlan }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedHistoryRaw = localStorage.getItem(CHAT_HISTORY_KEY);
        const storedMessages = storedHistoryRaw ? JSON.parse(storedHistoryRaw) : null;

        const welcomeMsg = userPlan === 'enterprise'
            ? "Hello. Zappy Enterprise initialized. I have your full system context loaded. How can I assist?"
            : userPlan === 'pro'
                ? "Hello! Zappy Pro here. Ready to optimize your workflows."
                : "Hello! I'm Zappy. How can I help you today?";

        if (!storedMessages || storedMessages.length === 0) {
            setMessages([{
                author: MessageAuthor.Assistant,
                text: welcomeMsg
            }]);
        } else {
            setMessages(storedMessages);
        }
    }, [userPlan]);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            gsap.to(scrollContainerRef.current, {
                scrollTop: scrollContainerRef.current.scrollHeight,
                duration: 0.5,
                ease: "power2.out",
                overwrite: true
            });
        }
    }, [messages, isLoading]);

    const sendMessage = async (messageText: string) => {
        if (isLoading || !messageText.trim()) return;

        setIsLoading(true);
        const userMessage: ChatMessage = { author: MessageAuthor.User, text: messageText };

        // Optimistically add user message
        setMessages(prev => [...prev, userMessage]);

        try {
            // Send to backend
            const responseText = await sendMessageToBackend(messageText, messages);

            setMessages(prev => [...prev, {
                author: MessageAuthor.Assistant,
                text: responseText
            }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                author: MessageAuthor.Assistant,
                text: "I'm having trouble connecting to the server. Please try again later."
            }]);
        } finally {
            setIsLoading(false);
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

    const handleClearChat = () => {
        localStorage.removeItem(CHAT_HISTORY_KEY);
        const welcomeMsg = userPlan === 'enterprise'
            ? "Hello. Zappy Enterprise initialized. I have your full system context loaded. How can I assist?"
            : userPlan === 'pro'
                ? "Hello! Zappy Pro here. Ready to optimize your workflows."
                : "Hello! I'm Zappy. How can I help you today?";

        setMessages([{
            author: MessageAuthor.Assistant,
            text: welcomeMsg
        }]);
    };

    const suggestionPrompts = [
        { icon: <WrenchScrewdriverIcon className="h-4 w-4 text-primary" />, text: "How do I set up my workflow?" },
        { icon: <QuestionMarkCircleIcon className="h-4 w-4 text-primary" />, text: "My webhook test is failing, why?" },
    ];

    const getHeaderBadge = () => {
        if (userPlan === 'enterprise') {
            return (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/5 rounded-md border border-purple-500/20">
                    <BriefcaseIcon className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-xs font-medium text-purple-300 tracking-wide">Enterprise</span>
                </div>
            );
        }
        if (userPlan === 'pro') {
            return (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-md border border-primary/20">
                    <SparklesIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary tracking-wide">Pro</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 px-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-xs text-muted-foreground font-medium">Online</p>
            </div>
        );
    }

    return (
        <Card className={`flex flex-col w-full h-full overflow-hidden bg-card/95 backdrop-blur-2xl rounded-2xl border shadow-[0_0_50px_-12px_rgba(72,168,163,0.3)] ${userPlan === 'enterprise' ? 'border-purple-500/30' : 'border-primary/20'}`}>
            <header className={`flex-shrink-0 h-16 bg-muted/20 dark:bg-black/20 border-b border-border/10 flex items-center justify-between px-5 z-10 relative`}>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className={`absolute inset-0 blur-md rounded-full ${userPlan === 'enterprise' ? 'bg-purple-500/30' : 'bg-primary/20'}`}></div>
                        <div className={`relative bg-card p-1.5 rounded-xl border ${userPlan === 'enterprise' ? 'border-purple-500/40' : 'border-primary/30'}`}>
                            {userPlan === 'enterprise' ? <BriefcaseIcon className="h-5 w-5 text-purple-400" /> : <ChatBubbleIcon className="h-5 w-5 text-primary" />}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-bold text-foreground text-sm tracking-wide leading-none mb-1.5">Zappy</h3>
                        {getHeaderBadge()}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleClearChat} className="p-2 rounded-full hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors" title="Clear Chat">
                        <RefreshCwIcon className="h-4 w-4" />
                    </button>
                    {!isMobile && (
                        <button onClick={onToggleCenter} className="p-2 rounded-full hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors" title={isCentered ? 'Dock Chat' : 'Center Chat'}>
                            {isCentered ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>
            </header>

            <CardContent ref={scrollContainerRef} className="flex-grow p-6 pt-8 overflow-y-auto space-y-6 min-h-0 bg-background/50">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-4 ${msg.author === MessageAuthor.User ? 'justify-end' : ''}`}>
                        {msg.author === MessageAuthor.Assistant && (
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${userPlan === 'enterprise' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-primary/10 border border-primary/20'}`}>
                                {userPlan === 'enterprise' ? <BriefcaseIcon className="h-4 w-4 text-purple-400" /> : <ChatBubbleIcon className="h-4 w-4 text-primary" />}
                            </div>
                        )}
                        <div className={`max-w-[85%] p-4 rounded-2xl text-[16px] shadow-sm transition-all duration-300 ${msg.author === MessageAuthor.User
                            ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-lg shadow-primary/10'
                            : 'bg-card border border-border/30 rounded-tl-sm'
                            }`}>
                            <SimpleMarkdown text={msg.text} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${userPlan === 'enterprise' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-primary/10 border border-primary/20'}`}>
                            {userPlan === 'enterprise' ? <BriefcaseIcon className="h-4 w-4 text-purple-400" /> : <ChatBubbleIcon className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="bg-card border border-border/30 rounded-tl-sm p-4 rounded-2xl">
                            <div className="flex items-center space-x-1.5 h-5 px-1">
                                <span className="typing-dot h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="typing-dot h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="typing-dot h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 flex-col items-stretch border-t border-border/10 bg-card/50">
                {messages.length <= 1 && (
                    <div className="grid grid-cols-1 gap-2 mb-4">
                        {suggestionPrompts.map((prompt, i) => (
                            <button key={i} onClick={() => handleSuggestionClick(prompt.text)} className="text-left p-3 bg-muted/20 dark:bg-black/20 border border-border/30 hover:bg-primary/5 hover:border-primary/20 rounded-xl text-xs text-muted-foreground hover:text-foreground flex items-center gap-3 transition-all group">
                                <div className="bg-muted/30 dark:bg-black/30 p-1 rounded group-hover:bg-primary/10 transition-colors">
                                    {prompt.icon}
                                </div>
                                <span>{prompt.text}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Type your question..."
                        className="w-full bg-muted/30 dark:bg-black/30 border border-border/30 rounded-xl px-4 py-3.5 pr-12 text-foreground focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all resize-none placeholder:text-muted-foreground/40 text-base shadow-inner font-medium"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 shadow-md
                        ${isLoading
                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-0 disabled:scale-75'
                            }
                    `}
                        aria-label="Send message"
                    >
                        <ArrowUpIcon className="h-4 w-4 font-bold" />
                    </button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default Chatbot;

