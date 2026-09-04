import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotifications } from '@/hooks/use-notifications';
import { notificationsApi } from '@/api/notifications';
import type { AppNotification } from '@/types/models/notification';

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const sampleNotifications: AppNotification[] = [
    {
        id: 1,
        user_id: 1,
        identifier: 'test-1',
        title: 'Notification One',
        description: 'First description',
        url: '#',
        source: 'system',
        dismissable: true,
        created_at: '2026-09-04 10:00:00',
        updated_at: '2026-09-04 10:00:00',
    },
    {
        id: 2,
        user_id: 1,
        identifier: 'test-2',
        title: 'Notification Two',
        description: 'Second description',
        url: '/dashboard/orders',
        source: 'orders',
        dismissable: true,
        created_at: '2026-09-04 11:00:00',
        updated_at: '2026-09-04 11:00:00',
    },
];

describe('useNotifications Store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useNotifications.setState({
            notifications: [],
            isLoading: false,
            isInitialized: false,
            error: null,
        });
    });

    it('fetches and sets notifications correctly', async () => {
        vi.spyOn(notificationsApi, 'getAll').mockResolvedValueOnce(sampleNotifications);

        await useNotifications.getState().fetchNotifications();

        const state = useNotifications.getState();
        expect(state.notifications).toHaveLength(2);
        expect(state.isInitialized).toBe(true);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
    });

    it('handles fetch failure gracefully', async () => {
        vi.spyOn(notificationsApi, 'getAll').mockRejectedValueOnce(new Error('Network error'));

        await useNotifications.getState().fetchNotifications();

        const state = useNotifications.getState();
        expect(state.notifications).toHaveLength(0);
        expect(state.isInitialized).toBe(true);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Network error');
    });

    it('dismisses a single notification optimistically', async () => {
        useNotifications.setState({
            notifications: [...sampleNotifications],
            isInitialized: true,
        });

        const dismissSpy = vi.spyOn(notificationsApi, 'dismiss').mockResolvedValueOnce({
            status: 'success',
            message: 'Dismissed',
        });

        const success = await useNotifications.getState().dismiss(1);

        expect(success).toBe(true);
        expect(dismissSpy).toHaveBeenCalledWith(1);
        const state = useNotifications.getState();
        expect(state.notifications).toHaveLength(1);
        expect(state.notifications[0].id).toBe(2);
    });

    it('rolls back dismissed notification on API failure', async () => {
        useNotifications.setState({
            notifications: [...sampleNotifications],
            isInitialized: true,
        });

        vi.spyOn(notificationsApi, 'dismiss').mockRejectedValueOnce(new Error('Failed to delete'));

        const success = await useNotifications.getState().dismiss(1);

        expect(success).toBe(false);
        const state = useNotifications.getState();
        expect(state.notifications).toHaveLength(2);
        expect(state.notifications[0].id).toBe(1);
    });

    it('clears all notifications optimistically', async () => {
        useNotifications.setState({
            notifications: [...sampleNotifications],
            isInitialized: true,
        });

        const clearSpy = vi.spyOn(notificationsApi, 'clearAll').mockResolvedValueOnce({
            status: 'success',
            message: 'Cleared all',
        });

        const success = await useNotifications.getState().clearAll();

        expect(success).toBe(true);
        expect(clearSpy).toHaveBeenCalled();
        expect(useNotifications.getState().notifications).toHaveLength(0);
    });

    it('rolls back on clearAll failure', async () => {
        useNotifications.setState({
            notifications: [...sampleNotifications],
            isInitialized: true,
        });

        vi.spyOn(notificationsApi, 'clearAll').mockRejectedValueOnce(new Error('Clear error'));

        const success = await useNotifications.getState().clearAll();

        expect(success).toBe(false);
        expect(useNotifications.getState().notifications).toHaveLength(2);
    });
});
