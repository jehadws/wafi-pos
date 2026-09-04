import { create } from 'zustand';
import { notificationsApi } from '@/api/notifications';
import type { AppNotification } from '@/types/models/notification';
import { toast } from 'sonner';

export interface NotificationsState {
    notifications: AppNotification[];
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    fetchNotifications: () => Promise<void>;
    dismiss: (id: number | string) => Promise<boolean>;
    clearAll: () => Promise<boolean>;
    setNotifications: (notifications: AppNotification[]) => void;
}

export const useNotifications = create<NotificationsState>((set, get) => ({
    notifications: [],
    isLoading: false,
    isInitialized: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await notificationsApi.getAll();
            set({
                notifications: Array.isArray(data) ? data : [],
                isLoading: false,
                isInitialized: true,
            });
        } catch (err: any) {
            console.error('[Notifications] Failed to fetch:', err);
            set({
                isLoading: false,
                isInitialized: true,
                error: err?.response?.data?.message || err?.message || 'Failed to load notifications',
            });
        }
    },

    dismiss: async (id: number | string) => {
        const previous = get().notifications;
        const targetId = Number(id);

        // Optimistic removal
        set({
            notifications: previous.filter((n) => n.id !== targetId),
        });

        try {
            const res = await notificationsApi.dismiss(targetId);
            toast.success(res?.message || 'Notification dismissed');
            return true;
        } catch (err: any) {
            // Rollback on failure
            set({ notifications: previous });
            toast.error(err?.response?.data?.message || err?.message || 'Failed to dismiss notification');
            return false;
        }
    },

    clearAll: async () => {
        const previous = get().notifications;
        if (previous.length === 0) return true;

        // Optimistic clear
        set({ notifications: [] });

        try {
            const res = await notificationsApi.clearAll();
            toast.success(res?.message || 'All notifications cleared');
            return true;
        } catch (err: any) {
            // Rollback on failure
            set({ notifications: previous });
            toast.error(err?.response?.data?.message || err?.message || 'Failed to clear notifications');
            return false;
        }
    },

    setNotifications: (notifications: AppNotification[]) => {
        set({ notifications, isInitialized: true });
    },
}));

export default useNotifications;
