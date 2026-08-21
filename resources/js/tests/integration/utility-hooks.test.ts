import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedEffect } from '@/hooks/use-debounced-effect';
import { usePosBeforeUnload } from '@/hooks/use-pos-before-unload';
import { usePOS } from '@/hooks/usePOS';

describe('utility hooks', () => {
    describe('useDebouncedEffect', () => {
        it('delays callback execution until delay elapsed', () => {
            vi.useFakeTimers();
            const callback = vi.fn();

            let count = 0;
            const { rerender } = renderHook(
                ({ c }) => useDebouncedEffect(callback, [c], 300),
                { initialProps: { c: count } },
            );

            expect(callback).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(200);
            });
            expect(callback).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(150);
            });
            expect(callback).toHaveBeenCalledTimes(1);

            vi.useRealTimers();
        });
    });

    describe('usePosBeforeUnload', () => {
        it('attaches and removes beforeunload listener', () => {
            const addSpy = vi.spyOn(window, 'addEventListener');
            const removeSpy = vi.spyOn(window, 'removeEventListener');

            const { unmount } = renderHook(() => usePosBeforeUnload());

            expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

            unmount();
            expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        });
    });
});
