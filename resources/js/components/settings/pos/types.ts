export type Layout = {
    ns_jgrem_layout: string | null;
    ns_jgrem_complete_sale_audio: string | null;
    ns_jgrem_new_item_audio: string | null;
};

export type Printing = {
    ns_jgrem_printing_gateway: string | null;
    ns_jgrem_printing_enabled_for: string | null;
    ns_jgrem_printing_document: string | null;
};

export type Registers = {
    ns_jgrem_registers_enabled: string | null;
};

export type Vat = {
    ns_jgrem_vat: string | null;
};

export type Features = {
    ns_jgrem_show_quantity: string | 'yes' | 'no';
    ns_jgrem_items_merge: string | null;
    ns_jgrem_allow_wholesale_price: string | null;
    ns_jgrem_allow_decimal_quantities: 'yes' | 'no' | string;
    ns_jgrem_quick_product: 'yes' | 'no' | string;
    ns_jgrem_quick_product_default_unit: null | string;
    ns_jgrem_unit_price_ediable: 'yes' | 'no' | string;
    ns_jgrem_price_with_tax: null | string;
    ns_jgrem_order_types: string[];
    ns_jgrem_numpad: null | string;
    ns_jgrem_force_autofocus: null | string;
    ns_jgrem_hide_exhausted_products: null | string;
    ns_jgrem_hide_empty_categories: 'yes' | 'no' | string;
};

export type Shortcuts = {
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

export type PosSettingsPayload = {
    features: Features;
    layout: Layout;
    printing: Printing;
    registers: Registers;
    shortcuts: Shortcuts;
    vat: Vat;
};

export type SelectOption = {
    label: string;
    value: string | number;
};

export type ShortcutOption = {
    label: string;
    value: string;
};

export type PaymentTypeOption = {
    id: number;
    label: string;
};

export type TaxGroupOption = {
    id: number;
    name: string;
};

export interface PosSettingsOptions {
    ns_jgrem_layout: SelectOption[];
    ns_jgrem_complete_sale_audio: SelectOption[];
    ns_jgrem_new_item_audio: SelectOption[];
    ns_jgrem_printing_document: SelectOption[];
    ns_jgrem_printing_enabled_for: SelectOption[];
    ns_jgrem_printing_gateway: SelectOption[];
    ns_jgrem_printing_auto: SelectOption[];
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
