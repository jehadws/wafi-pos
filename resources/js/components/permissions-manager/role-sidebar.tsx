import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

interface RoleSidebarProps {
  roles: RoleWithPermissions[];
  matrix: Record<number, Record<number, boolean>>;
  totalPermissions: number;
  selectedRoleId: number | null;
  dirtyRoles: Set<number>;
  onSelectRole: (roleId: number) => void;
  className?: string;
}

export default function RoleSidebar({ roles, matrix, totalPermissions, selectedRoleId, dirtyRoles, onSelectRole, className }: RoleSidebarProps) {
  const { t } = useTranslation();

  const getGrantedCount = (roleId: number): number => {
    const roleMatrix = matrix[roleId] ?? {};
    return Object.values(roleMatrix).filter(Boolean).length;
  };

  return (
    <aside className={cn('bg-card flex h-full w-72 max-w-xs min-w-[18rem] shrink-0 flex-col border-r rtl:border-r-0 rtl:border-l', className)}>
      {/* Sidebar header */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
        <ShieldCheck className="text-primary h-4 w-4" />
        <span className="text-sm font-semibold">{t('Roles')}</span>
        <Badge variant="secondary" className="ms-auto">
          {roles.length}
        </Badge>
      </div>

      <ScrollArea className="h-full flex-1">
        <div className="space-y-1.5 p-2.5">
          {roles.map((role) => {
            const granted = getGrantedCount(role.id);
            const isSelected = selectedRoleId === role.id;
            const isDirty = dirtyRoles.has(role.id);

            return (
              <button
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                className={cn(
                  'group relative w-full rounded-lg p-3 text-start transition-all duration-150',
                  'hover:bg-accent focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                  isSelected ? 'bg-primary/10 ring-primary/30 ring-1' : 'hover:bg-muted/60 bg-muted/20',
                )}
                aria-pressed={isSelected}
                aria-label={`${t('Select role')}: ${role.name}`}
              >
                {/* Unsaved indicator dot */}
                {isDirty && (
                  <span
                    className="ring-background absolute end-2.5 top-2.5 h-2 w-2 rounded-full bg-orange-500 ring-2"
                    aria-label={t('Unsaved changes')}
                    title={t('Unsaved changes')}
                  />
                )}

                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold uppercase',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {role.name.slice(0, 2)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={cn('truncate text-sm font-medium', isSelected ? 'text-primary font-semibold' : 'text-foreground')}>
                      {role.name}
                    </div>
                    {role.description && <div className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{role.description}</div>}
                    {/* Permission progress bar */}
                    <div className="mt-2">
                      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                        <div
                          className={cn('h-1.5 rounded-full transition-all duration-300', isSelected ? 'bg-primary' : 'bg-muted-foreground/40')}
                          style={{
                            width: totalPermissions > 0 ? `${Math.round((granted / totalPermissions) * 100)}%` : '0%',
                          }}
                        />
                      </div>
                      <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                        <span>
                          {granted} / {totalPermissions}
                        </span>
                        <span>{totalPermissions > 0 ? `${Math.round((granted / totalPermissions) * 100)}%` : '0%'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
