import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { NotificationBell } from '@/components/common/notification-bell';
import ModeToggleButton from '@/components/common/toggle-mode-button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
  return (
    <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ms-1" />
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ModeToggleButton />
        </div>
      </div>
    </header>
  );
}
