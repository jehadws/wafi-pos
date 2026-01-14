'use client';

import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PermissionSearchProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export default function PermissionSearch({ onSearch, placeholder }: PermissionSearchProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');

    // Handle keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                const searchInput = document.getElementById('permission-search') as HTMLInputElement;
                searchInput?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleChange = (value: string) => {
        setQuery(value);
        onSearch(value);
    };

    return (
        <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
                id="permission-search"
                type="text"
                placeholder={placeholder ?? t('Press "/" to search permissions')}
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                className="h-12 pl-10 text-base"
            />
        </div>
    );
}
