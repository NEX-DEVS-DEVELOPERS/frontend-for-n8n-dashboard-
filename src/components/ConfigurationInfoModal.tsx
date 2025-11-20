
import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { XIcon } from './icons';
import { Button } from './ui';

interface ConfigurationInfoModalProps {
  onClose: () => void;
}

const ConfigurationInfoModal: React.FC<ConfigurationInfoModalProps> = ({ onClose }) => {
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
          <h2 className="text-xl font-bold text-foreground">Configuration</h2>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-9 w-9 rounded-full hover:bg-white/10">
            <XIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>

        <main className="p-6 space-y-5">
          <p className="text-foreground font-semibold text-sm leading-relaxed">
            This is a personalized n8n Agent Workflow Dashboard, provided and managed by NEX-DEVS.
          </p>
          <p className="text-foreground/90 text-sm leading-relaxed">
            To access the dashboard, you require unique login credentials that are configured and provided by the administrator.
          </p>
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
            <h4 className="font-bold text-primary text-sm">Action Required</h4>
            <p className="text-sm text-foreground/90 mt-1">
              Please contact your provider (NEX-DEVS) to receive or reset your username and password.
            </p>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            For security, ensure you store your credentials safely and do not share them with anyone.
          </p>
        </main>

        <footer className="p-5 border-t border-white/10 flex justify-end">
          <Button onClick={handleClose} size="lg" className="h-10 text-sm">
            Got It
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default ConfigurationInfoModal;
