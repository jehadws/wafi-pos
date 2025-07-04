<?php

use App\Classes\Schema;
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
        if ( Schema::hasTable( 'jgrem_expenses' ) ) {
            Schema::rename( 'jgrem_expenses', 'jgrem_transactions' );
        }

        if ( Schema::hasTable( 'jgrem_expenses_categories' ) ) {
            Schema::rename( 'jgrem_expenses_categories', 'jgrem_transactions_accounts' );
        }

        if ( Schema::hasTable( 'jgrem_cash_flow' ) ) {
            Schema::rename( 'jgrem_cash_flow', 'jgrem_transactions_histories' );
        }

        include_once base_path() . '/database/permissions/transactions-accounts.php';

        $admin = Role::namespace( Role::ADMIN );
        $storeAdmin = Role::namespace( Role::STOREADMIN );

        $admin->addPermissions( Permission::includes( '.transactions-account' )->get()->map( fn( $permission ) => $permission->namespace ) );
        $storeAdmin->addPermissions( Permission::includes( '.transactions-account' )->get()->map( fn( $permission ) => $permission->namespace ) );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
