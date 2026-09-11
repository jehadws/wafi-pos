/**
 * tests/integration/use-sequential-task-queue.test.ts
 *
 * The queue backing the POS product grid's click handling: tasks must run
 * strictly one at a time in enqueue order, never drop tasks enqueued while
 * the queue is busy, and survive a rejecting task.
 */
import { useSequentialTaskQueue } from '@/hooks/use-sequential-task-queue';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

function createDeferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Flush pending microtasks (including the isRunningRef finally-chain). */
const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

describe('hooks/use-sequential-task-queue', () => {
  it('runs tasks strictly one at a time, in enqueue order', async () => {
    const { result } = renderHook(() => useSequentialTaskQueue());
    const events: string[] = [];

    const first = createDeferred();
    const second = createDeferred();

    act(() => {
      result.current.enqueue(async () => {
        events.push('first:start');
        await first.promise;
        events.push('first:end');
      });
      result.current.enqueue(async () => {
        events.push('second:start');
        await second.promise;
        events.push('second:end');
      });
    });

    expect(events).toEqual(['first:start']);
    expect(result.current.isRunningRef.current).toBe(true);

    await act(async () => {
      first.resolve();
    });
    expect(events).toEqual(['first:start', 'first:end', 'second:start']);

    await act(async () => {
      second.resolve();
    });
    await settle();

    expect(events).toEqual(['first:start', 'first:end', 'second:start', 'second:end']);
    expect(result.current.isRunningRef.current).toBe(false);
  });

  it('never drops tasks enqueued while another task is running', async () => {
    const { result } = renderHook(() => useSequentialTaskQueue());
    const gate = createDeferred();
    const completed: number[] = [];

    act(() => {
      result.current.enqueue(async () => {
        await gate.promise;
      });
      // Rapid-fire enqueues while the first task is still running —
      // exactly the "fast clicking" scenario.
      for (let i = 1; i <= 6; i++) {
        result.current.enqueue(async () => {
          completed.push(i);
        });
      }
    });

    await act(async () => {
      gate.resolve();
    });
    await settle();

    expect(completed).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.current.isRunningRef.current).toBe(false);
  });

  it('flags isRunningRef synchronously from the first enqueue until the queue drains', async () => {
    const { result } = renderHook(() => useSequentialTaskQueue());
    const gate = createDeferred();

    expect(result.current.isRunningRef.current).toBe(false);

    let sawRunningDuringTask: boolean | undefined;
    act(() => {
      result.current.enqueue(async () => {
        sawRunningDuringTask = result.current.isRunningRef.current;
        await gate.promise;
      });
    });

    expect(result.current.isRunningRef.current).toBe(true);
    expect(sawRunningDuringTask).toBe(true);

    await act(async () => {
      gate.resolve();
    });
    await settle();

    expect(result.current.isRunningRef.current).toBe(false);
  });

  it('keeps draining after a task rejects', async () => {
    const { result } = renderHook(() => useSequentialTaskQueue());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const completed: string[] = [];

    act(() => {
      result.current.enqueue(async () => {
        throw new Error('boom');
      });
      result.current.enqueue(async () => {
        completed.push('after-failure');
      });
    });

    await settle();

    expect(completed).toEqual(['after-failure']);
    expect(result.current.isRunningRef.current).toBe(false);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
