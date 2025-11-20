
import React, { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import { PlanTier } from '../types';
import { XIcon, WrenchScrewdriverIcon, ClockIcon, CheckCircleIcon, LockClosedIcon } from './icons';
import { Button, Input, Label, Textarea } from './ui';

interface RequestChangeModalProps {
  onClose: () => void;
  userPlan: PlanTier;
}

const RequestChangeModal: React.FC<RequestChangeModalProps> = ({ onClose, userPlan }) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSent, setIsSent] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      handleClose();
    }, 3000);
  };

  const getPlanAllowance = () => {
    switch (userPlan) {
      case 'enterprise': return { hours: 15, label: '15 Hours Included' };
      case 'pro': return { hours: 3, label: '3 Hours Included' };
      default: return { hours: 0, label: 'Paid Service ($60/hr)' };
    }
  };

  const allowance = getPlanAllowance();

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="bg-card/90 backdrop-blur-2xl rounded-2xl w-full max-w-lg flex flex-col border border-primary/20 shadow-[0_0_50px_-12px_rgba(72,168,163,0.3)]"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <WrenchScrewdriverIcon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Request Website Changes</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-9 w-9 rounded-full hover:bg-white/10">
            <XIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>

        <form onSubmit={handleSubmit}>
          <main className="p-6 space-y-5">
            {isSent ? (
              <div className="text-center py-10 flex flex-col items-center justify-center animate-fade-in">
                <div className="h-14 w-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Request Received</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                  Our engineering team will review your request and update the status on your dashboard.
                </p>
              </div>
            ) : (
              <>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${userPlan === 'free' ? 'bg-red-500/10 border-red-500/20' : 'bg-primary/10 border-primary/20'}`}>
                  <div className="flex items-center gap-3">
                    <ClockIcon className={`h-5 w-5 ${userPlan === 'free' ? 'text-red-400' : 'text-primary'}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground">Plan Allowance</p>
                      <p className="text-xs text-muted-foreground">{allowance.label}</p>
                    </div>
                  </div>
                  {userPlan === 'free' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded text-[10px] text-red-400 font-bold uppercase tracking-wide">
                      <LockClosedIcon className="h-3 w-3" /> Locked
                    </div>
                  )}
                </div>

                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="change-subject" className="text-sm">Subject</Label>
                  <Input id="change-subject" type="text" placeholder="e.g., Update color scheme, Fix alignment" required className="h-10 text-sm" />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="change-desc" className="text-sm">Detailed Description</Label>
                  <Textarea id="change-desc" placeholder="Describe exactly what you need changed..." required rows={4} className="text-sm" />
                </div>

                {userPlan === 'free' && (
                  <p className="text-xs text-center text-muted-foreground bg-black/20 p-3 rounded-lg border border-white/5">
                    You are on the <strong>Free Plan</strong>. Submitting this request will generate a quote for $60/hr. Upgrade to Pro for 3 free hours/month.
                  </p>
                )}
              </>
            )}
          </main>

          {!isSent && (
            <footer className="p-5 border-t border-white/10 flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={handleClose} size="lg" className="h-10 text-sm">
                Cancel
              </Button>
              <Button type="submit" size="lg" className="h-10 text-sm">
                {userPlan === 'free' ? 'Request Quote' : 'Submit Request'}
              </Button>
            </footer>
          )}
        </form>
      </div>
    </div>
  );
};

export default RequestChangeModal;
