import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PermissionSearchProps {
    onSearch: (query: string) => void;
}

export default function PermissionSearch({ onSearch }: PermissionSearchProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
                ref={inputRef}
                type="text"
                placeholder={t('Press "/" to search permissions')}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onSearch(e.target.value);
                }}
                className="h-12 ps-10 text-base"
            />
        </div>
    );
}
