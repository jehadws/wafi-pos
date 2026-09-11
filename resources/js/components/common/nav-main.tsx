import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useTranslation } from '@/lib/i18n';
import { Menus } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileImage,
  FileText,
  Home,
  Layers,
  ListOrdered,
  LucideIcon,
  Package,
  Plug,
  Settings,
  Shield,
  ShoppingCart,
  Truck,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';

// Map of icon names to Lucide components
const iconComponents: Record<string, LucideIcon> = {
  Home,
  ShoppingCart,
  ListOrdered,
  FileImage,
  Users,
  User,
  Layers,
  Package,
  Plug,
  Shield,
  Truck,
  BarChart3,
  Settings,
  FileText,
};

// Icon component to render the appropriate Lucide icon
const MenuIcon = ({ iconName }: { iconName?: string }) => {
  if (!iconName) return null;

  const IconComponent = iconComponents[iconName];
  if (!IconComponent) {
    console.warn(`Icon not found: ${iconName}`);
    return null;
  }

  return <IconComponent className="me-2 h-4 w-4" />;
};

export function NavMain() {
  const { menus } = usePage().props as unknown as { menus: Menus };
  const { t } = useTranslation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.entries(menus || {}).map(([key, item]) => [key, item.toggled || false])),
  );

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!menus) {
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SidebarGroup className="overflow-hidden px-2 py-0">
        <SidebarGroupLabel>{t('Platform')}</SidebarGroupLabel>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="">
              <SidebarMenu>
                {Object.entries(menus || {}).map(([key, item]) => {
                  if (!item) return null;

                  const hasChildren = item.childrens && Object.keys(item.childrens || {}).length > 0;
                  const isExpanded = expandedMenus[key];

                  return (
                    <SidebarMenuItem key={key}>
                      {hasChildren ? (
                        <>
                          <SidebarMenuButton onClick={() => toggleMenu(key)} isActive={item.toggled} tooltip={{ children: item.label || '' }}>
                            <MenuIcon iconName={item.icon} />
                            <span>{item.label || ''}</span>
                            <span className="ms-auto">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 rtl:rotate-180" />}
                            </span>
                          </SidebarMenuButton>

                          {isExpanded && (
                            <SidebarMenuSub>
                              {Object.entries(item.childrens || {}).map(([childKey, child]) =>
                                child ? (
                                  <SidebarMenuSubItem key={childKey}>
                                    <SidebarMenuSubButton asChild isActive={child.active}>
                                      <Link href={child.href || '#'} prefetch>
                                        <span>{child.label || ''}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ) : null,
                              )}
                            </SidebarMenuSub>
                          )}
                        </>
                      ) : (
                        <SidebarMenuButton asChild isActive={item.active} tooltip={{ children: item.label || '' }}>
                          <Link href={item.href || '#'} prefetch>
                            <MenuIcon iconName={item.icon} />
                            <span>{item.label || ''}</span>
                            {item.notification && item.notification > 0 && (
                              <span className="ms-auto rounded-full bg-red-500 px-2 py-1 text-xs text-white">{item.notification}</span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          </ScrollArea>
        </div>
      </SidebarGroup>
    </div>
  );
}
