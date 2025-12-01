
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import gsap from 'gsap';
import Chatbot from './Chatbot';
import { Agent, LogEntry, PlanTier } from '../types';
import { ChatBubbleIcon, ChevronDownIcon } from './icons';

interface ChatbotWidgetProps {
    agentData: Agent[];
    logs: LogEntry[];
    userPlan: PlanTier;
}

export interface ChatbotWidgetRef {
    open: () => void;
}

const ChatbotWidget = forwardRef<ChatbotWidgetRef, ChatbotWidgetProps>(({ agentData, logs, userPlan }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isCentered, setIsCentered] = useState(window.innerWidth < 768);

    const chatbotContainerRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        open: () => {
            setIsOpen(true);
        }
    }));

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsCentered(true);
            }
        };
        window.addEventListener('resize', handleResize, { passive: true });
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect to set initial GSAP state on mount
    useEffect(() => {
        const el = chatbotContainerRef.current;
        const backdrop = backdropRef.current;
        const ySlideOffset = '5rem';

        if (el && backdrop) {
            gsap.set(el, {
                top: '100%',
                left: '100%',
                x: window.innerWidth < 768 ? '-1rem' : '-2rem',
                y: `calc(-6rem + ${ySlideOffset})`,
                xPercent: -100,
                yPercent: -100,
                width: '100%',
                maxWidth: '32rem',
                maxHeight: '70vh',
                autoAlpha: 0,
                scale: 0.95,
                pointerEvents: 'none',
                transformOrigin: "bottom right"
            });
            gsap.set(backdrop, { autoAlpha: 0 });
        }
    }, []);


    // Main animation effect, runs whenever the state changes
    useEffect(() => {
        const el = chatbotContainerRef.current;
        const backdrop = backdropRef.current;
        if (!el || !backdrop) return;

        gsap.killTweensOf([el, backdrop]);

        const timeline = gsap.timeline();
        const ySlideOffset = '5rem';

        const dockedProps = {
            top: '100%',
            left: '100%',
            x: isMobile ? '-1rem' : '-2rem',
            y: '-6rem',
            xPercent: -100,
            yPercent: -100,
            width: '100%',
            maxWidth: '32rem',
            height: '70vh',
            maxHeight: '70vh',
        };

        const centeredProps = {
            top: '55%',
            left: '50%',
            x: '0rem',
            y: '0rem',
            xPercent: -50,
            yPercent: -50,
            width: '90vw',
            maxWidth: '48rem',
            height: '75vh',
            maxHeight: '800px',
        };

        if (isOpen) {
            const targetProps = isCentered ? centeredProps : dockedProps;

            timeline.to(backdrop, {
                autoAlpha: isCentered ? 1 : 0,
                duration: 0.6,
                ease: 'expo.inOut'
            })
                .to(el, {
                    ...targetProps,
                    transformOrigin: isCentered ? "center center" : "bottom right",
                    autoAlpha: 1,
                    scale: 1,
                    duration: 0.6,
                    ease: 'expo.out',
                    force3D: true,
                    onStart: () => gsap.set(el, { pointerEvents: 'auto' })
                }, "<");

        } else {
            const closedProps = {
                ...dockedProps,
                y: `calc(${dockedProps.y} + ${ySlideOffset})`,
                autoAlpha: 0,
                scale: 0.95,
            };

            timeline.to(backdrop, {
                autoAlpha: 0,
                duration: 0.4,
                ease: 'expo.in'
            })
                .to(el, {
                    ...closedProps,
                    transformOrigin: "bottom right",
                    duration: 0.4,
                    ease: 'expo.in',
                    force3D: true,
                    onComplete: () => gsap.set(el, { pointerEvents: 'none' })
                }, "<");
        }

    }, [isOpen, isCentered, isMobile]);


    const handleClose = () => setIsOpen(false);

    const handleToggleCenter = () => {
        if (!isMobile) {
            setIsCentered(prev => !prev);
        }
    };

    return (
        <>
            <div
                ref={backdropRef}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                onClick={handleClose}
                aria-hidden={!isOpen}
            ></div>

            <div
                ref={chatbotContainerRef}
                className="fixed z-40"
                aria-hidden={!isOpen}
            >
                <Chatbot
                    agentData={agentData}
                    logs={logs}
                    onClose={handleClose}
                    isCentered={isCentered}
                    onToggleCenter={handleToggleCenter}
                    isMobile={isMobile}
                    userPlan={userPlan}
                />
            </div>

            <div className="fixed bottom-4 right-4 sm:right-8 z-50 flex flex-col items-end gap-3 pointer-events-none">
                <div
                    className={`
                        relative pointer-events-auto
                        transition-all duration-300 ease-custom-ease origin-bottom-right
                        ${!isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-2'}
                    `}
                    aria-hidden={isOpen}
                >
                    <div
                        className="
                            py-2 px-5 text-sm font-semibold text-white
                            bg-black/80 backdrop-blur-xl border border-primary/40 rounded-full shadow-[0_0_15px_rgba(72,168,163,0.3)]
                            ring-1 ring-white/10
                            flex items-center gap-2
                        "
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Ask Zappy
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="pointer-events-auto h-12 w-12 sm:h-14 sm:w-14 bg-primary hover:bg-n8n-dark text-primary-foreground rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary border border-white/20"
                    aria-label={isOpen ? 'Close chat' : 'Open chat'}
                    aria-expanded={isOpen}
                >
                    <div className="relative h-6 w-6 sm:h-7 sm:w-7">
                        <ChevronDownIcon className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
                        <ChatBubbleIcon className={`absolute inset-0 transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                    </div>
                </button>
            </div>
        </>
    );
});

export default ChatbotWidget;
