'use client';

import { mediasApi } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { Loader2, Upload, X } from 'lucide-react';
import { useState } from 'react';
import FormField from '../shared/form-field';
import { ImagesTabProps } from './types';

export default function ImagesTab({ form }: ImagesTabProps) {
  const { t } = useTranslation();
  const [pendingUploads, setPendingUploads] = useState<{ file: File; previewUrl: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploading = pendingUploads.length > 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    e.target.value = '';
    setUploadError(null);

    const filesArray = Array.from(e.target.files);
    const pending = filesArray.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPendingUploads((prev) => [...prev, ...pending]);

    try {
      const results = await Promise.all(
        pending.map(async ({ file }) => {
          const formData = new FormData();
          formData.append('file', file, file.name);
          const res = await mediasApi.upload(formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return res?.files?.[0]?.url as string | undefined;
        }),
      );

      const urls = results.filter((url): url is string => Boolean(url));
      if (urls.length !== pending.length) {
        throw new Error(t('Some uploads failed'));
      }

      form.setData({
        ...form.data,
        images: [...form.data.images, ...urls],
      });
    } catch (err) {
      console.error('Image upload failed', err);
      setUploadError(err instanceof Error ? err.message : t('Upload failed'));
    } finally {
      setPendingUploads((prev) => {
        const next = prev.filter((p) => !pending.includes(p));
        prev.forEach((p) => !next.includes(p) && URL.revokeObjectURL(p.previewUrl));
        return next;
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
        <FormField label={t('Preview URL')} htmlFor="preview_url" description={t('URL for the main product image')} error={form?.errors?.images}>
          <Input
            id="preview_url"
            name="preview_url"
            value={form.data.images[0] || ''}
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
            {uploading ? (
              <Loader2 className="text-muted-foreground mx-auto mb-4 h-12 w-12 animate-spin" />
            ) : (
              <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            )}
            <p className="text-muted-foreground mb-2">{uploading ? t('Uploading…') : t('Click Here Or Drop Your File To Upload')}</p>
            <input type="file" id="file-upload" multiple accept="image/*" className="hidden" disabled={uploading} onChange={handleFileChange} />
            <label htmlFor="file-upload">
              <Button type="button" variant="outline" disabled={uploading}>
                {t('Choose Files')}
              </Button>
            </label>
          </div>
        </div>

        {uploadError && <p className="mt-4 text-sm text-red-600">{uploadError}</p>}

        {(form?.data?.images?.length > 0 || uploading) && (
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
                    className="absolute -end-2 -top-2 h-6 w-6 rounded-full p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {pendingUploads.map(({ file, previewUrl }) => (
                <div key={previewUrl} className="relative opacity-60">
                  <img src={previewUrl} alt={file.name} className="h-24 w-24 rounded-md object-cover" />
                  <Loader2 className="absolute start-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
