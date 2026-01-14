'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/lib/i18n';
import type { Permission, PermissionMatrix, Role } from './types';

interface PermissionMatrixProps {
    permissions: Permission[];
    roles: Role[];
    matrix: PermissionMatrix;
    onPermissionToggle: (roleId: number, permissionId: number) => void;
}

export default function PermissionMatrixComponent({ permissions, roles, matrix, onPermissionToggle }: PermissionMatrixProps) {
    const { t } = useTranslation();
    const handleToggle = (roleId: number, permissionId: number) => {
        onPermissionToggle(roleId, permissionId);
    };

    const isPermissionGranted = (roleId: number, permissionId: number): boolean => {
        return matrix[roleId]?.[permissionId] || false;
    };

    return (
        <div className="flex h-full w-full flex-1 flex-col overflow-x-auto rounded-lg border">
            {/* Fixed Header with Roles */}
            <div className="border-b">
                <div className="flex">
                    {/* Empty space for permissions sidebar */}
                    <div className="flex w-64 max-w-64 min-w-64 items-center border-r p-4">
                        <div className="flex w-full items-center justify-between">
                            <h3 className="font-medium text-white">{t('Permissions')}</h3>
                            <div className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-600 text-xs">
                                {permissions.length}
                            </div>
                        </div>
                    </div>

                    {/* Roles Header */}
                    <div className="flex flex-1">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className="bg-muted/30 flex max-w-[150px] min-w-[150px] flex-1 flex-col items-center justify-center border-r p-4 text-center last:border-r-0"
                            >
                                <div className="mb-2 text-sm font-medium">{role.name}</div>
                                <Checkbox className="h-4 w-4" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex">
                {/* Permissions Sidebar */}
                <div className="w-64 max-w-64 min-w-64 border-r">
                    {permissions.map((permission) => (
                        <div
                            key={permission.id}
                            className="flex min-h-[57px] cursor-pointer items-center border-b p-2 text-sm transition-colors last:border-b-0"
                            title={permission.description}
                        >
                            {permission.name}
                        </div>
                    ))}
                </div>

                {/* Matrix Grid */}
                <div className="flex flex-1 flex-col">
                    {permissions.map((permission) => (
                        <div key={permission.id} className="hover:bg-muted/20 flex min-h-[57px] border-r border-b">
                            {roles.map((role) => (
                                <div
                                    key={`${role.id}-${permission.id}`}
                                    className="flex min-w-[150px] flex-1 items-center justify-center border-r p-4 last:border-r-0"
                                >
                                    <Checkbox
                                        checked={isPermissionGranted(role.id, permission.id)}
                                        onCheckedChange={() => handleToggle(role.id, permission.id)}
                                        className="h-5 w-5"
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
