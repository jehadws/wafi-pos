export interface Customer {
    first_name: string;
    name?: string;
    id: number;
    owed_amount?: number | string;
    purchases_amount?: number | string;
    account_amount?: number | string;
    email?: string | null;
    phone?: string | null;
    gender?: string | null;
    description?: string | null;
    last_name?: string;
    pobox?: string | null;
    group_id?: number;
    author?: number;
    group_name?: string;
    billing?: any;
    shipping?: any;
    total_spent?: number;
    total_orders?: number;
    created_at?: string;
    updated_at?: string;
    total_sales_count?: number;
    total_sales?: number;
    birth_date?: string;
    credit_limit_amount?: number;
    coupons?: {
        name: string;
        discount_type: 'percentage_discount' | 'flat_discount';
        discount_value: number;
    }[];
    group?: {
        name?: string;
        id?: number;
        minimal_credit_payment?: number;
        reward_system_id?: number;
        description?: string | null;
    };
}
