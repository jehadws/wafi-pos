import { useCallback, useEffect, useState } from 'react';
import { HASH_TO_STEP } from '../config';

/**
 * Encapsulates all hash-routing, sessionStorage, and step-index logic for the
 * setup wizard. The UI component only calls `goTo(hash)` and reads `currentStep`.
 */
export function useWizardNavigation(initialHash: string) {
    const [currentHash, setCurrentHash] = useState(() => {
        // Prefer sessionStorage (survives server-restart page reloads) over the
        // raw URL hash (which may still point to the old step after a refresh).
        const saved = typeof window !== 'undefined' ? sessionStorage.getItem('setup_wizard_step') : null;
        return saved || initialHash;
    });

    // On mount: sync URL hash to our resolved state without triggering a
    // navigation/reload that would race with React state.
    useEffect(() => {
        const target = sessionStorage.getItem('setup_wizard_step') || initialHash;
        if (window.location.hash !== target) {
            window.location.hash = target;
        }
        setCurrentHash(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount only

    // Keep state in sync when the user presses the browser back/forward buttons.
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash || '#/';
            sessionStorage.setItem('setup_wizard_step', hash);
            setCurrentHash(hash);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Memoized so child components that list goTo in their useEffect deps array
    // don't re-fire every time the parent re-renders.
    const goTo = useCallback((hash: string) => {
        sessionStorage.setItem('setup_wizard_step', hash);
        if (window.location.hash !== hash) {
            window.location.hash = hash;
        }
        setCurrentHash(hash);
    }, []);

    /** The 0-based index of the current step (maps directly to STEPS[i].id). */
    const currentStep = HASH_TO_STEP.get(currentHash) ?? 0;

    return { currentStep, currentHash, goTo };
}
