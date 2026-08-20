export interface UserProfileFormData {
    attribute_theme: string;
    attribute_avatar_link: string;
    attribute_language: string;
    shipping_first_name: string;
    shipping_last_name: string;
    shipping_phone: string;
    shipping_address_1: string;
    shipping_address_2: string;
    shipping_country: string;
    shipping_city: string;
    shipping_pobox: string;
    shipping_company: string;
    shipping_email: string;
    billing_first_name: string;
    billing_last_name: string;
    billing_phone: string;
    billing_address_1: string;
    billing_address_2: string;
    billing_country: string;
    billing_city: string;
    billing_pobox: string;
    billing_company: string;
    billing_email: string;
    security_old_password: string;
    security_password: string;
    security_password_confirm: string;
    token: Record<string, any>;
}
