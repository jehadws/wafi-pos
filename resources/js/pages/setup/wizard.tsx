import { useTranslation } from '@/lib/i18n';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { StepIndicator } from './components/step-indicator';
import { STEPS } from './config';
import { useWizardNavigation } from './hooks/useWizardNavigation';
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

  const initialHash = STEPS.find((s) => s.key === initial_step)?.hash ?? '#/';

  const { currentStep, goTo } = useWizardNavigation(initialHash);

  const [adminUsername, setAdminUsername] = useState('');

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
                current={currentStep}
                onClick={() => {
                  goTo(step.hash);
                }}
              />
            ))}
          </ul>
        </aside>

        {/* Main content */}
        <main className="flex min-h-[540px] flex-col p-10">
          {currentStep === 0 && <WelcomePage onNext={() => goTo('#/database')} languages={languages} default_lang={default_lang} />}
          {currentStep === 1 && <DatabasePage onBack={() => goTo('#/')} onNext={() => goTo('#/configuration')} />}
          {currentStep === 2 && (
            <ConfigurationPage
              onBack={() => goTo('#/database')}
              onNext={(username) => {
                setAdminUsername(username);
                goTo('#/complete');
              }}
              languages={languages}
              default_lang={default_lang}
            />
          )}
          {currentStep === 3 && <CompletePage storeName={store_name} adminUsername={adminUsername} />}
        </main>
      </div>
    </div>
  );
}
