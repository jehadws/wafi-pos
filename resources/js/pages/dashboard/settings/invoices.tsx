import FormField from '@/components/forms/shared/form-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { useForm, usePage } from '@inertiajs/react';
import { settingsApi } from '@/api';
import { Copy, Info, Save, Upload } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

type General = {
    sb_invoice_display_tax_breakdown: string | null;
    sb_invoice_merge_similar_products: string | null;
    sb_invoice_receipt_column_a: string | null;
    sb_invoice_receipt_column_b: string | null;
    sb_invoice_receipt_footer: string | null;
    sb_invoice_receipt_logo: string | null;
    sb_invoice_receipt_template: string | null;
};

type Payload = {
    receipts: General;
};

type Option = {
    label: string;
    value: string | number;
};

type Options = {
    sb_invoice_receipt_template: Option[];
    sb_invoice_merge_similar_products: Option[];
    sb_invoice_display_tax_breakdown: Option[];
};

export default function ReceiptSettings() {
    const { options, payload } = usePage<{ options: Options; payload: General }>().props;
    const [isPending, startTransition] = useTransition();
    const { t } = useTranslation();

    const availableTags = [
        { tag: '{store_name}', description: t('displays the store name') },
        { tag: '{store_email}', description: t('displays the store email') },
        { tag: '{store_phone}', description: t('displays the store phone number') },
        { tag: '{cashier_name}', description: t('displays the cashier name') },
        { tag: '{cashier_id}', description: t('displays the cashier id') },
        { tag: '{order_code}', description: t('displays the order code') },
        { tag: '{order_date}', description: t('displays the order date') },
        { tag: '{order_type}', description: t('displays the order type') },
        { tag: '{customer_first_name}', description: t('displays the customer first name') },
        { tag: '{customer_last_name}', description: t('displays the customer last name') },
        { tag: '{customer_email}', description: t('displays the customer email') },
        { tag: '{customer_phone}', description: t('displays the customer phone') },
        { tag: '{total_amount}', description: t('displays the total amount') },
        { tag: '{tax_amount}', description: t('displays the tax amount') },
        { tag: '{discount_amount}', description: t('displays the discount amount') },
        { tag: '{payment_method}', description: t('displays the payment method') },
        { tag: '{change_amount}', description: t('displays the change amount') },
    ];

    const form = useForm<Payload>({
        receipts: {
            ...payload,
        },
    });

    const handleSave = () => {
        startTransition(async () => {
            try {
                await settingsApi.update('orders', form.data);
                toast(t('Settings saved'), { description: t('The settings was saved successfully.') });
            } catch (e: any) {
                toast(t('Failed to save'), {
                    description: e?.message || t('An unexpected error occurred.'),
                });
            }
        });
    };

    const [activeTextarea, setActiveTextarea] = useState<string | null>(null);

    const insertTag = (tag: string, targetField: string) => {
        const textarea = document.getElementById(targetField) as HTMLTextAreaElement;
        if (textarea) {
            // const start = textarea.selectionStart
            // const end = textarea.selectionEnd
            // const currentValue = settings[targetField as keyof ReceiptSettings] as string
            // const newValue = currentValue.substring(0, start) + tag + currentValue.substring(end)
            //
            // handleSettingChange(targetField as keyof ReceiptSettings, newValue)
            // Restore cursor position
            // setTimeout(() => {
            //   textarea.focus()
            //   textarea.setSelectionRange(start + tag.length, start + tag.length)
            // }, 0)
        }
    };

    const copyTag = (tag: string) => {
        navigator.clipboard.writeText(tag);
    };

    return (
        <AppLayout>
            <div className="p-6">
                <div className="space-y-6">
                    <div className="relative overflow-hidden">
                        <div className="relative flex flex-row items-center justify-between py-6">
                            <div>
                                <h1 className="text-2xl font-semibold">{t('Invoice Settings')}</h1>
                                <p className="text-muted-foreground text-sm">{t('Configure how invoice and receipts are used.')}</p>
                            </div>

                            <Button onClick={handleSave}>
                                <Save className="me-2 h-4 w-4" />
                                {t('Save Settings')}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Main Settings */}
                            <div className="space-y-6 lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('Basic Configuration')}</CardTitle>
                                        <CardDescription>{t('Set up the basic receipt template and branding')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <FormField label={t('Receipt Template')} description={t('Choose the template that applies to receipts')}>
                                                <Select
                                                    value={form.data.receipts.sb_invoice_receipt_template}
                                                    onValueChange={(value) => form.setData('receipts.sb_invoice_receipt_template', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={t('Choose a template')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem key={'null'} value={'null'}>
                                                            {t('Select an option')}
                                                        </SelectItem>
                                                        {options.sb_invoice_receipt_template.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormField>

                                            <FormField label={t('Receipt Logo')} description={t('Provide a URL to the logo.')}>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="logoUrl"
                                                        placeholder="https://example.com/logo.png"
                                                        value={form.data.receipts.sb_invoice_receipt_logo || ''}
                                                        onChange={(e) => form.setData('receipts.sb_invoice_receipt_logo', e.target.value)}
                                                    />
                                                    <Button variant="outline" size="icon">
                                                        <Upload className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </FormField>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <FormField
                                                label={t('Show Tax Breakdown')}
                                                description={t('Will display the tax breakdown on the receipt/invoice.')}
                                            >
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={
                                                            (form.data.receipts.sb_invoice_display_tax_breakdown ?? 'no') === 'yes'
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() => form.setData('receipts.sb_invoice_display_tax_breakdown', 'yes')}
                                                    >
                                                        {t('Yes')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={
                                                            (form.data.receipts.sb_invoice_display_tax_breakdown ?? 'no') === 'no'
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() => form.setData('receipts.sb_invoice_display_tax_breakdown', 'no')}
                                                    >
                                                        {t('No')}
                                                    </Button>
                                                </div>
                                            </FormField>

                                            <FormField
                                                label={t('Merge Products On Receipt/Invoice')}
                                                description={t('All similar products will be merged to avoid a paper waste for the receipt/invoice.')}
                                            >
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={
                                                            (form.data.receipts.sb_invoice_merge_similar_products ?? 'no') === 'yes'
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() => form.setData('receipts.sb_invoice_merge_similar_products', 'yes')}
                                                    >
                                                        {t('Yes')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={
                                                            (form.data.receipts.sb_invoice_merge_similar_products ?? 'no') === 'no'
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() => form.setData('receipts.sb_invoice_merge_similar_products', 'no')}
                                                    >
                                                        {t('No')}
                                                    </Button>
                                                </div>
                                            </FormField>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('Custom Content')}</CardTitle>
                                        <CardDescription>{t('Customize the header and footer content of your receipts')}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs defaultValue="header" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 border">
                                                <TabsTrigger
                                                    value="header"
                                                    className="data-[state=active]:bg-accent -mt-0.4 data-[state=active]:text-accent-foreground dark:data-[state=active]:text-accent-foreground dark:data-[state=active]:bg-accent"
                                                >
                                                    {t('Header Content')}
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="footer"
                                                    className="data-[state=active]:bg-accent -mt-0.4 data-[state=active]:text-accent-foreground dark:data-[state=active]:text-accent-foreground dark:data-[state=active]:bg-accent"
                                                >
                                                    {t('Footer Content')}
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="header" className="mt-3 space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="headerContent">{t('Header Content')}</Label>
                                                    <Textarea
                                                        id="headerContent"
                                                        placeholder={t('Add custom header content here...')}
                                                        value={form.data.receipts.sb_invoice_receipt_column_a || ''}
                                                        onChange={(e) => form.setData('receipts.sb_invoice_receipt_column_a', e.target.value)}
                                                        onFocus={() => setActiveTextarea('headerContent')}
                                                        className="min-h-[120px] font-mono text-sm"
                                                    />
                                                    <p className="text-muted-foreground text-sm">
                                                        {t('This content will appear at the top of your receipts')}
                                                    </p>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="footer" className="mt-3 space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="footerContent">{t('Footer Content')}</Label>
                                                    <Textarea
                                                        id="footerContent"
                                                        placeholder={t('Add custom footer content here...')}
                                                        value={form.data.receipts.sb_invoice_receipt_footer || ''}
                                                        onChange={(e) => form.setData('receipts.sb_invoice_receipt_footer', e.target.value)}
                                                        onFocus={() => setActiveTextarea('footerContent')}
                                                        className="min-h-[120px] font-mono text-sm"
                                                    />
                                                    <p className="text-muted-foreground text-sm">
                                                        {t('This content will appear at the bottom of your receipts')}
                                                    </p>
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Available Tags Sidebar */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            {t('Available Tags')}
                                        </CardTitle>
                                        <CardDescription>
                                            {t('Click any tag to copy it, or click the insert button to add it to the active text area')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-[600px] space-y-3 overflow-y-auto">
                                            {availableTags.map((item) => (
                                                <div key={item.tag} className="group">
                                                    <div className="hover:bg-muted-foreground/20 flex items-center justify-between gap-2 rounded-lg border p-2 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="cursor-pointer font-mono text-xs"
                                                                        onClick={() => copyTag(item.tag)}
                                                                    >
                                                                        {item.tag}
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Click to copy')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <p className="mt-1 text-xs leading-tight text-gray-500">{item.description}</p>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={() => copyTag(item.tag)}
                                                                    >
                                                                        <Copy className="h-3 w-3" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Copy tag')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
