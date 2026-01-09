import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type RTLContextType = {
    isRTL: boolean;
};

const RTLContext = createContext<RTLContextType>({ isRTL: false });

export function RTLProvider({ children, locale }: { children: ReactNode; locale: string }) {
    const [isRTL, setIsRTL] = useState(false);

    useEffect(() => {
        // Check if current locale is Arabic
        const rtl = locale === 'ar';
        setIsRTL(rtl);

        // Update document direction
        document.documentElement.dir = rtl ? 'rtl' : 'ltr';

        // Add/remove RTL class on body
        if (rtl) {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }
    }, [locale]);

    return <RTLContext.Provider value={{ isRTL }}>{children}</RTLContext.Provider>;
}

export function useRTL() {
    return useContext(RTLContext);
}
