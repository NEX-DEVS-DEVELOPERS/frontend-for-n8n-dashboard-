import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { XIcon, DownloadIcon, CheckCircleIcon } from './icons';
import { Button, cn } from './ui';

interface InvoiceDetailsModalProps {
    invoice: {
        id: string;
        date: string;
        amount: string;
        planName: string;
        status: string;
    };
    onClose: () => void;
    onDownload: () => void;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ invoice, onClose, onDownload }) => {
    const backdropRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const backdrop = backdropRef.current;
        const modal = modalRef.current;
        gsap.set(document.body, { overflow: 'hidden' });

        if (backdrop && modal) {
            gsap.set([backdrop, modal], { autoAlpha: 0 });
            gsap.to(backdrop, { autoAlpha: 1, duration: 0.4 });
            gsap.fromTo(
                modal,
                { scale: 0.95, autoAlpha: 0, y: 20 },
                { autoAlpha: 1, scale: 1, y: 0, duration: 0.4, ease: 'expo.out', delay: 0.1 }
            );
        }

        return () => {
            gsap.set(document.body, { overflow: 'auto' });
        };
    }, []);

    const handleClose = () => {
        const backdrop = backdropRef.current;
        const modal = modalRef.current;
        if (backdrop && modal) {
            const tl = gsap.timeline({ onComplete: onClose });
            tl.to(modal, { autoAlpha: 0, scale: 0.95, y: 10, duration: 0.3, ease: 'expo.in' })
                .to(backdrop, { autoAlpha: 0, duration: 0.3 }, "<");
        } else {
            onClose();
        }
    };

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={handleClose}
        >
            <div
                ref={modalRef}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Invoice Details</h2>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{invoice.id}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-full hover:bg-white/10">
                        <XIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-3 border border-green-500/20">
                            <CheckCircleIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-foreground tracking-tight">{invoice.amount}</h3>
                        <span className="text-xs font-bold text-green-500 uppercase tracking-wider mt-2 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            Paid Successfully
                        </span>
                    </div>

                    <div className="space-y-3 border-t border-white/5 pt-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Billing Date</span>
                            <span className="font-medium text-foreground">{invoice.date}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Plan</span>
                            <span className="font-medium text-foreground">{invoice.planName} Subscription</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Payment Method</span>
                            <span className="font-medium text-foreground flex items-center gap-2">
                                •••• 4242 <span className="text-xs text-muted-foreground bg-white/5 px-1.5 rounded">VISA</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/5 flex gap-3">
                    <Button variant="outline" onClick={handleClose} className="flex-1 border-white/10 hover:bg-white/5">
                        Close
                    </Button>
                    <Button onClick={onDownload} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailsModal;
