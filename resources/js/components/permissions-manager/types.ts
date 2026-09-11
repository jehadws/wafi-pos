export type PermissionMatrix = {
  [roleId: number]: {
    [permissionId: number]: boolean;
  };
};

export function buildInitialMatrix(roles: RoleWithPermissions[]): PermissionMatrix {
  const initialMatrix: PermissionMatrix = {};
  roles.forEach((role) => {
    initialMatrix[role.id] = {};
    if (Array.isArray(role.permissions)) {
      role.permissions.forEach((perm: any) => {
        const id = typeof perm === 'object' && perm !== null ? perm.id : perm;
        if (typeof id === 'number' || typeof id === 'string') {
          initialMatrix[role.id][Number(id)] = true;
        }
      });
    }
  });
  return initialMatrix;
}
