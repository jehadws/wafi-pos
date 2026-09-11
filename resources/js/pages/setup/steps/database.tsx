import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { FormField } from '../components/form-field';
import { StepActions } from '../components/step-actions';
import { STEPS } from '../config';

interface DatabaseForm {
  database_driver: string;
  hostname: string;
  database_port: string;
  database_name: string;
  username: string;
  password: string;
  database_prefix: string;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface DatabasePageProps {
  onBack: () => void;
  onNext: () => void;
}

const SUBMIT_FLAG_KEY = 'setup_db_submitted';

export function DatabasePage({ onBack, onNext }: DatabasePageProps) {
  const { t } = useTranslation();

  const [data, setData] = useState<DatabaseForm>({
    database_driver: 'mysql',
    hostname: '127.0.0.1',
    database_port: '3306',
    database_name: '',
    username: '',
    password: '',
    database_prefix: 'sb_',
  });

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testSteps, setTestSteps] = useState<{ label: string; status: 'pending' | 'ok' | 'error' }[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  // FIX: if the connectivity check genuinely can't confirm success (e.g. the
  // backend's response shape doesn't match what we expect), give the user a
  // manual way forward instead of a dead end.
  const [showManualContinue, setShowManualContinue] = useState(false);

  // Prevents the resume-on-mount effect from running a second concurrent
  // poll loop (e.g. React StrictMode double-invoke).
  const checkingRef = useRef(false);

  /**
   * The back-button loop was caused by an auto-advance useEffect that called
   * onNext() whenever the DB connection was reachable. When the user pressed
   * Back from Configuration → Database, that useEffect re-fired on mount,
   * detected the DB was still reachable, and immediately jumped forward again.
   *
   * The fix: remove the auto-advance entirely. The user must explicitly click
   * "Save Settings" to test the connection and proceed. This makes navigation
   * predictable and allows reconfiguration.
   */

  /**
   * FIX: this component no longer touches window.location.hash or
   * sessionStorage['setup_wizard_step'] directly. SetupWizard's goTo() is
   * the single owner of navigation state — calling both goTo() (via onNext)
   * AND mutating the hash here raced against the async native `hashchange`
   * event and could leave the sidebar/step index briefly desynced from the
   * URL. DatabasePage now only ever calls onBack()/onNext().
   */

  const handleDataChange = (field: keyof DatabaseForm, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (data.database_driver === 'mysql') {
      if (!data.hostname.trim()) newErrors.hostname = t('The hostname field is required.');
      if (!data.database_port.trim()) newErrors.database_port = t('The port field is required.');
      else if (isNaN(Number(data.database_port))) newErrors.database_port = t('The port must be a number.');
      if (!data.database_name.trim()) newErrors.database_name = t('The database name field is required.');
      if (!data.username.trim()) newErrors.username = t('The username field is required.');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIX: accept a wider range of "success" response shapes instead of only
  // { status: 'success' } or { data: { message } }. If your backend uses a
  // different contract (e.g. { success: true }), this still recognizes it,
  // so the wizard doesn't stall on a shape mismatch alone.
  const isSuccessPayload = (json: any): boolean => {
    if (!json) return false;
    if (json.status === 'success') return true;
    if (json.success === true) return true;
    if (json.data?.message) return true;
    if (json.data?.status === 'success') return true;
    return false;
  };

  const checkDatabaseConnection = async (retries = 10, delayMs = 600, onAttempt?: (attempt: number, total: number) => void): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      onAttempt?.(i + 1, retries);
      try {
        const res = await fetch('/api/setup/check-database', {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);

          console.debug('[setup] check-database response', json);
          if (isSuccessPayload(json)) {
            return true;
          }
        }
      } catch {
        // Server might be restarting (env write triggered a reload), keep polling.
      }
    }
    return false;
  };

  const clearSubmitFlag = () => sessionStorage.removeItem(SUBMIT_FLAG_KEY);

  useEffect(() => {
    const wasSubmitted = sessionStorage.getItem(SUBMIT_FLAG_KEY);
    if (!wasSubmitted || checkingRef.current) return;

    checkingRef.current = true;
    setProcessing(true);
    setTestStatus('testing');
    setShowManualContinue(false);
    setTestSteps([{ label: t('Verifying database connection after reload...'), status: 'pending' }]);

    checkDatabaseConnection(10, 600, (attempt, total) => {
      setTestSteps([{ label: `${t('Verifying database connection after reload...')} (${attempt}/${total})`, status: 'pending' }]);
    }).then((isConnected) => {
      clearSubmitFlag();
      checkingRef.current = false;
      if (isConnected) {
        setTestSteps([{ label: t('Connecting and saving configuration'), status: 'ok' }]);
        setTestStatus('success');
        onNext();
      } else {
        setTestSteps([{ label: t('Connecting and saving configuration'), status: 'error' }]);
        setTestStatus('error');
        setErrorMessage(t('Could not establish database connection after restart. Please check your credentials.'));
        setShowManualContinue(true);
      }
      setProcessing(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTestAndContinue = async () => {
    if (processing) return; // prevent double-submit / re-entrant calls
    if (!validate()) return;

    sessionStorage.setItem(SUBMIT_FLAG_KEY, 'true');

    setProcessing(true);
    setTestStatus('testing');
    setErrorMessage('');
    setErrors({});
    setShowManualContinue(false);

    setTestSteps([{ label: t('Connecting and saving configuration'), status: 'pending' }]);

    let response: Response | undefined;
    try {
      response = await fetch('/api/setup/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (postError: any) {
      // A genuine network failure (fetch never got a response at all) — this
      // is the expected symptom when the .env write causes the dev server
      // to restart mid-request. Keep polling for the server to come back.
      const isLikelyRestart = /fetch|network|load failed|connection|unexpected/i.test(postError?.message ?? '');
      if (!isLikelyRestart) {
        clearSubmitFlag();
        setTestSteps([{ label: t('Connecting and saving configuration'), status: 'error' }]);
        setTestStatus('error');
        setErrorMessage(postError?.message || t('An unexpected error occurred.'));
        setProcessing(false);
        return;
      }
      response = undefined;
    }

    if (response) {
      const result = await response.json().catch(() => null);

      console.debug('[setup] database POST response', response.status, result);

      if (!response.ok) {
        if (result?.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(result.errors)) {
            fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
          }
          setErrors(fieldErrors);
        }

        // FIX: every non-ok response now stops here and surfaces the real
        // error, instead of only 403s doing so while everything else
        // silently fell through into a doomed 6s polling loop.
        clearSubmitFlag();
        setTestSteps([{ label: t('Connecting and saving configuration'), status: 'error' }]);
        setTestStatus('error');
        setErrorMessage(
          result?.message ||
            (result?.errors
              ? t('Please correct the highlighted fields and try again.')
              : t('The server rejected the request. Please check your settings and try again.')),
        );
        setProcessing(false);
        return;
      }
    }

    // Only reached when the POST genuinely succeeded, or we suspect a
    // server restart and want to confirm the connection came back up.
    setTestSteps([{ label: t('Verifying database connection'), status: 'pending' }]);
    const isConnected = await checkDatabaseConnection(10, 600, (attempt, total) => {
      setTestSteps([{ label: `${t('Verifying database connection')} (${attempt}/${total})`, status: 'pending' }]);
    });

    clearSubmitFlag();

    if (isConnected) {
      setTestSteps([{ label: t('Connecting and saving configuration'), status: 'ok' }]);
      setTestStatus('success');
      onNext();
    } else {
      setTestSteps([{ label: t('Connecting and saving configuration'), status: 'error' }]);
      setTestStatus('error');
      setErrorMessage(t('Could not establish database connection. Please verify your credentials.'));
      setShowManualContinue(true);
    }

    setProcessing(false);
  };

  return (
    <>
      <p className="mb-1 text-[11px] font-semibold tracking-widest text-violet-400 uppercase">{t('Step 2 — Database')}</p>
      <h1 className="mb-1.5 text-[22px] font-semibold tracking-tight text-zinc-100">{t('Connect your database')}</h1>
      <p className="mb-6 text-[13px] leading-relaxed text-zinc-500">
        {t('Enter your database credentials. Subul will test the connection before continuing.')}
      </p>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-400">
          <p>{errorMessage}</p>
          {showManualContinue && (
            <button
              type="button"
              className="mt-2 text-[12px] font-medium text-red-300 underline underline-offset-2"
              onClick={() => {
                clearSubmitFlag();
                onNext();
              }}
            >
              {t('The database looks connected — continue anyway')}
            </button>
          )}
        </div>
      )}

      <div className="grid flex-1 grid-cols-2 content-start gap-4">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label className="text-[12px] font-medium text-zinc-400">{t('Database connection')}</Label>
          <select
            className="flex h-9 w-full rounded-md border border-zinc-800 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            value={data.database_driver}
            onChange={(e) => handleDataChange('database_driver', e.target.value)}
          >
            <option value="mysql" className="bg-zinc-900">
              {t('MySQL / MariaDB')}
            </option>
            <option value="sqlite" className="bg-zinc-900">
              {t('SQLite')}
            </option>
          </select>
        </div>

        {data.database_driver === 'mysql' && (
          <>
            <FormField
              label="Database host"
              placeholder="127.0.0.1"
              containerClassName="col-span-2"
              className="font-mono text-[12px]"
              value={data.hostname}
              onChange={(e) => handleDataChange('hostname', e.target.value)}
              error={errors.hostname}
            />
            <FormField
              label="Port"
              placeholder="3306"
              className="font-mono text-[12px]"
              value={data.database_port}
              onChange={(e) => handleDataChange('database_port', e.target.value)}
              error={errors.database_port}
            />
            <FormField
              label="Database name"
              placeholder="subul_v4"
              className="font-mono text-[12px]"
              value={data.database_name}
              onChange={(e) => handleDataChange('database_name', e.target.value)}
              error={errors.database_name}
            />
            <FormField
              label="Username"
              placeholder="root"
              className="font-mono text-[12px]"
              value={data.username}
              onChange={(e) => handleDataChange('username', e.target.value)}
              error={errors.username}
            />
            <FormField
              label="Password"
              type="password"
              placeholder="••••••••"
              className="font-mono text-[12px]"
              value={data.password}
              onChange={(e) => handleDataChange('password', e.target.value)}
              error={errors.password}
            />
          </>
        )}

        {data.database_driver === 'sqlite' && (
          <div className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-[12px] text-zinc-400">
            {t('Make sure Sqlite module is available for PHP. Your database will be located on the database directory.')}
          </div>
        )}

        <FormField
          label="Database Prefix"
          placeholder="sb_"
          hint="Provide the database prefix."
          containerClassName="col-span-2"
          className="font-mono text-[12px]"
          value={data.database_prefix}
          onChange={(e) => handleDataChange('database_prefix', e.target.value)}
          error={errors.database_prefix}
        />
      </div>

      {testStatus !== 'idle' && (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          {testSteps.map((step) => (
            <div key={step.label} className="flex items-center gap-2.5 text-[12px]">
              <span
                className={cn(
                  'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px]',
                  step.status === 'ok' && 'bg-emerald-500/20 text-emerald-400',
                  step.status === 'error' && 'bg-red-500/20 text-red-400',
                  step.status === 'pending' && 'bg-violet-500/20 text-violet-400',
                )}
              >
                {step.status === 'ok' ? '✓' : step.status === 'error' ? '✗' : '⋯'}
              </span>
              <span className="text-zinc-400">{step.label}</span>
            </div>
          ))}
        </div>
      )}

      <StepActions
        current={1}
        total={STEPS.length}
        onBack={onBack}
        onNext={handleTestAndContinue}
        nextLabel={t('Save Settings')}
        nextLoading={processing}
      />
    </>
  );
}
