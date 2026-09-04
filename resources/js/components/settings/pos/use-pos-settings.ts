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
                        sb_subul_layout: form.data.layout.sb_subul_layout === 'null' ? null : form.data.layout.sb_subul_layout,
                        sb_subul_complete_sale_audio:
                            form.data.layout.sb_subul_complete_sale_audio === 'null' ? null : form.data.layout.sb_subul_complete_sale_audio,
                        sb_subul_new_item_audio:
                            form.data.layout.sb_subul_new_item_audio === 'null' ? null : form.data.layout.sb_subul_new_item_audio,
                    },
                    printing: {
                        ...form.data.printing,
                        sb_subul_printing_document:
                            form.data.printing.sb_subul_printing_document === 'null' ? null : form.data.printing.sb_subul_printing_document,
                        sb_subul_printing_enabled_for:
                            form.data.printing.sb_subul_printing_enabled_for === 'null' ? null : form.data.printing.sb_subul_printing_enabled_for,
                        sb_subul_printing_gateway:
                            form.data.printing.sb_subul_printing_gateway === 'null' ? null : form.data.printing.sb_subul_printing_gateway,
                    },
                    registers: {
                        ...form.data.registers,
                        sb_subul_registers_enabled:
                            form.data.registers.sb_subul_registers_enabled === 'null' ? null : form.data.registers.sb_subul_registers_enabled,
                    },
                    vat: {
                        ...form.data.vat,
                        sb_subul_vat: form.data.vat.sb_subul_vat === 'null' ? null : form.data.vat.sb_subul_vat,
                    },
                    shortcuts: { ...form.data.shortcuts },
                    features: {
                        ...form.data.features,
                        sb_subul_quick_product_default_unit:
                            form.data.features.sb_subul_quick_product_default_unit === 'null'
                                ? null
                                : form.data.features.sb_subul_quick_product_default_unit,
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
