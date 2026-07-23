'use client';

import { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const titleId = 'modal-title';
  const prevActiveRef = useRef<Element | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      prevActiveRef.current = document.activeElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus first focusable element inside the dialog on open
      requestAnimationFrame(() => {
        if (dialogRef.current) {
          const first = dialogRef.current.querySelector<HTMLElement>(FOCUSABLE);
          if (first) first.focus();
          else dialogRef.current.focus();
        }
      });
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (prevActiveRef.current instanceof HTMLElement) {
        prevActiveRef.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="clip-corner w-full max-w-md border border-border/70 bg-[#050b0f] p-6 shadow-[0_0_60px_rgb(0_0_0_/_0.5)] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id={titleId} className="font-display text-lg font-bold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
