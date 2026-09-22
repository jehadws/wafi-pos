import { BatchItem, BatchSelectorDialog } from '@/pages/dashboard/products/stock-adjustment/batch-selector-dialog';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

describe('BatchSelectorDialog', () => {
  const sampleBatches: BatchItem[] = [
    { label: 'Procurement #1 (10)', value: 101, available_quantity: 10 },
    { label: 'Procurement #2 (5)', value: 102, available_quantity: 5 },
  ];

  it('renders dialog title and batches when open', () => {
    render(
      <BatchSelectorDialog
        open={true}
        onOpenChange={vi.fn()}
        batches={sampleBatches}
        selectedBatchId={101}
        onSelectBatch={vi.fn()}
      />,
    );

    expect(screen.getByText('Select Procurement Batch')).toBeTruthy();
    expect(screen.getByText('None (No Batch)')).toBeTruthy();
    expect(screen.getByText('Procurement #1 (10)')).toBeTruthy();
    expect(screen.getByText('Procurement #2 (5)')).toBeTruthy();
  });

  it('calls onSelectBatch and onOpenChange(false) when a batch is clicked', () => {
    const onSelectBatch = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <BatchSelectorDialog
        open={true}
        onOpenChange={onOpenChange}
        batches={sampleBatches}
        selectedBatchId={101}
        onSelectBatch={onSelectBatch}
      />,
    );

    fireEvent.click(screen.getByText('Procurement #2 (5)'));
    expect(onSelectBatch).toHaveBeenCalledWith(102);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onSelectBatch(0) and onOpenChange(false) when None (No Batch) is clicked', () => {
    const onSelectBatch = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <BatchSelectorDialog
        open={true}
        onOpenChange={onOpenChange}
        batches={sampleBatches}
        selectedBatchId={101}
        onSelectBatch={onSelectBatch}
      />,
    );

    fireEvent.click(screen.getByText('None (No Batch)'));
    expect(onSelectBatch).toHaveBeenCalledWith(0);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows loading indicator when isLoading is true', () => {
    render(
      <BatchSelectorDialog
        open={true}
        onOpenChange={vi.fn()}
        batches={[]}
        selectedBatchId={0}
        onSelectBatch={vi.fn()}
        isLoading={true}
      />,
    );

    expect(screen.getByText('Loading batches...')).toBeTruthy();
  });

  it('shows empty message when no batches are available and not loading', () => {
    render(
      <BatchSelectorDialog
        open={true}
        onOpenChange={vi.fn()}
        batches={[]}
        selectedBatchId={0}
        onSelectBatch={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText('No procurement batches available for this product.')).toBeTruthy();
  });
});
