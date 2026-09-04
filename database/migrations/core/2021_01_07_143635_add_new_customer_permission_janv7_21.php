<?php

use App\Classes\Schema;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RolePermission;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Determine whether the migration
     * should execute when we're accessing
     * a multistore instance.
     */
    public function runOnMultiStore()
    {
        return false;
    }

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if ( ! Permission::namespace( 'subul.customers.manage-account' ) instanceof Permission ) {
            $permission = Permission::firstOrNew( [ 'namespace' => 'subul.customers.manage-account' ] );
            $permission->namespace = 'subul.customers.manage-account';
            $permission->name = __( 'Manage Customers Account' );
            $permission->description = __( 'Allow to manage customer virtual deposit account.' );
            $permission->save();
        }

        Role::namespace( 'admin' )->addPermissions( 'subul.customers.manage-account' );
        Role::namespace( 'subul.store.administrator' )->addPermissions( 'subul.customers.manage-account' );
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if ( Schema::hasTable( 'subul_permissions' ) ) {
            $permission = Permission::namespace( 'subul.customers.manage-account' );

            if ( $permission instanceof Permission ) {
                RolePermission::where( 'permission_id', $permission->id )->delete();
                $permission->delete();
            }
        }
    }
};
