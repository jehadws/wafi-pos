<?php

use App\Classes\Schema;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if ( Schema::hasTable( 'jgrem_registers_history' ) ) {
            Schema::table( 'jgrem_registers_history', function ( Blueprint $table ) {
                if ( ! Schema::hasColumn( 'jgrem_registers_history', 'transaction_account_id' ) ) {
                    $table->integer( 'transaction_account_id' )->nullable();
                }
            } );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if ( Schema::hasTable( 'jgrem_registers_history' ) ) {
            Schema::table( 'jgrem_registers_history', function ( Blueprint $table ) {
                $table->dropColumn( 'transaction_account_id' );
            } );
        }
    }
};
