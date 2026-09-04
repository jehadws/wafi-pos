import { useTranslation } from '@/lib/i18n';
import { ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { StepIndicator } from './components/step-indicator';
import { STEPS } from './config';
import { CompletePage } from './steps/complete';
import { ConfigurationPage } from './steps/configuration';
import { DatabasePage } from './steps/database';
import { WelcomePage } from './steps/welcome';

export default function SetupWizard({
    store_name,
    languages = {},
    default_lang = 'en',
    initial_step = 'welcome',
}: {
    store_name?: string;
    languages?: Record<string, string>;
    default_lang?: string;
    initial_step?: string;
}) {
    const { t } = useTranslation();

    // Derive the starting hash from the server-supplied initial_step prop so the
    // wizard opens at the right position when the user is resuming a prior session.
    const initialHash = STEPS.find((s) => s.key === initial_step)?.hash ?? '#/';

    const [currentHash, setCurrentHash] = useState(window.location.hash || initialHash);

    // Sync the URL hash to the server-determined start position on first load when
    // there's no existing hash in the URL (i.e. the user arrived fresh).
    useEffect(() => {
        if (!window.location.hash) {
            window.location.hash = initialHash;
        }
    }, [initialHash]);

    useEffect(() => {
        const handleHashChange = () => setCurrentHash(window.location.hash || '#/');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Memoized so child components that list goTo in their useEffect deps array
    // don't re-fire every time the parent re-renders.
    const goTo = useCallback((hash: string) => {
        window.location.hash = hash;
    }, []);

    const getStepId = () => {
        if (currentHash.includes('database')) return 1;
        if (currentHash.includes('configuration')) return 2;
        if (currentHash.includes('complete')) return 3;
        return 0; // welcome
    };

    const current = getStepId();

    return (
        <div className="flex min-h-screen items-start justify-center bg-zinc-950 p-8">
            <div className="grid w-full max-w-[860px] grid-cols-[220px_1fr] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
                {/* Sidebar */}
                <aside className="flex flex-col border-r border-zinc-800 bg-zinc-950 p-5">
                    {/* Logo */}
                    <div className="mb-8 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
                            <ShieldCheck size={14} className="text-white" />
                        </div>
                        <span className="text-[14px] font-semibold tracking-tight text-zinc-100">{t('Subul')}</span>
                    </div>

                    {/* Steps */}
                    <ul className="flex flex-col gap-0.5">
                        {STEPS.map((step) => (
                            <StepIndicator
                                key={step.id}
                                step={step}
                                current={current}
                                onClick={() => {
                                    // Allow navigating to completed steps
                                    if (step.id <= current) goTo(step.hash);
                                }}
                            />
                        ))}
                    </ul>
                </aside>

                {/* Main content */}
                <main className="flex min-h-[540px] flex-col p-10">
                    {current === 0 && <WelcomePage onNext={() => goTo('#/database')} languages={languages} default_lang={default_lang} />}
                    {current === 1 && <DatabasePage onBack={() => goTo('#/')} onNext={() => goTo('#/configuration')} />}
                    {current === 2 && (
                        <ConfigurationPage
                            onBack={() => goTo('#/database')}
                            onNext={() => goTo('#/complete')}
                            languages={languages}
                            default_lang={default_lang}
                        />
                    )}
                    {current === 3 && <CompletePage storeName={store_name} />}
                </main>
            </div>
        </div>
    );
}
