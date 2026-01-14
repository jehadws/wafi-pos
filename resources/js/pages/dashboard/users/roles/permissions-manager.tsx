import PermissionMatrixComponent from '@/components/permissions-manager/permission-matrix';
import PermissionSearch from '@/components/permissions-manager/permission-search';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useTranslation } from '@/lib/i18n';
import { Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PermissionManagerProps {
    permissions: Permission[];
    roles: RoleWithPermissions[];
}

const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Roles'), href: '/dashboard/roles' },
];

type PermissionMatrix = {
    [roleId: number]: {
        [permissionId: number]: boolean;
    };
};

export default function PermissionManager() {
    const { title, permissions, roles } = usePage<PermissionManagerProps>().props;
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [matrix, setMatrix] = useState<PermissionMatrix>(() => {
        // Initialize matrix from roles data
        const initialMatrix: PermissionMatrix = {};
        roles.forEach((role) => {
            initialMatrix[role.id] = {};
            role.permissions.forEach((permissionId) => {
                initialMatrix[role.id][permissionId] = true;
            });
        });
        return initialMatrix;
    });

    const onSave = (matrix: PermissionMatrix) => {
        console.log('Saving permission matrix:', matrix);

        // Convert matrix back to roles format
        const updatedRoles = roles.map((role) => ({
            ...role,
            permissions: Object.entries(matrix[role.id] || {})
                .filter(([_, granted]) => granted)
                .map(([permissionId]) => Number.parseInt(permissionId)),
        }));

        console.log('Updated roles:', updatedRoles);

        // Here you would typically send this to your API
        // await updateRolePermissions(updatedRoles)
    };

    // Filter permissions based on search query
    const filteredPermissions = useMemo(() => {
        if (!searchQuery.trim()) return permissions;

        const query = searchQuery.toLowerCase();
        return permissions.filter(
            (permission) =>
                permission.name.toLowerCase().includes(query) ||
                permission.namespace.toLowerCase().includes(query) ||
                permission.description.toLowerCase().includes(query),
        );
    }, [permissions, searchQuery]);

    const handlePermissionToggle = (roleId: number, permissionId: number) => {
        setMatrix((prev) => ({
            ...prev,
            [roleId]: {
                ...prev[roleId],
                [permissionId]: !prev[roleId]?.[permissionId],
            },
        }));
    };

    const handleSave = () => {
        onSave?.(matrix);
        toast.success(t('Permissions updated successfully!'));
    };

    const handleReset = () => {
        // Reset to original state
        const resetMatrix: PermissionMatrix = {};
        roles.forEach((role) => {
            resetMatrix[role.id] = {};
            role.permissions.forEach((permissionId) => {
                resetMatrix[role.id][permissionId] = true;
            });
        });
        setMatrix(resetMatrix);
        toast.info(t('Permissions reset to original state'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title || t('Category Products')} />
            <div className="flex h-full w-full flex-1 overflow-x-hidden p-4">
                <div className="flex h-full flex-col space-y-6">
                    {/* Header */}
                    <div className="flex-none">
                        <h1 className="text-3xl font-bold">{t('Permission Manager')}</h1>
                        <p className="text-muted-foreground mt-1">{t('Manage all permissions and roles')}</p>
                    </div>

                    {/* Search */}
                    <div className="flex-none">
                        <PermissionSearch onSearch={setSearchQuery} />
                    </div>

                    {/* Matrix - takes remaining space */}
                    <div className="min-h-0 w-full max-w-7xl">
                        <PermissionMatrixComponent
                            permissions={filteredPermissions}
                            roles={roles}
                            matrix={matrix}
                            onPermissionToggle={handlePermissionToggle}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-none items-center justify-between pt-4">
                        <div className="text-muted-foreground text-sm">
                            {t('Showing {filteredPermissions.length} of {permissions.length} permissions', {
                                filteredPermissions: filteredPermissions.length,
                                permissions: permissions.length,
                            })}
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" onClick={handleReset}>
                                {t('Reset')}
                            </Button>
                            <Button onClick={handleSave}>{t('Save Changes')}</Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
