import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Check, ChevronsUpDown, Loader2, Save, UploadCloud } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

type Identification = {
    ns_store_name: string | null;
    ns_store_address: string | null;
    ns_store_city: string | null;
    ns_store_phone: string | null;
    ns_store_email: string | null;
    ns_store_pobox: string | null;
    ns_store_fax: string | null;
    ns_store_additional: string | null;
    ns_store_square_logo: string | null;
    ns_store_rectangle_logo: string | null;
    ns_store_language: string | null;
    ns_default_theme: string | null;
};

type Currency = {
    ns_currency_symbol: string | null;
    ns_currency_iso: string | null;
    ns_currency_position: string | null;
    ns_currency_prefered: string | null;
    ns_currency_thousand_separator: string | null;
    ns_currency_decimal_separator: string | null;
    ns_currency_precision: number | null;
};

type DateCfg = {
    ns_date_format: string | null;
    ns_datetime_format: string | null;
    ns_datetime_timezone: string | null;
};

type Registration = {
    ns_registration_enabled: string | null;
    ns_registration_role: string | null;
    ns_registration_validated: string | null;
    ns_recovery_enabled: string | null;
};

type Payload = {
    identification: Identification;
    currency: Currency;
    date: DateCfg;
    registration: Registration;
};

type Option = {
    label: string;
    value: string | number;
};

type Options = {
    ns_currency_position: Option[];
    ns_currency_precision: Option[];
    ns_currency_prefered: Option[];
    ns_date_format: Option[];
    ns_datetime_format: Option[];
    ns_datetime_timezone: Option[];
    ns_default_theme: Option[];
    ns_registration_enabled: Option[];
    ns_registration_role: Option[];
    ns_registration_validated: Option[];
    ns_store_language: Option[];
};

