import PermissionMatrix from '@/components/permissions-manager/permission-matrix';
import PermissionSearch from '@/components/permissions-manager/permission-search';
import { buildInitialMatrix } from '@/components/permissions-manager/types';
import type { PermissionMatrix as PermissionMatrixData } from '@/components/permissions-manager/types';
import { usersApi } from '@/api/users';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { Head, usePage } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function PermissionManager() {
    const { title, permissions, roles } = usePage<{
        title?: string;
        permissions: Permission[];
        roles: RoleWithPermissions[];
    }>().props;
    const { t } = useTranslation();

    const breadcrumbs = [
        { title: t('Dashboard'), href: '/dashboard' },
        { title: t('Roles'), href: '/dashboard/roles' },
    ];

    const [searchQuery, setSearchQuery] = useState('');
    const [matrix, setMatrix] = useState<PermissionMatrixData>(() => buildInitialMatrix(roles));

    /**
     * Track which role IDs have local unsaved changes.
     */
    const [dirtyRoles, setDirtyRoles] = useState<Set<number>>(new Set());

    /**
     * Track which role IDs are currently being saved (for loading state).
     */
    const [savingRoles, setSavingRoles] = useState<Set<number>>(new Set());

    /**
     * The role currently displayed in the right panel.
     * Default to the first role so the UI is never blank.
     */
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(
        roles.length > 0 ? roles[0].id : null,
    );

    // ─── Search filtering ────────────────────────────────────────────────────

    const filteredPermissions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return permissions;

        return permissions.filter(
            (p) =>
                p.name.toLowerCase().includes(query) ||
                p.namespace.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query),
        );
    }, [permissions, searchQuery]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const markDirty = useCallback((roleId: number) => {
        setDirtyRoles((prev) => new Set(prev).add(roleId));
    }, []);

    const markClean = useCallback((roleId: number) => {
        setDirtyRoles((prev) => {
            const next = new Set(prev);
            next.delete(roleId);
            return next;
        });
    }, []);

    /** Toggle a single permission for a role. */
    const handlePermissionToggle = useCallback(
        (roleId: number, permissionId: number) => {
            setMatrix((prev) => ({
                ...prev,
                [roleId]: {
                    ...prev[roleId],
                    [permissionId]: !(prev[roleId]?.[permissionId] ?? false),
                },
            }));
            markDirty(roleId);
        },
        [markDirty],
    );

    /**
     * Toggle a group of permissions for a role.
     *
     * Bug fix: we only update the provided permissionIds; all other
     * permissions in the role's matrix are preserved. This prevents the
     * previous bug where filtering + "toggle all" would wipe non-filtered
     * permissions when saving.
     */
    const handleToggleGroup = useCallback(
        (roleId: number, permissionIds: number[], granted: boolean) => {
            setMatrix((prev) => ({
                ...prev,
                [roleId]: {
                    ...prev[roleId],
                    ...Object.fromEntries(permissionIds.map((id) => [id, granted])),
                },
            }));
            markDirty(roleId);
        },
        [markDirty],
    );

    /**
     * Save a single role's permissions.
     * Maps permission IDs to permission namespaces as required by the backend API.
     */
    const handleSaveRole = useCallback(
        async (roleId: number) => {
            const role = roles.find((r) => r.id === roleId);
            if (!role) return;

            setSavingRoles((prev) => new Set(prev).add(roleId));

            const roleMatrix = matrix[roleId] ?? {};
            const rolePermissionsPayload: Record<string, boolean> = {};

            // Backend requires permission namespaces as dictionary keys
            for (const permission of permissions) {
                rolePermissionsPayload[permission.namespace] = Boolean(roleMatrix[permission.id]);
            }

            const payload: Record<string, Record<string, boolean>> = {
                [role.namespace]: rolePermissionsPayload,
            };

            try {
                await usersApi.updateRoles(payload);
                markClean(roleId);
                toast.success(
                    t('{role} permissions saved successfully!', { role: role.name }),
                );
            } catch {
                toast.error(
                    t('An error occurred while updating {role} permissions', { role: role.name }),
                );
            } finally {
                setSavingRoles((prev) => {
                    const next = new Set(prev);
                    next.delete(roleId);
                    return next;
                });
            }
        },
        [roles, permissions, matrix, markClean, t],
    );

    /**
     * Reset a single role's permissions to the last saved server state.
     */
    const handleResetRole = useCallback(
        (roleId: number) => {
            const role = roles.find((r) => r.id === roleId);
            if (!role) return;

            const original = buildInitialMatrix([role]);
            setMatrix((prev) => ({
                ...prev,
                [roleId]: original[roleId] ?? {},
            }));
            markClean(roleId);
            toast.info(t('{role} permissions reset to saved state', { role: role.name }));
        },
        [roles, markClean, t],
    );

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* Bug fix #1: was t('Category Products') — wrong title */}
            <Head title={title || t('Permission Manager')} />

            <div className="flex h-full w-full flex-1 flex-col overflow-hidden p-2 sm:p-4">
                {/* Header */}
                <div className="flex-none">
                    <h1 className="text-2xl font-bold sm:text-3xl">{t('Permission Manager')}</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        {t('Manage permissions for each role independently')}
                    </p>
                </div>

                {/* Search */}
                <div className="mt-3 flex-none sm:mt-4">
                    <PermissionSearch onSearch={setSearchQuery} />
                </div>

                {/* Matrix — fills remaining height */}
                <div className="mt-3 min-h-0 flex-1 w-full overflow-hidden sm:mt-4">
                    <PermissionMatrix
                        permissions={filteredPermissions}
                        allPermissions={permissions}
                        roles={roles}
                        matrix={matrix}
                        selectedRoleId={selectedRoleId}
                        dirtyRoles={dirtyRoles}
                        savingRoles={savingRoles}
                        onSelectRole={setSelectedRoleId}
                        onPermissionToggle={handlePermissionToggle}
                        onToggleGroup={handleToggleGroup}
                        onSaveRole={handleSaveRole}
                        onResetRole={handleResetRole}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
