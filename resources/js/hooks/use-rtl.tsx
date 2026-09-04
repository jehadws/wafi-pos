import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { isRTLLocale } from '@/lib/i18n/direction';

type RTLContextType = {
    isRTL: boolean;
};

const RTLContext = createContext<RTLContextType>({ isRTL: false });

export function RTLProvider({ children, locale }: { children: ReactNode; locale: string }) {
    const [isRTL, setIsRTL] = useState(() => isRTLLocale(locale));

    useEffect(() => {
        const rtl = isRTLLocale(locale);
        setIsRTL(rtl);

        // The `dir` attribute on <html> is the single source of truth for the
        // document direction. The `rtl:` Tailwind variant keys off this too
        // (see @custom-variant rtl in resources/css/app.css).
        document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    }, [locale]);

    return <RTLContext.Provider value={{ isRTL }}>{children}</RTLContext.Provider>;
}

export function useRTL() {
    return useContext(RTLContext);
}
