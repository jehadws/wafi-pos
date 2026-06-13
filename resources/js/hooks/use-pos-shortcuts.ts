import { useEffect } from 'react';

interface UsePOSShortcutsProps {
  options: any;
  autoMerge: boolean;
  onPayment: () => void;
  onCancel: () => void;
  onShipping: () => void;
  onOrderType: () => void;
  onQuickSearch: () => void;
  onToggleMerge: () => void;
}

export function usePOSShortcuts({
  options,
  autoMerge,
  onPayment,
  onCancel,
  onShipping,
  onOrderType,
  onQuickSearch,
  onToggleMerge,
}: UsePOSShortcutsProps) {
  useEffect(() => {
    const matchesShortcut = (e: KeyboardEvent, shortcut: string[] | string | null | undefined): boolean => {
      if (!shortcut || (Array.isArray(shortcut) && shortcut.length === 0)) return false;
      const keys = Array.isArray(shortcut) ? shortcut : [shortcut];
      return keys.some((combo) => {
        const parts = combo.toLowerCase().split('+').map((p) => p.trim());
        const requireCtrl = parts.includes('ctrl');
        const requireAlt = parts.includes('alt');
        const requireShift = parts.includes('shift');
        const mainKey = parts.find((p) => !['ctrl', 'alt', 'shift'].includes(p)) ?? '';
        return (
          e.ctrlKey === requireCtrl &&
          e.altKey === requireAlt &&
          e.shiftKey === requireShift &&
          e.key.toLowerCase() === mainKey
        );
      });
    };

    const handleKeydown = (e: KeyboardEvent) => {
      const o = options;
      if (matchesShortcut(e, o.ns_jgrem_keyboard_payment)) {
        e.preventDefault();
        onPayment();
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_cancel_order)) {
        e.preventDefault();
        onCancel();
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_shipping)) {
        e.preventDefault();
        onShipping();
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_order_type)) {
        e.preventDefault();
        onOrderType();
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_quick_search)) {
        e.preventDefault();
        onQuickSearch();
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_toggle_merge)) {
        e.preventDefault();
        onToggleMerge();
      } else if (matchesShortcut(e, o.ns_jgrem_keyboard_fullscreen)) {
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
  }, [options, autoMerge, onPayment, onCancel, onShipping, onOrderType, onQuickSearch, onToggleMerge]);
}
