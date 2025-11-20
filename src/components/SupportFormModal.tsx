
import React, { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import { XIcon, ChatBubbleIcon, AnimatedCheckIcon } from './icons';
import { Button, Input, Label, Textarea } from './ui';

const supportTeam = [
  { id: 'ali', name: 'Ali Hasnaat', expertise: 'Expert in frontend, backend, and overall website functionality.' },
  { id: 'hassam_faizan', name: 'Hassam & Faizan', expertise: 'Specialists in n8n automation and our MOTIA backend workflow language.' },
  { id: 'mudassir_usman', name: 'Mudassir & Usman Aftab', expertise: 'Lead system design, architecture, and overall workflow planning.' },
];

interface SupportFormModalProps {
  onClose: () => void;
  onOpenChatbot: () => void;
  onAddSupportRequest: () => void;
  requestCount: number;
  requestLimit: number;
  nextSupportTicketExpiresAt: Date | null;
}

const SupportFormModal: React.FC<SupportFormModalProps> = ({
  onClose,
  onOpenChatbot,
  onAddSupportRequest,
  requestCount,
  requestLimit,
  nextSupportTicketExpiresAt
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSent, setIsSent] = useState(false);
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string | null>(null);
  const expertiseRef = useRef<HTMLDivElement>(null);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState('');

  const selectedSpecialist = supportTeam.find(s => s.id === selectedSpecialistId);

  // Cooldown Timer Effect
  useEffect(() => {
    if (!nextSupportTicketExpiresAt) {
      setCooldownTimeLeft('');
      return;
    }

    const calculateTime = () => {
      const difference = +new Date(nextSupportTicketExpiresAt) - +new Date();
      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      return '';
    };

    const timer = setInterval(() => {
      const newTimeLeft = calculateTime();
      if (!newTimeLeft) {
        clearInterval(timer);
        setCooldownTimeLeft('');
      } else {
        setCooldownTimeLeft(newTimeLeft);
      }
    }, 1000);

    setCooldownTimeLeft(calculateTime()); // Initial call

    return () => clearInterval(timer);
  }, [nextSupportTicketExpiresAt]);

  // Animation for expertise section
  useEffect(() => {
    const expertiseEl = expertiseRef.current;
    if (expertiseEl) {
      gsap.fromTo(expertiseEl,
        { autoAlpha: 0, height: 0, marginTop: 0 },
        { autoAlpha: 1, height: 'auto', marginTop: '0.75rem', duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [selectedSpecialistId]);

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

  const handleOpenChatbotClick = () => {
    handleClose();
    setTimeout(onOpenChatbot, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasReachedLimit || isOnCooldown) return;
    onAddSupportRequest();
    setIsSent(true);
    setTimeout(() => {
      handleClose();
    }, 3000); // Give user more time to read the confirmation
  };

  const hasReachedLimit = requestCount >= requestLimit;
  const isOnCooldown = !!cooldownTimeLeft;

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
          <h2 className="text-xl font-bold text-foreground">Contact Support</h2>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-9 w-9 rounded-full hover:bg-white/10">
            <XIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>

        <form onSubmit={handleSubmit}>
          <main className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {isSent ? (
              <div className="text-center p-6 flex flex-col items-center justify-center min-h-[250px] animate-fade-in">
                <AnimatedCheckIcon className="h-20 w-20" />
                <h3 className="text-2xl font-bold text-foreground mt-5">Request Sent!</h3>
                <p className="text-muted-foreground text-base mt-3 max-w-sm mx-auto">
                  Our support assistant has notified your chosen specialist. They will assist you within 2 hours.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
                  <ChatBubbleIcon className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-base text-foreground">Need instant help?</h4>
                    <p className="text-xs text-muted-foreground">Our AI, Zappy, can often resolve issues immediately.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleOpenChatbotClick} className="ml-auto flex-shrink-0 bg-black/20 border-primary/30 hover:bg-primary/20 h-8 text-xs">
                    <ChatBubbleIcon className="h-3 w-3 mr-2" />
                    Chat
                  </Button>
                </div>

                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="support-name" className="text-sm">Your Name</Label>
                  <Input id="support-name" type="text" placeholder="e.g., Jane Doe" required className="h-10 text-sm" />
                </div>

                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="support-issue" className="text-sm">Describe your issue</Label>
                  <Textarea id="support-issue" placeholder="Please provide as much detail as possible..." required rows={4} className="text-sm" />
                </div>

                <div className="grid w-full items-center gap-2">
                  <Label className="text-sm">Choose your support specialist</Label>
                  <p className="text-xs text-muted-foreground mb-2">Our experts will resolve your issue in under 2 hours.</p>
                  <div className="space-y-2">
                    {supportTeam.map((specialist) => (
                      <label key={specialist.id} htmlFor={specialist.id} className="block cursor-pointer">
                        <div className="flex items-center p-3 bg-black/30 rounded-xl border border-white/10 transition-all hover:bg-white/5 hover:border-white/20 has-[:checked]:bg-primary/20 has-[:checked]:border-primary">
                          <input
                            type="radio"
                            id={specialist.id}
                            name="specialist"
                            value={specialist.id}
                            onChange={(e) => setSelectedSpecialistId(e.target.value)}
                            className="h-4 w-4 mr-3 text-primary focus:ring-primary border-muted-foreground"
                            required
                          />
                          <span className="font-bold text-sm text-foreground">{specialist.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedSpecialist && (
                    <div ref={expertiseRef} className="p-3 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <p className="text-sm text-foreground/90">{selectedSpecialist.expertise}</p>
                    </div>
                  )}
                </div>
                {hasReachedLimit && (
                  <p className="text-center text-sm text-red-400 pt-2 font-medium">You have reached your weekly limit of {requestLimit} support requests.</p>
                )}
              </>
            )}
          </main>

          {!isSent && (
            <footer className="p-5 border-t border-white/10 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
              <Button variant="secondary" type="button" onClick={handleClose} size="lg" className="w-full sm:w-auto h-10 text-sm">
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={hasReachedLimit || isOnCooldown} className="w-full sm:w-auto min-w-[140px] h-10 text-sm">
                {isOnCooldown ? `On Cooldown (${cooldownTimeLeft})` : 'Submit Request'}
              </Button>
            </footer>
          )}
        </form>
      </div>
    </div>
  );
};

export default SupportFormModal;
