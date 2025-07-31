import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
  user: User;
}


export interface BreadcrumbItem {
  title: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon | null;
  isActive?: boolean;
}

/**
 * Represents a submenu/child menu item
 */
export interface SubMenuItem {
  label: string;
  href?: string;
  permissions?: string[];
  icon?: string;
}

/**
 * Represents a main menu item
 */
export interface MenuItem {
  label: string;
  permissions?: string[];
  icon?: string;
  href?: string;
  toggled?: boolean;
  notification?: number;
  childrens?: {
    [key: string]: SubMenuItem;
  };
}

/**
 * Represents the complete menu structure
 */
export interface Menus {
  [key: string]: MenuItem;
}

export interface SharedData {
  name: string;
  quote: { message: string; author: string };
  auth: Auth;
  ziggy: Config & { location: string };
  sidebarOpen: boolean;
  [key: string]: unknown;
}

export interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  username: string;
  email: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  pobox?: string;
  author?: number;
  group_id?: number;
  avatar?: string;
  created_at: string;
  updated_at: string;
  active: boolean;

  // activation_expiration : null
  // activation_token : null
  // account_amount : 0
  // credit_limit_amount : 0
  [key: string]: unknown; // This allows for additional properties...
}
