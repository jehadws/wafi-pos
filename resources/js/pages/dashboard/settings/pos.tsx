import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MultiKeySelector from '@/components/ui/multi-key-selector';
import { MultiSelector } from '@/components/ui/multi-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Loader2, Save } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

type Layout = {
    ns_jgrem_layout: string | null;
    ns_jgrem_complete_sale_audio: string | null;
    ns_jgrem_new_item_audio: string | null;
};

type Printing = {
    ns_jgrem_printing_gateway: string | null;
    ns_jgrem_printing_enabled_for: string | null;
    ns_jgrem_printing_document: string | null;
};

type Registers = {
    ns_jgrem_registers_enabled: string | null;
};

type Vat = {
    ns_jgrem_vat: string | null;
};

type Features = {
    ns_jgrem_show_quantity: string | 'yes' | 'no';
    ns_jgrem_items_merge: string | null;
    ns_jgrem_allow_wholesale_price: string | null;
    ns_jgrem_allow_decimal_quantities: 'yes' | 'no' | string;
    ns_jgrem_quick_product: 'yes' | 'no' | string;
    ns_jgrem_quick_product_default_unit: null;
    ns_jgrem_unit_price_ediable: 'yes' | 'no' | string;
    ns_jgrem_price_with_tax: null | string;
    ns_jgrem_order_types: string[];
    ns_jgrem_numpad: null | string;
    ns_jgrem_force_autofocus: null | string;
    ns_jgrem_hide_exhausted_products: null | string;
    ns_jgrem_hide_empty_categories: 'yes' | 'no' | string;
};

type Shortcuts = {
    ns_jgrem_keyboard_cancel_order: string[];
    ns_jgrem_keyboard_hold_order: string[];
    ns_jgrem_keyboard_create_customer: string[];
    ns_jgrem_keyboard_payment: string[];
    ns_jgrem_keyboard_shipping: string[];
    ns_jgrem_keyboard_note: string[];
    ns_jgrem_keyboard_order_type: string[];
    ns_jgrem_keyboard_fullscreen: string[];
    ns_jgrem_keyboard_quick_search: string[];
    ns_jgrem_keyboard_toggle_merge: string[];
    ns_jgrem_amount_shortcut: null | string;
};

type Payload = {
    features: Features;
    layout: Layout;
    printing: Printing;
    registers: Registers;
    shortcuts: Shortcuts;
    vat: Vat;
};

type SelectOption = {
    label: string;
    value: string | number;
};

type ShortcutOption = {
    label: string;
    value: string;
};

type PaymentTypeOption = {
    id: number;
    label: string;
};

type TaxGroupOption = {
    id: number;
    name: string;
};

interface Options {
    ns_jgrem_layout: SelectOption[];
    ns_jgrem_complete_sale_audio: SelectOption[];
    ns_jgrem_new_item_audio: SelectOption[];
    ns_jgrem_printing_document: SelectOption[];
    ns_jgrem_printing_enabled_for: SelectOption[];
    ns_jgrem_printing_gateway: SelectOption[];
    ns_jgrem_registers_enabled: SelectOption[];
    ns_jgrem_idle_counter: SelectOption[];
    ns_jgrem_disbursement: SelectOption[];
    ns_jgrem_registers_default_change_payment_type: PaymentTypeOption[];
    ns_jgrem_vat: SelectOption[];
    ns_jgrem_tax_group: TaxGroupOption[];
    ns_jgrem_tax_type: SelectOption[];
    ns_jgrem_keyboard_shortcuts: ShortcutOption[];
    ns_jgrem_show_quantity: SelectOption[];
    ns_jgrem_items_merge: SelectOption[];
    ns_jgrem_allow_wholesale_price: SelectOption[];
    ns_jgrem_allow_decimal_quantities: SelectOption[];
    ns_jgrem_quick_product: SelectOption[];
    ns_jgrem_quick_product_default_unit: SelectOption[];
    ns_jgrem_unit_price_ediable: SelectOption[];
    ns_jgrem_price_with_tax: SelectOption[];
    ns_jgrem_order_types: SelectOption[];
    ns_jgrem_numpad: SelectOption[];
    ns_jgrem_force_autofocus: SelectOption[];
    ns_jgrem_hide_exhausted_products: SelectOption[];
    ns_jgrem_hide_empty_categories: SelectOption[];
}

