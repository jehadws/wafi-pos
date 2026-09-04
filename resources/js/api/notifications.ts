import { del, get } from './http';
import type { AppNotification } from '@/types/models/notification';

export interface NotificationActionResponse {
    status: string;
    message: string;
}

/**
 * Notifications API — `/api/notifications/*`
 */
export const notificationsApi = {
    /** Fetch all notifications for the authenticated user. */
    getAll: () => get<AppNotification[]>('/notifications'),

    /** Dismiss/delete a single notification by ID. */
    dismiss: (id: number | string) => del<NotificationActionResponse>(`/notifications/${id}`),

    /** Clear all notifications for the current user. */
    clearAll: () => del<NotificationActionResponse>('/notifications/all'),
};

export default notificationsApi;
