import { useTransition } from 'react';
import { useForm } from '@inertiajs/react';
import { useTranslation } from '@/lib/i18n';
import { settingsApi } from '@/api';
import { toast } from 'sonner';
import type { PosSettingsPayload } from './types';

export function usePosSettings(initialPayload: PosSettingsPayload) {
    const { t } = useTranslation();
    const [isPending, startTransition] = useTransition();

    const form = useForm<PosSettingsPayload>({
        layout: { ...initialPayload.layout },
        printing: { ...initialPayload.printing },
        registers: { ...initialPayload.registers },
        vat: { ...initialPayload.vat },
        shortcuts: { ...initialPayload.shortcuts },
        features: { ...initialPayload.features },
    });

    const handleSave = () => {
        startTransition(async () => {
            try {
                const data: PosSettingsPayload = {
                    layout: {
                        ...form.data.layout,
                        ns_jgrem_layout: form.data.layout.ns_jgrem_layout === 'null' ? null : form.data.layout.ns_jgrem_layout,
                        ns_jgrem_complete_sale_audio:
                            form.data.layout.ns_jgrem_complete_sale_audio === 'null' ? null : form.data.layout.ns_jgrem_complete_sale_audio,
                        ns_jgrem_new_item_audio:
                            form.data.layout.ns_jgrem_new_item_audio === 'null' ? null : form.data.layout.ns_jgrem_new_item_audio,
                    },
                    printing: {
                        ...form.data.printing,
                        ns_jgrem_printing_document:
                            form.data.printing.ns_jgrem_printing_document === 'null' ? null : form.data.printing.ns_jgrem_printing_document,
                        ns_jgrem_printing_enabled_for:
                            form.data.printing.ns_jgrem_printing_enabled_for === 'null' ? null : form.data.printing.ns_jgrem_printing_enabled_for,
                        ns_jgrem_printing_gateway:
                            form.data.printing.ns_jgrem_printing_gateway === 'null' ? null : form.data.printing.ns_jgrem_printing_gateway,
                    },
                    registers: {
                        ...form.data.registers,
                        ns_jgrem_registers_enabled:
                            form.data.registers.ns_jgrem_registers_enabled === 'null' ? null : form.data.registers.ns_jgrem_registers_enabled,
                    },
                    vat: {
                        ...form.data.vat,
                        ns_jgrem_vat: form.data.vat.ns_jgrem_vat === 'null' ? null : form.data.vat.ns_jgrem_vat,
                    },
                    shortcuts: { ...form.data.shortcuts },
                    features: {
                        ...form.data.features,
                        ns_jgrem_quick_product_default_unit:
                            form.data.features.ns_jgrem_quick_product_default_unit === 'null'
                                ? null
                                : form.data.features.ns_jgrem_quick_product_default_unit,
                    },
                };
                await settingsApi.update('pos', data);
                toast.success(t('The settings was saved successfully.'));
            } catch (e: any) {
                toast.error(e?.message || t('An unexpected error occurred.'));
            }
        });
    };

    return { form, isPending, handleSave };
}
