import RolePermissionsPanel from './role-permissions-panel';
import RoleSidebar from './role-sidebar';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';
import type { PermissionMatrix } from './types';

interface PermissionMatrixProps {
    permissions: Permission[];
    allPermissions: Permission[];
    roles: RoleWithPermissions[];
    matrix: PermissionMatrix;
    selectedRoleId: number | null;
    dirtyRoles: Set<number>;
    savingRoles: Set<number>;
    onSelectRole: (roleId: number) => void;
    onPermissionToggle: (roleId: number, permissionId: number) => void;
    onToggleGroup: (roleId: number, permissionIds: number[], granted: boolean) => void;
    onSaveRole: (roleId: number) => void;
    onResetRole: (roleId: number) => void;
}

export default function PermissionMatrix({
    permissions,
    allPermissions,
    roles,
    matrix,
    selectedRoleId,
    dirtyRoles,
    savingRoles,
    onSelectRole,
    onPermissionToggle,
    onToggleGroup,
    onSaveRole,
    onResetRole,
}: PermissionMatrixProps) {
    const { t } = useTranslation();

    const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

    return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border bg-background md:flex-row">
            {/* ── Mobile: horizontal role selector bar ─────────────────────── */}
            <div className="flex-none overflow-x-auto border-b bg-card p-2 md:hidden">
                <div className="flex items-center gap-1.5 min-w-max">
                    {roles.map((role) => {
                        const isSelected = selectedRoleId === role.id;
                        const isDirty = dirtyRoles.has(role.id);
                        return (
                            <button
                                key={role.id}
                                onClick={() => onSelectRole(role.id)}
                                className={cn(
                                    'relative flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isSelected
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                                aria-pressed={isSelected}
                            >
                                {isDirty && (
                                    <span className="absolute top-1 end-1 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-background" />
                                )}
                                <span className="font-semibold">{role.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Desktop: sidebar (always visible on md+, fixed width, no collapse) ── */}
            <RoleSidebar
                className="hidden md:flex"
                roles={roles}
                matrix={matrix}
                totalPermissions={allPermissions.length}
                selectedRoleId={selectedRoleId}
                dirtyRoles={dirtyRoles}
                onSelectRole={onSelectRole}
            />

            {/* ── Permissions panel (fills remaining space) ────────────────── */}
            <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
                {selectedRole ? (
                    <RolePermissionsPanel
                        role={selectedRole}
                        permissions={permissions}
                        allPermissions={allPermissions}
                        matrix={matrix[selectedRole.id] ?? {}}
                        isDirty={dirtyRoles.has(selectedRole.id)}
                        isSaving={savingRoles.has(selectedRole.id)}
                        onToggle={(permissionId) => onPermissionToggle(selectedRole.id, permissionId)}
                        onToggleGroup={(permissionIds, granted) =>
                            onToggleGroup(selectedRole.id, permissionIds, granted)
                        }
                        onSave={() => onSaveRole(selectedRole.id)}
                        onReset={() => onResetRole(selectedRole.id)}
                    />
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                        <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                            <Shield className="text-muted-foreground h-8 w-8" />
                        </div>
                        <div>
                            <p className="font-medium">{t('Select a role')}</p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {t('Choose a role from the sidebar to manage its permissions')}
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
