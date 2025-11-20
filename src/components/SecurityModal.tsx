
import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { XIcon, ShieldCheckIcon, KeyIcon, ServerIcon, LogOutIcon } from './icons';
import { Button } from './ui';

interface SecurityModalProps {
  onClose: () => void;
}

const SecurityModal: React.FC<SecurityModalProps> = ({ onClose }) => {
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
        className="bg-card/90 backdrop-blur-2xl rounded-2xl w-full max-w-md flex flex-col border border-primary/20 shadow-[0_0_50px_-12px_rgba(72,168,163,0.3)]"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
              <ShieldCheckIcon className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Security Protocol</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-9 w-9 rounded-full hover:bg-white/10">
            <XIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>

        <main className="p-6 space-y-5">
          <p className="text-foreground/90 text-sm leading-relaxed">
            The VICTUS LEAD Dashboard employs a multi-layered security architecture to ensure the integrity of your workflows.
          </p>

          <div className="space-y-3">
            <div className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <KeyIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-foreground text-sm">Encrypted Transport</h4>
                <p className="text-xs text-muted-foreground mt-0.5">All webhook triggers and SSE log streams occur over TLS 1.3 (HTTPS), ensuring data in transit cannot be intercepted.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <ServerIcon className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-foreground text-sm">Isolated Execution</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Your workflows run on your private n8n instance. This dashboard acts only as a remote control, adhering to strict CORS policies.</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <LogOutIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-foreground text-sm">Client-Side Session</h4>
                <p className="text-xs text-muted-foreground mt-0.5">We utilize zero-knowledge authentication. Credentials are verified against a secure hash and sessions are maintained locally.</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="p-5 border-t border-white/10 flex justify-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
            </span>
            System Secure
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SecurityModal;
