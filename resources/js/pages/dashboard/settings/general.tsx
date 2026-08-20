import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import { Loader2, Save } from 'lucide-react';
import { useGeneralSettings } from '@/components/settings/general/use-general-settings';
import { IdentificationTab } from '@/components/settings/general/identification-tab';
import { CurrencyTab } from '@/components/settings/general/currency-tab';
import { DateTab } from '@/components/settings/general/date-tab';
import { RegistrationTab } from '@/components/settings/general/registration-tab';
import type { GeneralSettingsPayload, GeneralSettingsOptions } from '@/components/settings/general/types';

export default function GeneralSettingsPage() {
    const { options, settings } = usePage<{ options: GeneralSettingsOptions; settings: GeneralSettingsPayload }>().props;
    const [tab, setTab] = useState<'identification' | 'currency' | 'date' | 'registration'>('identification');
    const { t } = useTranslation();
    const { form, isPending, handleSave } = useGeneralSettings(settings);

    return (
        <AppLayout>
            <div className="p-6">
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-xl border">
                        <div className="relative p-6 md:p-8">
                            <h1 className="text-2xl font-semibold">{t('General Settings')}</h1>
                            <p className="text-muted-foreground text-sm">{t('Configure the general settings.')}</p>

                            <div className="mt-4">
                                <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                                    <TabsList className="flex w-full max-w-xl justify-start">
                                        <TabsTrigger value="identification">{t('Identification')}</TabsTrigger>
                                        <TabsTrigger value="currency">{t('Currency')}</TabsTrigger>
                                        <TabsTrigger value="date">{t('Date & Time')}</TabsTrigger>
                                        <TabsTrigger value="registration">{t('Registration')}</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                                <TabsContent value="identification" className="mt-6">
                                    <IdentificationTab form={form} options={options} />
                                </TabsContent>

                                <TabsContent value="currency" className="mt-6">
                                    <CurrencyTab form={form} options={options} />
                                </TabsContent>

                                <TabsContent value="date" className="mt-6">
                                    <DateTab form={form} options={options} />
                                </TabsContent>

                                <TabsContent value="registration" className="mt-6">
                                    <RegistrationTab form={form} options={options} />
                                </TabsContent>
                            </Tabs>
                        </div>

                        <div className="mt-6 flex items-center justify-end rounded-b-xl border-t p-3">
                            <Button onClick={handleSave} disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {t('Save Settings')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
