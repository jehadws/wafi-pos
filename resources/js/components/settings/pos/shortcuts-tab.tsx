import React from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Input } from '@/components/ui/input';
import MultiKeySelector from '@/components/ui/multi-key-selector';
import { useTranslation } from '@/lib/i18n';
import type { PosSettingsPayload, PosSettingsOptions } from './types';

interface ShortcutsTabProps {
    form: {
        data: PosSettingsPayload;
        setData: (field: string, value: any) => void;
    };
    options: PosSettingsOptions;
}

export function ShortcutsTab({ form, options }: ShortcutsTabProps) {
    const { t } = useTranslation();

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FormField label={t('Cancel Order')} description={t('Keyboard shortcut to cancel the current order.')}>
                <MultiKeySelector
                    value={form.data.shortcuts.sb_subul_keyboard_cancel_order}
                    onChange={(newShortcut) => form.setData('shortcuts.sb_subul_keyboard_cancel_order', newShortcut || [])}
                    maxKeys={4}
                    options={options.sb_subul_keyboard_shortcuts}
                />
            </FormField>

            <FormField label={t('Hold Order')} description={t('Keyboard shortcut to hold the current order.')}>
                <MultiKeySelector
                    value={form.data.shortcuts.sb_subul_keyboard_hold_order}
                    onChange={(newShortcut) => form.setData('shortcuts.sb_subul_keyboard_hold_order', newShortcut || [])}
                    maxKeys={4}
                    options={options.sb_subul_keyboard_shortcuts}
                />
            </FormField>

            <FormField label={t('Create Customer')} description={t('Keyboard shortcut to create a customer.')}>
                <MultiKeySelector
                    value={form.data.shortcuts.sb_subul_keyboard_create_customer}
                    onChange={(newShortcut) => form.setData('shortcuts.sb_subul_keyboard_create_customer', newShortcut || [])}
                    maxKeys={4}
                    options={options.sb_subul_keyboard_shortcuts}
                />
            </FormField>

            <FormField label={t('Proceed Payment')} description={t('Keyboard shortcut to proceed to the payment.')}>
                <MultiKeySelector
                    value={form.data.shortcuts.sb_subul_keyboard_payment}
                    onChange={(newShortcut) => form.setData('shortcuts.sb_subul_keyboard_payment', newShortcut || [])}
                    maxKeys={4}
                    options={options.sb_subul_keyboard_shortcuts}
                />
            </FormField>

            <FormField label={t('Open Shipping')} description={t('Keyboard shortcut to define shipping details.')}>
                <MultiKeySelector
                    value={form.data.shortcuts.sb_subul_keyboard_shipping}
                    onChange={(newShortcut) => form.setData('shortcuts.sb_subul_keyboard_shipping', newShortcut || [])}
                    maxKeys={4}
                    options={options.sb_subul_keyboard_shortcuts}
                />
            </FormField>

            <FormField label={t('Open Note')} description={t('Keyboard shortcut to open the notes.')}>
                <MultiKeySelector
                    value={form.data.shortcuts.sb_subul_keyboard_note}
                    onChange={(newShortcut) => form.setData('shortcuts.sb_subul_keyboard_note', newShortcut || [])}
                    maxKeys={4}
                    options={options.sb_subul_keyboard_shortcuts}
                />
            </FormField>

            <FormField label={t('Order Type Selector')} description={t('Keyboard shortcut to open the order type selector.')}>
                <MultiKeySelector
                    value={form.data.shortcuts.sb_subul_keyboard_order_type}
                    onChange={(newShortcut) => form.setData('shortcuts.sb_subul_keyboard_order_type', newShortcut || [])}
                    maxKeys={4}
                    options={options.sb_subul_keyboard_shortcuts}
                />
            </FormField>

            <FormField label={t('Toggle Fullscreen')} description={t('Keyboard shortcut to toggle fullscreen.')}>
                <MultiKeySelector
                    value={form.data.shortcuts.sb_subul_keyboard_fullscreen}
                    onChange={(newShortcut) => form.setData('shortcuts.sb_subul_keyboard_fullscreen', newShortcut || [])}
                    maxKeys={4}
                    options={options.sb_subul_keyboard_shortcuts}
                />
            </FormField>

            <FormField label={t('Toggle Product Merge')} description={t('Will enable or disable the product merging.')}>
                <MultiKeySelector
                    value={form.data.shortcuts.sb_subul_keyboard_toggle_merge}
                    onChange={(newShortcut) => form.setData('shortcuts.sb_subul_keyboard_toggle_merge', newShortcut || [])}
                    maxKeys={4}
                    options={options.sb_subul_keyboard_shortcuts}
                />
            </FormField>

            <FormField label={t('Amount Shortcuts')} description={t('The amount numbers shortcuts separated with a "|".')}>
                <Input
                    value={form.data.shortcuts.sb_subul_amount_shortcut || ''}
                    onChange={(e) => form.setData('shortcuts.sb_subul_amount_shortcut', e.target.value)}
                />
            </FormField>
        </div>
    );
}
