import { beforeEach, describe, expect, it } from 'vitest';
import { usePOS } from '@/hooks/usePOS';

describe('use-pos-dialogs (Zustand Dialog Slice)', () => {
    beforeEach(() => {
        usePOS.getState().reset();
    });

    it('opens dialog and resolves promise on close with returned payload', async () => {
        const store = usePOS.getState();

        let resolvedValue: any = undefined;
        const promise = store.openDialog('selectQuantity' as any).then((val) => {
            resolvedValue = val;
        });

        expect((usePOS.getState().openDialogs as Record<string, boolean>)['selectQuantity']).toBe(true);

        const mockPayload = { id: 10, name: 'Box of 12' };
        usePOS.getState().closeDialog('selectQuantity' as any, mockPayload as any);

        await promise;

        expect(resolvedValue).toEqual(mockPayload);
        expect((usePOS.getState().openDialogs as Record<string, boolean>)['selectQuantity']).toBe(false);
    });
});
