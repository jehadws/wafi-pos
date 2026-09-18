/**
 * popup-dialog.tsx
 *
 * Generic Dialog wrapper for POPUP row actions (Plan T2.6). Registered
 * popup components compose it instead of hand-rolling their own shell —
 * one visual pattern for every engine popup.
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ReactNode } from 'react';

export interface PopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible dialog title (always rendered). */
  title: string;
  /** Optional visually-hidden description. */
  description?: string;
  /** Extra classes for the content container (sizing). */
  className?: string;
  children: ReactNode;
}

export function PopupDialog({ open, onOpenChange, title, description, className, children }: PopupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{description ?? title}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default PopupDialog;
