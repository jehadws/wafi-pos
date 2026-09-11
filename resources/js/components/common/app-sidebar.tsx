import AppLogo from '@/components/common/app-logo';
import { NavMain } from '@/components/common/nav-main';
import { NavUser } from '@/components/common/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { isRTLLocale } from '@/lib/i18n/direction';
import { Link, usePage } from '@inertiajs/react';

export function AppSidebar() {
  const { locale } = usePage().props;
  return (
    <Sidebar collapsible="icon" variant="inset" side="left" dir={isRTLLocale(String(locale)) ? 'rtl' : 'ltr'}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
