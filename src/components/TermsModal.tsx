
import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { XIcon, BookOpenIcon, ShieldCheckIcon } from './icons';
import { Button } from './ui';

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const modal = modalRef.current;
    gsap.set(document.body, { overflow: 'hidden' });

    if (backdrop && modal) {
      gsap.set([backdrop, modal], { autoAlpha: 0 });
      gsap.to(backdrop, { autoAlpha: 1, duration: 0.5 });
      gsap.fromTo(
        modal,
        { scale: 0.9, autoAlpha: 0 },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'expo.out', delay: 0.1, force3D: true }
      );
    }
    
    return () => {
      gsap.set(document.body, { overflow: 'auto' });
    };
  }, []);

  const handleClose = useCallback(() => {
    const backdrop = backdropRef.current;
    const modal = modalRef.current;
    if (backdrop && modal) {
      const tl = gsap.timeline({ onComplete: onClose });
      tl.to(modal, { autoAlpha: 0, scale: 0.9, duration: 0.4, ease: 'expo.in', force3D: true })
        .to(backdrop, { autoAlpha: 0, duration: 0.4 }, "<");
    } else {
      onClose();
    }
  }, [onClose]);

  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        ref={modalRef}
        className="bg-card/90 backdrop-blur-2xl rounded-2xl w-full max-w-2xl flex flex-col border border-primary/20 shadow-[0_0_50px_-12px_rgba(72,168,163,0.3)] max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                 <BookOpenIcon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Terms & Policies</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-10 w-10 rounded-full hover:bg-white/10">
            <XIcon className="h-6 w-6 text-muted-foreground" />
          </Button>
        </header>

        <main className="p-8 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">1. Usage Policy</h3>
                <p className="text-muted-foreground leading-relaxed">
                    This dashboard is provided by NEX-DEVS as a specialized interface for monitoring n8n workflows. Access is strictly limited to authorized personnel. Any attempt to bypass authentication, inject malicious payloads, or disrupt the service is a violation of our usage policy and will be logged.
                </p>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">2. Data Privacy & Statelessness</h3>
                <p className="text-muted-foreground leading-relaxed">
                    We value your data privacy. This frontend application is designed to be <strong className="text-primary">stateless</strong>.
                </p>
                <ul className="list-disc list-inside pl-4 text-muted-foreground space-y-1">
                    <li>We do not store your workflow execution data on our servers.</li>
                    <li>All logs are streamed directly from your n8n instance to your browser via encrypted channels (SSE).</li>
                    <li>Session tokens are stored locally on your device and are never transmitted to third parties.</li>
                </ul>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">3. Liability Disclaimer</h3>
                <p className="text-muted-foreground leading-relaxed">
                    While we strive for 99.9% uptime and reliability, NEX-DEVS is not liable for any workflow failures, data loss, or operational disruptions caused by misconfiguration of the connected n8n instance or external API outages. Users are responsible for ensuring their n8n backend is correctly configured to handle CORS and webhooks.
                </p>
            </div>
             <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">4. Intellectual Property</h3>
                <p className="text-muted-foreground leading-relaxed">
                    The dashboard interface, including its design, "Zappy" AI integration, and custom components, is the intellectual property of NEX-DEVS. Unauthorized reproduction or redistribution of the source code is prohibited.
                </p>
            </div>
        </main>
        
        <footer className="p-6 border-t border-white/10 flex justify-between items-center flex-shrink-0 bg-black/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheckIcon className="h-4 w-4 text-green-400" />
                <span>Last updated: October 2023</span>
            </div>
            <Button onClick={handleClose} size="lg" className="shadow-lg shadow-primary/10">
                I Understand
            </Button>
        </footer>
      </div>
    </div>
  );
};

export default TermsModal;
