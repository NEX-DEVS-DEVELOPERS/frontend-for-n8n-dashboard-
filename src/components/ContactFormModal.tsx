
import React, { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import { XIcon } from './icons';
import { Button, Input, Label, Textarea } from './ui';

interface ContactFormModalProps {
  onClose: () => void;
}

const ContactFormModal: React.FC<ContactFormModalProps> = ({ onClose }) => {
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
    }, 1500); // Close modal after showing success message
  };

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
          <h2 className="text-xl font-bold text-foreground">Contact Us</h2>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-9 w-9 rounded-full hover:bg-white/10">
            <XIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>

        <form onSubmit={handleSubmit}>
          <main className="p-6 space-y-5">
            {isSent ? (
              <div className="text-center p-6">
                <h3 className="text-xl font-bold text-green-400">Message Sent!</h3>
                <p className="text-foreground/90 text-sm mt-2">Thank you for reaching out. We'll get back to you shortly.</p>
              </div>
            ) : (
              <>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="contact-name" className="text-sm">Name</Label>
                  <Input id="contact-name" type="text" placeholder="Your Name" required className="h-10 text-sm" />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="contact-email" className="text-sm">Email</Label>
                  <Input id="contact-email" type="email" placeholder="your.email@example.com" required className="h-10 text-sm" />
                </div>
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="contact-message" className="text-sm">Message</Label>
                  <Textarea id="contact-message" placeholder="How can we help you?" required rows={4} className="text-sm" />
                </div>
              </>
            )}
          </main>

          {!isSent && (
            <footer className="p-5 border-t border-white/10 flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={handleClose} size="lg" className="h-10 text-sm">
                Cancel
              </Button>
              <Button type="submit" size="lg" className="h-10 text-sm">
                Send Message
              </Button>
            </footer>
          )}
        </form>
      </div>
    </div>
  );
};

export default ContactFormModal;
