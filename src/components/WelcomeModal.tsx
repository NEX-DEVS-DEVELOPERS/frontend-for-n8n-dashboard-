import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { XIcon, BookOpenIcon } from './icons';
import { Button } from './ui';

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const modal = modalRef.current;
    gsap.set(document.body, { overflow: 'hidden' });

    if (backdrop && modal) {
      const elementsToAnimate = gsap.utils.toArray(modal.querySelectorAll('.modal-content-animation'));

      gsap.set(backdrop, { autoAlpha: 0 });
      gsap.set(modal, { autoAlpha: 0, scale: 0.95 });
      gsap.set(elementsToAnimate, { autoAlpha: 0, y: 20 });

      const tl = gsap.timeline();

      tl.to(backdrop, { autoAlpha: 1, duration: 0.5, ease: 'power2.inOut' })
        .to(modal, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.6,
          ease: 'expo.out',
          force3D: true
        }, "-=0.3")
        .to(elementsToAnimate, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          force3D: true,
        }, "-=0.3");
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
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-primary/20 shadow-[0_0_50px_-12px_rgba(72,168,163,0.3)]"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 pb-2 modal-content-animation">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
              <img src="/n8n-logo.svg" alt="N8n Logo" className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Nex-Devs</h2>
              <p className="text-sm text-muted-foreground font-medium">N8N DASHBOARD SYSTEM</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-9 w-9 rounded-full hover:bg-white/10 -mt-4 -mr-2">
            <XIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>

        <main className="px-6 py-4 overflow-y-auto space-y-6">
          <div className="modal-content-animation">
            <p className="text-base text-muted-foreground leading-relaxed">
              This dashboard allows you to trigger and monitor your n8n workflows in real-time.
              Follow these steps to configure your workflow for connection.
            </p>
          </div>

          <div className="grid gap-5 modal-content-animation">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <h3 className="font-bold text-base text-foreground mb-2 flex items-center gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold ring-1 ring-primary/30">1</span>
                Configure CORS
              </h3>
              <p className="text-sm text-muted-foreground mb-3 pl-9">
                Add this environment variable to your n8n setup to allow connection.
              </p>
              <div className="pl-9">
                <pre className="bg-black/40 p-3 rounded-xl text-xs text-cyan-300 font-mono border border-white/5 shadow-inner overflow-x-auto">
                  N8N_CORS_ALLOWED_ORIGINS=https://aistudio.google.com
                </pre>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <h3 className="font-bold text-base text-foreground mb-2 flex items-center gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold ring-1 ring-primary/30">2</span>
                Configure Webhook Response
              </h3>
              <p className="text-sm text-muted-foreground mb-3 pl-9">
                Set your Webhook node to "Respond Immediately" and use this JSON body:
              </p>
              <div className="pl-9">
                <pre className="bg-black/40 p-3 rounded-xl text-xs text-cyan-300 font-mono border border-white/5 shadow-inner overflow-x-auto">
                  {`{{ { "sseUrl": $json.env["N8N_SSE_URL_CALLBACK_"] + "?workflowId=" + $workflow.id } }}`}
                </pre>
              </div>
            </div>
          </div>

          <div className="modal-content-animation flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-transparent border border-primary/10 rounded-2xl">
            <div className="text-primary p-2 bg-primary/10 rounded-full">
              <BookOpenIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground">Ready to start?</h3>
              <p className="text-sm text-muted-foreground">
                Once configured, use the "Add Agent" button on the dashboard to connect.
              </p>
            </div>
          </div>
        </main>

        <footer className="p-6 pt-2 flex justify-end modal-content-animation">
          <Button onClick={handleClose} size="lg" className="px-6 shadow-lg shadow-primary/10 h-12 text-base bg-primary hover:bg-primary/90">
            Let's Get Started
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default WelcomeModal;
