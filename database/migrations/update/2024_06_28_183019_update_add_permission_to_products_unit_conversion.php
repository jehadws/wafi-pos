<?php

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permission = Permission::firstOrNew( [ 'namespace' => 'jgrem.convert.products-units' ] );
        $permission->name = __( 'Convert Products Units' );
        $permission->namespace = 'jgrem.convert.products-units';
        $permission->description = __( 'Let the user convert products' );
        $permission->save();

        Role::namespace( Role::ADMIN )->addPermissions( $permission );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permission = Permission::where( 'namespace', 'jgrem.convert.products-units' )->first();

        if ( $permission instanceof Permission ) {
            $permission->removeFromRoles();
            $permission->delete();
        }
    }
};
