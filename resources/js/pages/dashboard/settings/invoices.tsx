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
    ns_invoice_display_tax_breakdown: string | null;
    ns_invoice_merge_similar_products: string | null;
    ns_invoice_receipt_column_a: string | null;
    ns_invoice_receipt_column_b: string | null;
    ns_invoice_receipt_footer: string | null;
    ns_invoice_receipt_logo: string | null;
    ns_invoice_receipt_template: string | null;
};

type Payload = {
    receipts: General;
};

type Option = {
    label: string;
    value: string | number;
};

type Options = {
    ns_invoice_receipt_template: Option[];
    ns_invoice_merge_similar_products: Option[];
    ns_invoice_display_tax_breakdown: Option[];
};

const availableTags = [
    { tag: '{store_name}', description: 'displays the store name' },
    { tag: '{store_email}', description: 'displays the store email' },
    { tag: '{store_phone}', description: 'displays the store phone number' },
    { tag: '{cashier_name}', description: 'displays the cashier name' },
    { tag: '{cashier_id}', description: 'displays the cashier id' },
    { tag: '{order_code}', description: 'displays the order code' },
    { tag: '{order_date}', description: 'displays the order date' },
    { tag: '{order_type}', description: 'displays the order type' },
    { tag: '{customer_first_name}', description: 'displays the customer first name' },
    { tag: '{customer_last_name}', description: 'displays the customer last name' },
    { tag: '{customer_email}', description: 'displays the customer email' },
    { tag: '{customer_phone}', description: 'displays the customer phone' },
    { tag: '{total_amount}', description: 'displays the total amount' },
    { tag: '{tax_amount}', description: 'displays the tax amount' },
    { tag: '{discount_amount}', description: 'displays the discount amount' },
    { tag: '{payment_method}', description: 'displays the payment method' },
    { tag: '{change_amount}', description: 'displays the change amount' },
];

export default function ReceiptSettings() {
    const { options, payload } = usePage<{ options: Options; payload: General }>().props;
    const [isPending, startTransition] = useTransition();
    const { t } = useTranslation();

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
                                <p className="text-muted-foreground text-sm">Configure how invoice and receipts are used.</p>
                            </div>

                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                {t('Save Settings')}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Main Settings */}
                            <div className="space-y-6 lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Basic Configuration</CardTitle>
                                        <CardDescription>Set up the basic receipt template and branding</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <FormField label="Receipt Template" description="Choose the template that applies to receipts">
                                                <Select
                                                    value={form.data.receipts.ns_invoice_receipt_template}
                                                    onValueChange={(value) => form.setData('receipts.ns_invoice_receipt_template', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Choose a template" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem key={'null'} value={'null'}>
                                                            Select an option
                                                        </SelectItem>
                                                        {options.ns_invoice_receipt_template.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormField>

                                            <FormField label="Receipt Logo" description="Provide a URL to the logo.">
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="logoUrl"
                                                        placeholder="https://example.com/logo.png"
                                                        value={form.data.receipts.ns_invoice_receipt_logo || ''}
                                                        onChange={(e) => form.setData('receipts.ns_invoice_receipt_logo', e.target.value)}
                                                    />
                                                    <Button variant="outline" size="icon">
                                                        <Upload className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </FormField>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <FormField
                                                label="Show Tax Breakdown"
                                                description="Will display the tax breakdown on the receipt/invoice."
                                            >
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={
                                                            (form.data.receipts.ns_invoice_display_tax_breakdown ?? 'no') === 'yes'
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() => form.setData('receipts.ns_invoice_display_tax_breakdown', 'yes')}
                                                    >
                                                        {t('Yes')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={
                                                            (form.data.receipts.ns_invoice_display_tax_breakdown ?? 'no') === 'no'
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() => form.setData('receipts.ns_invoice_display_tax_breakdown', 'no')}
                                                    >
                                                        {t('No')}
                                                    </Button>
                                                </div>
                                            </FormField>

                                            <FormField
                                                label="Merge Products On Receipt/Invoice"
                                                description="All similar products will be merged to avoid a paper waste for the receipt/invoice."
                                            >
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={
                                                            (form.data.receipts.ns_invoice_merge_similar_products ?? 'no') === 'yes'
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() => form.setData('receipts.ns_invoice_merge_similar_products', 'yes')}
                                                    >
                                                        {t('Yes')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={
                                                            (form.data.receipts.ns_invoice_merge_similar_products ?? 'no') === 'no'
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() => form.setData('receipts.ns_invoice_merge_similar_products', 'no')}
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
                                        <CardTitle>Custom Content</CardTitle>
                                        <CardDescription>Customize the header and footer content of your receipts</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs defaultValue="header" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 border">
                                                <TabsTrigger
                                                    value="header"
                                                    className="data-[state=active]:bg-accent -mt-0.4 data-[state=active]:text-accent-foreground dark:data-[state=active]:text-accent-foreground dark:data-[state=active]:bg-accent"
                                                >
                                                    Header Content
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="footer"
                                                    className="data-[state=active]:bg-accent -mt-0.4 data-[state=active]:text-accent-foreground dark:data-[state=active]:text-accent-foreground dark:data-[state=active]:bg-accent"
                                                >
                                                    Footer Content
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="header" className="mt-3 space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="headerContent">Header Content</Label>
                                                    <Textarea
                                                        id="headerContent"
                                                        placeholder="Add custom header content here..."
                                                        value={form.data.receipts.ns_invoice_receipt_column_a || ''}
                                                        onChange={(e) => form.setData('receipts.ns_invoice_receipt_column_a', e.target.value)}
                                                        onFocus={() => setActiveTextarea('headerContent')}
                                                        className="min-h-[120px] font-mono text-sm"
                                                    />
                                                    <p className="text-muted-foreground text-sm">
                                                        This content will appear at the top of your receipts
                                                    </p>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="footer" className="mt-3 space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="footerContent">Footer Content</Label>
                                                    <Textarea
                                                        id="footerContent"
                                                        placeholder="Add custom footer content here..."
                                                        value={form.data.receipts.ns_invoice_receipt_footer || ''}
                                                        onChange={(e) => form.setData('receipts.ns_invoice_receipt_footer', e.target.value)}
                                                        onFocus={() => setActiveTextarea('footerContent')}
                                                        className="min-h-[120px] font-mono text-sm"
                                                    />
                                                    <p className="text-muted-foreground text-sm">
                                                        This content will appear at the bottom of your receipts
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
                                            Available Tags
                                        </CardTitle>
                                        <CardDescription>
                                            Click any tag to copy it, or click the insert button to add it to the active text area
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
                                                                    <p>Click to copy</p>
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
                                                                    <p>Copy tag</p>
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
