import { useEffect } from 'react';

import { POS_OPTION_KEYS } from '@/constants/pos-options';

interface UsePOSShortcutsProps {
  options: Partial<SbPosOptions>;
  autoMerge: boolean;
  onPayment: () => void;
  onCancel: () => void;
  onShipping: () => void;
  onOrderType: () => void;
  onQuickSearch: () => void;
  onToggleMerge: () => void;
  onHold: () => void;
  onNote: () => void;
  onCreateCustomer: () => void;
}

export function matchesShortcut(e: KeyboardEvent, shortcut: string[] | string | null | undefined): boolean {
  if (!shortcut || (Array.isArray(shortcut) && shortcut.length === 0)) return false;
  const keys = Array.isArray(shortcut) ? shortcut : [shortcut];
  return keys.some((combo) => {
    const parts = combo.toLowerCase().split('+').map((p) => p.trim());
    const requireCtrl = parts.includes('ctrl');
    const requireAlt = parts.includes('alt');
    const requireShift = parts.includes('shift');
    const mainKey = parts.find((p) => !['ctrl', 'alt', 'shift'].includes(p)) ?? '';
    
    // Normalize numpad vs standard key
    const eventKey = e.key.toLowerCase();
    const eventCode = e.code ? e.code.toLowerCase() : '';
    const isMainMatch =
      eventKey === mainKey ||
      eventCode === mainKey ||
      (mainKey === 'enter' && eventCode === 'numpadenter') ||
      (mainKey === 'numpadenter' && (eventKey === 'enter' || eventCode === 'numpadenter'));

    return (
      e.ctrlKey === requireCtrl &&
      e.altKey === requireAlt &&
      e.shiftKey === requireShift &&
      isMainMatch
    );
  });
}

/**
 * True when the event target is an editable element — typed characters must
 * never trigger shortcuts (e.g. a bare "p" payment shortcut firing while the
 * cashier types in the barcode field).
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  // Check the contentEditable property directly — JSDOM doesn't implement isContentEditable
  const ce = target.contentEditable;
  if (ce && ce !== 'false' && ce !== 'inherit') return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * True when this matched shortcut must be ignored because the user is typing
 * in an editable field. Modifier combos (Ctrl/Alt) and function keys are
 * always intentional and stay active while typing.
 */
export function isTypingGuardedEvent(e: KeyboardEvent, combo: string): boolean {
  if (!isEditableTarget(e.target)) return false;
  if (/^f\d{1,2}$/i.test(e.key)) return false;
  const parts = combo.toLowerCase().split('+').map((p) => p.trim());
  return !(parts.includes('ctrl') || parts.includes('alt'));
}

/** matchesShortcut with the typing guard applied per configured combo. */
function matchesUnguarded(
  e: KeyboardEvent,
  shortcut: string[] | string | null | undefined,
  typingGuard: boolean,
): boolean {
  if (!matchesShortcut(e, shortcut)) return false;
  if (!typingGuard) return true;
  if (typeof shortcut === 'string') return !isTypingGuardedEvent(e, shortcut);
  return (shortcut ?? []).some((combo) => !isTypingGuardedEvent(e, combo));
}

export function usePOSShortcuts({
  options = {},
  autoMerge,
  onPayment,
  onCancel,
  onShipping,
  onOrderType,
  onQuickSearch,
  onToggleMerge,
  onHold,
  onNote,
  onCreateCustomer,
}: UsePOSShortcutsProps) {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const o = options || {};
      const typingGuard = isEditableTarget(e.target);

      // Payment (configured or F4 / Ctrl+Enter)
      if (
        matchesUnguarded(e, o[POS_OPTION_KEYS.keyboardPayment], typingGuard) ||
        (e.key === 'F4' && !e.ctrlKey && !e.altKey)
      ) {
        e.preventDefault();
        onPayment();
      } else if (matchesUnguarded(e, o[POS_OPTION_KEYS.keyboardCancelOrder], typingGuard)) {
        e.preventDefault();
        onCancel();
      } else if (matchesUnguarded(e, o[POS_OPTION_KEYS.keyboardShipping], typingGuard)) {
        e.preventDefault();
        onShipping();
      } else if (matchesUnguarded(e, o[POS_OPTION_KEYS.keyboardOrderType], typingGuard)) {
        e.preventDefault();
        onOrderType();
      } else if (matchesUnguarded(e, o[POS_OPTION_KEYS.keyboardQuickSearch], typingGuard)) {
        e.preventDefault();
        onQuickSearch();
      } else if (matchesUnguarded(e, o[POS_OPTION_KEYS.keyboardToggleMerge], typingGuard)) {
        e.preventDefault();
        onToggleMerge();
      } else if (matchesUnguarded(e, o[POS_OPTION_KEYS.keyboardHoldOrder], typingGuard)) {
        e.preventDefault();
        onHold();
      } else if (matchesUnguarded(e, o[POS_OPTION_KEYS.keyboardNote], typingGuard)) {
        e.preventDefault();
        onNote();
      } else if (matchesUnguarded(e, o[POS_OPTION_KEYS.keyboardCreateCustomer], typingGuard)) {
        e.preventDefault();
        onCreateCustomer();
      } else if (
        matchesUnguarded(e, o[POS_OPTION_KEYS.keyboardFullscreen], typingGuard) ||
        e.key === 'F11'
      ) {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [options, autoMerge, onPayment, onCancel, onShipping, onOrderType, onQuickSearch, onToggleMerge, onHold, onNote, onCreateCustomer]);
}
