import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationsApi } from '@/api/notifications';
import * as http from '@/api/http';
import type { AppNotification } from '@/types/models/notification';

describe('notificationsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getAll fetches all notifications from /notifications', async () => {
        const mockNotifications: AppNotification[] = [
            {
                id: 1,
                user_id: 10,
                identifier: 'notif-1',
                title: 'Low Stock',
                description: 'Stock is low',
                url: '#',
                source: 'system',
                dismissable: true,
                created_at: '2026-09-04 10:00:00',
                updated_at: '2026-09-04 10:00:00',
            },
        ];

        const spy = vi.spyOn(http, 'get').mockResolvedValueOnce(mockNotifications as any);
        const result = await notificationsApi.getAll();

        expect(spy).toHaveBeenCalledWith('/notifications');
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Low Stock');
    });

    it('dismiss sends DELETE to /notifications/:id', async () => {
        const mockResponse = { status: 'success', message: 'The notification has been successfully deleted' };
        const spy = vi.spyOn(http, 'del').mockResolvedValueOnce(mockResponse as any);

        const result = await notificationsApi.dismiss(42);

        expect(spy).toHaveBeenCalledWith('/notifications/42');
        expect(result.status).toBe('success');
    });

    it('clearAll sends DELETE to /notifications/all', async () => {
        const mockResponse = { status: 'success', message: 'All the notifications have been cleared.' };
        const spy = vi.spyOn(http, 'del').mockResolvedValueOnce(mockResponse as any);

        const result = await notificationsApi.clearAll();

        expect(spy).toHaveBeenCalledWith('/notifications/all');
        expect(result.status).toBe('success');
    });
});
