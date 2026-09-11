import { usePOS } from '@/hooks/usePOS';
import { useEffect } from 'react';

const BEFORE_UNLOAD_MESSAGE = 'Some products have been added to the cart. Would you like to discard this order?';

/**
 * Warns the user before closing/navigating away when the cart has items.
 * Registered in React lifecycle so cleanup runs on unmount (Strict Mode safe).
 */
export function usePosBeforeUnload() {
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (usePOS.getState().products.length > 0) {
        event.preventDefault();
        event.returnValue = BEFORE_UNLOAD_MESSAGE;
        return BEFORE_UNLOAD_MESSAGE;
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
}
