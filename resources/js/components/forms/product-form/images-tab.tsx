'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { Upload, X } from 'lucide-react';
import FormField from '../shared/form-field';
import { ImagesTabProps } from './types';

export default function ImagesTab({ form }: ImagesTabProps) {
    const { t } = useTranslation();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            const fileUrls = filesArray.map((file) => URL.createObjectURL(file));

            form.setData({
                ...form.data,
                images: [...form.data.images, ...fileUrls],
            });
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...form.data.images];
        newImages.splice(index, 1);

        form.setData({
            ...form.data,
            images: newImages,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Product Images')}</CardTitle>
                <CardDescription>{t('Upload and manage product images')}</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                    label={t('Preview URL')}
                    htmlFor="preview_url"
                    description={t('URL for the main product image')}
                    error={form?.errors?.images}
                >
                    <Input
                        id="preview_url"
                        name="preview_url"
                        // value={form.data.images[0] || ''}
                        onChange={(e) => {
                            const newImages = [...form.data.images];
                            if (newImages.length === 0) {
                                newImages.push(e.target.value);
                            } else {
                                newImages[0] = e.target.value;
                            }
                            form.setData({
                                ...form.data,
                                images: newImages,
                            });
                        }}
                        placeholder={t('Enter preview URL')}
                    />
                </FormField>

                <div className="mt-6">
                    <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-8 text-center">
                        <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                        <p className="text-muted-foreground mb-2">{t('Click Here Or Drop Your File To Upload')}</p>
                        <input type="file" id="file-upload" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                        <label htmlFor="file-upload">
                            <Button type="button" variant="outline">
                                {t('Choose Files')}
                            </Button>
                        </label>
                    </div>
                </div>

                {form?.data?.images?.length > 0 && (
                    <div className="mt-4">
                        <h3 className="mb-2 text-sm font-medium">{t('Selected Images')}</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {form.data.images.map((imageUrl, index) => (
                                <div key={index} className="relative">
                                    <img src={imageUrl} alt={`${t('Preview')} ${index}`} className="h-24 w-24 rounded-md object-cover" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                        onClick={() => removeImage(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