export default function SettingsGeneral() {
    const { options, settings } = usePage<{ options: Options; settings: Payload }>().props;
    const [tab, setTab] = useState<'identification' | 'currency' | 'date' | 'registration'>('identification');
    const [isPending, startTransition] = useTransition();
    const { t } = useTranslation();
    // console.log("settings", settings)
    // console.log("options", options)

    const form = useForm<Payload>({
        identification: {
            ...settings.identification,
        },
        currency: {
            ...settings.currency,
        },
        date: {
            ...settings.date,
        },
        registration: {
            ...settings.registration,
        },
    });

    const handleSave = () => {
        startTransition(async () => {
            try {
                const res = await axios.post('/api/settings/general', form.data);
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
                            <h1 className="text-2xl font-semibold">{t('General Settings')}</h1>
                            <p className="text-muted-foreground text-sm">{t('Configure the general settings of the application.')}</p>
                            <div className="mt-4">
                                <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                                    <TabsList className="flex w-full max-w-xl justify-start">
                                        <TabsTrigger value="identification">{t('Identification')}</TabsTrigger>
                                        <TabsTrigger value="currency">{t('Currency')}</TabsTrigger>
                                        <TabsTrigger value="date">{t('Date')}</TabsTrigger>
                                        <TabsTrigger value="registration">{t('Registration')}</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                                <TabsContent value="identification" className="mt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <FormField label="Store Name" description="This is the store name." htmlFor="ns_store_name">
                                            <Input
                                                id="ns_store_name"
                                                value={form.data.identification.ns_store_name ?? ''}
                                                onChange={(e) => form.setData('identification.ns_store_name', e.target.value)}
                                            />
                                        </FormField>
                                        <FormField label="Store Address" description="The actual store address.">
                                            <Input
                                                value={form.data.identification.ns_store_address ?? ''}
                                                onChange={(e) => form.setData('identification.ns_store_address', e.target.value)}
                                            />
                                        </FormField>
                                        <FormField label="Store City" description="The actual store city.">
                                            <Input
                                                value={form.data.identification.ns_store_city ?? ''}
                                                onChange={(e) => form.setData('identification.ns_store_city', e.target.value)}
                                            />
                                        </FormField>

                                        <FormField label="Store Phone" description="The phone number to reach the store.">
                                            <Input
                                                value={form.data.identification.ns_store_phone ?? ''}
                                                onChange={(e) => form.setData('identification.ns_store_phone', e.target.value)}
                                            />
                                        </FormField>
                                        <FormField label="Store Email" description="The store email. Might be used on invoices or reports.">
                                            <Input
                                                type="email"
                                                value={form.data.identification.ns_store_email ?? ''}
                                                onChange={(e) => form.setData('identification.ns_store_email', e.target.value)}
                                            />
                                        </FormField>
                                        <FormField label="Store P.O.Box" description="The store mail box number.">
                                            <Input
                                                value={form.data.identification.ns_store_pobox ?? ''}
                                                onChange={(e) => form.setData('identification.ns_store_pobox', e.target.value)}
                                            />
                                        </FormField>

                                        <FormField label="Store Fax" description="The store fax number.">
                                            <Input
                                                value={form.data.identification.ns_store_fax ?? ''}
                                                onChange={(e) => form.setData('identification.ns_store_fax', e.target.value)}
                                            />
                                        </FormField>

                                        <div className="lg:col-span-2">
                                            <FormField label="Store Additional Information" description="Store additional information.">
                                                <Textarea
                                                    rows={5}
                                                    value={form.data.identification.ns_store_additional ?? ''}
                                                    onChange={(e) => form.setData('identification.ns_store_additional', e.target.value)}
                                                />
                                            </FormField>
                                        </div>

                                        <FormField label="Store Square Logo" description="Choose the square logo for the store.">
                                            <FilePicker
                                                value={form.data.identification.ns_store_square_logo}
                                                onChange={(v) => form.setData('identification.ns_store_square_logo', v)}
                                                placeholder="Paste an image URL or pick a file"
                                            />
                                        </FormField>

                                        <FormField label="Store Rectangle Logo" description="Choose the rectangle logo for the store.">
                                            <FilePicker
                                                value={form.data.identification.ns_store_rectangle_logo}
                                                onChange={(v) => form.setData('identification.ns_store_rectangle_logo', v)}
                                                placeholder="Paste an image URL or pick a file"
                                            />
                                        </FormField>

                                        <FormField label="Language" description="Define the default fallback language.">
                                            <Select
                                                value={form.data.identification.ns_store_language ?? 'en'}
                                                onValueChange={(v) => form.setData('identification.ns_store_language', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose language" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.ns_store_language.map((l) => (
                                                        <SelectItem key={l.value} value={l.value.toString()}>
                                                            {l.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>

                                        <FormField label="Theme" description="Define the default theme.">
                                            <Select
                                                value={form.data.identification.ns_default_theme ?? ''}
                                                onValueChange={(v) => form.setData('identification.ns_default_theme', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.ns_default_theme.map((t) => (
                                                        <SelectItem key={t.value} value={t.value.toString()}>
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                    </div>
                                </TabsContent>

                                <TabsContent value="currency" className="mt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <FormField label="Currency Symbol" description="This is the currency symbol." required>
                                            <Input
                                                value={form.data.currency.ns_currency_symbol ?? ''}
                                                onChange={(e) => form.setData('currency.ns_currency_symbol', e.target.value)}
                                            />
                                        </FormField>
                                        <FormField label="Currency ISO" description="The international currency ISO format." required>
                                            <Input
                                                value={form.data.currency.ns_currency_iso ?? ''}
                                                onChange={(e) => form.setData('currency.ns_currency_iso', e.target.value)}
                                            />
                                        </FormField>
                                        <FormField label="Currency Position" description="Define where the currency should be located.">
                                            <Select
                                                value={form.data.currency.ns_currency_position ?? ''}
                                                onValueChange={(v) => form.setData('currency.ns_currency_position', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.ns_currency_position.map((p) => (
                                                        <SelectItem key={p.value} value={p.value}>
                                                            {p.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>

                                        <FormField label="Preferred Currency" description="Determine which currency indicator should be used.">
                                            <Select
                                                value={form.data.currency.ns_currency_prefered ?? ''}
                                                onValueChange={(v) => form.setData('currency.ns_currency_prefered', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.ns_currency_prefered.map((p) => (
                                                        <SelectItem key={p.value} value={p.value}>
                                                            {p.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                        <FormField
                                            label="Currency Thousand Separator"
                                            description='Define the symbol that indicate thousand. By default "," is used.'
                                        >
                                            <Input
                                                value={form.data.currency.ns_currency_thousand_separator ?? ''}
                                                onChange={(e) => form.setData('currency.ns_currency_thousand_separator', e.target.value)}
                                            />
                                        </FormField>
                                        <FormField
                                            label="Currency Decimal Separator"
                                            description='Define the symbol that indicate decimal number. By default "." is used.'
                                        >
                                            <Input
                                                value={form.data.currency.ns_currency_decimal_separator ?? ''}
                                                onChange={(e) => form.setData('currency.ns_currency_decimal_separator', e.target.value)}
                                            />
                                        </FormField>

                                        <FormField label="Currency Precision" description="Define how many decimals to use.">
                                            <Select
                                                value={String(form.data.currency.ns_currency_precision ?? 2)}
                                                onValueChange={(v) => form.setData('currency.ns_currency_precision', Number(v))}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose precision" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[0, 1, 2, 3, 4].map((n) => (
                                                        <SelectItem key={n} value={String(n)}>
                                                            {n} {n === 1 ? 'number' : 'numbers'} after the decimal
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>
                                    </div>
                                </TabsContent>

                                <TabsContent value="date" className="mt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <FormField label="Date Format" description={'Define how the date should be formatted. Default is "Y-m-d".'}>
                                            <Select
                                                value={form.data.date.ns_date_format ?? ''}
                                                onValueChange={(v) => form.setData('date.ns_date_format', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.ns_date_format.map((f) => (
                                                        <SelectItem key={f.value} value={f.value}>
                                                            {f.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>

                                        <FormField
                                            label="Date Time Format"
                                            description={'Define how date and time should be formatted. Default is "Y-m-d H:i".'}
                                        >
                                            <Select
                                                value={form.data.date.ns_datetime_format ?? ''}
                                                onValueChange={(v) => form.setData('date.ns_datetime_format', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.ns_datetime_format.map((f) => (
                                                        <SelectItem key={f.value} value={f.value}>
                                                            {f.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>

                                        <FormField
                                            label="Date TimeZone"
                                            description={`Determine the default timezone of the store. Current Time: ${new Date().toLocaleString()}`}
                                        >
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                                                        {form.data.date.ns_datetime_timezone
                                                            ? options.ns_datetime_timezone.find(
                                                                  (tz) => tz.value === form.data.date.ns_datetime_timezone,
                                                              )?.label
                                                            : 'Select framework...'}
                                                        <ChevronsUpDown className="opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0">
                                                    <Command>
                                                        <CommandInput placeholder={t('Search') + '...'} className="h-9" />
                                                        <CommandList>
                                                            <CommandEmpty>No framework found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {options.ns_datetime_timezone.map((tz) => (
                                                                    <CommandItem
                                                                        key={tz.value}
                                                                        value={tz.value.toString()}
                                                                        onSelect={(currentValue) => {
                                                                            // setValue(currentValue === value ? "" : currentValue)
                                                                            // setOpen(false)
                                                                            form.setData('date.ns_datetime_timezone', currentValue);
                                                                        }}
                                                                    >
                                                                        {tz.label}
                                                                        <Check
                                                                            className={cn(
                                                                                'ml-auto',
                                                                                form.data.date.ns_datetime_timezone === tz.value
                                                                                    ? 'opacity-100'
                                                                                    : 'opacity-0',
                                                                            )}
                                                                        />
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </FormField>
                                    </div>
                                </TabsContent>

                                <TabsContent value="registration" className="mt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <FormField label="Registration Open" description="Determine if everyone can register.">
                                            <Select
                                                value={form.data.registration.ns_registration_enabled ?? 'no'}
                                                onValueChange={(v) => form.setData('registration.ns_registration_enabled', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="yes">Yes</SelectItem>
                                                    <SelectItem value="no">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormField>

                                        <FormField label="Registration Role" description="Select the registration role.">
                                            <Select
                                                value={form.data.registration.ns_registration_role ?? ''}
                                                onValueChange={(v) => form.setData('registration.ns_registration_role', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.ns_registration_role.map((r) => (
                                                        <SelectItem key={r.value} value={r.value}>
                                                            {r.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormField>

                                        <FormField label="Requires Validation" description="Force account validation after registration.">
                                            <Select
                                                value={form.data.registration.ns_registration_validated ?? ''}
                                                onValueChange={(v) => form.setData('registration.ns_registration_validated', v)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choose an option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="yes">Yes</SelectItem>
                                                    <SelectItem value="no">No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormField>

                                        <FormField label="Allow Recovery" description="Allow any user to recover their account.">
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={(form.data.registration.ns_recovery_enabled ?? 'yes') === 'yes' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('registration.ns_recovery_enabled', 'yes')}
                                                >
                                                    {t('Yes')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={(form.data.registration.ns_recovery_enabled ?? 'yes') === 'no' ? 'default' : 'outline'}
                                                    onClick={() => form.setData('registration.ns_recovery_enabled', 'no')}
                                                >
                                                    {t('No')}
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
                                {t('Save Settings')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function FilePicker({ value, onChange, placeholder }: { value: string | null; onChange: (val: string | null) => void; placeholder: string }) {
    // Since we don't have a real file manager here, mimic by letting users paste a URL or select a local file and show preview.
    const [localName, setLocalName] = useState('');
    const [preview, setPreview] = useState<string | null>(value);

    return (
        <div className="flex gap-2">
            <Input
                value={value ?? ''}
                placeholder={placeholder}
                onChange={(e) => {
                    onChange(e.target.value || null);
                    setPreview(e.target.value || null);
                }}
            />
            <label className="inline-flex items-center">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = URL.createObjectURL(f);
                        setLocalName(f.name);
                        setPreview(url);
                        onChange(url);
                    }}
                />
                <Button type="button" variant="outline" className="shrink-0 bg-transparent">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Pick
                </Button>
            </label>
            {preview && (
                <div className="h-9 w-9 overflow-hidden rounded border">
                    <img
                        src={preview || '/placeholder.svg'}
                        alt={localName || 'logo'}
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                    />
                </div>
            )}
        </div>
    );
}
