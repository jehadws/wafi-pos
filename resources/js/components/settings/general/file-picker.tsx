import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UploadCloud } from 'lucide-react';
import { mediasApi } from '@/api';

interface FilePickerProps {
    value: string | null;
    onChange: (val: string | null) => void;
    placeholder: string;
}

export function FilePicker({ value, onChange, placeholder }: FilePickerProps) {
    const [localName, setLocalName] = useState('');
    const [preview, setPreview] = useState<string | null>(value);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (f: File) => {
        setUploading(true);
        const localUrl = URL.createObjectURL(f);
        setLocalName(f.name);
        setPreview(localUrl);
        try {
            const form = new FormData();
            form.append('file', f, f.name);
            const res = await mediasApi.upload(form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = (res?.files?.[0]?.url as string | undefined) ?? null;
            if (!url) throw new Error('Upload failed');
            onChange(url);
            setPreview(url);
        } catch (err) {
            console.error('Logo upload failed', err);
            onChange(null);
            setPreview(value ?? null);
        } finally {
            URL.revokeObjectURL(localUrl);
            setUploading(false);
        }
    };

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
                    disabled={uploading}
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (!f || uploading) return;
                        handleFile(f);
                    }}
                />
                <Button type="button" variant="outline" className="shrink-0 bg-transparent" disabled={uploading}>
                    {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                    )}
                    {uploading ? 'Uploading…' : 'Pick'}
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
