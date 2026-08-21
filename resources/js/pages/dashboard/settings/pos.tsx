import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n';
import { Loader2, Save } from 'lucide-react';
import { usePosSettings } from '@/components/settings/pos/use-pos-settings';
import { LayoutTab } from '@/components/settings/pos/layout-tab';
import { PrintingTab } from '@/components/settings/pos/printing-tab';
import { RegistersTab } from '@/components/settings/pos/registers-tab';
import { VatTab } from '@/components/settings/pos/vat-tab';
import { ShortcutsTab } from '@/components/settings/pos/shortcuts-tab';
import { FeaturesTab } from '@/components/settings/pos/features-tab';
import type { PosSettingsPayload, PosSettingsOptions } from '@/components/settings/pos/types';

export default function PosSettingsPage() {
    const { options, payload } = usePage<{ options: PosSettingsOptions; payload: PosSettingsPayload }>().props;
    const [tab, setTab] = useState<'layout' | 'printing' | 'registers' | 'vat' | 'shortcuts' | 'features'>('layout');
    const { t } = useTranslation();
    const { form, isPending, handleSave } = usePosSettings(payload);

    return (
        <AppLayout>
            <div className="p-6">
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-xl border">
                        <div className="relative p-6 md:p-8">
                            <h1 className="text-2xl font-semibold">{t('POS Settings')}</h1>
                            <p className="text-muted-foreground text-sm">{t('Configure the pos settings.')}</p>
                            
                            <div className="mt-4">
                                <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                                    <TabsList className="flex w-full justify-start">
                                        <TabsTrigger value="layout">{t('Layout')}</TabsTrigger>
                                        <TabsTrigger value="printing">{t('Printing')}</TabsTrigger>
                                        <TabsTrigger value="registers">{t('Cash Registers')}</TabsTrigger>
                                        <TabsTrigger value="vat">{t('VAT Settings')}</TabsTrigger>
                                        <TabsTrigger value="shortcuts">{t('Keyboard Shortcuts')}</TabsTrigger>
                                        <TabsTrigger value="features">{t('Features')}</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                                <TabsContent value="layout" className="mt-6">
                                    <LayoutTab form={form} options={options} />
                                </TabsContent>

                                <TabsContent value="printing" className="mt-6">
                                    <PrintingTab form={form} options={options} />
                                </TabsContent>

                                <TabsContent value="registers" className="mt-6">
                                    <RegistersTab form={form} options={options} />
                                </TabsContent>

                                <TabsContent value="vat" className="mt-6">
                                    <VatTab form={form} options={options} />
                                </TabsContent>

                                <TabsContent value="shortcuts" className="mt-6">
                                    <ShortcutsTab form={form} options={options} />
                                </TabsContent>

                                <TabsContent value="features" className="mt-6">
                                    <FeaturesTab form={form} options={options} />
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
