import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotifications } from '@/hooks/use-notifications';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/types/models/notification';
import { router } from '@inertiajs/react';
import { Bell, CheckCheck, ExternalLink, Info, Loader2, RefreshCw, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const { notifications, isLoading, isInitialized, fetchNotifications, dismiss, clearAll } = useNotifications();

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
                  'text-muted-foreground hover:bg-muted hover:text-foreground relative h-9 w-9 cursor-pointer rounded-lg',
                  isOpen && 'bg-muted text-foreground',
                  className,
                )}
                aria-label={t('Notifications')}
              >
                <Bell className="size-4.5" />
                {count > 0 && (
                  <span className="bg-destructive text-destructive-foreground ring-background animate-in zoom-in-50 absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2">
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

      <PopoverContent align={align} sideOffset={8} className="border-border/80 bg-popover/95 w-80 border p-0 shadow-lg backdrop-blur-sm sm:w-96">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-semibold">{t('Notifications')}</span>
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
              className="text-muted-foreground hover:text-foreground h-7 w-7"
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
                className="text-muted-foreground hover:text-destructive h-7 gap-1 px-2 text-xs transition-colors"
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
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-10">
            <Loader2 className="text-primary size-6 animate-spin" />
            <span className="text-xs">{t('Loading notifications...')}</span>
          </div>
        ) : count === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="bg-muted/60 mb-2 rounded-full p-3">
              <CheckCheck className="text-muted-foreground/80 size-6" />
            </div>
            <p className="text-foreground text-sm font-medium">{t('No notifications')}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{t('All caught up')}</p>
          </div>
        ) : (
          <ScrollArea className="divide-border/40 max-h-[380px] divide-y overflow-y-auto">
            {notifications.map((item) => {
              const hasUrl = item.url && item.url !== '#' && item.url.trim() !== '';

              return (
                <div
                  key={item.id}
                  className={cn('group hover:bg-muted/40 relative flex items-start gap-3 p-3.5 transition-colors', hasUrl && 'cursor-pointer')}
                  onClick={() => handleNotificationClick(item)}
                >
                  {/* Icon */}
                  <div className="bg-primary/10 text-primary mt-0.5 shrink-0 rounded-full p-1.5">
                    <Info className="size-4" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pe-4">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-foreground truncate text-xs font-semibold">{item.title}</h4>
                    </div>

                    <p className="text-muted-foreground mt-0.5 line-clamp-3 text-xs leading-relaxed break-words">{item.description}</p>

                    <div className="text-muted-foreground/70 mt-1.5 flex items-center gap-2 text-[11px]">
                      <span>{formatRelativeTime(item.created_at)}</span>

                      {hasUrl && (
                        <span className="text-primary inline-flex items-center gap-0.5 font-medium hover:underline">
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
                      className="text-muted-foreground hover:bg-muted hover:text-foreground absolute end-2 top-2 h-6 w-6 opacity-70 hover:opacity-100"
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
