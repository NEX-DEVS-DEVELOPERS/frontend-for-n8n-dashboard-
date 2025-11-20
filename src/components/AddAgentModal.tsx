
import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { Agent, ValidationStatus } from '../types';
import { XIcon, Loader2Icon, ShieldCheckIcon, AlertTriangleIcon, PlusCircleIcon } from './icons';
import { Button, Input, Label } from './ui';

interface AddAgentModalProps {
  onClose: () => void;
  onAddAgent: (agent: Omit<Agent, 'id' | 'status'>) => void;
}

const AddAgentModal: React.FC<AddAgentModalProps> = ({ onClose, onAddAgent }) => {
  const [name, setName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [schedule, setSchedule] = useState('');
  const [formError, setFormError] = useState('');

  const [validationStatus, setValidationStatus] = useState<ValidationStatus>(ValidationStatus.Idle);
  const [validationError, setValidationError] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const modal = modalRef.current;
    gsap.set(document.body, { overflow: 'hidden' });

    if (backdrop && modal) {
      gsap.set([backdrop, modal], { autoAlpha: 0 }); // Set initial state
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

  const handleWebhookUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebhookUrl(e.target.value);
    setValidationStatus(ValidationStatus.Idle);
    setValidationError(null);
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim() || !webhookUrl.startsWith('https://')) {
      setValidationStatus(ValidationStatus.Invalid);
      setValidationError('A valid HTTPS URL is required.');
      return;
    }

    setValidationStatus(ValidationStatus.Testing);
    setValidationError(null);

    try {
      const response = await fetch(webhookUrl, { method: 'OPTIONS' });
      if (response.ok) {
        setValidationStatus(ValidationStatus.Valid);
      } else {
        setValidationStatus(ValidationStatus.Invalid);
        setValidationError(`Test failed with status ${response.status}. Check URL and CORS policy.`);
      }
    } catch (error) {
      setValidationStatus(ValidationStatus.Invalid);
      if (error instanceof TypeError) {
        setValidationError('Test failed. This could be a CORS issue or a network problem. Check the browser console for details.');
      } else {
        setValidationError('An unexpected error occurred during the test.');
      }
    }
  };

  const handleAddAgent = () => {
    if (!name.trim()) {
      setFormError('Agent name is required.');
      return;
    }
    if (validationStatus !== ValidationStatus.Valid) {
      setFormError('Webhook URL must be successfully tested before adding.');
      return;
    }
    setFormError('');
    onAddAgent({ name, webhookUrl, schedule });
    setName('');
    setWebhookUrl('');
    setSchedule('');
    setValidationStatus(ValidationStatus.Idle);
    setValidationError(null);
    handleClose(); // Close modal on success
  };

  const getMinScheduleDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // At least 1 minute in the future
    return now.toISOString().slice(0, 16);
  }

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
          <h2 className="text-2xl font-bold text-foreground">Add New Agent</h2>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-9 w-9 rounded-full hover:bg-white/10">
            <XIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
        </header>

        <main className="p-6 space-y-5">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="agent-name" className="text-sm">Agent Name</Label>
            <Input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 'Daily Report'"
              className="h-10 text-sm"
            />
          </div>

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="webhook-url" className="text-sm">Webhook URL</Label>
            <div className="relative">
              <Input
                id="webhook-url"
                type="url"
                value={webhookUrl}
                onChange={handleWebhookUrlChange}
                placeholder="https://your-n8n-instance/webhook/..."
                className="pr-24 h-10 text-sm"
              />
              <Button
                onClick={handleTestConnection}
                disabled={validationStatus === ValidationStatus.Testing}
                variant="secondary"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 text-xs"
              >
                {validationStatus === ValidationStatus.Testing ? <Loader2Icon className="h-3 w-3 animate-spin" /> : 'Test'}
              </Button>
            </div>
          </div>

          {validationStatus !== ValidationStatus.Idle && (
            <div className="flex items-center gap-2 text-xs -mt-1 pl-1">
              {validationStatus === ValidationStatus.Testing && <>
                <Loader2Icon className="h-3 w-3 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Testing connection...</p>
              </>}
              {validationStatus === ValidationStatus.Valid && <>
                <ShieldCheckIcon className="h-4 w-4 text-green-400" />
                <p className="text-green-400 font-medium">Connection successful!</p>
              </>}
              {validationStatus === ValidationStatus.Invalid && <>
                <AlertTriangleIcon className="h-4 w-4 text-red-400" />
                <p className="text-red-400 font-medium">{validationError}</p>
              </>}
            </div>
          )}

          <div className="grid w-full items-center gap-2">
            <Label htmlFor="schedule-time" className="text-sm">Schedule (Optional)</Label>
            <Input
              id="schedule-time"
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              min={getMinScheduleDate()}
              title="Optional: Schedule a future run time for this agent."
              className="h-10 text-sm"
            />
            <p className="text-xs text-muted-foreground">Note: Scheduling only works while this browser tab is open.</p>
          </div>


          {formError && <p className="text-sm font-medium text-red-400 text-center bg-red-900/20 py-2 rounded-lg">{formError}</p>}
        </main>

        <footer className="p-5 border-t border-white/10 flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} size="lg" className="h-10 text-sm">
            Cancel
          </Button>
          <Button
            onClick={handleAddAgent}
            disabled={validationStatus !== ValidationStatus.Valid}
            size="lg"
            className="h-10 text-sm"
          >
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default AddAgentModal;