export default function SettingsGeneral() {
    const { options, payload } = usePage<{ options: Options; payload: Payload }>().props;
    const [tab, setTab] = useState<'layout' | 'printing' | 'registers' | 'vat' | 'shortcuts' | 'features'>('layout');
    const [isPending, startTransition] = useTransition();
    const { t } = useTranslation();

    const form = useForm<Payload>({
        layout: {
            ...payload.layout,
        },
        printing: {
            ...payload.printing,
        },
        registers: {
            ...payload.registers,
        },
        vat: {
            ...payload.vat,
        },
        shortcuts: {
            ...payload.shortcuts,
        },
        features: {
            ...payload.features,
        },
    });

    const handleSave = () => {
        startTransition(async () => {
            try {
                const data: Payload = {
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
                    shortcuts: {
                        ...form.data.shortcuts,
                    },
                    features: {
                        ...form.data.features,
                        ns_jgrem_quick_product_default_unit:
                            form.data.features.ns_jgrem_quick_product_default_unit === 'null'
                                ? null
                                : form.data.features.ns_jgrem_quick_product_default_unit,
                    },
                };
                await axios.post('/api/settings/pos', data);
                toast(t('Settings saved'), { description: t('The settings was saved successfully.') });
            } catch (e: any) {
                toast(t('Failed to save'), {
                    description: e?.message || t('An unexpected error occurred.'),
                });
            }
        });
    };

    return (
        <AppLayout>
            <div className="p-6">
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-xl border">
                        <div className="relative p-6 md:p-8">
                            <h1 className="text-2xl font-semibold">POS Settings</h1>
                            <p className="text-muted-foreground text-sm">Configure the pos settings.</p>
                            <div className="mt-4">
                                <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                                    <TabsList className="flex w-full max-w-xl justify-start">
                                        <TabsTrigger value="layout">Layout</TabsTrigger>
                                        <TabsTrigger value="printing">Printing</TabsTrigger>
                                        <TabsTrigger value="registers">Cash Registers</TabsTrigger>
                                        <TabsTrigger value="vat">VAT Settings</TabsTrigger>
                                        <TabsTrigger value="shortcuts">Keyboard Shortcuts</TabsTrigger>
                                        <TabsTrigger value="features">Features</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                                <TabsContent value="layout" className="mt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <FormField label="POS Layout" description="Change the layout of the POS.">
                                            <Select
                                                value={form.data.layout.ns_jgrem_layout || ''}
                                                onValueChange={(v) => form.setData('layout.ns_jgrem_layout', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem key={'null'} value={'null'}>
                                                        Select an option
                                                    </SelectItem>
                                                    {options.ns_jgrem_layout.map((l) => (
                                                        <SelectItem key={l.value} value={l.value.toString() || 'null'}>
                                                            {l.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                        <FormField label="Sale Complete Sound" description="Change the layout of the POS.">
                                            <Select
                                                value={form.data.layout.ns_jgrem_complete_sale_audio || ''}
                                                onValueChange={(v) => form.setData('layout.ns_jgrem_complete_sale_audio', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem key={'null'} value={'null'}>
                                                        Select an option
                                                    </SelectItem>
                                                    {options.ns_jgrem_complete_sale_audio.map((l) => (
                                                        <SelectItem key={l.value} value={l.value.toString() || 'null'}>
                                                            {l.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                        <FormField label="New Item Audio" description="The sound that plays when an item is added to the cart.">
                                            <Select
                                                value={form.data.layout.ns_jgrem_new_item_audio || ''}
                                                onValueChange={(v) => form.setData('layout.ns_jgrem_new_item_audio', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem key={'null'} value={'null'}>
                                                        Select an option
                                                    </SelectItem>
                                                    {options.ns_jgrem_new_item_audio.map((l) => (
                                                        <SelectItem key={l.value} value={l.value.toString()}>
                                                            {l.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                    </div>
                                </TabsContent>

                                <TabsContent value="printing" className="mt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <FormField label="Printed Document" description="Choose the document used for printing aster a sale.">
                                            <Select
                                                value={form.data.printing.ns_jgrem_printing_document || ''}
                                                onValueChange={(v) => form.setData('printing.ns_jgrem_printing_document', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem key={'null'} value={'null'}>
                                                        Select an option
                                                    </SelectItem>
                                                    {options.ns_jgrem_printing_document.map((l) => (
                                                        <SelectItem key={l.value} value={l.value.toString()}>
                                                            {l.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>

                                        <FormField label="Printing Enabled For" description="Determine when the printing should be enabled.">
                                            <Select
                                                value={form.data.printing.ns_jgrem_printing_enabled_for || ''}
                                                onValueChange={(v) => form.setData('printing.ns_jgrem_printing_enabled_for', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem key={'null'} value={'null'}>
                                                        Select an option
                                                    </SelectItem>
                                                    {options.ns_jgrem_printing_enabled_for.map((l) => (
                                                        <SelectItem key={l.value} value={l.value.toString()}>
                                                            {l.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>

                                        <FormField label="Printing Gateway" description="Determine what is the gateway used for printing.">
                                            <Select
                                                value={form.data.printing.ns_jgrem_printing_gateway || ''}
                                                onValueChange={(v) => form.setData('printing.ns_jgrem_printing_gateway', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem key={'null'} value={'null'}>
                                                        Select an option
                                                    </SelectItem>
                                                    {options.ns_jgrem_printing_gateway.map((l) => (
                                                        <SelectItem key={l.value} value={l.value.toString()}>
                                                            {l.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                    </div>
                                </TabsContent>

                                <TabsContent value="registers" className="mt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <FormField label="Enable Cash Registers" description="Determine if the POS will support cash registers.">
                                            <Select
                                                value={form.data.registers.ns_jgrem_registers_enabled || ''}
                                                onValueChange={(v) => form.setData('registers.ns_jgrem_registers_enabled', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem key={'null'} value={'null'}>
                                                        Select an option
                                                    </SelectItem>
                                                    {options.ns_jgrem_registers_enabled.map((l) => (
                                                        <SelectItem key={l.value} value={l.value.toString()}>
                                                            {l.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                    </div>
                                </TabsContent>

                                <TabsContent value="vat" className="mt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <FormField label="VAT Type" description="Determine the VAT type that should be used.">
                                            <Select
                                                value={form.data.vat.ns_jgrem_vat || ''}
                                                onValueChange={(v) => form.setData('vat.ns_jgrem_vat', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem key={'null'} value={'null'}>
                                                        Select an option
                                                    </SelectItem>
                                                    {options.ns_jgrem_vat.map((l) => (
                                                        <SelectItem key={l.value} value={l.value.toString()}>
                                                            {l.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                    </div>
                                </TabsContent>

                                <TabsContent value="shortcuts" className="mt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <FormField label="Cancel Order" description="Keyboard shortcut to cancel the current order.">
                                            <MultiKeySelector
                                                value={form.data.shortcuts.ns_jgrem_keyboard_cancel_order}
                                                onChange={(newShortcut) =>
                                                    form.setData('shortcuts.ns_jgrem_keyboard_cancel_order', newShortcut || [])
                                                }
                                                maxKeys={4}
                                                options={options.ns_jgrem_keyboard_shortcuts}
                                            />
                                        </FormField>

                                        <FormField label="Hold Order" description="Keyboard shortcut to hold the current order.">
                                            <MultiKeySelector
                                                value={form.data.shortcuts.ns_jgrem_keyboard_hold_order}
                                                onChange={(newShortcut) => form.setData('shortcuts.ns_jgrem_keyboard_hold_order', newShortcut || [])}
                                                maxKeys={4}
                                                options={options.ns_jgrem_keyboard_shortcuts}
                                            />
                                        </FormField>

                                        <FormField label="Create Customer" description="Keyboard shortcut to create a customer.">
                                            <MultiKeySelector
                                                value={form.data.shortcuts.ns_jgrem_keyboard_create_customer}
                                                onChange={(newShortcut) =>
                                                    form.setData('shortcuts.ns_jgrem_keyboard_create_customer', newShortcut || [])
                                                }
                                                maxKeys={4}
                                                options={options.ns_jgrem_keyboard_shortcuts}
                                            />
                                        </FormField>

                                        <FormField label="Proceed Payment" description="Keyboard shortcut to proceed to the payment.">
                                            <MultiKeySelector
                                                value={form.data.shortcuts.ns_jgrem_keyboard_payment}
                                                onChange={(newShortcut) => form.setData('shortcuts.ns_jgrem_keyboard_payment', newShortcut || [])}
                                                maxKeys={4}
                                                options={options.ns_jgrem_keyboard_shortcuts}
                                            />
                                        </FormField>

                                        <FormField label="Open Shipping" description="Keyboard shortcut to define shipping details.">
                                            <MultiKeySelector
                                                value={form.data.shortcuts.ns_jgrem_keyboard_shipping}
                                                onChange={(newShortcut) => form.setData('shortcuts.ns_jgrem_keyboard_shipping', newShortcut || [])}
                                                maxKeys={4}
                                                options={options.ns_jgrem_keyboard_shortcuts}
                                            />
                                        </FormField>

                                        <FormField label="Open Note" description="Keyboard shortcut to open the notes.">
                                            <MultiKeySelector
                                                value={form.data.shortcuts.ns_jgrem_keyboard_note}
                                                onChange={(newShortcut) => form.setData('shortcuts.ns_jgrem_keyboard_note', newShortcut || [])}
                                                maxKeys={4}
                                                options={options.ns_jgrem_keyboard_shortcuts}
                                            />
                                        </FormField>

                                        <FormField label="Order Type Selector" description="Keyboard shortcut to open the order type selector.">
                                            <MultiKeySelector
                                                value={form.data.shortcuts.ns_jgrem_keyboard_order_type}
                                                onChange={(newShortcut) => form.setData('shortcuts.ns_jgrem_keyboard_order_type', newShortcut || [])}
                                                maxKeys={4}
                                                options={options.ns_jgrem_keyboard_shortcuts}
                                            />
                                        </FormField>

                                        <FormField label="Toggle Fullscreen" description="Keyboard shortcut to toggle fullscreen.">
                                            <MultiKeySelector
                                                value={form.data.shortcuts.ns_jgrem_keyboard_fullscreen}
                                                onChange={(newShortcut) => form.setData('shortcuts.ns_jgrem_keyboard_fullscreen', newShortcut || [])}
                                                maxKeys={4}
                                                options={options.ns_jgrem_keyboard_shortcuts}
                                            />
                                        </FormField>

                                        <FormField label="Toggle Product Merge" description="Will enable or disable the product merging.">
                                            <MultiKeySelector
                                                value={form.data.shortcuts.ns_jgrem_keyboard_toggle_merge}
                                                onChange={(newShortcut) =>
                                                    form.setData('shortcuts.ns_jgrem_keyboard_toggle_merge', newShortcut || [])
                                                }
                                                maxKeys={4}
                                                options={options.ns_jgrem_keyboard_shortcuts}
                                            />
                                        </FormField>

                                        <FormField label="Amount Shortcuts" description='The amount numbers shortcuts separated with a "|".'>
                                            <Input
                                                value={form.data.shortcuts.ns_jgrem_amount_shortcut || ''}
                                                onChange={(e) => form.setData('shortcuts.ns_jgrem_amount_shortcut', e.target.value)}
                                            />
                                        </FormField>
                                    </div>
                                </TabsContent>
                                <TabsContent value="features" className="mt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <FormField
                                            label="Show Quantity"
                                            description="Will show the quantity selector while choosing a product. Otherwise the default quantity is set to 1."
                                        >
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_show_quantity ?? 'no') === 'yes' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_show_quantity', 'yes')}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_show_quantity ?? 'no') === 'no' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_show_quantity', 'no')}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </FormField>

                                        <FormField label="Merge Similar Items" description="Will enforce similar products to be merged from the POS.">
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_items_merge ?? 'no') === 'yes' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_items_merge', 'yes')}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_items_merge ?? 'no') === 'no' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_items_merge', 'no')}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </FormField>

                                        <FormField
                                            label="Allow Wholesale Price"
                                            description="Define if the wholesale price can be selected on the POS."
                                        >
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={
                                                        (form.data.features.ns_jgrem_allow_wholesale_price ?? 'no') === 'yes' ? 'default' : 'outline'
                                                    }
                                                    onClick={() => form.setData('features.ns_jgrem_allow_wholesale_price', 'yes')}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        (form.data.features.ns_jgrem_allow_wholesale_price ?? 'no') === 'no' ? 'default' : 'outline'
                                                    }
                                                    onClick={() => form.setData('features.ns_jgrem_allow_wholesale_price', 'no')}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </FormField>

                                        <FormField
                                            label="Allow Decimal Quantities"
                                            description='Will change the numeric keyboard for allowing decimal for quantities. Only for "default" numpad.'
                                        >
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={
                                                        (form.data.features.ns_jgrem_allow_decimal_quantities ?? 'no') === 'yes'
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    onClick={() => form.setData('features.ns_jgrem_allow_decimal_quantities', 'yes')}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        (form.data.features.ns_jgrem_allow_decimal_quantities ?? 'no') === 'no'
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    onClick={() => form.setData('features.ns_jgrem_allow_decimal_quantities', 'no')}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </FormField>

                                        <FormField label="Quick Product" description="Allow quick product to be created from the POS.">
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_quick_product ?? 'no') === 'yes' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_quick_product', 'yes')}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_quick_product ?? 'no') === 'no' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_quick_product', 'no')}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </FormField>

                                        <FormField
                                            label="Quick Product Default Unit"
                                            description="Set what unit is assigned by default to all quick product."
                                        >
                                            <Select
                                                value={form.data.features.ns_jgrem_quick_product_default_unit || ''}
                                                onValueChange={(v) => form.setData('features.ns_jgrem_quick_product_default_unit', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem key={'null'} value={'null'}>
                                                        Select an option
                                                    </SelectItem>
                                                    {options.ns_jgrem_quick_product_default_unit.map((l) => (
                                                        <SelectItem key={l.value} value={l.value.toString() || 'null'}>
                                                            {l.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>

                                        <FormField label="Editable Unit Price" description="Allow product unit price to be edited.">
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={
                                                        (form.data.features.ns_jgrem_unit_price_ediable ?? 'no') === 'yes' ? 'default' : 'outline'
                                                    }
                                                    onClick={() => form.setData('features.ns_jgrem_unit_price_ediable', 'yes')}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        (form.data.features.ns_jgrem_unit_price_ediable ?? 'no') === 'no' ? 'default' : 'outline'
                                                    }
                                                    onClick={() => form.setData('features.ns_jgrem_unit_price_ediable', 'no')}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </FormField>

                                        <FormField label="Show Price With Tax" description="Will display price with tax for each products.">
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_price_with_tax ?? 'no') === 'yes' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_price_with_tax', 'yes')}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_price_with_tax ?? 'no') === 'no' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_price_with_tax', 'no')}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </FormField>

                                        <FormField label="Order Types" description="Control the order type enabled.">
                                            <MultiSelector
                                                value={form.data.features.ns_jgrem_order_types || []}
                                                options={options.ns_jgrem_order_types.map((l) => ({ id: l.value, name: l.label }))}
                                                onChange={(v) => form.setData('features.ns_jgrem_order_types', v)}
                                            />
                                        </FormField>

                                        <FormField label="Numpad" description="Will set what is the numpad used on the POS screen.">
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_numpad ?? 'default') === 'default' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_numpad', 'default')}
                                                >
                                                    Default
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_numpad ?? 'default') === 'advanced' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_numpad', 'advanced')}
                                                >
                                                    Advanced
                                                </Button>
                                            </div>
                                        </FormField>

                                        <FormField
                                            label="Force Barcode Auto Focus"
                                            description="Will permanently enable barcode autofocus to ease using a barcode reader."
                                        >
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_force_autofocus ?? 'no') === 'yes' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_force_autofocus', 'yes')}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={(form.data.features.ns_jgrem_force_autofocus ?? 'no') === 'no' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('features.ns_jgrem_force_autofocus', 'no')}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </FormField>

                                        <FormField
                                            label="Hide Exhausted Products"
                                            description="Will hide exhausted products from selection on the POS."
                                        >
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={
                                                        (form.data.features.ns_jgrem_hide_exhausted_products ?? 'no') === 'yes'
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    onClick={() => form.setData('features.ns_jgrem_hide_exhausted_products', 'yes')}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        (form.data.features.ns_jgrem_hide_exhausted_products ?? 'no') === 'no' ? 'default' : 'outline'
                                                    }
                                                    onClick={() => form.setData('features.ns_jgrem_hide_exhausted_products', 'no')}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </FormField>

                                        <FormField
                                            label="Hide Empty Category"
                                            description="Category with no or exhausted products will be hidden from selection."
                                        >
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={
                                                        (form.data.features.ns_jgrem_hide_empty_categories ?? 'no') === 'yes' ? 'default' : 'outline'
                                                    }
                                                    onClick={() => form.setData('features.ns_jgrem_hide_empty_categories', 'yes')}
                                                >
                                                    Yes
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={
                                                        (form.data.features.ns_jgrem_hide_empty_categories ?? 'no') === 'no' ? 'default' : 'outline'
                                                    }
                                                    onClick={() => form.setData('features.ns_jgrem_hide_empty_categories', 'no')}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </FormField>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <div className="mt-6 flex items-center justify-end rounded-b-xl border-t p-3">
                            <Button onClick={() => handleSave()} disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
