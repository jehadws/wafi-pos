import { NavMain } from '@/components/common/nav-main';
import { NavUser } from '@/components/common/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/common/app-logo';


export function AppSidebar() {
  const { locale } = usePage().props;
  return (
    <Sidebar collapsible="icon" variant="inset" dir={locale === 'ar' ? 'rtl' : 'ltr'} side={locale === 'ar' ? 'right' : 'left'}>
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
