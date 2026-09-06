/**
 * hooks/use-sequential-task-queue.ts
 *
 * Generic FIFO queue that runs async tasks strictly one at a time.
 *
 * Used by the POS product grid so rapid clicks are buffered and drained in
 * order instead of racing each other or being silently dropped by a guard.
 *
 * The running flag lives in a ref on purpose: unlike React state, ref updates
 * are synchronous, so event handlers can reliably test "is a task already
 * running" within the very tick that started one.
 */

import { useRef } from 'react';

export interface SequentialTaskQueue {
    /** Adds a task to the queue and starts the drain loop if idle. */
    enqueue: (task: () => Promise<void>) => void;
    /**
     * True while a task (or a backlog of queued tasks) is still running.
     * Synchronous — safe to read from event handlers for drop-when-busy.
     */
    isRunningRef: { current: boolean };
}

export function useSequentialTaskQueue(): SequentialTaskQueue {
    const queueRef = useRef<(() => Promise<void>)[]>([]);
    const isRunningRef = useRef(false);

    const drainAll = async () => {
        while (queueRef.current.length > 0) {
            const task = queueRef.current.shift();
            if (!task) continue;
            try {
                await task();
            } catch (error) {
                // One failing task must never starve the rest of the queue.
                console.error('[useSequentialTaskQueue] task failed:', error);
            }
        }
    };

    const enqueue = (task: () => Promise<void>) => {
        queueRef.current.push(task);
        if (isRunningRef.current) return;

        isRunningRef.current = true;
        void drainAll().finally(() => {
            isRunningRef.current = false;
        });
    };

    return { enqueue, isRunningRef };
}