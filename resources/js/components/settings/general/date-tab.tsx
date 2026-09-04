import React, { useState } from 'react';
import FormField from '@/components/forms/shared/form-field';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import type { GeneralSettingsPayload, GeneralSettingsOptions } from './types';

interface DateTabProps {
    form: {
        data: GeneralSettingsPayload;
        setData: (field: string, value: any) => void;
    };
    options: GeneralSettingsOptions;
}

export function DateTab({ form, options }: DateTabProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FormField label={t('Date Format')} description={t('Define how the date should be formatted. Default is "Y-m-d".')}>
                <Select
                    value={form.data.date.sb_date_format ?? ''}
                    onValueChange={(v) => form.setData('date.sb_date_format', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Choose an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.sb_date_format.map((f) => (
                            <SelectItem key={f.value} value={f.value.toString()}>
                                {f.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField
                label={t('Date Time Format')}
                description={t('Define how date and time should be formatted. Default is "Y-m-d H:i".')}
            >
                <Select
                    value={form.data.date.sb_datetime_format ?? ''}
                    onValueChange={(v) => form.setData('date.sb_datetime_format', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('Choose an option')} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.sb_datetime_format.map((f) => (
                            <SelectItem key={f.value} value={f.value.toString()}>
                                {f.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField
                label={t('Date TimeZone')}
                description={`${t('Determine the default timezone of the store. Current Time:')} ${new Date().toLocaleString()}`}
            >
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                            {form.data.date.sb_datetime_timezone
                                ? options.sb_datetime_timezone.find(
                                      (tz) => tz.value === form.data.date.sb_datetime_timezone,
                                  )?.label
                                : t('Select timezone...')}
                            <ChevronsUpDown className="opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                        <Command>
                            <CommandInput placeholder={t('Search') + '...'} className="h-9" />
                            <CommandList>
                                <CommandEmpty>{t('No timezone found.')}</CommandEmpty>
                                <CommandGroup>
                                    {options.sb_datetime_timezone.map((tz) => (
                                        <CommandItem
                                            key={tz.value}
                                            value={tz.value.toString()}
                                            onSelect={(currentValue) => {
                                                form.setData('date.sb_datetime_timezone', currentValue);
                                                setOpen(false);
                                            }}
                                        >
                                            {tz.label}
                                            <Check
                                                className={cn(
                                                    'ml-auto',
                                                    form.data.date.sb_datetime_timezone === tz.value
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
    );
}
