import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import ModeToggleButton from '@/components/common/toggle-mode-button';
import { NotificationBell } from '@/components/common/notification-bell';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
  return (
    <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
      <div className='flex flex-row items-center justify-between w-full'>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
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
