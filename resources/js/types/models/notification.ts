/**
 * Represents an in-app notification in Subul POS.
 */
export interface AppNotification {
  id: number;
  user_id: number;
  identifier: string;
  title: string;
  description: string;
  url?: string;
  source: string;
  dismissable: boolean;
  created_at: string;
  updated_at: string;
}
