import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CheckCircleIcon } from './icons';

interface SuccessAnimationProps {
    message: string;
    onComplete?: () => void;
    isVisible: boolean;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ message, onComplete, isVisible }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible && containerRef.current) {
            const tl = gsap.timeline({
                onComplete: () => {
                    // Wait a bit before triggering completion
                    setTimeout(() => {
                        if (onComplete) onComplete();
                    }, 800);
                }
            });

            // Reset states
            gsap.set(containerRef.current, { autoAlpha: 0, scale: 0.8 });
            gsap.set(iconRef.current, { scale: 0, autoAlpha: 0, rotation: -180 });
            gsap.set(textRef.current, { y: 20, autoAlpha: 0 });

            // Optimized animation sequence
            tl.to(containerRef.current, {
                autoAlpha: 1,
                scale: 1,
                duration: 0.4,
                ease: "expo.out"
            })
                .to(iconRef.current, {
                    scale: 1,
                    rotation: 0,
                    autoAlpha: 1,
                    duration: 0.5,
                    ease: "back.out(2)"
                }, "-=0.2")
                .to(textRef.current, {
                    y: 0,
                    autoAlpha: 1,
                    duration: 0.25,
                    ease: "power2.out"
                }, "-=0.3");

        } else {
            gsap.set(containerRef.current, { autoAlpha: 0 });
        }
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-50 flex items-center justify-center"
        >
            <div className="bg-black/90 backdrop-blur-md border border-primary/30 rounded-xl p-8 shadow-2xl flex flex-col items-center justify-center w-64 h-64">
                <div ref={iconRef} className="mb-5 text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">
                    <CheckCircleIcon className="w-20 h-20" />
                </div>
                <div ref={textRef} className="text-base font-bold text-white text-center">
                    {message}
                </div>
            </div>
        </div>
    );
};

export default SuccessAnimation;
