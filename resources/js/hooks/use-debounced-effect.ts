import { useEffect } from 'react';

export function useDebouncedEffect(callback: () => void, deps: any[], delay: number) {
  useEffect(() => {
    const handler = setTimeout(() => callback(), delay);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
