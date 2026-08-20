import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud } from 'lucide-react';

interface FilePickerProps {
    value: string | null;
    onChange: (val: string | null) => void;
    placeholder: string;
}

export function FilePicker({ value, onChange, placeholder }: FilePickerProps) {
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
