'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';
import { AlertTriangle, CheckCircle, HelpCircle, Info, XCircle } from 'lucide-react';

export type ConfirmationVariant = 'default' | 'destructive' | 'warning' | 'info' | 'success';

export interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
    loading?: boolean;
}

const variantConfig = {
    default: {
        icon: HelpCircle,
        iconColor: 'text-blue-500',
        confirmButtonVariant: 'default' as const,
    },
    destructive: {
        icon: XCircle,
        iconColor: 'text-red-500',
        confirmButtonVariant: 'destructive' as const,
    },
    warning: {
        icon: AlertTriangle,
        iconColor: 'text-yellow-500',
        confirmButtonVariant: 'default' as const,
    },
    info: {
        icon: Info,
        iconColor: 'text-blue-500',
        confirmButtonVariant: 'default' as const,
    },
    success: {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        confirmButtonVariant: 'default' as const,
    },
};

export default function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    loading = false,
}: ConfirmationDialogProps) {
    const { t } = useTranslation();
    const config = variantConfig[variant];
    const Icon = config.icon;

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={`bg-muted rounded-full p-2 ${config.iconColor}`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-left">{title || t('Confirm Your Action')}</DialogTitle>
                        </div>
                    </div>
                    {description && (
                        <DialogDescription className="mt-2 text-left">
                            {description || t('The processing status of order will be changed. Please confirm your action.')}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                        {cancelText || t('Cancel')}
                    </Button>
                    <Button type="button" variant={config.confirmButtonVariant} onClick={handleConfirm} disabled={loading} className="flex-1">
                        {loading ? t('Loading...') : confirmText || t('Submit')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
