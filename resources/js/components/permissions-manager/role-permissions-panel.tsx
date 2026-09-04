import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { ChevronDown, ChevronRight, RotateCcw, Save, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';

interface RolePermissionsPanelProps {
    role: RoleWithPermissions;
    permissions: Permission[]; // already filtered by search
    allPermissions: Permission[]; // full unfiltered list
    matrix: Record<number, boolean>;
    isDirty: boolean;
    isSaving: boolean;
    onToggle: (permissionId: number) => void;
    onToggleGroup: (permissionIds: number[], granted: boolean) => void;
    onSave: () => void;
    onReset: () => void;
}

interface NamespaceGroup {
    namespace: string;
    label: string;
    permissions: Permission[];
}

function groupPermissionsByNamespace(permissions: Permission[]): NamespaceGroup[] {
    const groups: Record<string, Permission[]> = {};

    for (const permission of permissions) {
        const parts = permission.namespace.split('.');
        // Group by the last segment — that is the resource/entity
        // e.g. "subul.create.categories"  → "categories"
        //      "subul.customers.manage-account-history" → "manage-account-history"
        //      "create.users" → "users"
        const groupKey = parts[parts.length - 1];
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(permission);
    }

    return Object.entries(groups)
        .map(([resource, perms]) => ({
            namespace: resource,
            // Humanize: replace hyphens with spaces and capitalize each word
            label: resource
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
            permissions: perms,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}


function NamespaceGroupRow({
    group,
    matrix,
    onToggle,
    onToggleGroup,
}: {
    group: NamespaceGroup;
    matrix: Record<number, boolean>;
    onToggle: (permissionId: number) => void;
    onToggleGroup: (permissionIds: number[], granted: boolean) => void;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(true);

    const grantedCount = group.permissions.filter((p) => matrix[p.id] ?? false).length;
    const allGranted = grantedCount === group.permissions.length;
    const noneGranted = grantedCount === 0;
    const isIndeterminate = !allGranted && !noneGranted;

    const ids = group.permissions.map((p) => p.id);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div
                className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                    'bg-muted/40 border',
                )}
            >
                <CollapsibleTrigger asChild>
                    <button
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                        aria-label={open ? t('Collapse group') : t('Expand group')}
                    >
                        {open ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="text-sm font-semibold">{group.label}</span>
                    </button>
                </CollapsibleTrigger>

                <Badge variant="secondary" className="ms-1 text-xs">
                    {grantedCount} / {group.permissions.length}
                </Badge>

                <div className="ms-auto flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{t('All')}</span>
                    <Checkbox
                        checked={isIndeterminate ? 'indeterminate' : allGranted}
                        onCheckedChange={(checked) => onToggleGroup(ids, checked === true)}
                        aria-label={`${t('Toggle all permissions in')} ${group.label}`}
                        className="h-4 w-4"
                    />
                </div>
            </div>

            <CollapsibleContent>
                <div className="mt-1 mb-2 space-y-1 ps-4">
                    {group.permissions.map((permission) => {
                        const isGranted = matrix[permission.id] ?? false;
                        return (
                            <div
                                key={permission.id}
                                onClick={() => onToggle(permission.id)}
                                className={cn(
                                    'flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 transition-colors',
                                    'hover:bg-accent/50 border border-transparent',
                                    isGranted && 'border-primary/20 bg-primary/5',
                                )}
                                title={permission.description}
                            >
                                <Checkbox
                                    id={`perm-${permission.id}`}
                                    checked={isGranted}
                                    onCheckedChange={() => onToggle(permission.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-0.5 h-4 w-4 shrink-0"
                                    aria-label={permission.name}
                                />
                                <div className="min-w-0 flex-1">
                                    <label
                                        htmlFor={`perm-${permission.id}`}
                                        className="block cursor-pointer text-sm font-medium"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {permission.name}
                                    </label>
                                    {permission.description && (
                                        <p className="text-muted-foreground mt-0.5 text-xs">
                                            {permission.description}
                                        </p>
                                    )}
                                    <code className="text-muted-foreground/70 mt-1 block text-xs">
                                        {permission.namespace}
                                    </code>
                                </div>
                                {isGranted && (
                                    <Badge
                                        variant="success"
                                        className="mt-0.5 shrink-0 text-xs"
                                    >
                                        {t('Granted')}
                                    </Badge>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

export default function RolePermissionsPanel({
    role,
    permissions,
    allPermissions,
    matrix,
    isDirty,
    isSaving,
    onToggle,
    onToggleGroup,
    onSave,
    onReset,
}: RolePermissionsPanelProps) {
    const { t } = useTranslation();

    const groups = useMemo(() => groupPermissionsByNamespace(permissions), [permissions]);

    const grantedCount = useMemo(
        () => Object.values(matrix).filter(Boolean).length,
        [matrix],
    );

    const isSearchFiltered = permissions.length < allPermissions.length;

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col">
            {/* Panel header */}
            <div className="flex flex-none flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:px-6 sm:py-4">
                {/* Left: icon + role info */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                        <Shield className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold sm:text-lg">{role.name}</h2>
                            {isDirty && (
                                <Badge variant="outline" className="border-orange-500 text-orange-500 text-xs">
                                    {t('Unsaved changes')}
                                </Badge>
                            )}
                        </div>
                        {role.description && (
                            <p className="text-muted-foreground text-xs sm:text-sm">{role.description}</p>
                        )}
                    </div>
                </div>

                {/* Right: stats + actions */}
                <div className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground text-xs sm:text-sm">
                        {grantedCount} / {allPermissions.length} {t('granted')}
                    </span>
                    <Separator orientation="vertical" className="h-5" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        disabled={!isDirty || isSaving}
                        title={t('Reset to saved state')}
                        className="h-8 px-2 sm:px-3"
                    >
                        <RotateCcw className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">{t('Reset')}</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSave}
                        disabled={!isDirty || isSaving}
                        className="h-8 gap-1 px-2 sm:gap-1.5 sm:px-3"
                    >
                        <Save className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{isSaving ? t('Saving…') : t('Save')}</span>
                        <span className="sm:hidden">{isSaving ? '…' : t('Save')}</span>
                    </Button>
                </div>
            </div>


            {/* Search filter notice */}
            {isSearchFiltered && (
                <div className="bg-muted/30 border-b px-6 py-2">
                    <p className="text-muted-foreground text-xs">
                        {t('Showing {shown} of {total} permissions matching your search', {
                            shown: permissions.length,
                            total: allPermissions.length,
                        })}
                    </p>
                </div>
            )}

            {/* Permission groups */}
            <ScrollArea className="flex-1">
                <div className="space-y-3 p-3 sm:p-6">
                    {groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Shield className="text-muted-foreground/40 mb-3 h-10 w-10" />
                            <p className="text-muted-foreground text-sm">{t('No permissions found')}</p>
                        </div>
                    ) : (
                        groups.map((group) => (
                            <NamespaceGroupRow
                                key={group.namespace}
                                group={group}
                                matrix={matrix}
                                onToggle={onToggle}
                                onToggleGroup={onToggleGroup}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
