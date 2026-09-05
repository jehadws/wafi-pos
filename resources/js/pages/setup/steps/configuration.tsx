import { useTranslation } from '@/lib/i18n';
import React, { useState } from 'react';
import { FormField } from '../components/form-field';
import { StepActions } from '../components/step-actions';
import { STEPS } from '../config';

interface ConfigForm {
    sb_store_name: string;
    admin_username: string;
    admin_email: string;
    password: string;
    confirm_password: string;
    language: string;
}

interface ConfigurationPageProps {
    onBack: () => void;
    onNext: (username: string) => void;
    languages?: Record<string, string>;
    default_lang?: string;
}

export function ConfigurationPage({ onBack, onNext, default_lang = 'en' }: ConfigurationPageProps) {
    const { t } = useTranslation();

    const [data, setData] = useState<ConfigForm>({
        sb_store_name: '',
        admin_username: '',
        admin_email: '',
        password: '',
        confirm_password: '',
        language: default_lang,
    });

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorMessage, setErrorMessage] = useState('');

    const handleDataChange = (field: keyof ConfigForm, value: string) => {
        setData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!data.sb_store_name.trim()) newErrors.sb_store_name = t('The store name field is required.');
        if (!data.admin_username.trim()) newErrors.admin_username = t('The username field is required.');
        else if (data.admin_username.trim().length < 5) newErrors.admin_username = t('The username must be at least 5 characters.');

        if (!data.admin_email.trim()) newErrors.admin_email = t('The email field is required.');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.admin_email)) newErrors.admin_email = t('Please provide a valid email address.');

        if (!data.password) newErrors.password = t('The password field is required.');
        else if (data.password.length < 6) newErrors.password = t('The password must be at least 6 characters.');

        if (!data.confirm_password) newErrors.confirm_password = t('The confirm password field is required.');
        else if (data.password !== data.confirm_password) newErrors.confirm_password = t('The passwords do not match.');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setProcessing(true);
        setErrorMessage('');

        try {
            const response = await fetch('/api/setup/configuration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.errors) {
                    const fieldErrors: Record<string, string> = {};
                    for (const [field, messages] of Object.entries(result.errors)) {
                        fieldErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
                    }
                    setErrors(fieldErrors);
                }
                throw new Error(result.message || t('An error occurred during application configuration.'));
            }

            if (result.status !== 'failed' && result.status !== 'error') {
                onNext(data.admin_username);
            } else {
                throw new Error(result.message || t('An error occurred during application configuration.'));
            }
        } catch (error: any) {
            if (!errors || Object.keys(errors).length === 0) {
                setErrorMessage(error.message);
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <p className="mb-1 text-[11px] font-semibold tracking-widest text-violet-400 uppercase">{t('Step 3 — Configuration')}</p>
            <h1 className="mb-1.5 text-[22px] font-semibold tracking-tight text-zinc-100">{t('Application Configuration')}</h1>
            <p className="mb-6 text-[13px] leading-relaxed text-zinc-500">{t('Configure your store details and create an administrator account.')}</p>

            {errorMessage && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-400">{errorMessage}</div>
            )}

            <div className="grid flex-1 grid-cols-2 content-start gap-x-4 gap-y-5">
                <div className="col-span-2">
                    <h3 className="mb-3 border-b border-zinc-800 pb-2 text-sm font-medium text-zinc-300">{t('Store Details')}</h3>
                </div>

                <FormField
                    label="Store Name"
                    placeholder="e.g. My Store"
                    containerClassName="col-span-2"
                    value={data.sb_store_name}
                    onChange={(e) => handleDataChange('sb_store_name', e.target.value)}
                    error={errors.sb_store_name}
                />

                <div className="col-span-2 mt-2">
                    <h3 className="mb-3 border-b border-zinc-800 pb-2 text-sm font-medium text-zinc-300">{t('Administrator Account')}</h3>
                </div>

                <FormField
                    label="Username"
                    placeholder="admin"
                    className="font-mono text-[12px]"
                    value={data.admin_username}
                    onChange={(e) => handleDataChange('admin_username', e.target.value)}
                    error={errors.admin_username}
                />

                <FormField
                    label="Email address"
                    type="email"
                    placeholder="admin@yourstore.com"
                    value={data.admin_email}
                    onChange={(e) => handleDataChange('admin_email', e.target.value)}
                    error={errors.admin_email}
                />

                <FormField
                    label="Password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={data.password}
                    onChange={(e) => handleDataChange('password', e.target.value)}
                    error={errors.password}
                />

                <FormField
                    label="Confirm password"
                    type="password"
                    placeholder="Repeat password"
                    value={data.confirm_password}
                    onChange={(e) => handleDataChange('confirm_password', e.target.value)}
                    error={errors.confirm_password}
                />
            </div>

            <StepActions
                current={2}
                total={STEPS.length}
                onBack={onBack}
                onNext={handleSubmit}
                nextLabel={t('Finish Installation')}
                nextLoading={processing}
            />
        </>
    );
}
