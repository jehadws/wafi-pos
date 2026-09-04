import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrinterSettingsDialog } from '@/components/pos/printer-settings-dialog';
import { useTranslation } from '@/lib/i18n';
import { Printer } from 'lucide-react';
import type { PosSettingsPayload, PosSettingsOptions } from './types';

interface PrintingTabProps {
    form: {
        data: PosSettingsPayload;
        setData: (field: string, value: any) => void;
    };
    options: PosSettingsOptions;
}

export function PrintingTab({ form, options }: PrintingTabProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Direct Thermal Print Agent Card */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Printer className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-base">{t('Direct Windows Thermal & Label Printing')}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('Configure ESC/POS direct printing to your 76mm/80mm thermal receipt printer (XP-80C) and barcode label printer without browser print dialogs.')}
                    </p>
                </div>
                <PrinterSettingsDialog
                    trigger={
                        <Button variant="default" className="gap-2 shrink-0">
                            <Printer className="h-4 w-4" />
                            {t('Configure Thermal Printers')}
                        </Button>
                    }
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                    label={t('Printed Document')}
                    description={t('Choose the document used for printing after a sale.')}
                >
                    <Select
                        value={form.data.printing.sb_subul_printing_document || ''}
                        onValueChange={(v) => form.setData('printing.sb_subul_printing_document', v)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('Select an option')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem key="null" value="null">
                                {t('Select an option')}
                            </SelectItem>
                            {options.sb_subul_printing_document.map((l) => (
                                <SelectItem key={l.value} value={l.value.toString()}>
                                    {l.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('Printing Enabled For')}
                    description={t('Determine when the printing should be enabled.')}
                >
                    <Select
                        value={form.data.printing.sb_subul_printing_enabled_for || ''}
                        onValueChange={(v) => form.setData('printing.sb_subul_printing_enabled_for', v)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('Select an option')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem key="null" value="null">
                                {t('Select an option')}
                            </SelectItem>
                            {options.sb_subul_printing_enabled_for.map((l) => (
                                <SelectItem key={l.value} value={l.value.toString()}>
                                    {l.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField label={t('Printing Gateway')} description={t('Determine what is the gateway used for printing.')}>
                    <Select
                        value={form.data.printing.sb_subul_printing_gateway || ''}
                        onValueChange={(v) => form.setData('printing.sb_subul_printing_gateway', v)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('Select an option')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem key="null" value="null">
                                {t('Select an option')}
                            </SelectItem>
                            {options.sb_subul_printing_gateway.map((l) => (
                                <SelectItem key={l.value} value={l.value.toString()}>
                                    {l.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('Automatic Printing')}
                    description={t(
                        "If disabled, the receipt won't print automatically after a sale. It can still be printed manually from the order page.",
                    )}
                >
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={(form.data.printing.sb_subul_printing_auto ?? 'yes') === 'yes' ? 'default' : 'outline'}
                            onClick={() => form.setData('printing.sb_subul_printing_auto', 'yes')}
                        >
                            {t('Yes')}
                        </Button>
                        <Button
                            type="button"
                            variant={(form.data.printing.sb_subul_printing_auto ?? 'yes') === 'no' ? 'default' : 'outline'}
                            onClick={() => form.setData('printing.sb_subul_printing_auto', 'no')}
                        >
                            {t('No')}
                        </Button>
                    </div>
                </FormField>
            </div>
        </div>
    );
}
