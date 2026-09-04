import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Bell,
    BellOff,
    CheckCheck,
    ExternalLink,
    Info,
    Loader2,
    RefreshCw,
    Trash2,
    X,
} from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/types/models/notification';

interface NotificationBellProps {
    className?: string;
    align?: 'start' | 'center' | 'end';
}

function formatRelativeTime(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateString;

    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export function NotificationBell({ className, align = 'end' }: NotificationBellProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const {
        notifications,
        isLoading,
        isInitialized,
        fetchNotifications,
        dismiss,
        clearAll,
    } = useNotifications();

    // Fetch on initial mount
    useEffect(() => {
        if (!isInitialized) {
            fetchNotifications();
        }
    }, [isInitialized, fetchNotifications]);

    // Polling every 60 seconds when document is visible
    useEffect(() => {
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && !document.hidden) {
                fetchNotifications();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const count = notifications.length;

    const handleNotificationClick = (item: AppNotification) => {
        if (item.url && item.url !== '#' && item.url.trim() !== '') {
            setIsOpen(false);
            if (item.url.startsWith('http://') || item.url.startsWith('https://')) {
                window.open(item.url, '_blank', 'noopener,noreferrer');
            } else {
                router.visit(item.url);
            }
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    'relative h-9 w-9 cursor-pointer rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground',
                                    isOpen && 'bg-muted text-foreground',
                                    className,
                                )}
                                aria-label={t('Notifications')}
                            >
                                <Bell className="size-4.5" />
                                {count > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background animate-in zoom-in-50">
                                        {count > 99 ? '99+' : count}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>{t('Notifications')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <PopoverContent
                align={align}
                sideOffset={8}
                className="w-80 sm:w-96 p-0 shadow-lg border border-border/80 bg-popover/95 backdrop-blur-sm"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                            {t('Notifications')}
                        </span>
                        {count > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-normal">
                                {count}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => fetchNotifications()}
                            disabled={isLoading}
                            title={t('Refresh')}
                        >
                            <RefreshCw className={cn('size-3.5', isLoading && 'animate-spin')} />
                        </Button>

                        {count > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive transition-colors gap-1"
                                onClick={() => clearAll()}
                                disabled={isLoading}
                            >
                                <Trash2 className="size-3" />
                                <span>{t('Clear All')}</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                {isLoading && !isInitialized ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <span className="text-xs">{t('Loading notifications...')}</span>
                    </div>
                ) : count === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-muted-foreground">
                        <div className="rounded-full bg-muted/60 p-3 mb-2">
                            <CheckCheck className="size-6 text-muted-foreground/80" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{t('No notifications')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t('All caught up')}
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
                        {notifications.map((item) => {
                            const hasUrl = item.url && item.url !== '#' && item.url.trim() !== '';

                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'group relative flex items-start gap-3 p-3.5 transition-colors hover:bg-muted/40',
                                        hasUrl && 'cursor-pointer',
                                    )}
                                    onClick={() => handleNotificationClick(item)}
                                >
                                    {/* Icon */}
                                    <div className="shrink-0 mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                                        <Info className="size-4" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center justify-between gap-1">
                                            <h4 className="text-xs font-semibold text-foreground truncate">
                                                {item.title}
                                            </h4>
                                        </div>

                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3 leading-relaxed break-words">
                                            {item.description}
                                        </p>

                                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground/70">
                                            <span>{formatRelativeTime(item.created_at)}</span>

                                            {hasUrl && (
                                                <span className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium">
                                                    <span>{t('View')}</span>
                                                    <ExternalLink className="size-2.5" />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dismiss Button */}
                                    {item.dismissable && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dismiss(item.id);
                                            }}
                                            title={t('Dismiss')}
                                        >
                                            <X className="size-3.5" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </ScrollArea>
                )}
            </PopoverContent>
        </Popover>
    );
}

export default NotificationBell;
