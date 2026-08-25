import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '../../../lib/i18n';
import FormField from '../shared/form-field';

type Condition = {
    value: string;
    label: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedProduct: Product | null | undefined;
    onProductChange: (product: Product) => void;
    onConfirm: () => void;
    conditionError?: string;
    conditions: Condition[];
};

export default function ProductConditionDialog({ open, onOpenChange, selectedProduct, onProductChange, onConfirm, conditionError, conditions }: Props) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t('Products')}</DialogTitle>
                    <DialogDescription className="sr-only">{t('Products')}</DialogDescription>
                </DialogHeader>

                <FormField label={t('Unit Price')} htmlFor="unit_price" description={t('Define what is the unit price of the product.')}>
                    <Input
                        id="unit_price"
                        name="unit_price"
                        value={selectedProduct?.unit_price}
                        onChange={(e) => onProductChange({ ...selectedProduct, unit_price: e.target.value } as Product)}
                        placeholder={t('Define what is the unit price of the product.')}
                    />
                </FormField>

                <FormField
                    label={t('Condition')}
                    htmlFor="condition"
                    description={t('Determine in which condition the product is returned.')}
                    error={conditionError}
                >
                    <Select
                        value={selectedProduct?.condition || undefined}
                        onValueChange={(value) => onProductChange({ ...selectedProduct, condition: value } as Product)}
                    >
                        <SelectTrigger className={conditionError ? 'w-full border-red-500' : 'w-full'}>
                            <SelectValue placeholder={t('Choose an option')} />
                        </SelectTrigger>
                        <SelectContent>
                            {conditions.map((condition) => (
                                <SelectItem key={condition.value} value={condition.value}>
                                    {t(condition.label)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label={t('Other Observations')}
                    htmlFor="observations"
                    description={t('Describe in details the condition of the returned product.')}
                >
                    <Textarea
                        id="observations"
                        name="observations"
                        value={selectedProduct?.description || ''}
                        onChange={(e) => onProductChange({ ...selectedProduct, description: e.target.value } as Product)}
                        placeholder={t('Describe in details the condition of the returned product.')}
                        rows={4}
                    />
                </FormField>

                <DialogFooter className="mt-auto">
                    <div className="mt-2 flex w-full flex-row items-center justify-end">
                        <Button onClick={onConfirm} variant="default">
                            {t('Add Product')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
