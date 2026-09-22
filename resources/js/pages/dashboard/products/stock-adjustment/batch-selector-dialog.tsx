import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SelectableItem from '@/components/ui/selectable-item';
import { useTranslation } from '@/lib/i18n';
import React from 'react';

export interface BatchItem {
  label: string;
  value: number;
  available_quantity?: number;
}

export interface BatchSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batches: BatchItem[];
  selectedBatchId: number;
  onSelectBatch: (batchId: number) => void;
  isLoading?: boolean;
}

export const BatchSelectorDialog: React.FC<BatchSelectorDialogProps> = ({
  open,
  onOpenChange,
  batches,
  selectedBatchId,
  onSelectBatch,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Select Procurement Batch')}</DialogTitle>
          <DialogDescription>
            {t('Select the procurement batch that this stock adjustment targets.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {/* Option to clear / unselect batch (no batch targeted) */}
          <SelectableItem
            label={t('None (No Batch)')}
            value="0"
            selected={!selectedBatchId || selectedBatchId === 0}
            onChange={() => {
              onSelectBatch(0);
              onOpenChange(false);
            }}
          />

          {isLoading && (
            <div className="text-muted-foreground py-3 text-center text-sm">
              {t('Loading batches...')}
            </div>
          )}

          {!isLoading && batches.length === 0 && (
            <div className="text-muted-foreground py-3 text-center text-sm">
              {t('No procurement batches available for this product.')}
            </div>
          )}

          {!isLoading && batches.length > 0 && (
            <div className="max-h-[280px] space-y-1.5 overflow-y-auto">
              {batches.map((batch) => (
                <SelectableItem
                  key={batch.value}
                  value={batch.value.toString()}
                  label={batch.label}
                  selected={selectedBatchId === batch.value}
                  onChange={() => {
                    onSelectBatch(batch.value);
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
