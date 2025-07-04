<?php

use App\Models\Permission;
use App\Models\Role;
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
        $readHistory = Permission::withNamespaceOrNew( 'jgrem.read.cash-flow-history' );
        $readHistory->name = __( 'Read Cash Flow History' );
        $readHistory->namespace = 'jgrem.read.cash-flow-history';
        $readHistory->description = __( 'Allow to the Cash Flow History.' );
        $readHistory->save();

        $deleteHistory = Permission::withNamespaceOrNew( 'jgrem.delete.cash-flow-history' );
        $deleteHistory->name = __( 'Delete Expense History' );
        $deleteHistory->namespace = 'jgrem.delete.cash-flow-history';
        $deleteHistory->description = __( 'Allow to delete an expense history.' );
        $deleteHistory->save();

        Role::namespace( 'admin' )->addPermissions( [
            $readHistory,
            $deleteHistory,
        ] );

        Role::namespace( 'jgrem.store.administrator' )->addPermissions( [
            $readHistory,
            $deleteHistory,
        ] );
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
};
