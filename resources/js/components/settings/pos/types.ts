export type Layout = {
    sb_subul_layout: string | null;
    sb_subul_complete_sale_audio: string | null;
    sb_subul_new_item_audio: string | null;
};

export type Printing = {
    sb_subul_printing_gateway: string | null;
    sb_subul_printing_enabled_for: string | null;
    sb_subul_printing_document: string | null;
    sb_subul_printing_auto: string | null;
};

export type Registers = {
    sb_subul_registers_enabled: string | null;
};

export type Vat = {
    sb_subul_vat: string | null;
};

export type Features = {
    sb_subul_show_quantity: string | 'yes' | 'no';
    sb_subul_items_merge: string | null;
    sb_subul_allow_wholesale_price: string | null;
    sb_subul_allow_decimal_quantities: 'yes' | 'no' | string;
    sb_subul_quick_product: 'yes' | 'no' | string;
    sb_subul_quick_product_default_unit: null | string;
    sb_subul_unit_price_ediable: 'yes' | 'no' | string;
    sb_subul_price_with_tax: null | string;
    sb_subul_order_types: string[];
    sb_subul_numpad: null | string;
    sb_subul_force_autofocus: null | string;
    sb_subul_hide_exhausted_products: null | string;
    sb_subul_hide_empty_categories: 'yes' | 'no' | string;
};

export type Shortcuts = {
    sb_subul_keyboard_cancel_order: string[];
    sb_subul_keyboard_hold_order: string[];
    sb_subul_keyboard_create_customer: string[];
    sb_subul_keyboard_payment: string[];
    sb_subul_keyboard_shipping: string[];
    sb_subul_keyboard_note: string[];
    sb_subul_keyboard_order_type: string[];
    sb_subul_keyboard_fullscreen: string[];
    sb_subul_keyboard_quick_search: string[];
    sb_subul_keyboard_toggle_merge: string[];
    sb_subul_amount_shortcut: null | string;
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
    sb_subul_layout: SelectOption[];
    sb_subul_complete_sale_audio: SelectOption[];
    sb_subul_new_item_audio: SelectOption[];
    sb_subul_printing_document: SelectOption[];
    sb_subul_printing_enabled_for: SelectOption[];
    sb_subul_printing_gateway: SelectOption[];
    sb_subul_printing_auto: SelectOption[];
    sb_subul_registers_enabled: SelectOption[];
    sb_subul_idle_counter: SelectOption[];
    sb_subul_disbursement: SelectOption[];
    sb_subul_registers_default_change_payment_type: PaymentTypeOption[];
    sb_subul_vat: SelectOption[];
    sb_subul_tax_group: TaxGroupOption[];
    sb_subul_tax_type: SelectOption[];
    sb_subul_keyboard_shortcuts: ShortcutOption[];
    sb_subul_show_quantity: SelectOption[];
    sb_subul_items_merge: SelectOption[];
    sb_subul_allow_wholesale_price: SelectOption[];
    sb_subul_allow_decimal_quantities: SelectOption[];
    sb_subul_quick_product: SelectOption[];
    sb_subul_quick_product_default_unit: SelectOption[];
    sb_subul_unit_price_ediable: SelectOption[];
    sb_subul_price_with_tax: SelectOption[];
    sb_subul_order_types: SelectOption[];
    sb_subul_numpad: SelectOption[];
    sb_subul_force_autofocus: SelectOption[];
    sb_subul_hide_exhausted_products: SelectOption[];
    sb_subul_hide_empty_categories: SelectOption[];
}
