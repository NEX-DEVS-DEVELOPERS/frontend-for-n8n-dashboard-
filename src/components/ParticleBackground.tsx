
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ParticleBackgroundProps {
    className?: string;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ className }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            const particles = gsap.utils.toArray<HTMLElement>('.bg-particle');

            particles.forEach((p) => {
                gsap.set(p, {
                    x: gsap.utils.random(0, window.innerWidth),
                    y: gsap.utils.random(0, window.innerHeight),
                    scale: gsap.utils.random(0.5, 1.5),
                    opacity: gsap.utils.random(0.2, 0.5),
                    force3D: true
                });

                gsap.to(p, {
                    x: `+=${gsap.utils.random(-100, 100)}`,
                    y: `+=${gsap.utils.random(-100, 100)}`,
                    rotation: gsap.utils.random(0, 360),
                    duration: gsap.utils.random(40, 70),
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    force3D: true
                });

                gsap.to(p, {
                    opacity: gsap.utils.random(0.3, 0.7),
                    scale: gsap.utils.random(0.8, 1.5),
                    duration: gsap.utils.random(8, 15),
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className || ''}`}>
            {Array.from({ length: 18 }).map((_, i) => (
                <div
                    key={i}
                    className={`bg-particle absolute rounded-full blur-2xl mix-blend-screen will-change-transform ${['bg-purple-500/20', 'bg-cyan-500/20', 'bg-pink-500/20', 'bg-blue-500/20'][i % 4]}`}
                    style={{
                        width: Math.random() * 150 + 50 + 'px',
                        height: Math.random() * 150 + 50 + 'px',
                    }}
                />
            ))}
        </div>
    );
};

export default ParticleBackground;
